"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Message, Document } from "../page";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { ExpandedVoiceCall } from "./ExpandedVoiceCall";
import { useVAD } from "./vad";

interface VoiceChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onEndCall?: () => void;
  isBuddy?: boolean;
  documents?: Document[];
}

type CallState = "connected" | "listening" | "teacher-speaking";

/**
 * Convert Float32Array (16kHz mono) to WAV Blob for STT API
 */
function float32ToWav(samples: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (const sample of samples) {
    const s = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function VoiceChat({ messages, onSendMessage, onEndCall, isBuddy = false, documents = [] }: VoiceChatProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [callState, setCallState] = useState<CallState>("connected");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [continuousListening, setContinuousListening] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedMessageId = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const isGeneratingTTSRef = useRef(false);

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Interrupt TTS when user starts speaking
  const interruptTTS = useCallback(() => {
    if (audioRef.current && isPlayingAudio) {
      console.log("🔇 [VAD] Interrupting TTS - user started speaking");
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
      setIsLoadingAudio(false);
      setCallState("listening");
      isGeneratingTTSRef.current = false;
    }
  }, [isPlayingAudio]);

  // Process VAD audio and send to STT
  const processVadAudio = useCallback(async (audio: Float32Array) => {
    if (isProcessingRef.current) {
      console.log("🎤 [VAD] Already processing, skipping...");
      return;
    }
    
    isProcessingRef.current = true;
    const duration = (audio.length / 16000).toFixed(2);
    console.log(`🎤 [VAD] Processing speech (${audio.length} samples, ${duration}s)`);
    
    try {
      const wavBlob = float32ToWav(audio, 16000);
      console.log(`🎤 [VAD] Created WAV blob: ${wavBlob.size} bytes`);
      
      const formData = new FormData();
      formData.append("audio", wavBlob, "recording.wav");

      const response = await fetch("/api/study-agent/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const data = await response.json() as { text?: string };
      const transcribedText = data.text?.trim() ?? "";
      
      console.log("🎤 [VAD] Transcription:", transcribedText);
      
      if (transcribedText.length >= 2) {
        console.log("📤 [VAD] Sending message:", transcribedText);
        onSendMessage(transcribedText);
      } else {
        console.log("🎤 [VAD] Transcript too short, ignoring");
      }
    } catch (err) {
      console.error("❌ [VAD] Error processing audio:", err);
      setError("Failed to process speech");
      setTimeout(() => setError(null), 3000);
    } finally {
      isProcessingRef.current = false;
    }
  }, [onSendMessage]);

  // VAD hook - interrupts TTS on speech start
  const vad = useVAD({
    onSpeechStart: interruptTTS,
    onSpeechEnd: processVadAudio,
    onError: (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    },
  });

  // Handle ending the call
  const handleEndCall = () => {
    vad.stop();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (onEndCall) {
      onEndCall();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle mute toggle
  useEffect(() => {
    if (isMuted) {
      vad.stop();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else if (continuousListening && !isPlayingAudio && !isProcessingRef.current) {
      void vad.start();
    }
  }, [isMuted, continuousListening, isPlayingAudio, vad]);

  // Play AI voice responses using ElevenLabs TTS v3
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage && 
      (lastMessage.role === "teacher" || lastMessage.role === "buddy") && 
      !isMuted &&
      lastMessage.id !== lastPlayedMessageId.current &&
      !isPlayingAudio
    ) {
      // VAD stays running so it can detect user speech for interruption
      lastPlayedMessageId.current = lastMessage.id;
      const textToSpeak = lastMessage.ttsContent ?? lastMessage.content;
      void playTextToSpeech(textToSpeak);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isMuted, isPlayingAudio]);

  // Auto-start VAD when appropriate
  useEffect(() => {
    if (
      continuousListening &&
      !isMuted &&
      !isPlayingAudio &&
      !vad.isRunning &&
      !isProcessingRef.current &&
      messages.length > 0
    ) {
      const timer = setTimeout(() => {
        if (!isPlayingAudio && !isProcessingRef.current && continuousListening && !isMuted && !vad.isRunning) {
          console.log("🎤 [VoiceChat] Auto-starting VAD");
          void vad.start();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, continuousListening, isMuted, isPlayingAudio, vad]);

  // Check if browser supports MediaSource with audio/mpeg (Firefox doesn't)
  const canUseMediaSourceStreaming = (): boolean => {
    if (typeof window === "undefined") return false;
    
    const ua = navigator.userAgent;
    console.log("🔊 [VoiceChat] User agent:", ua);
    const isFirefox = ua.includes("Firefox");
    const isMac = ua.includes("Mac OS");
    
    // Firefox on macOS doesn't support audio/mpeg in MediaSource
    if (isFirefox && isMac) {
      console.log("🔊 [VoiceChat] Firefox/macOS detected - using blob playback");
      return false;
    }
    
    // Check if MediaSource supports audio/mpeg
    if (typeof MediaSource !== "undefined" && MediaSource.isTypeSupported("audio/mpeg")) {
      return true;
    }
    
    console.log("🔊 [VoiceChat] MediaSource audio/mpeg not supported - using blob playback");
    return false;
  };

  const playTextToSpeech = async (text: string) => {
    if (!text || text.trim().length === 0) {
      return;
    }

    // Prevent generating new audio if already playing or generating
    if (isPlayingAudio || isGeneratingTTSRef.current) {
      console.log("⚠️ [VoiceChat] Skipping TTS - audio already playing or generating");
      return;
    }

    // Log the text being converted to speech
    console.log("🔊 [VoiceChat] Converting text to speech:");
    console.log("   Text:", text);
    console.log("   Length:", text.length, "characters");
    
    // Mark that we're generating TTS
    isGeneratingTTSRef.current = true;
    
    try {
      setError(null);
      setCallState("teacher-speaking");
      setIsLoadingAudio(true);
      setIsPlayingAudio(true);

      // Stop any currently playing audio (safety check)
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Use ElevenLabs streaming TTS
      const response = await fetch("/api/study-agent/text-to-speech", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          modelId: "eleven_v3", // TODO: modify prompt so for device that can't use media source streaming, use the turbo model
          stability: 0.5,
          similarityBoost: 0.75,
          useSpeakerBoost: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        throw new Error(errorData.error ?? `Failed to generate speech: ${response.statusText}`);
      }

      // Helper to set up common audio event handlers
      const setupAudioHandlers = (audio: HTMLAudioElement, urlToRevoke: string) => {
        audio.onloadeddata = () => {
          setIsLoadingAudio(false);
        };

        audio.onended = () => {
          console.log("🔊 [VoiceChat] Audio playback ended");
          setIsPlayingAudio(false);
          setIsLoadingAudio(false);
          setCallState("connected");
          URL.revokeObjectURL(urlToRevoke);
          audioRef.current = null;
          isGeneratingTTSRef.current = false;
          
          if (continuousListening && !isMuted) {
            console.log("🎤 [VoiceChat] AI finished speaking, resuming VAD");
            setTimeout(() => {
              if (!isProcessingRef.current) {
                if (vad.isRunning) {
                  vad.resume();
                  setCallState("listening");
                } else {
                  void vad.start();
                }
              }
            }, 300);
          }
        };

        audio.onerror = (e) => {
          console.error("❌ [VoiceChat] Audio playback error:", e);
          setIsPlayingAudio(false);
          setIsLoadingAudio(false);
          setCallState("connected");
          setError("Failed to play audio");
          URL.revokeObjectURL(urlToRevoke);
          audioRef.current = null;
          isGeneratingTTSRef.current = false;
        };
      };

      // Use MediaSource streaming if supported, otherwise fall back to blob
      if (canUseMediaSourceStreaming()) {
        console.log("🔊 [VoiceChat] Using MediaSource streaming");
        // Play audio chunks as they stream in using MediaSource
        const mediaSource = new MediaSource();
        const audio = new Audio();
        audioRef.current = audio;
        
        const mediaSourceUrl = URL.createObjectURL(mediaSource);
        audio.src = mediaSourceUrl;
        setupAudioHandlers(audio, mediaSourceUrl);

        mediaSource.addEventListener("sourceopen", () => {
          void (async () => {
            try {
              const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
              const reader = response.body!.getReader();

              const pump = async (): Promise<void> => {
                const { done, value } = await reader.read();
                if (done) {
                  if (mediaSource.readyState === "open") {
                    mediaSource.endOfStream();
                  }
                  return;
                }
                
                // Wait for buffer to be ready before appending
                if (sourceBuffer.updating) {
                  await new Promise<void>(resolve => {
                    sourceBuffer.addEventListener("updateend", () => resolve(), { once: true });
                  });
                }
                
                sourceBuffer.appendBuffer(value);
                await new Promise<void>(resolve => {
                  sourceBuffer.addEventListener("updateend", () => resolve(), { once: true });
                });
                return pump();
              };

              await pump();
            } catch (err) {
              console.error("❌ [VoiceChat] Error streaming audio:", err);
              if (mediaSource.readyState === "open") {
                mediaSource.endOfStream("decode");
              }
            }
          })();
        });

        await audio.play();
      } else {
        // Fallback: Convert streamed response to blob and play
        console.log("🔊 [VoiceChat] Using blob playback");
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        setupAudioHandlers(audio, audioUrl);

        await audio.play();
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);
      setIsLoadingAudio(false);
      setCallState("connected");
      setError(error instanceof Error ? error.message : "Failed to generate speech");
      isGeneratingTTSRef.current = false; // Allow new TTS requests
      
      // Reset after showing error
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  // Start listening when AI finishes speaking (if continuous listening is enabled)
  // This is handled in audio.onended callback

  const handleMicPress = () => {
    if (isMuted) return;
    
    if (vad.isRunning) {
      console.log("🎤 [VoiceChat] User paused VAD");
      vad.stop();
      setContinuousListening(false);
    } else {
      console.log("🎤 [VoiceChat] User started VAD");
      setContinuousListening(true);
      if (!isPlayingAudio && !isProcessingRef.current) {
        void vad.start();
      }
    }
  };

  const displayCallState = isPlayingAudio 
    ? "speaking" 
    : vad.isRecording 
    ? "listening" 
    : (callState === "teacher-speaking" ? "speaking" : callState);

  return (
    <>
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 text-white p-4 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "30px 30px"
          }} />
        </div>

        <div className="relative z-10 space-y-4">
          {/* Top Row - Avatar & Info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${isBuddy ? "from-blue-200 to-blue-300" : "from-purple-200 to-purple-300"}`} />
                <span className="relative z-10 text-3xl">{isBuddy ? "🤝" : "🎓"}</span>
              </div>
              
              {/* Animated ring when speaking */}
              {displayCallState === "speaking" && (
                <div className="absolute inset-0 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg">{isBuddy ? "AI Study Buddy" : "AI Teacher"}</h3>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>{formatDuration(callDuration)}</span>
              </div>
            </div>

            {/* Transcript Button */}
            <button
              onClick={() => setShowTranscript(true)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all relative"
              title={`${messages.length} messages`}
            >
              <MessageSquare className="w-4 h-4 text-white" />
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </button>
          </div>

          {/* Status Indicator */}
          <div className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 text-center text-sm">
            {error && (
              <div className="flex items-center justify-center gap-2 text-red-200">
                <span>⚠️ {error}</span>
              </div>
            )}
            
            {!error && displayCallState === "listening" && (
              <div className="flex items-center justify-center gap-2">
                <Mic className="w-4 h-4 animate-pulse" />
                <span>Listening...</span>
              </div>
            )}
            
            {!error && displayCallState === "speaking" && (
              <div className="flex items-center justify-center gap-2">
                {isLoadingAudio ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating audio...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span>{isBuddy ? "Buddy" : "Teacher"} is speaking...</span>
                  </>
                )}
              </div>
            )}

            {!error && displayCallState === "connected" && !vad.isRecording && (
              <span className="text-white/90">
                {vad.isRunning 
                  ? "Ready to listen... (speak naturally)" 
                  : "Click mic to start"}
              </span>
            )}
          </div>

          {/* Mini Audio Visualizer */}
          {(displayCallState === "listening" || displayCallState === "speaking") && (
            <div className="flex items-center justify-center gap-0.5 h-8">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full ${
                    displayCallState === "listening" ? "bg-blue-300" : "bg-white"
                  }`}
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationName: "pulse",
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    animationTimingFunction: "ease-in-out",
                    animationIterationCount: "infinite",
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {/* Mute */}
            <button
              onClick={() => {
                setIsMuted(!isMuted);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/20 hover:bg-white/30 backdrop-blur-md"
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Microphone */}
            <button
              onClick={handleMicPress}
              disabled={isMuted}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                vad.isRecording
                  ? "bg-blue-500 hover:bg-blue-600 scale-110"
                  : isMuted
                  ? "bg-gray-400 cursor-not-allowed"
                  : vad.isRunning
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-white hover:bg-gray-100 active:scale-95"
              }`}
              title={vad.isRunning ? "Click to stop listening" : "Click to start listening"}
            >
              {vad.isRecording ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className={`w-5 h-5 ${isMuted ? "text-gray-600" : vad.isRunning ? "text-white" : "text-purple-600"}`} />
              )}
            </button>

            {/* End Call */}
            <button
              onClick={() => {
                if (confirm("End your tutoring session?")) {
                  handleEndCall();
                }
              }}
              className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Transcript Modal */}
      {showTranscript && (
        <ExpandedVoiceCall 
          messages={messages}
          isBuddy={isBuddy}
          documents={documents}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </>
  );
}