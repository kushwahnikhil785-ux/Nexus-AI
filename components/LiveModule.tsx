import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Wifi, Radio } from 'lucide-react';
import { ai, MODELS } from '../services/gemini';
import { LiveServerMessage, Modality } from '@google/genai';
import { Button, Card } from './UIComponents';

export const LiveModule: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState<string>("Ready to connect");
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Session & Playback Refs
  const sessionRef = useRef<any>(null); // To store the session object/promise
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Cleanup function
  const stopSession = async () => {
    if (sessionRef.current) {
        // Since there is no direct .close() on the promise wrapper in the prompt example,
        // we rely on closing the underlying logic or just disconnecting inputs.
        // However, standard WebSocket usage usually implies a close. 
        // We will just reset local state and stop tracks.
        try {
             // Try to close if the session object has a close method
             const session = await sessionRef.current;
             if (session && typeof session.close === 'function') {
                 session.close();
             }
        } catch (e) {
            console.error("Error closing session", e);
        }
        sessionRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop all playing sources
    sourcesRef.current.forEach(src => {
        try { src.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setIsConnected(false);
    setStatus("Disconnected");
    setVolume(0);
  };

  const startSession = async () => {
    try {
      setStatus("Initializing audio...");
      
      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      setStatus("Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      setStatus("Connecting to Gemini Live...");
      
      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        callbacks: {
          onopen: () => {
            console.log('Session opened');
            setStatus("Connected. Listening...");
            setIsConnected(true);

            // Start processing input audio
            const source = inputCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            // Note: ScriptProcessor is deprecated but required by the prompt instructions
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (isMuted) return; // Simple software mute
              
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for UI
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 10, 1)); // Scale for UI

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               if (outputCtx.state === 'suspended') {
                   await outputCtx.resume();
               }

               nextStartTimeRef.current = Math.max(
                   nextStartTimeRef.current,
                   outputCtx.currentTime
               );

               const audioBuffer = await decodeAudioData(
                   decode(base64Audio),
                   outputCtx,
                   24000,
                   1
               );

               const source = outputCtx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode);
               source.addEventListener('ended', () => {
                   sourcesRef.current.delete(source);
               });
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
                console.log("Interrupted");
                sourcesRef.current.forEach(src => {
                    try { src.stop(); } catch(e) {}
                    sourcesRef.current.delete(src);
                });
                nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Session closed");
            stopSession();
          },
          onerror: (err) => {
            console.error("Session error", err);
            setStatus("Error: " + err);
            stopSession();
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: "You are a helpful, witty, and concise AI assistant. Keep responses relatively short for a good conversation flow."
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start session:", err);
      setStatus("Failed to connect");
      stopSession();
    }
  };

  // Helper functions from prompt
  function createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    const uint8 = new Uint8Array(int16.buffer);
    const binary = encode(uint8); // Reuse encode helper
    
    return {
        data: binary,
        mimeType: 'audio/pcm;rate=16000'
    };
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
       <Card className="max-w-md w-full p-8 text-center flex flex-col items-center gap-6 border-slate-700 bg-surface/50 backdrop-blur">
          <div className="relative">
             <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isConnected ? 'bg-primary/20 shadow-[0_0_50px_rgba(99,102,241,0.3)]' : 'bg-slate-800'}`}>
                {isConnected ? (
                   <div className="relative">
                      {/* Audio visualizer rings */}
                      <div className="absolute inset-0 rounded-full border border-primary/50 animate-[ping_1.5s_ease-in-out_infinite]" style={{ transform: `scale(${1 + volume})` }}></div>
                      <div className="absolute inset-0 rounded-full border border-accent/30 animate-[ping_2s_ease-in-out_infinite] delay-75"></div>
                      <Radio size={48} className="text-primary relative z-10" />
                   </div>
                ) : (
                   <MicOff size={48} className="text-slate-500" />
                )}
             </div>
             {isConnected && <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-[10px] text-black px-2 py-0.5 rounded-full font-bold">LIVE</div>}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Gemini Live</h2>
            <p className="text-slate-400 text-sm h-6">{status}</p>
          </div>

          <div className="flex gap-4 w-full">
            {!isConnected ? (
              <Button onClick={startSession} className="w-full py-6 text-lg" icon={<Wifi size={20} />}>
                 Connect
              </Button>
            ) : (
              <>
                 <Button 
                   onClick={() => setIsMuted(!isMuted)} 
                   variant={isMuted ? 'danger' : 'secondary'} 
                   className="flex-1"
                 >
                   {isMuted ? <MicOff /> : <Mic />}
                 </Button>
                 <Button 
                   onClick={stopSession} 
                   variant="danger" 
                   className="flex-[2]"
                 >
                   Disconnect
                 </Button>
              </>
            )}
          </div>

          <div className="text-xs text-slate-600">
             Uses Gemini 2.5 Flash Native Audio.
          </div>
       </Card>
    </div>
  );
};
