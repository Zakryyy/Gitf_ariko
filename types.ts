import * as THREE from 'three';

export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface DualPosition {
  chaos: [number, number, number];
  target: [number, number, number];
}

export interface FoliageUniforms {
  uTime: { value: number };
  uMorphProgress: { value: number };
  uColorBase: { value: THREE.Color };
  uColorTip: { value: THREE.Color };
}

export interface OrnamentType {
  type: 'box' | 'ball' | 'light';
  color: string;
  weight: number; // 0-1, heavier moves slower
  scale: number;
}