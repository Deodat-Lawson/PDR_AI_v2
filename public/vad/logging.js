"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const mkLogger = (level) => (message) => {
    console.log(`VAD | ${level} >`, message);
};
exports.log = {
    error: mkLogger("error"),
    debug: mkLogger("debug"),
    warn: mkLogger("warn"),
};
//# sourceMappingURL=logging.js.map