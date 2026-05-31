/**
 * scene.js
 * The core Three.js environment handling WebGL rendering and cameras.
 */
import * as THREE from 'three';

export class SceneManager {
    constructor(canvas, onUpdate) {
        this.canvas = canvas;
        this.onUpdate = onUpdate;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // 1. Core Scene Setup
        this.scene = new THREE.Scene();
        
        // Perspective camera for true 3D depth
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.camera.position.z = 10;

        // 2. WebGL Renderer with transparent background (so camera feed shows through)
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0); // Guaranteed transparent

        // 3. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xfff0dd, 1.2);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Handle Resizing
        window.addEventListener('resize', () => this.resize());
        
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.onUpdate) this.onUpdate();
        this.renderer.render(this.scene, this.camera);
    }
}
