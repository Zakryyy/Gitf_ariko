import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS, getRandomSpherePoint, getTreePoint } from '../constants';
import { OrnamentType } from '../types';

interface OrnamentsProps {
  progress: number;
}

const tempObject = new THREE.Object3D();
const tempPos = new THREE.Vector3();
const tempTarget = new THREE.Vector3();
const tempChaos = new THREE.Vector3();

const Ornaments: React.FC<OrnamentsProps> = ({ progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh>(null);

  // Define ornament data structure
  const ornaments = useMemo(() => {
    const items: {
      chaos: THREE.Vector3;
      target: THREE.Vector3;
      weight: number;
      scale: number;
      color: THREE.Color;
      type: 'box' | 'ball' | 'light';
    }[] = [];

    for (let i = 0; i < CONFIG.ORNAMENT_COUNT; i++) {
      const isLight = Math.random() > 0.65; // 35% lights, 65% decorations
      const type = isLight ? 'light' : (Math.random() > 0.8 ? 'box' : 'ball');
      
      const chaosArr = getRandomSpherePoint(CONFIG.SPHERE_RADIUS * 1.1);
      
      // Distribute randomly on the tree cone volume, not just spiral line
      const h = Math.random() * CONFIG.TREE_HEIGHT;
      const rMax = CONFIG.TREE_RADIUS * Math.pow(1 - (h / CONFIG.TREE_HEIGHT), 1.2);
      const angle = Math.random() * Math.PI * 2;
      const r = isLight ? rMax + 0.3 : Math.random() * rMax; // Lights on outside, others inside
      
      const targetArr = [
        Math.cos(angle) * r,
        h - CONFIG.TREE_HEIGHT / 2 + 3,
        Math.sin(angle) * r
      ];

      // Weight: Heavy items (boxes) move slower
      let weight = 0.1;
      let scale = 0.3;
      let color = COLORS.GOLD;

      if (type === 'box') {
        weight = 0.02; // Very heavy
        scale = 0.5 + Math.random() * 0.3;
        color = Math.random() > 0.5 ? COLORS.RED_LUXURY : COLORS.GOLD_DARK;
      } else if (type === 'ball') {
        weight = 0.05;
        scale = 0.4 + Math.random() * 0.2;
        
        // Luxurious Mix: Gold, Silver, Red, Green
        const roll = Math.random();
        if (roll < 0.35) color = COLORS.GOLD;
        else if (roll < 0.55) color = COLORS.RED_LUXURY;
        else if (roll < 0.75) color = COLORS.GREEN_LUXURY; // The new Green spheres
        else color = COLORS.SILVER;
        
      } else {
        weight = 0.15; // Light/Fast
        scale = 0.15;
        color = COLORS.WHITE_WARM;
      }

      items.push({
        chaos: new THREE.Vector3(...chaosArr),
        target: new THREE.Vector3(targetArr[0], targetArr[1], targetArr[2]),
        weight,
        scale,
        color,
        type
      });
    }
    return items;
  }, []);

  // Separate active ornaments to simulate statefulness
  // We need to track current position per instance to allow for different speeds
  const currentPositions = useMemo(() => {
    return ornaments.map(o => o.chaos.clone());
  }, [ornaments]);

  useLayoutEffect(() => {
    if (meshRef.current) {
      ornaments.forEach((o, i) => {
        if (o.type !== 'light') {
          meshRef.current!.setColorAt(i, o.color);
        }
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
    if (glowMeshRef.current) {
        let lightIdx = 0;
        ornaments.forEach((o, i) => {
            if (o.type === 'light') {
                glowMeshRef.current!.setColorAt(lightIdx, o.color);
                lightIdx++;
            }
        });
        glowMeshRef.current.instanceMatrix.needsUpdate = true;
        if (glowMeshRef.current.instanceColor) glowMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [ornaments]);

  useFrame((state, delta) => {
    if (!meshRef.current || !glowMeshRef.current) return;

    let lightCount = 0;

    ornaments.forEach((o, i) => {
      // Determine destination based on global progress
      const dest = progress > 0.5 ? o.target : o.chaos;
      
      // Interpolate current position towards destination
      const speed = progress > 0.5 ? (o.weight * 60) : (o.weight * 20);
      
      currentPositions[i].lerp(dest, THREE.MathUtils.clamp(speed * delta, 0, 1));
      
      // Update dummy object
      tempObject.position.copy(currentPositions[i]);
      tempObject.scale.setScalar(o.scale);
      
      // Add slight rotation to boxes/balls
      if (o.type !== 'light') {
         tempObject.rotation.y += delta * o.weight;
         tempObject.rotation.z += delta * o.weight * 0.5;
         tempObject.updateMatrix();
         meshRef.current!.setMatrixAt(i, tempObject.matrix);
      } else {
         // Lights pulse
         const pulse = 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.2;
         tempObject.scale.setScalar(o.scale * pulse);
         tempObject.updateMatrix();
         glowMeshRef.current!.setMatrixAt(lightCount, tempObject.matrix);
         lightCount++;
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    glowMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  const lightCount = ornaments.filter(o => o.type === 'light').length;

  return (
    <group>
      {/* Non-emissive ornaments (reflect light) */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, CONFIG.ORNAMENT_COUNT]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          roughness={0.15}
          metalness={0.9}
          envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* Emissive lights (bloom targets) */}
      <instancedMesh
        ref={glowMeshRef}
        args={[undefined, undefined, lightCount]}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          toneMapped={false} // Important for bloom
        />
      </instancedMesh>
    </group>
  );
};

export default Ornaments;