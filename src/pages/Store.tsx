import { useGLTF } from "@react-three/drei";

type ShelfProps = JSX.IntrinsicElements["group"];

export default function Store(props: ShelfProps) {
  const { scene } = useGLTF(
    "https://storage.googleapis.com/3dmodelhost/TIRA-BASIC.glb"
  );

  return <primitive object={scene} {...props} position={[5, 5, 5]} scale={2} />;
}

// Preload the model for better performance
useGLTF.preload("https://storage.googleapis.com/3dmodelhost/TIRA-BASIC.glb");
