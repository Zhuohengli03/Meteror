/**
 * 3D Earth globe component using Three.js
 */

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Scene from './Scene';

interface Globe3DProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  /**
   * Whether the canvas should fill the parent absolutely (used in Scenario layout)
   * If false, the canvas will respect the provided width/height (used in Demo)
   */
  fullBleed?: boolean;
}

export default function Globe3D({ width = 400, height = 400, className, fullBleed = true }: Globe3DProps) {
  console.log('Globe3D rendering with size:', width, 'x', height);
  
  return (
    <div className={`globe-3d ${className || ''}`} style={{ 
      width: fullBleed ? '100%' : (typeof width === 'number' ? `${width}px` : width),
      height: fullBleed ? '100%' : (typeof height === 'number' ? `${height}px` : height),
      position: fullBleed ? 'absolute' : 'relative',
      top: fullBleed ? 0 : undefined,
      left: fullBleed ? 0 : undefined,
      right: fullBleed ? 0 : undefined,
      bottom: fullBleed ? 0 : undefined
    }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl, scene, camera }) => {
          console.log('Three.js canvas created');
          gl.setClearColor('#000011');
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
          
          // Handle WebGL context loss
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            console.warn('WebGL context lost, preventing default');
            event.preventDefault();
          });
          
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
          });
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}