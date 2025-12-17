"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { MicVAD } from "@ricky0123/vad-web";

interface UseVADOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: Float32Array) => void;
  onError?: (error: Error) => void;
  positiveSpeechThreshold?: number;
  negativeSpeechThreshold?: number;
  redemptionMs?: number;
  preSpeechPadMs?: number;
}

export function useVAD(options: UseVADOptions = {}) {
  const {
    onSpeechStart,
    onSpeechEnd,
    onError,
    positiveSpeechThreshold = 0.5,
    negativeSpeechThreshold = 0.35,
    redemptionMs = 300,
    preSpeechPadMs = 150,
  } = options;

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
  }, [onSpeechStart, onSpeechEnd, onError]);

  const start = useCallback(async () => {
    if (vadRef.current) {
      // Already initialized, just resume
      console.log("🎤 [VAD] Resuming existing VAD instance");
      vadRef.current.start();
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
        onSpeechEnd: (audio) => {
          console.log(`🎤 [VAD] Speech ended (${audio.length} samples)`);
          setIsRecording(false);
          onSpeechEndRef.current?.(audio);
        },
        baseAssetPath: "/vad/",
        onnxWASMBasePath: "/vad/",
        model: "legacy",
        positiveSpeechThreshold,
        negativeSpeechThreshold,
        redemptionMs,
        preSpeechPadMs,
      });

      vadRef.current.start();
      setIsRunning(true);
      console.log("✅ [VAD] Voice activity detection started");
    } catch (err) {
      console.error("❌ [VAD] Failed to start:", err);
      const error = err instanceof Error ? err : new Error("Failed to start VAD");
      onErrorRef.current?.(error);
    }
  }, [positiveSpeechThreshold, negativeSpeechThreshold, redemptionMs, preSpeechPadMs]);

  const pause = useCallback(() => {
    if (vadRef.current) {
      console.log("🎤 [VAD] Pausing");
      vadRef.current.pause();
      setIsRecording(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (vadRef.current) {
      console.log("🎤 [VAD] Resuming");
      vadRef.current.start();
    }
  }, []);

  const stop = useCallback(() => {
    if (vadRef.current) {
      console.log("🎤 [VAD] Stopping voice activity detection...");
      try {
        vadRef.current.pause();
        vadRef.current.destroy();
      } catch (e) {
        console.warn("VAD cleanup warning:", e);
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
          vadRef.current.pause();
          vadRef.current.destroy();
        } catch (e) {
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
