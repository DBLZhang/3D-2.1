import { useMemo } from "react";
import { Color, RepeatWrapping, TextureLoader } from "three";
import { useConfigStore } from "../stores";

export default function Mirror() {
  const floorColor = useConfigStore((s) => s.floorColor);
  const floorImage = useConfigStore((s) => s.floorImage);
  const floorRepeat = useConfigStore((s) => s.floorRepeat);

  // Load the dynamic base64 floor texture
  const texture = useMemo(() => {
    if (!floorImage) return null;
    const loader = new TextureLoader();
    const tex = loader.load(floorImage);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    return tex;
  }, [floorImage]);

  // Reactive uniforms for ShaderMaterial
  const uniforms = useMemo(() => {
    return {
      uColor: { value: new Color(floorColor) },
      uTexture: { value: texture },
      uHasTexture: { value: !!floorImage },
      uRepeat: { value: floorRepeat },
    };
  }, [floorColor, texture, floorImage, floorRepeat]);

  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.02} raycast={() => null}>
      <planeGeometry args={[100, 100]} />
      <shaderMaterial
        key={`${floorColor}_${!!floorImage}_${floorRepeat}`}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform vec3 uColor;
          uniform sampler2D uTexture;
          uniform bool uHasTexture;
          uniform float uRepeat;

          void main() {
            // 1. Calculate radial gradient centered at (0.5, 0.5)
            // Center is (0.5, 0.5), distance ranges from 0.0 to 0.5 at edge centers
            // Multiply by 2.0 so that inscribed circle boundary is r = 1.0
            float r = length(vUv - vec2(0.5)) * 2.0;
            float alpha = 0.0;

            if (r <= 0.5) {
              // 100% color at center (r=0), transitioning to 75% opacity at 50% distance (r=0.5)
              alpha = mix(1.0, 0.75, r / 0.5);
            } else if (r <= 1.0) {
              // 75% opacity at 50% distance (r=0.5), transitioning to 0% opacity at inscribed circle (r=1.0)
              alpha = mix(0.75, 0.0, (r - 0.5) / 0.5);
            } else {
              // Outside the inscribed circle has 0% opacity
              alpha = 0.0;
            }

            // 2. Fetch base color (either repeating texture tiling or flat solid color)
            vec4 baseColor;
            if (uHasTexture) {
              vec2 tiledUv = vUv * uRepeat;
              baseColor = texture2D(uTexture, tiledUv);
            } else {
              baseColor = vec4(uColor, 1.0);
            }

            // 3. Blend base color with the radial gradient alpha mask
            gl_FragColor = vec4(baseColor.rgb, baseColor.a * alpha);
          }
        `}
      />
    </mesh>
  );
}
