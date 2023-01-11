import * as dotenv from 'dotenv';
import { logError, logSuccess } from './logger';

import { WrongInputError } from './errors/wrongInputError';
import { EmptyInputError } from './errors/emptyInputError';
import { MaxLengthError } from './errors/maxLengthError';
import * as https from 'https';

import { IncomingMessage } from 'http';
import { Owner, Repository, Response } from './result.types';

dotenv.config();

const GITHUB_API_URL = 'https://api.github.com';
const MAX_REPO_PER_PAGE = 3;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

enum SORT {
  stars = 'stars',
}

const getRepositoriesRequest = (
  language: string,
): Promise<Response> | never => {
  const queryCreated = 'created:">2018-01-30';
  const searchRepoUrl = `${GITHUB_API_URL}/search/repositories`;
  const urlWithQuery = `${searchRepoUrl}?q=${queryCreated}&l=${language}&sort=${SORT.stars}&per_page=${MAX_REPO_PER_PAGE}`;
  const options = {
    headers: {
      'user-agent': USER_AGENT,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  };
  return new Promise((resolve) => {
    const callback = (res: IncomingMessage) => {
      if (res.statusCode === 422) {
        throw new Error('Validation failed, or the endpoint has been spammed.');
      }
      if (res.statusCode === 503) {
        throw new Error('Service unavailable');
      }

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        logSuccess(data);
        resolve(JSON.parse(data));
      });
    };

    https.request(urlWithQuery, options, callback).end();
  });
};
const getOwnerRequest = (userName: string): Promise<Owner> | never => {
  const searchUserUrl = `${GITHUB_API_URL}/users`;
  const urlWithQuery = `${searchUserUrl}/${userName}`;
  const options = {
    headers: {
      'user-agent': USER_AGENT,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  };
  return new Promise((resolve) => {
    const callback = (res: IncomingMessage) => {
      if (res.statusCode === 422) {
        throw new Error('Validation failed, or the endpoint has been spammed.');
      }
      if (res.statusCode === 503) {
        throw new Error('Service unavailable');
      }

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        logSuccess(data);
        resolve(JSON.parse(data));
      });
    };

    https.request(urlWithQuery, options, callback).end();
  });
};

const getOwnerDetails = async (repository: Repository) => {
  return getOwnerRequest(repository.owner.login);
};

type Result = [Repository, Owner][];

export async function getRepositories(
  language: string | undefined,
): Promise<string | Error> {
  // validation
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
  if (language.length > 100) {
    const error = new MaxLengthError('Max length overcome');
    logError(error);
    return Promise.reject(error);
  }
  try {
    const response: Response = await getRepositoriesRequest(language);
    const listOfRepositories = response.items;

    const ownerPromises: Promise<Owner>[] = listOfRepositories.reduce(
      (acc, repository) => [...acc, getOwnerDetails(repository)],
      [] as Promise<Owner>[],
    );
    const owners = await Promise.all(ownerPromises);

    const result: Result = listOfRepositories.reduce(
      (acc, curr, index) => [...acc, [curr, owners[index]]],
      [] as Result,
    );
    return Promise.resolve(result);
  } catch (err) {
    logError(err);
    return Promise.reject(err);
  }
}

// getRepositories('javascript')
//   .then((res) => console.log(res))
//   .catch((err) => console.log(err));
