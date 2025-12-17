import { Message } from "./messages";
import { SpeechProbabilities } from "./models";
export interface FrameProcessorOptions {
    /** Threshold over which values returned by the Silero VAD model will be considered as positively indicating speech.
     * The Silero VAD model is run on each frame. This number should be between 0 and 1.
     */
    positiveSpeechThreshold: number;
    /** Threshold under which values returned by the Silero VAD model will be considered as indicating an absence of speech.
     * Note that the creators of the Silero VAD have historically set this number at 0.15 less than `positiveSpeechThreshold`.
     */
    negativeSpeechThreshold: number;
    /** After a VAD value under the `negativeSpeechThreshold` is observed, the algorithm will wait `redemptionMs` ms
     * before running `onSpeechEnd`. If the model returns a value over `positiveSpeechThreshold` during this grace period, then
     * the algorithm will consider the previously-detected "speech end" as having been a false negative.
     */
    redemptionMs: number;
    /** Number of ms to prepend to the audio segment that will be passed to `onSpeechEnd`. */
    preSpeechPadMs: number;
    /** If an audio segment is detected as a speech segment according to initial algorithm but it is shorter than `minSpeechMs`,
     * it will be discarded and `onVADMisfire` will be run instead of `onSpeechEnd`.
     */
    minSpeechMs: number;
    /**
     * If true, when the user pauses the VAD, it may trigger `onSpeechEnd`.
     */
    submitUserSpeechOnPause: boolean;
}
export declare const defaultFrameProcessorOptions: FrameProcessorOptions;
export declare function validateOptions(options: FrameProcessorOptions): void;
export interface FrameProcessorInterface {
    resume: () => void;
    process: (arr: Float32Array, handleEvent: (event: FrameProcessorEvent) => void) => Promise<void>;
    endSegment: (handleEvent: (event: FrameProcessorEvent) => void) => {
        msg?: Message;
        audio?: Float32Array;
    };
}
export declare class FrameProcessor implements FrameProcessorInterface {
    modelProcessFunc: (frame: Float32Array) => Promise<SpeechProbabilities>;
    modelResetFunc: () => void;
    options: FrameProcessorOptions;
    msPerFrame: number;
    redemptionFrames: number;
    preSpeechPadFrames: number;
    minSpeechFrames: number;
    speaking: boolean;
    audioBuffer: {
        frame: Float32Array;
        isSpeech: boolean;
    }[];
    redemptionCounter: number;
    speechFrameCount: number;
    active: boolean;
    speechRealStartFired: boolean;
    constructor(modelProcessFunc: (frame: Float32Array) => Promise<SpeechProbabilities>, modelResetFunc: () => void, options: FrameProcessorOptions, msPerFrame: number);
    setOptions: (update: Partial<FrameProcessorOptions>) => void;
    reset: () => void;
    pause: (handleEvent: (event: FrameProcessorEvent) => void) => void;
    resume: () => void;
    endSegment: (handleEvent: (event: FrameProcessorEvent) => void) => {};
    process: (frame: Float32Array, handleEvent: (event: FrameProcessorEvent) => void) => Promise<void>;
}
export type FrameProcessorEvent = {
    msg: Message.VADMisfire;
} | {
    msg: Message.SpeechStart;
} | {
    msg: Message.SpeechRealStart;
} | {
    msg: Message.SpeechEnd;
    audio: Float32Array;
} | {
    msg: Message.FrameProcessed;
    probs: SpeechProbabilities;
    frame: Float32Array;
};
//# sourceMappingURL=frame-processor.d.ts.map