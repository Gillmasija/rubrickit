export const LEVELS = ['Not yet', 'Developing', 'Secure', 'Accomplished'];
export const MAX_BACKUP_BYTES = 100000;
export function emptyState() {
  return {version:1, title:'Untitled rubric', description:'', criteria:[], sample:{label:'', scores:{}, feedback:{}, nextStep:''}};
}
function string(value, limit, name, required = false) {
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) throw new Error(`${name} must be ${required ? 'non-empty and ' : ''}at most ${limit} characters.`);
  return value.trim();
}
function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
export function validate(input) {
  if (!record(input) || input.version !== 1 || !Array.isArray(input.criteria) || input.criteria.length > 12 || !record(input.sample)) throw new Error('Not a supported RubricKit v1 backup (maximum 12 criteria).');
  const result = emptyState();
  result.title = string(input.title, 100, 'Rubric title', true);
  result.description = string(input.description, 600, 'Assignment brief');
  const ids = new Set();
  result.criteria = input.criteria.map(c => {
    if (!record(c) || typeof c.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(c.id) || Object.hasOwn(Object.prototype,c.id) || ids.has(c.id)) throw new Error('Criterion IDs must be unique and valid.');
    ids.add(c.id);
    if (!Number.isInteger(c.weight) || c.weight < 1 || c.weight > 100) throw new Error('Each weight must be a whole number from 1 to 100.');
    return {id:c.id, name:string(c.name,80,'Criterion name',true), detail:string(c.detail,400,'Criterion expectation'), weight:c.weight};
  });
  const sample = input.sample;
  if (!record(sample.scores) || !record(sample.feedback)) throw new Error('Sample scores and feedback must be objects.');
  result.sample.label = string(sample.label,100,'Sample label');
  result.sample.nextStep = string(sample.nextStep,1000,'Next step');
  for (const [id, score] of Object.entries(sample.scores)) {
    if (!ids.has(id) || !Number.isInteger(score) || score < 0 || score > 3) throw new Error('Scores must reference a criterion and use a whole level from 0 to 3.');
    Object.defineProperty(result.sample.scores,id,{value:score,enumerable:true,writable:true,configurable:true});
  }
  for (const [id, feedback] of Object.entries(sample.feedback)) {
    if (!ids.has(id)) throw new Error('Feedback must reference an existing criterion.');
    Object.defineProperty(result.sample.feedback,id,{value:string(feedback,600,'Feedback'),enumerable:true,writable:true,configurable:true});
  }
  return result;
}
export function summarize(state) {
  const weight = state.criteria.reduce((sum,c) => sum + c.weight, 0);
  const scored = state.criteria.filter(c => Object.hasOwn(state.sample.scores,c.id)).length;
  const ready = state.criteria.length > 0 && weight === 100;
  const complete = ready && scored === state.criteria.length;
  const total = complete ? state.criteria.reduce((sum,c) => sum + c.weight * state.sample.scores[c.id] / 3, 0) : null;
  return {weight,scored,ready,complete,total};
}
export function upsertCriterion(state, criterion) {
  const next = structuredClone(state);
  const index = next.criteria.findIndex(c => c.id === criterion.id);
  if (index < 0) next.criteria.push(criterion);
  else {
    if (JSON.stringify(next.criteria[index]) !== JSON.stringify(criterion)) {
      delete next.sample.scores[criterion.id]; delete next.sample.feedback[criterion.id];
    }
    next.criteria[index] = criterion;
  }
  return validate(next);
}
export function removeCriterion(state,id) {
  const next = structuredClone(state);
  next.criteria = next.criteria.filter(c => c.id !== id);
  delete next.sample.scores[id]; delete next.sample.feedback[id];
  return validate(next);
}
export function moveCriterion(state,id,direction) {
  const next = structuredClone(state);
  const index = next.criteria.findIndex(c => c.id === id), target = index + direction;
  if (index >= 0 && target >= 0 && target < next.criteria.length && Math.abs(direction) === 1) [next.criteria[index], next.criteria[target]] = [next.criteria[target], next.criteria[index]];
  return validate(next);
}
export function parseBackup(text) {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error('Backup exceeds 100 KB.');
  try { return validate(JSON.parse(text)); } catch (error) { throw new Error(`Cannot import backup: ${error.message}`); }
}
