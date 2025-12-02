export default class HolisticManager {
  constructor({ videoElement, canvasElement, onResults } = {}) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement ? canvasElement.getContext("2d") : null;
    this.onResultsCallback = onResults || null;
    this.latestLandmarks = null;
    this.isRunning = false; // Bandera para controlar el bucle
    this.camera = null;

    this.lastFrameTime = 0;
    // Ahora: 30 (Aprox 30 FPS) -> Tarda 1s en llenar el buffer (si el móvil aguanta)
    this.processInterval = 30;

    this.holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    this.holistic.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      enableSegmentation: false,
      refineFaceLandmarks: false,
      minDetectionConfidence: 0.4,
      minTrackingConfidence: 0.4
    });

    this.holistic.onResults(this._handleResults.bind(this));
  }

  _handleResults(results) {
    // Ajusta tamaño del canvas (solo si cambia para no redibujar el DOM innecesariamente)
    if (this.videoElement && this.canvasElement) {
       const vw = this.videoElement.videoWidth;
       const vh = this.videoElement.videoHeight;
       if (this.canvasElement.width !== vw || this.canvasElement.height !== vh) {
           this.canvasElement.width = vw;
           this.canvasElement.height = vh;
       }
    }

    if (this.canvasCtx) {
      this.canvasCtx.save();
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      //this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

      if (results.poseLandmarks) {
        drawConnectors(this.canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2,
        });
        drawLandmarks(this.canvasCtx, results.poseLandmarks, {
          color: "#FF0000",
          lineWidth: 1,
          radius: 3,
        });
      }
      if (results.leftHandLandmarks) {
        drawConnectors(this.canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
          color: "#00FFFF",
          lineWidth: 2,
        });
        drawLandmarks(this.canvasCtx, results.leftHandLandmarks, {
          color: "#FFFFFF",
          lineWidth: 1,
          radius: 3,
        });
      }
      if (results.rightHandLandmarks) {
        drawConnectors(this.canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
          color: "#FF00FF",
          lineWidth: 2,
        });
        drawLandmarks(this.canvasCtx, results.rightHandLandmarks, {
          color: "#FFFFFF",
          lineWidth: 1,
          radius: 3,
        });
      }
      this.canvasCtx.restore();
    }

    // Guardar datos numéricos
    this.latestLandmarks = {
      timestamp: Date.now(),
      pose: results.poseLandmarks || [],
      //face: results.faceLandmarks || [],
      leftHand: results.leftHandLandmarks || [],
      rightHand: results.rightHandLandmarks || [],
    };

    if (typeof this.onResultsCallback === "function") {
      this.onResultsCallback(this.latestLandmarks, results);
    }
  }

  setOnResults(cb) {
    this.onResultsCallback = cb;
  }

  start() {
    if (!this.videoElement) throw new Error("videoElement no está definido");
    if (this.isRunning) return;
    
    this.isRunning = true;
    this._processFrame();
  }

  async _processFrame() {
    if (!this.isRunning) return;

    const now = Date.now();
    // Solo procesa si pasaron 30ms (intentamos ir a 30 FPS)
    if (now - this.lastFrameTime >= this.processInterval) {
        this.lastFrameTime = now;
        
        if (this.videoElement.readyState >= 2 && !this.videoElement.paused) {
            try {
                await this.holistic.send({ image: this.videoElement });
            } catch (error) {
                // Silencioso para no saturar consola
            }
        }
    }

    if (this.isRunning) {
        requestAnimationFrame(this._processFrame.bind(this));
    }
  }

  stop() {
    this.isRunning = false; // Detiene el bucle _processFrame
    this.latestLandmarks = null;
    
    if (this.canvasCtx && this.canvasElement) {
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
  }

  getLatestLandmarks() {
    return this.latestLandmarks;
  }
}