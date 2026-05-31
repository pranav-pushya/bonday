/**
 * motifs.js
 * Generates and manages the 3D floating makeup primitives.
 */
import * as THREE from 'three';
import { CONFIG } from './config.js';

export class MotifManager {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.scene = this.sm.scene;
        this.motifs = [];
        this.targetOpacity = CONFIG.MOTIFS.PHASE1;
        
        // Materials for Ruby & Velvet Theme
        this.goldMat = new THREE.MeshStandardMaterial({
            color: 0x111111, // Matte Black Casing
            emissive: 0x000000,
            metalness: 0.1,
            roughness: 0.9, // Very matte
            transparent: true,
            opacity: 0
        });
        
        this.rougeMat = new THREE.MeshStandardMaterial({
            color: 0x8B0000, // Blood Red Tips
            emissive: 0x220000,
            metalness: 0.2,
            roughness: 0.4,
            transparent: true,
            opacity: 0
        });

        this.petalMat = new THREE.MeshStandardMaterial({
            color: 0x5A0000, // Velvet Crimson Petals
            emissive: 0x220000,
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });

        this.glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x222222, // Dark Tinted Glass
            transmission: 0.9,
            roughness: 0.1,
            ior: 1.5,
            transparent: true,
            opacity: 0
        });

        this.init();
    }

    createLipstick() {
        const group = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16), this.goldMat);
        base.position.y = -0.15;
        group.add(base);
        
        const tipGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 16);
        const positions = tipGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            if (positions.getY(i) > 0) {
                positions.setY(i, positions.getY(i) + positions.getX(i) * 0.5); // slanted tip
            }
        }
        const tip = new THREE.Mesh(tipGeo, this.rougeMat);
        tip.position.y = 0.4;
        group.add(tip);
        return group;
    }

    createCompact() {
        const group = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), this.goldMat);
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 32), this.goldMat);
        lid.position.y = 0.075;
        lid.position.z = -0.5;
        lid.rotation.x = Math.PI / 4; 
        
        const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 32), this.glassMat);
        lid.add(mirror);
        
        group.add(base);
        group.add(lid);
        return group;
    }

    createSerum() {
        const group = new THREE.Group();
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16), this.glassMat);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16), this.goldMat);
        cap.position.y = 0.55;
        const dropper = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), this.goldMat);
        dropper.position.y = 0.7;
        
        group.add(bottle);
        group.add(cap);
        group.add(dropper);
        return group;
    }

    createPetal() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(0.5, 0.5, 0.2, 1);
        shape.quadraticCurveTo(0, 1.2, -0.2, 1);
        shape.quadraticCurveTo(-0.5, 0.5, 0, 0);

        const geo = new THREE.ExtrudeGeometry(shape, {
            depth: 0.01,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.01,
            bevelSegments: 1
        });
        
        geo.computeBoundingBox();
        const center = new THREE.Vector3();
        geo.boundingBox.getCenter(center);
        geo.translate(-center.x, -center.y, -center.z);

        // Curve the petal gently
        const positions = geo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            positions.setZ(i, positions.getZ(i) + Math.sin(y * Math.PI) * 0.2);
        }
        geo.computeVertexNormals();

        return new THREE.Mesh(geo, this.petalMat);
    }

    init() {
        const types = ['lipstick', 'lipstick', 'compact', 'compact', 'serum', 'serum'];
        
        // Add 20 Rose Petals
        for (let i = 0; i < 20; i++) {
            types.push('petal');
        }
        
        types.forEach(type => {
            let mesh;
            let isPetal = false;
            
            if (type === 'lipstick') mesh = this.createLipstick();
            if (type === 'compact') mesh = this.createCompact();
            if (type === 'serum') mesh = this.createSerum();
            if (type === 'petal') {
                mesh = this.createPetal();
                isPetal = true;
            }
            
            // Increase overall size so they are more prominent
            if (!isPetal) {
                mesh.scale.set(3, 3, 3);
            } else {
                mesh.scale.set(1.5, 1.5, 1.5); // Petals are smaller
            }

            // Wrap in a group for global Z-axis stretching (Motion Blur)
            const wrapper = new THREE.Group();
            wrapper.add(mesh);

            // Random scatter across 3D background void
            wrapper.position.x = (Math.random() - 0.5) * 18;
            wrapper.position.y = (Math.random() - 0.5) * 12;
            wrapper.position.z = -1 - Math.random() * 4;
            
            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;
            
            this.scene.add(wrapper);
            
            this.motifs.push({
                wrapper: wrapper,
                mesh: mesh,
                rx: (Math.random() - 0.5) * 0.015,
                ry: (Math.random() - 0.5) * 0.015,
                vy: isPetal ? -(Math.random() * 0.01 + 0.005) : ((Math.random() - 0.5) * 0.005 + 0.005), // Petals fall down, motifs float
                vx: isPetal ? (Math.random() - 0.5) * 0.005 : 0, // Petals drift horizontally
                isPetal: isPetal,
                currentOpacity: 0
            });
        });
    }

    setPhaseOpacity(phase) {
        if (CONFIG.MOTIFS[phase] !== undefined) {
            this.targetOpacity = CONFIG.MOTIFS[phase];
        }
    }

    update(scrollVelocity = 0) {
        this.motifs.forEach(m => {
            m.mesh.rotation.x += m.rx;
            m.mesh.rotation.y += m.ry;
            m.wrapper.position.y += m.vy;
            if (m.isPetal) m.wrapper.position.x += m.vx;
            
            // Loop screen vertically
            if (m.wrapper.position.y > 8) m.wrapper.position.y = -8;
            if (m.wrapper.position.y < -8) {
                m.wrapper.position.y = 8;
                m.wrapper.position.x = (Math.random() - 0.5) * 18;
            }
            
            // Crimson Light-Warp Effect!
            // When user scrolls, velocity spikes (0.01 to 0.05+)
            // We stretch the wrapper along the global Z axis to create perfect motion blur streaks.
            const stretch = 1.0 + (scrollVelocity * 500); 
            m.wrapper.scale.set(1, 1, stretch);
            
            // Smoothly animate opacity transitions
            m.currentOpacity += (this.targetOpacity - m.currentOpacity) * 0.05;
            
            // Increase emissive glow during warp
            const glowPulse = m.currentOpacity + (scrollVelocity * 10);

            m.mesh.traverse(child => {
                if (child.isMesh) {
                    child.material.opacity = m.currentOpacity;
                    if (child.material.emissiveIntensity !== undefined) {
                        child.material.emissiveIntensity = glowPulse;
                    }
                }
            });
        });
    }
}
