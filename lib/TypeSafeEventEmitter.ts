import EventEmitter from 'events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TypeSafeEventEmitter<TEventMap extends Record<string, any>> {
  private _emitter: EventEmitter;
  constructor() {
    this._emitter = new EventEmitter();
  }

  emit<T extends keyof TEventMap & string>(eventName: T, ...args: TEventMap[T]) {
    this._emitter.emit(eventName, ...(args as []));
  }

  on<T extends keyof TEventMap & string>(
    eventName: T,
    handler: (...args: TEventMap[T]) => void
  ) {
    return this._emitter.on(eventName, handler as never);
  }

  off<T extends keyof TEventMap & string>(
    eventName: T,
    handler: (...args: TEventMap[T]) => void
  ) {
    return this._emitter.off(eventName, handler as never);
  }
}
