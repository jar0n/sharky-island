import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export function setupThree() {
    // Create a scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB) // Sky blue background
    
    // Create an isometric camera
    const aspect = window.innerWidth / window.innerHeight
    const camera = new THREE.OrthographicCamera(
        -10 * aspect, 10 * aspect,
        10, -10,
        1, 1000
    )
    
    // Set isometric position
    camera.position.set(20, 20, 20)
    camera.lookAt(0, 0, 0)
    
    // Create a renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    
    // Add fog for atmosphere
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.02)
    
    // Create ocean
    const oceanGeometry = new THREE.PlaneGeometry(100, 100, 20, 20)
    const oceanMaterial = new THREE.MeshPhongMaterial({
        color: 0x006994,
        transparent: true,
        opacity: 0.8,
        shininess: 100
    })
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial)
    ocean.rotation.x = -Math.PI / 2
    ocean.position.y = -0.5
    scene.add(ocean)
    
    // Create island
    const islandGeometry = new THREE.ConeGeometry(8, 4, 6)
    const islandMaterial = new THREE.MeshPhongMaterial({ color: 0xC2B280 })
    const island = new THREE.Mesh(islandGeometry, islandMaterial)
    scene.add(island)
    
    // Add palm trees
    const palmPositions = [
        new THREE.Vector3(-3, 0, -3),
        new THREE.Vector3(2, 0, 2),
        new THREE.Vector3(-1, 0, 3),
        new THREE.Vector3(3, 0, -2)
    ]
    
    palmPositions.forEach(pos => {
        const palm = createPalmTree()
        // Calculate height on the island surface
        const distance = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
        const height = 2 - (distance / 4) // Island height calculation
        pos.y = height - 1.5 // Offset to account for palm tree's internal height
        palm.position.copy(pos)
        scene.add(palm)
    })
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    sunLight.position.set(50, 50, 50)
    scene.add(sunLight)
    
    // Add sharks
    const sharks = []
    const sharkRadii = [12, 15, 18] // Different circle radii for each shark
    const sharkSpeeds = [0.001, 0.0015, 0.0008] // Different speeds
    
    for (let i = 0; i < 3; i++) {
        const shark = createShark()
        shark.position.y = -0.3
        const angle = (i * 2 * Math.PI) / 3
        const circleX = Math.cos(angle) * sharkRadii[i]
        const circleZ = Math.sin(angle) * sharkRadii[i]
        sharks.push({
            mesh: shark,
            angle: angle,
            radius: sharkRadii[i],
            speed: sharkSpeeds[i],
            targetX: circleX,
            targetZ: circleZ,
            chaseWeight: 0
        })
        shark.position.x = circleX
        shark.position.z = circleZ
        scene.add(shark)
    }
    
    // Add robot
    const robot = createRobot()
    robot.position.y = 2
    robot.isFlashing = false
    robot.flashTime = 0
    scene.add(robot)
    
    // Robot controls
    const robotSpeed = 0.1
    const keys = {
        w: false,
        a: false,
        s: false,
        d: false
    }
    
    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true
        }
    })
    
    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = false
        }
    })
    
    function updateRobot() {
        let moveForward = 0
        let rotation = 0
        
        // Rotation with A/D
        if (keys.a) rotation += 0.05
        if (keys.d) rotation -= 0.05
        
        // Forward/backward with W/S
        if (keys.w) moveForward -= robotSpeed
        if (keys.s) moveForward += robotSpeed
        
        // Apply rotation
        robot.rotation.y += rotation
        
        // Calculate movement based on robot's facing direction
        const moveX = Math.sin(robot.rotation.y) * moveForward
        const moveZ = Math.cos(robot.rotation.y) * moveForward
        
        // Calculate new position
        const newX = robot.position.x + moveX
        const newZ = robot.position.z + moveZ
        
        // Calculate distance from center
        const distance = Math.sqrt(newX * newX + newZ * newZ)
        
        // Only move if still on island (radius = 8)
        if (distance < 7) {
            robot.position.x = newX
            robot.position.z = newZ
            
            // Update height based on island slope
            const height = 4 * (1 - distance / 8) - 2
            robot.position.y = height
        }
    }
    
    // Animation function
    function animateSharks() {
        const robotDistance = Math.sqrt(
            robot.position.x * robot.position.x + 
            robot.position.z * robot.position.z
        )
        const isNearWater = robotDistance > 6
        
        // Check for shark collisions
        let sharkHit = false
        sharks.forEach(shark => {
            const distanceToRobot = Math.sqrt(
                Math.pow(robot.position.x - shark.mesh.position.x, 2) +
                Math.pow(robot.position.z - shark.mesh.position.z, 2)
            )
            if (distanceToRobot < 1.5) { // Collision threshold
                sharkHit = true
            }
            
            // Update angle for circular motion
            shark.angle += shark.speed
            
            // Calculate circle position
            const circleX = Math.cos(shark.angle) * shark.radius
            const circleZ = Math.sin(shark.angle) * shark.radius
            
            if (isNearWater) {
                // Calculate distance to robot
                const directionX = robot.position.x - shark.mesh.position.x
                const directionZ = robot.position.z - shark.mesh.position.z
                const distanceToRobot = Math.sqrt(directionX * directionX + directionZ * directionZ)
                
                // Only chase if within range of robot
                if (distanceToRobot < 16) {
                    // Quick transition to chase mode
                    shark.chaseWeight = Math.min(shark.chaseWeight + 0.02, 1)
                    
                    // Calculate shark's distance from center
                    const sharkDistance = Math.sqrt(
                        shark.mesh.position.x * shark.mesh.position.x + 
                        shark.mesh.position.z * shark.mesh.position.z
                    )
                    
                    // Update chase target if not too close to shore (changed from 7.5 to 6.5)
                    if (sharkDistance > 6.5) {
                        const moveSpeed = 0.1
                        shark.targetX += (directionX / distanceToRobot) * moveSpeed
                        shark.targetZ += (directionZ / distanceToRobot) * moveSpeed
                    }
                } else {
                    // Return to circling if too far
                    shark.chaseWeight = Math.max(shark.chaseWeight - 0.01, 0)
                    shark.targetX += (circleX - shark.targetX) * 0.02
                    shark.targetZ += (circleZ - shark.targetZ) * 0.02
                }
            } else {
                // Slower transition back to circling
                shark.chaseWeight = Math.max(shark.chaseWeight - 0.01, 0)
                // Very gradual return to circle position
                shark.targetX += (circleX - shark.targetX) * 0.02
                shark.targetZ += (circleZ - shark.targetZ) * 0.02
            }
            
            // Interpolate between circle and chase positions
            shark.mesh.position.x = circleX * (1 - shark.chaseWeight) + shark.targetX * shark.chaseWeight
            shark.mesh.position.z = circleZ * (1 - shark.chaseWeight) + shark.targetZ * shark.chaseWeight
            
            // Calculate velocity vector for rotation
            const velocityX = shark.mesh.position.x - shark.mesh.oldX || 0
            const velocityZ = shark.mesh.position.z - shark.mesh.oldZ || 0
            
            // Store current position for next frame
            shark.mesh.oldX = shark.mesh.position.x
            shark.mesh.oldZ = shark.mesh.position.z
            
            // Only update rotation if moving
            if (Math.abs(velocityX) > 0.001 || Math.abs(velocityZ) > 0.001) {
                shark.mesh.rotation.y = Math.atan2(velocityX, velocityZ) - Math.PI / 2
            }
        })
        
        // Handle robot flashing
        if (sharkHit && !robot.isFlashing) {
            robot.isFlashing = true
            robot.flashTime = 0
            // Change all robot materials to bright red except eyes
            robot.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Skip if it's an eye (check for white color)
                    if (child.material.color.getHex() !== 0xFFFFFF) {
                        child.material.oldColor = child.material.color.clone()
                        child.material.oldEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0x000000)
                        child.material.color.setHex(0xFF0000)
                        child.material.emissive = new THREE.Color(0xFF0000)
                        child.material.emissiveIntensity = 1
                    }
                }
            })
        }
        
        // Update flash effect
        if (robot.isFlashing) {
            robot.flashTime += 0.1
            if (robot.flashTime > 1) { // Flash duration
                robot.isFlashing = false
                // Restore original colors
                robot.traverse((child) => {
                    if (child.isMesh && child.material && child.material.oldColor) {
                        child.material.color.copy(child.material.oldColor)
                        child.material.emissive.copy(child.material.oldEmissive)
                        child.material.emissiveIntensity = 0
                    }
                })
            }
        }
    }
    
    // Update animation function to include robot and rendering
    function animate() {
        requestAnimationFrame(animate)
        updateRobot()
        animateSharks()
        renderer.render(scene, camera)
    }
    
    // Start animation
    animate()
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const aspect = window.innerWidth / window.innerHeight
        camera.left = -10 * aspect
        camera.right = 10 * aspect
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    })
    
    const three = {
        scene,
        camera,
        renderer,
        sharks,
        robot
    }
    
    // Attach to window for global access
    window.$three = three
    
    return three
}

