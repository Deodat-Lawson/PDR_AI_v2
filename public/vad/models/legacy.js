"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SileroLegacy = void 0;
const logging_1 = require("../logging");
class SileroLegacy {
    constructor(ortInstance, _session, _h, _c, _sr) {
        this.ortInstance = ortInstance;
        this._session = _session;
        this._h = _h;
        this._c = _c;
        this._sr = _sr;
        this.reset_state = () => {
            const zeroes = Array(2 * 64).fill(0);
            this._h = new this.ortInstance.Tensor("float32", zeroes, [2, 1, 64]);
            this._c = new this.ortInstance.Tensor("float32", zeroes, [2, 1, 64]);
        };
        this.process = async (audioFrame) => {
            const t = new this.ortInstance.Tensor("float32", audioFrame, [
                1,
                audioFrame.length,
            ]);
            const inputs = {
                input: t,
                h: this._h,
                c: this._c,
                sr: this._sr,
            };
            const out = await this._session.run(inputs);
            this._h = out["hn"];
            this._c = out["cn"];
            const [isSpeech] = out["output"]?.data;
            const notSpeech = 1 - isSpeech;
            return { notSpeech, isSpeech };
        };
        this.release = async () => {
            await this._session.release();
            this._h.dispose();
            this._c.dispose();
            this._sr.dispose();
        };
    }
}
exports.SileroLegacy = SileroLegacy;
_a = SileroLegacy;
SileroLegacy.new = async (ortInstance, modelFetcher) => {
    logging_1.log.debug("initializing vad");
    const modelArrayBuffer = await modelFetcher();
    const _session = await ortInstance.InferenceSession.create(modelArrayBuffer);
    const _sr = new ortInstance.Tensor("int64", [16000n]);
    const zeroes = Array(2 * 64).fill(0);
    const _h = new ortInstance.Tensor("float32", zeroes, [2, 1, 64]);
    const _c = new ortInstance.Tensor("float32", zeroes, [2, 1, 64]);
    logging_1.log.debug("vad is initialized");
    const model = new _a(ortInstance, _session, _h, _c, _sr);
    return model;
};
//# sourceMappingURL=legacy.js.map