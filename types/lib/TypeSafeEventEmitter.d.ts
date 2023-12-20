/// <reference types="node" />
import EventEmitter from 'events';
export declare class TypeSafeEventEmitter<TEventMap extends Record<string, any>> {
    private _emitter;
    constructor();
    emit<T extends keyof TEventMap & string>(eventName: T, ...args: TEventMap[T]): void;
    on<T extends keyof TEventMap & string>(eventName: T, handler: (...args: TEventMap[T]) => void): EventEmitter;
    off<T extends keyof TEventMap & string>(eventName: T, handler: (...args: TEventMap[T]) => void): EventEmitter;
}
