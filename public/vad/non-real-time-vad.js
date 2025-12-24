"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonRealTimeVAD = exports.defaultNonRealTimeVADOptions = void 0;
const ortInstance = __importStar(require("onnxruntime-web"));
const asset_path_1 = require("./asset-path");
const default_model_fetcher_1 = require("./default-model-fetcher");
const frame_processor_1 = require("./frame-processor");
const messages_1 = require("./messages");
const models_1 = require("./models");
const resampler_1 = require("./resampler");
exports.defaultNonRealTimeVADOptions = {
    ...frame_processor_1.defaultFrameProcessorOptions,
    modelURL: asset_path_1.baseAssetPath + "silero_vad_legacy.onnx",
    modelFetcher: default_model_fetcher_1.defaultModelFetcher,
};
class NonRealTimeVAD {
    static async new(options = {}) {
        const fullOptions = {
            ...exports.defaultNonRealTimeVADOptions,
            ...options,
        };
        (0, frame_processor_1.validateOptions)(fullOptions);
        if (fullOptions.ortConfig !== undefined) {
            fullOptions.ortConfig(ortInstance);
        }
        const modelFetcher = () => fullOptions.modelFetcher(fullOptions.modelURL);
        const model = await models_1.SileroLegacy.new(ortInstance, modelFetcher);
        const frameProcessor = new frame_processor_1.FrameProcessor(model.process, model.reset_state, {
            positiveSpeechThreshold: fullOptions.positiveSpeechThreshold,
            negativeSpeechThreshold: fullOptions.negativeSpeechThreshold,
            redemptionMs: fullOptions.redemptionMs,
            preSpeechPadMs: fullOptions.preSpeechPadMs,
            minSpeechMs: fullOptions.minSpeechMs,
            submitUserSpeechOnPause: fullOptions.submitUserSpeechOnPause,
        }, 1536 / 16);
        frameProcessor.resume();
        const vad = new this(modelFetcher, ortInstance, fullOptions, frameProcessor);
        return vad;
    }
    constructor(modelFetcher, ort, options, frameProcessor) {
        this.modelFetcher = modelFetcher;
        this.ort = ort;
        this.options = options;
        this.frameProcessor = frameProcessor;
        this.frameSamples = 1536;
    }
    async *run(inputAudio, sampleRate) {
        const resamplerOptions = {
            nativeSampleRate: sampleRate,
            targetSampleRate: 16000,
            targetFrameSize: this.frameSamples,
        };
        const resampler = new resampler_1.Resampler(resamplerOptions);
        let start = 0;
        let end = 0;
        let frameIndex = 0;
        for await (const frame of resampler.stream(inputAudio)) {
            const messageContainer = [];
            await this.frameProcessor.process(frame, (event) => {
                messageContainer.push(event);
            });
            for (const event of messageContainer) {
                switch (event.msg) {
                    case messages_1.Message.SpeechStart:
                        start = (frameIndex * this.frameSamples) / 16;
                        break;
                    case messages_1.Message.SpeechEnd:
                        end = ((frameIndex + 1) * this.frameSamples) / 16;
                        yield { audio: event.audio, start, end };
                        break;
                    default:
                        break;
                }
            }
            frameIndex++;
        }
        const messageContainer = [];
        this.frameProcessor.endSegment((event) => {
            messageContainer.push(event);
        });
        for (const event of messageContainer) {
            switch (event.msg) {
                case messages_1.Message.SpeechEnd:
                    yield {
                        audio: event.audio,
                        start,
                        end: (frameIndex * this.frameSamples) / 16,
                    };
            }
        }
    }
}
exports.NonRealTimeVAD = NonRealTimeVAD;
//# sourceMappingURL=non-real-time-vad.js.map