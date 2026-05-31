/**
 * crack.js
 * Handles the screen shattering animation and shard physics using DOM SVGs.
 */
import { CONFIG, isMobile } from './config.js';

export class CrackManager {
    constructor(container) {
        this.container = container;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    createShards() {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.style.position = 'absolute';
        this.svg.style.top = '0';
        this.svg.style.left = '0';
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        this.svg.style.zIndex = '12';
        this.svg.style.pointerEvents = 'none';

        const numShards = isMobile() ? CONFIG.CRACK.SHARDS_MOBILE : CONFIG.CRACK.SHARDS_DESKTOP;
        
        // Generate radial jagged lines
        const crackLines = [];
        const maxDist = Math.max(this.width, this.height) * 1.5;

        for (let i = 0; i < numShards; i++) {
            const angle = (i / numShards) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
            const line = [{ x: this.centerX, y: this.centerY }];
            
            let dist = 0;
            let currentAngle = angle;
            
            for (let j = 0; j < 4; j++) {
                dist += maxDist / 4;
                currentAngle += (Math.random() * 0.4 - 0.2); // Jagged direction change
                line.push({
                    x: this.centerX + Math.cos(currentAngle) * dist,
                    y: this.centerY + Math.sin(currentAngle) * dist
                });
            }
            crackLines.push(line);
        }

        this.shards = [];
        for (let i = 0; i < numShards; i++) {
            const line1 = crackLines[i];
            const line2 = crackLines[(i + 1) % numShards];
            
            // Build polygon path tracing outward along line1, then inward along line2
            let d = `M ${this.centerX},${this.centerY} `;
            for (let j = 1; j < line1.length; j++) {
                d += `L ${line1[j].x},${line1[j].y} `;
            }
            for (let j = line2.length - 1; j >= 1; j--) {
                d += `L ${line2[j].x},${line2[j].y} `;
            }
            d += 'Z';

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('d', d);
            path.setAttribute('stroke', '#F0D080'); // var(--gold-light)
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'rgba(240,208,128,0.06)');
            
            path.style.opacity = '0';
            path.style.transformOrigin = `${this.centerX}px ${this.centerY}px`;

            this.svg.appendChild(path);
            this.shards.push(path);
        }

        this.container.appendChild(this.svg);
    }

    startCrack() {
        this.createShards();
        
        // Draw progressively from center outward
        this.shards.forEach((path, index) => {
            const length = path.getTotalLength ? path.getTotalLength() : this.width * 2;
            path.setAttribute('stroke-dasharray', length);
            path.setAttribute('stroke-dashoffset', length);
            path.style.opacity = '1';
            path.style.fillOpacity = '0';
            
            // Stagger each crack over the 150ms window
            setTimeout(() => {
                // Force reflow
                void path.getBoundingClientRect();
                path.style.transition = `stroke-dashoffset 60ms ease-out, fill-opacity 60ms ease-in`;
                path.setAttribute('stroke-dashoffset', '0');
                path.style.fillOpacity = '1';
            }, index * (150 / this.shards.length)); 
        });
    }

    fall() {
        this.shards.forEach(path => {
            const rot = (Math.random() - 0.5) * 30; // ±15deg
            const duration = CONFIG.TIMELINE.SHARDS_FALL_MIN + Math.random() * (CONFIG.TIMELINE.SHARDS_FALL_MAX - CONFIG.TIMELINE.SHARDS_FALL_MIN);
            
            // Exact easing requested
            path.style.transition = `transform ${duration}ms cubic-bezier(0.25,0.46,0.45,0.94), opacity ${duration}ms ease-in`;
            
            requestAnimationFrame(() => {
                path.style.transform = `rotate(${rot}deg) translateY(120vh)`;
                path.style.opacity = '0';
            });
        });

        // Cleanup
        setTimeout(() => {
            if (this.svg && this.svg.parentNode) {
                this.svg.parentNode.removeChild(this.svg);
            }
        }, CONFIG.TIMELINE.SHARDS_FALL_MAX + 100);
    }
}
