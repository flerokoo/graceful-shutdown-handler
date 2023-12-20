"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.assert = exports.isPositiveNumber = exports.isValidNumber = void 0;
const isValidNumber = (n) => typeof n === 'number' && !isNaN(n);
exports.isValidNumber = isValidNumber;
const isPositiveNumber = (n) => (0, exports.isValidNumber)(n) && n > 0;
exports.isPositiveNumber = isPositiveNumber;
const assert = (c, msg) => {
    if (!c)
        throw new Error(msg);
};
exports.assert = assert;
const delay = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
exports.delay = delay;
