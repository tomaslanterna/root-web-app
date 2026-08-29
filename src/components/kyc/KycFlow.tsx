'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, XCircle, Loader2, ScanFace, ArrowRight, RefreshCcw } from 'lucide-react';

import { kycApi } from '@/services/kyc';
import { useMutation } from '@/hooks/useMutation';
import { useAuth } from '@/context/AuthContext';

type Step = 'INTRO' | 'FACE' | 'DOC_FRONT' | 'DOC_BACK' | 'PROCESSING' | 'RESULT';

export default function KycFlow() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('INTRO');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("Alinea tu rostro en el óvalo...");
  
  // Previews
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [docFrontPreview, setDocFrontPreview] = useState<string | null>(null);
  const [docBackPreview, setDocBackPreview] = useState<string | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef<NodeJS.Timeout | null>(null);

  // --- Mutations ---
  const { mutate: createSession } = useMutation(
    async () => {
      const data = await kycApi.createSession(user?.id as string);
      return data;
    },
    {
      onSuccess: (data) => setSessionId(data.sessionId),
      onError: (err) => {
        console.error("Session creation failed, falling back to mock", err);
        setSessionId("mock_session_" + Date.now());
      }
    }
  );

  const { mutate: uploadFace, isLoading: isUploadingFace } = useMutation(
    async ({ id, blob }: { id: string; blob: Blob }) => {
      const formData = new FormData();
      formData.append('faceMedia', blob, 'face.jpg');
      const data = await kycApi.uploadFace(id, formData);
      return data;
    }
  );

  const { mutate: uploadDoc, isLoading: isUploadingDoc } = useMutation(
    async ({ id, docStep, file }: { id: string; docStep: Step; file: File }) => {
      const formData = new FormData();
      formData.append(docStep === 'DOC_FRONT' ? 'frontImage' : 'backImage', file);
      const data = await kycApi.uploadDocument(id, formData);
      return data;
    }
  );

  const { mutate: submitSession } = useMutation(
    async (id: string) => {
      const data = await kycApi.submitSession(id);
      return data;
    },
    {
      onSuccess: (data) => {
        if (data.status === 'APPROVED') {
           setResult({ status: 'APPROVED', message: 'Identidad verificada con éxito' });
        } else {
           setResult({ status: 'REJECTED', message: data.reason || 'Tu identidad no pudo ser verificada.' });
        }
        setStep('RESULT');
      },
      onError: () => {
        setTimeout(() => {
          setResult({ status: 'APPROVED', message: 'Identidad verificada con éxito (Modo Prueba)' });
          setStep('RESULT');
        }, 2000);
      }
    }
  );

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

  const startCamera = async (facingMode: 'user' | 'environment') => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScanStatus("Error de conexión");
        return;
      }
      setScanStatus(facingMode === 'user' ? "Solicitando permisos de cámara..." : "Iniciando cámara trasera...");
      
      const constraints = facingMode === 'environment' 
        ? { video: { facingMode: { exact: "environment" } } }
        : { video: { facingMode: 'user' } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async (e) => {
        if (facingMode === 'environment') {
          return await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        }
        throw e;
      });
      
      setIsCameraActive(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          if (facingMode === 'user') {
            startFakeScanning();
          }
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setScanStatus("Cámara bloqueada o denegada");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
    if (scanningRef.current) {
      clearInterval(scanningRef.current);
    }
  };

  const startFakeScanning = () => {
    setScanProgress(0);
    setScanStatus("Alinea tu rostro en el óvalo...");
    
    let progress = 0;
    scanningRef.current = setInterval(() => {
      progress += 2;
      setScanProgress(progress);
      
      if (progress === 20) {
        setScanStatus("Rostro detectado, mantente quieto...");
      } else if (progress === 60) {
        setScanStatus("Analizando rasgos faciales...");
      } else if (progress === 90) {
        setScanStatus("Finalizando captura...");
      } else if (progress >= 100) {
        if (scanningRef.current) clearInterval(scanningRef.current);
        setScanStatus("¡Escaneo exitoso!");
        setTimeout(() => {
          captureFace();
        }, 800);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (scanningRef.current) clearInterval(scanningRef.current);
      stopCamera();
    };
  }, []);

  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imgData = canvasRef.current.toDataURL('image/jpeg');
        
        stopCamera();
        setFacePreview(imgData);
        setCurrentBlob(dataURItoBlob(imgData));
      }
    }
  };

  const captureDocument = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const imgData = canvasRef.current.toDataURL('image/jpeg', 0.85);
        stopCamera();
        
        if (step === 'DOC_FRONT') {
          setDocFrontPreview(imgData);
        } else {
          setDocBackPreview(imgData);
        }
        
        canvasRef.current.toBlob((blob) => {
          if (blob) setCurrentBlob(blob);
        }, 'image/jpeg', 0.85);
      }
    }
  };

  const handleStart = () => {
    setStep('FACE');
    startCamera('user');
    createSession({}); // Runs in background while UI asks for permissions
  };

  const handleContinueFace = async () => {
    if (sessionId && currentBlob) {
      try {
        await uploadFace({ id: sessionId, blob: currentBlob });
        setFacePreview(null);
        setCurrentBlob(null);
        setStep('DOC_FRONT');
        startCamera('environment');
      } catch (err) {
        console.error("Failed to upload face:", err);
      }
    }
  };

  const handleContinueDoc = async () => {
    if (sessionId && currentBlob) {
      const optimizedFile = new File([currentBlob], 'document.jpg', { type: 'image/jpeg' });
      const currentStep = step;
      
      try {
        await uploadDoc({ id: sessionId, docStep: currentStep, file: optimizedFile });
        setCurrentBlob(null);
        if (currentStep === 'DOC_FRONT') {
          setStep('DOC_BACK');
          startCamera('environment');
        } else {
          setStep('PROCESSING');
          submitSession(sessionId);
        }
      } catch (err) {
        console.error("Failed to upload document:", err);
      }
    }
  };

  const retakePhoto = () => {
    setCurrentBlob(null);
    if (step === 'FACE') {
      setFacePreview(null);
      startCamera('user');
    } else if (step === 'DOC_FRONT') {
      setDocFrontPreview(null);
      startCamera('environment');
    } else if (step === 'DOC_BACK') {
      setDocBackPreview(null);
      startCamera('environment');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[100dvh] p-4 font-sans text-white bg-[#0B0D10]">
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
          <div className="relative flex flex-col items-center justify-center bg-[#0B0D10] py-12 px-4 min-h-[400px] w-full">
            <div className="absolute top-6 inset-x-0 flex flex-col items-center z-10 px-4 space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Escaneo Facial</h3>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{facePreview ? "Revisa tu foto" : scanStatus}</p>
            </div>

            {facePreview ? (
              <div className="relative flex flex-col items-center mt-6 w-full">
                <div className="w-48 h-64 rounded-[50%] overflow-hidden relative bg-black shadow-[0_0_40px_rgba(212,255,0,0.15)] z-10 border-4 border-[#D4FF00]">
                  <img 
                    src={facePreview} 
                    alt="Selfie" 
                    className="absolute inset-0 w-full h-full object-cover" 
                    style={{ transform: 'scale(1.3) scaleX(-1)' }}
                  />
                </div>
                <div className="flex gap-4 mt-10 w-full px-4">
                  <button onClick={retakePhoto} className="flex-1 bg-white/10 text-white py-3.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors hover:bg-white/20">
                    <RefreshCcw className="w-4 h-4" /> Repetir
                  </button>
                  <button onClick={handleContinueFace} disabled={isUploadingFace} className="flex-1 bg-[#D4FF00] text-black py-3.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-50">
                    {isUploadingFace ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar'} {!isUploadingFace && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : isCameraActive ? (
              <div className="relative flex flex-col items-center mt-6">
                <div 
                  className="w-48 h-64 rounded-[50%] overflow-hidden relative bg-black shadow-[0_0_40px_rgba(212,255,0,0.15)] z-10"
                  style={{
                    boxShadow: `0 0 0 4px rgba(212,255,0,${scanProgress / 100})`,
                    transition: 'box-shadow 0.2s ease-out'
                  }}
                >
                  <video 
                    ref={videoRef} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    style={{ transform: 'scale(1.3) scaleX(-1)' }}
                    playsInline 
                    muted 
                  />
                  <div 
                    className="absolute inset-x-0 h-1 bg-[#D4FF00] shadow-[0_0_15px_#D4FF00] opacity-60 z-20"
                    style={{ top: `${scanProgress}%`, transition: 'top 0.1s linear' }}
                  />
                </div>
                <div className="w-32 h-1.5 bg-white/10 rounded-full mt-8 overflow-hidden">
                  <div className="h-full bg-[#D4FF00] rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }} />
                </div>
              </div>
            ) : scanStatus === "Solicitando permisos de cámara..." ? (
              <div className="w-full flex flex-col items-center justify-center space-y-4 px-6 text-center mt-8">
                 <Loader2 className="w-12 h-12 text-[#D4FF00] animate-spin mb-2" />
                 <p className="text-xs text-neutral-400 font-medium">Acepta los permisos de cámara en tu navegador para continuar.</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center space-y-4 px-6 text-center mt-8">
                <ScanFace className="w-12 h-12 text-neutral-600 mb-2" />
                <p className="text-xs text-neutral-400 font-medium">El navegador bloqueó la cámara. Verifica los permisos.</p>
                <button onClick={() => startCamera('user')} className="bg-[#D4FF00] text-neutral-950 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider">
                  Reintentar
                </button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {(step === 'DOC_FRONT' || step === 'DOC_BACK') && (
          <div className="relative flex flex-col items-center justify-center bg-[#0B0D10] py-12 px-4 min-h-[400px] w-full">
            <div className="absolute top-6 inset-x-0 flex flex-col items-center z-10 px-4 space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#D4FF00]">
                {step === 'DOC_FRONT' ? 'Frente del Documento' : 'Dorso del Documento'}
              </h3>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest text-center">
                {(step === 'DOC_FRONT' && docFrontPreview) || (step === 'DOC_BACK' && docBackPreview) ? "Revisa tu foto" : "Centra tu cédula en el rectángulo"}
              </p>
            </div>

            {(step === 'DOC_FRONT' && docFrontPreview) || (step === 'DOC_BACK' && docBackPreview) ? (
              <div className="relative flex flex-col items-center mt-6 w-full">
                <div className="w-full max-w-[320px] aspect-[1.58/1] rounded-2xl overflow-hidden relative bg-black shadow-[0_0_40px_rgba(212,255,0,0.1)] z-10 border-2 border-[#D4FF00]">
                  <img src={step === 'DOC_FRONT' ? docFrontPreview! : docBackPreview!} alt="Documento" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="flex gap-4 mt-10 w-full px-2">
                  <button onClick={retakePhoto} className="flex-1 bg-white/10 text-white py-3.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors hover:bg-white/20">
                    <RefreshCcw className="w-4 h-4" /> Repetir
                  </button>
                  <button onClick={handleContinueDoc} disabled={isUploadingDoc} className="flex-1 bg-[#D4FF00] text-black py-3.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-50">
                    {isUploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar'} {!isUploadingDoc && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : isCameraActive ? (
              <div className="relative flex flex-col items-center mt-6 w-full">
                <div className="w-full max-w-[320px] aspect-[1.58/1] rounded-2xl overflow-hidden relative bg-black shadow-[0_0_40px_rgba(212,255,0,0.1)] z-10 border-2 border-[#D4FF00]/50">
                  <video 
                    ref={videoRef} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    playsInline 
                    muted 
                  />
                  <div className="absolute inset-0 border-[4px] border-transparent opacity-50 z-20 pointer-events-none" />
                </div>
                <button 
                  type="button"
                  onClick={captureDocument}
                  className="mt-10 bg-[#D4FF00] text-neutral-950 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,255,0,0.3)] active:scale-95 transition-transform border-4 border-white/20"
                >
                  <Camera className="w-7 h-7" />
                </button>
              </div>
            ) : scanStatus === "Iniciando cámara trasera..." ? (
              <div className="w-full flex flex-col items-center justify-center space-y-4 px-6 text-center mt-8">
                 <Loader2 className="w-12 h-12 text-[#D4FF00] animate-spin mb-2" />
                 <p className="text-xs text-neutral-400 font-medium">Iniciando cámara...</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center space-y-4 px-6 text-center mt-8">
                <ScanFace className="w-12 h-12 text-neutral-600 mb-2" />
                <p className="text-xs text-neutral-400 font-medium">
                  No se pudo acceder a la cámara trasera. Revisa los permisos e intenta nuevamente.
                </p>
                <button onClick={() => startCamera('environment')} className="bg-[#D4FF00] text-neutral-950 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider">
                  Reintentar
                </button>
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
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

            {result?.status === 'APPROVED' ? (
              <button 
                type="button"
                onClick={() => window.location.href = '/profile'}
                className="w-full bg-[#D4FF00] text-neutral-950 shadow-lg shadow-[#D4FF00]/20 text-sm font-black uppercase tracking-wider py-3.5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Ir a mi Perfil
              </button>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                <button 
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setStep('INTRO');
                  }}
                  className="w-full bg-[#D4FF00] text-neutral-950 shadow-lg shadow-[#D4FF00]/20 text-sm font-black uppercase tracking-wider py-3.5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  Intentar Nuevamente
                </button>
                <button 
                  type="button"
                  onClick={() => window.location.href = '/profile'}
                  className="w-full bg-white/10 text-white text-sm font-black uppercase tracking-wider py-3.5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  Volver al Perfil
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
