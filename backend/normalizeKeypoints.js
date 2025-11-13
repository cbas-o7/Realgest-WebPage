// --- Normalización de Keypoints (¡MUY IMPORTANTE!) ---
// Esta función es crucial. Un modelo no puede aprender de coordenadas
// absolutas (x, y, z). Necesitamos normalizarlas.
// Esta es una normalización BÁSICA.
  
  const SEQUENCE_LENGTH = 30; 

  const POSE_LANDMARKS = 33;
  const FACE_LANDMARKS = 468;
  const HAND_LANDMARKS = 21;

  const FEATURES_PER_FRAME = POSE_LANDMARKS * 4 + 
                             FACE_LANDMARKS * 3 + 
                             HAND_LANDMARKS * 3 * 2; // (1662)

function normalizeKeypoints(sequence) {
  const normalizedFrames = [];

  //  Extrae las características de cada fotograma
  for (const frame of sequence) {
    const frameFeatures = [];

    // Pose (33 landmarks * 4)
    for (let i = 0; i < POSE_LANDMARKS; i++) {
      const p = (frame.pose && frame.pose[i]) || {};
      frameFeatures.push(
        Number(p.x || 0),
        Number(p.y || 0),
        Number(p.z || 0),
        Number(p.visibility || 0)
      );
    }

    // Face (468 landmarks * 3)
    for (let i = 0; i < FACE_LANDMARKS; i++) {
      const f = (frame.face && frame.face[i]) || {};
      frameFeatures.push(
        Number(f.x || 0),
        Number(f.y || 0),
        Number(f.z || 0)
      );
    }

    // Left hand (21 * 3)
    for (let i = 0; i < HAND_LANDMARKS; i++) {
      const h = (frame.leftHand && frame.leftHand[i]) || {};
      frameFeatures.push(
        Number(h.x || 0),
        Number(h.y || 0),
        Number(h.z || 0)
      );
    }

    // Right hand (21 * 3)
    for (let i = 0; i < HAND_LANDMARKS; i++) {
      const h = (frame.rightHand && frame.rightHand[i]) || {};
      frameFeatures.push(
        Number(h.x || 0),
        Number(h.y || 0),
        Number(h.z || 0)
      );
    }

    // Asegurar longitud por si algo inesperado pasó
    if (frameFeatures.length !== FEATURES_PER_FRAME) {
      // rellenar/recortar para que siempre coincida
      if (frameFeatures.length < FEATURES_PER_FRAME) {
        frameFeatures.push(...Array(FEATURES_PER_FRAME - frameFeatures.length).fill(0));
      } else {
        frameFeatures.length = FEATURES_PER_FRAME;
      }
    }

    normalizedFrames.push(frameFeatures);
  }
  
  //    Rellena (o trunca) la secuencia a SEQUENCE_LENGTH (30) fotogramas
  //    No aplanamos, devolvemos un array de arrays: [30, 1662]
  
  const paddedFrames = [];
  for (let i = 0; i < SEQUENCE_LENGTH; i++) {
    if (i < normalizedFrames.length) {
      // Añade el fotograma con sus 1662 características
      paddedFrames.push(normalizedFrames[i]);
    } else {
      // Añade un fotograma vacío (relleno de ceros)
      paddedFrames.push(Array(FEATURES_PER_FRAME).fill(0));
    }
  }

  return paddedFrames;
}

// Exportamos las constantes para que train.js las use
export { normalizeKeypoints, SEQUENCE_LENGTH, FEATURES_PER_FRAME };