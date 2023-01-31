import * as dotenv from 'dotenv';

import { logError } from './logger';

import { WrongInputError } from './errors/wrongInputError';
import { EmptyInputError } from './errors/emptyInputError';
import { MaxLengthError } from './errors/maxLengthError';

import { Owner, Repository, Response } from './result.types';
import { request } from './request';
import {
  Params,
  ProcessHandlerCallback,
  TaskItem,
} from './queue/concurrentQueue.types';
import { Queue } from './queue/concurrentQueue';

dotenv.config();

const { GITHUB_API_URL } = process.env;

const MAX_REPO_PER_PAGE = 3;
const MAX_LANGUAGE_LENGTH = 100;

enum SORT {
  stars = 'stars',
}

const getRepositoriesRequest = (
  language: string,
): Promise<Response> | never => {
  const queryCreated = 'created:">2001-01-01';
  const searchRepoUrl = `${GITHUB_API_URL}/search/repositories`;
  const urlWithQuery = `${searchRepoUrl}?q=${queryCreated}&l=${language}&sort=${SORT.stars}&per_page=${MAX_REPO_PER_PAGE}`;
  return request<Response>(urlWithQuery);
};
const getOwnerRequest = (userName: string): Promise<Owner> | never => {
  const searchUserUrl = `${GITHUB_API_URL}/users`;
  const urlWithQuery = `${searchUserUrl}/${userName}`;
  return request<Owner>(urlWithQuery);
};

const getOwnerDetails = async (repository: Repository) =>
  getOwnerRequest(repository.owner.login);

type Result = [Repository, Owner][];

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

  const job = (task: TaskItem, callback: ProcessHandlerCallback) => {
    task
      .fn()
      .then((newValue) =>
        callback({ err: null, result: { ...task, result: newValue } }),
      );
  };

  const doneCallback = ({ result }: Params) => {
    const { count } = queue;
    console.log(`Done: ${result.name}, count:${count}`);
  };

  const queue = Queue.channels(3)
    .process(job)
    .done(doneCallback)
    .success((res) => console.log(`Success: ${res.name}`))
    .failure((err) => console.log(`Failure: ${err}`));

  try {
    // const response: Response = await getRepositoriesRequest(language);
    queue.add({
      name: 'repos',
      fn: () => getRepositoriesRequest(language),
      result: null,
    });
    // const listOfRepositories = queue.get('repos');

    // const ownerPromises: Promise<Owner>[] = listOfRepositories.reduce(
    //   (acc, repository) => [...acc, getOwnerDetails(repository)],
    //   [] as Promise<Owner>[],
    // );
    // queue.add(() => Promise.all(ownerPromises));

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
