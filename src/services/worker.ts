import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { TestResult } from "../types";
import { DB } from "../db";
import { Logger, LogMessage } from "./logger";

const execAsync = promisify(exec);

export class Worker {
  private db: DB;
  private logger: Logger;

  constructor(db: DB) {
    this.db = db;
    this.logger = new Logger();
  }

  async processJob(job: TestResult): Promise<void> {
    try {
      this.logger.log({
        level: "info",
        message: "Starting job processing",
        timestamp: new Date().toISOString(),
        jobId: job.id,
      });

      // Update job status to in-progress
      job.status = "in-progress";
      job.startTime = new Date();
      this.db.updateResult(job);

      this.logger.log({
        level: "debug",
        message: "Job status updated to in-progress",
        timestamp: new Date().toISOString(),
        jobId: job.id,
      });

      // Get the script
      const script = this.db.getScript(job.scriptId);
      if (!script) {
        throw new Error(`Script ${job.scriptId} not found`);
      }

      this.logger.log({
        level: "debug",
        message: `Found script: ${script.name}`,
        timestamp: new Date().toISOString(),
        jobId: job.id,
      });

      // Create temporary directory for the job
      const tempDir = join("temp", job.id);
      await mkdir(tempDir, { recursive: true });

      // Create reports directory
      const reportDir = join("reports", job.id);
      await mkdir(reportDir, { recursive: true });

      this.logger.log({
        level: "debug",
        message: "Created temporary and report directories",
        timestamp: new Date().toISOString(),
        jobId: job.id,
      });

      // Copy script to temp directory
      const tempScript = join(tempDir, "test.spec.ts");
      await writeFile(tempScript, await Bun.file(script.filePath).text());

      this.logger.log({
        level: "info",
        message: "Running Playwright test",
        timestamp: new Date().toISOString(),
        jobId: job.id,
      });

      // Run Playwright test
      const { stdout, stderr } = await execAsync(
        `PLAYWRIGHT_JSON_OUTPUT_NAME=${reportDir}/report.json bunx playwright test ${tempScript} --reporter=json --output="${reportDir}" --config="playwright.config.ts"`
      );

      // Update job with results
      job.status = "completed";
      job.output = stdout + stderr;
      job.reportPath = join(reportDir, "report.json");
      job.endTime = new Date();

      this.logger.log({
        level: "info",
        message: "Job completed successfully",
        timestamp: new Date().toISOString(),
        jobId: job.id,
      });

      // delete temp directory
      await rm(tempDir, { recursive: true });
    } catch (error) {
      // Update job with error
      job.status = "failed";
      job.error = error instanceof Error ? error.message : String(error);
      job.endTime = new Date();

      this.logger.log({
        level: "error",
        message: "Job failed",
        timestamp: new Date().toISOString(),
        jobId: job.id,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    // Save final job status
    this.db.updateResult(job);

    this.logger.log({
      level: "info",
      message: `Job finished with status: ${job.status}`,
      timestamp: new Date().toISOString(),
      jobId: job.id,
    });
  }
}
