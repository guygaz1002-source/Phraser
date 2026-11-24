/** Resolve no earlier than four seconds, and no later than ten, even offline. */
export function teachingWindow(
  prefetch: Promise<unknown>,
  minimum = 4000,
  maximum = 10000,
) {
  let minTimer: ReturnType<typeof setTimeout>,
    maxTimer: ReturnType<typeof setTimeout>;
  const min = new Promise<void>((resolve) => {
    minTimer = setTimeout(resolve, minimum);
  });
  const max = new Promise<void>((resolve) => {
    maxTimer = setTimeout(resolve, maximum);
  });
  const promise = Promise.race([
    Promise.all([min, prefetch.catch(() => false)]),
    max,
  ])
    .then(() => undefined)
    .finally(() => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    });
  return {
    promise,
    cancel: () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    },
  };
}
