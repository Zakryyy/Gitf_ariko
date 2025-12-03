import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { TreeState } from '../types';

interface HandTrackerProps {
  onStateChange: (state: TreeState | null) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onStateChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gesture, setGesture] = useState<'OPEN' | 'FIST' | 'NONE'>('NONE');
  const lastVideoTime = useRef(-1);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setLoaded(true);
        startCamera();
      } catch (err) {
        console.error("MediaPipe Init Error:", err);
        setError("Failed to load AI vision.");
      }
    };
    
    init();
    
    return () => {
      if (landmarkerRef.current) landmarkerRef.current.close();
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      // facingMode: "user" ensures front camera on mobile devices
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user" 
        } 
      });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener('loadeddata', predictWebcam);
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Camera access denied.");
    }
  };

  const predictWebcam = async () => {
    if (!landmarkerRef.current || !videoRef.current) return;
    
    const now = performance.now();
    if (videoRef.current.currentTime !== lastVideoTime.current) {
      lastVideoTime.current = videoRef.current.currentTime;
      
      const result = landmarkerRef.current.detectForVideo(videoRef.current, now);
      
      if (result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0];
        
        // Logic: Calculate average distance from fingertips to wrist (landmark 0)
        // Landmarks: 4 (Thumb), 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
        const wrist = landmarks[0];
        const tips = [4, 8, 12, 16, 20];
        
        let totalDist = 0;
        tips.forEach(idx => {
          const tip = landmarks[idx];
          const dx = tip.x - wrist.x;
          const dy = tip.y - wrist.y;
          // z is ignored for simple open/close check, but available
          totalDist += Math.sqrt(dx*dx + dy*dy);
        });
        
        const avgDist = totalDist / 5;
        
        // Threshold needs calibration based on normalized coords
        // Usually open hand > 0.3, fist < 0.15 roughly
        if (avgDist < 0.2) {
          setGesture('FIST');
          onStateChange(TreeState.FORMED);
        } else {
          setGesture('OPEN');
          onStateChange(TreeState.CHAOS);
        }
      } else {
        setGesture('NONE');
        onStateChange(null);
      }
    }
    
    requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <div className={`
        relative p-1 rounded-full overflow-hidden border-2 
        transition-colors duration-500
        ${gesture === 'FIST' ? 'border-luxury-gold shadow-[0_0_20px_#FFD700]' : 
          gesture === 'OPEN' ? 'border-luxury-green shadow-[0_0_20px_#004225]' : 'border-gray-800'}
      `}>
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted
          className="w-20 h-20 md:w-32 md:h-24 object-cover rounded-full opacity-80"
          style={{ transform: 'scaleX(-1)' }} // Mirror
        />
        
        {/* Status Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
           {!loaded && !error && <span className="text-white text-[10px] md:text-xs">Loading AI...</span>}
           {error && <span className="text-red-500 text-[10px] md:text-xs">Error</span>}
        </div>
      </div>
      
      <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-luxury-gold/30">
        <span className="text-luxury-goldLight text-[10px] md:text-xs tracking-widest uppercase font-sans whitespace-nowrap">
            {gesture === 'FIST' ? '🎄 Formed' : gesture === 'OPEN' ? '🌧️ Chaos' : 'Show Hand'}
        </span>
      </div>
    </div>
  );
};

export default HandTracker;