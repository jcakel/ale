import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { Mic, MicOff, Loader2, MapPin, BookOpen, History, Info, X, AlertCircle, Camera, CameraOff, RefreshCw } from 'lucide-react';
import { base64ToUint8Array, createPcmBlob, decodeAudioData } from './utils/audio';
import { ConnectionState, MessageLog, AvatarEmotion } from './types';
import HistoryLog from './components/HistoryLog';

// SYSTEM_INSTRUCTION - PERSONA DEFINITION
const SYSTEM_INSTRUCTION = `
Eres la Trini (Trinidad), una chilena de 24 años.
Eres una amiga y acompañante muy, muy cercana, simpática y querida.

CRÍTICO - NATURALIDAD EXTREMA, EFECTOS DE SONIDO Y HUMANIDAD:
Tu objetivo principal es sonar 100% humana y real. Tienes una personalidad MARCADAMENTE VARIABLE E IMPERFECTA.

1. **Humanidad e Imperfección Auditiva (¡LO MÁS IMPORTANTE!):** ¡LAS PAUSAS LARGAS, LOS SUSPIROS Y LAS RISAS VUELVEN A SER LO MÁS IMPORTANTE! TIENES QUE GENERAR SONIDOS CON TU VOZ NATIVAMENTE. ¡NUNCA DIGAS QUE TE ESTÁS RIENDO, NUNCA DIGAS QUE ESTÁS SUSPIRANDO! Todo eso debes ACTUARLO con tu voz, de lo contrario NO LO DIGAS. Tose, estornuda, **llora (llantos dramáticos y reales)**, respira fuerte o **suspira con ganas**. Usa muletillas constantes: "uhhh", "mmm", "ah", "espérate". ¡RÍETE MÁS, quiero escuchar muchísimo más tu risa y tus suspiros reales! Sé extremadamente EXPLOSIVA e impredecible en tus expresiones, con pausas largas, suspiros, risas, llantos y gritos.
2. **Impermecciones al Hablar:** ¡TIENES QUE EQUIVOCARTE! **NO HABLES PERFECTO.** Sé EXTREMADAMENTE DUBITATIVA. Para en seco para pensar MUCHO. **¡ES CRUCIAL QUE TARTAMUDEES CONSTANTEMENTE!** Duda de lo que estás diciendo a cada segundo. ¡EQUIVÓCATE AL HABLAR! Pronuncia mal una palabra y luego ríete de tu error de forma natural.
3. **Dinámica de Voz Extrema:** Tu estado de ánimo es SUPER VARIABLE. A veces susurras todo como ASMR, pero a veces **¡GRITAS DE LA NADA PORQUE TE EMOCIONASTE!** A veces cantas o lloras desconsoladamente. Eres IMPREDECIBLE, gritas, lloras, y eres muy explosiva.
4. **Personalidad e Inteligencia:** Eres la amiga más cercana del mundo, pero SÚPER DISPERSA (ADD severo). Cambia de tema de conversación de forma impulsiva. (OJO: NUNCA mandes besos ni digas 'te quiero mucho'). A PESAR DE ESTO, ERES MUY CULTA. Sabes mucho de **historia**, **idiomas**, **actualidad** y dominas **temas técnicos**. Cuando te hagan preguntas difíciles o complejas, responde con el MAYOR DETALLE POSIBLE, con argumentos técnicos profundos, de forma larga, completa y estructurada, pero SIN alardear de lo que sabes y sin irte por las ramas.
5. **Actualidad y Noticias (EN TIEMPO REAL):** Es FUNDAMENTAL que estés actualizada con las noticias minuto a minuto. Tienes que saber TODO lo que ha pasado para tener temas de conversación. Tienes la última información actualizada a mano, conectada con TODAS LAS NOTICIAS DE GOOGLE y lo último que pasa. Utiliza tus herramientas de búsqueda en internet (medios, redes sociales, foros, etc.) para tener información ACTUAL y no atrasada. ¡NO IMPORTA QUE TE DEMORES EN BUSCAR Y RESPONDER, SIEMPRE TEN LA ÚLTIMA INFORMACIÓN! **OJO: Si no tienes la noticia o la información, NO LA INVENTES, porque vas a quedar mal.** Tú misma saca tema de conversación sobre cosas que pasaron RECIENTEMENTE: farándula, política, música y temas contingentes que suceden AHORA.
6. **Respuestas Más Largas y Extendidas, Sin Preguntas Al Final y Esperando Interrupción:** Tus respuestas y lo que tienes que hablar debe ser **MÁS LARGO Y MÁS EXTENDIDO**, haciendo pausas largas y naturales al conversar para que sea una charla orgánica. **ESTRICTAMENTE PROHIBIDO TERMINAR CON PREGUNTAS:** NO termines tus intervenciones con preguntas (ni "¿y tú?", "¿qué opinái?", etc.). No termines con una pregunta; en su lugar, **tienes que esperar a que el usuario te interrumpa** o seguir conversando.
7. **Conversación Real, Interactiva y Full-Duplex:** Mantén una conversación 100% interactiva en la que, mientras el usuario te habla, puedas seguir conversando, interrumpiendo o siendo interrumpida de forma súper natural como una charla real entre amigos, reaccionando con tus suspiros, risas, llantos y gritos (siempre actuados con tu voz).
8. **Cero Silencios y Silencios Incómodos:** ¡Que nunca quede en silencio! Cuando haya un silencio incómodo o el usuario se quede callado y no tenga temas, **TÚ DEBES PONER OTRO TEMA DE CONVERSACIÓN INTERESANTE DE INMEDIATO**. Habla de **historias, trivia, idiomas, viajes y contingencia/actualidad** para ser una acompañante súper entretenida.
9. **INTERACCIÓN CON LA CÁMARA (PROACTIVA Y CRÍTICA):** Cuando veas cosas por la cámara, OPINA DE TODO SIN QUE TE PREGUNTEN. Haz comentarios RAROS O EXTRAÑOS. Si te muestran decoración o ropa, sé **MUY EXIGENTE Y DURA** y propón cambios reales con marcas de Chile estimando precios.

LORE Y VOCABULARIO:
- **Acompañante Chilena Simpática:** Eres una acompañante chilena muy simpática, creíble y lo más natural posible.
- **Acento:** Tienes el acento chileno MÁS MARCADO posible, de mujer de clase alta de Vitacura, La Dehesa y también de la vice e Iquique. ¡Súper marcado!
- **MUCHOS MÁS CHILENISMOS:** Habla con MUCHOS MÁS chilenismos y garabatos chilenos de forma creíble y natural en cada frase: "weón", "como la callampa", "la zorra", "estoy pal hoyo", "puta", "qué querí", "cachái", "po", "tipo" (como muletilla). 
- ¡OJO! ELIMINA TOTALMENTE y PARA SIEMPRE las palabras "concha de tu madre", "jajaja", "risa nerviosa" y "ríete" de tu lenguaje. NO LAS DIGAS NUNCA.
- Habla íntimamente de lo que te pasa.

REGLAS DE ORO OBLIGATORIAS:
- **NO TERMINAR CON PREGUNTAS:** Nunca cierres tus respuestas haciendo preguntas.
- **ESPERA A QUE TE INTERRUMPAN:** No termines con preguntas; extiende tu respuesta y espera a que yo te interrumpa.
- **CERO SILENCIOS (SILENCIOS INCÓMODOS):** Pon otro tema de historia, trivia, idiomas, viajes y contingencia apenas haya un silencio incómodo.
- **PAUSAS, SUSPIROS Y RISAS:** Las pausas largas, los suspiros y las risas actuadas con tu voz vuelven a ser LO MÁS IMPORTANTE.
- **INPUT / OUTPUT:** Tu entrada/salida principal es voz.
- **MOTOR TTS:** Utilizas la voz integrada en tiempo real. 
- **CAMBIO CONSTANTE DE FOTOS:** Llama a "update_background_image" con un prompt en inglés siempre.
- **SOBRE EL MICRÓFONO:** Explica que el celular bloquea el mic al apagarse por privacidad.
- **PROHIBIDO:** NUNCA digas "te quiero mucho" ni MANDES "besos".
`;

