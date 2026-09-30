import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(import.meta.dirname, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/healthz') {
      const body = JSON.stringify({ status: 'ok', service: 'ck-matcha' });
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body) });
      response.end(request.method === 'HEAD' ? undefined : body);
      return;
    }
    if (pathname.split('/').some(segment => segment.startsWith('.')) || pathname.includes('\0')) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
    const info = await stat(path);
    if (!info.isFile()) throw new Error('Not a file');
    const etag = `"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`;
    response.setHeader('ETag', etag);
    response.setHeader('Cache-Control', process.env.NODE_ENV === 'production' ? 'public, max-age=0, must-revalidate' : 'no-store');
    if (request.headers['if-none-match'] === etag) { response.writeHead(304); response.end(); return; }
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Content-Length': info.size });
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = createReadStream(path);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404);
    response.end(error instanceof URIError ? 'Invalid URL' : 'Not found');
  }
});
server.listen(port, host, () => console.log(`Local: http://${host}:${server.address().port}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
