import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,validate,summarize,upsertCriterion,removeCriterion,moveCriterion,parseBackup} from '../model.js';
import {demo} from '../demo.js';
const criterion = (id, weight) => ({id,name:id,detail:'Use evidence.',weight});
function fixture() { let s = emptyState(); s.criteria = [criterion('a',40),criterion('b',60)]; return s; }
test('empty, invalid-weight and missing score states have no total', () => {
  assert.equal(summarize(emptyState()).total,null);
  const s = fixture(); s.sample.scores.a = 3;
  assert.equal(summarize(s).total,null);
  s.sample.scores.b = 0; s.criteria[1].weight = 59;
  assert.equal(summarize(s).total,null);
});
test('zero is a real score and weighted contributions are accurate', () => {
  const s = fixture(); s.sample.scores = {a:3,b:0};
  assert.equal(summarize(s).total,40);
  s.sample.scores.b = 2; assert.equal(summarize(s).total,80);
  s.sample.scores.a = 0; s.sample.scores.b = 0; assert.equal(summarize(s).total,0);
});
test('edits invalidate affected scores only; reorder preserves scores', () => {
  const s = fixture(); s.sample.scores = {a:3,b:2}; s.sample.feedback.a = 'Evidence';
  assert.equal(moveCriterion(s,'a',1).sample.scores.a,3);
  const next = upsertCriterion(s,{...s.criteria[0],name:'Changed'});
  assert.equal(next.sample.scores.a,undefined); assert.equal(next.sample.scores.b,2);
  assert.equal(next.sample.feedback.a,undefined); assert.equal(s.sample.scores.a,3);
  assert.equal(removeCriterion(s,'a').sample.scores.a,undefined);
});
test('strict validation rejects ambiguous or out-of-bounds input', () => {
  for (const mutate of [s=>s.criteria[0].weight=1.5,s=>s.criteria[0].weight=0,s=>s.criteria[0].name='',s=>s.criteria[1].id='a',s=>s.sample.scores.a='3',s=>s.sample.scores.unknown=2,s=>s.sample.scores.a=4,s=>s.sample.feedback.a='x'.repeat(601),s=>s.version=2,s=>s.criteria=Array(13).fill(criterion('a',10))]) {
    const s = fixture(); mutate(s); assert.throws(()=>validate(s));
  }
});
test('backup round trips and rejects malformed, oversized and orphaned feedback', () => {
  const s = fixture(); assert.deepEqual(parseBackup(JSON.stringify(s)),s);
  assert.throws(()=>parseBackup('{')); assert.throws(()=>parseBackup(' '.repeat(100001)));
  s.sample.feedback.other = 'bad'; assert.throws(()=>validate(s));
});
test('synthetic demo has a verified 63.3 percent weighted total',()=>{
  const state=validate(demo()); assert.equal(summarize(state).total.toFixed(1),'63.3');
});
