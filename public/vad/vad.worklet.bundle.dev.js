/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./dist/logging.js":
/*!*************************!*\
  !*** ./dist/logging.js ***!
  \*************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.log = void 0;\nconst mkLogger = (level) => (message) => {\n    console.log(`VAD | ${level} >`, message);\n};\nexports.log = {\n    error: mkLogger(\"error\"),\n    debug: mkLogger(\"debug\"),\n    warn: mkLogger(\"warn\"),\n};\n//# sourceMappingURL=logging.js.map\n\n//# sourceURL=webpack://@ricky0123/vad-web/./dist/logging.js?");

/***/ }),

/***/ "./dist/messages.js":
/*!**************************!*\
  !*** ./dist/messages.js ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.Message = void 0;\nvar Message;\n(function (Message) {\n    Message[\"AudioFrame\"] = \"AUDIO_FRAME\";\n    Message[\"SpeechStart\"] = \"SPEECH_START\";\n    Message[\"VADMisfire\"] = \"VAD_MISFIRE\";\n    Message[\"SpeechEnd\"] = \"SPEECH_END\";\n    Message[\"SpeechStop\"] = \"SPEECH_STOP\";\n    Message[\"SpeechRealStart\"] = \"SPEECH_REAL_START\";\n    Message[\"FrameProcessed\"] = \"FRAME_PROCESSED\";\n})(Message || (exports.Message = Message = {}));\n//# sourceMappingURL=messages.js.map\n\n//# sourceURL=webpack://@ricky0123/vad-web/./dist/messages.js?");

/***/ }),

/***/ "./dist/resampler.js":
/*!***************************!*\
  !*** ./dist/resampler.js ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.Resampler = void 0;\nconst logging_1 = __webpack_require__(/*! ./logging */ \"./dist/logging.js\");\nclass Resampler {\n    constructor(options) {\n        this.options = options;\n        this.process = (audioFrame) => {\n            const outputFrames = [];\n            for (const sample of audioFrame) {\n                this.inputBuffer.push(sample);\n                while (this.hasEnoughDataForFrame()) {\n                    const outputFrame = this.generateOutputFrame();\n                    outputFrames.push(outputFrame);\n                }\n            }\n            return outputFrames;\n        };\n        if (options.nativeSampleRate < 16000) {\n            logging_1.log.error(\"nativeSampleRate is too low. Should have 16000 = targetSampleRate <= nativeSampleRate\");\n        }\n        this.inputBuffer = [];\n    }\n    async *stream(audioInput) {\n        for (const sample of audioInput) {\n            this.inputBuffer.push(sample);\n            while (this.hasEnoughDataForFrame()) {\n                const outputFrame = this.generateOutputFrame();\n                yield outputFrame;\n            }\n        }\n    }\n    hasEnoughDataForFrame() {\n        return ((this.inputBuffer.length * this.options.targetSampleRate) /\n            this.options.nativeSampleRate >=\n            this.options.targetFrameSize);\n    }\n    generateOutputFrame() {\n        const outputFrame = new Float32Array(this.options.targetFrameSize);\n        let outputIndex = 0;\n        let inputIndex = 0;\n        while (outputIndex < this.options.targetFrameSize) {\n            let sum = 0;\n            let num = 0;\n            while (inputIndex <\n                Math.min(this.inputBuffer.length, ((outputIndex + 1) * this.options.nativeSampleRate) /\n                    this.options.targetSampleRate)) {\n                const value = this.inputBuffer[inputIndex];\n                if (value !== undefined) {\n                    sum += value;\n                    num++;\n                }\n                inputIndex++;\n            }\n            outputFrame[outputIndex] = sum / num;\n            outputIndex++;\n        }\n        this.inputBuffer = this.inputBuffer.slice(inputIndex);\n        return outputFrame;\n    }\n}\nexports.Resampler = Resampler;\n//# sourceMappingURL=resampler.js.map\n\n//# sourceURL=webpack://@ricky0123/vad-web/./dist/resampler.js?");

/***/ }),

/***/ "./dist/worklet.js":
/*!*************************!*\
  !*** ./dist/worklet.js ***!
  \*************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst logging_1 = __webpack_require__(/*! ./logging */ \"./dist/logging.js\");\nconst messages_1 = __webpack_require__(/*! ./messages */ \"./dist/messages.js\");\nconst resampler_1 = __webpack_require__(/*! ./resampler */ \"./dist/resampler.js\");\nclass Processor extends AudioWorkletProcessor {\n    constructor(options) {\n        super();\n        this._stopProcessing = false;\n        this.options = options.processorOptions;\n        this.port.onmessage = (ev) => {\n            if (ev.data === messages_1.Message.SpeechStop) {\n                logging_1.log.debug(\"Worklet received speech stop message\");\n                this._stopProcessing = true;\n            }\n        };\n        this.resampler = new resampler_1.Resampler({\n            nativeSampleRate: sampleRate,\n            targetSampleRate: 16000,\n            targetFrameSize: this.options.frameSamples,\n        });\n    }\n    process(inputs) {\n        if (this._stopProcessing) {\n            // This will not stop process from running, just a prerequisite for the browser to garbage collect\n            return false;\n        }\n        const r = inputs[0];\n        if (r === undefined) {\n            return true;\n        }\n        const arr = r[0];\n        if (arr === undefined) {\n            return true;\n        }\n        const frames = this.resampler.process(arr);\n        for (const frame of frames) {\n            this.port.postMessage({ message: messages_1.Message.AudioFrame, data: frame.buffer }, [frame.buffer]);\n        }\n        return true;\n    }\n}\nregisterProcessor(\"vad-helper-worklet\", Processor);\n//# sourceMappingURL=worklet.js.map\n\n//# sourceURL=webpack://@ricky0123/vad-web/./dist/worklet.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./dist/worklet.js");
/******/ 	
/******/ })()
;