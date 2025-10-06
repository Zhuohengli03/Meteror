/**
 * Realistic 3D Earth Scene Component
 * Uses @react-three/fiber and @react-three/drei for high-quality Earth rendering
 */

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { latLonToCartesian, cartesianToLatLon } from '../lib/geo/coords';
import { useSimulationStore } from '../lib/store/simulation';

interface SceneProps {
  className?: string;
}

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  
  // Load Earth textures with error handling
  const textures = useTexture([
    '/textures/earth_daymap.jpg',
    '/textures/earth_normalmap.jpg', 
    '/textures/earth_nightmap.jpg',
    '/textures/earth_clouds.png'
  ], (textures) => {
    console.log('Earth textures loaded successfully');
  }, (error) => {
    console.error('Failed to load Earth textures:', error);
  });

  const [dayMap, normalMap, nightMap, cloudsMap] = textures;

  // Configure texture properties
  useMemo(() => {
    textures.forEach(texture => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 16;
        // Fix texture orientation to match geographic coordinates
        texture.flipY = true;
      }
    });
  }, [textures]);

  // Earth and clouds rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      // Earth rotation: counter-clockwise without constant 180° offset
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.y = -state.clock.getElapsedTime() * 0.1;
    }
    if (cloudsRef.current) {
      // Clouds rotate slightly faster, same reference orientation
      cloudsRef.current.rotation.x = 0;
      cloudsRef.current.rotation.y = -state.clock.getElapsedTime() * 0.12; // 20% faster
    }
  });

  return (
    <group>
      {/* Earth Sphere with day texture */}
      <mesh ref={meshRef} name="earth">
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.8, 0.8)}
          shininess={100}
          specular={new THREE.Color(0x111111)}
          emissive={new THREE.Color(0x001122)}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Clouds layer */}
      {cloudsMap && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[1.005, 64, 64]} />
          <meshLambertMaterial
            map={cloudsMap}
            transparent={true}
            opacity={0.8}
            side={THREE.DoubleSide}
            premultipliedAlpha={true}
          />
        </mesh>
      )}

      {/* Night side overlay */}
      {nightMap && (
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.001, 64, 64]} />
          <meshLambertMaterial
            map={nightMap}
            transparent={true}
            opacity={0.6}
            blending={THREE.MultiplyBlending}
            premultipliedAlpha={true}
          />
        </mesh>
      )}
    </group>
  );
}

