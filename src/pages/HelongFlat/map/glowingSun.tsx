import { useMemo } from "react";
import { useConfigStore } from "../stores";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";

export default function GlowingSun() {
  const skyInclination = useConfigStore((s) => s.skyInclination);
  const skyAzimuth = useConfigStore((s) => s.skyAzimuth);
  const skySunGlow = useConfigStore((s) => s.skySunGlow);
  const skySunScale = useConfigStore((s) => s.skySunScale);

  const sunPosition = useMemo(() => {
    const theta = Math.PI * skyInclination;
    const phi = 2 * Math.PI * (skyAzimuth - 0.5);
    const R = 380; // Distance in sky dome
    return [
      Math.cos(phi) * Math.cos(theta) * R,
      Math.sin(theta) * R,
      Math.sin(phi) * Math.cos(theta) * R
    ] as [number, number, number];
  }, [skyInclination, skyAzimuth]);

  if (!skySunGlow) return null;

  // Derive dynamic sun body color based on inclination
  const isDay = skyInclination > 0.15;
  const isSunset = skyInclination > 0.0;
  const sunColor = isDay ? "#ffffff" : isSunset ? "#ff8800" : "#0d1e38";
  const coronaColor = isDay ? "#ffeedd" : isSunset ? "#ff4400" : "#112244";

  return (
    <group position={sunPosition}>
      {/* 3D Core Sun Body */}
      <mesh>
        <sphereGeometry args={[skySunScale, 32, 32]} />
        <meshBasicMaterial
          color={sunColor}
          toneMapped={false}
        />
      </mesh>

      {/* Camera-Facing Additive Lens Flare System */}
      <Billboard follow={true}>
        {/* Inner intense glowing corona */}
        <mesh>
          <ringGeometry args={[0, skySunScale * 1.5, 64]} />
          <meshBasicMaterial
            color={coronaColor}
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Outer broad ambient aura */}
        <mesh>
          <ringGeometry args={[0, skySunScale * 3.5, 64]} />
          <meshBasicMaterial
            color={coronaColor}
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Horizontal lens flare bloom line */}
        <mesh>
          <planeGeometry args={[skySunScale * 7.5, skySunScale * 0.18]} />
          <meshBasicMaterial
            color={coronaColor}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Vertical lens flare bloom line */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[skySunScale * 7.5, skySunScale * 0.18]} />
          <meshBasicMaterial
            color={coronaColor}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </Billboard>
    </group>
  );
}
