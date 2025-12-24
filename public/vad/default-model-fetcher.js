"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultModelFetcher = void 0;
const defaultModelFetcher = (path) => {
    return fetch(path).then((model) => model.arrayBuffer());
};
exports.defaultModelFetcher = defaultModelFetcher;
//# sourceMappingURL=default-model-fetcher.js.map