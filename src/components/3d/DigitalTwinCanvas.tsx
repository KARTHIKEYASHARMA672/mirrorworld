import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraMode, ViewOverlayMode } from '../../types/simulation';
import { SimulationEngine } from '../../simulation/simulationEngine';
import { Factory3DScene } from './Factory3DScene';
import { Warehouse3DScene } from './Warehouse3DScene';

interface DigitalTwinCanvasProps {
  engine: SimulationEngine;
  cameraMode: CameraMode;
  overlayMode: ViewOverlayMode;
  onSelectEntity: (id: string, type: 'machine' | 'worker' | 'agv' | 'product') => void;
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  engine,
  cameraMode,
  overlayMode,
  onSelectEntity
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  const factorySceneRef = useRef<Factory3DScene | null>(null);
  const warehouseSceneRef = useRef<Warehouse3DScene | null>(null);

  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const orbitSphericalRef = useRef({ radius: 36, theta: Math.PI * 0.25, phi: Math.PI * 0.32 });
  const orbitTargetRef = useRef(new THREE.Vector3(0, 1.5, 0));

  const fpPosRef = useRef(new THREE.Vector3(0, 1.7, 12));
  const fpYawRef = useRef(0);
  const fpPitchRef = useRef(0);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF5EFE2);
    scene.fog = new THREE.FogExp2(0xF5EFE2, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(22, 24, 28);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xFFF9EE, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xFFFDF7, 0xDDD6C6, 0.6);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFFAF0, 1.4);
    dirLight.position.set(30, 45, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    const shadowD = 35;
    dirLight.shadow.camera.left = -shadowD;
    dirLight.shadow.camera.right = shadowD;
    dirLight.shadow.camera.top = shadowD;
    dirLight.shadow.camera.bottom = -shadowD;
    dirLight.shadow.bias = -0.0003;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x30356F, 0.35);
    fillLight.position.set(-25, 20, -25);
    scene.add(fillLight);

    const factoryScene = new Factory3DScene();
    factorySceneRef.current = factoryScene;

    const warehouseScene = new Warehouse3DScene();
    warehouseSceneRef.current = warehouseScene;

    factoryScene.populateMachines(engine.machines);
    factoryScene.populateWorkers(engine.workers);
    factoryScene.updateConveyors(engine.conveyors);

    warehouseScene.populateWarehouse(engine.machines, engine.agvs, engine.workers);

    if (engine.facility === 'factory') {
      scene.add(factoryScene.group);
    } else {
      scene.add(warehouseScene.group);
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDraggingRef.current = true;
        prevMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      if (cameraMode === 'first_person') {
        fpYawRef.current -= dx * 0.003;
        fpPitchRef.current = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, fpPitchRef.current - dy * 0.003));
      } else {
        orbitSphericalRef.current.theta -= dx * 0.006;
        orbitSphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI * 0.45, orbitSphericalRef.current.phi - dy * 0.006));
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitSphericalRef.current.radius = Math.max(6, Math.min(70, orbitSphericalRef.current.radius + e.deltaY * 0.03));
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const activeGroup = engine.facility === 'factory' ? factoryScene.group : warehouseScene.group;
      const intersects = raycaster.intersectObjects(activeGroup.children, true);

      if (intersects.length > 0) {
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr && curr !== activeGroup) {
          const m = engine.machines.find(x => x.id === curr?.name);
          if (m) {
            onSelectEntity(m.id, 'machine');
            return;
          }
          const w = engine.workers.find(x => x.id === curr?.name);
          if (w) {
            onSelectEntity(w.id, 'worker');
            return;
          }
          const agv = engine.agvs.find(x => x.id === curr?.name);
          if (agv) {
            onSelectEntity(agv.id, 'agv');
            return;
          }
          curr = curr.parent;
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      engine.tick(deltaSec);

      if (cameraMode === 'first_person') {
        const speed = 7.0 * deltaSec;
        const keys = keysPressedRef.current;
        const forward = new THREE.Vector3(Math.sin(fpYawRef.current), 0, Math.cos(fpYawRef.current)).negate();
        const right = new THREE.Vector3(forward.z, 0, -forward.x).negate();

        if (keys['KeyW'] || keys['ArrowUp']) fpPosRef.current.addScaledVector(forward, speed);
        if (keys['KeyS'] || keys['ArrowDown']) fpPosRef.current.addScaledVector(forward, -speed);
        if (keys['KeyA'] || keys['ArrowLeft']) fpPosRef.current.addScaledVector(right, -speed);
        if (keys['KeyD'] || keys['ArrowRight']) fpPosRef.current.addScaledVector(right, speed);

        camera.position.copy(fpPosRef.current);
        const lookTarget = new THREE.Vector3()
          .copy(fpPosRef.current)
          .add(new THREE.Vector3(
            Math.sin(fpYawRef.current) * Math.cos(fpPitchRef.current),
            Math.sin(fpPitchRef.current),
            -Math.cos(fpYawRef.current) * Math.cos(fpPitchRef.current)
          ));
        camera.lookAt(lookTarget);

      } else if (cameraMode === 'product_follow' && engine.activeProducts.length > 0) {
        const leader = engine.activeProducts[0];
        const targetPos = new THREE.Vector3(leader.x, leader.y + 2.5, leader.z + 4.5);
        camera.position.lerp(targetPos, 0.08);
        camera.lookAt(leader.x, leader.y + 0.6, leader.z);

      } else if (cameraMode === 'entity_orbit' && engine.selectedEntityId) {
        const targetM = engine.machines.find(m => m.id === engine.selectedEntityId);
        if (targetM) {
          orbitTargetRef.current.lerp(new THREE.Vector3(targetM.x, targetM.y + 1.2, targetM.z), 0.08);
        }
        const s = orbitSphericalRef.current;
        const cx = orbitTargetRef.current.x + s.radius * 0.6 * Math.sin(s.phi) * Math.sin(s.theta);
        const cy = orbitTargetRef.current.y + s.radius * 0.6 * Math.cos(s.phi);
        const cz = orbitTargetRef.current.z + s.radius * 0.6 * Math.sin(s.phi) * Math.cos(s.theta);
        camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.08);
        camera.lookAt(orbitTargetRef.current);

      } else {
        const s = orbitSphericalRef.current;
        const cx = orbitTargetRef.current.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta);
        const cy = orbitTargetRef.current.y + s.radius * Math.cos(s.phi);
        const cz = orbitTargetRef.current.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta);
        camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.1);
        camera.lookAt(orbitTargetRef.current);
      }

      if (engine.facility === 'factory') {
        factoryScene.updateProducts(engine.activeProducts);
        factoryScene.animate(engine.simClockSeconds, overlayMode, engine.machines, engine.workers);
      } else {
        warehouseScene.updateProducts(engine.activeProducts);
        warehouseScene.animate(engine.simClockSeconds, overlayMode, engine.agvs, engine.workers);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [engine.facility]);

  useEffect(() => {
    if (!sceneRef.current || !factorySceneRef.current || !warehouseSceneRef.current) return;
    const scene = sceneRef.current;
    scene.remove(factorySceneRef.current.group);
    scene.remove(warehouseSceneRef.current.group);

    if (engine.facility === 'factory') {
      factorySceneRef.current.populateMachines(engine.machines);
      factorySceneRef.current.populateWorkers(engine.workers);
      scene.add(factorySceneRef.current.group);
    } else {
      warehouseSceneRef.current.populateWarehouse(engine.machines, engine.agvs, engine.workers);
      scene.add(warehouseSceneRef.current.group);
    }
  }, [engine.facility, engine.machines.length]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#FFFCF4]/90 backdrop-blur-md border border-[#E4DDC9] px-3.5 py-2 rounded-xl shadow-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-[#245B45] animate-pulse" />
        <span className="text-xs font-bold tracking-wider text-[#171A35] uppercase">
          {cameraMode === 'god_view' && 'Tactical God View'}
          {cameraMode === 'first_person' && 'First-Person Operator View (WASD)'}
          {cameraMode === 'entity_orbit' && 'Entity Lock Orbit'}
          {cameraMode === 'product_follow' && 'Product Telemetry Cam'}
          {cameraMode === 'vr_spatial' && 'VR Spatial Preview'}
        </span>
        <span className="text-[11px] text-[#5E5E70] font-mono pl-2 border-l border-[#E4DDC9]">
          {engine.facility === 'factory' ? 'Plant: Precision SMT/CNC' : 'Plant: High-Bay Fulfillment'}
        </span>
      </div>

      {cameraMode === 'first_person' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-3 h-3 rounded-full border border-[#171A35]/50 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#30356F]" />
          </div>
          <div className="absolute bottom-6 bg-[#171A35]/80 text-[#FBF5E6] text-xs px-3 py-1.5 rounded-md font-mono backdrop-blur-sm">
            WASD to Walk · Drag Mouse to Look
          </div>
        </div>
      )}
    </div>
  );
};
