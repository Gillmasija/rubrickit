import {mkdir, copyFile, readdir} from 'node:fs/promises';
await mkdir('dist', {recursive:true});
let count = 0;
for (const file of await readdir('.')) {
  if (/\.(html|css|js|svg)$/.test(file)) { await copyFile(file, `dist/${file}`); count++; }
}
console.log(`Built ${count} static assets in dist/`);
