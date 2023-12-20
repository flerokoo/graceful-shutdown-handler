/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import GracefulShutdownHandler from '../';

const app = express();
const handler = new GracefulShutdownHandler();

// Graceful shutdown middleware that keeps track of incomplete requests
const runningRequests = new Set();
app.use((req, res, next) => {
  if (handler.isShuttingDown) {
    const HTTP_SERVICE_UNAVAILABLE = 503;
    res.status(HTTP_SERVICE_UNAVAILABLE).json({
      status: 'error',
      reason: 'Server is shutting down'
    });
    return;
  }

  runningRequests.add(req);
  const detach = () => runningRequests.delete(req);
  res.on('close', detach);
  res.on('error', detach);

  next();
});

// Test route
app.get("/*", (req, res) => {
  setTimeout(() => res.end(), 10000);
});

const server = app.listen(3000);

// This callback will wait until all running requests end
handler.addCallback(
  async () => {
    const delay = (seconds: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    console.log('going to handle running requests')
    while (runningRequests.size > 0) {
      await delay(1);
      console.log(`still have ${runningRequests.size} requests to handle`);
    }
    console.log('all running requests have been handled');
  },
  {
    blocking: true,
    order: -1
  }
);

// This callback will execute AFTER all requests end 
// (note the `order` and `blocking` options on previus callback)
handler.addCallback(() => {
  console.log('closing server');
  return new Promise((resolve: any) => {
    server.close(resolve);
  }).then(() => console.log('server has been closed'));
});




