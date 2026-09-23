"""Round-trip both Draco assets through Blender, independently of the web renderer."""
import bpy, json, math
from pathlib import Path

base = Path(__file__).resolve().parent / 'deliverables'
reports = []
for filename in ('yggdrasil-web.glb', 'yggdrasil-mobile.glb'):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(base / filename))
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    anchors = [o for o in bpy.context.scene.objects if o.name.startswith('ProjectAnchor_')]
    assert len(meshes) == 6 and len(anchors) == 12
    assert all(math.isfinite(c) for o in meshes for v in o.data.vertices for c in v.co)
    triangles = sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
    reports.append({'file': filename, 'decoded_meshes': len(meshes), 'decoded_triangles': triangles,
                    'anchors': len(anchors), 'finite_coordinates': True})
(base / 'roundtrip-validation.json').write_text(json.dumps(reports, indent=2))
print('ROUNDTRIP_VALIDATION ' + json.dumps(reports))
