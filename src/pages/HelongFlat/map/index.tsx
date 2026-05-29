import { Suspense } from "react";
import styled from "styled-components";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
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
          <fog attach="fog" args={[bgColor, 10, 30]} />
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
