import * as ortInstance from "onnxruntime-web/wasm";
import { FrameProcessorEvent, FrameProcessorOptions } from "./frame-processor";
import { OrtOptions, SpeechProbabilities } from "./models";
export declare const DEFAULT_MODEL = "legacy";
interface RealTimeVADCallbacks {
    /** Callback to run after each frame. The size (number of samples) of a frame is given by `frameSamples`. */
    onFrameProcessed: (probabilities: SpeechProbabilities, frame: Float32Array) => Promise<void> | void;
    /** Callback to run if speech start was detected but `onSpeechEnd` will not be run because the
     * audio segment is smaller than `minSpeechFrames`.
     */
    onVADMisfire: () => Promise<void> | void;
    /** Callback to run when speech start is detected */
    onSpeechStart: () => Promise<void> | void;
    /**
     * Callback to run when speech end is detected.
     * Takes as arg a Float32Array of audio samples between -1 and 1, sample rate 16000.
     * This will not run if the audio segment is smaller than `minSpeechFrames`.
     */
    onSpeechEnd: (audio: Float32Array) => Promise<void> | void;
    /** Callback to run when speech is detected as valid. (i.e. not a misfire) */
    onSpeechRealStart: () => Promise<void> | void;
}
type AssetOptions = {
    workletOptions: AudioWorkletNodeOptions;
    baseAssetPath: string;
    onnxWASMBasePath: string;
};
type ModelOptions = {
    model: "v5" | "legacy";
};
export interface RealTimeVADOptions extends FrameProcessorOptions, RealTimeVADCallbacks, OrtOptions, AssetOptions, ModelOptions {
    audioContext?: AudioContext;
    getStream: () => Promise<MediaStream>;
    pauseStream: (stream: MediaStream) => Promise<void>;
    resumeStream: (stream: MediaStream) => Promise<MediaStream>;
    startOnLoad: boolean;
    processorType: "AudioWorklet" | "ScriptProcessor" | "auto";
}
export declare const ort: typeof ortInstance;
export declare const getDefaultRealTimeVADOptions: (model: "v5" | "legacy") => RealTimeVADOptions;
export declare class MicVAD {
    options: RealTimeVADOptions;
    private readonly frameProcessor;
    private readonly model;
    private readonly frameSamples;
    listening: boolean;
    errored: string | null;
    private _stream;
    private _audioContext;
    private _vadNode;
    private _mediaStreamAudioSourceNode;
    private _audioProcessorAdapterType;
    private initializationState;
    private ownsAudioContext;
    private constructor();
    static new(options?: Partial<RealTimeVADOptions>): Promise<MicVAD>;
    private getAudioInstances;
    setErrored: (error: string) => void;
    start: () => Promise<void>;
    pause: () => Promise<void>;
    destroy: () => Promise<void>;
    setOptions: (update: Partial<FrameProcessorOptions>) => void;
    processFrame: (frame: Float32Array) => Promise<void>;
    handleFrameProcessorEvent: (ev: FrameProcessorEvent) => void;
}
export {};
//# sourceMappingURL=real-time-vad.d.ts.map