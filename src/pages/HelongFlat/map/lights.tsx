import { useRef } from "react";

export default function Lights() {
  const directionalRef = useRef(null!);

  return (
    <>
      {/* Lower ambient light so shadows are darker and more dramatic */}
      <ambientLight color="#ffffff" intensity={0.5} />
      
      {/* Strong main directional light at an angle to create dramatic shadows across ridges */}
      <directionalLight
        ref={directionalRef}
        color="#ffffff"
        intensity={3.5}
        position={[20, 35, 15]}
        castShadow
      />

      {/* Weak fill light from the opposite side to keep shadows soft but high contrast */}
      <directionalLight
        color="#4a90e2"
        intensity={1.0}
        position={[-20, 15, -15]}
      />
    </>
  );
}

