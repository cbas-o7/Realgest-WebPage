export default class HolisticManager {
  constructor({ videoElement, canvasElement, onResults } = {}) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement ? canvasElement.getContext("2d") : null;
    this.onResultsCallback = onResults || null;
    this.latestLandmarks = null;
    this.isRunning = false; // Bandera para controlar el bucle
    this.camera = null;

    this.holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    this.holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.holistic.onResults(this._handleResults.bind(this));
  }

  _handleResults(results) {
    // Ajusta tamaño del canvas al del video
    if (this.videoElement && this.videoElement.videoWidth && this.videoElement.videoHeight && this.canvasElement) {
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
    }

    if (this.canvasCtx) {
      this.canvasCtx.save();
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      //this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

      // Dibujo de landmarks (misma lógica anterior)
      /* if (results.faceLandmarks) {
        drawConnectors(this.canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
          color: "#C0C0C070",
          lineWidth: 1,
        });
      } */
      if (results.poseLandmarks) {
        drawConnectors(this.canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 4,
        });
        drawLandmarks(this.canvasCtx, results.poseLandmarks, {
          color: "#FF0000",
          lineWidth: 2,
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
    if (!this.videoElement) throw new Error("videoElement no está definido en HolisticManager");
    
    if (this.isRunning) return; // Evitar múltiples bucles
    this.isRunning = true;
    
    this._processFrame();
  }

  // Función recursiva para procesar video frame a frame
  async _processFrame() {
    if (!this.isRunning) return;

    try {
        // Verificar que el video tenga datos antes de enviar
        if (this.videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
            await this.holistic.send({ image: this.videoElement });
        }
    } catch (error) {
        console.error("Error procesando frame MediaPipe:", error);
    }

    // Solicitar el siguiente frame al navegador
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