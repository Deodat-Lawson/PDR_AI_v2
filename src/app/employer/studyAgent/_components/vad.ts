"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { MicVAD } from "@ricky0123/vad-web";

interface UseVADOptions {
  onSpeechStart?: () => void;
  onSpeechRealStart?: () => void;
  onSpeechEnd?: (audio: Float32Array) => void;
  onError?: (error: Error) => void;
  positiveSpeechThreshold?: number;
  negativeSpeechThreshold?: number;
  redemptionMs?: number;
  preSpeechPadMs?: number;
  minSpeechMs?: number;
}

export function useVAD(options: UseVADOptions = {}) {
  const {
    onSpeechStart,
    onSpeechEnd,
    onSpeechRealStart,
    onError,
    positiveSpeechThreshold = 0.6,
    negativeSpeechThreshold = 0.30,
    redemptionMs = 3000,
    preSpeechPadMs = 200,
    minSpeechMs = 600,
  } = options;

  const onSpeechRealStartRef = useRef(onSpeechRealStart);

  const vadRef = useRef<MicVAD | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Store callbacks in refs to avoid stale closures
  const onSpeechStartRef = useRef(onSpeechStart);
  const onSpeechEndRef = useRef(onSpeechEnd);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSpeechStartRef.current = onSpeechStart;
    onSpeechEndRef.current = onSpeechEnd;
    onErrorRef.current = onError;
    onSpeechRealStartRef.current = onSpeechRealStart;
  }, [onSpeechStart, onSpeechEnd, onError, onSpeechRealStart]);

  const start = useCallback(async () => {
    if (vadRef.current) {
      // Already initialized, just resume
      console.log("🎤 [VAD] Resuming existing VAD instance");
      void Promise.resolve(vadRef.current.start());
      setIsRunning(true);
      return;
    }

    try {
      console.log("🎤 [VAD] Starting voice activity detection...");
      const vad = await import("@ricky0123/vad-web");

      vadRef.current = await vad.MicVAD.new({
        onSpeechStart: () => {
          console.log("🎤 [VAD] Speech started");
          setIsRecording(true);
          onSpeechStartRef.current?.();
        },
        onSpeechRealStart: () => {
          console.log("🎤 [VAD] Real speech started");
          onSpeechRealStartRef.current?.();
        },
        onSpeechEnd: (audio) => {
          console.log(`🎤 [VAD] Speech ended (${audio.length} samples)`);
          setIsRecording(false);
          onSpeechEndRef.current?.(audio);
        },
        getStream: async () => {
          return navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              // @ts-expect-error: not in TS lib yet, supported in some browsers
              suppressLocalAudioPlayback: true,
            },
          });
        },
        minSpeechMs,
        baseAssetPath: "/vad/",
        onnxWASMBasePath: "/vad/",
        model: "legacy",
        positiveSpeechThreshold,
        negativeSpeechThreshold,
        redemptionMs,
        preSpeechPadMs,
      });

      void Promise.resolve(vadRef.current.start());
      setIsRunning(true);
      console.log("✅ [VAD] Voice activity detection started");
    } catch (err) {
      console.error("❌ [VAD] Failed to start:", err);
      const error = err instanceof Error ? err : new Error("Failed to start VAD");
      onErrorRef.current?.(error);
    }
  }, [positiveSpeechThreshold, negativeSpeechThreshold, redemptionMs, preSpeechPadMs, minSpeechMs]);

  const pause = useCallback(() => {
    if (vadRef.current) {
      console.log("🎤 [VAD] Pausing");
      void Promise.resolve(vadRef.current.pause());
      setIsRecording(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (vadRef.current) {
      console.log("🎤 [VAD] Resuming");
      void Promise.resolve(vadRef.current.start());
    }
  }, []);

  const stop = useCallback(() => {
    if (vadRef.current) {
      console.log("🎤 [VAD] Stopping voice activity detection...");
      try {
        void Promise.resolve(vadRef.current.pause());
        void Promise.resolve(vadRef.current.destroy());
      } catch {
        // Ignore cleanup errors
      }
      vadRef.current = null;
    }
    setIsRunning(false);
    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vadRef.current) {
        try {
          void Promise.resolve(vadRef.current.pause());
          void Promise.resolve(vadRef.current.destroy());
        } catch {
          // Ignore cleanup errors
        }
        vadRef.current = null;
      }
    };
  }, []);

  return {
    start,
    pause,
    resume,
    stop,
    isRunning,
    isRecording,
  };
}
