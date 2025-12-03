import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';

const GoldDust: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport, mouse, camera } = useThree();

  const count = CONFIG.GOLD_DUST_COUNT;
  
  // Initial random positions
  const particles = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3); // Velocity
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      
      vel[i * 3] = 0;
      vel[i * 3 + 1] = 0;
      vel[i * 3 + 2] = 0;
    }
    return { pos, vel };
  }, [count]);

  const dummyVec = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Convert mouse screen pos to world ray
    dummyVec.set(mouse.x, mouse.y, 0.5);
    dummyVec.unproject(camera);
    const dir = dummyVec.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z; // Approximate intersection with Z=0 plane
    const targetPos = camera.position.clone().add(dir.multiplyScalar(20)); // Arbitrary depth target
    
    // Physics constants
    const ATTRACTION = 15.0;
    const DRAG = 0.95;
    const RANDOM_DRIFT = 0.5;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      
      // Current pos
      const px = positions[idx];
      const py = positions[idx + 1];
      const pz = positions[idx + 2];
      
      // Calculate vector to mouse
      const dx = targetPos.x - px;
      const dy = targetPos.y - py;
      const dz = targetPos.z - pz;
      
      const distSq = dx*dx + dy*dy + dz*dz;
      const force = Math.min(ATTRACTION / (distSq + 1), 2.0); // Cap force
      
      // Apply force to velocity (Gravity towards cursor)
      particles.vel[idx] += dx * force * delta;
      particles.vel[idx + 1] += dy * force * delta;
      particles.vel[idx + 2] += dz * force * delta;
      
      // Add drift/turbulence
      particles.vel[idx] += (Math.random() - 0.5) * RANDOM_DRIFT * delta;
      particles.vel[idx + 1] += (Math.random() - 0.5) * RANDOM_DRIFT * delta;
      particles.vel[idx + 2] += (Math.random() - 0.5) * RANDOM_DRIFT * delta;
      
      // Apply Drag
      particles.vel[idx] *= DRAG;
      particles.vel[idx + 1] *= DRAG;
      particles.vel[idx + 2] *= DRAG;

      // Update position
      positions[idx] += particles.vel[idx] * delta * 10; // Speed multiplier
      positions[idx + 1] += particles.vel[idx + 1] * delta * 10;
      positions[idx + 2] += particles.vel[idx + 2] * delta * 10;
      
      // Boundary wrap (keep them in scene)
      if (Math.abs(positions[idx]) > 25) positions[idx] *= -0.9;
      if (Math.abs(positions[idx+1]) > 25) positions[idx+1] *= -0.9;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.pos}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FFD700"
        size={0.15}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default GoldDust;
