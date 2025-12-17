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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SileroV5 = exports.SileroLegacy = void 0;
__exportStar(require("./common"), exports);
var legacy_1 = require("./legacy");
Object.defineProperty(exports, "SileroLegacy", { enumerable: true, get: function () { return legacy_1.SileroLegacy; } });
var v5_1 = require("./v5");
Object.defineProperty(exports, "SileroV5", { enumerable: true, get: function () { return v5_1.SileroV5; } });
//# sourceMappingURL=index.js.map