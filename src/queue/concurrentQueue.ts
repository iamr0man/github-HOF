import {
  DoneCallback,
  DrainCallback,
  FailureCallback,
  ProcessCallback,
  Params,
  SuccessCallback,
  TaskItem,
} from './concurrentQueue.types';

export class Queue {
  private readonly concurrency: number;
  count: number;
  processedTask: TaskItem[];

  private onProcess: ProcessCallback | undefined;
  private onFailure: FailureCallback | undefined;
  private onDone: DoneCallback | undefined;
  private onSuccess: SuccessCallback | undefined;
  private onDrain: DrainCallback | undefined;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
    this.count = 0;
    // this.waitingTask = [];
  }

  static channels(concurrency: number) {
    return new Queue(concurrency);
  }

  add(task: TaskItem) {
    const hasChannels = this.count < this.concurrency;
    if (hasChannels) {
      this.next(task);
    }
  }

  processHandler({ err, result }: Params) {
    if (err && this.onFailure) {
      this.onFailure(err);
    } else if (this.onSuccess) {
      this.onSuccess(result);
    }
    if (this.onDone) {
      this.onDone({ err, result });
    }

    this.count--;
    if (this.count === 0 && this.onDrain) {
      this.onDrain();
    }
  }

  next(task: TaskItem) {
    this.count++;
    if (!this.onProcess) {
      return;
    }
    this.onProcess(task, this.processHandler.bind(this));
  }

  process(callback: ProcessCallback) {
    this.onProcess = callback;
    return this;
  }

  done(callback: DoneCallback) {
    this.onDone = callback;
    return this;
  }

  failure(callback: FailureCallback) {
    this.onFailure = callback;
    return this;
  }

  success(callback: SuccessCallback) {
    this.onSuccess = callback;
    return this;
  }
}
