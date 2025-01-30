import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls, PerspectiveCamera, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { DroppedModel } from './types';

interface Props {
  selectedShelfUrl: string | null;
}

const ShelfWithDragDrop: React.FC<Props> = ({ selectedShelfUrl }) => {
  const [droppedModels, setDroppedModels] = useState<DroppedModel[]>([]);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotateX' | 'rotateY' | 'rotateZ'>('translate');

  const orbitControlsRef = useRef<any>(null);
  const transformControlsRef = useRef<any>(null);
  const { camera, gl } = useThree();
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycaster = useRef(new THREE.Raycaster());
  const mousePosition = useRef(new THREE.Vector2());
  const intersectionPoint = useRef(new THREE.Vector3());

  // Calculate drop position from mouse coordinates
  const getDropPosition = useCallback((event: MouseEvent): [number, number, number] => {
    const rect = gl.domElement.getBoundingClientRect();
    mousePosition.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mousePosition.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mousePosition.current, camera);
    raycaster.current.ray.intersectPlane(plane.current, intersectionPoint.current);
    
    return [
      intersectionPoint.current.x,
      0, // Keep y at 0 to ensure model stays on ground
      intersectionPoint.current.z
    ];
  }, [camera, gl.domElement]);

  // Load base shelf model
  useEffect(() => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      'https://storage.googleapis.com/3dmodelhost/Shelves/SHELF_1.glb',
      (gltf) => {
        setDroppedModels([{ 
          id: Date.now(), 
          model: gltf.scene,
          position: [0, 0, 0] as [number, number, number]
        }]);
      },
      undefined,
      (error) => console.error('Error loading base model:', error)
    );

    return () => {
      dracoLoader.dispose();
    };
  }, []);

  // Handle drag and drop events
  useEffect(() => {
    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      if (!selectedShelfUrl) return;
  
      const dropPosition = getDropPosition(event);
  
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);
  
      gltfLoader.load(
        selectedShelfUrl,
        (gltf) => {
          const model = gltf.scene;
          // Set the model position immediately after loading
          model.position.set(dropPosition[0], dropPosition[1], dropPosition[2]);
  
          // Ensure the new model is added without replacing old ones
          setDroppedModels((prev) => [
            ...prev,  // Keep the previous models
            {
              id: Date.now(),  // Unique ID for each model
              model: model,
              position: dropPosition,
            }
          ]);
        },
        undefined,
        (error) => console.error('Error loading selected model:', error)
      );
  
      dracoLoader.dispose();
    };
  
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };
  
    gl.domElement.addEventListener('drop', handleDrop);
    gl.domElement.addEventListener('dragover', handleDragOver);
  
    return () => {
      gl.domElement.removeEventListener('drop', handleDrop);
      gl.domElement.removeEventListener('dragover', handleDragOver);
    };
  }, [selectedShelfUrl, getDropPosition, gl.domElement]);
  
  


  // Prevent model from going below the ground
  const enforceGroundLimit = useCallback((model: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(model);
    const bottomY = box.min.y;
    if (bottomY < 0) model.position.y -= bottomY;
  }, []);

  // Toggle between transform modes
  const toggleTransformMode = useCallback(() => {
    setTransformMode(prev => {
      switch (prev) {
        case 'translate': return 'rotateX';
        case 'rotateX': return 'rotateY';
        case 'rotateY': return 'rotateZ';
        default: return 'translate';
      }
    });
  }, []);

  // Listen for key press to switch transform mode
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'r' || event.key === 'R') {
        toggleTransformMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleTransformMode]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 5]} />
      <OrbitControls ref={orbitControlsRef} enableRotate enablePan screenSpacePanning />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

      {droppedModels.map(({ id, model }) => (
        <TransformControls
          key={id}
          ref={transformControlsRef}
          object={model}
          mode={transformMode === 'translate' ? 'translate' : 'rotate'}
          rotationSnap={transformMode.startsWith('rotate') ? Math.PI / 180 : undefined}
          showX={transformMode === 'translate' || transformMode === 'rotateX'}
          showY={transformMode === 'translate' || transformMode === 'rotateY'}
          showZ={transformMode === 'translate' || transformMode === 'rotateZ'}
          onMouseDown={() => orbitControlsRef.current.enabled = false}
          onMouseUp={() => {
            orbitControlsRef.current.enabled = true;
            enforceGroundLimit(model);
          }}
          camera={camera}
        >
          <primitive object={model} castShadow />
        </TransformControls>
      ))}

      <gridHelper args={[10, 10]} />
    </>
  );
};

export default ShelfWithDragDrop;

