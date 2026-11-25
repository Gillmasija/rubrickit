import {mkdir, copyFile, readdir, unlink, lstat} from 'node:fs/promises';
await mkdir('dist', {recursive:true});
if ((await lstat('dist')).isSymbolicLink()) throw new Error('Build output must not be a symlink.');
for (const file of await readdir('dist',{withFileTypes:true})) {
  if (!file.isFile()) throw new Error(`Unexpected non-file in dist: ${file.name}`);
  await unlink(`dist/${file.name}`);
}
const assets=['index.html','score.html','report.html','styles.css','favicon.svg','app.js','model.js','store.js','demo.js'];
for(const file of assets)await copyFile(file,`dist/${file}`);
console.log(`Built ${assets.length} static assets in dist/`);
