import fs from "node:fs";
import ts from "typescript";
import vm from "node:vm";
const compile=(path,require)=>{const code=ts.transpileModule(fs.readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exports={};vm.runInNewContext(code,{exports,require});return exports;};
const data=compile("app/portfolio-data.ts",()=>{throw new Error("Unexpected import");});
const {initialSections}=compile("app/initial-sections.ts",()=>data);
const quote=v=>typeof v==="boolean"?(v?"1":"0"):typeof v==="number"?String(v):"'"+String(v??"").replaceAll("'","''")+"'";
const snake=s=>s.replace(/[A-Z]/g,c=>"_"+c.toLowerCase());
const insert=(table,row)=>`INSERT INTO ${table} (${Object.keys(row).map(snake).join(",")}) SELECT ${Object.values(row).map(quote).join(",")} WHERE NOT EXISTS (SELECT 1 FROM content_migrations WHERE name='initial-editable-content-v1');`;
let sql="CREATE TABLE IF NOT EXISTS content_migrations (name TEXT PRIMARY KEY);\n";
data.projects.forEach((p,i)=>{sql+=insert("projects",{title:p.title.en,titleEs:p.title.es,category:p.track==="art"?"Art & VFX":p.track==="hybrid"?"Hybrid":"Programming",description:p.description.en,descriptionEs:p.description.es,outcome:p.outcome.en,outcomeEs:p.outcome.es,details:JSON.stringify(p.details.map(d=>d.en)),detailsEs:JSON.stringify(p.details.map(d=>d.es)),stack:JSON.stringify(p.stack),href:p.href||"",repo:p.repo||"",code:p.code,accent:p.accent,media:"[]",featured:!!p.featured,published:true,sortOrder:i*10})+"\n";});
for(const s of initialSections)sql+=insert("custom_sections",{...s,media:JSON.stringify(s.media),items:JSON.stringify(s.items)})+"\n";
sql+="INSERT OR IGNORE INTO content_migrations (name) VALUES ('initial-editable-content-v1');\n";
fs.writeFileSync("drizzle/0003_editable_content.sql",sql);
console.log("Seed prepared: "+data.projects.length+" projects; "+initialSections.length+" sections.");

