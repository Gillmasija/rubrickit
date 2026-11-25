import {load,save,clear,KEY} from './store.js';
import {summarize,LEVELS,upsertCriterion,removeCriterion,moveCriterion,parseBackup,MAX_BACKUP_BYTES} from './model.js';
import {demo} from './demo.js';
const page = document.body.dataset.page;
document.querySelector(`[data-nav="${page}"]`).setAttribute('aria-current','page');
const app = document.querySelector('#app');
let workspace;
try { workspace = load(localStorage); } catch { workspace = load({getItem(){throw new Error('Storage blocked.');}}); }
function escape(value) { return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
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
function scoreSummary(state=workspace.state) {
  const s=summarize(state);
  return `<section class="panel green"><p class="eyebrow" style="color:inherit">${s.complete?'WEIGHTED RESULT':'SCORING PROGRESS'}</p><div class="big-number">${s.complete?s.total.toFixed(1):s.scored}<span>${s.complete?'/ 100':`/ ${state.criteria.length} scored`}</span></div><p>${s.complete?'Every criterion has a score.':s.ready?'Finish all criteria to see the total.':'Balance your rubric to 100% before scoring.'}</p><p class="muted help">Result = sum of weight × level ÷ 3. Totals round to one decimal.</p></section>`;
}
function renderScore() {
  const state=workspace.state,s=summarize(state);
  if(!s.ready) {app.innerHTML=`<section class="panel"><h2>A balanced rubric comes first</h2><p>You have ${state.criteria.length} criteria with a total weight of ${s.weight}%. Add criteria and make the weights total exactly 100% to begin.</p><a class="button" href="index.html">Build your rubric</a></section>`;return;}
  app.innerHTML=`<div class="layout"><section class="panel"><h2>${escape(state.title)}</h2><p class="muted report-text">${escape(state.description)}</p><form id="score-form"><div class="field"><label for="sample-label">Anonymous sample label <span>· optional</span></label><input id="sample-label" name="label" maxlength="100" value="${escape(state.sample.label)}" placeholder="e.g. Practice pitch A"><p class="help">Use a sample code, not a learner’s name or sensitive information.</p></div>
    ${state.criteria.map(c=>`<fieldset class="score-card"><legend>${escape(c.name)} <span class="badge">${c.weight}%</span></legend><p class="muted">${escape(c.detail)||'No expectation added.'}</p><div class="field"><label for="score-${c.id}">Performance level</label><select id="score-${c.id}" name="score-${c.id}"><option value="">Not scored</option>${LEVELS.map((name,i)=>`<option value="${i}" ${state.sample.scores[c.id]===i?'selected':''}>${i} — ${name}</option>`).join('')}</select></div><div class="field"><label for="feedback-${c.id}">Evidence & feedback <span>· optional</span></label><textarea id="feedback-${c.id}" name="feedback-${c.id}" maxlength="600" placeholder="What did you notice? What would improve this work?">${escape(state.sample.feedback[c.id]||'')}</textarea></div></fieldset>`).join('')}
    <div class="field"><label for="next-step">One next step <span>· optional</span></label><textarea id="next-step" name="nextStep" maxlength="1000">${escape(state.sample.nextStep)}</textarea></div><div class="actions"><button>Save sample</button><a href="report.html" class="button secondary">View feedback</a></div><p class="help">Save before opening feedback. Partial scores can be saved.</p></form></section><aside><div id="score-summary">${scoreSummary()}</div><section class="panel"><h2>Feedback that helps</h2><p class="muted">Name the evidence you saw. Connect it to the expectation. Suggest one manageable improvement.</p><p class="help">This is a transparent scoring aid, not an automatic grading decision.</p></section></aside></div>`;
  const readSample=()=>{
    const data=new FormData(document.querySelector('#score-form')),next=structuredClone(state);
    next.sample={label:data.get('label'),scores:{},feedback:{},nextStep:data.get('nextStep')};
    for(const c of state.criteria) { const value=data.get(`score-${c.id}`);if(value!=='')next.sample.scores[c.id]=Number(value);next.sample.feedback[c.id]=data.get(`feedback-${c.id}`); }
    return next;
  };
  document.querySelector('#score-form').onchange=()=>{document.querySelector('#score-summary').innerHTML=scoreSummary(readSample())+'<p class="help">Preview of form values. Save to update feedback.</p>';};
  document.querySelector('#score-form').onsubmit=e=>{e.preventDefault();persist(readSample(),'Sample saved. Your feedback sheet is up to date.');};
}
function renderReport() {
  const state=workspace.state,s=summarize(state);
  if(!state.criteria.length) {app.innerHTML='<section class="panel"><h2>No feedback sheet yet</h2><p>Create a rubric, then score a sample to prepare useful feedback.</p><a class="button" href="index.html">Build your rubric</a></section>';return;}
  app.innerHTML=`<div class="layout"><article class="panel report"><p class="eyebrow">RUBRICKIT · FEEDBACK SHEET</p><h2>${escape(state.title)}</h2><p class="report-text muted">${escape(state.description)}</p><p><strong>Sample:</strong> ${escape(state.sample.label)||'Unlabelled sample'}</p><p class="print-result"><strong>${s.complete?`${s.total.toFixed(1)} / 100`:'Incomplete — no total yet'}</strong></p>
  ${!s.ready?'<p class="alert">Rubric weights do not total 100%. Correct the rubric before using this assessment.</p>':!s.complete?`<p class="alert">${state.criteria.length-s.scored} criteria still need a score. This is a partial feedback sheet.</p>`:''}
  ${state.criteria.map(c=>{const scored=Object.hasOwn(state.sample.scores,c.id),level=state.sample.scores[c.id];return `<section class="criterion"><div class="criterion-head"><h3>${escape(c.name)}</h3><span class="badge">${c.weight}% weight</span></div><p class="muted report-text">${escape(c.detail)||'No expectation added.'}</p><p class="contribution">${scored?`${level} — ${LEVELS[level]} · ${(c.weight*level/3).toFixed(1)} of ${c.weight} points`:'Not scored'}</p><p class="report-text">${escape(state.sample.feedback[c.id])||'No feedback recorded.'}</p></section>`;}).join('')}
  <section class="next-step"><h3>One next step</h3><p class="report-text">${escape(state.sample.nextStep)||'No next step recorded yet.'}</p></section><p class="help">Weighted points = criterion weight × level ÷ 3. Individual contributions and the total round separately to one decimal; rounded contributions may not add exactly to the displayed total. No grade band is assigned.</p></article>
  <aside>${scoreSummary()}<section class="panel"><h2>Ready to share?</h2><p class="muted">Check the evidence and next step, then print or save as PDF using your browser.</p><div class="actions"><button id="print">Print feedback</button><a href="score.html" class="button secondary">Edit sample</a></div><p class="help">The sheet uses saved values only.</p></section></aside></div>`;
  document.querySelector('#print').onclick=()=>window.print();
}
function download(text,name) {
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),anchor=document.createElement('a');
  anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderTools() {
  document.querySelector('#tools').innerHTML=`<details ${workspace.error?'open':''}><summary>Backup & recovery</summary><p class="help">One rubric and one sample are stored in this browser. Clearing browser data removes them. Export a backup to keep a copy. Imports replace the whole workspace.</p><div class="actions"><button class="secondary" id="export" ${workspace.error?'disabled':''}>Export saved backup</button><button class="secondary" id="demo">Load synthetic demo</button><button class="subtle danger" id="reset">Clear workspace</button></div><div class="field file-control"><label for="import">Restore JSON backup <span>· up to 100 KB</span></label><input id="import" type="file" accept=".json,application/json"></div>${workspace.error?'<p class="alert">Existing data has been left untouched. Download the unreadable data before clearing this workspace.</p><button id="raw" class="secondary">Download unreadable data</button>':''}</details>`;
  document.querySelector('#export').onclick=()=>{download(JSON.stringify(workspace.state,null,2),'rubrickit-backup.json');notice('Saved workspace exported. Unsaved form values are not included.');};
  document.querySelector('#demo').onclick=()=>{if(confirm('Replace the saved rubric and sample with synthetic practice data? Export a backup first if you want to keep your work.'))persist(demo(),'Synthetic demo loaded. Explore the rubric, score, and feedback pages.');};
  document.querySelector('#reset').onclick=()=>{
    try {
      // Capture before confirmation; clear still compares to catch intervening writes.
      const expected=workspace.error?localStorage.getItem(KEY):workspace.raw;
      if(confirm('Permanently clear this browser workspace? Export a backup first to keep a copy.')){workspace=clear(localStorage,expected);render();notice('Workspace cleared. Start a fresh rubric.');}
    } catch(error){notice(error.message,true);}
  };
  document.querySelector('#raw')?.addEventListener('click',()=>{
    try{download(localStorage.getItem(KEY)||'','rubrickit-unreadable.json');}catch(error){notice(`Cannot access storage: ${error.message}`,true);}
  });
  document.querySelector('#import').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    const revision=workspace.raw;e.target.disabled=true;notice('Reading and validating backup…');
    try {
      if(file.size>MAX_BACKUP_BYTES)throw new Error('Backup exceeds 100 KB.');
      const state=parseBackup(await file.text());
      if(workspace.raw!==revision)throw new Error('Workspace changed while reading. Select the file again.');
      if(confirm(`Replace your workspace with “${state.title}” (${state.criteria.length} criteria)?`))persist(state,'Backup restored.');
      else notice('Restore cancelled. Saved work was not changed.');
    }catch(error){notice(error.message,true);}finally{e.target.disabled=false;e.target.value='';}
  };
}
function render() { if(page==='rubric') renderRubric(); else if(page==='score') renderScore(); else renderReport(); renderTools(); }
render();
if (workspace.error) notice(workspace.error,true);
