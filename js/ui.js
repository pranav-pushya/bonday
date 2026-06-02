/**
 * ui.js
 * Orchestrates DOM manipulation, phase transitions, and the CSS timeline.
 */
import { CONFIG } from './config.js';

export class UIManager {
    constructor() {
        this.elements = {
            phase1: document.getElementById('phase1-intro'),
            errorCard: document.getElementById('error-card'),
            loadingRing: document.getElementById('loading-ring'),
            progressRing: document.getElementById('progress-ring'),
            flash: document.getElementById('impact-flash'),
            ringLight: document.getElementById('ring-light'),
            nameContainer: document.getElementById('name-container'),
            shubhiTextSpans: document.querySelectorAll('#name-container span'),
            subtitle: document.getElementById('subtitle'),
            birthdayCard: document.getElementById('birthday-card'),
            roastLines: document.querySelectorAll('.roast-line'),
            warmCloser: document.querySelector('.warm-closer'),
            summonBtn: document.getElementById('summon-btn'),
            unflipBtn: document.getElementById('unflip-btn'),
            cardInner: document.getElementById('card-inner')
        };
        
        // Confetti Canvas initialization
        this.confettiCanvas = document.createElement('canvas');
        this.confettiCanvas.className = 'confetti-layer';
        document.body.appendChild(this.confettiCanvas);
        this.cCtx = this.confettiCanvas.getContext('2d');
        this.particles = [];
        this.animatingConfetti = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Button Event Listeners for 3D Card Flip
        if (this.elements.summonBtn) {
            this.elements.summonBtn.addEventListener('click', (e) => {
                if (this.elements.cardInner) {
                    this.elements.cardInner.classList.add('is-flipped');
                }
            });
        }
        
        if (this.elements.unflipBtn) {
            this.elements.unflipBtn.addEventListener('click', (e) => {
                if (this.elements.cardInner) {
                    this.elements.cardInner.classList.remove('is-flipped');
                }
            });
        }
    }

    resize() {
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
    }

    showError() {
        if (this.elements.loadingRing) this.elements.loadingRing.style.display = 'none';
        if (this.elements.errorCard) this.elements.errorCard.style.display = 'flex';
    }

    transitionToPhase2() {
        if (this.elements.phase1) {
            this.elements.phase1.style.opacity = '0';
            setTimeout(() => {
                this.elements.phase1.style.display = 'none';
            }, 500);
        }
    }

    updateProgress(confidence) {
        if (!this.elements.progressRing) return;
        const arc = confidence * 180;
        this.elements.progressRing.style.background = `conic-gradient(var(--gold) ${arc}deg, transparent ${arc}deg)`;
        this.elements.progressRing.style.opacity = confidence > 0 ? 1 : 0;
    }

    triggerFlash() {
        if (!this.elements.flash) return;
        this.elements.flash.classList.add('visible');
        setTimeout(() => {
            this.elements.flash.classList.remove('visible');
        }, CONFIG.TIMELINE.FLASH_DURATION);
    }

    revealStudio(video) {
        // Hide the video feed behind the shards so the studio background is revealed
        if (video) video.style.display = 'none';
        document.body.classList.add('studio-reveal');
    }

    pulseRingLight() {
        if (this.elements.ringLight) {
            this.elements.ringLight.classList.add('pulse');
        }
    }

    assembleName() {
        this.elements.shubhiTextSpans.forEach((span, i) => {
            setTimeout(() => {
                span.classList.add('visible');
            }, i * CONFIG.TIMELINE.NAME_STAGGER);
        });
    }

    showSubtitle() {
        if (this.elements.subtitle) {
            this.elements.subtitle.classList.add('visible');
        }
    }

    showBirthdayCard() {
        // Shrink the ring light back
        if (this.elements.ringLight) {
            this.elements.ringLight.classList.add('shrink');
        }

        const card = this.elements.birthdayCard;
        card.style.display = 'block';
        document.body.style.touchAction = 'pan-y'; // Allow vertical scroll when card is open
        
        // Force DOM reflow
        void card.offsetWidth; 
        
        // Trigger CSS transition entrance
        card.classList.add('visible');

        // Reveal roast lines using data-delay attributes
        this.elements.roastLines.forEach((line) => {
            const delay = parseInt(line.getAttribute('data-delay') || '0', 10);
            setTimeout(() => {
                line.classList.add('visible');
            }, CONFIG.TIMELINE.CARD_ENTRANCE_DURATION + delay);
        });

        // Reveal warm closer
        if (this.elements.warmCloser) {
            const warmDelay = parseInt(this.elements.warmCloser.getAttribute('data-delay') || '1200', 10);
            setTimeout(() => {
                this.elements.warmCloser.classList.add('visible');
            }, CONFIG.TIMELINE.CARD_ENTRANCE_DURATION + warmDelay);
        }
    }

    burstConfetti(x, y) {
        // Colors: gold, amber, rouge, cream
        const colors = ['#C9A84C', '#E8943A', '#C4626A', '#FFF8EE'];
        for (let i = 0; i < 120; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15 - 8,
                life: 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                isHeart: Math.random() < 0.2, // 20% chance of heart
                rot: Math.random() * Math.PI * 2,
                rotV: (Math.random() - 0.5) * 0.2
            });
        }
        if (!this.animatingConfetti) {
            this.animatingConfetti = true;
            this.animateConfetti();
        }
    }

    animateConfetti() {
        this.cCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        let active = false;
        
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            if (p.life > 0) {
                active = true;
                p.vy += 0.3; // Gravity
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.01; // Fade
                p.rot += p.rotV;
                
                this.cCtx.globalAlpha = Math.max(0, p.life);
                this.cCtx.fillStyle = p.color;
                
                if (p.isHeart) {
                    this.cCtx.save();
                    this.cCtx.translate(p.x, p.y);
                    this.cCtx.rotate(p.rot);
                    const s = 4;
                    this.cCtx.beginPath();
                    this.cCtx.moveTo(0, s/2);
                    this.cCtx.bezierCurveTo(-s, -s/2, -s*2, s/2, 0, s*1.5);
                    this.cCtx.bezierCurveTo(s*2, s/2, s, -s/2, 0, s/2);
                    this.cCtx.fill();
                    this.cCtx.restore();
                } else {
                    this.cCtx.beginPath();
                    this.cCtx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                    this.cCtx.fill();
                }
            }
        }
        
        if (active) {
            requestAnimationFrame(() => this.animateConfetti());
        } else {
            this.particles = [];
            this.animatingConfetti = false;
        }
    }
}
