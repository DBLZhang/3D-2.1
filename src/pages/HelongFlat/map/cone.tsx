import { useRef, useMemo } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Vector2,
  Vector3,
  type Mesh,
} from "three";
import { Instance, Instances, useTexture } from "@react-three/drei";
import { useConfigStore } from "../stores";

import guangquan01 from "@/assets/guangquan01.png";

export interface ConesProps {
  color?: Color;
  data: {
    name: string;
    center: Vector3;
    points: Vector2[][];
  }[];
  depth?: number;
}

export default function Cones(props: ConesProps) {
  const customColor = useConfigStore((s) => s.coneColor);
  const coneStyle = useConfigStore((s) => s.coneStyle);

  const { depth = 0.45 } = props;
  const texture1 = useTexture(guangquan01);

  const finalColor = useMemo(() => new Color(customColor), [customColor]);

  return (
    <group position-z={0} renderOrder={5}>
      <Instances
        key={coneStyle} // Add key to force recreate instances when geometry swaps to prevent cache mismatch
        limit={props.data.length}
        position-z={depth + 0.2}
        raycast={() => null}>
        {coneStyle === "cone" && <coneGeometry args={[0.3, 0.5, 4]} />}
        {coneStyle === "smooth-cone" && <coneGeometry args={[0.3, 0.6, 32]} />}
        {coneStyle === "cylinder" && <cylinderGeometry args={[0.12, 0.12, 0.6, 16]} />}
        {coneStyle === "sphere" && <sphereGeometry args={[0.22, 16, 16]} />}
        {coneStyle === "box" && <boxGeometry args={[0.3, 0.3, 0.3]} />}
        
        <meshBasicMaterial
          //   transparent
          color={finalColor}
          //   depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
        />
        {props.data.map((data, i) => (
          <Cone key={i} position={data.center} />
        ))}
      </Instances>
      <Instances limit={props.data.length} raycast={() => null}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial
          transparent
          color={finalColor}
          alphaMap={texture1}
          opacity={1}
          depthTest={false}
          fog={false}
          blending={AdditiveBlending}
        />
        {props.data.map((data, i) => (
          <Quan key={i} position={data.center} />
        ))}
      </Instances>
    </group>
  );
}

export interface ConeProps {
  position?: ThreeElements["group"]["position"];
}

function Cone(props: ConeProps) {
  const { position } = props;
  const ref = useRef<Mesh>(null!);
  let dirRef = useRef<1 | -1>(1);

  useFrame((_, delta) => {
    if (ref.current.position.z >= 1) {
      dirRef.current = -1;
      ref.current.position.z = 1;
    }
    if (ref.current.position.z <= 0) {
      dirRef.current = 1;
      ref.current.position.z = 0;
    }
    // const d = Math.min(delta, 0.05);
    ref.current.rotation.y += delta;
    ref.current.position.z += (dirRef.current * delta) / 2;
  });

  return <Instance ref={ref} rotation-x={-Math.PI / 2} position={position} />;
}

function Quan(props: ConeProps) {
  const { position } = props;
  const ref = useRef<Mesh>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.z += delta + 0.02;
  });
  return <Instance ref={ref} position={position} />;
}
