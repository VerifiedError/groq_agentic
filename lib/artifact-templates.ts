/**
 * Artifact Templates
 * Starter templates for different types of interactive code artifacts
 */

export type ArtifactType = 'react' | 'vanilla-js' | 'html' | 'react-game-3d' | 'react-game-2d'

export interface ArtifactTemplate {
  id: string
  type: ArtifactType
  title: string
  description: string
  icon: string
  files: Record<string, string>
  dependencies?: Record<string, string>
  tags: string[]
}

export const ARTIFACT_TEMPLATES: ArtifactTemplate[] = [
  // React Starter
  {
    id: 'react-starter',
    type: 'react',
    title: 'React App',
    description: 'Basic React application with hooks',
    icon: '⚛️',
    files: {
      '/App.js': `import React, { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{
      fontFamily: 'sans-serif',
      padding: '40px',
      textAlign: 'center'
    }}>
      <h1>Hello React! 👋</h1>
      <p>You clicked {count} times</p>
      <button
        onClick={() => setCount(count + 1)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        Click me
      </button>
    </div>
  )
}`,
      '/styles.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}`
    },
    tags: ['react', 'starter', 'hooks']
  },

  // Whisker World 3D Game
  {
    id: 'whisker-world-3d',
    type: 'react-game-3d',
    title: 'Whisker World - 3D Cat Adventure',
    description: 'Interactive 3D game with THREE.js - control a cat in a vibrant garden',
    icon: '🐱',
    files: {
      '/App.js': `import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const WhiskerWorld = () => {
  const mountRef = useRef(null)
  const [instructions, setInstructions] = useState(true)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB)
    scene.fog = new THREE.Fog(0x87CEEB, 50, 100)

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    sunLight.position.set(20, 30, 10)
    sunLight.castShadow = true
    sunLight.shadow.camera.left = -50
    sunLight.shadow.camera.right = 50
    sunLight.shadow.camera.top = 50
    sunLight.shadow.camera.bottom = -50
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    scene.add(sunLight)

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Platforms
    const platforms = []

    const platform1 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1, 8),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    )
    platform1.position.set(-10, 0.5, -5)
    platform1.castShadow = true
    platform1.receiveShadow = true
    scene.add(platform1)
    platforms.push({ mesh: platform1, height: 1 })

    const platform2 = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1, 6),
      new THREE.MeshLambertMaterial({ color: 0xA0522D })
    )
    platform2.position.set(10, 2.5, -8)
    platform2.castShadow = true
    platform2.receiveShadow = true
    scene.add(platform2)
    platforms.push({ mesh: platform2, height: 3 })

    const platform3 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1, 5),
      new THREE.MeshLambertMaterial({ color: 0xD2691E })
    )
    platform3.position.set(5, 5.5, 5)
    platform3.castShadow = true
    platform3.receiveShadow = true
    scene.add(platform3)
    platforms.push({ mesh: platform3, height: 6 })

    // Trees
    for (let i = 0; i < 5; i++) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 3, 8),
        new THREE.MeshLambertMaterial({ color: 0x6B4423 })
      )
      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x228B22 })
      )

      const x = Math.random() * 40 - 20
      const z = Math.random() * 40 - 20

      trunk.position.set(x, 1.5, z)
      foliage.position.set(x, 3.5, z)

      trunk.castShadow = true
      foliage.castShadow = true

      scene.add(trunk)
      scene.add(foliage)
    }

    // Interactive ball
    const ballGeometry = new THREE.SphereGeometry(0.5, 16, 16)
    const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xFF1493 })
    const ball = new THREE.Mesh(ballGeometry, ballMaterial)
    ball.position.set(0, 0.5, -10)
    ball.castShadow = true
    scene.add(ball)

    // Cat model
    const cat = new THREE.Group()

    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 2)
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF8C00 })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    cat.add(body)

    const headGeometry = new THREE.BoxGeometry(0.8, 0.7, 0.8)
    const head = new THREE.Mesh(headGeometry, bodyMaterial)
    head.position.set(0, 0.3, 1.2)
    head.castShadow = true
    cat.add(head)

    const earGeometry = new THREE.ConeGeometry(0.2, 0.4, 4)
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial)
    leftEar.position.set(-0.3, 0.85, 1.2)
    leftEar.castShadow = true
    cat.add(leftEar)

    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial)
    rightEar.position.set(0.3, 0.85, 1.2)
    rightEar.castShadow = true
    cat.add(rightEar)

    const tailGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.5, 8)
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial)
    tail.position.set(0, 0.5, -1.3)
    tail.rotation.x = Math.PI / 3
    tail.castShadow = true
    cat.add(tail)

    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8)
    const positions = [
      [-0.4, -0.7, 0.6],
      [0.4, -0.7, 0.6],
      [-0.4, -0.7, -0.6],
      [0.4, -0.7, -0.6]
    ]

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial)
      leg.position.set(pos[0], pos[1], pos[2])
      leg.castShadow = true
      cat.add(leg)
    })

    cat.position.set(0, 1, 0)
    scene.add(cat)

    // Game state
    const gameState = {
      velocity: new THREE.Vector3(),
      isJumping: false,
      moveSpeed: 0.15,
      jumpForce: 0.35,
      gravity: -0.02,
      keys: {},
      rotation: 0
    }

    const handleKeyDown = (e) => {
      gameState.keys[e.code] = true
      if (e.code === 'Space' && !gameState.isJumping) {
        gameState.velocity.y = gameState.jumpForce
        gameState.isJumping = true
      }
      if (instructions) setInstructions(false)
    }

    const handleKeyUp = (e) => {
      gameState.keys[e.code] = false
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    const cameraOffset = new THREE.Vector3(0, 4, 8)

    const animate = () => {
      requestAnimationFrame(animate)

      const moveDirection = new THREE.Vector3()

      if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) {
        moveDirection.z -= 1
      }
      if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) {
        moveDirection.z += 1
      }
      if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) {
        moveDirection.x -= 1
      }
      if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) {
        moveDirection.x += 1
      }

      if (moveDirection.length() > 0) {
        moveDirection.normalize()
        cat.position.x += moveDirection.x * gameState.moveSpeed
        cat.position.z += moveDirection.z * gameState.moveSpeed

        gameState.rotation = Math.atan2(moveDirection.x, moveDirection.z)
        cat.rotation.y = gameState.rotation

        tail.rotation.z = Math.sin(Date.now() * 0.01) * 0.3
      }

      gameState.velocity.y += gameState.gravity
      cat.position.y += gameState.velocity.y

      let onPlatform = false

      if (cat.position.y <= 1) {
        cat.position.y = 1
        gameState.velocity.y = 0
        gameState.isJumping = false
        onPlatform = true
      }

      platforms.forEach(platform => {
        const platformBounds = new THREE.Box3().setFromObject(platform.mesh)
        const catBounds = new THREE.Box3().setFromObject(cat)

        if (catBounds.intersectsBox(platformBounds) &&
            gameState.velocity.y <= 0 &&
            cat.position.y > platform.height - 0.5) {
          cat.position.y = platform.height
          gameState.velocity.y = 0
          gameState.isJumping = false
          onPlatform = true
        }
      })

      cat.position.x = Math.max(-45, Math.min(45, cat.position.x))
      cat.position.z = Math.max(-45, Math.min(45, cat.position.z))

      const targetCameraPosition = new THREE.Vector3(
        cat.position.x + cameraOffset.x * Math.sin(gameState.rotation),
        cat.position.y + cameraOffset.y,
        cat.position.z + cameraOffset.z * Math.cos(gameState.rotation)
      )

      camera.position.lerp(targetCameraPosition, 0.1)
      camera.lookAt(cat.position)

      const distanceToBall = cat.position.distanceTo(ball.position)
      if (distanceToBall < 2) {
        const direction = new THREE.Vector3()
          .subVectors(ball.position, cat.position)
          .normalize()
        ball.position.x += direction.x * 0.1
        ball.position.z += direction.z * 0.1
      }

      ball.position.y = 0.5

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', handleResize)
      mountRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {instructions && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '15px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#FF8C00' }}>🐱 Whisker World</h2>
          <p style={{ margin: '8px 0' }}><strong>WASD</strong> or <strong>Arrow Keys</strong> - Move</p>
          <p style={{ margin: '8px 0' }}><strong>Space</strong> - Jump</p>
          <p style={{ margin: '15px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            Explore the garden, jump on platforms, and play with the pink ball!
          </p>
        </div>
      )}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '10px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px'
      }}>
        Whisker World - A Feline 3D Adventure
      </div>
    </div>
  )
}

export default WhiskerWorld`,
    },
    dependencies: {
      'three': '^0.150.0'
    },
    tags: ['game', '3d', 'three.js', 'interactive']
  },

  // 2D Game
  {
    id: '2d-game',
    type: 'react-game-2d',
    title: '2D Platformer Game',
    description: 'Simple 2D platformer game using HTML Canvas',
    icon: '🎮',
    files: {
      '/App.js': `import React, { useEffect, useRef, useState } from 'react'

export default function Game2D() {
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = 800
    canvas.height = 600

    const player = {
      x: 100,
      y: 400,
      width: 40,
      height: 40,
      velocityY: 0,
      jumping: false,
      speed: 5,
      jumpPower: 15
    }

    const platforms = [
      { x: 0, y: 550, width: 800, height: 50 },
      { x: 200, y: 450, width: 150, height: 20 },
      { x: 450, y: 350, width: 150, height: 20 },
      { x: 150, y: 250, width: 150, height: 20 }
    ]

    const coin = {
      x: 500,
      y: 300,
      width: 30,
      height: 30,
      collected: false
    }

    const gravity = 0.8
    const keys = {}

    window.addEventListener('keydown', (e) => {
      keys[e.code] = true
      if (e.code === 'Space' && !player.jumping) {
        player.velocityY = -player.jumpPower
        player.jumping = true
      }
    })

    window.addEventListener('keyup', (e) => {
      keys[e.code] = false
    })

    function gameLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#87CEEB')
      gradient.addColorStop(1, '#E0F6FF')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Player movement
      if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed
      if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed

      // Gravity
      player.velocityY += gravity
      player.y += player.velocityY

      // Platform collision
      player.jumping = true
      platforms.forEach(platform => {
        if (
          player.x < platform.x + platform.width &&
          player.x + player.width > platform.x &&
          player.y + player.height > platform.y &&
          player.y + player.height < platform.y + platform.height &&
          player.velocityY > 0
        ) {
          player.y = platform.y - player.height
          player.velocityY = 0
          player.jumping = false
        }
      })

      // Bounds
      player.x = Math.max(0, Math.min(canvas.width - player.width, player.x))
      if (player.y > canvas.height) {
        player.y = 100
        player.x = 100
      }

      // Draw platforms
      ctx.fillStyle = '#8B4513'
      platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
      })

      // Draw coin
      if (!coin.collected) {
        if (
          player.x < coin.x + coin.width &&
          player.x + player.width > coin.x &&
          player.y < coin.y + coin.height &&
          player.y + player.height > coin.y
        ) {
          coin.collected = true
          setScore(s => s + 10)
        }

        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(coin.x + 15, coin.y + 15, 15, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw player
      ctx.fillStyle = '#FF6B6B'
      ctx.fillRect(player.x, player.y, player.width, player.height)

      requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      window.removeEventListener('keydown', () => {})
      window.removeEventListener('keyup', () => {})
    }
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>2D Platformer</h1>
      <p>Arrow Keys or WASD to move, Space to jump</p>
      <p style={{ fontSize: '24px', fontWeight: 'bold' }}>Score: {score}</p>
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid #333',
          borderRadius: '10px',
          display: 'block',
          margin: '20px auto'
        }}
      />
    </div>
  )
}`
    },
    tags: ['game', '2d', 'canvas', 'platformer']
  },

  // Interactive Dashboard
  {
    id: 'dashboard',
    type: 'react',
    title: 'Interactive Dashboard',
    description: 'Modern dashboard with charts and stats',
    icon: '📊',
    files: {
      '/App.js': `import React, { useState } from 'react'

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const stats = [
    { label: 'Total Users', value: '12,543', change: '+12%', positive: true },
    { label: 'Revenue', value: '$45,231', change: '+8%', positive: true },
    { label: 'Conversion', value: '3.24%', change: '-2%', positive: false },
    { label: 'Active Now', value: '234', change: '+18%', positive: true }
  ]

  return (
    <div style={{
      fontFamily: 'sans-serif',
      background: '#f5f5f5',
      minHeight: '100vh',
      padding: '30px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {stats.map((stat, idx) => (
            <div key={idx} style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '8px'
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '14px',
                color: stat.positive ? '#10b981' : '#ef4444',
                fontWeight: '500'
              }}>
                {stat.change} from last period
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0 }}>Recent Activity</h2>
          {[
            { user: 'John Doe', action: 'completed purchase', time: '2 min ago' },
            { user: 'Jane Smith', action: 'signed up', time: '5 min ago' },
            { user: 'Bob Johnson', action: 'left review', time: '12 min ago' },
            { user: 'Alice Williams', action: 'updated profile', time: '1 hour ago' }
          ].map((activity, idx) => (
            <div key={idx} style={{
              padding: '16px',
              borderBottom: idx < 3 ? '1px solid #eee' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>{activity.user}</strong> {activity.action}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}`
    },
    tags: ['dashboard', 'charts', 'business']
  },

  // Landing Page
  {
    id: 'landing-page',
    type: 'react',
    title: 'Landing Page',
    description: 'Modern product landing page',
    icon: '🚀',
    files: {
      '/App.js': `import React, { useState } from 'react'

export default function LandingPage() {
  const [email, setEmail] = useState('')

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '48px',
          margin: '0 0 20px 0',
          fontWeight: 'bold'
        }}>
          Build Amazing Things
        </h1>
        <p style={{
          fontSize: '20px',
          margin: '0 0 40px 0',
          opacity: 0.9
        }}>
          The fastest way to create stunning applications
        </p>
        <button style={{
          padding: '16px 40px',
          fontSize: '18px',
          background: 'white',
          color: '#667eea',
          border: 'none',
          borderRadius: '50px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          Get Started Free
        </button>
      </div>

      {/* Features */}
      <div style={{
        padding: '80px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '60px' }}>
          Why Choose Us?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px'
        }}>
          {[
            { icon: '⚡', title: 'Lightning Fast', desc: 'Optimized for speed and performance' },
            { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security built-in' },
            { icon: '🎨', title: 'Beautiful', desc: 'Stunning designs out of the box' }
          ].map((feature, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>
                {feature.title}
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: '#f8f9fa',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>
          Ready to get started?
        </h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Join thousands of happy users today
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '4px',
            marginRight: '10px',
            width: '300px'
          }}
        />
        <button style={{
          padding: '12px 30px',
          fontSize: '16px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Sign Up
        </button>
      </div>
    </div>
  )
}`
    },
    tags: ['landing', 'marketing', 'product']
  },

  // Vanilla JavaScript
  {
    id: 'vanilla-js',
    type: 'vanilla-js',
    title: 'Vanilla JavaScript',
    description: 'Pure JavaScript without frameworks',
    icon: '📜',
    files: {
      '/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vanilla JS App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Vanilla JavaScript</h1>
    <p id="counter">Count: 0</p>
    <button id="increment">Increment</button>
    <button id="reset">Reset</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      '/styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

#counter {
  font-size: 32px;
  margin: 20px 0;
  color: #667eea;
  font-weight: bold;
}

button {
  padding: 12px 24px;
  margin: 5px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

#increment {
  background: #667eea;
  color: white;
}

#reset {
  background: #f3f4f6;
  color: #333;
}

button:hover {
  transform: translateY(-2px);
}

button:active {
  transform: translateY(0);
}`,
      '/script.js': `let count = 0

const counterElement = document.getElementById('counter')
const incrementButton = document.getElementById('increment')
const resetButton = document.getElementById('reset')

function updateCounter() {
  counterElement.textContent = \`Count: \${count}\`
}

incrementButton.addEventListener('click', () => {
  count++
  updateCounter()
})

resetButton.addEventListener('click', () => {
  count = 0
  updateCounter()
})`
    },
    tags: ['javascript', 'vanilla', 'no-framework']
  }
]

export function getTemplateById(id: string): ArtifactTemplate | undefined {
  return ARTIFACT_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByType(type: ArtifactType): ArtifactTemplate[] {
  return ARTIFACT_TEMPLATES.filter(t => t.type === type)
}

export function getTemplatesByTag(tag: string): ArtifactTemplate[] {
  return ARTIFACT_TEMPLATES.filter(t => t.tags.includes(tag))
}
