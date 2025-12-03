import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import HandTracker from './components/HandTracker';
import { TreeState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.CHAOS);
  const [morphProgress, setMorphProgress] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Audio Reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    // "Silent Night" by Kevin MacLeod (incompetech.com)
    // Licensed under Creative Commons: By Attribution 3.0
    // Reliable source from Wikimedia
    const audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/9/9c/Silent_Night_-_Kevin_MacLeod.ogg');
    audio.loop = true;
    audio.volume = 0.6;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Control Audio based on State and Interaction
  useEffect(() => {
    if (!hasInteracted || !audioRef.current) return;

    const audio = audioRef.current;

    if (treeState === TreeState.FORMED) {
      // Try to play if not already playing
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn("Audio play interrupted or failed:", error);
          });
        }
      }
    } else {
      // Pause if playing
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [treeState, hasInteracted]);

  // Transition Logic
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      setMorphProgress((prev) => {
        const target = treeState === TreeState.FORMED ? 1 : 0;
        const diff = target - prev;
        
        // Snap if close
        if (Math.abs(diff) < 0.001) return target;
        
        // Lerp speed
        return prev + diff * 0.03; 
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [treeState]);

  const handleHandStateChange = (state: TreeState | null) => {
    if (state) {
      setTreeState(state);
    }
  };

  const handleStart = () => {
    setHasInteracted(true);
    // Prime audio context immediately on user gesture
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        // If we are currently in CHAOS (Open Hand), pause immediately after priming
        if (treeState !== TreeState.FORMED) {
          audioRef.current?.pause();
        }
      }).catch(e => console.log("Audio unlock failed", e));
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: false, stencil: false, depth: true }}
      >
        <color attach="background" args={['#050505']} />
        <Scene treeState={treeState} morphProgress={morphProgress} />
      </Canvas>

      {/* Hand Tracking Module */}
      <HandTracker onStateChange={handleHandStateChange} />

      {/* Start Screen Overlay (Required for Audio Autoplay) */}
      {!hasInteracted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-700 p-4">
          <div className="flex flex-col items-center text-center p-6 md:p-8 border border-luxury-gold/30 rounded-2xl bg-black/50 shadow-[0_0_60px_rgba(255,215,0,0.15)] w-full max-w-md">
            <h1 className="font-serif text-3xl md:text-5xl text-luxury-gold mb-4 tracking-widest drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]">
              MERRY CHRISTMAS
            </h1>
            <div className="w-16 h-px bg-luxury-gold mb-6 opacity-50"></div>
            <p className="font-sans text-gray-300 text-xs md:text-sm mb-8 tracking-widest uppercase leading-loose">
              An interactive 3D holiday experience.<br/>
              Use hand gestures to control the magic.
            </p>
            <button 
              onClick={handleStart}
              className="group relative px-8 py-3 md:px-10 md:py-4 overflow-hidden rounded-sm bg-transparent border border-luxury-gold text-luxury-gold font-serif text-sm md:text-base tracking-[0.2em] uppercase transition-all duration-300 hover:bg-luxury-gold hover:text-black hover:shadow-[0_0_30px_#FFD700] active:scale-95"
            >
              <span className="relative z-10">Enter Experience</span>
            </button>
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className={`absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6 md:p-8 z-10 transition-opacity duration-1000 ${hasInteracted ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Header */}
        <div className="flex flex-col items-center mt-4 md:mt-0">
          <h1 className="font-serif text-2xl md:text-5xl text-luxury-gold tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)] text-center">
            Merry Christmas
          </h1>
          <h2 className="font-sans text-[10px] md:text-sm text-gray-400 tracking-[0.3em] mt-2 uppercase text-center">
            For Shirakawa Ariko
          </h2>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col items-start md:items-center gap-4 mb-16 md:mb-0">
          <div className="flex flex-col md:flex-row gap-2 md:gap-8 text-xs text-luxury-goldDark font-sans tracking-widest opacity-80 bg-black/40 p-3 rounded-xl md:rounded-full border border-luxury-gold/20 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-luxury-green shadow-[0_0_5px_#004225]"></span>
              <span>OPEN HAND: RAIN CHAOS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-luxury-gold shadow-[0_0_5px_#FFD700]"></span>
              <span>CLOSED FIST: FORM TREE ♫</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest hidden md:block">
            Drag to adjust view perspective
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;