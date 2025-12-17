export declare function minFramesForTargetMS(targetDuration: number, frameSamples: number, sr?: number): number;
export declare function arrayBufferToBase64(buffer: ArrayBuffer): string;
export declare function encodeWAV(samples: Float32Array, format?: number, sampleRate?: number, numChannels?: number, bitDepth?: number): ArrayBuffer;
export declare function audioFileToArray(audioFileData: Blob): Promise<{
    audio: Float32Array;
    sampleRate: number;
}>;
//# sourceMappingURL=utils.d.ts.map