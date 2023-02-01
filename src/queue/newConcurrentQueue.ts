import {
  Queue,
  QueueFactoryOptions,
  Result,
  Task,
} from './concurrentQueue.types';

const getRepos = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([1, 2, Math.floor(Math.random() * 100)]), 3000);
  });
};
const getOwners = (repositories: unknown) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Array.isArray(repositories)) {
        return resolve(repositories);
      }
      return reject('repositories is empty');
    }, 3000);
  });
};

const generateId = () => Math.floor(Math.random() * 100);

const initialState = [];

const GET_REPOSITORIES = 'GET_REPOSITORIES';
const GET_OWNERS = 'GET_OWNERS';

initialState.push({
  key: generateId(),
  name: GET_REPOSITORIES,
});

initialState.push({
  key: generateId(),
  name: GET_REPOSITORIES,
});

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

const taskCallbackMap: Record<string, (props?: unknown) => Promise<unknown>> = {
  [GET_REPOSITORIES]: getRepos,
  [GET_OWNERS]: (repositories) => getOwners(repositories),
};
let result: Result = [];

function handleJob(task: Task) {
  console.log('Handle task', task);
  const fn = taskCallbackMap[task.name];
  const [repositories, ...newValue] = result;

  switch (task.name) {
    case GET_REPOSITORIES:
      return fn();
    case GET_OWNERS:
      result = newValue;
      return fn(repositories);
    default:
      return fn();
  }
}

function onSucceed(task: Task, value: unknown) {
  result.push(value);

  if (task.name === GET_REPOSITORIES) {
    queue.add({
      key: generateId(),
      name: GET_OWNERS,
    });
  }

  console.log('Complete', task, value);
}

function onError(task: Task, err: unknown) {
  console.log('Failed', task.key, err);
}

const queue = createQueue(initialState, {
  process: handleJob,
  onSucceed,
  onFailed: onError,
});

queue.start();
