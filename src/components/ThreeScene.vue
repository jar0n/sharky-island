<template>
  <div ref="container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const container = ref(null)

onMounted(() => {
    if (!container.value) return
    
    const { scene, camera, renderer } = window.$three
    
    // Set renderer size
    renderer.setSize(window.innerWidth, window.innerHeight)
    container.value.appendChild(renderer.domElement)
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    
    // Animation loop
    const animate = () => {
        requestAnimationFrame(animate)
        controls.update()
    }
    animate()
})
</script>

<style scoped>
div {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style> 