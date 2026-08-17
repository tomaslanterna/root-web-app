'use client';

import React, { useState, useRef, useCallback } from 'react';

type Step = 'INTRO' | 'DOC_FRONT' | 'DOC_BACK' | 'FACE' | 'PROCESSING' | 'RESULT';

export default function KycFlow() {
  const [step, setStep] = useState<Step>('INTRO');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper to convert base64 dataURI to Blob
  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("No pudimos acceder a tu cámara. Es necesario para el KYC.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        return canvasRef.current.toDataURL('image/jpeg');
      }
    }
    return null;
  };

  const handleStart = async () => {
    try {
      const res = await fetch('http://localhost:8080/v1/kyc/sessions', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      setSessionId(data.sessionId);
      setStep('DOC_FRONT');
      startCamera();
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  };

  const handleCaptureDocFront = async () => {
    const imgData = captureImage();
    if (imgData && sessionId) {
      const blob = dataURItoBlob(imgData);
      const formData = new FormData();
      formData.append('frontImage', blob, 'front.jpg');

      await fetch(`http://localhost:8080/v1/kyc/sessions/${sessionId}/document`, {
        method: 'POST',
        body: formData,
      });
      setStep('DOC_BACK');
    }
  };

  const handleCaptureDocBack = async () => {
    const imgData = captureImage();
    if (imgData && sessionId) {
      const blob = dataURItoBlob(imgData);
      const formData = new FormData();
      formData.append('backImage', blob, 'back.jpg');

      await fetch(`http://localhost:8080/v1/kyc/sessions/${sessionId}/document`, {
        method: 'POST',
        body: formData,
      });
      setStep('FACE');
    }
  };

  const handleCaptureFace = async () => {
    const imgData = captureImage();
    if (imgData && sessionId) {
      stopCamera();
      setStep('PROCESSING');
      
      const blob = dataURItoBlob(imgData);
      const formData = new FormData();
      formData.append('faceMedia', blob, 'face.jpg');

      await fetch(`http://localhost:8080/v1/kyc/sessions/${sessionId}/face`, {
        method: 'POST',
        body: formData,
      });

      // Llamar a submit (Analiza con IA de forma síncrona/lenta)
      const res = await fetch(`http://localhost:8080/v1/kyc/sessions/${sessionId}/submit`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok && data.status === 'APPROVED') {
         setResult({ status: 'APPROVED', message: 'Identidad verificada con éxito' });
      } else {
         setResult({ status: 'REJECTED', message: data.reason || 'Tu identidad no pudo ser verificada.' });
      }
      setStep('RESULT');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans text-gray-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {step === 'INTRO' && (
          <div className="p-8 flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-4">Verifica tu Identidad</h2>
            <p className="text-gray-600 mb-8">
              Para garantizar la seguridad de la comunidad, necesitamos verificar que eres una persona real. 
              Ten a mano tu Cédula de Identidad uruguaya.
            </p>
            <button 
              onClick={handleStart}
              className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Comenzar Verificación
            </button>
          </div>
        )}

        {(step === 'DOC_FRONT' || step === 'DOC_BACK' || step === 'FACE') && (
          <div className="relative bg-black flex flex-col items-center">
            <video 
              ref={videoRef} 
              className="w-full h-[60vh] object-cover" 
              playsInline 
              muted 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay Instructions */}
            <div className="absolute top-8 left-0 right-0 text-center px-4">
              <div className="inline-block bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full font-medium shadow-lg">
                {step === 'DOC_FRONT' && "Posiciona el FRENTE de tu cédula"}
                {step === 'DOC_BACK' && "Posiciona el DORSO de tu cédula"}
                {step === 'FACE' && "Mira a la cámara para una selfie"}
              </div>
            </div>

            {/* Guide Mask */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {step !== 'FACE' ? (
                <div className="w-3/4 h-48 border-2 border-dashed border-white/70 rounded-xl" />
              ) : (
                <div className="w-48 h-64 border-2 border-dashed border-white/70 rounded-full" />
              )}
            </div>

            {/* Capture Button */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button 
                onClick={
                  step === 'DOC_FRONT' ? handleCaptureDocFront : 
                  step === 'DOC_BACK' ? handleCaptureDocBack : handleCaptureFace
                }
                className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 shadow-xl active:scale-95 transition-transform"
              />
            </div>
          </div>
        )}

        {step === 'PROCESSING' && (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-semibold mb-2">Analizando datos...</h2>
            <p className="text-gray-500">Nuestra IA está verificando tus imágenes, por favor espera.</p>
          </div>
        )}

        {step === 'RESULT' && (
          <div className="p-8 flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${result?.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {result?.status === 'APPROVED' ? (
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {result?.status === 'APPROVED' ? '¡Verificación Exitosa!' : 'Verificación Fallida'}
            </h2>
            <p className="text-gray-600 mb-8">{result?.message}</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
