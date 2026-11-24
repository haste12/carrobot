"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface ResolvedAnchors {
  /** world-space positions keyed by anchor id / node name */
  points: Record<string, THREE.Vector3>;
  /** unit vector pointing to the vehicle's front (world space, after normalization) */
  front: THREE.Vector3;
  /** unit vector pointing to the vehicle's left side (world space) */
  left: THREE.Vector3;
  /** overall model dimensions after normalization */
  size: THREE.Vector3;
}

interface Props {
  sensorsOn: boolean;
  onAnchors: (a: ResolvedAnchors) => void;
}

const MODEL_PATH = "/models/police-tahoe.glb";
const TARGET_LENGTH = 5.2; // world units — full-size SUV footprint

export default function TahoeModel({ sensorsOn, onAnchors }: Props) {
  const { scene } = useGLTF(MODEL_PATH);
  const inner = useRef<THREE.Group>(null);
  const outer = useRef<THREE.Group>(null);
  const anchors = useRef<ResolvedAnchors | null>(null);

  /* -------- one-time scene preparation: materials -------- */
  const prepared = useMemo(() => {
    const cloneMap = new Map<string, THREE.MeshStandardMaterial>();

    const cloneMat = (src: THREE.Material, key: string) => {
      if (!cloneMap.has(key)) {
        const m = (src as THREE.MeshStandardMaterial).clone();
        cloneMap.set(key, m);
      }
      return cloneMap.get(key)!;
    };

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      mesh.material = Array.isArray(mesh.material)
        ? mats.map((m) => tuneMaterial(m as THREE.MeshStandardMaterial, o.name, cloneMat))
        : tuneMaterial(mats[0] as THREE.MeshStandardMaterial, o.name, cloneMat);
    });

    return true;
  }, [scene]);
  void prepared;

  /* -------- normalize scale / orientation / floor, resolve anchors -------- */
  useLayoutEffect(() => {
    if (!inner.current || !outer.current) return;
    inner.current.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(inner.current);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // longest horizontal axis is the vehicle length
    const lenAxis = size.x >= size.z ? "x" : "z";
    const s = TARGET_LENGTH / Math.max(size.x, size.z);

    // find the front: headlamp optics survive mesh merging; fall back to +X
    // (verified on the source model: grille at +X, tail lamps at -X)
    const frontNode =
      scene.getObjectByName("Patrol headlamp 1 finite curved optic") ||
      scene.getObjectByName("Patrol grille backing");
    const front = new THREE.Vector3();
    if (frontNode) {
      const gp = new THREE.Vector3();
      frontNode.updateWorldMatrix(true, false);
      frontNode.getWorldPosition(gp);
      const axis = lenAxis === "x" ? 0 : 2;
      front.setComponent(axis, Math.sign(gp.getComponent(axis) - center.getComponent(axis)) || 1);
    } else {
      front.setComponent(lenAxis === "x" ? 0 : 2, 1);
    }

    // rotate inner group so front faces +Z
    const yaw = Math.atan2(front.x, front.z);
    inner.current.rotation.y = -yaw;

    inner.current.updateWorldMatrix(true, true);
    const box2 = new THREE.Box3().setFromObject(inner.current);
    const c2 = box2.getCenter(new THREE.Vector3());

    outer.current.scale.setScalar(s);
    // recentre: x/z centred, floor at y=0
    inner.current.position.set(-c2.x, -box2.min.y, -c2.z);
    inner.current.updateWorldMatrix(true, true);

    /* resolve anchors procedurally from the world-space bounding box.
       After yaw alignment: front = +Z, left = -X. */
    const world = new THREE.Box3().setFromObject(outer.current);
    const wSize = world.getSize(new THREE.Vector3());
    const wCenter = world.getCenter(new THREE.Vector3());
    const F = new THREE.Vector3(0, 0, 1);
    const L = new THREE.Vector3(-1, 0, 0);
    const H = (f: number) => world.min.y + wSize.y * f;
    const Z = (f: number) => wCenter.z + wSize.z * f;

    const points: Record<string, THREE.Vector3> = {
      // front bumper — ultrasonic emitter
      "front-bumper": new THREE.Vector3(wCenter.x, H(0.3), world.max.z + 0.07),
      // side ultrasonic emitters — front doors
      "side-left": new THREE.Vector3(world.min.x - 0.07, H(0.5), Z(0.1)),
      "side-right": new THREE.Vector3(world.max.x + 0.07, H(0.5), Z(0.1)),
    };

    const resolved: ResolvedAnchors = {
      points,
      front: F,
      left: L,
      size: wSize,
    };
    anchors.current = resolved;
    onAnchors(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  return (
    <group ref={outer}>
      <group ref={inner}>
        <primitive object={scene} />
      </group>
      {/* ultrasonic sensor visuals mounted on the body */}
      {anchors.current && <SensorVisuals anchors={anchors.current} active={sensorsOn} />}
    </group>
  );
}

/* ---------------- material tuning ---------------- */

function tuneMaterial(
  m: THREE.MeshStandardMaterial,
  nodeName: string,
  cloneMat: (src: THREE.Material, key: string) => THREE.MeshStandardMaterial
): THREE.Material {
  const name = (m.name || "").toLowerCase();

  // warning optics → steady dim emissive
  if (/warning optic/.test(nodeName)) {
    if (name.includes("red")) {
      const c = cloneMat(m, "optic-red");
      c.emissive = new THREE.Color("#ff2038");
      c.emissiveIntensity = 0.18;
      return c;
    }
    if (name.includes("blue")) {
      const c = cloneMat(m, "optic-blue");
      c.emissive = new THREE.Color("#2456ff");
      c.emissiveIntensity = 0.18;
      return c;
    }
  }

  // headlamp bulb envelopes → soft glow
  if (/bulb envelope/.test(nodeName)) {
    const c = cloneMat(m, "bulb");
    c.emissive = new THREE.Color("#cfe4ff");
    c.emissiveIntensity = 0.5;
    return c;
  }

  // tail lamp optics → dim red glow
  if (/tail lamp/.test(nodeName) && name.includes("red")) {
    const c = cloneMat(m, "tail");
    c.emissive = new THREE.Color("#ff2438");
    c.emissiveIntensity = 0.35;
    return c;
  }

  // generic material polish
  if (name.includes("paint") || name.includes("livery")) {
    // deepen blue patrol livery toward black-navy for a classic B&W unit look
    if (name.includes("blue") && m.color) {
      m.color = m.color.clone().lerp(new THREE.Color("#0d1522"), 0.72);
    }
    m.envMapIntensity = 1.5;
    m.metalness = Math.min(1, (m.metalness ?? 0.4) + 0.15);
    m.roughness = Math.max(0.14, (m.roughness ?? 0.4) * 0.7);
  } else if (name.includes("glazing") || name.includes("lens") || name.includes("glass")) {
    m.envMapIntensity = 1.8;
    m.roughness = 0.06;
    m.metalness = 0.9;
    m.transparent = true;
    m.opacity = Math.min(m.opacity || 1, 0.92);
  } else if (name.includes("steel") || name.includes("aluminium") || name.includes("brass") || name.includes("iron")) {
    m.envMapIntensity = 1.4;
    m.metalness = Math.min(1, (m.metalness ?? 0.7) + 0.2);
    m.roughness = Math.max(0.1, (m.roughness ?? 0.3) * 0.75);
  } else {
    m.envMapIntensity = 1.0;
  }
  return m;
}

/* ---------------- ultrasonic wave visuals ---------------- */

const SENSOR_SPECS = [
  { key: "front-ultrasonic", dir: (a: ResolvedAnchors) => a.front.clone(), origin: "front-bumper" },
  { key: "left-ultrasonic", dir: (a: ResolvedAnchors) => a.left.clone(), origin: "side-left" },
  { key: "right-ultrasonic", dir: (a: ResolvedAnchors) => a.left.clone().negate(), origin: "side-right" },
] as const;

const RANGE = 2.1;
const ANGLE = Math.PI / 7; // ~26° detection cone

function SensorVisuals({ anchors, active }: { anchors: ResolvedAnchors; active: boolean }) {
  const waves = useRef<THREE.Group>(null);
  const cones = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!waves.current || !cones.current || !active) return;
    const t = state.clock.elapsedTime;
    // ring pulses travelling outward along each sensor axis
    waves.current.children.forEach((ringGroup) => {
      ringGroup.children.forEach((ring, i) => {
        const cycle = (((t * 0.6 + i * 0.34) % 1) + 1) % 1;
        ring.position.y = 0.25 + cycle * RANGE * 0.78;
        ring.scale.setScalar(0.18 + cycle * 0.85);
        const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - cycle) * 0.55;
      });
    });
    // subtle cone shimmer
    cones.current.children.forEach((cone, i) => {
      const mat = (cone as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.07 + Math.sin(t * 2.2 + i * 2.1) * 0.03;
    });
  });

  if (!active) return null;

  return (
    <group>
      <group ref={cones}>
        {SENSOR_SPECS.map((s) => {
          const origin = anchors.points[s.origin];
          const dir = s.dir(anchors);
          // cone apex at the sensor, wide end facing outward (-Y maps to dir)
          const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
          const mid = origin.clone().add(dir.clone().multiplyScalar(RANGE * 0.5));
          return (
            <mesh key={s.key} position={mid.toArray()} quaternion={quat}>
              <coneGeometry args={[Math.tan(ANGLE) * RANGE, RANGE, 40, 1, true]} />
              <meshBasicMaterial
                color="#38b6ff"
                transparent
                opacity={0.085}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          );
        })}
      </group>
      <group ref={waves}>
        {SENSOR_SPECS.map((s) => {
          const origin = anchors.points[s.origin];
          const dir = s.dir(anchors);
          const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          return (
            <group key={s.key} position={origin.toArray()} quaternion={quat}>
              {[0, 1, 2].map((i) => (
                <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.3, 0.345, 48]} />
                  <meshBasicMaterial
                    color="#4cc3ff"
                    transparent
                    opacity={0.4}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              ))}
            </group>
          );
        })}
      </group>
      {/* emitter dots */}
      {SENSOR_SPECS.map((s) => (
        <mesh key={s.key} position={anchors.points[s.origin].toArray()}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color="#7fdcff" />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
