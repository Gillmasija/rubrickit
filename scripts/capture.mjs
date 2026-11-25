import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {demo} from '../demo.js';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,SERVE_DIST:'1'},stdio:['ignore','pipe','pipe']});
let browser;
try {
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Preview timed out')),10000);
    server.once('error',error=>{clearTimeout(timer);reject(error);});
    server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Preview exited ${code}`));});
    server.stdout.once('data',()=>{clearTimeout(timer);resolve();});
  });
  browser=await chromium.launch({channel:process.env.CI?undefined:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  await page.goto('http://127.0.0.1:4195');
  await page.evaluate(state=>localStorage.setItem('rubrickit.v1',JSON.stringify(state)),demo());await page.reload();
  await page.locator('#criteria').waitFor();await mkdir('docs',{recursive:true});
  await page.screenshot({path:'docs/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4195/score.html');
  await page.locator('#score-form').waitFor();await page.screenshot({path:'docs/mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:1000});await page.goto('http://127.0.0.1:4195/report.html');await page.locator('.report').waitFor();
  await page.screenshot({path:'docs/feedback.png',fullPage:true});await page.emulateMedia({media:'print'});
  await page.screenshot({path:'docs/print.png',fullPage:true});
  console.log('Captured desktop, mobile, feedback and print CSS screenshots with synthetic data.');
}finally{await browser?.close();server.kill();}
