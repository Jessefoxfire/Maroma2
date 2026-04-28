import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import CameraController from "./CameraController";
import ProductMesh from "./ProductMesh";

export type SceneProduct = {
  id: string;
  name: string;
  textureUrl: string;
  position: [number, number, number];
  scale: number;
  opacity: number;
  selected: boolean;
};

type SceneProps = {
  products: SceneProduct[];
  cameraZ: number;
  cameraLookAt?: [number, number, number];
  onProductSelect: (id: string) => void;
  onScrollDepth: (deltaY: number) => void;
};

export default function Scene({
  products,
  cameraZ,
  cameraLookAt = [0, 0, 0],
  onProductSelect,
  onScrollDepth
}: SceneProps) {
  return (
    <div className="depth-scene-shell" onWheel={(event) => onScrollDepth(event.deltaY)}>
      <Canvas camera={{ position: [0, 0, 8], fov: 48 }}>
        <ambientLight intensity={0.54} />
        <directionalLight position={[4.5, 5.5, 6]} intensity={1.12} />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} />
        <Suspense fallback={null}>
          <CameraController targetPosition={[0, 0, cameraZ]} lookAt={cameraLookAt} />
          {products.map((product) => (
            <ProductMesh
              key={product.id}
              id={product.id}
              name={product.name}
              textureUrl={product.textureUrl}
              position={product.position}
              baseScale={product.scale}
              opacity={product.opacity}
              selected={product.selected}
              onSelect={onProductSelect}
            />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
}
