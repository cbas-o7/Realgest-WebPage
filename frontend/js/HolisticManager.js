import {
  HolisticLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15";

export default class HolisticManager {
  constructor({ videoElement, canvasElement, onResults } = {}) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement ? canvasElement.getContext("2d") : null;
    this.onResultsCallback = onResults || null;
    this.latestLandmarks = null;
    
    this.landmarker = null;
    this.isRunning = false;
    this.lastVideoTime = -1;

    this._initModel();
  }

  async _initModel() {
    try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm"
        );

        this.landmarker = await HolisticLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minPoseTrackingConfidence: 0.5,
            minHandDetectionConfidence: 0.5, 
            minFaceDetectionConfidence: 0.5,
        });

        console.log("Modelo Holistic (v0.10.15) cargado correctamente desde /latest/.");
        
        if (this.isRunning) {
            this._loop();
        }

    } catch (error) {
        console.error("Error iniciando MediaPipe:", error);
        alert("Error cargando el modelo de IA. Verifica tu conexión a internet.");
    }
  }

  start() {
    if (!this.videoElement) throw new Error("videoElement no está definido");
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    if (this.landmarker) {
        this._loop();
    }
  }

  async _loop() {
    if (!this.isRunning) return;

    if (this.landmarker && this.videoElement.currentTime !== this.lastVideoTime) {
        if (this.videoElement.readyState >= 2 && !this.videoElement.paused) {
            this.lastVideoTime = this.videoElement.currentTime;
            try {
                const startTime = performance.now();
                const results = this.landmarker.detectForVideo(this.videoElement, startTime);
                this._processResults(results);
            } catch (e) {
                // Ignorar errores de frame
            }
        }
    }

    if (this.isRunning) {
        requestAnimationFrame(this._loop.bind(this));
    }
  }

  _processResults(results) {
    if (this.canvasCtx) {
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    const legacyResults = {
        poseLandmarks: results.poseLandmarks ? results.poseLandmarks[0] : [],
        faceLandmarks: [], 
        leftHandLandmarks: results.leftHandLandmarks ? results.leftHandLandmarks[0] : [],
        rightHandLandmarks: results.rightHandLandmarks ? results.rightHandLandmarks[0] : [],
    };

    this.latestLandmarks = {
        timestamp: Date.now(),
        pose: legacyResults.poseLandmarks || [],
        face: [],
        leftHand: legacyResults.leftHandLandmarks || [],
        rightHand: legacyResults.rightHandLandmarks || [],
    };

    if (typeof this.onResultsCallback === "function") {
      this.onResultsCallback(this.latestLandmarks, legacyResults);
    }
  }

  stop() {
    this.isRunning = false;
    this.latestLandmarks = null;
    if (this.canvasCtx) {
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
  }

  getLatestLandmarks() {
    return this.latestLandmarks;
  }
}