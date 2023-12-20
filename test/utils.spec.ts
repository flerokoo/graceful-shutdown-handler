import { delay } from '../lib/utils';

describe('utils.delay', () => {
  it('should expect seconds', async () => {
    const seconds = 2.5;
    const fuzziness = 0.1;
    const startTime = Date.now();
    await delay(seconds);
    const time = (Date.now() - startTime) / 1000;
    expect(time > seconds - fuzziness && time < seconds + fuzziness).toBeTruthy();
  });
});
