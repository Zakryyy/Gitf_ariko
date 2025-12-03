import React, { useRef } from 'react';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useFrame } from '@react-three/fiber';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import { TreeState } from '../types';

interface SceneProps {
  treeState: TreeState;
  morphProgress: number; // 0 to 1
}

const Scene: React.FC<SceneProps> = ({ treeState, morphProgress }) => {
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    // Add a very slow luxurious spin when auto-rotate is enabled or manual check
    if (controlsRef.current) {
      // Optional: Enhance luxury feel by modifying damping based on state
      controlsRef.current.autoRotateSpeed = treeState === TreeState.FORMED ? 0.5 : 0.1;
    }
  });

  return (
    <>
      {/* 
        Camera moved back to 65 to see full tree. 
        Centered at Y=0.
      */}
      <PerspectiveCamera makeDefault position={[0, 0, 65]} fov={45} />
      
      {/* View Controls - Adjusted to look at absolute center */}
      <OrbitControls 
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={30}
        maxDistance={90}
        autoRotate={true}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
        target={[0, 0, 0]} 
      />
      
      {/* Lighting: Grand Luxury Ambience */}
      <ambientLight intensity={0.2} color="#001a0f" />
      <spotLight
        position={[15, 40, 15]}
        angle={0.3}
        penumbra={0.5}
        intensity={2.5}
        castShadow
        color="#fff5e6" // Warm white
      />
      <pointLight position={[-15, 10, -15]} intensity={1.5} color="#FFD700" />
      <pointLight position={[15, 5, 15]} intensity={0.5} color="#DAA520" />

      <Environment preset="lobby" background={false} blur={0.6} />

      {/* 
         Main Object Group 
         Shifted Y to -3. This aligns the visual center of the tree 
         (which spans approx -11 to +17 in local space) to World 0.
      */}
      <group position={[0, -3, 0]}>
        <Foliage progress={morphProgress} />
        <Ornaments progress={morphProgress} />
      </group>

      {/* Cinematic Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.9} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.5}
        />
        <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </>
  );
};

export default Scene;