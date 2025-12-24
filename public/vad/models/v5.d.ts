import * as ort from "onnxruntime-web/wasm";
import { ModelFactory, SpeechProbabilities } from "./common";
export declare class SileroV5 {
    private _session;
    private _state;
    private _sr;
    private ortInstance;
    constructor(_session: ort.InferenceSession, _state: ort.Tensor, _sr: ort.Tensor, ortInstance: typeof ort);
    static new: ModelFactory;
    reset_state: () => void;
    process: (audioFrame: Float32Array) => Promise<SpeechProbabilities>;
    release: () => Promise<void>;
}
//# sourceMappingURL=v5.d.ts.map