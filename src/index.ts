import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { DB } from "./db";
import { JobQueue } from "./services/job-queue";
import { Worker } from "./services/worker";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { authHandler } from "./auth/handler";
import { TestResult } from "./types";

// Import setup utility
import { ensurePlaywright } from "./services/setup";

// Ensure Playwright is installed and configured
await ensurePlaywright();

// Ensure required directories exist
await mkdir("scripts", { recursive: true });
await mkdir("reports", { recursive: true });
await mkdir("temp", { recursive: true });

const db = new DB();
const worker = new Worker(db);
const jobQueue = new JobQueue((job) => worker.processJob(job));

const app = new Elysia()
  .use(authHandler)
  .use(
    staticPlugin({
      prefix: "/reports",
      assets: "reports",
    })
  )
  .get("/scripts", async () => {
    const scripts = db.getScripts();
    return {
      scripts,
    };
  })
  .post(
    "/scripts",
    async ({ body }) => {
      const form = body;

      const scriptId = randomUUID();
      const filePath = join("scripts", `${scriptId}.spec.ts`);

      // Save uploaded file
      await Bun.write(filePath, form.file);

      // Create script record
      const script = {
        id: scriptId,
        name: form.name,
        description: form.description || "",
        filePath,
        createdAt: new Date(),
      };

      db.createScript(script);

      return {
        id: script.id,
        name: script.name,
        description: script.description,
      };
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.String(),
        file: t.Files(),
      }),
    }
  )
  .post(
    "/scripts/:id/run",
    ({ params }) => {
      const script = db.getScript(params.id);
      if (!script) {
        throw new Error(`Script ${params.id} not found`);
      }

      const jobId = randomUUID();
      const job: TestResult = {
        id: jobId,
        scriptId: script.id,
        status: "queued",
        output: null,
        reportPath: null,
        startTime: null,
        endTime: null,
        error: null,
      };

      db.createResult(job);
      jobQueue.enqueue(job);

      return {
        jobId,
        status: "queued",
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .get("jobs", async () => {
    const jobs = db.getResults();
    return {
      jobs,
    };
  })
  .get("/jobs/:id", ({ params }) => {
    const result = db.getResult(params.id);
    if (!result) {
      throw new Error(`Job ${params.id} not found`);
    }

    return {
      status: result.status,
      output: result.output,
      reportUrl: result.reportPath ? `/reports/${result.id}/report.json` : null,
      error: result.error,
    };
  })
  .listen(3000);

console.log(`Server running at ${app.server?.hostname}:${app.server?.port}`);
