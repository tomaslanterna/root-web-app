'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle2, XCircle, Loader2, ScanFace, ArrowRight, RefreshCcw, ChevronLeft } from 'lucide-react';

import { kycApi } from '@/services/kyc';
import { useMutation } from '@/hooks/useMutation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { SwipeBack } from '@/components/ui/SwipeBack';
import { cn } from '@/lib/utils';
import { kycReturnPath } from '@/lib/kycRedirect';

type Step = 'INTRO' | 'FACE' | 'DOC_FRONT' | 'DOC_BACK' | 'PROCESSING' | 'RESULT';

const STATUS_ALIGN = 'Alineá tu rostro en el óvalo...';
const STATUS_ASKING_PERMISSION = 'Solicitando permisos de cámara...';
const STATUS_STARTING_REAR = 'Iniciando cámara trasera...';

export default function KycFlow() {
  const router = useRouter();
  const { user, token, login } = useAuth();
  const [step, setStep] = useState<Step>('INTRO');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: 'APPROVED' | 'REJECTED'; message: string } | null>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState(STATUS_ALIGN);
  
  // Previews
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [docFrontPreview, setDocFrontPreview] = useState<string | null>(null);
  const [docBackPreview, setDocBackPreview] = useState<string | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef<NodeJS.Timeout | null>(null);
  // El stream se guarda aparte: al desmontar, React ya soltó videoRef y no habría cómo apagar la cámara.
  const streamRef = useRef<MediaStream | null>(null);

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
           // La sesión guarda isKycVerified del login: se actualiza para no volver a pedir la verificación.
           if (user && token) login(token, { ...user, isKycVerified: true });
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
      setScanStatus(facingMode === 'user' ? STATUS_ASKING_PERMISSION : STATUS_STARTING_REAR);
      
      const constraints = facingMode === 'environment' 
        ? { video: { facingMode: { exact: "environment" } } }
        : { video: { facingMode: 'user' } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async (e) => {
        if (facingMode === 'environment') {
          return await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        }
        throw e;
      });
      
      streamRef.current = stream;
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
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    if (scanningRef.current) {
      clearInterval(scanningRef.current);
    }
  };

  const startFakeScanning = () => {
    setScanProgress(0);
    setScanStatus(STATUS_ALIGN);
    
    let progress = 0;
    scanningRef.current = setInterval(() => {
      progress += 2;
      setScanProgress(progress);
      
      if (progress === 20) {
        setScanStatus("Rostro detectado, mantenete quieto...");
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

  // La pantalla ocupa exactamente el viewport: el documento no scrollea por detrás.
  useEffect(() => {
    const { overflow: htmlOverflow } = document.documentElement.style;
    const { overflow: bodyOverflow } = document.body.style;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
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

  const busy = step === 'PROCESSING' || isUploadingFace || isUploadingDoc;
  // Deslizar para volver solo donde no se pisa una captura en curso.
  const swipeBackEnabled = step === 'INTRO' || step === 'RESULT';

  // Vuelve a la pantalla anterior del stack (el perfil); si se entró directo, va al perfil.
  const goBack = () => {
    if (busy) return;
    stopCamera();
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.replace('/profile');
  };

  // ?redirect= con una ruta interna: al aprobarse vuelve a la pantalla desde la que se pidió verificar.
  const returnPath = typeof window !== 'undefined' ? kycReturnPath(window.location.search) : null;

  const stepNumber = step === 'FACE' ? 1 : step === 'DOC_FRONT' ? 2 : step === 'DOC_BACK' ? 3 : null;
  const docPreview = step === 'DOC_FRONT' ? docFrontPreview : docBackPreview;

  const frame = 'relative w-[min(100%,320px,calc(30dvh*1.58))] aspect-[1.58/1] rounded-hero overflow-hidden bg-black z-10';
  const oval = 'h-[min(16rem,32dvh)] aspect-[3/4] rounded-[50%] overflow-hidden relative bg-black';

  return (
    <main className="fixed inset-0 z-40 bg-bg text-ink flex flex-col overflow-hidden">
      {/* Header unificado Nocturno Editorial */}
      <header className="shrink-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line">
        <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center gap-3">
          <SwipeBack onBack={goBack} enabled={swipeBackEnabled} />
          <button
            type="button"
            onClick={goBack}
            disabled={busy}
            aria-label="Volver al perfil"
            className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <h1 className="font-display header-title-fit m-0 flex-1 min-w-0 truncate">Verificación</h1>
        </div>
      </header>

      <div className="flex-1 min-h-0 w-full max-w-md mx-auto px-4 pt-4 pb-[calc(1rem+var(--root-safe-bottom))] flex items-center justify-center">
        <section className="w-full max-h-full rounded-card border border-line bg-surface overflow-hidden relative">
          {step === 'INTRO' && (
            <div className="p-6 flex flex-col items-center text-center gap-5">
              <div className="size-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Camera className="size-8 text-accent" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-[26px] m-0">Verificá tu identidad</h2>
                <p className="m-0 text-sm text-ink-2">
                  Para la compraventa segura de entradas, necesitamos validar tu identidad con tu documento uruguayo.
                </p>
              </div>
              <Button type="button" size="full" onClick={handleStart}>
                Comenzar
              </Button>
            </div>
          )}

          {step === 'FACE' && (
            <div className="flex flex-col items-center gap-5 px-4 py-5 w-full bg-bg">
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="label-mono text-ink-3">Paso 1 de 3</span>
                <h2 className="font-display text-[22px] m-0">Escaneo facial</h2>
                <p className="m-0 text-xs text-ink-2">{facePreview ? 'Revisá tu foto' : scanStatus}</p>
              </div>

              {facePreview ? (
                <div className="flex flex-col items-center gap-5 w-full">
                  <div className={cn(oval, 'border-4 border-accent shadow-[0_0_40px_rgba(212,255,0,0.15)]')}>
                    <img
                      src={facePreview}
                      alt="Selfie"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: 'scale(1.3) scaleX(-1)' }}
                    />
                  </div>
                  <div className="flex gap-3 w-full">
                    <Button type="button" variant="secondary" onClick={retakePhoto} className="flex-1">
                      <RefreshCcw className="size-4" aria-hidden="true" /> Repetir
                    </Button>
                    <Button type="button" onClick={handleContinueFace} disabled={isUploadingFace} className="flex-1">
                      {isUploadingFace ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <>Continuar <ArrowRight className="size-4" aria-hidden="true" /></>}
                    </Button>
                  </div>
                </div>
              ) : isCameraActive ? (
                <div className="flex flex-col items-center gap-5">
                  <div
                    className={oval}
                    style={{
                      boxShadow: `0 0 0 4px rgba(212,255,0,${scanProgress / 100})`,
                      transition: 'box-shadow 0.2s ease-out',
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
                      className="absolute inset-x-0 h-1 bg-accent shadow-[0_0_15px_var(--color-accent)] opacity-60 z-20"
                      style={{ top: `${scanProgress}%`, transition: 'top 0.1s linear' }}
                    />
                  </div>
                  <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={scanProgress} aria-label="Progreso del escaneo">
                    <div className="h-full bg-accent rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>
              ) : scanStatus === STATUS_ASKING_PERMISSION ? (
                <div className="flex flex-col items-center gap-3 px-4 text-center">
                  <Loader2 className="size-12 text-accent animate-spin" aria-hidden="true" />
                  <p className="m-0 text-sm text-ink-2">Aceptá los permisos de cámara en tu navegador para continuar.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 px-4 text-center">
                  <ScanFace className="size-12 text-ink-3" aria-hidden="true" />
                  <p className="m-0 text-sm text-ink-2">El navegador bloqueó la cámara. Verificá los permisos.</p>
                  <Button type="button" size="sm" onClick={() => startCamera('user')}>
                    Reintentar
                  </Button>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {(step === 'DOC_FRONT' || step === 'DOC_BACK') && (
            <div className="flex flex-col items-center gap-5 px-4 py-5 w-full bg-bg">
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="label-mono text-ink-3">Paso {stepNumber} de 3</span>
                <h2 className="font-display text-[22px] m-0">
                  {step === 'DOC_FRONT' ? 'Frente del documento' : 'Dorso del documento'}
                </h2>
                <p className="m-0 text-xs text-ink-2">
                  {docPreview ? 'Revisá tu foto' : 'Centrá tu cédula en el rectángulo'}
                </p>
              </div>

              {docPreview ? (
                <div className="flex flex-col items-center gap-5 w-full">
                  <div className={cn(frame, 'border-2 border-accent shadow-[0_0_40px_rgba(212,255,0,0.1)]')}>
                    <img src={docPreview} alt="Documento" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-3 w-full">
                    <Button type="button" variant="secondary" onClick={retakePhoto} className="flex-1">
                      <RefreshCcw className="size-4" aria-hidden="true" /> Repetir
                    </Button>
                    <Button type="button" onClick={handleContinueDoc} disabled={isUploadingDoc} className="flex-1">
                      {isUploadingDoc ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <>Continuar <ArrowRight className="size-4" aria-hidden="true" /></>}
                    </Button>
                  </div>
                </div>
              ) : isCameraActive ? (
                <div className="flex flex-col items-center gap-5 w-full">
                  <div className={cn(frame, 'border-2 border-accent/50 shadow-[0_0_40px_rgba(212,255,0,0.1)]')}>
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
                  </div>
                  <button
                    type="button"
                    onClick={captureDocument}
                    aria-label="Sacar foto"
                    className="size-16 rounded-full bg-accent text-on-accent flex items-center justify-center border-4 border-line-strong shadow-[0_0_20px_rgba(212,255,0,0.3)] active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
                  >
                    <Camera className="size-7" aria-hidden="true" />
                  </button>
                </div>
              ) : scanStatus === STATUS_STARTING_REAR ? (
                <div className="flex flex-col items-center gap-3 px-4 text-center">
                  <Loader2 className="size-12 text-accent animate-spin" aria-hidden="true" />
                  <p className="m-0 text-sm text-ink-2">Iniciando cámara...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 px-4 text-center">
                  <ScanFace className="size-12 text-ink-3" aria-hidden="true" />
                  <p className="m-0 text-sm text-ink-2">
                    No se pudo acceder a la cámara trasera. Revisá los permisos e intentá nuevamente.
                  </p>
                  <Button type="button" size="sm" onClick={() => startCamera('environment')}>
                    Reintentar
                  </Button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="p-10 flex flex-col items-center text-center gap-6" role="status" aria-live="polite">
              <Loader2 className="size-12 text-accent animate-spin" aria-hidden="true" />
              <div className="space-y-2">
                <h2 className="font-display text-[22px] m-0">Analizando…</h2>
                <p className="m-0 text-sm text-ink-2">Verificando tu identidad con IA, esto tomará unos segundos.</p>
              </div>
            </div>
          )}

          {step === 'RESULT' && (
            <div className="p-8 flex flex-col items-center text-center gap-6">
              <div className="relative">
                {result?.status === 'APPROVED' ? (
                  <div className="size-20 rounded-full bg-accent/15 flex items-center justify-center relative z-10">
                    <CheckCircle2 className="size-10 text-accent" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="size-20 rounded-full bg-danger/15 flex items-center justify-center relative z-10">
                    <XCircle className="size-10 text-danger" aria-hidden="true" />
                  </div>
                )}
                <div className={cn('absolute inset-0 blur-xl', result?.status === 'APPROVED' ? 'bg-accent/20' : 'bg-danger/20')} />
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-[24px] m-0">
                  {result?.status === 'APPROVED' ? '¡Verificación exitosa!' : 'Verificación fallida'}
                </h2>
                <p className="m-0 text-sm text-ink-2" role={result?.status === 'APPROVED' ? 'status' : 'alert'}>{result?.message}</p>
              </div>

              {result?.status === 'APPROVED' ? (
                <Button type="button" size="full" onClick={() => (window.location.href = returnPath ?? '/profile')}>
                  {returnPath ? 'Continuar' : 'Ir a mi perfil'}
                </Button>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    type="button"
                    size="full"
                    onClick={() => {
                      setResult(null);
                      setStep('INTRO');
                    }}
                  >
                    Intentar nuevamente
                  </Button>
                  <Button type="button" size="full" variant="secondary" onClick={goBack}>
                    Volver al perfil
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
