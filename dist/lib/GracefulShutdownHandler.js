"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GracefulShutdownHandler = void 0;
const utils_1 = require("./utils");
const TypeSafeEventEmitter_1 = require("./TypeSafeEventEmitter");
class GracefulShutdownHandler extends TypeSafeEventEmitter_1.TypeSafeEventEmitter {
    constructor(options) {
        var _a, _b, _c, _d;
        super();
        this._callbacks = [];
        this._isShuttingDown = false;
        this._enabled = false;
        options !== null && options !== void 0 ? options : (options = {});
        (_a = options.timeout) !== null && _a !== void 0 ? _a : (options.timeout = 30);
        (_b = options.exitDelay) !== null && _b !== void 0 ? _b : (options.exitDelay = 1);
        (_c = options.events) !== null && _c !== void 0 ? _c : (options.events = ['SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection']);
        (_d = options.timeoutExitCode) !== null && _d !== void 0 ? _d : (options.timeoutExitCode = 1);
        (0, utils_1.assert)((0, utils_1.isPositiveNumber)(options.timeout), 'timeout should be a positive number');
        (0, utils_1.assert)((0, utils_1.isValidNumber)(options.timeoutExitCode), 'timeoutExitCode should be a number');
        (0, utils_1.assert)((0, utils_1.isPositiveNumber)(options.exitDelay), 'minimumShutdownTime should be a positive number');
        (0, utils_1.assert)(Array.isArray(options.events), 'minimumShutdownTime should be a positive number');
        this._options = options;
    }
    get isShuttingDown() {
        return this._isShuttingDown;
    }
    get enabled() {
        return this._enabled;
    }
    addCallback(fn, opts) {
        const blocking = Boolean(opts === null || opts === void 0 ? void 0 : opts.blocking);
        const order = (0, utils_1.isPositiveNumber)(opts === null || opts === void 0 ? void 0 : opts.order) ? opts.order : 0;
        this._callbacks.push({ fn, blocking, order });
    }
    enable() {
        if (this.enabled || this.isShuttingDown)
            return;
        const shutdown = () => {
            this.emit('beforeShutdown');
            this.shutdown();
        };
        const { events: signals } = this._options;
        for (const signal of signals) {
            process.on(signal, shutdown);
        }
        this._enabled = true;
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isShuttingDown)
                return;
            this._isShuttingDown = true;
            const { exitDelay, timeout, timeoutExitCode } = this._options;
            (0, utils_1.delay)(timeout).then(() => {
                this.emit('timeout');
                console.log(timeoutExitCode);
                process.exit(timeoutExitCode);
            });
            const callbacks = this._callbacks.sort((a, b) => a.order - b.order);
            const nonBlockingPromises = [];
            const handleError = (reason) => {
                const err = reason instanceof Error ? reason : new Error('Unknown error');
                this.emit('error', err);
            };
            for (const { fn, blocking } of callbacks) {
                let result = undefined;
                try {
                    result = fn();
                }
                catch (err) {
                    handleError(err);
                }
                if (result instanceof Promise) {
                    result.catch(handleError);
                    if (blocking) {
                        yield result;
                    }
                    else {
                        nonBlockingPromises.push(result);
                    }
                }
            }
            yield Promise.allSettled(nonBlockingPromises);
            yield (0, utils_1.delay)(exitDelay);
            this.emit('beforeExit');
            process.exit(0);
        });
    }
}
exports.GracefulShutdownHandler = GracefulShutdownHandler;
