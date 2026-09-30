import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const directory = resolve(import.meta.dirname, '..');
let child, base;
before(async () => {
  child = spawn(process.execPath, ['server.mjs'], { cwd: directory, env: { ...process.env, PORT: '0', HOST: '127.0.0.1', NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start')), 5000);
    child.stdout.once('data', data => { clearTimeout(timeout); resolve(data.toString().trim().replace('Local: ', '')); });
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timeout); if (code !== 0) reject(new Error(`Server exited: ${code}`)); });
  });
});
after(() => child?.kill('SIGTERM'));

test('Cloud Run health endpoint and configured listener respond', async () => {
  const response = await fetch(`${base}/api/healthz`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'ck-matcha' });
});
test('homepage and modules use correct content types', async () => {
  for (const [path, type] of [['/', 'text/html'], ['/main.js', 'text/javascript'], ['/field.js', 'text/javascript'], ['/content.js', 'text/javascript'], ['/style.css', 'text/css']]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(type));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    await response.arrayBuffer();
  }
});
test('both original PDFs stream without changing their bytes', async () => {
  for (const language of ['zh', 'en']) {
    const path = `/catalogs/CK-Matcha-Collection-${language}.pdf`;
    const response = await fetch(base + path);
    const expected = await readFile(resolve(directory, 'dist' + path));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert.equal(Number(response.headers.get('content-length')), expected.length);
    const actual = Buffer.from(await response.arrayBuffer());
    assert.equal(createHash('sha256').update(actual).digest('hex'), createHash('sha256').update(expected).digest('hex'));
  }
});
test('HEAD and conditional requests preserve HTTP semantics', async () => {
  const response = await fetch(`${base}/style.css`, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  assert.ok(Number(response.headers.get('content-length')) > 0);
  const cached = await fetch(`${base}/style.css`, { headers: { 'If-None-Match': response.headers.get('etag') } });
  assert.equal(cached.status, 304);
  assert.equal(await cached.text(), '');
});
test('unknown files, hosting metadata and invalid methods are rejected', async () => {
  for (const path of ['/not-found', '/.openai/hosting.json', '/%2eopenai/hosting.json', '/server.mjs', '/.env']) {
    assert.equal((await fetch(base + path)).status, 404);
  }
  assert.equal((await fetch(`${base}/%ZZ`)).status, 400);
  const post = await fetch(base, { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});
