import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Motion } from '@capacitor/motion';

export function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  const startTracking = useCallback(async () => {
    console.log("USE_PEDOMETER: startTracking iniciado.");
    setIsTracking(true);
    
    if (!Capacitor.isNativePlatform()) {
      const interval = setInterval(() => {
        setSteps(prev => {
          const added = Math.floor(Math.random() * 5);
          return prev + added;
        });
      }, 2000);
      return () => clearInterval(interval);
    } else {
      try {
        console.log("USE_PEDOMETER: Registrando listener NATIVO de ORIENTACIÓN (Giroscopio)...");
        let tickCounter = 0;
        let lastBeta = 0;
        let lastGamma = 0;
        
        await Motion.addListener('orientation', (event) => {
          const beta = event.beta || 0;
          const gamma = event.gamma || 0;
          
          // Calcular el cambio brusco de inclinación
          const deltaBeta = Math.abs(beta - lastBeta);
          const deltaGamma = Math.abs(gamma - lastGamma);
          
          lastBeta = beta;
          lastGamma = gamma;
          
          const magnitude = deltaBeta + deltaGamma;
          
          tickCounter++;
          if (tickCounter % 60 === 0) {
            console.log(`USE_PEDOMETER [Latido Giroscopio]: Mag=${magnitude.toFixed(2)} Beta:${beta.toFixed(2)}`);
          }

          // Un cambio de más de 15 grados en un frame suele ser una sacudida
          if (magnitude > 15) { 
            setSteps(prev => {
              const newSteps = prev + 1;
              console.log(`USE_PEDOMETER: ¡Paso Físico Detectado (Giroscopio)! 🕺 Mag: ${magnitude.toFixed(2)} - Total: ${newSteps}`);
              return newSteps;
            });
          }
        });
        console.log("USE_PEDOMETER: Listener de orientación registrado exitosamente.");  } catch (e) {
        console.error("USE_PEDOMETER: Falló al inicializar Motion tracking", e);
      }
      return () => { Motion.removeAllListeners(); };
    }
  }, []);

  const stopTracking = useCallback(() => {
    console.log("USE_PEDOMETER: stopTracking llamado.");
    setIsTracking(false);
    if (Capacitor.isNativePlatform()) {
      Motion.removeAllListeners();
    }
  }, []);

  return { steps, isTracking, startTracking, stopTracking, setSteps };
}
