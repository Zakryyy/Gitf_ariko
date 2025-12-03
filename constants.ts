import * as THREE from 'three';

export const COLORS = {
  EMERALD: new THREE.Color('#004225'),
  EMERALD_LIGHT: new THREE.Color('#1a5c3d'),
  GOLD: new THREE.Color('#FFD700'),
  GOLD_DARK: new THREE.Color('#DAA520'),
  SILVER: new THREE.Color('#E0E0E0'),
  RED_LUXURY: new THREE.Color('#8B0000'),
  GREEN_LUXURY: new THREE.Color('#0B6623'), // Deep glossy forest green
  WHITE_WARM: new THREE.Color('#FFF5E1'),
};

export const CONFIG = {
  // Balanced for high-end mobile and desktop
  FOLIAGE_COUNT: 15000, 
  ORNAMENT_COUNT: 800,
  GOLD_DUST_COUNT: 1200,
  TREE_HEIGHT: 28,
  TREE_RADIUS: 10,
  SPHERE_RADIUS: 35,
  RAIN_HEIGHT: 80,
  RAIN_RADIUS: 30,
};

// Math Helper: Random point in a cylinder/box for Rain
export const getRandomRainPoint = (radius: number, height: number): [number, number, number] => {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius; // Uniform disk
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  const y = (Math.random() - 0.5) * height;
  return [x, y, z];
};

// Math Helper: Random point in sphere (Legacy/Backup)
export const getRandomSpherePoint = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return [x, y, z];
};

// Math Helper: Point on Cone (Tree shape)
export const getTreePoint = (height: number, radius: number, i: number, total: number): [number, number, number] => {
  const y = (i / total) * height; // Bottom to top (0 to height)
  const percentHeight = 1 - (y / height); // 1 at bottom, 0 at top
  const r = radius * Math.pow(percentHeight, 1.2); // Cone shape with slight curve
  
  const angle = i * 0.5; // Spiral
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  
  // Center the tree vertically around 0 roughly
  // Height 28 -> range approx -11 to +17
  return [x, y - height / 2 + 3, z];
};