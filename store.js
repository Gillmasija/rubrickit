import {emptyState,parseBackup,validate} from './model.js';
export const KEY = 'rubrickit.v1';
export function load(storage) {
  try {
    const raw = storage.getItem(KEY);
    return {state:raw === null ? emptyState() : parseBackup(raw),raw,error:null};
  } catch (error) { return {state:emptyState(),raw:null,error:`Saved work could not be read. ${error.message}`}; }
}
export function save(storage,state,expected) {
  const normalized = validate(state);
  let current;
  try { current = storage.getItem(KEY); } catch { throw new Error('Browser storage is unavailable. Your changes were not saved.'); }
  if (current !== expected) throw new Error('Another tab changed this workspace. Reload before editing; your changes were not saved.');
  const raw = JSON.stringify(normalized);
  try { storage.setItem(KEY,raw); } catch { throw new Error('Browser storage is full or unavailable. Your changes were not saved.'); }
  return {state:normalized,raw,error:null};
}
export function clear(storage,expected) {
  if (storage.getItem(KEY) !== expected) throw new Error('Another tab changed this workspace. Reload before clearing.');
  storage.removeItem(KEY);
  return {state:emptyState(),raw:null,error:null};
}
