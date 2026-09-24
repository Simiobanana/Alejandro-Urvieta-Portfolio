"""Original Yggdrasil, authored in Blender for Alejandro Urvieta's portfolio.
Run: blender --background --python assets-source/yggdrasil-realms/build_realms.py
No downloaded meshes, images, or external asset libraries.
"""
import bpy, math, random, json, os
from bpy_extras.object_utils import world_to_camera_view
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
water=material('Waterfall | astral current',(.06,.52,.56),.12,.25,.7)
water.blend_method='BLEND';water.use_screen_refraction=False;water.use_backface_culling=False
for m in (bark,leaves,rock,water):
    attr=m.node_tree.nodes.new('ShaderNodeVertexColor'); attr.layer_name='Tint'
    m.node_tree.links.new(attr.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])

water.node_tree.links.new(next(n for n in water.node_tree.nodes if n.bl_idname=='ShaderNodeVertexColor').outputs['Alpha'],water.node_tree.nodes.get('Principled BSDF').inputs['Alpha'])

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
    def vertex(self,co,color,uv=(0,0)): self.v.append(tuple(co));self.c.append((*color,1) if len(color)==3 else color);self.uv.append(uv);return len(self.v)-1
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

wood,foliage,sap,lights,stones,river=Geometry(),Geometry(),Geometry(),Geometry(),Geometry(),Geometry()
# Front-facing branch tips leave deliberate gaps for project runes.
anchor_specs=[(-6.4,-2.8,7.35),(-4.1,-3.0,5.75),(-2.9,-2.5,8.8),(-.6,-2.0,10.1),(1.7,-2.4,8.9),(4.0,-2.8,8.0),(5.1,-2.7,5.8),(7.0,-1.7,7.1)]

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
        if any((p-Vector(a)).length<.65 for a in anchor_specs):continue
        leaf(p,random.uniform(.22,.46),(math.cos(a),math.sin(a),random.uniform(.2,1)))

def gem(g,center,r,color=(.05,.8,.6)):
    c=Vector(center);s=len(g.v)
    for d in [(0,0,1.5),(1,0,0),(0,1,0),(-1,0,0),(0,-1,0),(0,0,-1.5)]:g.vertex(c+Vector(d)*r,color)
    for i in range(4):g.f.extend([(s,s+1+i,s+1+(i+1)%4),(s+5,s+1+(i+1)%4,s+1+i)])

