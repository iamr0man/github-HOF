const getRepos = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([1, 2, 3]), 3000);
  });
};
const getOwners = (repositories: unknown) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Array.isArray(repositories)) {
        return resolve('owners fetched');
      }
      return reject('repositories is empty');
    }, 3000);
  });
};

const generateId = () => Math.random() * 10000;

const initialState = [];

initialState.push({
  key: generateId(),
  name: 'getRepositories',
  cb: getRepos,
});
initialState.push({
  key: generateId(),
  name: 'getRepositories',
  cb: getRepos,
});

type Task = {
  readonly key: number;
  readonly name: string;
  readonly cb: (params?: any) => Promise<any>;
};

type Queue = {
  readonly start: () => void;
  readonly add: (task: Task) => void;
};

type QueueFactoryOptions = {
  readonly concurrency?: number;

  readonly process: (task: Task) => Promise<any>;
  readonly onSucceed?: (task: Task, result: any) => void;
  readonly onFailed?: (task: Task, err: unknown) => void;
};

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

const queue = createQueue(initialState, {
  process: handleJob,
  onSucceed,
  onFailed: onError,
});

queue.start();

function handleJob(task: Task) {
  console.log('Handle task', task);
  return task.cb();
}

const result = [];

function onSucceed(task: Task, value: any) {
  result.push(value);

  if (task.name === 'getRepositories') {
    queue.add({
      key: generateId(),
      name: 'getRepositoriesOwners',
      cb: () => getOwners(value),
    });
  }

  console.log('Complete', task, value);
}

function onError(task: Task, err: unknown) {
  console.log('Failed', task.key, err);
}
