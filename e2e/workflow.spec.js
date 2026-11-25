import {test,expect} from '@playwright/test';
import {demo} from '../demo.js';
async function seed(page) {await page.goto('/');await page.evaluate(state=>localStorage.setItem('rubrickit.v1',JSON.stringify(state)),demo());await page.reload();}
test('build a rubric, score zero honestly, persist and print feedback',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Rubric title').fill('Short presentation');
  await page.getByRole('button',{name:'Save assignment'}).click();
  await page.getByLabel('Criterion name').fill('Reasoning');await page.getByLabel('Weight (%)').fill('100');
  await page.getByRole('button',{name:'Add criterion',exact:true}).click();
  await page.getByRole('navigation').getByRole('link',{name:'Score a sample'}).click();
  await page.getByLabel('Performance level').selectOption('0');
  await page.getByLabel('Evidence & feedback').fill('No supporting evidence yet.');
  await page.getByRole('button',{name:'Save sample'}).click();await page.reload();
  await expect(page.getByLabel('Performance level')).toHaveValue('0');
  await page.getByRole('link',{name:'View feedback'}).click();
  await expect(page.locator('.big-number')).toContainText('0.0');
  await expect(page.locator('.report')).toContainText('No supporting evidence yet.');
  await page.evaluate(()=>{window.print=()=>document.body.dataset.printCalled='yes';});
  await page.getByRole('button',{name:'Print feedback'}).click();await expect(page.locator('body')).toHaveAttribute('data-print-called','yes');
  await page.emulateMedia({media:'print'});await expect(page.locator('nav')).toBeHidden();await expect(page.locator('.print-result')).toBeVisible();
});
test('criterion edits invalidate affected scores; incomplete report stays explicit',async({page})=>{
  await seed(page);await page.getByRole('button',{name:'Edit Evidence & reasoning',exact:true}).click();
  await page.getByLabel('Criterion name').fill('Better reasoning');await page.getByRole('button',{name:'Save criterion',exact:true}).click();
  await page.getByRole('link',{name:'Feedback',exact:true}).click();
  await expect(page.locator('.report')).toContainText('1 criteria still need a score');await expect(page.locator('.report')).toContainText('Not scored');
  await expect(page.locator('.report')).not.toContainText('undefined');
});
test('reordering retains scores and deletion requires confirmation',async({page})=>{
  await seed(page);await page.getByRole('button',{name:'Move Evidence & reasoning down'}).click();
  await expect(page.locator('#criteria h3').first()).toHaveText('Practical planning');
  page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Remove Practical planning',exact:true}).click();
  await expect(page.locator('#criteria h3')).toHaveCount(3);
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Remove Practical planning',exact:true}).click();
  await expect(page.locator('#criteria h3')).toHaveCount(2);
  await page.goto('/score.html');await expect(page.getByRole('heading',{name:'A balanced rubric comes first'})).toBeVisible();
});
test('demo, export and validated restore preserve data; malformed import does not',async({page})=>{
  await page.goto('/');await page.getByText('Backup & recovery',{exact:true}).click();
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Load synthetic demo'}).click();
  await page.getByText('Backup & recovery',{exact:true}).click();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved backup'}).click();
  expect((await downloaded).suggestedFilename()).toBe('rubrickit-backup.json');
  await page.getByLabel('Restore JSON backup').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{')});
  await expect(page.locator('#notice')).toContainText('Cannot import backup');await expect(page.getByLabel('Rubric title')).toHaveValue('Community garden pitch');
  const state=demo();state.title='Restored pitch';
  page.once('dialog',d=>d.accept());await page.getByLabel('Restore JSON backup').setInputFiles({name:'good.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
  await expect(page.getByLabel('Rubric title')).toHaveValue('Restored pitch');await page.reload();await expect(page.getByLabel('Rubric title')).toHaveValue('Restored pitch');
});
test('stale tab cannot overwrite a newer save',async({page,context})=>{
  await seed(page);const other=await context.newPage();await other.goto('/');
  await page.getByLabel('Rubric title').fill('New revision');await page.getByRole('button',{name:'Save assignment'}).click();
  await other.getByLabel('Rubric title').fill('Stale revision');await other.getByRole('button',{name:'Save assignment'}).click();
  await expect(other.locator('#notice')).toContainText('Another tab');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('rubrickit.v1')).title)).toBe('New revision');
});
test('corrupt data is preserved until confirmed reset',async({page})=>{
  await page.goto('/');await page.evaluate(()=>localStorage.setItem('rubrickit.v1','{broken'));await page.reload();
  await expect(page.locator('#notice')).toContainText('could not be read');
  expect(await page.evaluate(()=>localStorage.getItem('rubrickit.v1'))).toBe('{broken');
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Clear workspace'}).click();
  expect(await page.evaluate(()=>localStorage.getItem('rubrickit.v1'))).toBe(null);
});
test('unsaved navigation can be cancelled',async({page})=>{
  await page.goto('/');await page.getByLabel('Rubric title').fill('Unsaved');
  page.once('dialog',d=>d.dismiss());await page.getByRole('link',{name:'Feedback',exact:true}).click();
  await expect(page.getByLabel('Rubric title')).toHaveValue('Unsaved');
});
test('user text is rendered as text, not markup',async({page})=>{
  const state=demo();state.criteria[0].name='<img src=x onerror=alert(1)>';state.sample.feedback.reasoning='<script>bad()</script>';
  await page.goto('/');await page.evaluate(s=>localStorage.setItem('rubrickit.v1',JSON.stringify(s)),state);await page.goto('/report.html');
  await expect(page.locator('.report h3').first()).toHaveText(state.criteria[0].name);await expect(page.locator('.report img')).toHaveCount(0);
});
for(const width of [1280,390,320])test(`all pages fit ${width}px viewport`,async({page})=>{
  await page.setViewportSize({width,height:900});await seed(page);
  for(const route of ['/','/score.html','/report.html']) {
    await page.goto(route);await expect(page.locator('h1')).toBeVisible();
    const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>`${el.tagName}.${el.className}: ${el.textContent.slice(0,50)}`)}));
    expect(layout.scroll,`${route}: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(layout.width);
    await expect(page.locator('nav a[aria-current=page]')).toHaveCount(1);
  }
});
