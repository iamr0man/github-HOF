import {
  Status,
  TaskName,
  TaskNameError,
  TaskResult,
} from './concurrentQueue.types';
import { RATE_LIMIT_HEADER } from '../constants';

type PropsCallback<T> = () => T;

type TaskProcessState = {
  params?: any;
};

export function createTaskProcess(taskName: TaskName) {
  let state: TaskProcessState = {};

  return {
    getProps: function <T>(cb: PropsCallback<T>) {
      const params = cb();
      state = { ...state, params };
      return this;
    },
    _createRateLimitError: function <T>(name: TaskName) {
      return {
        name,
        status: Status.ERROR,
        result: {
          name: TaskNameError.RATE_LIMIT_ERROR,
        },
      } as T;
    },

    _createTaskResult: function <T>(name: TaskName, result: TaskResult['result']) {
      return {
        name,
        status: Status.SUCCESS,
        result,
      } as T;
    },

    checkResponse: function <T>(response): T {
      const remainingRateLimit = response.headers[RATE_LIMIT_HEADER];
      if (Number(remainingRateLimit) === 0) {
        return this._createRateLimitError(taskName);
      }

      return this._createTaskResult(taskName, response.data);
    },

    execute: async function <T>(getRequest: (...args: any[]) => Promise<any>): Promise<T> {
      const response = await getRequest(state.params);

      return this.checkResponse(response);
    },
  };
}
