import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import http, { type Server } from 'node:http';
import express from 'express';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { compression } from '../middleware/compression.js';

let server: Server;
let port: number;
const body = JSON.stringify({ text: 'Filmvisarna – större och snabbare. '.repeat(200) });
before(async () => {
  const app = express();
  app.use(compression);
  app.get('/json', (_req,res) => res.type('json').send(body));
  app.get('/stream', (_req,res) => { res.type('html'); res.write(body.slice(0,100)); res.end(body.slice(100)); });
  app.get('/tiny', (_req,res) => res.json({ ok: true }));
  app.get('/image', (_req,res) => res.type('webp').send(body));
  app.get('/original', (_req,res) => res.set('Cache-Control','no-transform').type('text').send(body));
  app.get('/range', (_req,res) => res.status(206).set('Content-Range','bytes 0-99/200').type('text').send(body));
  server = await new Promise<Server>(resolve => { const value = app.listen(0,'127.0.0.1', () => resolve(value)); });
  port = (server.address() as { port: number }).port;
});
after(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
async function get(path: string, encoding: string, method = 'GET') {
  return new Promise<{ headers: http.IncomingHttpHeaders; body: Buffer }>((resolve,reject) => {
    const req = http.request({ hostname: '127.0.0.1',port,path,method,headers:{ 'Accept-Encoding':encoding } }, res => {
      const chunks: Buffer[]=[];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ headers:res.headers,body:Buffer.concat(chunks) }));
    });
    req.on('error',reject); req.end();
  });
}
test('negotiates Brotli and gzip by client quality and preserves the exact UTF-8 payload', async () => {
  for (const [accept,expected] of [['br, gzip','br'],['gzip','gzip'],['br;q=0.3,gzip;q=1','gzip']]) {
    const response = await get('/json',accept!);
    assert.equal(response.headers['content-encoding'],expected);
    assert.match(String(response.headers.vary),/Accept-Encoding/);
    assert.equal(response.headers['content-length'],undefined);
    assert.equal((expected==='br'?brotliDecompressSync(response.body):gunzipSync(response.body)).toString(),body);
    assert.ok(response.body.length<Buffer.byteLength(body)/4);
  }
});
test('compresses streamed HTML and handles identity, HEAD, small bodies, images and ranges', async () => {
  const streamed = await get('/stream','br');
  assert.equal(brotliDecompressSync(streamed.body).toString(),body);
  for (const path of ['/tiny','/image','/original','/range']) assert.equal((await get(path,'br')).headers['content-encoding'],undefined);
  assert.equal((await get('/json','identity')).body.toString(),body);
  assert.equal((await get('/json','br','HEAD')).body.length,0);
});
