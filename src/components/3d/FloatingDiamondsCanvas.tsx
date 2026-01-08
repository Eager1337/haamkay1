import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingDiamondsCanvasProps {
  onError?: () => void;
}

function Diamond({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
}

function GoldRing({ position, scale }: { position: [number, number, number]; scale: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <torusGeometry args={[1, 0.3, 16, 50]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={1}
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
}

function FloatingGem({ position, scale }: { position: [number, number, number]; scale: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={2} floatIntensity={3}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#2d5a5a"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  const diamonds = useMemo(() => [
    { position: [-4, 2, -2] as [number, number, number], scale: 0.6, speed: 0.4 },
    { position: [4, -1, -3] as [number, number, number], scale: 0.8, speed: 0.3 },
    { position: [2, 3, -4] as [number, number, number], scale: 0.4, speed: 0.5 },
    { position: [-3, -2, -2] as [number, number, number], scale: 0.5, speed: 0.35 },
    { position: [0, 1.5, -5] as [number, number, number], scale: 1, speed: 0.25 },
  ], []);

  const rings = useMemo(() => [
    { position: [3, 2, -3] as [number, number, number], scale: 0.5 },
    { position: [-2, -1.5, -4] as [number, number, number], scale: 0.7 },
  ], []);

  const gems = useMemo(() => [
    { position: [-5, 0, -3] as [number, number, number], scale: 0.4 },
    { position: [5, 1, -2] as [number, number, number], scale: 0.3 },
  ], []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#d4af37" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#2d5a5a" />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} color="#ffffff" />
      
      {diamonds.map((diamond, i) => (
        <Diamond key={`diamond-${i}`} {...diamond} />
      ))}
      
      {rings.map((ring, i) => (
        <GoldRing key={`ring-${i}`} {...ring} />
      ))}
      
      {gems.map((gem, i) => (
        <FloatingGem key={`gem-${i}`} {...gem} />
      ))}
      
      <Sparkles
        count={100}
        scale={15}
        size={2}
        speed={0.5}
        opacity={0.5}
        color="#d4af37"
      />
    </>
  );
}

export default function FloatingDiamondsCanvas({ onError }: FloatingDiamondsCanvasProps) {
  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        onError?.();
      }
    } catch (e) {
      onError?.();
    }
  }, [onError]);

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <Scene />
    </Canvas>
  );
}
