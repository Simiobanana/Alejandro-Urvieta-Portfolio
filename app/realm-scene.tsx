"use client";

import { useEffect, useRef } from 'react';
import { realms, type RealmStatus, type RealmView } from '@/lib/portfolio-realms';

export type RealmSceneProps = {
  view: RealmView;
  night: boolean;
  motion: boolean;
  pose: number;
  onStatus: (status: RealmStatus) => void;
  className?: string;
  label?: string;
  active?: boolean;
};

export default function RealmScene({ view, night, motion, pose, onStatus, className, label, active = true }: RealmSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ view, night, motion, pose, active });
  const statusCallback = useRef(onStatus);
  const wake = useRef<() => void>(() => {});

  useEffect(() => { statusCallback.current = onStatus; }, [onStatus]);
  useEffect(() => {
    state.current = { view, night, motion, pose, active };
    wake.current();
  }, [view, night, motion, pose, active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false, released = false, contextLost = false;
    const disposers: (() => void)[] = [];
    const cleanup = () => {
      if (released) return;
      released = true;
      wake.current = () => {};
      for (const dispose of disposers.reverse()) dispose();
    };
    statusCallback.current('loading');

    const run = async () => {
      try {
        const [T, { GLTFLoader }, { DRACOLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
          import('three'), import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('three/examples/jsm/loaders/DRACOLoader.js'), import('three/examples/jsm/controls/OrbitControls.js'),
          import('three/examples/jsm/environments/RoomEnvironment.js'),
        ]);
        if (disposed) return;
        const mobile = matchMedia('(max-width:700px)').matches;
        const coarse = matchMedia('(pointer:coarse)');
        const reduced = matchMedia('(prefers-reduced-motion:reduce)');
        const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'default' });
        disposers.push(() => renderer.dispose());
        renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.7));
        renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFShadowMap;
        const scene = new T.Scene(), camera = new T.PerspectiveCamera(36, 1, .1, 100);
        camera.position.set(10, 12, 26);
        const target = new T.Vector3(-.35, 3.5, 0);
        camera.lookAt(target);
        const controls = new OrbitControls(camera, canvas);
        disposers.push(() => controls.dispose());
        controls.target.copy(target);
        controls.enablePan = false; controls.enableZoom = false; controls.enableDamping = false;
        controls.enableRotate = !coarse.matches; controls.enabled = state.current.active && !coarse.matches;
        canvas.style.touchAction = 'pan-y';
        controls.minPolarAngle = .45; controls.maxPolarAngle = 1.6;
        const pmrem = new T.PMREMGenerator(renderer), room = new RoomEnvironment();
        let env: import('three').WebGLRenderTarget;
        try { env = pmrem.fromScene(room, .04); } finally { room.dispose(); pmrem.dispose(); }
        disposers.push(() => env.dispose());
        scene.environment = env.texture; scene.environmentIntensity = .32;
        const hemi = new T.HemisphereLight(0xb4c7e9, 0x172522, 1.45); scene.add(hemi);
        const key = new T.DirectionalLight(0xffd1a0, 3.1); key.position.set(-5, 14, 10); key.castShadow = true;
        disposers.push(() => key.shadow.dispose());
        key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
        Object.assign(key.shadow.camera, { left: -12, right: 12, top: 13, bottom: -8, near: 1, far: 45 });
        key.shadow.normalBias = .025; key.shadow.bias = -.00015; key.target.position.set(0, 3, 0); scene.add(key, key.target);
        const rim = new T.DirectionalLight(0x7ab5ff, 2.4); rim.position.set(6, 10, -7); scene.add(rim);
        const fill = new T.DirectionalLight(0x91a1ee, .6); fill.position.set(-10, 7, -4); scene.add(fill);
        const lamp = new T.PointLight(0xffca7c, 5, 5, 2); lamp.position.set(-4.65, 4.5, 1); scene.add(lamp);
        const decoder = new DRACOLoader(); decoder.setDecoderPath('/draco/'); decoder.setWorkerLimit(1);
        disposers.push(() => decoder.dispose());
        const loader = new GLTFLoader(); loader.setDRACOLoader(decoder);
        const resource: {model?: import('three').Group} = {};
        const disposeModel = (object: import('three').Group) => {
          const geometries = new Set<import('three').BufferGeometry>();
          const materials = new Set<import('three').Material>(), textures = new Set<import('three').Texture>();
          object.traverse(o => {
            if (!(o instanceof T.Mesh)) return;
            geometries.add(o.geometry);
            for (const mat of Array.isArray(o.material) ? o.material : [o.material]) {
              materials.add(mat);
              for (const value of Object.values(mat)) if (value instanceof T.Texture) textures.add(value);
            }
          });
          geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
        };
        disposers.push(() => { if (resource.model) disposeModel(resource.model); });
        let frame = 0, last = 0, visible = true, dirty = true, flight = true, ready = false;
        let currentView: RealmView = 'tree', currentPose = state.current.pose, blend = 1, seconds = 0;
        const destination = new T.Vector3(), aim = new T.Vector3(), waterClock = { value: 0 };
        const shouldRender = () => ready && !released && !contextLost && visible && !document.hidden && state.current.active;
        const desired = () => {
          const selected = state.current.view;
          if (selected !== 'tree') {
            const realm = realms[selected], anchor = resource.model?.getObjectByName(realm.anchor);
            if (anchor) anchor.getWorldPosition(aim); else aim.fromArray(realm.fallback);
            // Include the root cradle beneath each realm, not just its upper landmark.
            aim.y -= .5;
            const distance = Math.max(5.4, 6.2 / camera.aspect) / (2 * Math.tan(Math.PI * 18 / 180));
            destination.fromArray(realm.direction).normalize().multiplyScalar(distance).add(aim);
          } else {
            const distance = Math.max(16.8, 18.8 / camera.aspect) / (2 * Math.tan(Math.PI * 18 / 180));
            const heart = resource.model?.getObjectByName('Tree_Heart');
            if (heart) heart.getWorldPosition(aim); else aim.set(1, 3.7, 0);
            aim.x = 0; aim.z = .5;
            destination.set(5.5, 7.5, 28).normalize().multiplyScalar(distance).add(aim);
          }
        };
        const schedule = () => { if (shouldRender() && !frame) frame = requestAnimationFrame(draw); };
        const refresh = () => {
          controls.enabled = state.current.active && !coarse.matches;
          controls.enableRotate = !coarse.matches;
          dirty = true;
          if (!shouldRender()) { cancelAnimationFrame(frame); frame = 0; last = 0; }
          else schedule();
        };
        const draw = (now: number) => {
          frame = 0;
          if (!shouldRender()) return;
          if (now - last < 1000 / 30) { schedule(); return; }
          const dt = last ? Math.min((now - last) * .001, .05) : 0; last = now;
          const animate = state.current.motion && !reduced.matches;
          if (currentView !== state.current.view || currentPose !== state.current.pose) {
            currentView = state.current.view; currentPose = state.current.pose; flight = true; dirty = true; desired();
          }
          const goal = state.current.night ? 1 : 0;
          const lighting = Math.abs(goal - blend) > .001;
          if (lighting) { blend += (goal - blend) * (animate ? .07 : 1); dirty = true; }
          hemi.intensity = 1.8 - blend * .65; key.intensity = 3.5 - blend * .7;
          rim.intensity = 1.1 + blend * 1.2; scene.environmentIntensity = .4 - blend * .16;
          if (flight) {
            const step = animate ? .07 : 1;
            camera.position.lerp(destination, step); controls.target.lerp(aim, step); controls.update(); dirty = true;
            if (camera.position.distanceTo(destination) < .008 && controls.target.distanceTo(aim) < .008) flight = false;
          }
          if (animate) { seconds += dt; waterClock.value = seconds; lamp.intensity = 5 + Math.sin(seconds * .8) * .35; dirty = true; }
          if (dirty) { renderer.render(scene, camera); dirty = false; }
          if (animate || flight || lighting) schedule();
        };
        wake.current = refresh;
        disposers.push(() => cancelAnimationFrame(frame));
        const resize = () => {
          const box = canvas.getBoundingClientRect();
          renderer.setSize(Math.max(1, box.width), Math.max(1, box.height), false);
          camera.aspect = Math.max(1, box.width) / Math.max(1, box.height); camera.updateProjectionMatrix();
          desired(); flight = true; refresh();
        };
        const ro = new ResizeObserver(resize); disposers.push(() => ro.disconnect()); ro.observe(canvas); resize();
        const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh(); });
        disposers.push(() => io.disconnect()); io.observe(canvas);
        const change = () => { dirty = true; schedule(); }, start = () => { flight = false; };
        controls.addEventListener('change', change); controls.addEventListener('start', start);
        const lost = (event: Event) => {
          event.preventDefault(); contextLost = true; cleanup();
          if (!disposed) statusCallback.current('fallback');
        };
        canvas.addEventListener('webglcontextlost', lost);
        document.addEventListener('visibilitychange', refresh);
        coarse.addEventListener('change', refresh); reduced.addEventListener('change', refresh);
        disposers.push(() => {
          canvas.removeEventListener('webglcontextlost', lost); document.removeEventListener('visibilitychange', refresh);
          coarse.removeEventListener('change', refresh); reduced.removeEventListener('change', refresh);
          controls.removeEventListener('change', change); controls.removeEventListener('start', start);
        });
        // One asset request for this mounted scene, independent of controls or callback identity.
        const gltf = await loader.loadAsync('/models/yggdrasil-realms/yggdrasil-realms.glb');
        if (disposed || released) { disposeModel(gltf.scene); return; }
        const model = gltf.scene; resource.model = model;
        model.traverse(o => {
          if (!(o instanceof T.Mesh)) return;
          o.castShadow = true; o.receiveShadow = true;
          for (const mat of Array.isArray(o.material) ? o.material : [o.material]) {
            if (mat.name.startsWith('Jade foliage')) {
              mat.onBeforeCompile = (s: import('three').WebGLProgramParametersWithUniforms) => {
                s.uniforms.studyTime = waterClock;
                s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float studyTime;').replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.x += sin(position.y*.8+position.x*1.7+studyTime*.65)*.025;transformed.z += cos(position.x+studyTime*.5)*.018;');
              };
            }
            if (mat.name.startsWith('Waterfall')) {
              o.castShadow = false; mat.depthWrite = false;
              mat.onBeforeCompile = (s: import('three').WebGLProgramParametersWithUniforms) => {
                s.uniforms.studyTime = waterClock;
                s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying float fallY;').replace('#include <begin_vertex>', '#include <begin_vertex>\nfallY=position.y;');
                s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nuniform float studyTime;varying float fallY;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb*=.78+.22*sin(fallY*15.0+studyTime*4.0);');
              };
            }
          }
        });
        scene.add(model); desired(); camera.position.copy(destination); controls.target.copy(aim); controls.update();
        ready = true;
        if (shouldRender()) renderer.render(scene, camera);
        statusCallback.current('ready'); refresh();
      } catch (error) {
        cleanup();
        if (!disposed && !contextLost) { console.warn('Yggdrasil uses its Blender preview.', error); statusCallback.current('fallback'); }
      }
    };
    void run();
    return () => { disposed = true; cleanup(); };
  }, []);

  return <canvas className={className} ref={canvasRef} aria-label={label ?? 'Yggdrasil with three realms: observatory, sanctuary and threshold. Use the realm buttons to explore; on desktop, drag to rotate.'} />;
}
