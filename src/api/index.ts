import { Owner, RateLimitResponse, RepositoryResponse } from '../result.types';
import { request } from '../request';

export enum Sort {
  stars = 'stars',
}

const { GITHUB_API_URL } = process.env;

const MAX_REPO_PER_PAGE = 3;

export const getRepositoriesRequest = (
  language: string,
): Promise<RepositoryResponse> => {
  const queryCreated = 'created:">2001-01-01';
  const searchRepoUrl = `${GITHUB_API_URL}/search/repositories`;
  const urlWithQuery = `${searchRepoUrl}?q=${queryCreated}&l=${language}&sort=${Sort.stars}&per_page=${MAX_REPO_PER_PAGE}`;

  return request<RepositoryResponse>(urlWithQuery);
};
export const getOwnerRequest = (
  userName: string | undefined,
): Promise<Owner> => {
  const searchUserUrl = `${GITHUB_API_URL}/users`;
  const urlWithQuery = `${searchUserUrl}/${userName}`;

  return request<Owner>(urlWithQuery);
};

export const getRateLimitRequest = (): Promise<RateLimitResponse> => {
  const rateLimitUrl = `${GITHUB_API_URL}/rate_limit`;

  return request<RateLimitResponse>(rateLimitUrl);
};
