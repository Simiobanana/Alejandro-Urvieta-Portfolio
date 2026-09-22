"""Original Yggdrasil, authored in Blender for Alejandro Urvieta's portfolio.
Run: blender --background --python assets-source/yggdrasil/build_yggdrasil.py
No downloaded meshes, images, or external asset libraries.
"""
import bpy, math, random, json, os
import numpy as np
from mathutils import Vector
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'deliverables'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(2608)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for collection in list(bpy.data.collections):
    if collection.name != 'Collection': bpy.data.collections.remove(collection)
asset = bpy.data.collections.new('YGGDRASIL | web asset'); bpy.context.scene.collection.children.link(asset)
stage = bpy.data.collections.new('STUDIO | render only'); bpy.context.scene.collection.children.link(stage)

def material(name, color, metallic=0, rough=.65, emission=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metallic; p.inputs['Roughness'].default_value=rough
    p.inputs['Emission'].default_value=(*color,1); p.inputs['Emission Strength'].default_value=emission
    m.diffuse_color=(*color,1); return m

bark=material('Ancient bronze | bark',(.18,.105,.052),.18,.76)
leaves=material('Jade foliage | vertex variation',(.035,.24,.16),.12,.52)
vein=material('Amber sap | emission',(.85,.39,.075),.3,.35,2.2)
teal=material('World lights | emission',(.045,.8,.60),.15,.3,4)
rock=material('Root stone | obsidian',(.038,.071,.080),.25,.86)
# Vertex color brings all leaf variation into one material/draw call.
for m in (bark,leaves,rock):
    attr=m.node_tree.nodes.new('ShaderNodeVertexColor'); attr.layer_name='Tint'
    m.node_tree.links.new(attr.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])

# A small, original, seamless bark normal map; real glTF texture, no Blender-only nodes.
N=512
yy,xx=np.mgrid[0:N,0:N].astype(np.float32);u=xx/N;v=yy/N
warp=.15*np.sin(v*math.tau*2)+.075*np.sin(v*math.tau*5+u*math.tau*2)
height=.55*np.sin(math.tau*(u*19+warp))+.21*np.sin(math.tau*(u*43+warp*1.8))+.10*np.sin(math.tau*(u*79+warp*3))
height+=.1*np.sin(math.tau*(v*11+u*3))*np.sin(math.tau*u*23)
dx=(np.roll(height,-1,1)-np.roll(height,1,1))*2.4;dy=(np.roll(height,-1,0)-np.roll(height,1,0))*1.6
normal=np.stack((-dx,-dy,np.ones_like(dx)),axis=2);normal/=np.linalg.norm(normal,axis=2,keepdims=True)
rgba=np.ones((N,N,4),dtype=np.float32);rgba[:,:,:3]=normal*.5+.5
im=bpy.data.images.new('Original bark normal 512',width=N,height=N,alpha=True)
im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(rgba.reshape(-1));im.filepath_raw=str(OUT/'bark-normal.png');im.file_format='PNG';im.save();im.pack()
tex=bark.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;tex.extension='REPEAT'
nm=bark.node_tree.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.85
bark.node_tree.links.new(tex.outputs['Color'],nm.inputs['Color']);bark.node_tree.links.new(nm.outputs['Normal'],bark.node_tree.nodes.get('Principled BSDF').inputs['Normal'])

class Geometry:
    def __init__(self): self.v=[];self.f=[];self.c=[];self.uv=[]
    def vertex(self,co,color,uv=(0,0)): self.v.append(tuple(co));self.c.append((*color,1));self.uv.append(uv);return len(self.v)-1
    def object(self,name,mat):
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(self.v,[],self.f);mesh.update()
        obj=bpy.data.objects.new(name,mesh);asset.objects.link(obj);obj.data.materials.append(mat)
        colors=mesh.color_attributes.new(name='Tint',type='BYTE_COLOR',domain='CORNER')
        for loop in mesh.loops: colors.data[loop.index].color=self.c[loop.vertex_index]
        if mat==bark:
            uv=mesh.uv_layers.new(name='BarkUV')
            for poly in mesh.polygons:
                us=[self.uv[mesh.loops[k].vertex_index][0] for k in poly.loop_indices]
                seam=max(us)-min(us)>.5
                for k in poly.loop_indices:
                    x,y=self.uv[mesh.loops[k].vertex_index];uv.data[k].uv=(x+1 if seam and x<.5 else x,y)
        for poly in mesh.polygons: poly.use_smooth=True
        return obj

