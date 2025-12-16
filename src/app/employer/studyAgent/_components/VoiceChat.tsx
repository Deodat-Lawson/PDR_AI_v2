import { useState, useRef, useEffect } from "react";
import type { Message, Document } from "../page";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { ExpandedVoiceCall } from "./ExpandedVoiceCall";

interface VoiceChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onEndCall?: () => void;
  isBuddy?: boolean;
  documents?: Document[];
}

type CallState = "connected" | "listening" | "teacher-speaking";

export function VoiceChat({ messages, onSendMessage, onEndCall, isBuddy = false, documents = [] }: VoiceChatProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [callState, setCallState] = useState<CallState>("connected");
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [, setCurrentTranscript] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [continuousListening, setContinuousListening] = useState(true); // Auto-listen mode
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastPlayedMessageId = useRef<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const voiceActivityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const isGeneratingTTSRef = useRef(false); // Prevent duplicate TTS requests

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

  // Handle ending the call - cleanup and notify parent
  const handleEndCall = () => {
    // Stop any ongoing recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    // Clear timers
    if (voiceActivityCheckRef.current) {
      clearTimeout(voiceActivityCheckRef.current);
      voiceActivityCheckRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Notify parent component
    if (onEndCall) {
      onEndCall();
    }
  };

  // Speech-to-text using OpenAI Whisper (via MediaRecorder)
  const processAudioForSTT = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      console.log("🎤 [VoiceChat] Sending audio for transcription, size:", audioBlob.size, "bytes");

      const response = await fetch("/api/study-agent/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const data = await response.json() as { text?: string };
      const transcribedText: string = data.text ?? "";
      
      // Log the transcribed text
      console.log("🎤 [VoiceChat] Received transcription:");
      console.log("   Text:", transcribedText);
      console.log("   Length:", transcribedText.length, "characters");
      
      return transcribedText;
    } catch (error) {
      console.error("❌ [VoiceChat] Error transcribing audio:", error);
      return "";
    }
  };

  // Real-time voice activity detection using Web Audio API
  const setupVoiceActivityDetection = (stream: MediaStream, mediaRecorder: MediaRecorder) => {
    // Create audio context for voice activity detection
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;
    
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let speechDetected = false;
    let speechStartTime = 0;
    let recordingStarted = false;
    const SPEECH_THRESHOLD = 30; // Volume threshold (0-255)
    const MIN_SPEECH_DURATION = 500; // Minimum 500ms of speech before processing
    const SILENCE_DURATION = 800; // Wait 800ms of silence before processing
    
    // Check for voice activity every 100ms
    const checkVoiceActivity = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      
      if (average > SPEECH_THRESHOLD) {
        // Speech detected
        if (!speechDetected) {
          speechDetected = true;
          speechStartTime = Date.now();
          
          // Start recording immediately when speech is detected
          if (!recordingStarted && mediaRecorder.state === "inactive") {
            console.log("🎤 [VoiceChat] Speech detected! Starting recording immediately...");
            audioChunksRef.current = []; // Reset chunks
            mediaRecorder.start();
            recordingStarted = true;
          }
        }
      } else {
        // Silence detected
        if (speechDetected && recordingStarted) {
          const speechDuration = Date.now() - speechStartTime;
          if (speechDuration >= MIN_SPEECH_DURATION) {
            // Speech was long enough, wait for silence duration then process
            speechDetected = false;
            console.log("🎤 [VoiceChat] Speech ended, waiting for silence...");
            
            // Wait for silence duration, then stop and process
            setTimeout(() => {
              if (mediaRecorder.state === "recording") {
                console.log("🎤 [VoiceChat] Processing audio immediately...");
                mediaRecorder.stop();
                recordingStarted = false;
              }
            }, SILENCE_DURATION);
          } else {
            // Too short, ignore
            speechDetected = false;
          }
        }
      }
      
      if (isRecording) {
        voiceActivityCheckRef.current = setTimeout(checkVoiceActivity, 100);
      }
    };
    
    checkVoiceActivity();
  };

  // Start continuous listening mode with real-time voice activity detection
  // Note: Intentionally not using useCallback as the function needs current closure values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startContinuousListening = async () => {
    if (isMuted || isRecording || isProcessingRef.current || isPlayingAudio) {
      console.log("🎤 [VoiceChat] Cannot start listening:", {
        isMuted,
        isRecording,
        isProcessing: isProcessingRef.current,
        isPlayingAudio
      });
      return;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;
      
      setIsRecording(true);
      setCallState("listening");
      setCurrentTranscript("");
      isProcessingRef.current = false;

      // Record audio in chunks (will start when speech is detected)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup voice activity detection (will start recording when speech detected)
      setupVoiceActivityDetection(stream, mediaRecorder);

      let accumulatedTranscript = "";
      let messageSent = false; // Flag to prevent double-sending
      const MIN_SPEECH_LENGTH = 3; // Minimum characters to send

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Clear voice activity detection
        if (voiceActivityCheckRef.current) {
          clearTimeout(voiceActivityCheckRef.current);
          voiceActivityCheckRef.current = null;
        }
        
        // Process audio immediately when recording stops (speech ended)
        if (!messageSent && audioChunksRef.current.length > 0 && !isProcessingRef.current) {
          isProcessingRef.current = true;
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          
          console.log("🎤 [VoiceChat] Processing audio chunk:", audioBlob.size, "bytes");
          
          try {
            const transcript = await processAudioForSTT(audioBlob);
            
            if (transcript.trim().length >= MIN_SPEECH_LENGTH) {
              const trimmedTranscript = transcript.trim();
              const finalTranscript = accumulatedTranscript 
                ? `${accumulatedTranscript} ${trimmedTranscript}`
                : trimmedTranscript;
              
              const messageToSend = finalTranscript.trim();
              console.log("📤 [VoiceChat] Sending message immediately after speech:");
              console.log("   Message:", messageToSend);
              console.log("   Length:", messageToSend.length, "characters");
              
              messageSent = true;
              accumulatedTranscript = "";
              setCurrentTranscript("");
              
              // Send the message immediately
              onSendMessage(messageToSend);
              
              // Listening will resume automatically after AI responds (via audio.onended)
            } else {
              // Very short or empty transcript, continue listening
              console.log("🎤 [VoiceChat] Transcript too short, continuing to listen...");
              audioChunksRef.current = [];
              accumulatedTranscript = "";
              
              // Resume listening if still in listening mode (recording will start when speech detected)
              if (isRecording && !isPlayingAudio && !isMuted && streamRef.current) {
                setTimeout(() => {
                  if (streamRef.current && !mediaRecorderRef.current) {
                    const newRecorder = new MediaRecorder(streamRef.current, {
                      mimeType: "audio/webm;codecs=opus",
                    });
                    mediaRecorderRef.current = newRecorder;
                    newRecorder.ondataavailable = (event) => {
                      if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                      }
                    };
                    setupVoiceActivityDetection(streamRef.current, newRecorder);
                  }
                }, 300);
              }
            }
          } catch (error) {
            console.error("Error processing audio:", error);
          }
          
          isProcessingRef.current = false;
          messageSent = false;
        }
        
        setIsRecording(false);
        setCallState("connected");
      };

      // Start recording
      mediaRecorder.start();

    } catch (error) {
      console.error("Error starting continuous listening:", error);
      setIsRecording(false);
      setCallState("connected");
      isProcessingRef.current = false;
    }
  };

  // Stop continuous listening
  const stopContinuousListening = () => {
    // Stop voice activity detection
    if (voiceActivityCheckRef.current) {
      clearTimeout(voiceActivityCheckRef.current);
      voiceActivityCheckRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    setCallState("connected");
    isProcessingRef.current = false;
  };

  // Play AI voice responses using ElevenLabs TTS v3
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    // Only play if it's a new AI message and not muted
    if (
      lastMessage && 
      (lastMessage.role === "teacher" || lastMessage.role === "buddy") && 
      !isMuted &&
      lastMessage.id !== lastPlayedMessageId.current &&
      !isPlayingAudio
    ) {
      // Stop listening when AI is about to speak
      if (isRecording) {
        console.log("🔊 [VoiceChat] Stopping listening - AI is about to speak");
        stopContinuousListening();
      }
      
      lastPlayedMessageId.current = lastMessage.id;
      // Use ttsContent if available (includes emotion tags), otherwise use content
      const textToSpeak = lastMessage.ttsContent ?? lastMessage.content;
      void playTextToSpeech(textToSpeak);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit isRecording and playTextToSpeech to avoid infinite loops
  }, [messages, isMuted, isPlayingAudio]);

  // Auto-start continuous listening when component mounts or when appropriate
  useEffect(() => {
    // Auto-start listening if:
    // 1. Continuous listening is enabled
    // 2. Not muted
    // 3. Not already recording
    // 4. Not currently playing audio
    // 5. We have at least one message (introduction)
    if (
      continuousListening &&
      !isMuted &&
      !isRecording &&
      !isPlayingAudio &&
      !isProcessingRef.current &&
      messages.length > 0
    ) {
      // Small delay to ensure component is fully mounted and audio has finished
      const timer = setTimeout(() => {
        if (!isRecording && !isPlayingAudio && !isProcessingRef.current && continuousListening && !isMuted) {
          console.log("🎤 [VoiceChat] Auto-starting continuous listening");
          startContinuousListening().catch((error) => {
            console.error("Error auto-starting listening:", error);
          });
        }
      }, 1500); // Wait for introduction audio to potentially finish
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startContinuousListening intentionally not wrapped in useCallback to avoid stale closures
  }, [messages.length, continuousListening, isMuted, isRecording, isPlayingAudio]);

  // Check if browser supports MediaSource with audio/mpeg (Firefox doesn't)
  const useMediaSourceStreaming = (): boolean => {
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
          modelId: "eleven_v3", // Fast model for real-time
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
          
          // Auto-start listening after AI finishes speaking
          if (continuousListening && !isMuted && !isRecording) {
            console.log("🎤 [VoiceChat] AI finished speaking, auto-starting listening");
            setTimeout(() => {
              if (!isRecording && !isProcessingRef.current && !isPlayingAudio) {
                void startContinuousListening();
              }
            }, 500);
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
      if (useMediaSourceStreaming()) {
        console.log("🔊 [VoiceChat] Using MediaSource streaming");
        // Play audio chunks as they stream in using MediaSource
        const mediaSource = new MediaSource();
        const audio = new Audio();
        audioRef.current = audio;
        
        const mediaSourceUrl = URL.createObjectURL(mediaSource);
        audio.src = mediaSourceUrl;
        setupAudioHandlers(audio, mediaSourceUrl);

        mediaSource.addEventListener("sourceopen", async () => {
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

  const handleMicPress = async () => {
    if (isMuted) return;
    
    if (isRecording) {
      // Stop recording if already recording (pause mode)
      console.log("🎤 [VoiceChat] User paused listening");
      stopContinuousListening();
      setContinuousListening(false);
    } else {
      // Start/resume continuous listening
      console.log("🎤 [VoiceChat] User resumed listening");
      setContinuousListening(true);
      if (!isPlayingAudio && !isProcessingRef.current) {
        void startContinuousListening();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
      }
    };
  }, []);

  const displayCallState = isPlayingAudio ? "speaking" : (callState === "teacher-speaking" ? "speaking" : callState);

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

            {!error && displayCallState === "connected" && !isRecording && (
              <span className="text-white/90">
                {continuousListening 
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
              onClick={() => setIsMuted(!isMuted)}
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
                isRecording
                  ? "bg-blue-500 hover:bg-blue-600 scale-110"
                  : isMuted
                  ? "bg-gray-400 cursor-not-allowed"
                  : continuousListening
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-white hover:bg-gray-100 active:scale-95"
              }`}
              title={continuousListening ? "Click to stop listening" : "Click to start listening"}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className={`w-5 h-5 ${isMuted ? "text-gray-600" : continuousListening ? "text-white" : "text-purple-600"}`} />
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