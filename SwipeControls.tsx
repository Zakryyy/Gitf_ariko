import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SwipeControlsProps {
  children: React.ReactNode;
}

const SwipeControls: React.FC<SwipeControlsProps> = ({ children }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();
  
  // Physics state
  const [isDragging, setIsDragging] = useState(false);
  const previousX = useRef(0);
  const velocity = useRef(0);
  const FRICTION = 0.96;
  const SENSITIVITY = 0.005;

  // Event Handlers
  const onPointerDown = (e: PointerEvent) => {
    setIsDragging(true);
    previousX.current = e.clientX;
    velocity.current = 0; // Stop existing spin on grab
  };

  const onPointerUp = () => {
    setIsDragging(false);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (isDragging) {
      const delta = e.clientX - previousX.current;
      velocity.current = delta * SENSITIVITY;
      previousX.current = e.clientX;
      
      // Direct rotation while dragging
      if (groupRef.current) {
        groupRef.current.rotation.y += velocity.current;
      }
    }
  };

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [gl, isDragging]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (!isDragging) {
      // Apply momentum
      groupRef.current.rotation.y += velocity.current;
      // Apply friction
      velocity.current *= FRICTION;
      
      // Minimum velocity cutoff
      if (Math.abs(velocity.current) < 0.0001) velocity.current = 0;
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};

export default SwipeControls;