wood,foliage,sap,lights,stones=Geometry(),Geometry(),Geometry(),Geometry(),Geometry()

def smooth(points, count):
    p=[Vector(x) for x in points]; result=[]
    for i in range(count):
        t=i/(count-1)*(len(p)-1); k=min(int(t),len(p)-2); u=t-k
        a,b,c,d=p[max(0,k-1)],p[k],p[k+1],p[min(len(p)-1,k+2)]
        result.append(.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u))
    return result

def tube(g,points,r0,r1,sides=8,steps=18,color=(.22,.135,.075),ridge=.08):
    pts=smooth(points,steps); start=len(g.v); phase=random.uniform(0,6.28);length=sum((pts[i]-pts[i-1]).length for i in range(1,len(pts)))
    for i,p in enumerate(pts):
        t=i/(len(pts)-1); tangent=(pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)]).normalized()
        axis=Vector((0,1,0)) if abs(tangent.y)<.9 else Vector((1,0,0))
        u=tangent.cross(axis).normalized();v=tangent.cross(u).normalized()
        radius=(r0*(1-t)**1.08+r1*t)*(1+.045*math.sin(t*18+phase))
        for j in range(sides):
            a=j/sides*math.tau; rr=radius*(1+ridge*math.sin(a*5+t*3+phase))
            shade=.74+.27*(math.sin(a*3+phase)*.5+.5)+.07*math.sin(t*40)
            g.vertex(p+(u*math.cos(a)+v*math.sin(a))*rr,tuple(c*shade for c in color),(j/sides,t*length/1.8))
        if i:
            for j in range(sides):
                a=start+(i-1)*sides+j;b=start+(i-1)*sides+(j+1)%sides
                g.f.append((a,b,b+sides,a+sides))
    g.f.append(tuple(start+j for j in reversed(range(sides))))
    g.f.append(tuple(start+(steps-1)*sides+j for j in range(sides)))
    return pts

def leaf(center,size,direction):
    # Folded lance leaf: 4 triangles, no alpha cards or texture overdraw.
    direction=Vector(direction).normalized();axis=direction.cross(Vector((0,0,1)))
    if axis.length<.01: axis=Vector((1,0,0))
    axis.normalize(); c=Vector(center); bend=direction.cross(axis).normalized()*size*.13
    palette=[(.045,.22,.12),(.065,.34,.21),(.12,.40,.27),(.23,.38,.15),(.30,.25,.085),(.025,.16,.15)]
    color=random.choice(palette); s=len(foliage.v)
    for p in (c-direction*size*.5,c-axis*size*.22,c+direction*size*.6,c+axis*size*.22,c+bend): foliage.vertex(p,color)
    foliage.f.extend([(s,s+1,s+4),(s+1,s+2,s+4),(s+2,s+3,s+4),(s+3,s,s+4)])

def cluster(center,scale=1,count=62):
    c=Vector(center)
    for _ in range(count):
        a=random.random()*math.tau;rad=math.sqrt(random.random())*scale
        p=c+Vector((math.cos(a)*rad,math.sin(a)*rad*.65,random.uniform(-.26,.34)*scale))
        leaf(p,random.uniform(.22,.46),(math.cos(a),math.sin(a),random.uniform(.2,1)))

