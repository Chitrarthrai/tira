import * as THREE from 'three';

export interface DroppedModel {
  id: number;
  model: THREE.Object3D;
  position: [number, number, number];
}