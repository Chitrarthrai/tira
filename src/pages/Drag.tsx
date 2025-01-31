import React, { useRef, useState, useEffect, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import {
  OrbitControls,
  PerspectiveCamera,
  TransformControls,
} from "@react-three/drei";
import * as THREE from "three";
import { DroppedModel, SavedModelState } from "./types";

// Props interface defines what the component expects to receive from its parent
interface Props {
  selectedShelfUrl: string | null; // URL of the currently selected shelf model
  onControlsReady: (controlsRef: any) => void; // Callback to pass controls to parent
  savedState: SavedModelState[]; // Array of previously saved models and their states
}

const ShelfWithDragDrop: React.FC<Props> = ({
  selectedShelfUrl,
  onControlsReady,
  savedState,
}) => {
  // State for tracking all models in the scene
  const [droppedModels, setDroppedModels] = useState<DroppedModel[]>([]);

  // State for controlling transform mode (move or rotate)
  const [transformMode, setTransformMode] = useState<
    "translate" | "rotateX" | "rotateY" | "rotateZ"
  >("translate");

  // Refs for Three.js objects and controls
  const orbitControlsRef = useRef<any>(null);
  const transformControlsRef = useRef<any>(null);
  const { camera, gl } = useThree(); // Get Three.js context
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycaster = useRef(new THREE.Raycaster());
  const mousePosition = useRef(new THREE.Vector2());
  const intersectionPoint = useRef(new THREE.Vector3());

  // Pass control references back to parent component
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
    });
  }, [camera, onControlsReady]);

  // Load initial base shelf model
  useEffect(() => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
    );

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load base model if no saved state exists
    if (savedState.length === 0) {
      gltfLoader.load(
        "https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_1.glb",
        (gltf) => {
          setDroppedModels([
            {
              id: Date.now(),
              model: gltf.scene,
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              url: "https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_1.glb",
            },
          ]);
          // Remove this line since we're not using it:
          // setShelfModelLoaded(true);
        },
        undefined,
        (error) => console.error("Error loading base model:", error)
      );
    }

    return () => {
      dracoLoader.dispose();
    };
  }, [savedState]);

  // Load saved models when savedState changes
  useEffect(() => {
    if (savedState.length > 0) {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(
        "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
      );
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);

      // Clear existing models before loading saved ones
      setDroppedModels([]);

      // Load each saved model
      savedState.forEach((savedModel) => {
        gltfLoader.load(
          savedModel.url,
          (gltf) => {
            const model = gltf.scene;
            model.position.set(...savedModel.position);
            model.rotation.set(...savedModel.rotation);

            setDroppedModels((prev) => [
              ...prev,
              {
                id: savedModel.id,
                model: model,
                position: savedModel.position,
                rotation: savedModel.rotation,
                url: savedModel.url,
              },
            ]);
          },
          undefined,
          (error) => console.error("Error loading saved model:", error)
        );
      });

      return () => {
        dracoLoader.dispose();
      };
    }
  }, [savedState]);

  // Save state whenever models change
  useEffect(() => {
    if (droppedModels.length > 0) {
      const stateToSave = droppedModels.map((model) => ({
        id: model.id,
        position: [
          model.model.position.x,
          model.model.position.y,
          model.model.position.z,
        ] as [number, number, number],
        rotation: [
          model.model.rotation.x,
          model.model.rotation.y,
          model.model.rotation.z,
        ] as [number, number, number],
        url: model.url,
      }));
      localStorage.setItem("shelfScene", JSON.stringify(stateToSave));
    }
  }, [droppedModels]);

  // Calculate drop position from mouse coordinates
  const getDropPosition = useCallback(
    (event: MouseEvent): [number, number, number] => {
      const rect = gl.domElement.getBoundingClientRect();
      mousePosition.current.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mousePosition.current.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mousePosition.current, camera);
      raycaster.current.ray.intersectPlane(
        plane.current,
        intersectionPoint.current
      );

      return [
        intersectionPoint.current.x,
        0, // Keep y at 0 to ensure model stays on ground
        intersectionPoint.current.z,
      ];
    },
    [camera, gl.domElement]
  );

  // Handle drag and drop events
  useEffect(() => {
    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      if (!selectedShelfUrl) return;

      const dropPosition = getDropPosition(event);

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
          model.position.set(dropPosition[0], dropPosition[1], dropPosition[2]);

          setDroppedModels((prev) => [
            ...prev,
            {
              id: Date.now(),
              model: model,
              position: dropPosition,
              rotation: [0, 0, 0],
              url: selectedShelfUrl,
            },
          ]);
        },
        undefined,
        (error) => console.error("Error loading selected model:", error)
      );

      dracoLoader.dispose();
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    gl.domElement.addEventListener("drop", handleDrop);
    gl.domElement.addEventListener("dragover", handleDragOver);

    return () => {
      gl.domElement.removeEventListener("drop", handleDrop);
      gl.domElement.removeEventListener("dragover", handleDragOver);
    };
  }, [selectedShelfUrl, getDropPosition, gl.domElement]);

  // Toggle between transform modes
  const toggleTransformMode = useCallback(() => {
    setTransformMode((prev) => {
      switch (prev) {
        case "translate":
          return "rotateX";
        case "rotateX":
          return "rotateY";
        case "rotateY":
          return "rotateZ";
        default:
          return "translate";
      }
    });
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        toggleTransformMode();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [toggleTransformMode]);

  // Prevent models from going below ground level
  const enforceGroundLimit = useCallback((model: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(model);
    const bottomY = box.min.y;
    if (bottomY < 0) model.position.y -= bottomY;
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 5]} />
      <OrbitControls
        ref={orbitControlsRef}
        enableRotate
        enablePan
        screenSpacePanning
      />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

      {droppedModels.map(({ id, model }) => (
        <TransformControls
          key={id}
          ref={transformControlsRef}
          object={model}
          mode={transformMode === "translate" ? "translate" : "rotate"}
          rotationSnap={
            transformMode.startsWith("rotate") ? Math.PI / 180 : undefined
          }
          showX={transformMode === "translate" || transformMode === "rotateX"}
          showY={transformMode === "translate" || transformMode === "rotateY"}
          showZ={transformMode === "translate" || transformMode === "rotateZ"}
          onMouseDown={() => (orbitControlsRef.current.enabled = false)}
          onMouseUp={() => {
            orbitControlsRef.current.enabled = true;
            enforceGroundLimit(model);
          }}
          camera={camera}>
          <primitive object={model} castShadow />
        </TransformControls>
      ))}

      <gridHelper args={[10, 10]} />
    </>
  );
};

export default ShelfWithDragDrop;
