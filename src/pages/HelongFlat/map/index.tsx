import { Suspense, useMemo } from "react";
import styled from "styled-components";
import { OrbitControls, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Color, TextureLoader, DoubleSide } from "three";
import { useConfigStore } from "../stores";
import Lights from "./lights";
import Mirror from "./mirror";
import Base from "./base";
import Bottom from "./bottom";
import BeamLight from "./beamLight";
import GlowingSun from "./glowingSun";
import type { CityGeoJSON } from "@/types/map";

import scMapData from "@/assets/helong.json";
import scOutlineData from "@/assets/helong_outline.json";

const mapData = scMapData as CityGeoJSON,
  outlineData = scOutlineData as CityGeoJSON;

// Custom Procedural Starfield & Cosmic Nebula Shader
const StarrySkyMaterial = {
  uniforms: {},
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // Custom noise hash function
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    
    void main() {
      vec3 dir = normalize(vPosition);
      
      // Sky background: gorgeous dark space gradient blending midnight navy to purple nebula base
      vec3 spaceColor = vec3(0.004, 0.007, 0.02) + vec3(0.012, 0.004, 0.022) * (dir.y + 1.0);
      
      // Map spherical angles to uniform UV projection to keep stars uniform at all directions
      vec2 starUV1 = vec2(atan(dir.z, dir.x), acos(dir.y)) * 48.0;
      vec2 grid1 = floor(starUV1);
      vec2 f1 = fract(starUV1);
      float n1 = hash(grid1);
      float star1 = smoothstep(0.96, 1.0, 1.0 - length(f1 - 0.5)) * step(0.93, n1);
      
      vec2 starUV2 = vec2(atan(dir.z, dir.x), acos(dir.y)) * 96.0;
      vec2 grid2 = floor(starUV2);
      vec2 f2 = fract(starUV2);
      float n2 = hash(grid2);
      float star2 = smoothstep(0.94, 1.0, 1.0 - length(f2 - 0.5)) * step(0.94, n2);
      
      // Cosmic gas clouds / Space nebulae
      float nebVal = 0.05 * (sin(dir.x * 2.2 + dir.y * 3.1) + cos(dir.z * 2.0 + dir.y * 1.6));
      vec3 nebula = vec3(0.0, 0.4, 0.85) * max(0.0, nebVal);
      
      vec3 finalStars = vec3(star1 * 0.95) + vec3(star2 * 0.6);
      
      gl_FragColor = vec4(spaceColor + finalStars + nebula, 1.0);
    }
  `
};

const CanvasWrapper = styled.div<{ $bgColor: string; $bgImage: string | null; $bgRepeat: boolean; $bgSize: number }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-color: ${(props) => props.$bgColor};
  ${(props) =>
    props.$bgImage
      ? `
    background-image: url(${props.$bgImage});
    background-repeat: ${props.$bgRepeat ? "repeat" : "no-repeat"};
    background-size: ${props.$bgRepeat ? `${props.$bgSize}px` : "cover"};
    background-position: center;
  `
      : ""}
  transition: background-color 0.3s ease;
`;

export default function Map() {
  const bgColor = useConfigStore((s) => s.bgColor);
  const bgImage = useConfigStore((s) => s.bgImage);
  const bgRepeat = useConfigStore((s) => s.bgRepeat);
  const bgSize = useConfigStore((s) => s.bgSize);

  // Extract sky variables
  const skyInclination = useConfigStore((s) => s.skyInclination);
  const skyAzimuth = useConfigStore((s) => s.skyAzimuth);
  const skyRayleigh = useConfigStore((s) => s.skyRayleigh);
  const skyTurbidity = useConfigStore((s) => s.skyTurbidity);
  const skyMode = useConfigStore((s) => s.skyMode);
  const skyImage = useConfigStore((s) => s.skyImage);

  // Compute 3D Sun Position based on inclination and azimuth
  const sunPosition = useMemo(() => {
    const theta = Math.PI * skyInclination;
    const phi = 2 * Math.PI * (skyAzimuth - 0.5);
    return [
      Math.cos(phi) * Math.cos(theta) * 400,
      Math.sin(theta) * 400,
      Math.sin(phi) * Math.cos(theta) * 400
    ] as [number, number, number];
  }, [skyInclination, skyAzimuth]);

  // Compute dynamic horizon color for perfect fog synchronization
  const horizonColor = useMemo(() => {
    const color = new Color();
    if (skyInclination > 0.15) {
      // Day: transition from deep blue base to gorgeous sky horizon
      const t = Math.min(1, (skyInclination - 0.15) / 0.35);
      color.set("#0a1526").lerp(new Color("#7baeff"), t);
    } else if (skyInclination > 0.0) {
      // Sunset: transition from sunset orange-red to daytime blue base
      const t = Math.min(1, skyInclination / 0.15);
      color.set("#d35400").lerp(new Color("#0a1526"), t);
    } else {
      // Night: transition from sunset glow to deep pitch-black midnight
      const t = Math.min(1, Math.max(-0.05, skyInclination) / -0.05);
      color.set("#d35400").lerp(new Color("#020408"), t);
    }
    return color.getStyle();
  }, [skyInclination]);

  // Load uploaded panorama Base64 texture
  const uploadedTexture = useMemo(() => {
    if (!skyImage) return null;
    try {
      const loader = new TextureLoader();
      const tex = loader.load(skyImage);
      tex.colorSpace = "srgb";
      return tex;
    } catch (err) {
      console.error("Failed to load uploaded panorama skybox texture", err);
      return null;
    }
  }, [skyImage]);

  return (
    <CanvasWrapper
      $bgColor={bgColor}
      $bgImage={bgImage}
      $bgRepeat={bgRepeat}
      $bgSize={bgSize}
    >
      <Canvas
        camera={{
          fov: 70,
          position: [3, 20, 10],
        }}
        gl={{ stencil: true, alpha: true }}
        dpr={[1, 2]}>
          <fog attach="fog" args={[horizonColor, 15, 55]} />
          
          {skyMode === "procedural" ? (
            <Sky
              distance={450000}
              sunPosition={sunPosition}
              rayleigh={skyRayleigh}
              turbidity={skyTurbidity}
              mieCoefficient={0.005}
              mieDirectionalG={0.8}
            />
          ) : (
            <mesh scale={[-1, 1, 1]}>
              <sphereGeometry args={[450, 60, 40]} />
              {uploadedTexture ? (
                <meshBasicMaterial map={uploadedTexture} toneMapped={false} side={DoubleSide} />
              ) : (
                <shaderMaterial
                  attach="material"
                  args={[StarrySkyMaterial]}
                  side={DoubleSide}
                  depthWrite={false}
                />
              )}
            </mesh>
          )}

          <GlowingSun />
          <Lights />
          
          <Suspense fallback={null}>
            <Base data={mapData} outlineData={outlineData} />
          </Suspense>
          <Bottom />
          <Mirror />
          <BeamLight />
          <OrbitControls
            enableDamping
            zoomSpeed={0.3}
            minDistance={8}
            maxDistance={20}
            maxPolarAngle={1.5}
          />
      </Canvas>
    </CanvasWrapper>
  );
}