def gem(g,center,r,color=(.05,.8,.6)):
    c=Vector(center);s=len(g.v)
    for d in [(0,0,1.5),(1,0,0),(0,1,0),(-1,0,0),(0,-1,0),(0,0,-1.5)]:g.vertex(c+Vector(d)*r,color)
    for i in range(4):g.f.extend([(s,s+1+i,s+1+(i+1)%4),(s+5,s+1+(i+1)%4,s+1+i)])

# A deeply buttressed base, with seven braided trunks. The strands become branches.
tube(wood,[(0,0,-.25),(.12,.06,.8),(-.12,0,2.3),(.2,.04,3.8),(0,.12,5.3)],1.04,.53,16,36)
for i in range(7):
    phase=i/7*math.tau
    pts=[]
    for j in range(9):
        t=j/8;z=.05+t*5.7;a=phase+t*2.55;r=.73*(1-t*.44)
        pts.append((math.cos(a)*r+math.sin(t*4)*.18,math.sin(a)*r,z))
    tube(wood,pts,.44,.20,9,34,color=(.245,.151,.078),ridge=.12)
    # Narrow sap seams trace along the bark, not a neon wire cage.
    seam=[]
    for j,p in enumerate(pts):
        t=j/(len(pts)-1);a=phase+t*2.55;offset=.44*(1-t)+.20*t
        seam.append((p[0]+math.cos(a)*offset,p[1]+math.sin(a)*offset,p[2]))
    tube(sap,seam,.013,.008,4,34,color=(1,.53,.10),ridge=0)

# Root fan wraps an eroded floating bed. Forking tips create an unmistakable root silhouette.
for i in range(15):
    a=i/15*math.tau+random.uniform(-.13,.13);length=random.uniform(3.1,5.1)
    p=[(math.cos(a)*.4,math.sin(a)*.4,1.2),(math.cos(a)*1.3,math.sin(a)*1.3,.08),(math.cos(a+.1)*length*.63,math.sin(a+.1)*length*.63,-.38),(math.cos(a+.23)*length,math.sin(a+.23)*length,-.68)]
    tube(wood,p,.34,.024,8,22)
    for side in (-1,1):
        start=Vector(p[2]);end=Vector(p[3])+Vector((math.cos(a+side*.6),math.sin(a+side*.6),-.12))*.65
        tube(wood,[start,(start+end)/2+Vector((0,0,.12)),end],.10,.007,6,12)
    if i%2==0:tube(sap,[(x,y,z+.12) for x,y,z in p],.011,.004,4,22)

# Twelve primary limbs: asymmetry in depth but a deliberate broad, vaulted crown.
tips=[]
for i in range(12):
    a=i/12*math.tau+.12; length=random.uniform(5.7,7.5)
    startz=3.1+(i%4)*.52; top=7.0+1.5*(1-abs(math.cos(a))*.40)+random.uniform(-.35,.35)
    start=Vector((math.cos(a)*.40,math.sin(a)*.40,startz))
    p=[start,(math.cos(a)*1.45,math.sin(a)*1.05,startz+.75),(math.cos(a+.10)*length*.62,math.sin(a+.10)*length*.45,top-.65),(math.cos(a+.19)*length,math.sin(a+.19)*length*.63,top)]
    pts=tube(wood,p,.43,.042,10,28,color=(.25,.155,.077))
    if i%2==0:tube(sap,[(q.x,q.y-.02,q.z+.14*(1-k/(len(pts)-1))) for k,q in enumerate(pts)],.013,.004,4,28)
    for j in range(4):
        t=.42+j*.16; base=pts[int(t*(len(pts)-1))]; side=-1 if j%2 else 1
        b=a+side*random.uniform(.37,.74); reach=random.uniform(1.0,1.95)
        end=base+Vector((math.cos(b)*reach,math.sin(b)*reach*.7,.65+random.random()*.5))
        sub=tube(wood,[base,base+Vector((math.cos(b)*reach*.48,math.sin(b)*reach*.4,.35)),end],.12*(1-j*.15),.015,7,14)
        for k in range(3):
            q=sub[5+k*3];angle=b+(-1 if k%2 else 1)*.8
            tip=q+Vector((math.cos(angle)*.65,math.sin(angle)*.52,.45))
            tube(wood,[q,(q+tip)/2+Vector((0,0,.07)),tip],.04,.004,5,9)
            cluster(tip,.63,38);tips.append(tip)
        cluster(end,.77,55)
    cluster(pts[-1],.84,65)

