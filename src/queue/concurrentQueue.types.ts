export interface TaskItem {
  name: string;
  fn: () => Promise<any>;
  result: any;
}
export interface Params {
  err: Error | string | null;
  result: TaskItem;
}
export type ProcessHandlerCallback = (params: Params) => void;
export type ProcessCallback<T> = (task: TaskItem) => Promise<T>;
export type FailureCallback = (err: Error | string) => void;
export type DoneCallback = (params: Params) => void;
export type SuccessCallback = (result: TaskItem) => void;
export type DrainCallback = () => void;
