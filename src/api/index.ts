import { Owner, RepositoryResponse } from '../result.types';
import { request } from '../request';
import { MAX_REPO_PER_PAGE } from '../constants';

export enum Sort {
  stars = 'stars',
}

const { GITHUB_API_URL } = process.env;

const DEFAULT_PAGE = 1;

export const getRepositoriesRequest = (language: string, page?: number, perPage = MAX_REPO_PER_PAGE) => {
  const queryCreated = 'created:">2001-01-01';
  const searchRepoUrl = `${GITHUB_API_URL}/search/repositories`;
  const urlWithQuery = `${searchRepoUrl}?q=${queryCreated}&l=${language}&sort=${Sort.stars}&per_page=${perPage}&page=${
    page || DEFAULT_PAGE
  }`;

  return request<RepositoryResponse>(urlWithQuery);
};
export const getOwnerRequest = (userName: string | undefined) => {
  const searchUserUrl = `${GITHUB_API_URL}/users`;
  const urlWithQuery = `${searchUserUrl}/${userName}`;

  return request<Owner>(urlWithQuery);
};