# Elevated center crown creates a domed silhouette, never a flat parasol.
for i in range(9):
    a=i/9*math.tau; p=[(0,.1,4.7),(.55*math.cos(a),.6*math.sin(a),6.5),(2.3*math.cos(a),1.7*math.sin(a),8.9),(3.1*math.cos(a+.2),2.2*math.sin(a+.2),9.6+random.uniform(-.3,.35))]
    pts=tube(wood,p,.23,.018,8,24)
    for j in (12,16,20,23):
        q=pts[j];tip=q+Vector((math.cos(a+.8)*.9,math.sin(a+.8)*.7,.25))
        tube(wood,[q,(q+tip)/2+Vector((0,0,.18)),tip],.06,.006,6,10)
        cluster(tip,.8,62)

# Hanging magic seeds and slender tendrils give the canopy a living, ancient scale.
for i in range(33):
    p=random.choice(tips);length=random.uniform(.4,1.4)
    end=p+Vector((.12*math.sin(i),0,-length))
    tube(wood,[p,p+Vector((.09,.05,-length*.4)),end],.014,.004,4,10)
    gem(lights,end,.029+random.random()*.028)
for i in range(70):
    p=random.choice(tips)+Vector((random.uniform(-.4,.4),random.uniform(-.25,.25),random.uniform(-.5,.3)))
    gem(sap,p,.016+random.random()*.025,(1,.45,.08))

# Low-profile, faceted foundation, not a heavy terrain mesh.
for i in range(13):
    a=i*2.399; r=.9+math.sqrt(i/13)*2.25;c=Vector((math.cos(a)*r,math.sin(a)*r*.7,-.67))
    start=len(stones.v);s=random.uniform(.55,1.15)
    for k in range(8):
        angle=k/8*math.tau
        stones.vertex(c+Vector((math.cos(angle)*s,math.sin(angle)*s*.8,random.uniform(-.13,.19))),(.06,.1,.105))
    stones.vertex(c+Vector((0,0,-.6*s)),(.025,.045,.056));stones.vertex(c+Vector((0,0,.25*s)),(.08,.14,.14))
    for k in range(8):stones.f.extend([(start+k,start+(k+1)%8,start+9),(start+(k+1)%8,start+k,start+8)])

objects=[wood.object('01 | Heartwood and roots',bark),foliage.object('02 | Jade and bronze leaf canopy',leaves),sap.object('03 | Golden sap and seed lights',vein),lights.object('04 | Turquoise hanging world seeds',teal),stones.object('05 | Rootstone foundation',rock)]
leaves.use_backface_culling=False
# Named empties export as lightweight GLTF nodes for current and future project attachment.
anchors=[(-5.4,-1.4,7.35),(-3.1,-2.0,7.6),(-1.55,-1.2,8.8),(1.45,-1.3,8.9),(3.6,-1.8,7.7),(5.55,-1.4,7.25),(-4.35,-2.15,6.1),(4.45,-2.0,6.0),(0,-.82,5.9),(-2.45,-1.9,5.4),(2.4,-1.8,5.35),(0,-1.12,2.75)]
for i,p in enumerate(anchors):
    ob=bpy.data.objects.new('ProjectAnchor_%02d'%(i+1),None);asset.objects.link(ob);ob.location=p;ob.empty_display_type='SPHERE';ob.empty_display_size=.13;ob['reserved_for_project']=True

# Studio lighting is kept out of the GLB.
def studio_obj(obj):
    for col in list(obj.users_collection):col.objects.unlink(obj)
    stage.objects.link(obj)
