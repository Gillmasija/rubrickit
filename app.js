import {load,save} from './store.js';
import {summarize,LEVELS} from './model.js';
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
function render() {
  app.innerHTML = `<div class="layout"><section class="panel"><h2>Your workspace</h2><p class="empty">Your rubric starts here. Add criteria to make expectations clear.</p></section><aside>${summary()}<section class="panel"><h2>One consistent scale</h2>${scale()}<p class="help">Each level earns its share of a criterion’s weight.</p></section></aside></div>`;
}
render();
if (workspace.error) notice(workspace.error,true);
