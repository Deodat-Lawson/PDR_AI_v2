"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logging_1 = require("./logging");
const messages_1 = require("./messages");
const resampler_1 = require("./resampler");
class Processor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this._stopProcessing = false;
        this.options = options.processorOptions;
        this.port.onmessage = (ev) => {
            if (ev.data === messages_1.Message.SpeechStop) {
                logging_1.log.debug("Worklet received speech stop message");
                this._stopProcessing = true;
            }
        };
        this.resampler = new resampler_1.Resampler({
            nativeSampleRate: sampleRate,
            targetSampleRate: 16000,
            targetFrameSize: this.options.frameSamples,
        });
    }
    process(inputs) {
        if (this._stopProcessing) {
            // This will not stop process from running, just a prerequisite for the browser to garbage collect
            return false;
        }
        const r = inputs[0];
        if (r === undefined) {
            return true;
        }
        const arr = r[0];
        if (arr === undefined) {
            return true;
        }
        const frames = this.resampler.process(arr);
        for (const frame of frames) {
            this.port.postMessage({ message: messages_1.Message.AudioFrame, data: frame.buffer }, [frame.buffer]);
        }
        return true;
    }
}
registerProcessor("vad-helper-worklet", Processor);
//# sourceMappingURL=worklet.js.map