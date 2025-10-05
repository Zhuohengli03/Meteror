/**
 * Simplified 3D Earth Scene Component for debugging
 */

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../lib/store/simulation';

interface SceneProps {
  className?: string;
}

function SimpleEarth() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Earth rotation animation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      {/* Simple Earth Sphere */}
      <mesh ref={meshRef} name="earth">
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhongMaterial
          color="#4A90E2"
          shininess={100}
          specular={new THREE.Color(0x111111)}
        />
      </mesh>
    </group>
  );
}

function SimpleLighting() {
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.4} color="#404040" />
      
      {/* Directional light */}
      <directionalLight
        position={[5, 3, 5]}
        intensity={1.0}
        color="#ffffff"
      />
    </>
  );
}

function ImpactMarker() {
  const { currentScenario } = useSimulationStore();
  const [position, setPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (currentScenario) {
      const { impactLatitude, impactLongitude } = currentScenario;
      
      // Convert lat/lng to 3D position on sphere
      const lat = (impactLatitude * Math.PI) / 180;
      const lng = (impactLongitude * Math.PI) / 180;
      
      const x = Math.cos(lat) * Math.cos(lng);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lng);
      
      // Position slightly above Earth surface
      const radius = 1.01;
      setPosition(new THREE.Vector3(x * radius, y * radius, z * radius));
    }
  }, [currentScenario]);

  if (!currentScenario) return null;

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshBasicMaterial color="#FF0000" />
    </mesh>
  );
}

function EarthClickHandler() {
  const { setScenario, currentScenario } = useSimulationStore();
  const { camera, raycaster, mouse, scene } = useThree();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!currentScenario) return;

      // Get mouse position in normalized device coordinates
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update raycaster
      raycaster.setFromCamera(mouse, camera);

      // Find intersection with Earth sphere
      const earthMesh = scene.getObjectByName('earth');
      if (earthMesh) {
        const intersects = raycaster.intersectObject(earthMesh);
        
        if (intersects.length > 0) {
          const point = intersects[0].point;
          
          // Convert 3D point to lat/lng
          const lat = Math.asin(point.y) * (180 / Math.PI);
          const lng = Math.atan2(point.z, point.x) * (180 / Math.PI);
          
          console.log('3D Earth clicked at:', lat, lng);
          
          // Update scenario with new coordinates
          setScenario({
            ...currentScenario,
            impactLatitude: lat,
            impactLongitude: lng
          });
        }
      }
    };

    // Add click event listener
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      return () => canvas.removeEventListener('click', handleClick);
    }
  }, [camera, raycaster, mouse, scene, setScenario, currentScenario]);

  return null;
}

export default function SimpleScene({ className }: SceneProps) {
  const { camera } = useThree();

  // Set up camera position
  useMemo(() => {
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      {/* Lighting setup */}
      <SimpleLighting />
      
      {/* Star field background */}
      <Stars
        radius={300}
        depth={50}
        count={2000}
        factor={7}
        saturation={0}
        fade={true}
      />
      
      {/* Earth */}
      <SimpleEarth />
      
      {/* Impact marker */}
      <ImpactMarker />
      
      {/* Click handler for impact point selection */}
      <EarthClickHandler />
      
      {/* Orbit controls for interaction */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1.5}
        maxDistance={10}
        autoRotate={false}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
}
