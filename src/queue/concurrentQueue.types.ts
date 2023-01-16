export interface TaskItem {
  name: string;
  interval: number;
}
export interface Params {
  err: Error | string | null;
  result: TaskItem;
}
export type ProcessHandlerCallback = (params: Params) => void;
export type ProcessCallback = (
  task: TaskItem,
  callback: ProcessHandlerCallback,
) => void;
export type FailureCallback = (err: Error | string) => void;
export type DoneCallback = (params: Params) => void;
export type SuccessCallback = (result: TaskItem) => void;
export type DrainCallback = () => void;
