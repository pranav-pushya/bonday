/**
 * galaxy.js
 * Handles Three.js scene, star rush, galaxy formation, and camera zoom.
 */
import { CONFIG, isMobile } from './config.js';

export class GalaxyScene {
    constructor(container) {
        this.container = container;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.scene = new window.THREE.Scene();
        this.camera = new window.THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.renderer = new window.THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(isMobile() ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.stars = null;
        this.galaxy = null;
        this.centerGlow = null;
        
        this.animating = false;
        this.starRushSpeed = 0;
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    initStarRush() {
        this.camera.position.z = 0;
        
        const geometry = new window.THREE.BufferGeometry();
        const positions = new Float32Array(CONFIG.THREE.STARS_COUNT * 3);
        const colors = new Float32Array(CONFIG.THREE.STARS_COUNT * 3);

        const color1 = new window.THREE.Color('#ffffff');
        const color2 = new window.THREE.Color('#c8a0ff');
        const color3 = new window.THREE.Color('#a0c8ff');

        for (let i = 0; i < CONFIG.THREE.STARS_COUNT; i++) {
            const r = CONFIG.THREE.STARS_RADIUS;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i*3+2] = r * Math.cos(phi) - r; 

            const rnd = Math.random();
            const color = rnd < 0.33 ? color1 : (rnd < 0.66 ? color2 : color3);
            colors[i*3] = color.r;
            colors[i*3+1] = color.g;
            colors[i*3+2] = color.b;
        }

        geometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new window.THREE.BufferAttribute(colors, 3));

        const material = new window.THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: window.THREE.AdditiveBlending
        });

        this.stars = new window.THREE.Points(geometry, material);
        this.scene.add(this.stars);
        
        this.animating = true;
        this.startLoop();
    }

    startStarRush() {
        let start = performance.now();
        const animateRush = () => {
            const now = performance.now();
            const progress = Math.min((now - start) / CONFIG.TIMELINE.STAR_RUSH_DURATION, 1);
            this.starRushSpeed = progress * 2.0;

            if (this.stars) {
                const positions = this.stars.geometry.attributes.position.array;
                for (let i = 0; i < CONFIG.THREE.STARS_COUNT; i++) {
                    positions[i*3+2] += this.starRushSpeed;
                    if (positions[i*3+2] > 5) {
                        positions[i*3+2] = -CONFIG.THREE.STARS_RADIUS;
                    }
                }
                this.stars.geometry.attributes.position.needsUpdate = true;
            }

            if (progress < 1) requestAnimationFrame(animateRush);
        };
        animateRush();
    }

    initGalaxy() {
        const pointCount = isMobile() ? CONFIG.THREE.GALAXY_POINTS_MOBILE : CONFIG.THREE.GALAXY_POINTS_DESKTOP;
        const geometry = new window.THREE.BufferGeometry();
        const positions = new Float32Array(pointCount * 3);
        const colors = new Float32Array(pointCount * 3);

        const colorInner1 = new window.THREE.Color('#ffffff');
        const colorInner2 = new window.THREE.Color('#ffe8c0');
        const colorMid = new window.THREE.Color('#c8a0ff');
        const colorOuter = new window.THREE.Color('#4080ff');

        const rand = (n) => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * n;

        for (let i = 0; i < pointCount; i++) {
            const radius = Math.random() * 5;
            const spinAngle = radius * 5;
            const branchAngle = (i % CONFIG.THREE.GALAXY_ARMS) * (Math.PI * 2 / 3);
            
            const x = Math.cos(branchAngle + spinAngle) * radius + rand(0.3);
            const y = rand(0.2);
            const z = Math.sin(branchAngle + spinAngle) * radius + rand(0.3);

            positions[i*3] = x;
            positions[i*3+1] = y;
            positions[i*3+2] = z;

            let color = new window.THREE.Color();
            if (radius < 1.5) {
                color.lerpColors(colorInner1, colorInner2, radius / 1.5);
            } else if (radius < 3) {
                color.lerpColors(colorInner2, colorMid, (radius - 1.5) / 1.5);
            } else {
                color.lerpColors(colorMid, colorOuter, (radius - 3) / 2);
            }

            colors[i*3] = color.r;
            colors[i*3+1] = color.g;
            colors[i*3+2] = color.b;
        }

        geometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new window.THREE.BufferAttribute(colors, 3));

        const material = new window.THREE.ShaderMaterial({
            depthWrite: false,
            blending: window.THREE.AdditiveBlending,
            vertexColors: true,
            transparent: true,
            uniforms: { uOpacity: { value: 0.0 } },
            vertexShader: `
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = (2.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float uOpacity;
                varying vec3 vColor;
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float strength = 1.0 - (distanceToCenter * 2.0);
                    if (strength <= 0.0) discard;
                    gl_FragColor = vec4(vColor, strength * uOpacity);
                }
            `
        });

        this.galaxy = new window.THREE.Points(geometry, material);
        this.galaxy.rotation.x = CONFIG.THREE.GALAXY_TILT_X;
        this.galaxy.position.z = -10;
        this.scene.add(this.galaxy);

        let start = performance.now();
        const fadeGalaxy = () => {
            const now = performance.now();
            const progress = Math.min((now - start) / CONFIG.TIMELINE.GALAXY_FADE_DURATION, 1);
            this.galaxy.material.uniforms.uOpacity.value = progress;
            if (progress < 1) requestAnimationFrame(fadeGalaxy);
        };
        fadeGalaxy();
    }

    brightenCenter() {
        const geometry = new window.THREE.SphereGeometry(0.8, 32, 32);
        const material = new window.THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: window.THREE.AdditiveBlending
        });
        this.centerGlow = new window.THREE.Mesh(geometry, material);
        this.centerGlow.position.z = -10;
        this.scene.add(this.centerGlow);

        let start = performance.now();
        const expand = () => {
            const now = performance.now();
            const progress = Math.min((now - start) / 400, 1);
            const scale = progress * 1.5;
            this.centerGlow.scale.set(scale, scale, scale);
            this.centerGlow.material.opacity = progress * 0.8;
            if (progress < 1) requestAnimationFrame(expand);
        };
        expand();
    }

    zoomOut() {
        let start = performance.now();
        const startZ = this.camera.position.z;
        const targetZ = startZ + 15;
        
        const zoom = () => {
            const now = performance.now();
            const progress = Math.min((now - start) / 2000, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            this.camera.position.z = startZ + (targetZ - startZ) * ease;
            if (progress < 1) requestAnimationFrame(zoom);
        };
        zoom();
    }

    startLoop() {
        const loop = () => {
            if (!this.animating) return;
            if (this.galaxy) {
                this.galaxy.rotation.y += CONFIG.THREE.GALAXY_ROTATION_SPEED;
            }
            this.renderer.render(this.scene, this.camera);
            this.rafId = requestAnimationFrame(loop);
        };
        loop();
    }

    dispose() {
        this.animating = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.isMesh || object.isPoints) {
                    object.geometry.dispose();
                    if (object.material.isMaterial) {
                        object.material.dispose();
                    } else if (Array.isArray(object.material)) {
                        for (const material of object.material) material.dispose();
                    }
                }
            });
        }
        
        if (isMobile()) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
        }
    }
}
