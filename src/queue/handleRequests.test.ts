import { axiosInstance } from '../request';
import MockAdapter from 'axios-mock-adapter';
import { expect, jest, describe, beforeEach, test, afterAll } from '@jest/globals';
import { handleRepositoriesByQueue } from './handleRequests';

jest.setTimeout(10000);

const mock = new MockAdapter(axiosInstance);

describe('handleRepositoriesByQueue', () => {
  const OLD_ENV = process.env;

  const setRateLimitError = (url: string | RegExp) => {
    mock?.onGet(url).reply(
      403,
      {
        message: 'API rate limit exceeded',
      },
      { 'x-ratelimit-remaining': '0' },
    );
  };

  beforeEach(() => {
    jest.resetModules();
    mock.reset();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    mock?.restore();
    process.env = OLD_ENV;
  });

  test('should handle empty repository list', async () => {
    mock.onAny().passThrough();
    const result = await handleRepositoriesByQueue('javascript', 0);
    expect(result).toEqual([]);
  });

  test('should handle single repository', async () => {
    mock.onAny().passThrough();
    const result = await handleRepositoriesByQueue('javascript', 1);

    expect(result.length).toEqual(1);
    expect(result[0][1]).not.toBeNull();
  });

  test('should handle repository rate limit error', async () => {
    const searchRepoUrl = /.+\w\/search\/repositories.+/g;

    setRateLimitError(searchRepoUrl);

    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(result).toEqual([]);
  });

  test('should handle owner rate limit error', async () => {
    const searchRepoUrl = /.+\w\/search\/repositories.+/g;
    const searchUserUrl = /.+\/users\/.+/g;

    mock?.onGet(searchRepoUrl).passThrough().onGet(searchUserUrl).reply(
      403,
      {
        message: 'API rate limit exceeded',
      },
      { 'x-ratelimit-remaining': '0' },
    );

    const result = await handleRepositoriesByQueue('java', 1);
    expect(result).toEqual([[expect.any(Object), null]]);
  });

  test('should handle multiple repositories', async () => {
    mock.onAny().passThrough();
    const result = await handleRepositoriesByQueue('javascript', 10);

    expect(result.length).toEqual(10);
    expect(result.every(([_, owner]) => owner !== null)).toBe(true);
  });

  test('should handle error when getting repositories', async () => {
    const searchRepoUrl = /.+\/search\/repositories.+/g;

    mock.onGet(searchRepoUrl).reply(404, {
      message: 'Request failed with status code 404',
    });

    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(result).toEqual([]);
  });

  test('should handle error when getting owner', async () => {
    const searchRepoUrl = /.+\/search\/repositories.+/g;
    const searchUserUrl = /.+\/users\/.+/g;

    mock?.onGet(searchRepoUrl).passThrough().onGet(searchUserUrl).reply(404, {
      message: 'Request failed with status code 404',
    });

    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(result).toEqual([[expect.any(Object), null]]);
  });
});
