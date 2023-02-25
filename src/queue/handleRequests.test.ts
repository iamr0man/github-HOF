import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { expect, jest, describe, beforeEach, test, afterAll } from '@jest/globals';
import { handleRepositoriesByQueue } from './handleRequests';

jest.setTimeout(10000);

describe('handleRepositoriesByQueue', () => {
  const OLD_ENV = process.env;
  let mock: MockAdapter | null = null;

  const setRateLimitError = (url: string | RegExp) => {
    mock?.onGet(url).reply(
      403,
      {
        message: 'API rate limit exceeded',
      },
      { 'x-ratelimit-remaining': '0' },
    );
  };

  const setValidationError = (url: string | RegExp) => {
    mock?.onGet(url).reply(404, {
      message: 'Request failed with status code 404',
    });
  };

  beforeEach(() => {
    mock = new MockAdapter(axios);
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    mock?.restore();
    process.env = OLD_ENV;
  });

  test('should handle empty repository list', async () => {
    const result = await handleRepositoriesByQueue('javascript', 0);
    expect(result).toEqual([]);
  });

  test('should handle single repository', async () => {
    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(result.length).toEqual(1);
    expect(result[0][1]).not.toBeNull();
  });

  test('should handle repository rate limit error', async () => {
    const searchRepoUrl = /\/search\/repositories\/w+/g;

    setRateLimitError(searchRepoUrl);

    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(result).toEqual([]);
  });

  test('should handle owner rate limit error', async () => {
    const searchUserUrl = /\/users\/\w+/g;

    setRateLimitError(searchUserUrl);

    const result = await handleRepositoriesByQueue('java', 1);
    expect(result).toEqual([expect.any(Object), null]);
  });

  test('should handle multiple repositories', async () => {
    const result = await handleRepositoriesByQueue('javascript', 10);
    expect(result.length).toEqual(10);
    expect(result.every(([_, owner]) => owner !== null)).toBe(true);
  });

  test('should handle error when getting repositories', async () => {
    const searchRepoUrl = /\/search\/repositories\/w+/g;

    mock?.onGet(searchRepoUrl).reply(404, {
      message: 'Request failed with status code 404',
    });

    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(result).toEqual([]);
  });

  test('should handle error when getting owner', async () => {
    const searchUserUrl = /\/users\/\w+/g;
    setValidationError(searchUserUrl);

    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(result).toEqual([expect.any(Object), null]);
  });
});