# Yggdrasil of three realms: first finished realm, kept separate from version one.
# Art target: a sculptural, asymmetrical tree with a warm arcane observatory.
random.seed(9317)
anchor_specs=[]
bronze=material('Observatory | brushed antique brass',(.38,.22,.082),.72,.38)
ivory=material('Observatory | carved limestone',(.40,.41,.32),.08,.8)
mossmat=material('Terrace | soft moss',(.09,.19,.075),0,.95)
slatemat=material('Instruments | midnight enamel',(.024,.068,.083),.45,.32)
metal,masonry,moss,slate=Geometry(),Geometry(),Geometry(),Geometry()
for m in (bronze,ivory,mossmat,slatemat):
    attr=m.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Tint'
    m.node_tree.links.new(attr.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
bark.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.88
nm.inputs['Strength'].default_value=.38
leaves.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=0
leaves.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.78
vein.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=1.5
teal.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=2.3

def ellipsoid(g,center,scale,color,segments=10,rings=6,rough=.07):
    c=Vector(center);start=len(g.v)
    for j in range(rings+1):
        phi=math.pi*j/rings
        for i in range(segments):
            theta=math.tau*i/segments
            r=1+rough*math.sin(theta*3+phi*5)+rough*.4*math.cos(theta*7-phi*3)
            p=Vector((math.sin(phi)*math.cos(theta)*scale[0],math.sin(phi)*math.sin(theta)*scale[1],math.cos(phi)*scale[2]))*r
            shade=.66+.34*(p.z/max(.01,scale[2])*.5+.5)
            g.vertex(c+p,tuple(v*shade for v in color))
    for j in range(rings):
        for i in range(segments):
            a=start+j*segments+i;b=start+j*segments+(i+1)%segments
            g.f.append((a,b,b+segments,a+segments))

def ring(g,center,radius,thickness,color,axis='Z',segments=64):
    c=Vector(center);start=len(g.v)
    for i in range(segments):
        a=math.tau*i/segments
        for j in range(6):
            b=math.tau*j/6;r=radius+thickness*math.cos(b)
            p=Vector((r*math.cos(a),r*math.sin(a),thickness*math.sin(b)))
            if axis=='X':p=Vector((p.z,p.x,p.y))
            if axis=='Y':p=Vector((p.x,p.z,p.y))
            g.vertex(c+p,color)
    for i in range(segments):
        for j in range(6):g.f.append((start+i*6+j,start+((i+1)%segments)*6+j,start+((i+1)%segments)*6+(j+1)%6,start+i*6+(j+1)%6))

def block(g,center,scale,color,angle=0):
    c=Vector(center);s=len(g.v)
    for z in (-1,1):
        for x,y in ((-1,-1),(1,-1),(1,1),(-1,1)):
            x*=scale[0]/2;y*=scale[1]/2
            g.vertex(c+Vector((x*math.cos(angle)-y*math.sin(angle),x*math.sin(angle)+y*math.cos(angle),z*scale[2]/2)),color)
    g.f.extend(tuple(s+i for i in f) for f in ((0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)))

def rounded_leaf(center,size,normal,color):
    n=Vector(normal).normalized();u=n.cross(Vector((0,0,1)))
    if u.length<.01:u=Vector((1,0,0))
    u.normalize();v=n.cross(u).normalized();c=Vector(center);s=len(foliage.v)
    foliage.vertex(c+n*size*.075,color)
    for j in range(8):
        a=j*math.tau/8
        foliage.vertex(c+u*math.cos(a)*size*.60+v*math.sin(a)*size*.38,tuple(k*(.87+.13*math.cos(a)) for k in color))
    for j in range(8):foliage.f.append((s,s+1+j,s+1+(j+1)%8))

def crown(center,radius,count):
    c=Vector(center)
    for _ in range(count):
        a=random.random()*math.tau;z=random.uniform(-.75,1);r=math.sqrt(1-z*z)*random.uniform(.72,1)
        p=Vector((math.cos(a)*r*radius,math.sin(a)*r*radius*.83,z*radius*.55))
        top=(z+1)/2
        palette=[(.08,.21,.12),(.13,.29,.16),(.22,.34,.13),(.29,.34,.105),(.36,.29,.08)]
        color=random.choice(palette[:3] if top<.45 else palette[1:])
        rounded_leaf(c+p,random.uniform(.24,.42),p.normalized()+Vector((0,0,.65)),color)

def island(center,radius,depth):
    cx,cy,cz=center;segments=48;rr=[]
    for level,(r,h) in enumerate(((1,0),(.99,-.22),(.9,-.72),(.68,-1.7),(.27,-2.5),(.055,-2.9))):
        row=[]
        for i in range(segments):
            a=i/segments*math.tau;w=1+.075*math.sin(5*a+.4)+.045*math.sin(11*a)
            shade=random.uniform(.8,1.12);col=(.115,.145,.145) if level<2 else (.09,.115,.145)
            row.append(stones.vertex((cx+math.cos(a)*radius*r*w,cy+math.sin(a)*radius*r*w*.82,cz+h*depth/2.9+.065*math.sin(a*7)),tuple(k*shade for k in col)))
        rr.append(row)
    s=stones.vertex((cx,cy,cz),(.17,.2,.16))
    for i in range(segments):stones.f.append((s,rr[0][i],rr[0][(i+1)%segments]))
    for j in range(len(rr)-1):
        for i in range(segments):stones.f.extend(((rr[j][i],rr[j+1][i],rr[j][(i+1)%segments]),(rr[j][(i+1)%segments],rr[j+1][i],rr[j+1][(i+1)%segments])))
    for i in range(34):
        a=random.random()*math.tau;r=radius*random.uniform(.80,1.0)
        p=(cx+math.cos(a)*r,cy+math.sin(a)*r*.82,cz-.22)
        ellipsoid(stones,p,(random.uniform(.22,.5),random.uniform(.2,.42),random.uniform(.25,.58)),(.15,.17,.18),8,4,.18)
    for i in range(55):
        a=random.random()*math.tau;r=radius*math.sqrt(random.random())
        ellipsoid(moss,(cx+math.cos(a)*r*.93,cy+math.sin(a)*r*.75,cz+.025),(.19+random.random()*.25,.16+random.random()*.20,.045+random.random()*.045),(.10,.22,.095),8,4)

island((1,0,0),3.45,3.8)
# Broad buttresses: visible above the earth, branching around rather than through it.
tube(wood,[(1,0,.08),(.9,.1,1.1),(1.35,.14,2.4),(1.1,.24,3.8),(1.5,.3,5.2),(1.1,.45,6.4)],.95,.34,18,48,color=(.25,.145,.075),ridge=.2)
for i in range(5):
    phase=math.tau*i/5;pts=[]
    for j in range(12):
        t=j/11;a=phase+t*2.1;r=.66*(1-t*.53)
        pts.append((1+math.cos(a)*r+.24*math.sin(t*4),math.sin(a)*r+.26*t,.22+t*5.3))
    tube(wood,pts,.34,.008,10,42,color=(.29,.18,.09),ridge=.14)
    if i in (1,3):tube(sap,[(x,y-.16,z) for x,y,z in pts],.012,.007,4,42)
for i in range(11):
    a=i/11*math.tau;r=random.uniform(2.25,2.9)
    p=[(1+math.cos(a)*.48,math.sin(a)*.48,1.15),(1+math.cos(a)*1.12,math.sin(a)*.95,.36),(1+math.cos(a+.15)*r*.77,math.sin(a+.15)*r*.63,.17),(1+math.cos(a+.22)*r,math.sin(a+.22)*r*.82,.08)]
    tube(wood,p,.31,.018,9,25,color=(.27,.165,.08),ridge=.14)
    end=Vector(p[-1]);start=Vector(p[-2])
    for side in (-1,1):tube(wood,[start,(start+end)/2+Vector((.12*side,0,.03)),end+Vector((.15*side,.14,.005))],.075,.007,6,13)

# A single hero limb cradles the first realm, with a returning root underneath.
hero=[(1,0,2.4),(-.25,-.15,3.0),(-1.75,-.1,2.55),(-3.5,-.30,2.25),(-4.6,-.4,2.6)]
tube(wood,hero,.58,.18,14,40,color=(.27,.17,.09),ridge=.14)
tube(wood,[(1.2,.2,.5),(.1,-.1,1.35),(-1.45,.0,1.25),(-3.7,-.20,1.8),(-4.85,-.4,2.5)],.38,.09,10,40,color=(.25,.14,.07))
tube(sap,[(x,y-.29,z+.12) for x,y,z in hero],.025,.015,5,35)

# Seven curved limbs and separated lobes form an asymmetrical vaulted canopy.
limbs=[
 [(1.1,.1,3.7),(-.3,.15,4.7),(-2.0,.6,6.0),(-4.2,.5,6.4),(-5.0,.55,7.05)],
 [(1.2,.2,4.5),(.5,.6,5.8),(-1.1,.9,7.4),(-2.8,1.2,8.1)],
 [(1.2,.3,4.8),(1.5,.7,6.4),(.8,.9,7.9),(1.1,1,9.2)],
 [(1.2,.2,4.0),(2.45,.6,5.2),(4,.7,5.9),(5.5,.8,7.1)],
 [(1.4,.4,4.8),(2.5,1.1,6.4),(3.8,1.7,7.6),(4.25,1.8,8.3)],
 [(1.2,.4,5.1),(.8,2.0,6.4),(-.2,3.2,7.1),(-1.1,3.4,8.0)],
 [(1.4,.4,5.1),(2,2.0,6.1),(3.5,3.0,6.8),(4.6,3.3,7.1)]
]
tips=[]
for i,points in enumerate(limbs):
    pts=tube(wood,points,.40 if i<5 else .30,.037,10,32,color=(.29,.18,.09),ridge=.15)
    for k in (15,23,30):
        base=pts[k];side=-1 if k%2 else 1;delta=Vector((side*(.75+random.random()*.4),random.uniform(-.75,.65),.7+random.random()*.6))
        end=base+delta;mid=base+delta*.5+Vector((0,0,.20))
        tube(wood,[base,mid,end],.13,.015,7,16,color=(.3,.185,.09))
        crown(end+Vector((0,0,.18)),1.03+random.random()*.3,185);tips.append(end)
        for side2 in (-1,1):
            q=end+Vector((.52*side2,.25,.25));tube(wood,[end,end+Vector((.25*side2,.12,.2)),q],.035,.006,5,9)
    crown(pts[-1]+Vector((0,0,.15)),1.3,245)
    if i in (0,2,3):tube(sap,[(p.x,p.y-.11,p.z+.08) for p in pts],.014,.003,4,30)

# Hanging tendrils are thin and curved, never straight needles.
for i in range(15):
    p=random.choice(tips);length=random.uniform(.35,.95);end=p+Vector((.13,.04,-length))
    tube(wood,[p,p+Vector((-.07,.06,-length*.45)),end],.013,.003,5,12)
    gem(lights,end,.025)

# REALM I: a carved circular observatory with a brass armillary instrument.
cx,cy,cz=-4.65,-.45,2.65
island((cx,cy,cz),1.82,1.4)
for i in range(3):
    radius=1.65-i*.10;z=cz+.10+i*.10
    ring(masonry,(cx,cy,z),radius,.095,(.34+i*.035,.36+i*.035,.31+i*.03))
ring(metal,(cx,cy,cz+.42),1.33,.025,(.5,.32,.12))
# Radial tiles and a compass rose establish a constructed surface.
for i in range(12):
    a=i*math.tau/12
    block(masonry,(cx+math.cos(a)*.94,cy+math.sin(a)*.94,cz+.28),(.72,.44,.12),(.33,.35,.29),a)
    tube(metal,[(cx+math.cos(a)*.65,cy+math.sin(a)*.65,cz+.36),(cx+math.cos(a)*1.24,cy+math.sin(a)*1.24,cz+.36)],.012,.012,4,3,color=(.46,.30,.12),ridge=0)
# Four tapered classical piers on the back half; an open arcade leaves the apparatus legible.
for angle in (.15,1.05,1.95,2.85):
    x=cx+math.cos(angle)*1.40;y=cy+math.sin(angle)*1.40
    block(masonry,(x,y,cz+.45),(.34,.34,.25),(.34,.36,.31))
    tube(masonry,[(x,y,cz+.55),(x,y,cz+1.78)],.12,.095,10,4,color=(.39,.41,.34),ridge=.06)
    block(masonry,(x,y,cz+1.83),(.35,.35,.14),(.42,.44,.36))
    ring(metal,(x,y,cz+.64),.125,.025,(.4,.27,.105),segments=24)
    gem(lights,(x,y,cz+1.98),.067)
for start in (.15,1.05,1.95):
    pts=[]
    for j in range(14):
        t=j/13;a=start+.9*t;pts.append((cx+math.cos(a)*1.4,cy+math.sin(a)*1.4,cz+1.84+.32*math.sin(t*math.pi)))
    tube(masonry,pts,.08,.08,8,20,color=(.39,.4,.33),ridge=0)
# Central brass mechanism: three intersecting rings, enamel core, four cardinal markers.
tube(masonry,[(cx,cy,cz+.30),(cx,cy,cz+.77)],.29,.20,16,6,color=(.39,.39,.31),ridge=0)
ring(metal,(cx,cy,cz+.8),.31,.055,(.5,.32,.13),segments=40)
center=(cx,cy,cz+1.42)
ring(metal,center,.66,.043,(.48,.30,.105),'Y')
ring(metal,center,.60,.035,(.56,.36,.13),'X')
ring(metal,center,.57,.027,(.4,.26,.10),'Z')
ellipsoid(slate,center,(.24,.24,.24),(.027,.11,.12),20,12,0)
ring(lights,center,.245,.014,(.15,.8,.66),'Z',40)
for a in (0,math.pi/2,math.pi,3*math.pi/2):
    gem(sap,(cx+.73*math.cos(a),cy,cz+1.42+.73*math.sin(a)),.043,(1,.5,.14))
# Telescope with a distinct cylindrical silhouette at the near-right edge.
base=Vector((cx+.85,cy-.63,cz+.40));head=base+Vector((0,0,.85))
for a in (0,2.1,4.2):tube(metal,[base+Vector((math.cos(a)*.23,math.sin(a)*.23,0)),head],.027,.022,6,4,color=(.35,.22,.075),ridge=0)
end=head+Vector((-.65,-.32,.32))
tube(metal,[head+Vector((.2,.1,-.1)),end],.10,.16,14,8,color=(.4,.27,.1),ridge=0)
ellipsoid(slate,end,(.12,.12,.1),(.02,.15,.18),12,6,0)
# Workbench and open folio: a programming world suggested through instruments and construction.
block(masonry,(cx-.77,cy-.65,cz+.65),(.73,.38,.09),(.34,.34,.27),-.15)
for dx in (-.26,.26):block(metal,(cx-.77+dx,cy-.65,cz+.48),(.055,.055,.3),(.36,.24,.09))
block(slate,(cx-.78,cy-.65,cz+.72),(.43,.29,.045),(.045,.10,.11),-.15)
for dx in (-.12,0,.12):tube(sap,[(cx-.78+dx,cy-.74,cz+.75),(cx-.76+dx,cy-.57,cz+.75)],.007,.007,4,3,ridge=0)
# Tiny suspended code brackets above the folio are readable in the close view.
for side in (-1,1):
    x=cx-.78+side*.14
    tube(lights,[(x,cy-.73,cz+1.06),(x+side*.10,cy-.73,cz+.96),(x,cy-.73,cz+.86)],.011,.011,5,9,color=(.1,.8,.65),ridge=0)
# Steps lead out from the observatory toward the supporting bough.
for i in range(7):
    block(masonry,(cx+1.25+i*.19,cy-.35,cz+.24-i*.09),(.33,.70,.16),(.28+i*.008,.30+i*.008,.27),.15)
# Small rear ruin and meadow details add scale without introducing competing worlds.
for i in range(5):
    a=i*.27+.4;x=1+math.cos(a)*2.55;y=math.sin(a)*2.1
    block(stones,(x,y,.23),(.3,.4,.43),(.21,.23,.19),a)
for i in range(45):
    a=random.random()*math.tau;r=random.uniform(2,3.1);p=Vector((1+math.cos(a)*r,math.sin(a)*r*.8,.10))
    for j in range(3):rounded_leaf(p+Vector((0,0,.04*j)),.11,Vector((math.cos(a),math.sin(a),1)),(.18,.29,.1))

# A narrow, irregular cascade fades into mist, with an actual stream above the rim.
for strand in range(9):
    x=2.0+(strand-4)*.054;start=len(river.v)
    for j in range(32):
        t=j/31
        if t<.22:
            u=t/.22;p=Vector((x-.25*(1-u),-2.58+1.3*(1-u),.09-.13*u));alpha=.48
        else:
            u=(t-.22)/.78;p=Vector((x+.04*math.sin(u*9+strand),-2.58-.13*u,-.04-u*4.3));alpha=.48*(1-u)**.65
        for side in (-1,1):river.vertex(p+Vector((side*.043,0,0)),(.15,.48,.48,alpha))
        if j:river.f.append((start+(j-1)*2,start+(j-1)*2+1,start+j*2+1,start+j*2))

objects=[wood.object('Yggdrasil | sculpted heartwood',bark),foliage.object('Yggdrasil | oval clustered canopy',leaves),sap.object('Yggdrasil | golden sap paths',vein),lights.object('Observatory | living light',teal),stones.object('Islands | weathered strata',rock),river.object('Cascade | falling veil',water),metal.object('Observatory | brass instruments',bronze),masonry.object('Observatory | stone arcade',ivory),moss.object('Islands | moss cushions',mossmat),slate.object('Observatory | enamel and folio',slatemat)]
for ob in (objects[4],objects[7]):
    for p in ob.data.polygons:p.use_smooth=False
leaves.use_backface_culling=False
for name,location in [('Realm_Programming',(cx,cy,cz+1.4)),('Tree_Heart',(1,0,3.7))]:
    ob=bpy.data.objects.new(name,None);asset.objects.link(ob);ob.location=location;ob['semantic_anchor']=True

def area(name,loc,color,power,size,target=(0,0,3)):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
    ob=bpy.data.objects.new(name,d);stage.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
area('Key | late golden light',(-5,-9,14),(1,.78,.48),1900,7)
area('Rim | cool starlight',(7,4,12),(.35,.66,1),2400,6)
area('Fill | indigo bounce',(-9,3,7),(.36,.46,1),1000,8)
area('Observatory | warm pool',(-5,-3,7),(1,.69,.3),180,3,(-4.65,0,3))
scene=bpy.context.scene;scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.016,.025,.055,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
d=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('CAM | three realms composition',d);stage.objects.link(cam)
cam.location=(10,-26,12);target=Vector((-.35,0,3.5));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=20.2;scene.camera=cam
scene.render.engine='BLENDER_EEVEE';scene.eevee.use_gtao=True;scene.eevee.gtao_distance=2.3;scene.eevee.gtao_factor=1.32;scene.eevee.use_bloom=True;scene.eevee.bloom_intensity=.095;scene.eevee.taa_render_samples=64
scene.view_settings.view_transform='Filmic';scene.view_settings.look='Medium High Contrast';scene.view_settings.exposure=.25
scene.render.resolution_x=1600;scene.render.resolution_y=1400;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene['asset_notes']='Original Blender prototype: Yggdrasil + one completed programming realm. Ten merged materials. No third-party geometry. Built for web, no external provider.'
bpy.ops.object.select_all(action='DESELECT')
for ob in asset.objects:ob.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Yggdrasil_Three_Realms.blend'))
def export(path):
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_colors=True,export_tangents=True,export_extras=True,export_cameras=False,export_lights=False,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=14)
export(OUT/'yggdrasil-realms.glb')
stats={'meshes':len(objects),'materials':10,'triangles':sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in objects),'bytes':(OUT/'yggdrasil-realms.glb').stat().st_size}
(OUT/'metrics.json').write_text(json.dumps(stats,indent=2))
scene.render.filepath=str(OUT/'composition.png');bpy.ops.render.render(write_still=True)
scene.render.image_settings.file_format='WEBP';scene.render.image_settings.quality=86;bpy.data.images['Render Result'].save_render(str(OUT/'composition.webp'),scene=scene)
cam.location=(-9,-14,8);cam.rotation_euler=(Vector((-4.2,0,3.8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=6.8
scene.render.resolution_x=1300;scene.render.resolution_y=1100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'observatory-detail.png');bpy.ops.render.render(write_still=True)
print('REALMS_METRICS '+json.dumps(stats))

