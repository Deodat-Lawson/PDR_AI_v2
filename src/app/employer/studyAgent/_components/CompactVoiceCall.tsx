import { useState, useEffect } from "react";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Maximize2, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import type { Message } from "../page";

interface CompactVoiceCallProps {
  isBuddy?: boolean;
  onExpand: () => void;
  onShowTranscript: () => void;
  onEndCall?: () => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  callState?: "connected" | "listening" | "teacher-speaking";
  isMuted?: boolean;
  isRecording?: boolean;
  isPlayingAudio?: boolean;
  onToggleMute?: () => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
}

type CallState = "connected" | "listening" | "speaking";

export function CompactVoiceCall({ 
  isBuddy = false, 
  onExpand, 
  onShowTranscript,
  onEndCall,
  messages,
  callState: externalCallState,
  isMuted: externalIsMuted,
  isRecording: externalIsRecording,
  isPlayingAudio: externalIsPlayingAudio,
  onToggleMute,
  onStartListening,
  onStopListening,
}: CompactVoiceCallProps) {
  const [internalCallState, setInternalCallState] = useState<CallState>("connected");
  const [internalIsMuted, setInternalIsMuted] = useState(false);
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Use external state if provided, otherwise use internal state
  const callState = externalCallState 
    ? (externalCallState === "teacher-speaking" ? "speaking" : externalCallState)
    : internalCallState;
  const isMuted = externalIsMuted ?? internalIsMuted;
  const isRecording = externalIsRecording ?? internalIsRecording;
  const isPlayingAudio = externalIsPlayingAudio ?? false;

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

  const handleMicPress = () => {
    if (isMuted) return;
    if (onStartListening) {
      onStartListening();
    } else {
      setInternalIsRecording(true);
      setInternalCallState("listening");
    }
  };

  const handleMicRelease = () => {
    if (onStopListening) {
      onStopListening();
    } else {
      setInternalIsRecording(false);
      setInternalCallState("speaking");
      setTimeout(() => {
        setInternalCallState("connected");
      }, 2000);
    }
  };

  const handleToggleMute = () => {
    if (onToggleMute) {
      onToggleMute();
    } else {
      setInternalIsMuted(!internalIsMuted);
    }
  };

  const handleEndCall = () => {
    if (confirm("End your tutoring session?")) {
      onEndCall?.();
    }
  };

  const displayCallState = isPlayingAudio ? "speaking" : callState;

  return (
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

          {/* Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="text-white hover:bg-white/20 h-8 w-8 p-0 flex-shrink-0"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 text-center text-sm">
          {displayCallState === "listening" && (
            <div className="flex items-center justify-center gap-2">
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Listening...</span>
            </div>
          )}
          
          {displayCallState === "speaking" && (
            <div className="flex items-center justify-center gap-2">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span>{isBuddy ? "Buddy" : "Teacher"} is speaking...</span>
            </div>
          )}

          {displayCallState === "connected" && !isRecording && (
            <span className="text-white/90">Ready to listen</span>
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
            onClick={handleToggleMute}
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
            onMouseDown={handleMicPress}
            onMouseUp={handleMicRelease}
            onTouchStart={handleMicPress}
            onTouchEnd={handleMicRelease}
            disabled={isMuted}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isRecording
                ? "bg-blue-500 hover:bg-blue-600 scale-110"
                : isMuted
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-100 active:scale-95"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className={`w-5 h-5 ${isMuted ? "text-gray-600" : "text-purple-600"}`} />
            )}
          </button>

          {/* Transcript */}
          <button
            onClick={onShowTranscript}
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

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
          >
            <PhoneOff className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

