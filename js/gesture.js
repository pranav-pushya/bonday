/**
 * gesture.js
 * Analyzes the point trail for the 'S' gesture signature.
 */
import { CONFIG } from './config.js';

export class GestureAnalyzer {
    constructor() {
        this.points = [];
        this.confidence = 0;
    }

    addPoint(x, y) {
        this.points.push({ x, y });
        if (this.points.length > CONFIG.GESTURE.WINDOW_SIZE) {
            this.points.shift();
        }
    }

    analyze() {
        if (this.points.length < 30) {
            this.confidence = 0;
            return this.confidence;
        }

        let phase = 0;
        let phaseStartX = this.points[0].x;
        let score = 0;

        for (let i = 1; i < this.points.length; i++) {
            const pt = this.points[i];
            
            if (phase === 0) {
                // Looking for initial leftward sweep (top curve of 'S')
                if (pt.x < phaseStartX - CONFIG.GESTURE.MOVEMENT_THRESHOLD) {
                    phase = 1;
                    score += 0.33;
                    phaseStartX = pt.x;
                }
            } else if (phase === 1) {
                // Looking for middle rightward sweep (diagonal of 'S')
                if (pt.x > phaseStartX + CONFIG.GESTURE.MOVEMENT_THRESHOLD) {
                    phase = 2;
                    score += 0.33;
                    phaseStartX = pt.x;
                }
            } else if (phase === 2) {
                // Looking for final leftward sweep (bottom curve of 'S')
                if (pt.x < phaseStartX - CONFIG.GESTURE.MOVEMENT_THRESHOLD) {
                    score += 0.34;
                    break;
                }
            }
        }

        // Smooth confidence mapping to prevent jitter
        this.confidence = this.confidence * 0.8 + score * 0.2;
        return this.confidence;
    }
}
