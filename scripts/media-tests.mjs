import assert from 'node:assert/strict';import fs from 'node:fs';const origin='http://localhost:5173';
const upload=async(bytes,name,type)=>{const f=new FormData();f.set('file',new File([bytes],name,{type}));return fetch(origin+'/api/admin/uploads',{method:'POST',headers:{Origin:origin},body:f});};
assert.equal((await upload('<html>bad</html>','fake.png','image/png')).status,415);
assert.equal((await upload('<svg/>','a.svg','image/svg+xml')).status,415);
const bytes=fs.readFileSync('public/previews/measure.webp'),r=await upload(bytes,'fixture.webp','image/webp');assert.equal(r.status,200);const {url}=await r.json();
const part=await fetch(origin+url,{headers:{Range:'bytes=0-15'}});assert.equal(part.status,206);assert.equal((await part.arrayBuffer()).byteLength,16);
const head=await fetch(origin+url,{method:'HEAD'});assert.equal(Number(head.headers.get('content-length')),bytes.length);
assert.equal((await fetch(origin+url,{headers:{'If-None-Match':head.headers.get('etag')}})).status,304);
assert.equal((await fetch(origin+url,{headers:{Range:'bytes=99999999-'}})).status,416);console.log('PASS: upload signatures, SVG rejection, byte ranges, HEAD, ETag, invalid range.');

