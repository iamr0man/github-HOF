import { expect, jest, describe, beforeEach, test, afterAll } from '@jest/globals';
import { AxiosError } from 'axios';
import { getOwnerRequest, getRepositoriesRequest } from './index';
import { MAX_REPO_PER_PAGE } from '../constants';

jest.setTimeout(10000);

describe('getRepositoriesRequest', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('should handle default repositories length per page', async () => {
    const result = await getRepositoriesRequest('javascript', 1);
    expect(result.data.items.length).toEqual(MAX_REPO_PER_PAGE);
  });
});

describe('getOwnerRequest', () => {
  test('should handle empty owner login', async () => {
    try {
      await getOwnerRequest('');
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        expect(err.message).toEqual('Request failed with status code 404');
        expect(err.response?.status).toEqual(404);
      }
    }
  });
});
