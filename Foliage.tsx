import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, getRandomRainPoint, getTreePoint } from './constants';

const FoliageVertexShader = `
  uniform float uTime;
  uniform float uRainTime; // Freezes rain time during transition to prevent jumping
  uniform float uMorphProgress;
  
  attribute vec3 aPositionChaos;
  attribute vec3 aPositionTarget;
  attribute float aRandom;
  
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Cubic ease out for smoother transition
    float t = uMorphProgress;
    
    // RAIN SIMULATION
    // Rain falls when t is 0 (Chaos). 
    // We use uRainTime so we can pause the "falling" calculation when morphing starts
    // to avoid particles jumping due to modulo wrapping.
    float fallSpeed = 3.0 + aRandom * 5.0;
    float dropOffset = aRandom * 100.0;
    float rainY = aPositionChaos.y - (uRainTime * fallSpeed);
    
    // Updated for larger scale
    float height = 80.0; // Matches CONFIG.RAIN_HEIGHT
    float wrappedY = mod(rainY + 40.0, height) - 40.0;
    
    vec3 rainPos = vec3(aPositionChaos.x, wrappedY, aPositionChaos.z);

    // TRANSITION
    float delayedT = clamp((t * 1.5) - (aRandom * 0.5), 0.0, 1.0);
    float finalT = 1.0 - pow(1.0 - delayedT, 3.0);

    vec3 pos = mix(rainPos, aPositionTarget, finalT);
    
    // Slight wind effect when formed
    if (finalT > 0.8) {
        float wind = sin(uTime * 2.0 + pos.y * 0.5 + pos.x) * 0.05 * (1.0 - (pos.y / 15.0));
        pos.x += wind;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    gl_PointSize = (40.0 * aRandom + 20.0) * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Varying for color in fragment
    vColor = mix(vec3(0.0, 0.26, 0.15), vec3(0.1, 0.36, 0.24), aRandom); 
  }
`;

const FoliageFragmentShader = `
  varying vec3 vColor;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float shine = 1.0 - smoothstep(0.0, 0.4, dist);
    vec3 finalColor = vColor + vec3(shine * 0.3);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface FoliageProps {
  progress: number;
}

const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const rainTimeRef = useRef(0);
  
  const { positionsChaos, positionsTarget, randoms } = useMemo(() => {
    const chaos = new Float32Array(CONFIG.FOLIAGE_COUNT * 3);
    const target = new Float32Array(CONFIG.FOLIAGE_COUNT * 3);
    const rands = new Float32Array(CONFIG.FOLIAGE_COUNT);
    
    for (let i = 0; i < CONFIG.FOLIAGE_COUNT; i++) {
      // Use Rain Point distribution
      const cPos = getRandomRainPoint(CONFIG.RAIN_RADIUS, CONFIG.RAIN_HEIGHT);
      chaos[i * 3] = cPos[0];
      chaos[i * 3 + 1] = cPos[1];
      chaos[i * 3 + 2] = cPos[2];
      
      const tPos = getTreePoint(CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS, i, CONFIG.FOLIAGE_COUNT);
      // Jitter
      tPos[0] += (Math.random() - 0.5) * 0.5;
      tPos[1] += (Math.random() - 0.5) * 0.5;
      tPos[2] += (Math.random() - 0.5) * 0.5;

      target[i * 3] = tPos[0];
      target[i * 3 + 1] = tPos[1];
      target[i * 3 + 2] = tPos[2];
      
      rands[i] = Math.random();
    }
    
    return { positionsChaos: chaos, positionsTarget: target, randoms: rands };
  }, []);

  useFrame((state) => {
    if (shaderRef.current) {
      const time = state.clock.elapsedTime;
      shaderRef.current.uniforms.uTime.value = time;
      
      // Only update rain time if we are in chaos mode (progress near 0)
      // This "freezes" the rain particles at their last position when morphing starts,
      // preventing them from wrapping around during the transition.
      if (progress < 0.05) {
        rainTimeRef.current = time;
      }
      shaderRef.current.uniforms.uRainTime.value = rainTimeRef.current;

      shaderRef.current.uniforms.uMorphProgress.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uMorphProgress.value,
        progress,
        0.05
      );
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uRainTime: { value: 0 },
    uMorphProgress: { value: 0 },
  }), []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-aPositionChaos"
          count={CONFIG.FOLIAGE_COUNT}
          array={positionsChaos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPositionTarget"
          count={CONFIG.FOLIAGE_COUNT}
          array={positionsTarget}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={CONFIG.FOLIAGE_COUNT}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={FoliageVertexShader}
        fragmentShader={FoliageFragmentShader}
        uniforms={uniforms}
        transparent={false}
        depthWrite={true}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};

export default Foliage;