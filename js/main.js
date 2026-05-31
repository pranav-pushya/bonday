/**
 * main.js
 * The central state machine directing the AR makeup studio sequence.
 */

import { STATES, CONFIG } from './config.js?v=5';
import { CameraManager } from './camera.js?v=5';
import { SceneManager } from './scene.js?v=5';
import { StrokeManager } from './stroke.js?v=5';
import { GestureAnalyzer } from './gesture.js?v=5';
import { CrackManager } from './crack.js?v=5';
import { MotifManager } from './motifs.js?v=5';
import { UIManager } from './ui.js?v=5';

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
        this.motifs = new MotifManager(this.motifsContainer);
        this.stroke = new StrokeManager(this.sceneManager);
        this.gesture = new GestureAnalyzer();
        this.crack = new CrackManager(this.crackContainer);
        this.camera = new CameraManager(this.video, this.onResults.bind(this));
        
        this.start();
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
        if (this.stroke) {
            this.stroke.update();
        }
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
                setTimeout(() => {
                    this.transition(STATES.STUDIO_REVEAL);
                }, CONFIG.TIMELINE.STUDIO_REVEAL_START - CONFIG.TIMELINE.SHARDS_FALL_START);
                break;

            case STATES.STUDIO_REVEAL:
                this.ui.revealStudio(this.video);
                // Clear the 3D drawing trail to reveal pure studio
                this.stroke.clear();
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
                setTimeout(() => {
                    this.transition(STATES.BIRTHDAY_CARD);
                }, CONFIG.TIMELINE.CARD_TRANSITION_START - CONFIG.TIMELINE.NAME_ASSEMBLE_START);
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
