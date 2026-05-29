import { useMemo } from "react";
import { useConfigStore } from "../stores";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";

export default function GlowingSun() {
  const skyInclination = useConfigStore((s) => s.skyInclination);
  const skyAzimuth = useConfigStore((s) => s.skyAzimuth);
  const skySunGlow = useConfigStore((s) => s.skySunGlow);
  const skySunScale = useConfigStore((s) => s.skySunScale);

  // Compute 3D sun position
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

  // Compute highly realistic color transitions based on sun angle (skyInclination)
  const colors = useMemo(() => {
    const sunColor = new THREE.Color();
    const glowColor = new THREE.Color();

    if (skyInclination > 0.2) {
      // 1. Full Daytime: Bright warm yellow-white sun body, golden amber halo
      sunColor.set("#fffaed");
      glowColor.set("#ffd275");
    } else if (skyInclination > 0.04) {
      // 2. Sunset/Sunrise golden hours: interpolate smoothly to rich orange-red晚霞色
      const t = (skyInclination - 0.04) / 0.16; // 0 (sunset) to 1 (day)
      
      const warmDaySun = new THREE.Color("#fffaed");
      const sunsetRedSun = new THREE.Color("#ff3a00");
      sunColor.copy(sunsetRedSun).lerp(warmDaySun, t);

      const warmDayGlow = new THREE.Color("#ffd275");
      const sunsetRedGlow = new THREE.Color("#ff2200");
      glowColor.copy(sunsetRedGlow).lerp(warmDayGlow, t);
    } else if (skyInclination > -0.02) {
      // 3. Dusk/Dawn twilight: deep fiery twilight fading to night sky
      const t = (skyInclination - (-0.02)) / 0.06; // 0 to 1
      
      const sunsetRedSun = new THREE.Color("#ff3a00");
      const darkNightSun = new THREE.Color("#080c18");
      sunColor.copy(darkNightSun).lerp(sunsetRedSun, Math.max(0, Math.min(1, t)));

      const sunsetRedGlow = new THREE.Color("#ff2200");
      const darkNightGlow = new THREE.Color("#04060d");
      glowColor.copy(darkNightGlow).lerp(sunsetRedGlow, Math.max(0, Math.min(1, t)));
    } else {
      // 4. Midnight: dormant glowing sun core
      sunColor.set("#080c18");
      glowColor.set("#04060d");
    }

    return { sunColor, glowColor };
  }, [skyInclination]);

  // Reactive Uniforms for shader materials
  const innerGlowUniforms = useMemo(() => {
    return {
      uColor: { value: colors.glowColor },
      uOpacity: { value: 0.75 },
      uPower: { value: 2.2 },
    };
  }, [colors.glowColor]);

  const outerGlowUniforms = useMemo(() => {
    return {
      uColor: { value: colors.glowColor },
      uOpacity: { value: 0.38 },
      uPower: { value: 3.5 },
    };
  }, [colors.glowColor]);

  const spikeUniforms = useMemo(() => {
    return {
      uColor: { value: colors.glowColor },
      uOpacity: { value: 0.45 },
    };
  }, [colors.glowColor]);

  if (!skySunGlow) return null;

  return (
    <group position={sunPosition}>
      {/* 3D Warm Glowing Sun Core Body */}
      <mesh>
        <sphereGeometry args={[skySunScale, 32, 32]} />
        <meshBasicMaterial
          color={colors.sunColor}
          toneMapped={false}
        />
      </mesh>

      {/* Cinematic camera-facing lens flare and diffuse light aura system */}
      <Billboard follow={true}>
        {/* 1. Inner intense glowing corona with smooth radial decay */}
        <mesh>
          <planeGeometry args={[skySunScale * 3.2, skySunScale * 3.2]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={innerGlowUniforms}
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
              uniform float uOpacity;
              uniform float uPower;
              void main() {
                float dist = length(vUv - vec2(0.5)) * 2.0;
                if (dist > 1.0) discard;
                float alpha = pow(1.0 - dist, uPower) * uOpacity;
                gl_FragColor = vec4(uColor, alpha);
              }
            `}
          />
        </mesh>

        {/* 2. Outer broad ambient aura with soft falloff */}
        <mesh>
          <planeGeometry args={[skySunScale * 7.5, skySunScale * 7.5]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={outerGlowUniforms}
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
              uniform float uOpacity;
              uniform float uPower;
              void main() {
                float dist = length(vUv - vec2(0.5)) * 2.0;
                if (dist > 1.0) discard;
                float alpha = pow(1.0 - dist, uPower) * uOpacity;
                gl_FragColor = vec4(uColor, alpha);
              }
            `}
          />
        </mesh>

        {/* 3. Horizontal lens flare spike (fading into thin needles at endpoints) */}
        <mesh>
          <planeGeometry args={[skySunScale * 14.0, skySunScale * 0.22]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={spikeUniforms}
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
              uniform float uOpacity;
              void main() {
                // Fade along X to needle endpoints, and fade along Y
                float fadeX = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 4.0);
                float fadeY = 1.0 - abs(vUv.y - 0.5) * 2.0;
                gl_FragColor = vec4(uColor, fadeX * fadeY * uOpacity);
              }
            `}
          />
        </mesh>

        {/* 4. Vertical lens flare spike (fading into thin needles at endpoints) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[skySunScale * 14.0, skySunScale * 0.22]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={spikeUniforms}
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
              uniform float uOpacity;
              void main() {
                float fadeX = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 4.0);
                float fadeY = 1.0 - abs(vUv.y - 0.5) * 2.0;
                gl_FragColor = vec4(uColor, fadeX * fadeY * uOpacity);
              }
            `}
          />
        </mesh>
      </Billboard>
    </group>
  );
}
