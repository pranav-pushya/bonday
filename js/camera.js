/**
 * camera.js
 * Handles getUserMedia and MediaPipe Hands initialization with robust promise tracking.
 */
import { CONFIG } from './config.js';

export class CameraManager {
    constructor(videoElement, onResultsCallback) {
        this.video = videoElement;
        this.onResults = onResultsCallback;
        this.lastFrameTime = 0;

        // Initialize MediaPipe Hands via CDN
        this.hands = new window.Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        this.hands.onResults((results) => this.onResults(results));
    }

    async init() {
        try {
            console.log("Starting camera init...");
            
            // Some browsers hang indefinitely on explicit WASM initialization.
            // We will let MediaPipe auto-initialize on the first frame instead.
            // await this.hands.initialize();

            console.log("Requesting getUserMedia...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            console.log("Got stream:", stream);

            this.video.srcObject = stream;
            console.log("Stream assigned to video element.");

            return new Promise((resolve) => {
                const startVideo = async () => {
                    console.log("startVideo called.");
                    try {
                        await this.video.play();
                        console.log("Video playing.");
                    } catch (e) {
                        console.warn("Auto-play blocked, but stream is active.", e);
                    }
                    this.startProcessing();
                    console.log("Processing started.");
                    resolve(true);
                };
                
                if (this.video.readyState >= 2) {
                    console.log("Video readyState >= 2, starting immediately.");
                    startVideo();
                } else {
                    console.log("Waiting for onloadedmetadata...");
                    this.video.onloadedmetadata = startVideo;
                    // Failsafe timeout to prevent permanent hang
                    setTimeout(() => {
                        console.log("Failsafe timeout triggered!");
                        startVideo();
                    }, 1500);
                }
            });
        } catch (error) {
            console.error("Camera Init Error:", error);
            throw error; // Let UI manager handle the error screen
        }
    }

    startProcessing() {
        const processFrame = async () => {
            if (!this.video.paused && !this.video.ended) {
                const now = performance.now();
                // Throttle MediaPipe inference based on CONFIG target FPS
                if (now - this.lastFrameTime >= CONFIG.FRAME_MIN_TIME) {
                    await this.hands.send({ image: this.video });
                    this.lastFrameTime = now;
                }
            }
            requestAnimationFrame(processFrame);
        };
        requestAnimationFrame(processFrame);
    }
}
