import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';

function AnimatedOrbs() {
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Slow rotation + mouse parallax
    groupRef.current.rotation.y = Math.sin(t / 6) * 0.3 + state.pointer.x * 0.08;
    groupRef.current.rotation.x = Math.sin(t / 8) * 0.2 + state.pointer.y * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* Pink/Rose Orb - top left */}
      <Float speed={1.4} rotationIntensity={1.2} floatIntensity={2}>
        <Sphere args={[1.2, 64, 64]} position={[-4, 2, -3]}>
          <MeshDistortMaterial color="#f43f5e" distort={0.45} speed={2.5} roughness={0.1} transparent opacity={0.75} />
        </Sphere>
      </Float>

      {/* Blue Orb - bottom right */}
      <Float speed={1.8} rotationIntensity={2} floatIntensity={1.8}>
        <Sphere args={[1.6, 64, 64]} position={[4.5, -2.5, -4]}>
          <MeshDistortMaterial color="#3b82f6" distort={0.3} speed={2} roughness={0.05} transparent opacity={0.7} />
        </Sphere>
      </Float>

      {/* Emerald Orb - top right */}
      <Float speed={1} rotationIntensity={0.8} floatIntensity={3}>
        <Sphere args={[0.9, 64, 64]} position={[3, 3, -5]}>
          <MeshDistortMaterial color="#10b981" distort={0.55} speed={3} roughness={0.2} transparent opacity={0.8} />
        </Sphere>
      </Float>

      {/* Purple Orb - center deep */}
      <Float speed={0.8} rotationIntensity={1.5} floatIntensity={1.5}>
        <Sphere args={[2, 64, 64]} position={[0, -1, -7]}>
          <MeshDistortMaterial color="#8b5cf6" distort={0.2} speed={1} roughness={0.3} transparent opacity={0.4} />
        </Sphere>
      </Float>
    </group>
  );
}

export default function Background3D({ theme }) {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Base Gradient */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #0b0f19 0%, #1a0f2e 40%, #0f1a2e 70%, #0b0f13 100%)'
            : 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 40%, #fdf2f8 70%, #f8fafc 100%)',
        }}
      />

      {/* Three.js Canvas with 3D orbs + stars */}
      <Canvas camera={{ position: [0, 0, 6], fov: 70 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={theme === 'dark' ? 0.4 : 0.8} />
        <pointLight position={[10, 10, 5]} intensity={theme === 'dark' ? 1.5 : 0.8} color={theme === 'dark' ? '#a78bfa' : '#6ee7b7'} />
        <pointLight position={[-10, -5, -5]} intensity={0.8} color={theme === 'dark' ? '#f43f5e' : '#93c5fd'} />
        <Suspense fallback={null}>
          {theme === 'dark' && (
            <Stars radius={80} depth={60} count={4000} factor={3} saturation={0} fade speed={1} />
          )}
          <AnimatedOrbs />
        </Suspense>
      </Canvas>

      {/* Animated Glowing CSS Blobs (layered on top) */}
      <div
        className="absolute rounded-full filter animate-blob"
        style={{
          top: '10%', left: '15%',
          width: '30vw', height: '30vw', maxWidth: 420, maxHeight: 420,
          background: theme === 'dark' ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.12)',
          filter: 'blur(80px)',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute rounded-full filter animate-blob"
        style={{
          top: '25%', right: '10%',
          width: '28vw', height: '28vw', maxWidth: 380, maxHeight: 380,
          background: theme === 'dark' ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)',
          filter: 'blur(90px)',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute rounded-full filter animate-blob"
        style={{
          bottom: '-5%', left: '30%',
          width: '32vw', height: '32vw', maxWidth: 440, maxHeight: 440,
          background: theme === 'dark' ? 'rgba(139,92,246,0.18)' : 'rgba(168,85,247,0.1)',
          filter: 'blur(100px)',
          animationDelay: '4s',
        }}
      />

      {/* Light rays (dark mode only) */}
      {theme === 'dark' && (
        <div className="absolute inset-0 opacity-20"
          style={{
            background: 'conic-gradient(from 200deg at 30% 40%, transparent 0deg, rgba(99,102,241,0.3) 20deg, transparent 40deg, transparent 180deg, rgba(16,185,129,0.2) 200deg, transparent 220deg)',
          }}
        />
      )}
    </div>
  );
}
