import { useRef } from "react";
import { useConfigStore } from "../stores";

export default function Lights() {
  const directionalRef = useRef(null!);
  const lightMainColor = useConfigStore((s) => s.lightMainColor);
  const lightFillColor = useConfigStore((s) => s.lightFillColor);

  return (
    <>
      {/* Lower ambient light so shadows are darker and more dramatic */}
      <ambientLight color={lightMainColor} intensity={0.5} />
      
      {/* Strong main directional light at an angle to create dramatic shadows across ridges */}
      <directionalLight
        ref={directionalRef}
        color={lightMainColor}
        intensity={3.5}
        position={[20, 35, 15]}
        castShadow
      />

      {/* Weak fill light from the opposite side to keep shadows soft but high contrast */}
      <directionalLight
        color={lightFillColor}
        intensity={1.0}
        position={[-20, 15, -15]}
      />
    </>
  );
}

