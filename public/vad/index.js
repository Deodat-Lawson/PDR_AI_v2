"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultRealTimeVADOptions = exports.MicVAD = exports.DEFAULT_MODEL = exports.utils = exports.NonRealTimeVAD = exports.Message = exports.FrameProcessor = exports.defaultModelFetcher = exports.baseAssetPath = void 0;
var asset_path_1 = require("./asset-path");
Object.defineProperty(exports, "baseAssetPath", { enumerable: true, get: function () { return asset_path_1.baseAssetPath; } });
var default_model_fetcher_1 = require("./default-model-fetcher");
Object.defineProperty(exports, "defaultModelFetcher", { enumerable: true, get: function () { return default_model_fetcher_1.defaultModelFetcher; } });
var frame_processor_1 = require("./frame-processor");
Object.defineProperty(exports, "FrameProcessor", { enumerable: true, get: function () { return frame_processor_1.FrameProcessor; } });
var messages_1 = require("./messages");
Object.defineProperty(exports, "Message", { enumerable: true, get: function () { return messages_1.Message; } });
var non_real_time_vad_1 = require("./non-real-time-vad");
Object.defineProperty(exports, "NonRealTimeVAD", { enumerable: true, get: function () { return non_real_time_vad_1.NonRealTimeVAD; } });
const utils_1 = require("./utils");
exports.utils = {
    audioFileToArray: utils_1.audioFileToArray,
    minFramesForTargetMS: utils_1.minFramesForTargetMS,
    arrayBufferToBase64: utils_1.arrayBufferToBase64,
    encodeWAV: utils_1.encodeWAV,
};
var real_time_vad_1 = require("./real-time-vad");
Object.defineProperty(exports, "DEFAULT_MODEL", { enumerable: true, get: function () { return real_time_vad_1.DEFAULT_MODEL; } });
Object.defineProperty(exports, "MicVAD", { enumerable: true, get: function () { return real_time_vad_1.MicVAD; } });
Object.defineProperty(exports, "getDefaultRealTimeVADOptions", { enumerable: true, get: function () { return real_time_vad_1.getDefaultRealTimeVADOptions; } });
//# sourceMappingURL=index.js.map