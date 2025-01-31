import * as THREE from "three";

export interface Shelf {
  id: number;
  url: string;
  preview: string;
}

export interface DraggableShelfProps {
  shelf: Shelf;
  onSelectShelf: (url: string) => void;
}

export interface DroppedModel {
  id: number;
  model: THREE.Object3D;
  position: [number, number, number];
  rotation: [number, number, number];
  url: string; // Added to track which model was placed
}

export interface SavedModelState {
  id: number;
  position: [number, number, number];
  rotation: [number, number, number];
  url: string;
}
