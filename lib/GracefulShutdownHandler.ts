import { delay, isPositiveNumber, assert, isValidNumber } from './utils';
import { TypeSafeEventEmitter } from './TypeSafeEventEmitter';

type CallbackFunction = (() => void) | (() => Promise<void>);

type GracefulShutdownHandlerOptions = {
  events: ('SIGINT' | 'SIGTERM' | 'uncaughtException' | 'unhandledRejection')[];
  timeout: number;
  timeoutExitCode: number;
  exitDelay: number;
};

type ShutdownCallback = {
  fn: CallbackFunction;
  blocking: boolean;
  order: number;
};

type ShutdownCallbackOptions = Partial<Pick<ShutdownCallback, 'blocking' | 'order'>>;

type EventTypesMap = {
  timeout: [];
  error: [_: Error];
  beforeExit: [];
  beforeShutdown: [];
};

export class GracefulShutdownHandler extends TypeSafeEventEmitter<EventTypesMap> {
  private _callbacks: ShutdownCallback[] = [];
  private _isShuttingDown: boolean = false;
  private _enabled: boolean = false;
  private _options: GracefulShutdownHandlerOptions;

  constructor(options?: Partial<GracefulShutdownHandlerOptions>) {
    super();
    options ??= {} as GracefulShutdownHandlerOptions;
    options.timeout ??= 30;
    options.exitDelay ??= 0.1;
    options.events ??= ['SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection'];
    options.timeoutExitCode ??= 1;
    assert(isPositiveNumber(options.timeout), 'timeout should be a positive number');
    assert(isValidNumber(options.timeoutExitCode), 'timeoutExitCode should be a number');
    assert(
      isPositiveNumber(options.exitDelay),
      'minimumShutdownTime should be a positive number'
    );
    assert(
      Array.isArray(options.events),
      'minimumShutdownTime should be a positive number'
    );
    this._options = options as GracefulShutdownHandlerOptions;
    this.addListeners();
  }

  public get isShuttingDown() {
    return this._isShuttingDown;
  }

  public get enabled() {
    return this._enabled;
  }

  public addCallback(fn: CallbackFunction, opts?: ShutdownCallbackOptions) {
    const blocking = Boolean(opts?.blocking);
    const order = isPositiveNumber(opts?.order) ? (opts!.order as number) : 0;
    this._callbacks.push({ fn, blocking, order });
  }

  private addListeners() {
    if (this.enabled || this.isShuttingDown) return;

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

  public async shutdown() {
    if (this.isShuttingDown) return;
    this._isShuttingDown = true;

    const { exitDelay, timeout, timeoutExitCode } = this._options;

    delay(timeout).then(() => {
      this.emit('timeout');
      console.log(timeoutExitCode);
      process.exit(timeoutExitCode);
    });

    const callbacks = this._callbacks.sort((a, b) => a.order - b.order);
    const nonBlockingPromises: Promise<void>[] = [];
    const handleError = (reason: unknown) => {
      const err = reason instanceof Error ? reason : new Error('Unknown error');
      this.emit('error', err);
    };

    for (const { fn, blocking } of callbacks) {
      let result: Promise<void> | void = undefined;
      try {
        result = fn();
      } catch (err: unknown) {
        handleError(err);
      }

      if (result instanceof Promise) {
        result.catch(handleError);
        if (blocking) {
          await result;
        } else {
          nonBlockingPromises.push(result);
        }
      }
    }
    await Promise.allSettled(nonBlockingPromises);
    await delay(exitDelay);
    this.emit('beforeExit');
    process.exit(0);
  }
}
