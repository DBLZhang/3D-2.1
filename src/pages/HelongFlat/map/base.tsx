import { useLayoutEffect, useMemo, useRef } from "react";
import { Center, useTexture } from "@react-three/drei";
import {
  Box2,
  DoubleSide,
  Mesh,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3,
  type Group,
  PlaneGeometry,
  Float32BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  LinearFilter,
} from "three";
import { getInterpolatedHeight } from "./terrainUtils";
import { geoMercator } from "d3-geo";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import ShiftMaterial from "./shaderMaterial";
import GeoTrail from "./geoTrail";
import type { CityGeoJSON } from "@/types/map";
import FlyLine from "./flyLine";
import Label from "./label";
import { useConfigStore } from "../stores";

import helongTopography from "@/assets/helong_topography.png";
import helongBump from "@/assets/helong_bump.bmp";
import Cones from "./cone";

export interface BaseProps {
  depth?: number;
  data: CityGeoJSON;
  outlineData?: CityGeoJSON;
}

export default function Base(props: BaseProps) {
  const { data, outlineData, depth = 0.45 } = props;
  const groupRef = useRef<Group>(null!);
  const camera = useThree((state) => state.camera);

  const projection = useMemo(() => {
    return geoMercator()
      .center(data.features[0].properties.centroid)
      .scale(600)
      .translate([0, 0]);
  }, [data]);

  const { regions, bbox } = useMemo(() => {
    const regions: {
      name: string;
      center: Vector3;
      points: Vector2[][];
    }[] = [];
    const bbox = new Box2();

    const toV2 = (coord: number[]) => {
      const [x, y] = projection(coord as [number, number])!;
      const projected = new Vector2(x, -y);
      bbox.expandByPoint(projected);
      return projected;
    };

    data.features.forEach((feature) => {
      const [x, y] = projection(
        feature.properties.centroid ?? feature.properties.center
      )!;

      const points = feature.geometry.coordinates.reduce<Vector2[][]>(
        (pre, cur) => [
          ...pre,
          ...cur.map<Vector2[]>((coordinates) => coordinates.map(toV2)),
        ],
        []
      );

      regions.push({
        name: feature.properties.name,
        center: new Vector3(x, -y),
        points,
      });
    });

    let boundary: Shape[] = [];

    outlineData?.features.forEach((feature) => {
      const points = feature.geometry.coordinates.map<Shape>((cur) => {
        return new Shape(
          cur.reduce<Vector2[]>(
            (pre, coordinates) => [...pre, ...coordinates.map(toV2)],
            []
          )
        );
      });

      boundary = boundary.concat(points);
    });

    return {
      regions,
      bbox,
      boundary,
    };
  }, [projection]);

  useLayoutEffect(() => {
    if (!groupRef.current) return;
    const tl = gsap.timeline();

    tl.to(camera.position, {
      x: -1.5,
      y: 6.5,
      z: 9,
      duration: 2.5,
      ease: "circ.out",
      onComplete: () => {
        useConfigStore.setState({ mapPlayComplete: true });
      },
    });
    tl.to(groupRef.current.position, { x: 0, y: 0, z: 0, duration: 1 }, 2.5);

    tl.to(
      groupRef.current.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 1,
        ease: "circ.out",
      },
      2.5
    );
    groupRef.current.traverse((obj: any) => {
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat: any) => {
          tl.to(mat, { opacity: 1, duration: 1, ease: "circ.out" }, 2.5);
        });
      }
    });

    return () => {
      tl.kill();
    };
  }, [camera]);

  return (
    <Center top>
      <group
        castShadow
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.0, 1.0, 1.0]}
        position={[0, -0.01, 0]} // sits flush with mirror floor
      >
        <group ref={groupRef} scale={[1, 1, 0]} position={[0, 0, -0.01]}>
          {regions.map((region, idx) => (
            <City
              key={region.name + idx}
              depth={depth}
              bbox={bbox}
              idx={idx}
              data={region}
            />
          ))}
          {/* Prevent any hover interception from decorative child meshes */}
          <group raycast={() => null}>
            {outlineData && (
              <GeoTrail
                projection={projection}
                feature={outlineData.features[0]}
              />
            )}
            <Cones data={regions} depth={depth} />
            <FlyLine data={regions} depth={depth} />
          </group>
        </group>
      </group>
    </Center>
  );
}

