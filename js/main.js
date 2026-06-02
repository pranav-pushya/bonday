/**
 * main.js
 * The central state machine directing the AR makeup studio sequence.
 */

import { STATES, CONFIG } from './config.js?v=7';
import { CameraManager } from './camera.js?v=7';
import { SceneManager } from './scene.js?v=7';
import { StrokeManager } from './stroke.js?v=7';
import { GestureAnalyzer } from './gesture.js?v=7';
import { CrackManager } from './crack.js?v=11';
import { MotifManager } from './motifs.js?v=11';
import { GalaxyManager } from './galaxy.js?v=11';
import { UIManager } from './ui.js?v=11';

class App {
    constructor() {
        this.currentState = STATES.LOADING;
        
        // DOM bindings
        this.video = document.getElementById('camera-feed');
        this.webglCanvas = document.getElementById('webgl-canvas');
        this.motifsContainer = document.getElementById('motifs-layer');
        this.crackContainer = document.getElementById('crack-container') || document.body;
        
        // Initialize 3D Engine
        this.sceneManager = new SceneManager(this.webglCanvas, () => this.update());
        
        // Initialize managers
        this.ui = new UIManager();
        this.motifs = new MotifManager(this.sceneManager);
        this.stroke = new StrokeManager(this.sceneManager);
        this.gesture = new GestureAnalyzer();
        this.crack = new CrackManager(this.sceneManager);
        this.galaxy = new GalaxyManager(this.sceneManager);
        this.camera = new CameraManager(this.video, this.onResults.bind(this));
        
        // Scroll Journey Variables
        this.scrollProgress = 0;
        this.targetScroll = 0;
        this.cardRevealed = false;
        
        // Listeners for Scroll Journey
        window.addEventListener('wheel', (e) => {
            if (e.target.closest('#birthday-card')) return;
            this.handleScroll(e.deltaY);
        });
        let touchStartY = 0;
        window.addEventListener('touchstart', (e) => { 
            if (e.target.closest('#birthday-card')) return;
            touchStartY = e.touches[0].clientY; 
        });
        window.addEventListener('touchmove', (e) => {
            if (e.target.closest('#birthday-card')) return;
            const touchY = e.touches[0].clientY;
            const delta = touchStartY - touchY;
            touchStartY = touchY;
            this.handleScroll(delta);
        });

        this.start();
    }

    handleScroll(delta) {
        if (this.currentState !== STATES.SCROLL_JOURNEY && this.currentState !== STATES.BIRTHDAY_CARD) return;
        // Adjust sensitivity
        this.targetScroll += delta * 0.002; // Increase sensitivity for easier scrolling
        this.targetScroll = Math.max(0, Math.min(1, this.targetScroll));
    }

    async start() {
        this.transition(STATES.LOADING);
        try {
            await this.camera.init();
            this.transition(STATES.CAMERA_READY);
        } catch (error) {
            console.error("Failed to start camera", error);
            this.ui.showError();
        }
    }

    // Called ~60fps by the Three.js render loop
    update() {
        let scrollVelocity = 0;
        
        // 3D Scroll Journey
        if (this.currentState === STATES.SCROLL_JOURNEY || this.currentState === STATES.BIRTHDAY_CARD) {
            
            // Initialize Galaxy if not active
            if (this.galaxy && !this.galaxy.isActive) {
                this.galaxy.init();
            }

            const lastProgress = this.scrollProgress;
            this.scrollProgress += (this.targetScroll - this.scrollProgress) * 0.05;
            scrollVelocity = Math.abs(this.scrollProgress - lastProgress);
            
            // Camera flies forward from z=10 to z=-10
            this.sceneManager.camera.position.z = 10 - (this.scrollProgress * 20);

            const scrollIndicator = document.getElementById('scroll-indicator');

            if (this.scrollProgress > 0.05) {
                // Fade out SHUBHI and subtitle
                const nameContainer = document.getElementById('name-container');
                const subtitle = document.getElementById('subtitle');
                if (nameContainer) nameContainer.style.opacity = Math.max(0, 1 - (this.scrollProgress * 10));
                if (subtitle) subtitle.style.opacity = Math.max(0, 1 - (this.scrollProgress * 10));
                if (scrollIndicator) scrollIndicator.classList.remove('visible');
            } else {
                if (scrollIndicator && this.currentState === STATES.SCROLL_JOURNEY) {
                    scrollIndicator.classList.add('visible');
                }
            }

            if (this.scrollProgress > 0.9 && !this.cardRevealed) {
                this.cardRevealed = true;
                this.transition(STATES.BIRTHDAY_CARD);
            } else if (this.scrollProgress < 0.8 && this.cardRevealed) {
                this.cardRevealed = false;
                this.currentState = STATES.SCROLL_JOURNEY; // revert state
                document.body.style.touchAction = 'none'; // Disable scrolling again
                const card = document.getElementById('birthday-card');
                if (card) {
                    card.classList.remove('visible');
                    setTimeout(() => {
                        if (!this.cardRevealed) card.style.display = 'none';
                    }, 800);
                }
            }
        }

        if (this.stroke) this.stroke.update();
        if (this.motifs) this.motifs.update(scrollVelocity);
        if (this.crack) this.crack.update();
        if (this.galaxy) this.galaxy.update(this.scrollProgress, scrollVelocity);
    }

