# Graceful Shutdown Handler
This is an utility package for shutting down gracefully virtually anything: servers, database connections, workers, etc.

`GracefulShutdownHandler` waits for certain signal from user, uncaught error or unhandler rejection and, instead of exiting right away, it allows all provided callbacks to complete. 




# Usage example
```sh
npm i @flerokoo/graceful-shutdown-handler
```

```ts
import GracefulShutdownHandler from "graceful-shutdown-handler";

const handler = new GracefulShutdownHandler({
  // events that trigger shutdown (default: ['SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection'])
  events: ['SIGINT', 'SIGTERM'], 
  // maximum amount of time that callbacks are allowed to run (default: 30)
  timeout: 15, 
  // exit code to use when timeout happens (default: 1)
  timeoutExitCode: 0, 
  // extra exit delay, may useful for logging (default: 0.1)
  exitDelay: 1
});

handler.addCallback(() => {
  cleanupOrSomething();
  console.log('cleaned up')
})

// async callbacks are supported too
handler.addCallback(async () => {
  console.log("performing async operation...");
  await someAsyncOperation();
  console.log("async operation performed");
}, {
  // When true: handler will wait for this async operation to complete before starting next one (default: false)
  blocking: true,
  // Order of execution (default: 0)
  order: -1 
});

```

### More examples [here](examples/)