import { FailCb, ProcessCb, Queue, QueueFactoryOptions, SuccessCb } from './concurrentQueue.types';

export function createQueue<T, R>(initialState: readonly T[], params?: QueueFactoryOptions): Queue<T, R> {
  let queue = [...initialState];

  let process: ProcessCb<T, R> | null = null;
  let onSuccess: SuccessCb<T, R> | null = null;
  let onFailed: FailCb<T> | null = null;

  const concurrency = params?.concurrency ?? 2;

  function handleLoop(): Promise<void> {
    const [job, ...rest] = queue;
    queue = rest;

    if (!process) {
      return Promise.reject('No callbacks providen');
    }

    return process(job)
      .then((result) => {
        return onSuccess?.(job, result);
      })
      .catch((err) => {
        return onFailed?.(job, err);
      })
      .then(() => {
        if (queue.length > 0) {
          return handleLoop();
        }
      });
  }

  const startQueue = (): Promise<void[]> => {
    const threads = new Array(concurrency).fill(undefined).map(() => handleLoop());

    return Promise.all(threads);
  };

  const clear = () => {
    queue = [];
  };

  const onProcess = (processCb: ProcessCb<T, R>) => {
    process = processCb;
  };

  const onSucceed = (successCb: SuccessCb<T, R>) => {
    onSuccess = successCb;
  };

  const onFail = (failCb: FailCb<T>) => {
    onFailed = failCb;
  };

  return {
    start: startQueue,
    add: (task) => queue.push(task),
    clear,

    onProcess,
    onSucceed,
    onFail,
  };
}
