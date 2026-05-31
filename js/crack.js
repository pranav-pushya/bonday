/**
 * crack.js
 * 3D Glass Shattering Physics Engine for Three.js
 */
import * as THREE from 'three';

export class CrackManager {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.scene = this.sm.scene;
        this.shards = [];
        this.isCracked = false;
        
        // Real Glass Refraction Material
        this.glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.05,
            transmission: 1.0, // glass-like refraction
            ior: 1.5,
            thickness: 0.5,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        // Edge material for the glowing crimson cracks
        this.edgeMaterial = new THREE.LineBasicMaterial({
            color: 0xFF1133,
            transparent: true,
            opacity: 0.0 // invisible initially
        });
    }

    startCrack() {
        if (this.isCracked) return;
        this.isCracked = true;

        // Calculate the camera view size at z=0 plane
        const dist = this.sm.camera.position.z;
        const vFov = THREE.MathUtils.degToRad(this.sm.camera.fov);
        const height = 2 * Math.tan(vFov / 2) * dist;
        const width = height * this.sm.camera.aspect;

        const hw = width / 2;
        const hh = height / 2;

        // Random center impact point
        const cx = (Math.random() - 0.5) * hw * 0.5;
        const cy = (Math.random() - 0.5) * hh * 0.5;

        // Create radial shards (starburst pattern)
        const numSlices = 10;
        const points = [];
        for (let i = 0; i < numSlices; i++) {
            const angle = (i / numSlices) * Math.PI * 2 + (Math.random() * 0.3);
            const ox = Math.cos(angle) * width * 1.5; // extend beyond screen
            const oy = Math.sin(angle) * height * 1.5;
            points.push(new THREE.Vector2(ox, oy));
        }

        // Build 3D Extruded Shapes for each shard
        for (let i = 0; i < numSlices; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % numSlices];
            
            const shape = new THREE.Shape();
            shape.moveTo(cx, cy);
            shape.lineTo(p1.x, p1.y);
            shape.lineTo(p2.x, p2.y);
            shape.lineTo(cx, cy);

            const geo = new THREE.ExtrudeGeometry(shape, {
                depth: 0.15,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.02,
                bevelSegments: 2
            });

            // Center geometry so physics rotation spins correctly around centroid
            geo.computeBoundingBox();
            const center = new THREE.Vector3();
            geo.boundingBox.getCenter(center);
            geo.translate(-center.x, -center.y, -center.z);

            const mesh = new THREE.Mesh(geo, this.glassMaterial.clone());
            mesh.position.copy(center);
            mesh.position.z = 0; // sits exactly where the 2D trail was
            
            // Add glowing crack lines to edges
            const edgesGeo = new THREE.EdgesGeometry(geo);
            const edges = new THREE.LineSegments(edgesGeo, this.edgeMaterial.clone());
            mesh.add(edges);

            this.scene.add(mesh);
            
            this.shards.push({
                mesh: mesh,
                vx: (center.x - cx) * 0.02 + (Math.random() - 0.5) * 0.05,
                vy: (center.y - cy) * 0.02 + (Math.random() - 0.5) * 0.05,
                vz: Math.random() * 0.15 + 0.05, // push out towards camera
                rx: (Math.random() - 0.5) * 0.08,
                ry: (Math.random() - 0.5) * 0.08,
                rz: (Math.random() - 0.5) * 0.04,
                falling: false
            });
        }
        
        // Flash cracks gold instantly upon strike
        this.shards.forEach(s => {
            s.mesh.children[0].material.opacity = 1.0;
        });
    }

    fall() {
        this.shards.forEach(s => {
            s.falling = true;
            // The glowing cracks extinguish as the glass falls
            s.mesh.children[0].material.opacity = 0.0; 
        });
    }

    update() {
        if (!this.isCracked) return;
        
        this.shards.forEach(s => {
            if (s.falling) {
                s.vy -= 0.01; // Gravity
                s.mesh.position.x += s.vx;
                s.mesh.position.y += s.vy;
                s.mesh.position.z += s.vz;
                
                s.mesh.rotation.x += s.rx;
                s.mesh.rotation.y += s.ry;
                s.mesh.rotation.z += s.rz;
                
                // Fade out shards as they fall away
                if (s.mesh.position.y < -15) {
                    s.mesh.material.opacity = Math.max(0, s.mesh.material.opacity - 0.05);
                }
            }
        });
    }
}