    transition(newState) {
        this.exitState(this.currentState);
        this.currentState = newState;
        this.enterState(this.currentState);
    }

    enterState(state) {
        switch(state) {
            case STATES.LOADING:
                break;

            case STATES.CAMERA_READY:
                this.ui.transitionToPhase2();
                this.motifs.setPhaseOpacity('PHASE2');
                setTimeout(() => {
                    this.transition(STATES.TRACKING);
                }, 500);
                break;

            case STATES.TRACKING:
                break;

            case STATES.S_DETECTED:
                this.stroke.freeze();
                this.ui.updateProgress(0);
                this.transition(STATES.FLASH);
                break;

            case STATES.FLASH:
                this.motifs.setPhaseOpacity('PHASE3');
                this.ui.triggerFlash();
                setTimeout(() => {
                    this.transition(STATES.CRACK);
                }, CONFIG.TIMELINE.CRACK_START);
                break;

            case STATES.CRACK:
                this.crack.startCrack();
                setTimeout(() => {
                    this.transition(STATES.SHARDS_FALL);
                }, CONFIG.TIMELINE.SHARDS_FALL_START - CONFIG.TIMELINE.CRACK_START);
                break;

            case STATES.SHARDS_FALL:
                this.crack.fall();
                
                // Play Gen-Z Girl Bday Music
                const bgm = document.getElementById('bgm');
                if (bgm) {
                    bgm.volume = 0.7; // Ensure good background volume
                    bgm.play().catch(e => console.warn("Audio autoplay blocked by browser:", e));
                }

                setTimeout(() => {
                    this.transition(STATES.STUDIO_REVEAL);
                }, CONFIG.TIMELINE.STUDIO_REVEAL_START - CONFIG.TIMELINE.SHARDS_FALL_START);
                break;

            case STATES.STUDIO_REVEAL:
                this.ui.revealStudio(this.video);
                // Clear the 3D drawing trail to reveal pure studio
                this.stroke.clear();
                
                // Fade in the 3D Makeup and Petals out of the darkness
                this.motifs.setPhaseOpacity('PHASE4');
                
                setTimeout(() => {
                    this.transition(STATES.RING_LIGHT);
                }, CONFIG.TIMELINE.RING_LIGHT_START - CONFIG.TIMELINE.STUDIO_REVEAL_START);
                break;

            case STATES.RING_LIGHT:
                this.ui.pulseRingLight();
                setTimeout(() => {
                    this.transition(STATES.NAME_ASSEMBLE);
                }, CONFIG.TIMELINE.NAME_ASSEMBLE_START - CONFIG.TIMELINE.RING_LIGHT_START);
                break;

            case STATES.NAME_ASSEMBLE:
                this.ui.assembleName();
                setTimeout(() => {
                    this.ui.showSubtitle();
                }, CONFIG.TIMELINE.SUBTITLE_START - CONFIG.TIMELINE.NAME_ASSEMBLE_START);
                
                // Instead of jumping to the card, wait for the user to scroll
                setTimeout(() => {
                    this.transition(STATES.SCROLL_JOURNEY);
                }, CONFIG.TIMELINE.CARD_TRANSITION_START - CONFIG.TIMELINE.NAME_ASSEMBLE_START);
                break;
                
            case STATES.SCROLL_JOURNEY:
                const scrollIndicator = document.getElementById('scroll-indicator');
                if (scrollIndicator) scrollIndicator.classList.add('visible');
                break;

            case STATES.BIRTHDAY_CARD:
                this.motifs.setPhaseOpacity('PHASE4');
                this.ui.showBirthdayCard();
                break;
        }
    }

    exitState(state) { }

    onResults(results) {
        if (this.currentState !== STATES.TRACKING) return;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const indexFinger = results.multiHandLandmarks[0][8];
            const x = 1.0 - indexFinger.x; // Mirrored
            const y = indexFinger.y;

            this.stroke.addPoint(x, y);
            
            // Pass flat coordinates to gesture analyzer
            this.gesture.addPoint(x, y);
            const confidence = this.gesture.analyze();
            
            this.ui.updateProgress(confidence);

            if (confidence >= CONFIG.GESTURE.CONFIDENCE_THRESHOLD) {
                this.transition(STATES.S_DETECTED);
            }
        } else {
            // Hide the glowing fingertip if hand drops
            this.stroke.indicator.visible = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
