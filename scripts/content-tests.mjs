import assert from "node:assert/strict";
const origin="http://localhost:5173";
const call=async(path,method="GET",body)=>{const response=await fetch(origin+path,{method,headers:{"Origin":origin,"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});let data;try{data=await response.json();}catch{throw new Error(path+" returned non-JSON "+response.status);}return {status:response.status,data};};
let projectId,sectionId;
try {
  const created=await call("/api/admin/projects","POST",{title:"Disposable local integration fixture",description:"Draft visibility and CRUD test",published:false});
  assert.equal(created.status,201);projectId=created.data.project.id;
  assert.equal((await call("/api/projects")).data.projects.some(p=>p.id===projectId),false,"Draft must not be public");
  assert.equal((await call("/api/admin/projects")).data.projects.some(p=>p.id===projectId),true,"Owner must see drafts");
  const payload={...created.data.project,published:true,title:"Updated local fixture",media:[{id:"first",url:"/example.webp",type:"image/webp",alt:"First"},{id:"second",url:"https://example.com/image.png",type:"image/png",alt:"Second"}]};
  assert.equal((await call("/api/admin/projects/"+projectId,"PUT",payload)).status,200);
  const published=(await call("/api/projects")).data.projects.find(p=>p.id===projectId);assert.equal(published.title,payload.title);assert.deepEqual(published.media,payload.media);
  assert.equal((await call("/api/admin/projects/"+projectId,"PUT",{...payload,href:"javascript:alert(1)"})).status,400);
  assert.equal((await call("/api/admin/projects/"+projectId,"PUT",{...payload,media:[{id:"bad",url:"data:text/html,evil",type:"image/png",alt:""}]})).status,400);
  const section=await call("/api/admin/sections","POST",{kind:"custom",titleEn:"Disposable section",titleEs:"Prueba",sortOrder:15,published:false,items:[{titleEn:"A",titleEs:"A",bodyEn:"B",bodyEs:"B",label:"",href:"mailto:test@example.com"}]});
  assert.equal(section.status,201);sectionId=section.data.section.id;
  assert.equal((await call("/api/sections")).data.sections.some(s=>s.id===sectionId),false);
  assert.equal((await call("/api/admin/sections/"+sectionId,"PUT",{...section.data.section,published:true,sortOrder:25})).status,200);
  assert.equal((await call("/api/sections")).data.sections.find(s=>s.id===sectionId).sortOrder,25);
  const settings=(await call("/api/admin/settings")).data.settings;
  assert.equal((await call("/api/admin/settings","PUT",{...settings,previewSeconds:-2})).status,400);
  assert.equal((await call("/api/admin/settings","PUT",settings)).status,200);
  const csrf=await fetch(origin+"/api/admin/projects",{method:"POST",headers:{"Origin":"https://untrusted.example","Content-Type":"application/json"},body:JSON.stringify(payload)});assert.equal(csrf.status,403);
  console.log("PASS: draft privacy, admin reads, project/media roundtrip, URL validation, section placement, settings, CSRF.");
} finally {
  if(projectId)assert.equal((await call("/api/admin/projects/"+projectId,"DELETE")).status,200);
  if(sectionId)assert.equal((await call("/api/admin/sections/"+sectionId,"DELETE")).status,200);
}
