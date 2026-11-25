import {load,save} from './store.js';
import {summarize,LEVELS,upsertCriterion,removeCriterion,moveCriterion} from './model.js';
const page = document.body.dataset.page;
document.querySelector(`[data-nav="${page}"]`).setAttribute('aria-current','page');
const app = document.querySelector('#app');
let workspace;
try { workspace = load(localStorage); } catch { workspace = load({getItem(){throw new Error('Storage blocked.');}}); }
function escape(value) { return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function notice(message,error=false) {
  const el=document.querySelector('#notice'); el.hidden=false; el.textContent=message; el.className=error?'':'success'; el.setAttribute('role',error?'alert':'status');
}
function persist(state,message) {
  try {
    if (workspace.error) throw new Error('Resolve the saved-work error in Backup & recovery before saving.');
    workspace=save(localStorage,state,workspace.raw); render(); notice(message); return true;
  } catch (error) { notice(error.message,true); return false; }
}
function scale() { return `<ul class="scale">${LEVELS.map((name,i)=>`<li><b>${i}</b><span>${name}</span></li>`).join('')}</ul>`; }
function summary() {
  const s=summarize(workspace.state);
  return `<section class="panel green"><p class="eyebrow" style="color:inherit">WEIGHT CHECK</p><div class="big-number">${s.weight}<span>/ 100%</span></div><div class="meter"><div style="width:${Math.min(s.weight,100)}%"></div></div><p>${s.ready?'Ready to score.':s.weight>100?`Remove ${s.weight-100}% to balance your rubric.`:`Assign ${100-s.weight}% more to balance your rubric.`}</p><span class="badge">${workspace.state.criteria.length} of 12 criteria</span></section>`;
}
function renderPlaceholder() {
  app.innerHTML = `<div class="layout"><section class="panel"><h2>Your workspace</h2><p class="empty">Your rubric starts here. Add criteria to make expectations clear.</p></section><aside>${summary()}<section class="panel"><h2>One consistent scale</h2>${scale()}<p class="help">Each level earns its share of a criterion’s weight.</p></section></aside></div>`;
}
function renderRubric() {
  const state=workspace.state;
  app.innerHTML=`<div class="layout"><div>
    <section class="panel"><div class="section-head"><h2>The assignment</h2><span class="badge">Rubric builder</span></div>
    <form id="assignment"><div class="field"><label for="title">Rubric title</label><input id="title" name="title" maxlength="100" required value="${escape(state.title)}"></div>
    <div class="field"><label for="description">Assignment brief <span>· optional</span></label><textarea id="description" name="description" maxlength="600" placeholder="What will learners create or demonstrate?">${escape(state.description)}</textarea></div><button>Save assignment</button></form></section>
    <section class="panel"><div class="section-head"><h2>Assessment criteria</h2><span class="badge">${state.criteria.length} criteria</span></div><p class="help">Weights must add up to 100%. Editing a criterion clears its previous score and feedback.</p>
    <div id="criteria">${state.criteria.length?state.criteria.map((c,i)=>`<article class="criterion"><div class="criterion-head"><h3>${escape(c.name)}</h3><span class="badge">${c.weight}%</span></div><p class="muted">${escape(c.detail)||'No expectation added.'}</p><div class="actions"><button class="secondary" data-edit="${c.id}">Edit<span class="sr-only"> ${escape(c.name)}</span></button><button class="subtle" data-up="${c.id}" ${i===0?'disabled':''} aria-label="Move ${escape(c.name)} up">Move up</button><button class="subtle" data-down="${c.id}" ${i===state.criteria.length-1?'disabled':''} aria-label="Move ${escape(c.name)} down">Move down</button><button class="subtle danger" data-delete="${c.id}" aria-label="Remove ${escape(c.name)}">Remove</button></div></article>`).join(''):'<div class="empty"><h3>What does good work look like?</h3><p>Add your first criterion below, or try the sample rubric in workspace tools.</p></div>'}</div></section>
    <section class="panel" id="editor"><h2 id="editor-title">Add a criterion</h2><form id="criterion-form"><input type="hidden" name="id"><div class="field-row"><div class="field"><label for="criterion-name">Criterion name</label><input id="criterion-name" name="name" maxlength="80" required placeholder="e.g. Evidence & reasoning"></div><div class="field"><label for="weight">Weight (%)</label><input id="weight" name="weight" type="number" min="1" max="100" step="1" required placeholder="40"></div></div><div class="field"><label for="detail">Expectation <span>· optional</span></label><textarea id="detail" name="detail" maxlength="400" placeholder="Describe the evidence you are looking for."></textarea></div><div class="actions"><button id="criterion-submit">Add criterion</button><button type="button" class="secondary" id="cancel-edit" hidden>Cancel edit</button></div></form></section>
    </div><aside>${summary()}<section class="panel"><h2>One consistent scale</h2>${scale()}<p class="help">0 = no evidence yet. 3 = the expectation is fully met. Describe the expectation for each criterion.</p><a class="button secondary" href="score.html">Score a sample</a></section><p class="help">Save each form before switching pages. Work stays in this browser.</p></aside></div>`;
  document.querySelector('#assignment').onsubmit=e=>{
    e.preventDefault(); const data=new FormData(e.currentTarget);
    persist({...state,title:data.get('title'),description:data.get('description')},'Assignment saved on this device.');
  };
  document.querySelector('#criterion-form').onsubmit=e=>{
    e.preventDefault(); const data=new FormData(e.currentTarget);
    try {
      const criterion={id:data.get('id')||crypto.randomUUID(),name:data.get('name'),weight:Number(data.get('weight')),detail:data.get('detail')};
      if(persist(upsertCriterion(state,criterion),'Criterion saved. Check your weights before scoring.')) document.querySelector('#criterion-name').focus();
    } catch(error) {notice(error.message,true);}
  };
  document.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>{
    const c=state.criteria.find(c=>c.id===button.dataset.edit), form=document.querySelector('#criterion-form');
    for(const key of ['id','name','weight','detail']) form.elements.namedItem(key).value=c[key];
    document.querySelector('#editor-title').textContent='Edit criterion';document.querySelector('#criterion-submit').textContent='Save criterion';document.querySelector('#cancel-edit').hidden=false;form.elements.namedItem('name').focus();
  });
  document.querySelector('#cancel-edit').onclick=()=>render();
  document.querySelectorAll('[data-delete]').forEach(button=>button.onclick=()=>{
    if(confirm('Remove this criterion and its sample score and feedback?')) persist(removeCriterion(state,button.dataset.delete),'Criterion removed.');
  });
  for(const [action,direction] of [['up',-1],['down',1]]) document.querySelectorAll(`[data-${action}]`).forEach(button=>button.onclick=()=>persist(moveCriterion(state,button.dataset[action],direction),'Criterion order saved.'));
}
function render() { if(page==='rubric') renderRubric(); else renderPlaceholder(); }
render();
if (workspace.error) notice(workspace.error,true);
