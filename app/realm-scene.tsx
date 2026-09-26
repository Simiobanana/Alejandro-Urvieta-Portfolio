"use client";

import { useEffect, useRef } from 'react';
import { realmIds, realms, type RealmId, type RealmStatus, type RealmView } from '@/lib/portfolio-realms';

export type RealmSceneProps = {
  view: RealmView;
  night: boolean;
  motion: boolean;
  pose: number;
  onStatus: (status: RealmStatus) => void;
  onSelect?: (realm: RealmId) => void;
  className?: string;
  label?: string;
  active?: boolean;
};

export default function RealmScene({ view, night, motion, pose, onStatus, onSelect, className, label, active = true }: RealmSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ view, night, motion, pose, active });
  const statusCallback = useRef(onStatus);
  const selectCallback = useRef(onSelect);
  const wake = useRef<() => void>(() => {});

  useEffect(() => { statusCallback.current = onStatus; }, [onStatus]);
  useEffect(() => { selectCallback.current = onSelect; }, [onSelect]);
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
        // The tree and lights stay in place; leaf sway does not need a full shadow pass.
        renderer.shadowMap.autoUpdate = false;
        renderer.shadowMap.needsUpdate = true;
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
        const raycaster = new T.Raycaster(), pointer = new T.Vector2();
        const hitBounds = realmIds.map(id => {
          const center = new T.Vector3().fromArray(realms[id].hitCenter);
          const size = new T.Vector3().fromArray(realms[id].hitHalfSize).multiplyScalar(2);
          return { id, box: new T.Box3().setFromCenterAndSize(center, size) };
        });
        const pickRealm = (event: PointerEvent, precise: boolean): RealmId | null => {
          if (!resource.model || !state.current.active || !selectCallback.current) return null;
          const rect = canvas.getBoundingClientRect();
          pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
          raycaster.setFromCamera(pointer, camera);
          const candidates = hitBounds.filter(({box}) => raycaster.ray.intersectsBox(box));
          if (!candidates.length) return null;
          if (!precise) return candidates[0].id;
          // Meshes are merged by material. Identify the visible surface by its world-space bounds.
          const hit = raycaster.intersectObject(resource.model, true)[0];
          return hit ? candidates.find(({box}) => box.containsPoint(hit.point))?.id ?? null : null;
        };
        let pressed: {id:number;x:number;y:number;moved:boolean} | null = null;
        const pointerDown = (event: PointerEvent) => {
          if (!event.isPrimary || event.button !== 0) { pressed = null; return; }
          pressed = {id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
        };
        const pointerMove = (event: PointerEvent) => {
          if (pressed && Math.hypot(event.clientX - pressed.x,event.clientY - pressed.y) > (event.pointerType === 'mouse' ? 7 : 12)) pressed.moved = true;
          if (event.pointerType === 'mouse') canvas.style.cursor = pressed?.moved ? 'grabbing' : pickRealm(event,false) ? 'pointer' : 'grab';
        };
        const pointerUp = (event: PointerEvent) => {
          const tap = pressed; pressed = null;
          if (!tap || tap.id !== event.pointerId || tap.moved || Math.hypot(event.clientX - tap.x,event.clientY - tap.y) > 12) return;
          const id = pickRealm(event,true);
          if (id) selectCallback.current?.(id);
        };
        const pointerCancel = () => { pressed = null; canvas.style.cursor = coarse.matches ? 'auto' : 'grab'; };
        canvas.addEventListener('pointerdown', pointerDown, {passive:true});
        canvas.addEventListener('pointermove', pointerMove, {passive:true});
        canvas.addEventListener('pointerup', pointerUp, {passive:true});
        canvas.addEventListener('pointercancel', pointerCancel, {passive:true});
        canvas.addEventListener('pointerleave', pointerCancel, {passive:true});
        disposers.push(() => {
          canvas.removeEventListener('pointerdown',pointerDown); canvas.removeEventListener('pointermove',pointerMove);
          canvas.removeEventListener('pointerup',pointerUp); canvas.removeEventListener('pointercancel',pointerCancel);
          canvas.removeEventListener('pointerleave',pointerCancel);
        });
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
        const interval = 1000 / 60;
        let frame = 0, last = 0, lastTick = 0, accumulated = interval, visible = true, dirty = true, flight = true, ready = false;
        const maxDpr = Math.min(devicePixelRatio, mobile ? 1.25 : 1.7);
        let pixelRatio = maxDpr, qualityMs = 0, qualityFrames = 0, stableWindows = 0;
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
          if (!shouldRender()) { cancelAnimationFrame(frame); frame = 0; last = 0; lastTick = 0; accumulated = interval; }
          else schedule();
        };
        let sampleStart = 0, sampleFrames = 0, sampleSubmitMs = 0;
        const draw = (now: number) => {
          frame = 0;
          if (!shouldRender()) return;
          // Keep the remainder so 60/120/144 Hz displays do not lose cadence to rounding.
          accumulated += lastTick ? now - lastTick : 0; lastTick = now;
          if (accumulated + .5 < interval) { schedule(); return; }
          accumulated = Math.max(0, accumulated - interval * Math.max(1, Math.floor((accumulated + .5) / interval)));
          const elapsed = last ? now - last : 1000 / 60;
          const dt = Math.min(elapsed * .001, .1); last = now;
          if (state.current.motion && !reduced.matches) {
            qualityMs += Math.min(elapsed,100); qualityFrames++;
            if (qualityMs >= 1500) {
              const average = qualityMs / qualityFrames;
              stableWindows = average < 19 ? stableWindows + 1 : 0;
              // Averages also recover sharpness on 90/144 Hz displays with alternating intervals.
              const nextRatio = average > 25 ? Math.max(.8,pixelRatio - .2) : stableWindows >= 4 ? Math.min(maxDpr,pixelRatio + .1) : pixelRatio;
              if (nextRatio !== pixelRatio) { pixelRatio = nextRatio; renderer.setPixelRatio(pixelRatio); stableWindows = 0; dirty = true; }
              qualityMs = 0; qualityFrames = 0;
            }
          }
          const animate = state.current.motion && !reduced.matches;
          if (currentView !== state.current.view || currentPose !== state.current.pose) {
            currentView = state.current.view; currentPose = state.current.pose; flight = true; dirty = true; desired();
          }
          const goal = state.current.night ? 1 : 0;
          const lighting = Math.abs(goal - blend) > .001;
          if (lighting) { blend += (goal - blend) * (animate ? 1 - Math.exp(-4.5 * dt) : 1); dirty = true; }
          hemi.intensity = 1.8 - blend * .65; key.intensity = 3.5 - blend * .7;
          rim.intensity = 1.1 + blend * 1.2; scene.environmentIntensity = .4 - blend * .16;
          if (flight) {
            const step = animate ? 1 - Math.exp(-5.5 * dt) : 1;
            camera.position.lerp(destination, step); controls.target.lerp(aim, step); controls.update(); dirty = true;
            if (camera.position.distanceTo(destination) < .008 && controls.target.distanceTo(aim) < .008) flight = false;
          }
          if (animate) { seconds += dt; waterClock.value = seconds; lamp.intensity = 5 + Math.sin(seconds * .8) * .35; dirty = true; }
          if (dirty) {
            const started = performance.now();
            renderer.render(scene, camera); dirty = false;
            if (process.env.NODE_ENV !== 'production') {
              sampleSubmitMs += performance.now() - started; sampleFrames++;
              if (!sampleStart) sampleStart = now;
              if (now - sampleStart >= 2000) {
                canvas.dataset.fps = (sampleFrames * 1000 / (now - sampleStart)).toFixed(1);
                canvas.dataset.submitMs = (sampleSubmitMs / sampleFrames).toFixed(2);
                canvas.dataset.drawCalls = String(renderer.info.render.calls);
                canvas.dataset.triangles = String(renderer.info.render.triangles);
                canvas.dataset.pixelRatio = String(pixelRatio);
                sampleStart = now; sampleFrames = 0; sampleSubmitMs = 0;
              }
            }
          }
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
        let resizeFrame = 0;
        const ro = new ResizeObserver(() => {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; if (!released) resize(); });
        });
        disposers.push(() => { ro.disconnect(); cancelAnimationFrame(resizeFrame); }); ro.observe(canvas); resize();
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
        scene.add(model); renderer.shadowMap.needsUpdate = true; desired(); camera.position.copy(destination); controls.target.copy(aim); controls.update();
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
