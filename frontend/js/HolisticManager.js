import {
  PoseLandmarker,
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15";

export default class HolisticManager {
  constructor({ videoElement, canvasElement, onResults } = {}) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement ? canvasElement.getContext("2d") : null;
    this.onResultsCallback = onResults || null;
    
    this.poseLandmarker = null;
    this.handLandmarker = null;
    
    this.isRunning = false;
    this.lastVideoTime = -1;

    this._initModels();
  }

  async _initModels() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm"
        );

        // 1. Cargar POSE (Versión LITE - Súper rápida)
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        // 2. Cargar HANDS (Manos)
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 2, // Detectar ambas manos
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        console.log("Modelos Ligeros (Pose Lite + Hands) cargados.");
        
        if (this.isRunning) {
            this._loop();
        }

    } catch (error) {
        console.error("Error iniciando modelos:", error);
        alert("Error cargando IA.");
    }
  }

  start() {
    if (!this.videoElement) throw new Error("Falta videoElement");
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.poseLandmarker && this.handLandmarker) this._loop();
  }

  async _loop() {
    if (!this.isRunning) return;

    if (this.poseLandmarker && this.handLandmarker && this.videoElement.currentTime !== this.lastVideoTime) {
        if (this.videoElement.readyState >= 2 && !this.videoElement.paused) {
            this.lastVideoTime = this.videoElement.currentTime;
            try {
                const startTime = performance.now();
                
                // --- EJECUCIÓN PARALELA (Más velocidad) ---
                // Lanzamos ambas detecciones a la vez
                const posePromise = this.poseLandmarker.detectForVideo(this.videoElement, startTime);
                const handPromise = this.handLandmarker.detectForVideo(this.videoElement, startTime);
                
                const [poseResult, handResult] = await Promise.all([posePromise, handPromise]);
                
                this._processResults(poseResult, handResult);
            } catch (e) {
                // Ignorar frames perdidos
            }
        }
    }

    if (this.isRunning) {
        requestAnimationFrame(this._loop.bind(this));
    }
  }

  _processResults(poseResult, handResult) {
    // 1. Procesar Manos (Identificar Izquierda vs Derecha)
    let leftHand = [];
    let rightHand = [];

    if (handResult.landmarks && handResult.handedness) {
        for (let i = 0; i < handResult.handedness.length; i++) {
            // MediaPipe a veces invierte 'Left'/'Right' en modo selfie, 
            // pero mantenemos el estándar de la librería.
            const label = handResult.handedness[i][0].categoryName; 
            const landmarks = handResult.landmarks[i];

            if (label === "Right") rightHand = landmarks; 
            else leftHand = landmarks;
        }
    }

    // 2. Preparar objeto combinado (Formato Legacy para compatibilidad)
    const legacyResults = {
        poseLandmarks: poseResult.landmarks ? poseResult.landmarks[0] : [],
        faceLandmarks: [], // ¡Cara vacía! Ahorro masivo de CPU
        leftHandLandmarks: leftHand,
        rightHandLandmarks: rightHand,
    };

    // 3. Limpiar canvas
    if (this.canvasCtx) {
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        // Aquí podrías volver a activar el dibujo si quieres, 
        // ahora que tienes CPU de sobra.
    }

    // Datos para tu lógica de grabación
    const latestLandmarks = {
        timestamp: Date.now(),
        pose: legacyResults.poseLandmarks || [],
        face: [],
        leftHand: legacyResults.leftHandLandmarks || [],
        rightHand: legacyResults.rightHandLandmarks || [],
    };

    if (typeof this.onResultsCallback === "function") {
      this.onResultsCallback(latestLandmarks, legacyResults);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.canvasCtx) {
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
  }
}