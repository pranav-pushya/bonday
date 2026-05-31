/**
 * motifs.js
 * Generates and manages the floating makeup studio SVGs.
 */
import { CONFIG } from './config.js';

export class MotifManager {
    constructor(container) {
        this.container = container;
        this.motifs = [];
        this.svgDefinitions = {
            brush: `
                <svg viewBox="0 0 24 24" width="100%" height="100%">
                    <rect x="10" y="8" width="4" height="14" rx="1" stroke="var(--gold)" stroke-width="1.5" fill="none"/>
                    <rect x="9" y="6" width="6" height="2" stroke="var(--gold)" stroke-width="1.5" fill="none"/>
                    <path d="M9 6 C9 2, 12 0, 12 0 C12 0, 15 2, 15 6 Z" stroke="var(--gold)" stroke-width="1.5" fill="none"/>
                </svg>`,
            lipstick: `
                <svg viewBox="0 0 24 24" width="100%" height="100%">
                    <rect x="8" y="10" width="8" height="12" rx="1" stroke="var(--rouge)" stroke-width="1.5" fill="none"/>
                    <rect x="9" y="8" width="6" height="2" stroke="var(--rouge)" stroke-width="1.5" fill="none"/>
                    <polygon points="9,8 10,2 14,4 15,8" stroke="var(--rouge)" stroke-width="1.5" fill="none"/>
                </svg>`,
            serum: `
                <svg viewBox="0 0 24 24" width="100%" height="100%">
                    <rect x="6" y="10" width="12" height="12" rx="3" stroke="var(--gold-light)" stroke-width="1.5" fill="none"/>
                    <rect x="9" y="8" width="6" height="2" stroke="var(--gold-light)" stroke-width="1.5" fill="none"/>
                    <path d="M11 8 L11 2 L13 2 L13 8" stroke="var(--gold-light)" stroke-width="1.5" fill="none"/>
                    <rect x="10" y="1" width="4" height="2" rx="1" stroke="var(--gold-light)" stroke-width="1.5" fill="none"/>
                </svg>`,
            compact: `
                <svg viewBox="0 0 24 24" width="100%" height="100%">
                    <circle cx="12" cy="12" r="8" stroke="var(--gold)" stroke-width="1" fill="none"/>
                    <line x1="4" y1="12" x2="20" y2="12" stroke="var(--gold)" stroke-width="1"/>
                    <rect x="19" y="11" width="2" height="2" stroke="var(--gold)" stroke-width="1" fill="none"/>
                </svg>`,
            sparkle: `
                <svg viewBox="0 0 24 24" width="100%" height="100%">
                    <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" stroke="var(--gold-light)" stroke-width="1" fill="rgba(240,208,128,0.08)"/>
                </svg>`
        };
        
        this.init();
    }

    init() {
        // Required Distribution: Brush: 4, Lipstick: 3, Serum: 3, Compact: 2, Sparkle: 3
        const distribution = [
            ...Array(4).fill('brush'),
            ...Array(3).fill('lipstick'),
            ...Array(3).fill('serum'),
            ...Array(2).fill('compact'),
            ...Array(3).fill('sparkle')
        ];

        // Shuffle
        distribution.sort(() => Math.random() - 0.5);

        const fragment = document.createDocumentFragment();

        distribution.forEach(type => {
            const el = document.createElement('div');
            el.className = 'motif';
            el.innerHTML = this.svgDefinitions[type];
            
            const size = 16 + Math.random() * 20; // 16 to 36px
            const left = 5 + Math.random() * 90; // Spread across viewport width (5% to 95%)
            const duration = 10 + Math.random() * 8; // 10s to 18s
            const delay = -Math.random() * 18; // Stagger start time
            
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.left = `${left}vw`;
            el.style.top = `${100 + Math.random() * 20}vh`; // start slightly below screen
            el.style.animationDuration = `${duration}s`;
            el.style.animationDelay = `${delay}s`;
            
            fragment.appendChild(el);
            this.motifs.push(el);
        });

        this.container.appendChild(fragment);
        this.setPhaseOpacity('PHASE1');
    }

    setPhaseOpacity(phase) {
        if (CONFIG.MOTIFS[phase] !== undefined) {
            this.container.style.opacity = CONFIG.MOTIFS[phase];
        }
    }
}
