"use strict";
/*
Some of this code, together with the default options found in index.ts,
were taken (or took inspiration) from https://github.com/snakers4/silero-vad
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameProcessor = exports.validateOptions = exports.defaultFrameProcessorOptions = void 0;
const logging_1 = require("./logging");
const messages_1 = require("./messages");
exports.defaultFrameProcessorOptions = {
    positiveSpeechThreshold: 0.3,
    negativeSpeechThreshold: 0.25,
    preSpeechPadMs: 800,
    redemptionMs: 1400,
    minSpeechMs: 400,
    submitUserSpeechOnPause: false,
};
function validateOptions(options) {
    if (options.positiveSpeechThreshold < 0 ||
        options.positiveSpeechThreshold > 1) {
        logging_1.log.error("positiveSpeechThreshold should be a number between 0 and 1");
    }
    if (options.negativeSpeechThreshold < 0 ||
        options.negativeSpeechThreshold > options.positiveSpeechThreshold) {
        logging_1.log.error("negativeSpeechThreshold should be between 0 and positiveSpeechThreshold");
    }
    if (options.preSpeechPadMs < 0) {
        logging_1.log.error("preSpeechPadMs should be positive");
    }
    if (options.redemptionMs < 0) {
        logging_1.log.error("redemptionMs should be positive");
    }
    if (options.minSpeechMs < 0) {
        logging_1.log.error("minSpeechMs should be positive");
    }
}
exports.validateOptions = validateOptions;
const concatArrays = (arrays) => {
    const sizes = arrays.reduce((out, next) => {
        out.push(out.at(-1) + next.length);
        return out;
    }, [0]);
    const outArray = new Float32Array(sizes.at(-1));
    arrays.forEach((arr, index) => {
        const place = sizes[index];
        outArray.set(arr, place);
    });
    return outArray;
};
function calculateFrameParams(options, msPerFrame) {
    const redemptionFrames = Math.floor(options.redemptionMs / msPerFrame);
    const preSpeechPadFrames = Math.floor(options.preSpeechPadMs / msPerFrame);
    const minSpeechFrames = Math.floor(options.minSpeechMs / msPerFrame);
    return { redemptionFrames, preSpeechPadFrames, minSpeechFrames };
}
class FrameProcessor {
    constructor(modelProcessFunc, modelResetFunc, options, msPerFrame) {
        this.modelProcessFunc = modelProcessFunc;
        this.modelResetFunc = modelResetFunc;
        this.options = options;
        this.msPerFrame = msPerFrame;
        this.speaking = false;
        this.redemptionCounter = 0;
        this.speechFrameCount = 0;
        this.active = false;
        this.speechRealStartFired = false;
        this.setOptions = (update) => {
            this.options = { ...this.options, ...update };
            const { redemptionFrames, preSpeechPadFrames, minSpeechFrames } = calculateFrameParams(this.options, this.msPerFrame);
            this.redemptionFrames = redemptionFrames;
            this.preSpeechPadFrames = preSpeechPadFrames;
            this.minSpeechFrames = minSpeechFrames;
        };
        this.reset = () => {
            this.speaking = false;
            this.speechRealStartFired = false;
            this.audioBuffer = [];
            this.modelResetFunc();
            this.redemptionCounter = 0;
            this.speechFrameCount = 0;
        };
        this.pause = (handleEvent) => {
            this.active = false;
            if (this.options.submitUserSpeechOnPause) {
                this.endSegment(handleEvent);
            }
            else {
                this.reset();
            }
        };
        this.resume = () => {
            this.active = true;
        };
        this.endSegment = (handleEvent) => {
            const audioBuffer = this.audioBuffer;
            this.audioBuffer = [];
            const speaking = this.speaking;
            this.reset();
            if (speaking) {
                const speechFrameCount = audioBuffer.reduce((acc, item) => {
                    return item.isSpeech ? acc + 1 : acc;
                }, 0);
                if (speechFrameCount >= this.minSpeechFrames) {
                    const audio = concatArrays(audioBuffer.map((item) => item.frame));
                    handleEvent({ msg: messages_1.Message.SpeechEnd, audio });
                }
                else {
                    handleEvent({ msg: messages_1.Message.VADMisfire });
                }
            }
            return {};
        };
        this.process = async (frame, handleEvent) => {
            if (!this.active) {
                return;
            }
            const probs = await this.modelProcessFunc(frame);
            const isSpeech = probs.isSpeech >= this.options.positiveSpeechThreshold;
            handleEvent({ probs, msg: messages_1.Message.FrameProcessed, frame });
            this.audioBuffer.push({
                frame,
                isSpeech,
            });
            if (isSpeech) {
                this.speechFrameCount++;
                this.redemptionCounter = 0;
            }
            if (isSpeech && !this.speaking) {
                this.speaking = true;
                handleEvent({ msg: messages_1.Message.SpeechStart });
            }
            if (this.speaking &&
                this.speechFrameCount === this.minSpeechFrames &&
                !this.speechRealStartFired) {
                this.speechRealStartFired = true;
                handleEvent({ msg: messages_1.Message.SpeechRealStart });
            }
            if (probs.isSpeech < this.options.negativeSpeechThreshold &&
                this.speaking &&
                ++this.redemptionCounter >= this.redemptionFrames) {
                this.redemptionCounter = 0;
                this.speechFrameCount = 0;
                this.speaking = false;
                this.speechRealStartFired = false;
                const audioBuffer = this.audioBuffer;
                this.audioBuffer = [];
                const speechFrameCount = audioBuffer.reduce((acc, item) => {
                    return item.isSpeech ? acc + 1 : acc;
                }, 0);
                if (speechFrameCount >= this.minSpeechFrames) {
                    const audio = concatArrays(audioBuffer.map((item) => item.frame));
                    handleEvent({ msg: messages_1.Message.SpeechEnd, audio });
                }
                else {
                    handleEvent({ msg: messages_1.Message.VADMisfire });
                }
            }
            if (!this.speaking) {
                while (this.audioBuffer.length > this.preSpeechPadFrames) {
                    this.audioBuffer.shift();
                }
                this.speechFrameCount = 0;
            }
        };
        this.audioBuffer = [];
        const { redemptionFrames, preSpeechPadFrames, minSpeechFrames } = calculateFrameParams(this.options, this.msPerFrame);
        this.redemptionFrames = redemptionFrames;
        this.preSpeechPadFrames = preSpeechPadFrames;
        this.minSpeechFrames = minSpeechFrames;
        this.reset();
    }
}
exports.FrameProcessor = FrameProcessor;
//# sourceMappingURL=frame-processor.js.map