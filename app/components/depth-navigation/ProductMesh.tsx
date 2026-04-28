import { RoundedBox, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

type ProductMeshProps = {
  id: string;
  name: string;
  textureUrl: string;
  position: [number, number, number];
  baseScale: number;
  opacity: number;
  selected: boolean;
  onSelect: (id: string) => void;
};

export default function ProductMesh({
  id,
  name,
  textureUrl,
  position,
  baseScale,
  opacity,
  selected,
  onSelect
}: ProductMeshProps) {
  const texture = useTexture(textureUrl);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const target = useMemo(() => new THREE.Vector3(), []);

  texture.colorSpace = THREE.SRGBColorSpace;

  useFrame(() => {
    if (!groupRef.current || !materialRef.current) {
      return;
    }
    target.set(...position);
    groupRef.current.position.lerp(target, 0.18);

    const targetScale = baseScale * (selected ? 1.13 : hovered ? 1.05 : 1);
    const currentScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.2);
    groupRef.current.scale.setScalar(nextScale);

    materialRef.current.opacity = THREE.MathUtils.lerp(
      materialRef.current.opacity,
      opacity,
      0.18
    );
    materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      materialRef.current.emissiveIntensity,
      selected ? 0.22 : hovered ? 0.16 : 0.05,
      0.18
    );
  });

  return (
    <group ref={groupRef}>
      <RoundedBox
        args={[1.9, 2.6, 0.08]}
        radius={0.12}
        smoothness={6}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(id);
        }}
      >
        <meshStandardMaterial
          ref={materialRef}
          map={texture}
          transparent
          opacity={opacity}
          roughness={0.42}
          metalness={0.06}
          emissive="#ffffff"
          emissiveIntensity={0.05}
        />
      </RoundedBox>
      <mesh position={[0, -1.52, 0]}>
        <planeGeometry args={[2.2, 0.32]} />
        <meshBasicMaterial color={selected ? "#ffffff" : "#ccd0de"} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -1.52, 0.01]}>
        <planeGeometry args={[2.18, 0.3]} />
        <meshBasicMaterial color="#0e1118" transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, -1.52, 0.02]}>
        <planeGeometry args={[2.16, 0.28]} />
        <meshBasicMaterial color="#f8f8fa" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}