function ImpactMarker() {
  const { currentScenario } = useSimulationStore();
  const { camera, scene } = useThree();
  const [position, setPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [normal, setNormal] = useState<THREE.Vector3>(new THREE.Vector3(0, 1, 0));
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (currentScenario) {
      const { impactLatitude, impactLongitude } = currentScenario;
      
      // Convert lat/lng to 3D position on sphere
      // Standard geographic coordinate system:
      // Latitude: -90 to +90 (South to North)
      // Longitude: -180 to +180 (West to East)
      // Use shared coordinate conversion without applying earth rotation
      const surfacePosition = latLonToCartesian(impactLatitude, impactLongitude);
      
      // Position on Earth surface
      const radius = 1.0;
      surfacePosition.multiplyScalar(radius);
      setPosition(surfacePosition);
      
      // Calculate surface normal (pointing outward from Earth center)
      setNormal(surfacePosition.clone().normalize());
      
      // Debug: verify coordinate conversion
      console.log('ImpactMarker - Input lat/lng:', impactLatitude, impactLongitude);
      console.log('ImpactMarker - Final position:', surfacePosition);
    }
  }, [currentScenario, scene]);

  // Animation for pulsing rings and billboard effect
  useFrame((state) => {
    if (ringRef.current && outerRingRef.current && groupRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 3) * 0.2;
      const opacity = 0.6 + Math.sin(time * 2) * 0.3;
      
      // Update ring animations
      ringRef.current.scale.setScalar(scale);
      if (ringRef.current.material instanceof THREE.MeshBasicMaterial) {
        ringRef.current.material.opacity = opacity;
      }
      
      outerRingRef.current.scale.setScalar(scale * 1.5);
      if (outerRingRef.current.material instanceof THREE.MeshBasicMaterial) {
        outerRingRef.current.material.opacity = opacity * 0.5;
      }
      
      // Billboard effect - make rings face camera
      if (groupRef.current) {
        const cameraDirection = camera.position.clone().sub(groupRef.current.position).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const right = cameraDirection.clone().cross(up).normalize();
        const billboardUp = right.clone().cross(cameraDirection).normalize();
        
        // Apply billboard rotation to rings only
        const billboardMatrix = new THREE.Matrix4().makeBasis(right, billboardUp, cameraDirection.negate());
        ringRef.current.quaternion.setFromRotationMatrix(billboardMatrix);
        outerRingRef.current.quaternion.setFromRotationMatrix(billboardMatrix);
      }
    }
  });

  if (!currentScenario) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Main impact marker - 3D sphere (always spherical) */}
      <mesh position={normal.clone().multiplyScalar(0.02)}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#FF0000" />
      </mesh>
      
      {/* Pulsing ring effect - Billboard to camera */}
      <mesh ref={ringRef} position={normal.clone().multiplyScalar(0.01)}>
        <ringGeometry args={[0.05, 0.08, 32]} />
        <meshBasicMaterial 
          color="#FF0000" 
          transparent 
          opacity={0.6}
          side={THREE.DoubleSide}
          premultipliedAlpha={true}
        />
      </mesh>
      
      {/* Outer ring - Billboard to camera */}
      <mesh ref={outerRingRef} position={normal.clone().multiplyScalar(0.01)}>
        <ringGeometry args={[0.08, 0.12, 32]} />
        <meshBasicMaterial 
          color="#FF6666" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
          premultipliedAlpha={true}
        />
      </mesh>
      
      {/* Impact crater effect - 3D cone (facing inward) */}
      <mesh position={normal.clone().multiplyScalar(-0.02)}>
        <coneGeometry args={[0.02, 0.04, 8]} />
        <meshBasicMaterial color="#8B0000" />
      </mesh>
    </group>
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
          
          // Get Earth's current rotation to compensate for it
          const earthRotation = earthMesh.rotation.y;
          
          // Rotate the point back to account for Earth's rotation
          const { lat, lon } = cartesianToLatLon(point, earthRotation);
          
          console.log('=== 3D EARTH CLICK DEBUG ===');
          console.log('3D Earth clicked at:', lat, lon);
          console.log('3D point:', point.x, point.y, point.z);
          console.log('Earth rotation:', earthRotation);
          console.log('Rotation compensation applied');
          console.log('=============================');
          
          // Update scenario with new coordinates
          setScenario({
            ...currentScenario,
            impactLatitude: lat,
            impactLongitude: lon
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

function Lighting() {
  return (
    <>
      {/* Enhanced ambient light for better dark side visibility */}
      <ambientLight intensity={0.4} color="#606060" />
      
      {/* Main directional light (Sun) */}
      <directionalLight
        position={[5, 3, 5]}
        intensity={1.8}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Enhanced fill light for dark side illumination */}
      <directionalLight
        position={[-3, -2, -4]}
        intensity={0.6}
        color="#4A90E2"
      />
      
      {/* Additional fill light from opposite side */}
      <directionalLight
        position={[2, -1, -3]}
        intensity={0.4}
        color="#87CEEB"
      />
      
      {/* Point light for atmospheric glow */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.3}
        color="#87CEEB"
        distance={3}
      />
      
      {/* Hemisphere light for more natural lighting */}
      <hemisphereLight
        skyColor="#87CEEB"
        groundColor="#404040"
        intensity={0.5}
      />
    </>
  );
}

function StarField() {
  return (
    <Stars
      radius={1000}
      depth={200}
      count={5000}
      factor={7}
      saturation={0}
      fade={true}
    />
  );
}

function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.02, 32, 32]} />
      <meshBasicMaterial
        color="#87CEEB"
        transparent={true}
        opacity={0.1}
        side={THREE.BackSide}
        premultipliedAlpha={true}
      />
    </mesh>
  );
}

