/**
 * config.js
 * Contains all constants, magic numbers, and state definitions.
 */

export const STATES = {
    LOADING: 'LOADING',
    CAMERA_READY: 'CAMERA_READY',
    TRACKING: 'TRACKING',
    S_DETECTED: 'S_DETECTED',
    FLASH: 'FLASH',
    CRACK: 'CRACK',
    SHARDS_FALL: 'SHARDS_FALL',
    STUDIO_REVEAL: 'STUDIO_REVEAL',
    RING_LIGHT: 'RING_LIGHT',
    NAME_ASSEMBLE: 'NAME_ASSEMBLE',
    SCROLL_JOURNEY: 'SCROLL_JOURNEY',
    BIRTHDAY_CARD: 'BIRTHDAY_CARD'
};

/**
 * Detects if the device is mobile based on screen width or touch points.
 * @returns {boolean}
 */
export const isMobile = () => {
    return window.innerWidth < 768 || navigator.maxTouchPoints > 0;
};

export const CONFIG = {
    // Camera & Tracking
    FPS_TARGET: 15,
    FRAME_MIN_TIME: 1000 / 15,
    
    // Stroke Rendering
    STROKE: {
        WIDTH: 5,
        SHADOW_BLUR_NORMAL: 20,
        COLOR_START: '#F0D080',
        COLOR_MID: '#E8943A',
        COLOR_END: '#C9A84C',
        COMPOSITE_OP: 'lighter'
    },

    // Hand Tracking Indicator
    INDICATOR: {
        INNER_RADIUS: 5,
        OUTER_RADIUS: 12
    },

    // Gesture Detection
    GESTURE: {
        WINDOW_SIZE: 150,
        CONFIDENCE_THRESHOLD: 0.70,
        MOVEMENT_THRESHOLD: 0.08 
    },

    // Crack Animation Config
    CRACK: {
        SHARDS_DESKTOP: 12,
        SHARDS_MOBILE: 7
    },

    // Motif Opacities per Phase
    MOTIFS: {
        PHASE1: 0.0,
        PHASE2: 0.0,
        PHASE3: 0.0,
        PHASE4: 1.0
    },

    // Name Reveal Identity
    REVEAL: {
        NAME: 'SHUBHI',
        AGE: 19
    },

    // Timeline Events (ms offset from S_DETECTED)
    TIMELINE: {
        FLASH_DURATION: 150,
        CRACK_START: 150,
        SHARDS_FALL_START: 400,
        SHARDS_FALL_MIN: 600,
        SHARDS_FALL_MAX: 900,
        STUDIO_REVEAL_START: 600,
        RING_LIGHT_START: 900,
        RING_LIGHT_DURATION: 600,
        NAME_ASSEMBLE_START: 1200,
        NAME_LETTER_DURATION: 500,
        NAME_STAGGER: 100,
        SUBTITLE_START: 1900,
        CARD_TRANSITION_START: 2400,
        CARD_ENTRANCE_DURATION: 800
    }
};
