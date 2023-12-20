export const isValidNumber = (n: unknown) => typeof n === 'number' && !isNaN(n);
export const isPositiveNumber = (n: unknown) => isValidNumber(n) && (n as number) > 0;
export const assert = (c: boolean, msg: string) => {
  if (!c) throw new Error(msg);
};
export const delay = (seconds: number) : Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));
