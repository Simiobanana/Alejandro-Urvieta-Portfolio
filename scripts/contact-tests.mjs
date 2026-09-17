import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { webcrypto } from 'node:crypto';

function load(file, imports) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => imports[name], Buffer, URL, Response, TextEncoder, Uint8Array, crypto: webcrypto, console: { error() {} } });
  return exports;
}
const contact = load('lib/contact.ts', { zod: { z } });
let sent = [], fail = false, allowed = true, totalAllowed = true;
const env = { CONTACT_EMAIL: { async send(message) { if (fail) throw Error('provider'); sent.push(message); } }, CONTACT_LIMIT: { async limit() { return { success: allowed }; } }, CONTACT_TOTAL_LIMIT: { async limit() { return { success: totalAllowed }; } } };
const { POST } = load('app/api/contact/route.ts', { 'cloudflare:workers': { env }, 'cloudflare:email': { EmailMessage: class { constructor(from, to, raw) { Object.assign(this, { from, to, raw }); } } }, '@/lib/contact': contact });
const data = { name: 'María', email: 'visitor@example.com', subject: 'Oferta de programación 🎮', message: '¡Hola! Mensaje con acentos y <script>texto</script>.', website: '' };
const request = (body = data, origin = 'https://alejandrourvieta.com') => new Request('https://alejandrourvieta.com/api/contact', { method: 'POST', headers: { origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, body: JSON.stringify(body) });
assert.equal((await POST(request())).status, 200);
assert.equal(sent.length, 1);
assert.equal(sent[0].to, 'alejandroug2608@gmail.com');
assert.match(sent[0].raw, /Reply-To: visitor@example.com/);
assert.ok(Buffer.from(sent[0].raw.split('\r\n\r\n')[1], 'base64').toString().includes(data.message));
assert.equal((await POST(request(data, 'https://other.example'))).status, 403);
assert.equal((await POST(request({ ...data, email: 'bad\r\nBcc: attacker@example.com' }))).status, 400);
assert.equal((await POST(request({ ...data, subject: 'hello\r\nBcc: attacker@example.com' }))).status, 400);
assert.equal((await POST(request({ ...data, website: 'spam.example' }))).status, 400);
assert.equal((await POST(request({ ...data, message: 'x'.repeat(5001) }))).status, 400);
assert.equal((await POST(request({ ...data, message: 'x'.repeat(25000) }))).status, 413);
allowed = false; assert.equal((await POST(request())).status, 429); allowed = true;
totalAllowed = false; assert.equal((await POST(request())).status, 429); totalAllowed = true;
fail = true; const failure = await POST(request()); assert.equal(failure.status, 503); assert.equal((await failure.json()).sent, undefined);
assert.equal(sent.length, 1, 'Rejected requests must never send');
const longSubject = contact.contactMime({ ...data, subject: '🎮'.repeat(80) }).raw;
for (const word of longSubject.match(/=\?UTF-8\?B\?[^?]+\?=/g)) assert.ok(word.length <= 75);
console.log('PASS: real success only, fixed recipient, Unicode MIME, input limits, origin, header injection, honeypot and rate limits.');