function City(props: {
  depth: number;
  bbox: Box2;
  idx: number;
  data: {
    name: string;
    center: Vector3;
    points: Vector2[][];
  };
}) {
  const { bbox, data, depth } = props;
  const materialRef = useRef<ShaderMaterial>(null!);
  const skirtRef = useRef<Mesh>(null!);
  const terrainRef = useRef<Mesh>(null!);
  const edgeRef = useRef<Group>(null!);
  const labelGroupRef = useRef<Group>(null!);

  const hoverScaleZ = useRef(1.0);
  const currentScaleZ = useRef(1.0);

  const topoTexture = useTexture(helongTopography);
  const bumpTexture = useTexture(helongBump);

  const shapeGeometry = useMemo(() => {
    const shapes = data.points.map((e) => new Shape(e));
    return new ShapeGeometry(shapes);
  }, [data.points]);

  // Find bounding box local stats for dynamic canvas texture mask clipping
  const [townBBox, tWidth, tHeight] = useMemo(() => {
    const townBBox = new Box2();
    data.points.forEach((ring) => {
      ring.forEach((p) => {
        townBBox.expandByPoint(p);
      });
    });
    const tWidth = townBBox.max.x - townBBox.min.x;
    const tHeight = townBBox.max.y - townBBox.min.y;
    return [townBBox, tWidth, tHeight];
  }, [data]);

  const cityW = bbox.max.x - bbox.min.x;
  const cityH = bbox.max.y - bbox.min.y;

  const maskScaleOffset = useMemo(() => {
    return [
      cityW / tWidth,
      cityH / tHeight,
      (bbox.min.x - townBBox.min.x) / tWidth,
      (bbox.min.y - townBBox.min.y) / tHeight,
    ];
  }, [cityW, cityH, tWidth, tHeight, bbox, townBBox]);

  const maskTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    
    data.points.forEach((ring) => {
      if (ring.length < 2) return;
      ctx.beginPath();
      const p0 = ring[0];
      const x0 = ((p0.x - townBBox.min.x) / tWidth) * canvas.width;
      const y0 = ((townBBox.max.y - p0.y) / tHeight) * canvas.height;
      ctx.moveTo(x0, y0);

      for (let i = 1; i < ring.length; i++) {
        const p = ring[i];
        const x = ((p.x - townBBox.min.x) / tWidth) * canvas.width;
        const y = ((townBBox.max.y - p.y) / tHeight) * canvas.height;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    });

    const tex = new CanvasTexture(canvas);
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [data, townBBox, tWidth, tHeight]);

  // Generate highly tessellated 3D terrain grid matching the town's bounding box
  const terrainData = useMemo(() => {
    const centerX = (townBBox.min.x + townBBox.max.x) / 2;
    const centerY = (townBBox.min.y + townBBox.max.y) / 2;

    const geom = new PlaneGeometry(tWidth, tHeight, 80, 80);
    const pos = geom.attributes.position;
    const uv: number[] = [];

    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);

      const worldX = centerX + px;
      const worldY = centerY + py;

      const h = getInterpolatedHeight(worldX, worldY);
      pos.setZ(i, h);

      const u = (worldX - bbox.min.x) / cityW;
      const v = (worldY - bbox.min.y) / cityH;
      uv.push(u, v);
    }

    geom.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    geom.computeVertexNormals();

    return { geom, centerX, centerY };
  }, [bbox, townBBox, tWidth, tHeight, cityW, cityH]);

  // Generate 3D boundary lines (contour outlines) that ride the elevation curves
  const threeDBoundaryGeoms = useMemo(() => {
    return data.points.map((ring) => {
      const points3D: number[] = [];
      ring.forEach((p) => {
        const h = getInterpolatedHeight(p.x, p.y);
        points3D.push(p.x, p.y, h);
      });
      const geom = new BufferGeometry();
      geom.setAttribute("position", new Float32BufferAttribute(points3D, 3));
      return geom;
    });
  }, [data.points]);

  // Generate 3D vertical skirt (side walls) whose heights dynamically match the boundary elevations
  const skirtGeom = useMemo(() => {
    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexCount = 0;

    data.points.forEach((ring) => {
      const len = ring.length;
      if (len < 2) return;

      const heights = ring.map((p) => getInterpolatedHeight(p.x, p.y));

      for (let i = 0; i < len; i++) {
        const nextIdx = (i + 1) % len;

        const pA = ring[i];
        const pB = ring[nextIdx];
        const hA = heights[i];
        const hB = heights[nextIdx];

        vertices.push(
          pA.x, pA.y, -0.15, // V0 (bottom baseplate at Z = -0.15)
          pA.x, pA.y, hA,    // V1 (top cap matching terrain elevation)
          pB.x, pB.y, -0.15, // V2 (bottom baseplate at Z = -0.15)
          pB.x, pB.y, hB     // V3 (top cap matching terrain elevation)
        );

        const v0 = vertexCount;
        const v1 = vertexCount + 1;
        const v2 = vertexCount + 2;
        const v3 = vertexCount + 3;

        indices.push(v0, v2, v1, v2, v3, v1);
        vertexCount += 4;
      }
    });

    if (vertices.length === 0) return null;

    const geom = new BufferGeometry();
    geom.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, [data.points]);

  const terrainMatRef = useRef<any>(null!);

  useLayoutEffect(() => {
    if (skirtRef.current) {
      gsap.to(skirtRef.current.material, {
        opacity: 1,
        duration: 1,
        delay: 0.5,
        ease: "circ.out",
      });
    }
    if (terrainMatRef.current) {
      gsap.to(terrainMatRef.current, {
        opacity: 1,
        duration: 1,
        delay: 0.5,
        ease: "circ.out",
      });
    }
    if (edgeRef.current) {
      edgeRef.current.traverse((child: any) => {
        if (child.material) {
          gsap.to(child.material, {
            opacity: 1,
            duration: 1,
            delay: 0.5,
            ease: "circ.out",
          });
        }
      });
    }
  }, []);

  useFrame((_, delta) => {
    currentScaleZ.current += (hoverScaleZ.current - currentScaleZ.current) * 0.15;
    
    if (skirtRef.current) {
      skirtRef.current.scale.z = currentScaleZ.current;
    }
    
    if (terrainRef.current) {
      terrainRef.current.scale.z = currentScaleZ.current;
    }
    
    if (edgeRef.current) {
      edgeRef.current.scale.z = currentScaleZ.current;
    }
    
    if (labelGroupRef.current) {
      const centerH = getInterpolatedHeight(data.center.x, data.center.y);
      labelGroupRef.current.position.z = centerH * currentScaleZ.current + 0.15;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta / 3;
    }
  });

  return (
    <group>
      {/* Flat invisible cap mesh to capture pointer events */}
      <mesh
        geometry={shapeGeometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          hoverScaleZ.current = 1.4; // 40% height boost on hover for drama
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          hoverScaleZ.current = 1.0;
          document.body.style.cursor = "auto";
        }}
      >
        <meshStandardMaterial
          colorWrite={false}
          depthWrite={false}
        />
      </mesh>

      {/* 3D Vertical holographic side walls */}
      {skirtGeom && (
        <mesh ref={skirtRef} geometry={skirtGeom}>
          <ShiftMaterial
            transparent
            ref={materialRef}
            opacity={0}
            depth={depth}
            side={DoubleSide}
          />
        </mesh>
      )}

      {/* High-Resolution 3D Terrain cap, physically bumpy and clipped to the exact boundary via Custom Fragment Shader */}
      <mesh
        ref={terrainRef}
        geometry={terrainData.geom}
        position={[terrainData.centerX, terrainData.centerY, 0]}
        raycast={() => null} // Let the flat mesh capture hover pointer events
      >
        <meshStandardMaterial
          ref={terrainMatRef}
          transparent
          map={topoTexture}
          bumpMap={bumpTexture}
          bumpScale={0.08} // Micro bump highlights on top of the physical mesh displacement
          color="#ffffff"
          metalness={0.0}
          roughness={0.7}
          side={DoubleSide}
          opacity={0}
          onBeforeCompile={(shader: any) => {
            shader.uniforms.uMaskTex = { value: maskTexture };
            shader.uniforms.uMaskScaleOffset = { value: maskScaleOffset };
            
            shader.fragmentShader = `
              uniform sampler2D uMaskTex;
              uniform vec4 uMaskScaleOffset;
              ${shader.fragmentShader}
            `;
            
            shader.fragmentShader = shader.fragmentShader.replace(
              `#include <map_fragment>`,
              `#include <map_fragment>
               
               // Sample the dynamic canvas mask texture using local UV
               vec2 localUv = vMapUv * uMaskScaleOffset.xy + uMaskScaleOffset.zw;
               vec4 maskVal = texture2D(uMaskTex, localUv);
               if (maskVal.r < 0.5) {
                 discard; // Clip anything outside the town boundary!
               }

               #ifdef USE_MAP
               // Saturate the topography texture for professional visualization aesthetics
               float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
               diffuseColor.rgb = mix(vec3(luma), diffuseColor.rgb, 1.4);
               #endif`
            );
          }}
        />
      </mesh>

      {/* 3D boundary outline loops that ride the terrain ridges */}
      <group ref={edgeRef}>
        {threeDBoundaryGeoms.map((geom, gIdx) => (
          <lineLoop key={gIdx} geometry={geom}>
            <lineBasicMaterial transparent color="#ffffff" opacity={0} />
          </lineLoop>
        ))}
      </group>

      {/* Floated labels riding on top of the physical mountains */}
      <group ref={labelGroupRef} position={[data.center.x, data.center.y, 0]}>
        <Label
          center
          distanceFactor={10}
          zIndexRange={[100 - 1000]}>
          {data.name}
        </Label>
      </group>
    </group>
  );
}
