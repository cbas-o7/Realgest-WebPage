// --- Normalización de Keypoints (¡MUY IMPORTANTE!) ---
// Esta función es crucial. Un modelo no puede aprender de coordenadas
// absolutas (x, y, z). Necesitamos normalizarlas.
// Esta es una normalización BÁSICA.

function normalizeKeypoints(sequence) {
  
  const SEQUENCE_LENGTH = 30; // Asegurarse de que esto coincida con el valor usado en train.js

  // Constantes esperadas (ajusta si usas menos landmarks)
  const POSE_LANDMARKS = 33;
  const FACE_LANDMARKS = 468;
  const HAND_LANDMARKS = 21;

  const FEATURES_PER_FRAME = POSE_LANDMARKS * 4 + 
                             FACE_LANDMARKS * 3 + 
                             HAND_LANDMARKS * 3 * 2; // (1662)

  const normalizedFrames = [];

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
  
  // Aplanar la secuencia de fotogramas en un solo vector por ahora
  // Un enfoque más avanzado usaría relleno (padding) y una LSTM.
  // Pero para empezar, aplanemos los primeros SEQUENCE_LENGTH fotogramas.
  
  let flatSequence = [];
  for (let i = 0; i < SEQUENCE_LENGTH; i++) {
    if (i < normalizedFrames.length) {
      flatSequence.push(...normalizedFrames[i]);
    } else {
      flatSequence.push(...Array(FEATURES_PER_FRAME).fill(0));
    }
  }

  // Truncar si es muy larga
  if (flatSequence.length > SEQUENCE_LENGTH * FEATURES_PER_FRAME) { 
     flatSequence = flatSequence.slice(0, SEQUENCE_LENGTH * FEATURES_PER_FRAME); 
  }

  // Corrección: Asegurarnos de que el relleno se haga si el primer frame no existe
  if (normalizedFrames.length === 0) {
      flatSequence = Array(SEQUENCE_LENGTH * FEATURES_PER_FRAME).fill(0);
  }


  return flatSequence;
}

export { normalizeKeypoints };