"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SileroV5 = void 0;
const logging_1 = require("../logging");
function getNewState(ortInstance) {
    const zeroes = Array(2 * 128).fill(0);
    return new ortInstance.Tensor("float32", zeroes, [2, 1, 128]);
}
class SileroV5 {
    constructor(_session, _state, _sr, ortInstance) {
        this._session = _session;
        this._state = _state;
        this._sr = _sr;
        this.ortInstance = ortInstance;
        this.reset_state = () => {
            this._state = getNewState(this.ortInstance);
        };
        this.process = async (audioFrame) => {
            const t = new this.ortInstance.Tensor("float32", audioFrame, [
                1,
                audioFrame.length,
            ]);
            const inputs = {
                input: t,
                state: this._state,
                sr: this._sr,
            };
            const out = await this._session.run(inputs);
            if (!out["stateN"]) {
                throw new Error("No state from model");
            }
            this._state = out["stateN"];
            if (!out["output"]?.data) {
                throw new Error("No output from model");
            }
            const isSpeech = out["output"].data[0];
            if (typeof isSpeech != "number") {
                throw new Error("Weird output data");
            }
            const notSpeech = 1 - isSpeech;
            return { notSpeech, isSpeech };
        };
        this.release = async () => {
            await this._session.release();
            this._state.dispose();
            this._sr.dispose();
        };
    }
}
exports.SileroV5 = SileroV5;
_a = SileroV5;
SileroV5.new = async (ortInstance, modelFetcher) => {
    logging_1.log.debug("Loading VAD...");
    const modelArrayBuffer = await modelFetcher();
    const _session = await ortInstance.InferenceSession.create(modelArrayBuffer);
    const _sr = new ortInstance.Tensor("int64", [16000n]);
    const _state = getNewState(ortInstance);
    logging_1.log.debug("...finished loading VAD");
    return new _a(_session, _state, _sr, ortInstance);
};
//# sourceMappingURL=v5.js.map