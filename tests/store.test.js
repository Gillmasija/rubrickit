import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load,save,clear,KEY} from '../store.js';
import {emptyState} from '../model.js';
function memory(initial=null) { let value=initial; return {getItem:()=>value,setItem:(key,v)=>{assert.equal(key,KEY);value=v;},removeItem:()=>{value=null;}}; }
test('round trip and clear preserve the expected revision', () => {
  const storage=memory(), first=load(storage); assert.equal(first.error,null);
  const saved=save(storage,{...first.state,title:'Pitch'},first.raw);
  assert.equal(load(storage).state.title,'Pitch');
  assert.equal(clear(storage,saved.raw).raw,null);
});
test('stale saves and clears cannot overwrite a newer revision', () => {
  const storage=memory(); save(storage,emptyState(),null);
  assert.throws(()=>save(storage,{...emptyState(),title:'Stale'},null),/Another tab/);
  assert.throws(()=>clear(storage,null),/Another tab/);
  assert.equal(load(storage).state.title,'Untitled rubric');
});
test('corrupt and unavailable storage is reported and never silently overwritten', () => {
  const storage=memory('{'); assert.match(load(storage).error,/could not be read/);
  assert.throws(()=>save(storage,emptyState(),null),/Another tab/);
  const denied={getItem:()=>{throw new Error('denied');}};
  assert.match(load(denied).error,/could not be read/);
  assert.throws(()=>save(denied,emptyState(),null),/unavailable/);
  assert.throws(()=>save({...memory(),setItem:()=>{throw new Error('quota');}},emptyState(),null),/full/);
});
