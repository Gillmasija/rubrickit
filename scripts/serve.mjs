import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root = resolve(process.env.SERVE_DIST ? 'dist' : '.');
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml'};
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!file.startsWith(root + sep) || !types[extname(file)]) { res.writeHead(404).end(); return; }
    res.writeHead(200, {'Content-Type':types[extname(file)], 'Cache-Control':'no-store'}).end(await readFile(file));
  } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
}).listen(4195, '127.0.0.1', () => console.log('RubricKit: http://127.0.0.1:4195'));
