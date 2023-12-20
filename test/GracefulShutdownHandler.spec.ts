/* eslint-disable @typescript-eslint/no-explicit-any */
import { GracefulShutdownHandler } from '../lib/GracefulShutdownHandler';
import Sinon from 'sinon';
import { delay, isValidNumber } from '../lib/utils';
// import { expect } from 'chai';

describe('GracefulShutdownHandler', () => {
  let processExitSpy: Sinon.SinonSpy<any[], any>;

  beforeEach(() => {
    processExitSpy = Sinon.spy();
    const impl = processExitSpy as unknown as (_?: number | undefined) => never;
    jest.spyOn(process, 'exit').mockImplementation(impl);
  });

  it('calls process.exit() with 0 code when everything has been shut down succesfully', async () => {
    const handler = new GracefulShutdownHandler();
    await handler.shutdown();
    expect(processExitSpy.calledWith(0)).toBeTruthy();
  });

  const timeoutTestFactory = (code?: number) => async () => {
    const timeout = 1;
    const opts = isValidNumber(code) ? { timeoutExitCode: code } : {};
    const handler = new GracefulShutdownHandler({ timeout, ...opts });
    handler.addCallback(() => new Promise(() => {})); // never resolves
    const promise = new Promise((resolve: any) =>
      handler.on('timeout', async () => {
        await delay(0.5);
        expect(processExitSpy.calledWith(isValidNumber(code) ? code : 1)).toBeTruthy();
        resolve();
      })
    );
    handler.shutdown();
    await promise;
  };

  it(
    'calls process.exit(1) and fires timeout event (when timed out)',
    timeoutTestFactory()
  );

  it(
    'calls process.exit(CUSTOM_CODE) and fires timeout event (when timed out)',
    timeoutTestFactory(0)
  );

  it('emits events in correct order during shutdown', async () => {
    const handler = new GracefulShutdownHandler();

    const cb = Sinon.spy();
    handler.addCallback(cb);
    const spyOnEvent = (name: any) => {
      const spy = Sinon.spy();
      handler.on(name, spy);
      return spy;
    };
    const beforeShutdown = spyOnEvent('beforeShutdown');
    const beforeExit = spyOnEvent('beforeExit');

    await handler.shutdown();
    expect(cb.calledAfter(beforeShutdown));
    expect(beforeExit.calledAfter(cb));
  });

  it('waits for non blocking callback', async () => {
    const handler = new GracefulShutdownHandler();
    const asyncOperationEndSpy = Sinon.spy();
    const cb = () => delay(2).then(asyncOperationEndSpy);
    handler.addCallback(cb);
    await handler.shutdown();
    expect(processExitSpy.calledAfter(asyncOperationEndSpy));
  });

  it('maintains proper order with sync callback', async () => {
    const handler = new GracefulShutdownHandler();
    const [f1, f2] = [Sinon.spy(), Sinon.spy()];
    handler.addCallback(f1, { order: 1 });
    handler.addCallback(f2, { order: -1 });
    await handler.shutdown();
    expect(f2.calledBefore(f1)).toBeTruthy();
  });

  it('maintains proper order with blocking async callback', async () => {
    const handler = new GracefulShutdownHandler();
    const [f1, f2] = [Sinon.spy(), Sinon.spy()];
    handler.addCallback(() => delay(1).then(f1), { order: 1, blocking: true });
    handler.addCallback(() => delay(1).then(f2), { order: -1, blocking: true });
    await handler.shutdown();
    expect(f2.calledBefore(f1)).toBeTruthy();
  });

  it('catches errors in sync callbacks and re-emits them', async () => {
    const msg = 'Error message';
    const handler = new GracefulShutdownHandler();
    handler.addCallback(() => {
      throw new Error(msg);
    });
    const promise = new Promise((resolve: any) => {
      handler.on('error', (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toEqual(msg);
        resolve();
      });
    });

    handler.shutdown();
    await promise;
  });

  it('catches rejections in async callbacks and re-emits them', async () => {
    const msg = 'Error message';
    const handler = new GracefulShutdownHandler();
    handler.addCallback(async () => {
      await delay(2);
      throw new Error(msg);
    });
    const promise = new Promise((resolve: any) => {
      handler.on('error', (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toEqual(msg);
        resolve();
      });
    });

    handler.shutdown();
    await promise;
  });
});
