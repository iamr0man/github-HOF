import { Queue, QueueFactoryOptions } from './concurrentQueue.types';

export function createQueue<T, R>(
  initialState: readonly T[],
  params: QueueFactoryOptions<T, R>,
): Queue<T> {
  let queue = [...initialState];

  const concurrency = params.concurrency ?? 2;

  function handleLoop(): Promise<void> {
    const [job, ...rest] = queue;
    queue = rest;

    return params
      .process(job)
      .then((result) => {
        return params.onSucceed?.(job, result);
      })
      .catch((err) => {
        return params.onFailed?.(job, err);
      })
      .then(() => {
        if (queue.length > 0) {
          return handleLoop();
        }
      });
  }

  const startQueue = (): Promise<void[]> => {
    const threads = new Array(concurrency)
      .fill(undefined)
      .map(() => handleLoop());

    return Promise.all(threads);
  };

  const clear = () => {
    queue = [];
  };

  return {
    start: startQueue,
    add: (task) => queue.push(task),
    clear,
  };
}
