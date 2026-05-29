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
  AlwaysStencilFunc,
  EqualStencilFunc,
  ReplaceStencilOp,
  Float32BufferAttribute,
  BufferGeometry,
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
  const { bbox, data, depth, idx } = props;
  const materialRef = useRef<ShaderMaterial>(null!);
  const skirtRef = useRef<Mesh>(null!);
  const terrainRef = useRef<Mesh>(null!);
  const edgeRef = useRef<Group>(null!);
  const labelGroupRef = useRef<Group>(null!);

  const hoverScaleZ = useRef(1.0);
  const currentScaleZ = useRef(1.0);

  const topoTexture = useTexture(helongTopography);
  const bumpTexture = useTexture(helongBump);

  const [shapeGeometry] = useMemo(() => {
    const shapes = data.points.map((e) => new Shape(e));
    const shapeGeometry = new ShapeGeometry(shapes);
    return [shapeGeometry];
  }, [data.points]);

  // Generate highly tessellated 3D terrain grid matching the town's bounding box
  const terrainData = useMemo(() => {
    const townBBox = new Box2();
    data.points.forEach((ring) => {
      ring.forEach((p) => {
        townBBox.expandByPoint(p);
      });
    });

    const tWidth = townBBox.max.x - townBBox.min.x;
    const tHeight = townBBox.max.y - townBBox.min.y;
    const centerX = (townBBox.min.x + townBBox.max.x) / 2;
    const centerY = (townBBox.min.y + townBBox.max.y) / 2;

    // 80x80 segments for high geometric resolution of mountains and valleys
    const geom = new PlaneGeometry(tWidth, tHeight, 80, 80);
    const pos = geom.attributes.position;
    const uv: number[] = [];

    const cityW = bbox.max.x - bbox.min.x;
    const cityH = bbox.max.y - bbox.min.y;

    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);

      const worldX = centerX + px;
      const worldY = centerY + py;

      // Extract accurate elevation from DEM data
      const h = getInterpolatedHeight(worldX, worldY);
      pos.setZ(i, h);

      // Map texture coordinates seamlessly relative to the entire city bbox
      const u = (worldX - bbox.min.x) / cityW;
      const v = (worldY - bbox.min.y) / cityH;
      uv.push(u, v);
    }

    geom.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    geom.computeVertexNormals();

    return { geom, centerX, centerY };
  }, [bbox, data]);

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

        // 4 vertices of the vertical quad
        // V0: bottom A, V1: top A, V2: bottom B, V3: top B
        vertices.push(
          pA.x, pA.y, 0,   // V0
          pA.x, pA.y, hA,  // V1
          pB.x, pB.y, 0,   // V2
          pB.x, pB.y, hB   // V3
        );

        const v0 = vertexCount;
        const v1 = vertexCount + 1;
        const v2 = vertexCount + 2;
        const v3 = vertexCount + 3;

        // Two triangles forming the quad
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
      {/* Flat invisible cap mesh to write the stencil mask and capture pointer events */}
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
          transparent
          colorWrite={false}
          depthWrite={true}
          stencilWrite={true}
          stencilRef={idx + 1}
          stencilFunc={AlwaysStencilFunc}
          stencilZPass={ReplaceStencilOp}
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
          />
        </mesh>
      )}

      {/* High-Resolution 3D Terrain cap, physically bumpy and clipped to the exact boundary via Stencil */}
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
          stencilWrite={true}
          stencilRef={idx + 1}
          stencilFunc={EqualStencilFunc}
          onBeforeCompile={(shader: any) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              `#include <map_fragment>`,
              `#include <map_fragment>
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
      <group ref={labelGroupRef}>
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
