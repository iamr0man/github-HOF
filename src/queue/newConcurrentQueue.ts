import { Queue, QueueFactoryOptions, Task } from './concurrentQueue.types';

export function createQueue(
  initialState: readonly Task[],
  params: QueueFactoryOptions,
): Queue {
  let queue = [...initialState];

  const concurrency = params.concurrency ?? 2;

  function handleLoop(): Promise<void> {
    const [job, ...rest] = queue;
    queue = rest;

    return params
      .process(job)
      .then((result) => {
        params.onSucceed?.(job, result);
      })
      .catch((err) => {
        params.onFailed?.(job, err);
      })
      .then(() => {
        if (queue.length > 0) {
          return handleLoop();
        }
      });
  }

  const startQueue = (): void => {
    const threads = new Array(concurrency)
      .fill(undefined)
      .map(() => handleLoop());

    Promise.allSettled(threads);
  };

  return {
    start: startQueue,
    add: (task) => queue.push(task),
  };
}
