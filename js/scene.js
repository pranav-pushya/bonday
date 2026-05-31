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

        // Ruby & Velvet Ambient
        this.ambientLight = new THREE.AmbientLight(0x221111, 2.0); // Dark crimson ambient
        this.scene.add(this.ambientLight);

        // Key Light (Platinum/White)
        this.dirLight = new THREE.DirectionalLight(0xE0E5EC, 3.0);
        this.dirLight.position.set(5, 5, 5);
        this.scene.add(this.dirLight);

        // Fill Light (Deep Ruby)
        this.fillLight = new THREE.DirectionalLight(0x8B0000, 2.0);
        this.fillLight.position.set(-5, 3, 2);
        this.scene.add(this.fillLight);

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
