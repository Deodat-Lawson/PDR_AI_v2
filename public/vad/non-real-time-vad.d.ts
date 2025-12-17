import { FrameProcessorInterface, FrameProcessorOptions } from "./frame-processor";
import { ModelFetcher, OrtModule, OrtOptions } from "./models";
interface NonRealTimeVADSpeechData {
    audio: Float32Array;
    start: number;
    end: number;
}
export interface NonRealTimeVADOptions extends FrameProcessorOptions, OrtOptions {
    modelURL: string;
    modelFetcher: (path: string) => Promise<ArrayBuffer>;
}
export declare const defaultNonRealTimeVADOptions: NonRealTimeVADOptions;
export declare class NonRealTimeVAD {
    modelFetcher: ModelFetcher;
    ort: OrtModule;
    options: NonRealTimeVADOptions;
    frameProcessor: FrameProcessorInterface;
    frameSamples: number;
    static new(options?: Partial<NonRealTimeVADOptions>): Promise<NonRealTimeVAD>;
    constructor(modelFetcher: ModelFetcher, ort: OrtModule, options: NonRealTimeVADOptions, frameProcessor: FrameProcessorInterface);
    run(inputAudio: Float32Array, sampleRate: number): AsyncGenerator<NonRealTimeVADSpeechData>;
}
export {};
//# sourceMappingURL=non-real-time-vad.d.ts.map