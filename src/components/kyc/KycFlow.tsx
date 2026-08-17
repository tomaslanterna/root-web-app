'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type Step = 'INTRO' | 'FACE' | 'DOC_FRONT' | 'DOC_BACK' | 'PROCESSING' | 'RESULT';

export default function KycFlow() {
  const [step, setStep] = useState<Step>('INTRO');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("getUserMedia is not supported on this browser/connection.");
        return; // UI will show fallback natively
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const captureFace = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imgData = canvasRef.current.toDataURL('image/jpeg');
        
        stopCamera();
        
        if (sessionId) {
          const blob = dataURItoBlob(imgData);
          const formData = new FormData();
          formData.append('faceMedia', blob, 'face.jpg');

          try {
            await fetch(`http://localhost:8080/v1/kyc/sessions/${sessionId}/face`, {
              method: 'POST',
              body: formData,
            });
          } catch (e) {
             console.error(e);
          }
        }
        
        setStep('DOC_FRONT');
      }
    }
  };

  const handleStart = async () => {
    try {
      const res = await fetch('http://localhost:8080/v1/kyc/sessions', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      setSessionId(data.sessionId);
      setStep('FACE');
      startCamera();
    } catch (err) {
      console.error(err);
      // Fallback for UI testing if backend is down
      setSessionId("mock_session_" + Date.now());
      setStep('FACE');
      startCamera();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (sessionId) {
      const formData = new FormData();
      formData.append(step === 'DOC_FRONT' ? 'frontImage' : 'backImage', file);

      try {
        await fetch(`http://localhost:8080/v1/kyc/sessions/${sessionId}/document`, {
          method: 'POST',
          body: formData,
        });
      } catch (err) {
        console.error(err);
      }
    }

    if (step === 'DOC_FRONT') {
      setStep('DOC_BACK');
    } else {
      setStep('PROCESSING');
      submitKyc();
    }
  };

  const submitKyc = async () => {
    try {
      const res = await fetch(`http://localhost:8080/v1/kyc/sessions/${sessionId}/submit`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok && data.status === 'APPROVED') {
         setResult({ status: 'APPROVED', message: 'Identidad verificada con éxito' });
      } else {
         setResult({ status: 'REJECTED', message: data.reason || 'Tu identidad no pudo ser verificada.' });
      }
    } catch (err) {
      // Mock success for testing without backend
      setTimeout(() => {
        setResult({ status: 'APPROVED', message: 'Identidad verificada con éxito (Modo Prueba)' });
        setStep('RESULT');
      }, 2000);
      return;
    }
    setStep('RESULT');
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full font-sans text-white">
      <div className="w-full max-w-sm rounded-3xl overflow-hidden bg-[#14171F] border border-white/10 shadow-2xl relative">
        
        {step === 'INTRO' && (
          <div className="p-6 flex flex-col items-center text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#D4FF00]/10 flex items-center justify-center mb-2">
              <Camera className="w-8 h-8 text-[#D4FF00]" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Verifica tu Identidad</h2>
              <p className="text-xs text-neutral-400 mt-2 font-medium">
                Para la compraventa segura de entradas, necesitamos validar tu identidad con tu documento uruguayo.
              </p>
            </div>
            <button 
              type="button"
              onClick={handleStart}
              className="w-full bg-[#D4FF00] text-neutral-950 text-sm font-black uppercase tracking-wider py-3.5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-[#D4FF00]/20"
            >
              Comenzar
            </button>
          </div>
        )}

        {step === 'FACE' && (
          <div className="relative flex flex-col items-center bg-black aspect-[3/4] w-full">
            {isCameraActive ? (
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                playsInline 
                muted 
              />
            ) : (
              <div className="w-full h-full bg-[#14171F] flex flex-col items-center justify-center space-y-4 px-6 text-center">
                <Camera className="w-12 h-12 text-neutral-600 mb-2" />
                <p className="text-xs text-neutral-400 font-medium">
                  Al estar conectado mediante una IP local (HTTP), iOS bloquea el acceso directo a la cámara web.
                </p>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="user"
                  ref={fileInputRef}
                  onChange={(e) => {
                    // Si toma la foto nativa, simulamos el avance
                    if (e.target.files?.[0]) setStep('DOC_FRONT');
                  }}
                  className="hidden" 
                />
                
                <button 
                  type="button"
                  onClick={triggerFileInput}
                  className="bg-[#D4FF00] text-neutral-950 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider"
                >
                  Abrir Cámara Nativa
                </button>
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute top-6 inset-x-0 flex justify-center z-10 px-4 pointer-events-none">
              <div className="bg-neutral-950/80 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-2xl">
                Escaneo Facial
              </div>
            </div>

            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-64 border-2 border-[#D4FF00] rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] transition-all duration-500" />
              </div>
            )}

            {isCameraActive && (
              <div className="absolute bottom-8 inset-x-0 flex justify-center z-10">
                <button 
                  type="button"
                  onClick={captureFace}
                  className="w-16 h-16 bg-[#D4FF00] rounded-full border-4 border-neutral-900 shadow-[0_0_20px_rgba(212,255,0,0.3)] active:scale-90 transition-transform flex items-center justify-center"
                >
                  <Camera className="w-6 h-6 text-neutral-950" />
                </button>
              </div>
            )}
          </div>
        )}

        {(step === 'DOC_FRONT' || step === 'DOC_BACK') && (
          <div className="p-8 flex flex-col items-center text-center space-y-6 bg-[#0B0D10]">
            <div className="space-y-2">
              <h2 className="text-base font-black uppercase tracking-tight text-[#D4FF00]">
                {step === 'DOC_FRONT' ? 'Frente del Documento' : 'Dorso del Documento'}
              </h2>
              <p className="text-xs text-neutral-400 font-medium">
                Sube o toma una foto del {step === 'DOC_FRONT' ? 'frente' : 'dorso'} de tu Cédula de Identidad. Asegúrate de que sea legible.
              </p>
            </div>

            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              id="doc-upload"
              onChange={handleFileUpload}
              className="hidden" 
            />

            <button 
              type="button"
              onClick={() => document.getElementById('doc-upload')?.click()}
              className="w-full aspect-video rounded-3xl border-2 border-dashed border-white/20 hover:border-[#D4FF00] bg-white/5 flex flex-col items-center justify-center gap-3 transition-colors group cursor-pointer"
            >
              <div className="p-3 rounded-full bg-white/10 group-hover:bg-[#D4FF00] transition-colors">
                <Upload className="w-6 h-6 text-neutral-400 group-hover:text-neutral-950" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white">
                Abrir Archivos / Cámara
              </span>
            </button>
          </div>
        )}

        {step === 'PROCESSING' && (
          <div className="p-10 flex flex-col items-center text-center space-y-6">
            <Loader2 className="w-12 h-12 text-[#D4FF00] animate-spin" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white mb-2">Analizando...</h2>
              <p className="text-xs text-neutral-400 font-medium">Verificando tu identidad con IA, esto tomará unos segundos.</p>
            </div>
          </div>
        )}

        {step === 'RESULT' && (
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              {result?.status === 'APPROVED' ? (
                <div className="w-20 h-20 rounded-full bg-[#D4FF00]/20 flex items-center justify-center relative z-10">
                  <CheckCircle2 className="w-10 h-10 text-[#D4FF00]" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center relative z-10">
                  <XCircle className="w-10 h-10 text-rose-500" />
                </div>
              )}
              <div className={`absolute inset-0 blur-xl ${result?.status === 'APPROVED' ? 'bg-[#D4FF00]/20' : 'bg-rose-500/20'}`} />
            </div>

            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                {result?.status === 'APPROVED' ? '¡Verificación Exitosa!' : 'Verificación Fallida'}
              </h2>
              <p className="text-xs text-neutral-400 font-medium">{result?.message}</p>
            </div>

            <button 
              type="button"
              onClick={() => window.location.reload()}
              className={`w-full text-neutral-950 text-sm font-black uppercase tracking-wider py-3.5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform ${result?.status === 'APPROVED' ? 'bg-[#D4FF00] shadow-lg shadow-[#D4FF00]/20' : 'bg-rose-500 shadow-lg shadow-rose-500/20 text-white'}`}
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
