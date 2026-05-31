/**
 * stroke.js
 * Handles drawing the 3D glowing neon tube and champagne dust in Three.js.
 */
import * as THREE from 'three';

export class StrokeManager {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.scene = this.sm.scene;
        
        this.points = [];
        this.isFrozen = false;
        
        this.lastX = null;
        this.lastY = null;
        
        // 1. Solid Core Tube
        this.tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.tubeMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.tubeMaterial);
        
        // 2. Glowing Halo Tube (Fakes the bloom while keeping alpha transparent)
        this.haloMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF1133, // Ruby/Crimson glow
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.haloMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.haloMaterial);

        this.scene.add(this.tubeMesh);
        this.scene.add(this.haloMesh);
        
        // 3. Fingertip indicator (Core + Halo)
        this.indicatorCore = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        this.indicatorHalo = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 16, 16),
            new THREE.MeshBasicMaterial({ 
                color: 0xFF1133, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false 
            })
        );
        this.indicator = new THREE.Group();
        this.indicator.add(this.indicatorCore);
        this.indicator.add(this.indicatorHalo);
        this.indicator.visible = false;
        this.scene.add(this.indicator);

        // 4. Silver Dust (3D Particles)
        this.dustParticles = [];
        this.dustGeo = new THREE.SphereGeometry(0.04, 8, 8);
        this.dustMat = new THREE.MeshBasicMaterial({ 
            color: 0xE0E5EC, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false 
        });
    }

    // Convert normalized [0,1] coordinates from MediaPipe to 3D world space at z=0 plane
    get3DPosition(normX, normY) {
        const ndcX = (normX * 2) - 1;
        const ndcY = -(normY * 2) + 1;
        
        const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
        vec.unproject(this.sm.camera);
        
        const dir = vec.sub(this.sm.camera.position).normalize();
        const distance = -this.sm.camera.position.z / dir.z;
        return this.sm.camera.position.clone().add(dir.multiplyScalar(distance));
    }

    addPoint(normX, normY) {
        if (this.isFrozen) return;
        
        // Smooth coordinates using EMA to eliminate MediaPipe jitter
        if (this.lastX === null) {
            this.lastX = normX;
            this.lastY = normY;
        } else {
            this.lastX = this.lastX * 0.4 + normX * 0.6;
            this.lastY = this.lastY * 0.4 + normY * 0.6;
        }
        
        const pos = this.get3DPosition(this.lastX, this.lastY);
        this.points.push(pos);
        
        // Keep trail length bounded
        if (this.points.length > 80) {
            this.points.shift();
        }

        // Spawn 3D Champagne Dust
        if (Math.random() < 0.4) {
            const dust = new THREE.Mesh(this.dustGeo, this.dustMat);
            dust.position.copy(pos);
            dust.position.x += (Math.random() - 0.5) * 0.4;
            dust.position.y += (Math.random() - 0.5) * 0.4;
            dust.position.z += (Math.random() - 0.5) * 0.4;
            
            this.scene.add(dust);
            this.dustParticles.push({
                mesh: dust,
                vy: Math.random() * 0.04 + 0.02,
                vx: (Math.random() - 0.5) * 0.02,
                vz: (Math.random() - 0.5) * 0.02,
                life: 1.0
            });
        }
    }

    // Called 60fps by the Three.js render loop
    update() {
        if (this.points.length >= 2) {
            const curve = new THREE.CatmullRomCurve3(this.points);
            
            const tubeGeo = new THREE.TubeGeometry(curve, this.points.length * 2, 0.04, 8, false);
            const haloGeo = new THREE.TubeGeometry(curve, this.points.length * 2, 0.12, 8, false);
            
            this.tubeMesh.geometry.dispose(); 
            this.tubeMesh.geometry = tubeGeo;
            
            this.haloMesh.geometry.dispose();
            this.haloMesh.geometry = haloGeo;

            this.indicator.visible = true;
            this.indicator.position.copy(this.points[this.points.length - 1]);
            
            const pulse = 0.5 + Math.sin(performance.now() * 0.01) * 0.2;
            this.indicatorHalo.material.opacity = pulse;
        } else {
            this.indicator.visible = false;
        }

        for (let i = this.dustParticles.length - 1; i >= 0; i--) {
            let p = this.dustParticles[i];
            
            p.mesh.position.y += p.vy;
            p.mesh.position.x += p.vx;
            p.mesh.position.z += p.vz;
            p.life -= 0.015;
            
            p.mesh.scale.setScalar(Math.max(0, p.life));
            p.mesh.material.opacity = Math.max(0, p.life);

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                this.dustParticles.splice(i, 1);
            }
        }
    }

    freeze() {
        this.isFrozen = true;
    }

    clear() {
        this.points = [];
        this.tubeMesh.geometry.dispose();
        this.tubeMesh.geometry = new THREE.BufferGeometry();
        this.haloMesh.geometry.dispose();
        this.haloMesh.geometry = new THREE.BufferGeometry();
        this.indicator.visible = false;
        
        this.dustParticles.forEach(p => {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
        });
        this.dustParticles = [];
    }
}
