"use client";

import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
  MeshReflectorMaterial,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import TahoeModel, { type ResolvedAnchors } from "./TahoeModel";

interface Props {
  sensorsOn: boolean;
  interactive: boolean;
  /** false when the hero is offscreen — freezes the render loop */
  active: boolean;
  onReady: () => void;
  resetSignal: number;
}

const DEBUG_CAMS: Record<string, [number, number, number]> = {
  front: [0, 1.6, 10.6],
  rear: [0, 1.6, -10.6],
  left: [-10.6, 1.6, 0],
  right: [10.6, 1.6, 0],
};

export default function VehicleCanvas(props: Props) {
  const [ready, setReady] = useState(false);
  const debugCam =
    typeof window !== "undefined"
      ? DEBUG_CAMS[new URLSearchParams(window.location.search).get("cam") || ""]
      : undefined;

  const handleAnchors = useCallback((_a: ResolvedAnchors) => {
    setReady(true);
    props.onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Canvas
      frameloop={props.active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: debugCam || [8.1, 3.2, 12.8], fov: 36, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ touchAction: props.interactive ? "none" : "auto" }}
    >
      <color attach="background" args={["#05070a"]} />
      <fog attach="fog" args={["#05070a", 18, 42]} />

      <Suspense fallback={null}>
        <Scene ready={ready} resetSignal={props.resetSignal} debug={!!debugCam} interactive={props.interactive} />
        <TahoeModel sensorsOn={props.sensorsOn} onAnchors={handleAnchors} />
        <StudioEnvironment />
      </Suspense>
    </Canvas>
  );
}

/* ---------------- camera controls & framing ---------------- */

function Scene({ ready, resetSignal, debug, interactive }: { ready: boolean; resetSignal: number; debug?: boolean; interactive: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size, gl } = useThree();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRotate = useRef(!debug);
  const frameDist = useRef(8.1);
  const introT = useRef(debug ? 1 : 0);

  // responsive framing: pull the camera back on narrow/portrait viewports
  useEffect(() => {
    const aspect = size.width / size.height;
    const need = 6.8 / (0.65 * Math.max(0.4, aspect)); // fit ~6.8u of width
    frameDist.current = Math.max(8.1, need);
  }, [size.width, size.height]);

  // save initial state for double-click reset
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.target.set(0, 0.95, 0);
    c.update();
    c.saveState();
  }, [ready]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.reset();
    // restore the framed distance for the current aspect
    const dir = camera.position.clone().sub(c.target).normalize();
    camera.position.copy(c.target.clone().add(dir.multiplyScalar(frameDist.current)));
    c.update();
  }, [resetSignal]);

  // let touch gestures scroll the page when interaction is locked
  // (OrbitControls forces touch-action:none on the canvas at construction)
  useEffect(() => {
    gl.domElement.style.touchAction = interactive ? "none" : "auto";
  }, [interactive, gl]);

  // stop auto-rotate on interaction, resume after idle
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => {
      autoRotate.current = false;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        autoRotate.current = true;
      }, 5000);
    };
    c.addEventListener("start", stop);
    return () => {
      c.removeEventListener("start", stop);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // cinematic intro dolly
  useEffect(() => {
    if (introT.current >= 1) return;
    const start = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / 1800);
      introT.current = t;
      if (t < 1) requestAnimationFrame(tick);
    };
    tick();
  }, []);

  useThreeFrameSafe(() => {
    const c = controls.current;
    if (!c) return;
    // ease camera in from afar during intro
    if (introT.current < 1) {
      const e = 1 - Math.pow(1 - introT.current, 3);
      const r = frameDist.current * (1.85 - 0.85 * e);
      const dir = camera.position.clone().sub(c.target).normalize();
      camera.position.copy(c.target.clone().add(dir.multiplyScalar(r)));
    }
    c.autoRotate = autoRotate.current;
    c.autoRotateSpeed = 0.55;
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={interactive}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.85}
      minDistance={3.4}
      maxDistance={15}
      minPolarAngle={0.22}
      maxPolarAngle={Math.PI / 2 - 0.06}
      enablePan={false}
      target={[0, 0.95, 0]}
      zoomSpeed={0.8}
    />
  );
}

// small helper: run a per-frame callback
function useThreeFrameSafe(cb: (dt: number) => void) {
  useFrame((_, dt) => cb(dt));
}

/* ---------------- studio lighting & floor ---------------- */

function StudioEnvironment() {
  return (
    <>
      {/* key + rim lights */}
      <spotLight
        position={[8, 9, 6]}
        angle={0.5}
        penumbra={0.9}
        intensity={160}
        color="#e8f1ff"
        distance={40}
      />
      <spotLight
        position={[-9, 6, -7]}
        angle={0.6}
        penumbra={1}
        intensity={60}
        color="#7fb8ff"
        distance={40}
      />
      <ambientLight intensity={0.22} />

      {/* procedural studio environment — no external HDR needed */}
      <Environment resolution={128}>
        <Lightformer intensity={2.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[11, 11, 1]} color="#dfe9ff" />
        <Lightformer intensity={1.5} position={[-6, 2.4, 0]} rotation-y={Math.PI / 2} scale={[7, 1.6, 1]} color="#9fc4ff" />
        <Lightformer intensity={1.5} position={[6, 2.4, 0]} rotation-y={-Math.PI / 2} scale={[7, 1.6, 1]} color="#cfd8e8" />
        <Lightformer intensity={1.1} position={[0, 3, -7]} scale={[9, 2, 1]} color="#8fb4e8" />
        <Lightformer intensity={0.8} position={[0, 3, 7]} rotation-y={Math.PI} scale={[9, 2, 1]} color="#5a789c" />
      </Environment>

      {/* reflective showfloor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <circleGeometry args={[16, 72]} />
        <MeshReflectorMaterial
          blur={[280, 60]}
          resolution={512}
          mixBlur={0.9}
          mixStrength={14}
          roughness={0.92}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0d12"
          metalness={0.55}
          mirror={0.6}
        />
      </mesh>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.85} scale={14} blur={2.4} far={4} resolution={256} color="#000000" />
    </>
  );
}
