import * as dotenv from 'dotenv';

import { logError } from './logger';

import { WrongInputError } from './errors/wrongInputError';
import { EmptyInputError } from './errors/emptyInputError';
import { MaxLengthError } from './errors/maxLengthError';

import { Owner, RepositoryResponse } from './result.types';
import { request } from './request';

import { createQueue } from './queue/newConcurrentQueue';
import {
  RateLimit,
  RateLimitResponse,
  Result,
  Task,
  TaskResult,
} from './queue/concurrentQueue.types';

dotenv.config();

const { GITHUB_API_URL } = process.env;

const MAX_REPO_PER_PAGE = 3;
const MAX_LANGUAGE_LENGTH = 100;

enum SORT {
  stars = 'stars',
}

const getRepositoriesRequest = (
  language: string,
): Promise<RepositoryResponse> | never => {
  const queryCreated = 'created:">2001-01-01';
  const searchRepoUrl = `${GITHUB_API_URL}/search/repositories`;
  const urlWithQuery = `${searchRepoUrl}?q=${queryCreated}&l=${language}&sort=${SORT.stars}&per_page=${MAX_REPO_PER_PAGE}`;

  return request<RepositoryResponse>(urlWithQuery);
};
const getOwnerRequest = (userName: string): Promise<Owner> | never => {
  const searchUserUrl = `${GITHUB_API_URL}/users`;
  const urlWithQuery = `${searchUserUrl}/${userName}`;

  return request<Owner>(urlWithQuery);
};
const getOwnerDetails = async (repositories: RepositoryResponse) => {
  const ownerPromises = repositories.items.map((repository) =>
    getOwnerRequest(repository.owner.login),
  );
  return Promise.all(ownerPromises);
};

const getRateLimitRequest = (): Promise<RateLimitResponse> | never => {
  const rateLimitUrl = `${GITHUB_API_URL}/rate_limit`;

  return request<RateLimitResponse>(rateLimitUrl);
};

const generateId = () => Math.floor(Math.random() * 100);

export async function getRepositories(
  language: string | undefined,
): Promise<Result | Error> {
  if (typeof language !== 'string') {
    const error = new WrongInputError('Wrong input data');
    logError(error);
    return Promise.reject(error);
  }
  if (language.length === 0) {
    const error = new EmptyInputError('Empty input');
    logError(error);
    return Promise.reject(error);
  }
  if (language.length > MAX_LANGUAGE_LENGTH) {
    const error = new MaxLengthError('Max length overcome');
    logError(error);
    return Promise.reject(error);
  }

  const GET_REPOSITORIES = 'GET_REPOSITORIES';
  const GET_OWNERS = 'GET_OWNERS';
  const GET_RATE_LIMIT = 'GET_RATE_LIMIT';

  try {
    const initialState: Task[] = [];
    let taskResult: TaskResult = [];

    const taskCallbackMap: Record<string, (props?: any) => Promise<unknown>> = {
      [GET_REPOSITORIES]: (language) => getRepositoriesRequest(language),
      [GET_OWNERS]: (repositories) => getOwnerDetails(repositories),
      [GET_RATE_LIMIT]: getRateLimitRequest,
    };

    const process = (task: Task) => {
      console.log('Handle task', task);

      const fn = taskCallbackMap[task.name];
      const [repositories, ...newValue] = taskResult;

      switch (task.name) {
        case GET_REPOSITORIES:
          return fn(language);
        case GET_OWNERS:
          taskResult = newValue;
          return fn(repositories);
        default:
          return fn();
      }
    };

    const rateLimit = await getRateLimitRequest();
    let searchRate: Pick<RateLimit, 'limit' | 'remaining'> =
      rateLimit.resources.search;

    const onSucceed = (task: Task, value: unknown) => {
      console.log('Complete', task, value);

      switch (task.name) {
        case GET_RATE_LIMIT:
          searchRate = (value as RateLimitResponse).resources.search;
          break;
        default:
          taskResult.push(value);
      }
    };

    const onFailed = (task: Task, err: unknown) => {
      console.log('Failed', task.key, err);
    };

    let maxAvailableRate = searchRate.remaining;

    while (maxAvailableRate > 0) {
      initialState.push({
        key: generateId(),
        name: GET_REPOSITORIES,
      });
      initialState.push({
        key: generateId(),
        name: GET_OWNERS,
      });
      maxAvailableRate--;
    }

    const queue = createQueue(initialState, {
      process,
      onSucceed,
      onFailed,
    });
    queue.start();
    //
    // const result: Result = listOfRepositories.reduce(
    //   (acc, curr, index) => [...acc, [curr, owners[index]]],
    //   [] as Result,
    // );
    return Promise.resolve([]);
  } catch (err) {
    logError(err);
    return Promise.reject(err);
  }
}

getRepositories('javascript')
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
