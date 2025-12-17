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
exports.MicVAD = exports.getDefaultRealTimeVADOptions = exports.ort = exports.DEFAULT_MODEL = void 0;
const ortInstance = __importStar(require("onnxruntime-web/wasm"));
const default_model_fetcher_1 = require("./default-model-fetcher");
const frame_processor_1 = require("./frame-processor");
const logging_1 = require("./logging");
const messages_1 = require("./messages");
const models_1 = require("./models");
const resampler_1 = require("./resampler");
exports.DEFAULT_MODEL = "legacy";
exports.ort = ortInstance;
const workletFile = "vad.worklet.bundle.min.js";
const sileroV5File = "silero_vad_v5.onnx";
const sileroLegacyFile = "silero_vad_legacy.onnx";
const getDefaultRealTimeVADOptions = (model) => {
    return {
        ...frame_processor_1.defaultFrameProcessorOptions,
        onFrameProcessed: () => { },
        onVADMisfire: () => {
            logging_1.log.debug("VAD misfire");
        },
        onSpeechStart: () => {
            logging_1.log.debug("Detected speech start");
        },
        onSpeechEnd: () => {
            logging_1.log.debug("Detected speech end");
        },
        onSpeechRealStart: () => {
            logging_1.log.debug("Detected real speech start");
        },
        baseAssetPath: "./",
        onnxWASMBasePath: "./",
        model: model,
        workletOptions: {},
        getStream: async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    autoGainControl: true,
                    noiseSuppression: true,
                },
            });
            return stream;
        },
        pauseStream: async (_stream) => {
            _stream.getTracks().forEach((track) => {
                track.stop();
            });
        },
        resumeStream: async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    autoGainControl: true,
                    noiseSuppression: true,
                },
            });
            return stream;
        },
        ortConfig: (ort) => {
            ort.env.logLevel = "error";
        },
        startOnLoad: true,
        processorType: "auto",
    };
};
exports.getDefaultRealTimeVADOptions = getDefaultRealTimeVADOptions;
const detectProcessorType = (ctx) => {
    if ("audioWorklet" in ctx && typeof AudioWorkletNode === "function") {
        return "AudioWorklet";
    }
    return "ScriptProcessor";
};
async function getVADNodeAsWorklet(workletURL, workletOptions, audioContext, frameSamples, processFrame) {
    await audioContext.audioWorklet.addModule(workletURL);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    workletOptions.processorOptions = {
        ...(workletOptions.processorOptions ?? {}),
        frameSamples: frameSamples,
    };
    const audioNode = new AudioWorkletNode(audioContext, "vad-helper-worklet", workletOptions);
    audioNode.port.onmessage = async (ev) => {
        const data = ev.data;
        if (!(typeof data === "object" && data && "message" in data)) {
            console.error("Invalid message event", data);
            return;
        }
        switch (data.message) {
            case messages_1.Message.AudioFrame: {
                if (!("data" in data && data.data instanceof ArrayBuffer)) {
                    console.log("Audio frame message has no data");
                    return;
                }
                const frame = new Float32Array(data.data);
                await processFrame(frame);
                break;
            }
        }
    };
    return audioNode;
}
async function getVADNodeAsScriptProcessor(audioContext, frameSamples, processFrame) {
    const resampler = new resampler_1.Resampler({
        nativeSampleRate: audioContext.sampleRate,
        targetSampleRate: 16000,
        targetFrameSize: frameSamples,
    });
    logging_1.log.debug("using script processor");
    // Fallback to ScriptProcessor
    const bufferSize = 4096; // Increased for more stable processing
    const audioNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
    let processingAudio = false;
    audioNode.onaudioprocess = async (e) => {
        if (processingAudio)
            return;
        processingAudio = true;
        try {
            const input = e.inputBuffer.getChannelData(0);
            const output = e.outputBuffer.getChannelData(0);
            output.fill(0);
            // Process through resampler
            const frames = resampler.process(input);
            for (const frame of frames) {
                await processFrame(frame);
            }
        }
        catch (error) {
            console.error("Error processing audio:", error);
        }
        finally {
            processingAudio = false;
        }
    };
    // https://github.com/WebAudio/web-audio-api/issues/345
    // -> we need to connect an output or will not work due to chrome bug
    audioNode.connect(audioContext.destination);
    return audioNode;
}
class MicVAD {
    constructor(options, frameProcessor, model, frameSamples, listening = false, errored = null, _stream = null, _audioContext = null, _vadNode = null, _mediaStreamAudioSourceNode = null, _audioProcessorAdapterType = null, initializationState = "uninitialized", ownsAudioContext = false) {
        this.options = options;
        this.frameProcessor = frameProcessor;
        this.model = model;
        this.frameSamples = frameSamples;
        this.listening = listening;
        this.errored = errored;
        this._stream = _stream;
        this._audioContext = _audioContext;
        this._vadNode = _vadNode;
        this._mediaStreamAudioSourceNode = _mediaStreamAudioSourceNode;
        this._audioProcessorAdapterType = _audioProcessorAdapterType;
        this.initializationState = initializationState;
        this.ownsAudioContext = ownsAudioContext;
        this.getAudioInstances = () => {
            if (this._stream === null ||
                this._audioContext === null ||
                this._vadNode == null ||
                this._mediaStreamAudioSourceNode == null) {
                throw new Error("MicVAD has null stream, audio context, or processor adapter");
            }
            return {
                stream: this._stream,
                audioContext: this._audioContext,
                vadNode: this._vadNode,
                mediaStreamAudioSourceNode: this._mediaStreamAudioSourceNode,
            };
        };
        this.setErrored = (error) => {
            this.initializationState = "errored";
            this.errored = error;
        };
        this.start = async () => {
            switch (this.initializationState) {
                case "uninitialized": {
                    logging_1.log.debug("initializing micVAD");
                    this.initializationState = "initializing";
                    this.frameProcessor.resume();
                    try {
                        this._stream = await this.options.getStream();
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            this.setErrored(error.message);
                        }
                        else {
                            this.setErrored(String(error));
                        }
                        throw error;
                    }
                    if (this.options.audioContext) {
                        console.log("using custom audio context");
                        this._audioContext = this.options.audioContext;
                    }
                    else {
                        console.log("using default audio context");
                        this._audioContext = new AudioContext();
                        this.ownsAudioContext = true;
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (!this._audioContext) {
                        this.setErrored("Audio context is null");
                        throw Error("Audio context is null");
                    }
                    this._audioProcessorAdapterType =
                        this.options.processorType == "auto"
                            ? detectProcessorType(this._audioContext)
                            : this.options.processorType;
                    switch (this._audioProcessorAdapterType) {
                        case "AudioWorklet":
                            {
                                this._vadNode = await getVADNodeAsWorklet(this.options.baseAssetPath + workletFile, this.options.workletOptions, this._audioContext, this.frameSamples, this.processFrame);
                            }
                            break;
                        case "ScriptProcessor":
                            {
                                this._vadNode = await getVADNodeAsScriptProcessor(this._audioContext, this.frameSamples, this.processFrame);
                            }
                            break;
                        default: {
                            throw new Error(
                            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            `Unsupported audio processor adapter type: ${this._audioProcessorAdapterType}`);
                        }
                    }
                    this._mediaStreamAudioSourceNode = new MediaStreamAudioSourceNode(this._audioContext, {
                        mediaStream: this._stream,
                    });
                    this._mediaStreamAudioSourceNode.connect(this._vadNode);
                    logging_1.log.debug("started micVAD");
                    this.listening = true;
                    this.initializationState = "initialized";
                    break;
                }
                case "initializing": {
                    logging_1.log.warn("start called while initializing");
                    break;
                }
                case "initialized": {
                    if (this.listening) {
                        return;
                    }
                    this.listening = true;
                    this.frameProcessor.resume();
                    const { stream, audioContext, vadNode } = this.getAudioInstances();
                    this._stream = await this.options.resumeStream(stream);
                    const mediaStreamAudioSourceNode = new MediaStreamAudioSourceNode(audioContext, { mediaStream: this._stream });
                    this._mediaStreamAudioSourceNode = mediaStreamAudioSourceNode;
                    mediaStreamAudioSourceNode.connect(vadNode);
                    break;
                }
                case "destroyed": {
                    logging_1.log.warn("start called after destroyed");
                    break;
                }
                case "errored": {
                    logging_1.log.error("start called after errored");
                    break;
                }
                default: {
                    logging_1.log.warn("weird initialization state");
                    break;
                }
            }
        };
        this.pause = async () => {
            if (!this.listening) {
                return;
            }
            this.listening = false;
            const { stream, mediaStreamAudioSourceNode } = this.getAudioInstances();
            await this.options.pauseStream(stream);
            mediaStreamAudioSourceNode.disconnect();
            this.frameProcessor.pause(this.handleFrameProcessorEvent);
        };
        this.destroy = async () => {
            logging_1.log.debug("destroy called");
            this.initializationState = "destroyed";
            const { vadNode } = this.getAudioInstances();
            if (vadNode instanceof AudioWorkletNode) {
                vadNode.port.postMessage(messages_1.Message.SpeechStop);
            }
            if (this.listening) {
                await this.pause();
            }
            await this.model.release();
            if (this.ownsAudioContext) {
                await this._audioContext?.close();
            }
        };
        this.setOptions = (update) => {
            this.frameProcessor.setOptions(update);
        };
        this.processFrame = async (frame) => {
            await this.frameProcessor.process(frame, this.handleFrameProcessorEvent);
        };
        this.handleFrameProcessorEvent = (ev) => {
            switch (ev.msg) {
                case messages_1.Message.FrameProcessed:
                    void this.options.onFrameProcessed(ev.probs, ev.frame);
                    break;
                case messages_1.Message.SpeechStart:
                    void this.options.onSpeechStart();
                    break;
                case messages_1.Message.SpeechRealStart:
                    void this.options.onSpeechRealStart();
                    break;
                case messages_1.Message.VADMisfire:
                    void this.options.onVADMisfire();
                    break;
                case messages_1.Message.SpeechEnd:
                    void this.options.onSpeechEnd(ev.audio);
                    break;
            }
        };
    }
    static async new(options = {}) {
        const fullOptions = {
            ...(0, exports.getDefaultRealTimeVADOptions)(options.model ?? exports.DEFAULT_MODEL),
            ...options,
        };
        (0, frame_processor_1.validateOptions)(fullOptions);
        exports.ort.env.wasm.wasmPaths = fullOptions.onnxWASMBasePath;
        if (fullOptions.ortConfig !== undefined) {
            fullOptions.ortConfig(exports.ort);
        }
        const modelFile = fullOptions.model === "v5" ? sileroV5File : sileroLegacyFile;
        const modelURL = fullOptions.baseAssetPath + modelFile;
        const modelFactory = fullOptions.model === "v5" ? models_1.SileroV5.new : models_1.SileroLegacy.new;
        let model;
        try {
            model = await modelFactory(exports.ort, () => (0, default_model_fetcher_1.defaultModelFetcher)(modelURL));
        }
        catch (e) {
            console.error(`Encountered an error while loading model file ${modelURL}`);
            throw e;
        }
        const frameSamples = fullOptions.model === "v5" ? 512 : 1536;
        const msPerFrame = frameSamples / 16;
        const frameProcessor = new frame_processor_1.FrameProcessor(model.process, model.reset_state, {
            positiveSpeechThreshold: fullOptions.positiveSpeechThreshold,
            negativeSpeechThreshold: fullOptions.negativeSpeechThreshold,
            redemptionMs: fullOptions.redemptionMs,
            preSpeechPadMs: fullOptions.preSpeechPadMs,
            minSpeechMs: fullOptions.minSpeechMs,
            submitUserSpeechOnPause: fullOptions.submitUserSpeechOnPause,
        }, msPerFrame);
        const micVad = new MicVAD(fullOptions, frameProcessor, model, frameSamples);
        // things would be simpler if we didn't have to startOnLoad by default, but we are locked in
        if (fullOptions.startOnLoad) {
            try {
                await micVad.start();
            }
            catch (e) {
                console.error("Error starting micVad", e);
                throw e;
            }
        }
        return micVad;
    }
}
exports.MicVAD = MicVAD;
//# sourceMappingURL=real-time-vad.js.map