def area(name,loc,color,power,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
    ob=bpy.data.objects.new(name,d);stage.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,4))-ob.location).to_track_quat('-Z','Y').to_euler();return ob
area('Warm moon | key',(-5,-8,13),(1,.73,.43),2100,9)
area('Aurora | rim',(4,3,10),(.15,1,.75),1050,7)
area('Sky | fill',(-7,4,7),(.3,.36,1),1700,8)
area('Front | softbox',(1,-10,5),(.55,.69,1),650,7)
scene=bpy.context.scene;scene.world.color=(.03,.03,.03);scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.012,.021,.036,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
bpy.ops.object.camera_add(location=(.4,-24,11.2));cam=bpy.context.object;studio_obj(cam);cam.name='CAM | Portfolio three-quarter';cam.rotation_euler=(Vector((0,0,4.5))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=20;scene.camera=cam
scene.render.engine='BLENDER_EEVEE';scene.eevee.use_gtao=True;scene.eevee.gtao_distance=3;scene.eevee.gtao_factor=1.35;scene.eevee.use_bloom=True;scene.eevee.bloom_intensity=.13;scene.eevee.bloom_radius=5;scene.eevee.taa_render_samples=64
scene.view_settings.view_transform='Filmic';scene.view_settings.look='Medium High Contrast';scene.view_settings.exposure=.15
scene.render.resolution_x=1600;scene.render.resolution_y=1150;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene['asset_notes']='Original Blender geometry. Z-up authoring; GLB exports Y-up. 12 named anchors. Five materials, one packed original bark normal map. No external textures. Studio excluded from exports.'
bpy.ops.object.select_all(action='DESELECT')
for ob in asset.objects:ob.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Yggdrasil_Alejandro_Urvieta.blend'))

def export(path):
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_colors=True,export_tangents=True,export_extras=True,export_cameras=False,export_lights=False,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=14,export_draco_normal_quantization=10,export_draco_texcoord_quantization=12,export_draco_color_quantization=8)
export(OUT/'yggdrasil-web.glb')
stats={'objects':len(objects),'materials':len({m.name for ob in objects for m in ob.data.materials}),'anchors':len(anchors),'web_triangles':sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in objects),'web_bytes':(OUT/'yggdrasil-web.glb').stat().st_size}
scene.render.filepath=str(OUT/'yggdrasil-preview.png');bpy.ops.render.render(write_still=True)
scene.render.image_settings.file_format='WEBP';scene.render.image_settings.quality=86
bpy.data.images['Render Result'].save_render(str(OUT/'yggdrasil-poster.webp'),scene=scene)
scene.render.image_settings.file_format='PNG'
cam.location=(15,-20,10);cam.rotation_euler=(Vector((0,0,4.5))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/'yggdrasil-three-quarter.png');bpy.ops.render.render(write_still=True)
# A separate mobile export, preserving the high-detail editable .blend.
for ob in objects:
    if ob in (objects[0],objects[1]):
        mod=ob.modifiers.new('Mobile geometric reduction','DECIMATE');mod.ratio=.46 if ob==objects[0] else .5
export(OUT/'yggdrasil-mobile.glb')
deps=bpy.context.evaluated_depsgraph_get();stats['mobile_triangles']=sum(sum(len(p.vertices)-2 for p in ob.evaluated_get(deps).data.polygons) for ob in objects);stats['mobile_bytes']=(OUT/'yggdrasil-mobile.glb').stat().st_size
(OUT/'metrics.json').write_text(json.dumps(stats,indent=2))
(OUT/'anchors.json').write_text(json.dumps({'coordinates':'glTF Y-up','anchors':[{'name':'ProjectAnchor_%02d'%(i+1),'position':[p[0],p[2],-p[1]]} for i,p in enumerate(anchors)]},indent=2))
print('YGGDRASIL_METRICS '+json.dumps(stats))