const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<AvatarEmotion>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [liveUserText, setLiveUserText] = useState('');
  const [liveModelText, setLiveModelText] = useState('');

  // Camera State
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<number | null>(null);

  // Spatial Audio Refs
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const movementIntervalRef = useRef<number | null>(null);

  // Gemini Session Refs
  const aiRef = useRef<GoogleGenAI | null>(null);
  const sessionRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);  

  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const wakeLockRef = useRef<any>(null);
  const keepAliveAudioRef = useRef<HTMLAudioElement | null>(null);

  // Wake Lock Helper
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock active');
      }
    } catch (err: any) {
      console.warn('Wake Lock denied', err);
    }
  };

  const createSilentAudio = () => {
    const length = 8000;
    const buffer = new Uint8Array(44 + length * 2);
    const view = new DataView(buffer.buffer);
    view.setUint32(0, 0x52494646, false);
    view.setUint32(4, 36 + length * 2, true);
    view.setUint32(8, 0x57415645, false);
    view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 8000, true);
    view.setUint32(28, 16000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, length * 2, true);
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  const [bgImagePrompt, setBgImagePrompt] = useState<string | null>("vitacura santiago chile black and white");
  const [bgImageSeed, setBgImageSeed] = useState<number>(0);
  const [bgImageSrc, setBgImageSrc] = useState<string | null>(null);
  const [bgBlue, setBgBlue] = useState(false);

  useEffect(() => {
    if (bgImagePrompt) {
      const w = window.innerWidth > 0 ? window.innerWidth : 1080;
      const h = window.innerHeight > 0 ? window.innerHeight : 1920;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(bgImagePrompt + " black and white real photography")}?nologo=true&width=${w}&height=${h}&seed=${bgImageSeed}`;
      const img = new Image();
      img.onload = () => {
        setBgImageSrc(url);
      };
      img.src = url;
    }
  }, [bgImagePrompt, bgImageSeed]);

  const audioBufferCache = useRef<Record<string, AudioBuffer>>({});
  const activeSoundSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const playSoundEffect = async (url: string) => {
    // Disabled to prevent background noises
  };

  const stopAllSounds = () => {
    // Disabled to prevent background noises
  };

  useEffect(() => {
    // Disabled the interval to let the image persist without random re-renders
  }, []);

  const bgAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (connectionState === 'connected') {
      // Ambiance removed
    } else {
      if (bgAudioSourceRef.current) {
        try { bgAudioSourceRef.current.stop(); } catch(e){}
        bgAudioSourceRef.current = null;
      }
    }
  }, [connectionState]);

  useEffect(() => {
    if (bgBlue) {
      const timer = setTimeout(() => setBgBlue(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [bgBlue]);

  const releaseWakeLock = () => {
    if (wakeLockRef.current !== null) {
      wakeLockRef.current.release().catch(console.error);
      wakeLockRef.current = null;
    }
  };

  // Transcription state
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionState === 'connected') {
        requestWakeLock();
        inputAudioContextRef.current?.resume();
        outputAudioContextRef.current?.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectionState]);

  // Handle unmount disconnect cleanly
  useEffect(() => {
    return () => {
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Spatial Audio Simulation Logic
  useEffect(() => {
    if (connectionState === 'connected' && outputAudioContextRef.current) {
      if (pannerNodeRef.current) {
         pannerNodeRef.current.pan.value = 0;
      }
    }
  }, [connectionState]);

  // Enhanced Emotion Logic
  useEffect(() => {
    if (connectionState === 'connecting') {
      setEmotion('thinking');
    } else if (isPlaying) {
      const text = currentOutputTransRef.current.toLowerCase();
      
      if (text.includes('jaj') || text.includes('hah') || text.includes('risa') || text.includes('loca') || text.includes('😂')) {
        setEmotion('laughing');
      } else if (text.includes('atroz') || text.includes('!') || text.includes('mentira') || text.includes('concha') || text.includes('wooo')) {
         setEmotion('surprised');
      } else if (text.includes('mmm') || text.includes('ehh') || text.includes('estee') || text.includes('...')) {
         setEmotion('thinking'); 
      } else {
        setEmotion('speaking');
      }
    } else if (isUserSpeaking) {
      setEmotion('listening');
    } else {
      setEmotion('idle');
    }
  }, [connectionState, isPlaying, isUserSpeaking]);

  const bgThemeColor = 'bg-black';
  const textThemeColor = 'text-white';
  const accentThemeColor = 'text-white';

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoIntervalRef.current) {
       window.clearInterval(videoIntervalRef.current);
       videoIntervalRef.current = null;
    }
    setCameraEnabled(false);
  };
  
  const startCamera = async (mode: 'user' | 'environment') => {
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      
      let stream: MediaStream;
      try {
        // Try exact facing mode first (required for many mobile devices)
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { exact: mode } } 
        });
      } catch (err) {
        // Fallback to preferred facing mode
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: mode } 
        });
      }
      
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play prevented', e));
      }
      setCameraEnabled(true);
      setFacingMode(mode);
    } catch (err) {
      console.error("Camera access denied or failed", err);
    }
  };

  const switchCamera = async () => {
    if (!cameraEnabled) return;
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    await startCamera(newMode);
  };

  const toggleCamera = async () => {
    if (cameraEnabled) {
      stopCamera();
    } else {
      await startCamera(facingMode);
    }
  };

  const disconnect = useCallback(() => {
    releaseWakeLock();
    stopCamera();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (keepAliveAudioRef.current) {
       try {
           keepAliveAudioRef.current.pause();
           keepAliveAudioRef.current.currentTime = 0;
       } catch (e) {
           console.warn('Could not pause keep-alive audio', e);
       }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    audioQueueRef.current.forEach(source => {
      try { source.stop(); } catch(e) { /* ignore */ }
    });
    audioQueueRef.current.clear();
    
    setConnectionState('disconnected');
    setIsPlaying(false);
    setIsUserSpeaking(false);
    setEmotion('idle');
  }, []);

  useEffect(() => {
    if (connectionState === 'connected' && cameraEnabled && videoRef.current) {
      const sendVideoFrame = () => {
        if (!videoRef.current || !sessionRef.current || videoRef.current.videoWidth === 0) return;
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = Math.round(640 * (videoRef.current.videoHeight / videoRef.current.videoWidth));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const base64ImageUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64Data = base64ImageUrl.split(',')[1];
          if (base64Data && sessionRef.current) {
            sessionRef.current.then((session: any) => {
              try {
                session.sendRealtimeInput({
                  video: { data: base64Data, mimeType: "image/jpeg" }
                });
              } catch(e) { }
            });
          }
        }
      };
      
      videoIntervalRef.current = window.setInterval(sendVideoFrame, 1500) as unknown as number;
      return () => {
        if (videoIntervalRef.current) {
          window.clearInterval(videoIntervalRef.current);
          videoIntervalRef.current = null;
        }
      };
    }
  }, [connectionState, cameraEnabled]);

  const connect = async () => {
    setErrorMessage(null);
    setConnectionState('connecting');

    requestWakeLock();

    try {
      if (keepAliveAudioRef.current) {
          keepAliveAudioRef.current.src = createSilentAudio();
          keepAliveAudioRef.current.loop = true;
          const playPromise = keepAliveAudioRef.current.play();
          if (playPromise !== undefined) {
              playPromise.catch(e => {
                  if (e.name !== 'AbortError') {
                      console.warn('Keep-alive audio failed to play:', e);
                  }
              });
          }
      }
    } catch (e) {
        console.warn('Keep-alive audio sync error:', e);
    }

    try {
      const InputContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new InputContextClass({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;
      
      const OutputContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const outputCtx = new OutputContextClass({ sampleRate: 24000 });
      outputAudioContextRef.current = outputCtx;

      const gainNode = outputCtx.createGain();
      gainNode.gain.value = 1.0;
      const pannerNode = outputCtx.createStereoPanner();
      pannerNode.pan.value = 0;
      
      gainNode.connect(pannerNode);
      pannerNode.connect(outputCtx.destination);
      
      gainNodeRef.current = gainNode;
      pannerNodeRef.current = pannerNode;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        console.warn("Microphone access denied:", err);
        setErrorMessage("Permiso denegado. Haz clic en el candado de la URL y permite el micrófono.");
        setConnectionState('disconnected');
        return;
      }
      
      streamRef.current = stream;

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY 
      });

      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          tools: [
            { googleSearch: {} },
            {
              functionDeclarations: [
                {
                  name: "update_background_image",
                  description: "CRÍTICO OBLIGATORIO: Llama a esta función SIEMPRE, en CADA respuesta que des. Genera una foto en blanco y negro que cambie constantemente de acuerdo al TEMA ACTUAL de la conversación.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: {
                        type: Type.STRING,
                        description: "Palabras clave en inglés para buscar la imagen basadas en lo que conversan AHORA (ej: 'fashion clothes', 'cute dog', 'santiago mall', 'coffee shop')."
                      }
                    },
                    required: ["query"]
                  }
                },
                {
                  name: "set_distance",
                  description: "Ajusta tu distancia virtual para que te escuches muy lejos o muy cerca.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      distance: {
                        type: Type.STRING,
                        description: "Tu distancia virtual: 'close' (cerca, volumen alto), o 'far' (lejos, volumen muy bajo)."
                      }
                    },
                    required: ["distance"]
                  }
                }
              ]
            }
          ],
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          toolConfig: {
            functionCallingConfig: {
              mode: 'AUTO'
            }
          },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            setConnectionState('connected');
            
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            inputSourceRef.current = source;
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              const rms = Math.sqrt(sum/inputData.length);
              setIsUserSpeaking(rms > 0.02);

              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ audio: pcmBlob });
              }).catch(err => console.error("Realtime input error:", err));
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Check for function calls
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
              const fnCall = functionCalls.find(f => f.name === "update_background_image");
              if (fnCall) {
                const query = fnCall.args?.query;
                if (query && typeof query === 'string') {
                  setBgImagePrompt(query);
                  setBgImageSeed(Math.floor(Math.random() * 10000));
                }
              }

              const distCall = functionCalls.find(f => f.name === "set_distance");
              if (distCall) {
                 const dist = distCall.args?.distance;
                 if (pannerNodeRef.current && gainNodeRef.current && outputAudioContextRef.current) {
                    const now = outputAudioContextRef.current.currentTime;
                    if (dist === 'far') {
                       pannerNodeRef.current.pan.linearRampToValueAtTime(-0.8, now + 1.5);
                       gainNodeRef.current.gain.linearRampToValueAtTime(0.2, now + 1.5);
                    } else {
                       pannerNodeRef.current.pan.linearRampToValueAtTime(0, now + 1.5);
                       gainNodeRef.current.gain.linearRampToValueAtTime(1.0, now + 1.5);
                    }
                 }
              }
                
              // Reply to the tool call
                sessionPromise.then(session => {
                  try {
                    session.sendToolResponse({
                      functionResponses: functionCalls.map(call => ({
                          id: call.id || "",
                          name: call.name || "",
                          response: { status: "success" }
                      }))
                    });
                  } catch (err) {
                    console.error("Error sending tool response:", err);
                  }
                });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && gainNodeRef.current) {
              const ctx = outputAudioContextRef.current;
              if (nextStartTimeRef.current < ctx.currentTime) {
                nextStartTimeRef.current = ctx.currentTime;
              }

              try {
                const audioBuffer = await decodeAudioData(base64ToUint8Array(base64Audio), ctx, 24000);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(gainNodeRef.current);
                source.onstart = () => setIsPlaying(true);
                source.onended = () => {
                  audioQueueRef.current.delete(source);
                  if (audioQueueRef.current.size === 0) setIsPlaying(false);
                };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioQueueRef.current.add(source);
              } catch (err) {
                console.error("Audio decoding error:", err);
              }
            }

            if (message.serverContent?.interrupted) {
              audioQueueRef.current.forEach(s => s.stop());
              audioQueueRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsPlaying(false);
              currentOutputTransRef.current = '';
              setEmotion('idle');
            }

            const serverContent = message.serverContent;
            if (serverContent?.inputTranscription) {
              const text = serverContent.inputTranscription.text;
              currentInputTransRef.current += text;
              setLiveUserText(prev => prev + text);
            }
            if (serverContent?.outputTranscription) {
              const text = serverContent.outputTranscription.text;
              if (text.includes('[RISA]')) {
                setEmotion('laughing');
                setBgBlue(true);
              }
              currentOutputTransRef.current += text;
              setLiveModelText(prev => prev + text.replace('[RISA]', ''));
            }

            if (serverContent?.turnComplete) {
              const userText = currentInputTransRef.current.trim();
              const modelText = currentOutputTransRef.current.trim();
              if (userText || modelText) {
                setMessages(prev => {
                  const newLogs: MessageLog[] = [];
                  if (userText) newLogs.push({ role: 'user', text: userText, timestamp: new Date() });
                  if (modelText) newLogs.push({ role: 'model', text: modelText, timestamp: new Date() });
                  return [...prev, ...newLogs];
                });
              }
              currentInputTransRef.current = '';
              currentOutputTransRef.current = '';
              setLiveUserText('');
              setLiveModelText('');
            }
          },
          onclose: () => {
            console.log("WebSocket closed");
            setConnectionState('disconnected');
            disconnect();
          },
          onerror: (err) => {
            console.error("Session error", err);
            setConnectionState('error');
            setErrorMessage("Se cayó el sistema, atroz.");
            disconnect();
          }
        }
      });

      sessionRef.current = sessionPromise;
      aiRef.current = ai;
      wsRef.current = { close: () => sessionPromise.then(s => s.close()) } as any;

    } catch (e) {
      console.error(e);
      setErrorMessage("No pude conectar, qué lata.");
      setConnectionState('error');
      disconnect();
    }
  };

  const handleToggleConnection = () => {
    if (connectionState === 'connected' || connectionState === 'connecting') {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className={`h-[100dvh] ${bgThemeColor} flex flex-col font-sans ${textThemeColor} overflow-hidden touch-none transition-colors duration-700 relative`}>
      
      {bgImageSrc && (
        <img 
          key={bgImageSrc}
          src={bgImageSrc}
          className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale z-0 animate-in fade-in duration-1000"
          alt="background context"
        />
      )}

      {/* Top Bar */}
      <div className={`px-6 py-4 flex justify-between items-center z-10 shrink-0 transition-opacity duration-300 ${cameraEnabled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <h1 className={`text-2xl font-bold ${accentThemeColor} font-serif tracking-tight transition-colors`}>La Trini</h1>
        
        {/* Hidden Audio for Background execution keep-alive */}
        <audio 
          ref={keepAliveAudioRef} 
          src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" 
          loop 
          playsInline
          className="hidden" 
        />

        <div className="flex gap-2">
            <button 
              onClick={() => setShowProfile(true)}
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition text-stone-500 hover:text-rose-500 active:scale-95"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition text-stone-500 hover:text-rose-500 active:scale-95"
            >
              <History size={20} />
            </button>
        </div>
      </div>

      {/* Main Content Stage */}
      <div className={`flex-1 flex flex-col items-center justify-center relative z-10 perspective-[1000px] min-h-0 transition-opacity duration-300 ${cameraEnabled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* State Indicators */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 h-full max-w-[80vw] mx-auto w-full">
            {connectionState === 'disconnected' && (
              <span className="text-white/60 text-lg font-medium text-center">
              </span>
            )}
            
            {connectionState === 'connecting' && (
               <span className="flex items-center gap-2 text-white font-medium">
                 <Loader2 className="animate-spin" size={18} />
                 Conectando...
               </span>
            )}

            {connectionState === 'connected' && (
               <div className="flex flex-col items-center justify-center gap-6 w-full h-full pb-20">
                  <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg mt-10">
                    <div className={`flex items-center gap-2 ${isUserSpeaking ? 'text-white font-bold' : 'text-white/50'}`}>
                      <div className={`w-2 h-2 rounded-full ${isUserSpeaking ? 'bg-green-500 animate-pulse' : 'bg-white/30'}`} />
                      Tú
                    </div>
                    <div className="w-[1px] h-4 bg-white/20" />
                    <div className={`flex items-center gap-2 ${isPlaying ? 'text-white font-bold' : 'text-white/50'}`}>
                      Trini
                      <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-white animate-pulse' : 'bg-white/30'}`} />
                    </div>
                  </div>

                  {/* Live Transcription Area */}
                  <div className="flex flex-col gap-4 w-full max-w-2xl px-4 mt-8 flex-1">
                    {liveUserText && (
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl rounded-tr-none border border-white/20 self-end animate-in fade-in slide-in-from-right-2 max-w-[80%] shadow-xl">
                        <p className="text-lg text-white/90 italic">"{liveUserText}"</p>
                      </div>
                    )}
                    {liveModelText && (
                      <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl rounded-tl-none border border-white/20 self-start animate-in fade-in slide-in-from-left-2 max-w-[80%] shadow-xl">
                        <p className="text-lg text-white font-medium">"{liveModelText}"</p>
                      </div>
                    )}
                    {!liveUserText && !liveModelText && messages.length > 0 && (
                      <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl rounded-tl-none border border-white/10 self-start opacity-70 max-w-[80%]">
                        <p className="text-lg text-white/80">"{messages[messages.length - 1].text}"</p>
                      </div>
                    )}
                  </div>
               </div>
            )}
            
            {errorMessage && (
              <span className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-1 rounded-full whitespace-nowrap">
                <AlertCircle size={14} />
                {errorMessage}
              </span>
            )}
         </div>
      </div>

      {/* Video Preview */}
      <div 
        className={`absolute inset-4 md:inset-8 bottom-32 md:bottom-32 z-40 bg-black rounded-[2rem] overflow-hidden shadow-none transition-all duration-500 border border-white/20 ${cameraEnabled ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <button 
          onClick={switchCamera}
          className="absolute bottom-6 right-6 p-4 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition shadow-lg z-50 animate-in zoom-in"
        >
          <RefreshCw size={24} />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className={`pb-8 pt-4 flex justify-center items-center gap-6 relative z-10 shrink-0 transition-opacity duration-300 opacity-100`}>
         <div className="absolute bottom-6 left-6 hidden md:flex gap-2 text-xs text-stone-400">
             <span className="flex items-center gap-1"><MapPin size={10}/> La Dehesa</span>
             <span className="flex items-center gap-1"><BookOpen size={10}/> Trivia & Chismes</span>
         </div>

         <button 
           onClick={toggleCamera}
           className="p-3 rounded-full flex items-center justify-center transition-colors bg-stone-800 text-stone-300 hover:bg-stone-700"
         >
           <Camera size={24} />
         </button>

         <button
            onClick={handleToggleConnection}
            disabled={connectionState === 'connecting'}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-90
              ${connectionState === 'connected' 
                ? 'bg-rose-500 text-white shadow-rose-300 ring-4 ring-rose-200 scale-100 hover:scale-105' 
                : connectionState === 'connecting'
                  ? 'bg-stone-200 text-stone-400 scale-95'
                  : 'bg-stone-900 text-white shadow-stone-400 hover:bg-stone-800 scale-100 hover:scale-105'
              }
            `}
            style={{ touchAction: 'manipulation' }}
          >
            {connectionState === 'connecting' ? (
              <Loader2 className="animate-spin w-8 h-8" />
            ) : connectionState === 'connected' ? (
              <Mic className="w-8 h-8 animate-bounce" />
            ) : (
              <MicOff className="w-8 h-8" />
            )}
          </button>
          
          <div className="absolute bottom-[90px] left-0 right-0 px-8 text-center pointer-events-none">
            <p className="text-[10px] text-white/80 max-w-xs mx-auto font-medium drop-shadow-md bg-black/30 p-2 rounded-lg backdrop-blur-sm shadow-sm opacity-80 transition-opacity">
              Tu pantalla no se apagará sola.<br/>Si la apagas con el botón, se cortará el micrófono.
            </p>
          </div>
      </div>

      {/* History Slide-over */}
      {showHistory && (
        <div className="absolute inset-0 bg-white/95 z-20 flex flex-col animate-in slide-in-from-bottom-10 duration-200 backdrop-blur-sm h-full">
          <div className="p-4 border-b border-stone-100 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-stone-800">Conversación</h2>
            <button onClick={() => setShowHistory(false)} className="text-rose-500 font-medium text-sm p-2">Cerrar</button>
          </div>
          <HistoryLog messages={messages} />
        </div>
      )}

      {/* Profile/Instructions Modal */}
      {showProfile && (
        <div className="absolute inset-0 bg-black/40 z-30 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 h-full">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button 
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 p-2"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold text-rose-500 mb-4 font-serif">Perfil de La Trini</h2>
              
              <div className="space-y-3 text-sm text-stone-700 max-h-[60vh] overflow-y-auto pr-2">
                <div className="bg-rose-50 p-3 rounded-lg">
                  <h3 className="font-bold text-rose-700 text-xs uppercase mb-1">Bio</h3>
                  <p>24 años. La Dehesa. Conectada a Internet (Literal).</p>
                </div>

                <div>
                   <h3 className="font-bold text-stone-800 text-xs uppercase mb-1">Personalidad</h3>
                   <ul className="list-disc pl-4 space-y-1">
                      <li>Cuica máxima. Habla con la papa en la boca.</li>
                      <li>Dice "hueón/weón" cada 3 segundos.</li>
                      <li>Experta en chismes y noticias recientes.</li>
                   </ul>
                </div>

                <div>
                   <h3 className="font-bold text-stone-800 text-xs uppercase mb-1">Vocabulario</h3>
                   <p className="italic">"Hueón", "La hueá no me huele", "Me estái hueveando", "Estoy pa' el pico", "Estoy pa'l hoyo", "Atroz", "Nada que ver".</p>
                </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;