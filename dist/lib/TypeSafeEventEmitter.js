"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeSafeEventEmitter = void 0;
const events_1 = __importDefault(require("events"));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class TypeSafeEventEmitter {
    constructor() {
        this._emitter = new events_1.default();
    }
    emit(eventName, ...args) {
        this._emitter.emit(eventName, ...args);
    }
    on(eventName, handler) {
        return this._emitter.on(eventName, handler);
    }
    off(eventName, handler) {
        return this._emitter.off(eventName, handler);
    }
}
exports.TypeSafeEventEmitter = TypeSafeEventEmitter;
