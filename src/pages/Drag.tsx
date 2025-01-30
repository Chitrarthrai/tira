import React, { useRef, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import {
  OrbitControls,
  PerspectiveCamera,
  TransformControls,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@mui/material";

interface Props {
  selectedShelfUrl: string | null;
  onControlsReady: (controls: any) => void;
}

const ShelfWithDragDrop: React.FC<Props> = ({
  selectedShelfUrl,
  onControlsReady,
}) => {
  const [currentModels, setCurrentModels] = useState<THREE.Group[]>([]);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate">(
    "translate"
  );
  const [isRotating, setIsRotating] = useState(false);

  const orbitControlsRef = useRef<any>(null);
  const transformControlsRef = useRef<any>(null);
  const { camera, gl } = useThree();

  useEffect(() => {
    onControlsReady({
      zoom: (factor: number) => {
        camera.position.multiplyScalar(factor);
        orbitControlsRef.current?.update();
      },
      reset: () => {
        camera.position.set(0, 2, 5);
        orbitControlsRef.current?.target.set(0, 0, 0);
        orbitControlsRef.current?.update();
      },
      toggleRotation: () => setIsRotating((prev) => !prev),
    });
  }, [camera, onControlsReady]);

  useEffect(() => {
    if (!selectedShelfUrl) return;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
    );
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      selectedShelfUrl,
      (gltf) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        setCurrentModels((prevModels) => [...prevModels, model]);
      },
      undefined,
      (error) => console.error("Error loading model:", error)
    );

    return () => {
      dracoLoader.dispose();
    };
  }, [selectedShelfUrl]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 5]} />
      <OrbitControls
        ref={orbitControlsRef}
        enableRotate={isRotating}
        enablePan
        enableZoom
        screenSpacePanning
      />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

      {currentModels.map((model, index) => (
        <TransformControls
          key={index}
          ref={transformControlsRef}
          object={model}
          mode={transformMode}
          onMouseDown={() => (orbitControlsRef.current.enabled = false)}
          onMouseUp={() => (orbitControlsRef.current.enabled = true)}
          camera={camera}>
          <primitive object={model} castShadow receiveShadow />
        </TransformControls>
      ))}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>

      <gridHelper args={[10, 10]} />
    </>
  );
};

export default ShelfWithDragDrop;
