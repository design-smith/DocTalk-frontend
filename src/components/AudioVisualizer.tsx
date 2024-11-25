'use client'
import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'

interface AudioVisualizerProps {
  audioData?: number[];
}

export default function AudioVisualizer({ audioData }: AudioVisualizerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    let width = mountRef.current.clientWidth
    let height = mountRef.current.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    mountRef.current.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, 14)
    camera.lookAt(0, 0, 0)

    const renderScene = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85)
    const outputPass = new OutputPass()

    const composer = new EffectComposer(renderer)
    composer.addPass(renderScene)
    composer.addPass(bloomPass)
    composer.addPass(outputPass)

    const uniforms = {
      u_time: { value: 0 },
      u_intensity: { value: 0 },
    }

    const geometry = new THREE.IcosahedronGeometry(4, 20)
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform float u_intensity;
        uniform float u_time;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.x += sin(pos.y * 10.0 + u_time) * u_intensity * 0.1;
          pos.y += sin(pos.z * 10.0 + u_time) * u_intensity * 0.1;
          pos.z += sin(pos.x * 10.0 + u_time) * u_intensity * 0.1;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_intensity;
        varying vec2 vUv;
        void main() {
          vec3 color = 0.5 + 0.5 * cos(u_intensity * 0.05 + vUv.xyx + vec3(0, 2, 4));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const clock = new THREE.Clock()

    const animate = () => {
      requestAnimationFrame(animate)
      uniforms.u_time.value = clock.getElapsedTime()

      if (audioData && audioData.length > 0) {
        const intensity = audioData.reduce((sum, value) => sum + value, 0) / audioData.length
        uniforms.u_intensity.value = intensity / 255 // Normalize to 0-1 range
      } else {
        uniforms.u_intensity.value = 0 // Default to 0 when no audio data
      }

      composer.render()
    }

    animate()

    const handleResize = () => {
      if (!mountRef.current) return
      width = mountRef.current.clientWidth
      height = mountRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      composer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, []) // Remove audioData from dependency array

  useEffect(() => {
    if (!audioData) {
      setError('No audio data available')
    } else {
      setError(null)
    }
  }, [audioData])

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mountRef} 
        className="w-full h-full aspect-video bg-black rounded-lg shadow-lg"
        aria-label="Audio reactive 3D visualization"
      />
      {error && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 text-white">
          {error}
        </div>
      )}
    </div>
  )
}