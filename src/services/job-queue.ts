import { TestResult } from '../types';

export class JobQueue {
  private jobs: Map<string, TestResult>;
  private callback: (job: TestResult) => Promise<void>;

  constructor(processCallback: (job: TestResult) => Promise<void>) {
    this.jobs = new Map();
    this.callback = processCallback;
  }

  async enqueue(job: TestResult) {
    this.jobs.set(job.id, job);
    // Process job asynchronously
    setTimeout(() => this.processJob(job.id), 0);
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      await this.callback(job);
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
    } finally {
      this.jobs.delete(jobId);
    }
  }

  getJob(jobId: string): TestResult | undefined {
    return this.jobs.get(jobId);
  }
}