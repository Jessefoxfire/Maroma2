import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

type CameraControllerProps = {
  targetPosition: [number, number, number];
  lookAt?: [number, number, number];
};

export default function CameraController({
  targetPosition,
  lookAt = [0, 0, 0]
}: CameraControllerProps) {
  const { camera } = useThree();
  const targetVector = useMemo(() => new THREE.Vector3(), []);
  const lookAtVector = useMemo(() => new THREE.Vector3(...lookAt), [lookAt]);
  const currentLookAt = useMemo(() => new THREE.Vector3(...lookAt), [lookAt]);

  useFrame(() => {
    targetVector.set(...targetPosition);
    lookAtVector.set(...lookAt);
    camera.position.lerp(targetVector, 0.09);
    currentLookAt.lerp(lookAtVector, 0.08);
    camera.lookAt(currentLookAt);
  });

  return null;
}
