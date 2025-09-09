"use client"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, useGLTF, useAnimations } from "@react-three/drei"
import { Suspense, useEffect, useRef } from "react"
import * as THREE from 'three'

interface Avatar3DProps {
  baseColor?: [number, number, number]
  markerColor?: [number, number, number]
  glowColor?: [number, number, number]
  dark?: number
}

// This component loads the animated human model and applies the props.
const HumanAvatar = ({ baseColor, glowColor, dark }: Avatar3DProps) => {
  // Use a stable, realistic GLB model from a reliable source like Sketchfab.
  // This model is a simple human character. You can replace this URL with your own avatar.
  const { scene, animations } = useGLTF("https://models.readyplayer.me/65c5d0ed19f298246d6543b3.glb")
  const group = useRef()
  const { actions } = useAnimations(animations, group)
  
  // Ensure the model receives shadows
  scene.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true
    }
  })

  // Use a ref to control the mixer in the useFrame hook
  const mixerRef = useRef(new THREE.AnimationMixer(scene))
  useFrame((state, delta) => {
    mixerRef.current.update(delta)
  })

  // Play the first animation found in the model
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = actions[Object.keys(actions)[0]]
      firstAction?.play()
    }
  }, [actions])

  // Apply the base color to the model's material
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.material.color.set(new THREE.Color(...baseColor))
        }
      })
    }
  }, [baseColor, scene])

  // Adjust the scale and position for the new model
  return <primitive ref={group} object={scene} scale={2} position={[0, -2, 0]} />
}

export default function Avatar3D({
  baseColor = [0.9, 0.55, 0.3], // default orange-ish
  markerColor = [0, 0, 0],
  glowColor = [0.27, 0.57, 0.89],
  dark = 1,
}: Avatar3DProps) {
  return (
    <div className="z-[10] mx-auto flex w-full max-w-[350px] items-center justify-center">
      <Canvas
        style={{
          width: "100%",
          height: "100%",
          aspectRatio: "1",
        }}
        camera={{ position: [0, 1.5, 3] }}
        shadows
      >
        <ambientLight intensity={0.5 * dark} />
        <directionalLight
          position={[2, 2, 2]}
          intensity={1.5}
          color={glowColor as any}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <Suspense fallback={null}>
          <HumanAvatar baseColor={baseColor} glowColor={glowColor} dark={dark} />
        </Suspense>
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )
}