function createPalmTree() {
    const group = new THREE.Group()
    
    // Create trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8)
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 })
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.y = 1.5 // This creates the offset we need to account for
    
    // Create leaves
    const leaves = new THREE.Group()
    const leafGeometry = new THREE.PlaneGeometry(2, 1)
    const leafMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x228B22,
        side: THREE.DoubleSide
    })
    
    for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial)
        leaf.position.y = 3 // Adjusted from 4 to 3
        leaf.rotation.x = Math.random() * Math.PI / 4
        leaf.rotation.y = (i / 5) * Math.PI * 2
        leaf.rotation.z = Math.PI / 4
        leaves.add(leaf)
    }
    
    group.add(trunk)
    group.add(leaves)
    
    // Add slight random rotation for variety
    group.rotation.y = Math.random() * Math.PI * 2
    
    return group
}

function createShark() {
    const group = new THREE.Group()
    
    // Shark body
    const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8)
    bodyGeometry.rotateZ(Math.PI / 2) // Rotate to swim horizontally
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x505050 })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    
    // Shark tail
    const tailGeometry = new THREE.ConeGeometry(0.4, 1, 4)
    tailGeometry.rotateZ(-Math.PI / 4)
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial)
    tail.position.x = -1.2
    tail.position.y = 0.2
    
    // Shark fin
    const finGeometry = new THREE.ConeGeometry(0.2, 0.8, 4)
    const fin = new THREE.Mesh(finGeometry, bodyMaterial)
    fin.position.y = 0.5
    fin.rotation.z = Math.PI
    
    group.add(body)
    group.add(tail)
    group.add(fin)
    
    return group
}

function createRobot() {
    const group = new THREE.Group()
    
    // Robot body
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.5)
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xFF4444 })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.6
    
    // Robot head
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFF4444 })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 1.45
    
    // Robot eyes with emissive material
    const eyeGeometry = new THREE.SphereGeometry(0.08)
    const eyeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.5
    })
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.15, 1.45, -0.25)
    rightEye.position.set(0.15, 1.45, -0.25)
    
    // Robot legs - adjusted position and size
    const legGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15)
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0xFF4444 })
    
    // Create four legs with adjusted positions - lowered y position
    const positions = [
        [-0.25, 0.0, -0.15],  // back left
        [0.25, 0.0, -0.15],   // back right
        [-0.25, 0.0, 0.15],   // front left
        [0.25, 0.0, 0.15]     // front right
    ]
    
    positions.forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeometry, legMaterial)
        leg.position.set(x, y, z)
        group.add(leg)
    })
    
    group.add(body)
    group.add(head)
    group.add(leftEye)
    group.add(rightEye)
    
    return group
} 