import { useMemo, useRef } from "react";
import { Color } from "three";
import { useConfigStore } from "../stores";

export default function Lights() {
  const directionalRef = useRef(null!);
  const lightMainColor = useConfigStore((s) => s.lightMainColor);
  const lightFillColor = useConfigStore((s) => s.lightFillColor);

  // Sky variables
  const skyInclination = useConfigStore((s) => s.skyInclination);
  const skyAzimuth = useConfigStore((s) => s.skyAzimuth);

  // Dynamic Light position matching sun position
  const sunPosition = useMemo(() => {
    const theta = Math.PI * skyInclination;
    const phi = 2 * Math.PI * (skyAzimuth - 0.5);
    const R = 35; // Radius to keep shadows sharp and close to the scene
    return [
      Math.cos(phi) * Math.cos(theta) * R,
      Math.sin(theta) * R,
      Math.sin(phi) * Math.cos(theta) * R
    ] as [number, number, number];
  }, [skyInclination, skyAzimuth]);

  // Dynamic lighting colors & intensities based on inclination
  const dynamicLighting = useMemo(() => {
    const mainColorObj = new Color(lightMainColor);
    let ambientIntensity = 0.5;
    let directionalIntensity = 3.5;
    let directionalColor = lightMainColor;

    if (skyInclination > 0.15) {
      // Day: blend to soft day blue-white
      const t = Math.min(1, (skyInclination - 0.15) / 0.35);
      ambientIntensity = 0.2 + 0.3 * t;
      directionalIntensity = 1.0 + 2.5 * t;
      mainColorObj.lerp(new Color("#ffffff"), 0.5);
      directionalColor = mainColorObj.getStyle();
    } else if (skyInclination > 0.0) {
      // Sunset / Golden Hour: blend to warm sunset orange-red
      const t = Math.min(1, skyInclination / 0.15);
      ambientIntensity = 0.1 + 0.1 * t;
      directionalIntensity = 0.3 + 0.7 * t;
      mainColorObj.lerp(new Color("#ff7b00"), 1 - t);
      directionalColor = mainColorObj.getStyle();
    } else {
      // Night: dim moonlight representation
      ambientIntensity = 0.08;
      directionalIntensity = 0.15;
      directionalColor = "#0f1f3d";
    }

    return {
      ambientIntensity,
      directionalIntensity,
      directionalColor
    };
  }, [skyInclination, lightMainColor]);

  return (
    <>
      {/* Lower ambient light so shadows are darker and more dramatic */}
      <ambientLight color={lightMainColor} intensity={dynamicLighting.ambientIntensity} />
      
      {/* Strong main directional light at an angle to create dramatic shadows across ridges */}
      <directionalLight
        ref={directionalRef}
        color={dynamicLighting.directionalColor}
        intensity={dynamicLighting.directionalIntensity}
        position={sunPosition}
        castShadow
      />

      {/* Weak fill light from the opposite side to keep shadows soft but high contrast */}
      <directionalLight
        color={lightFillColor}
        intensity={dynamicLighting.ambientIntensity * 1.5}
        position={[-sunPosition[0], 10, -sunPosition[2]]}
      />
    </>
  );
}

