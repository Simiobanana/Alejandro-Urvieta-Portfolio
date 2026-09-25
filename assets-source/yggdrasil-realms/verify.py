"""Independently decode the final Draco export and check the agreed web budget."""
import bpy,math,json,hashlib
from pathlib import Path
base=Path(__file__).resolve().parent/'deliverables'
path=base/'yggdrasil-realms.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(path))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
finite=all(math.isfinite(c) for o in meshes for v in o.data.vertices for c in v.co)
anchors=[o.name for o in bpy.context.scene.objects if o.type=='EMPTY' and o.name.startswith(('Realm_','Tree_'))]
assert len(meshes)==12 and triangles<=120000 and path.stat().st_size<1600000 and finite
assert set(anchors)=={'Realm_Programming','Realm_Art','Realm_Experiences','Tree_Heart'}
report={'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'meshes':len(meshes),'triangles':triangles,'bytes':path.stat().st_size,'finite_coordinates':finite,'anchors':anchors,'policy':{'max_triangles':120000,'max_bytes':1600000,'external_assets':False}}
(base/'validation.json').write_text(json.dumps(report,indent=2))
print('REALMS_VALIDATION '+json.dumps(report))
