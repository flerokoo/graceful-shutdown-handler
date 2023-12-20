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
export declare class GracefulShutdownHandler extends TypeSafeEventEmitter<EventTypesMap> {
    private _callbacks;
    private _isShuttingDown;
    private _enabled;
    private _options;
    constructor(options?: Partial<GracefulShutdownHandlerOptions>);
    get isShuttingDown(): boolean;
    get enabled(): boolean;
    addCallback(fn: CallbackFunction, opts?: ShutdownCallbackOptions): void;
    enable(): void;
    shutdown(): Promise<void>;
}
export {};
