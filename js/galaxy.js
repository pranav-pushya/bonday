/**
 * galaxy.js
 * Manages the 3D Starfield and Galaxy Core for the Scroll Journey (Ruby & Velvet Theme).
 */
import * as THREE from 'three';

export class GalaxyManager {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.scene = this.sm.scene;
        
        this.stars = null;
        this.galaxy = null;
        
        this.isActive = false;
        
        // Configuration for the Ruby/Platinum Galaxy
        this.STARS_COUNT = 3000;
        this.STARS_RADIUS = 40;
        this.GALAXY_POINTS = 5000;
        this.GALAXY_ARMS = 3;
    }

    init() {
        if (this.isActive) return;
        this.isActive = true;
        
        this.particleTexture = this.createCircleTexture();
        
        // 1. Create the Ambient Starfield
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(this.STARS_COUNT * 3);
        const starColors = new Float32Array(this.STARS_COUNT * 3);

        const colorPlatinum = new THREE.Color(0xE0E5EC);
        const colorRuby = new THREE.Color(0x8B0000);
        const colorCrimson = new THREE.Color(0x5A0000);

        for (let i = 0; i < this.STARS_COUNT; i++) {
            const r = this.STARS_RADIUS;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            starPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
            starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            starPos[i*3+2] = r * Math.cos(phi) - r; 

            const rnd = Math.random();
            const color = rnd < 0.4 ? colorPlatinum : (rnd < 0.7 ? colorRuby : colorCrimson);
            starColors[i*3] = color.r;
            starColors[i*3+1] = color.g;
            starColors[i*3+2] = color.b;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starMat = new THREE.PointsMaterial({
            size: 0.15,
            map: this.particleTexture,
            vertexColors: true,
            transparent: true,
            opacity: 0.0, // Start invisible
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.stars = new THREE.Points(starGeo, starMat);
        this.scene.add(this.stars);
        
        // 2. Create the Galaxy Core (Spiral)
        this.initGalaxy();
    }

    initGalaxy() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(this.GALAXY_POINTS * 3);
        const col = new Float32Array(this.GALAXY_POINTS * 3);

        const colorInner1 = new THREE.Color(0xffffff);
        const colorInner2 = new THREE.Color(0xE0E5EC); // Platinum
        const colorMid = new THREE.Color(0x8B0000); // Ruby
        const colorOuter = new THREE.Color(0x330000); // Dark Crimson

        const rand = (n) => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * n;

        for (let i = 0; i < this.GALAXY_POINTS; i++) {
            const radius = Math.random() * 12;
            const spinAngle = radius * 3;
            const branchAngle = (i % this.GALAXY_ARMS) * (Math.PI * 2 / 3);
            
            const x = Math.cos(branchAngle + spinAngle) * radius + rand(0.5);
            const y = rand(0.3);
            const z = Math.sin(branchAngle + spinAngle) * radius + rand(0.5);

            pos[i*3] = x;
            pos[i*3+1] = y;
            pos[i*3+2] = z;

            let color = new THREE.Color();
            if (radius < 2) {
                color.lerpColors(colorInner1, colorInner2, radius / 2);
            } else if (radius < 6) {
                color.lerpColors(colorInner2, colorMid, (radius - 2) / 4);
            } else {
                color.lerpColors(colorMid, colorOuter, (radius - 6) / 6);
            }

            col[i*3] = color.r;
            col[i*3+1] = color.g;
            col[i*3+2] = color.b;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.35,
            map: this.particleTexture,
            vertexColors: true,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.galaxy = new THREE.Points(geo, mat);
        this.galaxy.rotation.x = 1.0; // Tilt the galaxy back
        this.galaxy.position.z = -15; // Position it where the Birthday Card spawns
        this.galaxy.position.y = -2;
        this.scene.add(this.galaxy);
    }

    update(scrollProgress, scrollVelocity) {
        if (!this.isActive) return;
        
        // 1. Update Ambient Stars (Warp Speed!)
        if (this.stars) {
            // Fade in over the first 20% of scroll
            this.stars.material.opacity = Math.min(scrollProgress * 3, 0.8);
            
            const positions = this.stars.geometry.attributes.position.array;
            // Base drift + velocity spike
            const speed = 0.02 + (scrollVelocity * 10);
            
            for (let i = 0; i < this.STARS_COUNT; i++) {
                positions[i*3+2] += speed;
                // If a star flies past the camera, loop it back deep into the void
                if (positions[i*3+2] > this.sm.camera.position.z + 5) {
                    positions[i*3+2] = this.sm.camera.position.z - this.STARS_RADIUS;
                }
            }
            this.stars.geometry.attributes.position.needsUpdate = true;
        }
        
        // 2. Update Galaxy Core
        if (this.galaxy) {
            // Spin slowly, spin faster when scrolling
            this.galaxy.rotation.y += 0.002 + (scrollVelocity * 0.02);
            
            // Fade in the galaxy only at the final stretch (progress > 0.6)
            let galaxyOpacity = (scrollProgress - 0.6) * 2.5;
            galaxyOpacity = Math.max(0, Math.min(1, galaxyOpacity));
            this.galaxy.material.opacity = galaxyOpacity;
            
            // Scale up slightly as it appears
            const scale = 0.5 + (galaxyOpacity * 0.5);
            this.galaxy.scale.set(scale, scale, scale);
        }
    }

    createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }
}
