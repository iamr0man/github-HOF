import { TaskNameError } from './concurrentQueue.types';
import { handleRepositoriesByQueue } from './handleRequests';
import { expect, jest, describe, it } from '@jest/globals';
import { RequestData } from '../request';
import { Owner, RepositoryResponse } from '../result.types';

type RequestHeaders = Promise<Pick<RequestData<RepositoryResponse>, 'headers'>>;
type OwnerRequest = Promise<Omit<RequestData<Pick<Owner, 'login'>>, 'headers'>>;

describe('handleRepositoriesByQueue', () => {
  it('should handle empty repository list', async () => {
    const result = await handleRepositoriesByQueue('javascript', 0);
    expect(result).toEqual([]);
  });

  it('should handle single repository', async () => {
    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(result.length).toEqual(1);
    expect(result[0][1]).not.toBeNull();
  });

  it('should handle multiple repositories', async () => {
    const result = await handleRepositoriesByQueue('javascript', 10);
    expect(result.length).toEqual(10);
    expect(result.every(([_, owner]) => owner !== null)).toBe(true);
  });

  it('should handle rate limit error', async () => {
    const getRepositoriesRequest = jest.fn<() => RequestHeaders>().mockResolvedValueOnce({
      headers: { 'x-ratelimit-remaining': '0' },
    });
    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(getRepositoriesRequest).toHaveBeenCalled();
    expect(result).toEqual([[null, TaskNameError.RATE_LIMIT_ERROR]]);
  });

  it('should handle empty owner login', async () => {
    const getOwnerRequest = jest.fn<() => OwnerRequest>().mockResolvedValueOnce({
      data: { login: '' },
    });
    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(getOwnerRequest).toHaveBeenCalled();
    expect(result).toEqual([[expect.any(Object), null]]);
  });

  it('should handle error when getting repositories', async () => {
    const getRepositoriesRequest = jest.fn<() => Promise<string>>().mockRejectedValueOnce('error');
    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(getRepositoriesRequest).toHaveBeenCalled();
    expect(result).toEqual([[null, null]]);
  });

  it('should handle error when getting owner', async () => {
    const getOwnerRequest = jest.fn<() => Promise<string>>().mockRejectedValueOnce('error');
    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(getOwnerRequest).toHaveBeenCalled();
    expect(result).toEqual([[expect.any(Object), null]]);
  });

  it('should handle empty task', async () => {
    const result = await handleRepositoriesByQueue('javascript', 1);
    expect(result).not.toBeNull();
  });
});