export default function Scene({ className }: SceneProps) {
  const { camera } = useThree();

  // Set up camera position
  useMemo(() => {
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      {/* Star field background */}
      <StarField />
      
      {/* Lighting setup */}
      <Lighting />
      
      {/* Earth with all layers */}
      <Earth />
      
      {/* Atmospheric glow */}
      <Atmosphere />
      
      {/* Impact marker */}
      <ImpactMarker />
      
      {/* Asteroid impact animation */}
      <AsteroidImpactAnimation />
      
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
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        minAzimuthAngle={-Infinity}
        maxAzimuthAngle={Infinity}
      />
    </>
  );
}

// Asteroid Impact Animation Component
function AsteroidImpactAnimation() {
  const { currentScenario, isSimulating } = useSimulationStore();
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'approaching' | 'impact' | 'explosion'>('idle');
  const [animationTime, setAnimationTime] = useState(0);
  const [asteroidPosition, setAsteroidPosition] = useState(new THREE.Vector3(0, 0, 5));
  
  const asteroidRef = useRef<THREE.Mesh>(null);
  const explosionRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Points>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('AsteroidAnimation - isSimulating:', isSimulating, 'currentScenario:', !!currentScenario);
  }, [isSimulating, currentScenario]);
  
  // Calculate asteroid approach position based on impact angle and location
  const calculateAsteroidPosition = (scenario: any) => {
    if (!scenario) return new THREE.Vector3(0, 0, 5);
    
    const { impactLatitude, impactLongitude, impactAngle } = scenario;
    
    // Convert lat/lng to 3D position on Earth surface
    const lat = (impactLatitude * Math.PI) / 180;
    const lng = (impactLongitude * Math.PI) / 180;
    const x = Math.cos(lat) * Math.sin(lng);
    const y = Math.sin(lat);
    const z = Math.cos(lat) * Math.cos(lng);
    
    const impactPosition = new THREE.Vector3(x, y, z);
    
    // Calculate approach direction based on impact angle
    const angleRad = (impactAngle * Math.PI) / 180;
    const approachDistance = 4; // Distance from Earth
    
    // Calculate approach vector based on impact angle
    // For vertical impact (90°), asteroid comes from directly above
    // For shallow impact (0°), asteroid comes from horizontal direction
    const approachVector = new THREE.Vector3(
      Math.sin(angleRad) * Math.sin(lng), // East-West component
      Math.cos(angleRad),                  // Vertical component (main)
      Math.sin(angleRad) * Math.cos(lng)   // North-South component
    );
    
    // Position asteroid at approach distance
    const startPosition = impactPosition.clone().add(
      approachVector.multiplyScalar(approachDistance)
    );
    
    return startPosition;
  };

  // Update asteroid position when scenario changes
  useEffect(() => {
    if (currentScenario) {
      const newPosition = calculateAsteroidPosition(currentScenario);
      setAsteroidPosition(newPosition);
      console.log('Asteroid position updated:', newPosition);
    }
  }, [currentScenario?.impactLatitude, currentScenario?.impactLongitude, currentScenario?.impactAngle]);

  // Start animation when simulation begins
  useEffect(() => {
    if (isSimulating && currentScenario) {
      console.log('Starting asteroid impact animation');
      setAnimationPhase('approaching');
      setAnimationTime(0);
    } else {
      setAnimationPhase('idle');
    }
  }, [isSimulating, currentScenario]);

  // Animation logic
  useFrame((state, delta) => {
    if (animationPhase === 'idle') return;
    
    const newTime = animationTime + delta;
    setAnimationTime(newTime);
    
    console.log('Animation phase:', animationPhase, 'time:', newTime);
    
    if (animationPhase === 'approaching' && newTime > 2.0) {
      console.log('Transitioning to impact phase');
      setAnimationPhase('impact');
    } else if (animationPhase === 'impact' && newTime > 3.0) {
      console.log('Transitioning to explosion phase');
      setAnimationPhase('explosion');
    } else if (animationPhase === 'explosion' && newTime > 6.0) {
      console.log('Animation complete, returning to idle');
      setAnimationPhase('idle');
    }
    
    // Animate asteroid approach
    if (asteroidRef.current && animationPhase === 'approaching') {
      const progress = Math.min(newTime / 2.0, 1);
      
      // Calculate impact position
      const { impactLatitude, impactLongitude } = currentScenario!;
      const lat = (impactLatitude * Math.PI) / 180;
      const lng = (impactLongitude * Math.PI) / 180;
      const x = Math.cos(lat) * Math.sin(lng);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(lng);
      const impactPos = new THREE.Vector3(x, y, z);
      
      // Interpolate from start position to impact position
      asteroidRef.current.position.lerpVectors(asteroidPosition, impactPos, progress);
      asteroidRef.current.rotation.x += delta * 2;
      asteroidRef.current.rotation.y += delta * 1.5;
    }
    
    // Animate explosion
    if (explosionRef.current && animationPhase === 'explosion') {
      const progress = Math.min((newTime - 3.0) / 3.0, 1);
      explosionRef.current.scale.setScalar(progress * 2);
      
      explosionRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = 1 - progress;
        }
      });
    }
    
    // Animate trail
    if (trailRef.current && animationPhase === 'approaching') {
      const progress = Math.min(newTime / 2.0, 1);
      const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] = 5 - progress * 4; // Move trail along Z axis
      }
      trailRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Always show something for debugging
  console.log('Rendering asteroid animation, phase:', animationPhase, 'currentScenario:', !!currentScenario);

  // Always render for debugging
  if (!currentScenario) {
    console.log('No currentScenario, showing test asteroid');
    return (
      <group>
        <mesh position={[0, 0, 3]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#FF0000" />
        </mesh>
      </group>
    );
  }

  const { impactLatitude, impactLongitude } = currentScenario;
  
  // Convert lat/lng to 3D position
  const lat = (impactLatitude * Math.PI) / 180;
  const lng = (impactLongitude * Math.PI) / 180;
  const x = Math.cos(lat) * Math.sin(lng);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(lng);
  
  const impactPosition = new THREE.Vector3(x, y, z);

  return (
    <group>
      {/* Always show asteroid at calculated position */}
      <group position={asteroidPosition}>
        {/* Main asteroid body - irregular shape */}
        <mesh>
          <dodecahedronGeometry args={[0.03, 0]} />
          <meshLambertMaterial color="#4A4A4A" />
        </mesh>
        
        {/* Surface details */}
        <mesh>
          <dodecahedronGeometry args={[0.025, 0]} />
          <meshLambertMaterial color="#2C2C2C" />
        </mesh>
        
        {/* Craters and surface features */}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh 
            key={i}
            position={[
              (Math.random() - 0.5) * 0.04,
              (Math.random() - 0.5) * 0.04,
              (Math.random() - 0.5) * 0.04
            ]}
          >
            <sphereGeometry args={[0.005, 4, 4]} />
            <meshLambertMaterial color="#1A1A1A" />
          </mesh>
        ))}
        
        {/* Glow effect */}
        <mesh>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial 
            color="#8B4513" 
            transparent 
            opacity={0.3}
            premultipliedAlpha={true}
          />
        </mesh>
      </group>

      
      {/* Asteroid approaching during simulation - use ref for animation */}
      {animationPhase === 'approaching' && (
        <group ref={asteroidRef} position={asteroidPosition}>
          {/* Same asteroid model as above, but with ref for animation */}
          <mesh>
            <dodecahedronGeometry args={[0.03, 0]} />
            <meshLambertMaterial color="#4A4A4A" />
          </mesh>
          
          <mesh>
            <dodecahedronGeometry args={[0.025, 0]} />
            <meshLambertMaterial color="#2C2C2C" />
          </mesh>
          
          {Array.from({ length: 8 }, (_, i) => (
            <mesh 
              key={i}
              position={[
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04
              ]}
            >
              <sphereGeometry args={[0.005, 4, 4]} />
              <meshLambertMaterial color="#1A1A1A" />
            </mesh>
          ))}
          
          <mesh>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial 
              color="#8B4513" 
              transparent 
              opacity={0.3}
              premultipliedAlpha={true}
            />
          </mesh>
        </group>
      )}
      
      {/* Impact explosion */}
      {animationPhase === 'explosion' && (
        <group ref={explosionRef} position={impactPosition}>
          {/* Main explosion sphere */}
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial 
              color="#FF4500" 
              transparent 
              opacity={0.8}
              premultipliedAlpha={true}
            />
          </mesh>
          
          {/* Explosion rings */}
          {[0.15, 0.25, 0.35].map((radius, index) => (
            <mesh key={index}>
              <ringGeometry args={[radius, radius + 0.02, 32]} />
              <meshBasicMaterial 
                color="#FFD700" 
                transparent 
                opacity={0.6}
                side={THREE.DoubleSide}
                premultipliedAlpha={true}
              />
            </mesh>
          ))}
          
          {/* Debris particles */}
          {Array.from({ length: 20 }, (_, i) => (
            <mesh key={i} position={[
              (Math.random() - 0.5) * 0.3,
              (Math.random() - 0.5) * 0.3,
              (Math.random() - 0.5) * 0.3
            ]}>
              <sphereGeometry args={[0.005, 4, 4]} />
              <meshBasicMaterial color="#8B4513" />
            </mesh>
          ))}
        </group>
      )}
      
      {/* Trailing effect */}
      {animationPhase === 'approaching' && (
        <points ref={trailRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={50}
              array={new Float32Array(50 * 3).fill(0)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial 
            color="#FFD700" 
            size={0.01} 
            transparent 
            opacity={0.8}
          />
        </points>
      )}
    </group>
  );
}