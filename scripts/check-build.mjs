import {spawn} from 'node:child_process';
import {readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const expected=['index.html','score.html','report.html','styles.css','favicon.svg','app.js','model.js','store.js','demo.js'];
assert.deepEqual((await readdir('dist')).sort(),expected.sort());
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,SERVE_DIST:'1'},stdio:['ignore','pipe','pipe']});
try {
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Server startup timed out')),10000);
    server.once('error',e=>{clearTimeout(timer);reject(e);});
    server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Server exited ${code}`));});
    server.stdout.once('data',()=>{clearTimeout(timer);resolve();});
  });
  for(const file of expected)assert.equal((await fetch(`http://127.0.0.1:4195/${file}`)).status,200,file);
  for(const file of ['missing.html','package.json','playwright.config.js'])assert.equal((await fetch(`http://127.0.0.1:4195/${file}`)).status,404,file);
  console.log('Production output: 9 assets serve HTTP 200; missing and development files return 404.');
}finally{server.kill();}
