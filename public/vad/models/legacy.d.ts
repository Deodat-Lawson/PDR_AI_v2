import * as ort from "onnxruntime-web/wasm";
import { ModelFactory, SpeechProbabilities } from "./common";
export declare class SileroLegacy {
    private ortInstance;
    private _session;
    private _h;
    private _c;
    private _sr;
    constructor(ortInstance: typeof ort, _session: ort.InferenceSession, _h: ort.Tensor, _c: ort.Tensor, _sr: ort.Tensor);
    static new: ModelFactory;
    reset_state: () => void;
    process: (audioFrame: Float32Array) => Promise<SpeechProbabilities>;
    release: () => Promise<void>;
}
//# sourceMappingURL=legacy.d.ts.map