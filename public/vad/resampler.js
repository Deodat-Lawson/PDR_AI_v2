"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resampler = void 0;
const logging_1 = require("./logging");
class Resampler {
    constructor(options) {
        this.options = options;
        this.process = (audioFrame) => {
            const outputFrames = [];
            for (const sample of audioFrame) {
                this.inputBuffer.push(sample);
                while (this.hasEnoughDataForFrame()) {
                    const outputFrame = this.generateOutputFrame();
                    outputFrames.push(outputFrame);
                }
            }
            return outputFrames;
        };
        if (options.nativeSampleRate < 16000) {
            logging_1.log.error("nativeSampleRate is too low. Should have 16000 = targetSampleRate <= nativeSampleRate");
        }
        this.inputBuffer = [];
    }
    async *stream(audioInput) {
        for (const sample of audioInput) {
            this.inputBuffer.push(sample);
            while (this.hasEnoughDataForFrame()) {
                const outputFrame = this.generateOutputFrame();
                yield outputFrame;
            }
        }
    }
    hasEnoughDataForFrame() {
        return ((this.inputBuffer.length * this.options.targetSampleRate) /
            this.options.nativeSampleRate >=
            this.options.targetFrameSize);
    }
    generateOutputFrame() {
        const outputFrame = new Float32Array(this.options.targetFrameSize);
        let outputIndex = 0;
        let inputIndex = 0;
        while (outputIndex < this.options.targetFrameSize) {
            let sum = 0;
            let num = 0;
            while (inputIndex <
                Math.min(this.inputBuffer.length, ((outputIndex + 1) * this.options.nativeSampleRate) /
                    this.options.targetSampleRate)) {
                const value = this.inputBuffer[inputIndex];
                if (value !== undefined) {
                    sum += value;
                    num++;
                }
                inputIndex++;
            }
            outputFrame[outputIndex] = sum / num;
            outputIndex++;
        }
        this.inputBuffer = this.inputBuffer.slice(inputIndex);
        return outputFrame;
    }
}
exports.Resampler = Resampler;
//# sourceMappingURL=resampler.js.map