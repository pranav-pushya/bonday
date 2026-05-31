/**
 * nameReveal.js
 * Handles the "SHUBHI" DOM letters explosion, reassembly, and constellation.
 */
import { CONFIG } from './config.js';

export class NameRevealManager {
    constructor(container) {
        this.container = container;
        this.letters = [];
        this.constellationStars = [];
        this.lines = [];
        this.label = null;
    }

    initLetters() {
        const word = CONFIG.REVEAL.NAME;
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < word.length; i++) {
            const span = document.createElement('span');
            span.textContent = word[i];
            span.className = 'name-letter';
            span.style.transform = `translate(-50%, -50%) scale(0)`;
            span.style.opacity = '0';
            fragment.appendChild(span);
            this.letters.push({
                element: span,
                targetX: (i - (word.length - 1) / 2) * Math.min(window.innerWidth * 0.12, 80), 
                targetY: 0,
                scatterX: (Math.random() - 0.5) * window.innerWidth * 1.5,
                scatterY: (Math.random() - 0.5) * window.innerHeight * 1.5,
                rot: (Math.random() - 0.5) * 720
            });
        }
        this.container.appendChild(fragment);
    }

    explodeAndReassemble() {
        this.initLetters();

        // 1. Scatter
        this.letters.forEach((l, i) => {
            setTimeout(() => {
                l.element.style.transition = `transform ${CONFIG.TIMELINE.NAME_SCATTER_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 100ms`;
                l.element.style.opacity = '1';
                l.element.style.transform = `translate(calc(-50% + ${l.scatterX}px), calc(-50% + ${l.scatterY}px)) scale(1.5) rotate(${l.rot}deg)`;
            }, i * 60);
        });

        // 2. Reassemble
        const maxStagger = (this.letters.length - 1) * 60;
        setTimeout(() => {
            this.letters.forEach((l) => {
                l.element.style.transition = `transform ${CONFIG.TIMELINE.NAME_REASSEMBLE_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
                l.element.style.transform = `translate(calc(-50% + ${l.targetX}px), calc(-50% + ${l.targetY}px)) scale(1) rotate(0deg)`;
            });
        }, CONFIG.TIMELINE.NAME_SCATTER_DURATION + maxStagger + CONFIG.TIMELINE.NAME_PAUSE_DURATION);
    }

    createConstellation() {
        const fragment = document.createDocumentFragment();
        const positions = [];

        for (let i = 0; i < CONFIG.REVEAL.AGE; i++) {
            const star = document.createElement('div');
            star.className = 'constellation-star';
            const angle = (i / CONFIG.REVEAL.AGE) * Math.PI * 2;
            const rx = window.innerWidth * 0.35 + Math.random() * 50;
            const ry = window.innerHeight * 0.15 + Math.random() * 30;
            const x = Math.cos(angle) * rx;
            const y = Math.sin(angle) * ry;
            
            star.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
            fragment.appendChild(star);
            this.constellationStars.push(star);
            positions.push({x, y});

            if (i > 0) {
                const prev = positions[i - 1];
                this.drawLine(prev.x, prev.y, x, y, fragment);
            }
        }
        this.drawLine(positions[positions.length-1].x, positions[positions.length-1].y, positions[0].x, positions[0].y, fragment);

        this.label = document.createElement('div');
        this.label.className = 'constellation-label';
        this.label.textContent = `${CONFIG.REVEAL.AGE} trips around the sun`;
        fragment.appendChild(this.label);

        this.container.appendChild(fragment);

        requestAnimationFrame(() => {
            this.constellationStars.forEach(s => s.classList.add('visible'));
            this.lines.forEach(l => l.classList.add('visible'));
            this.label.classList.add('visible');
        });
    }

    drawLine(x1, y1, x2, y2, container) {
        const line = document.createElement('div');
        line.className = 'constellation-line';
        const length = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.transform = `translate(${x1}px, ${y1}px) rotate(${angle}deg)`;
        line.style.transformOrigin = '0 50%';
        
        container.appendChild(line);
        this.lines.push(line);
    }
}
