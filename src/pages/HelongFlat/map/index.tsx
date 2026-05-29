import { Suspense, useMemo } from "react";
import styled from "styled-components";
import { OrbitControls, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Color } from "three";
import { useConfigStore } from "../stores";
import Lights from "./lights";
import Mirror from "./mirror";
import Base from "./base";
import Bottom from "./bottom";
import BeamLight from "./beamLight";
import type { CityGeoJSON } from "@/types/map";

import scMapData from "@/assets/helong.json";
import scOutlineData from "@/assets/helong_outline.json";

const mapData = scMapData as CityGeoJSON,
  outlineData = scOutlineData as CityGeoJSON;

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
          <Sky
            distance={450000}
            sunPosition={sunPosition}
            rayleigh={skyRayleigh}
            turbidity={skyTurbidity}
            mieCoefficient={0.005}
            mieDirectionalG={0.8}
          />
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
