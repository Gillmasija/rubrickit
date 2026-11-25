import {readdir,readFile,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
let checked=0;
async function scan(dir) {
  for (const file of await readdir(dir,{withFileTypes:true})) {
    if (['.git','node_modules','dist','test-results','playwright-report'].includes(file.name)) continue;
    const path=`${dir}/${file.name}`;
    if (file.isDirectory()) { await scan(path); continue; }
    if (/\.(js|mjs)$/.test(file.name)) {
      const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
      if(result.status!==0) throw new Error(result.stderr); checked++;
    }
    if (file.name.endsWith('.html')) {
      const html=await readFile(path,'utf8');
      for (const required of ['lang="en"','name="viewport"','rel="icon"','<title>','<main']) if(!html.includes(required)) throw new Error(`${path}: missing ${required}`);
      for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) if(!/^(https?:|data:)/.test(match[1])) await access(match[1]);
      checked++;
    }
  }
}
await scan('.'); console.log(`Syntax and static page lint passed (${checked} files).`);
