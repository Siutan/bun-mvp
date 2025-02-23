import { Database } from "bun:sqlite";
import { TestScript, TestResult } from "../types";

export class DB {
  private db: Database;

  constructor() {
    this.db = new Database("test-service.db");
    this.init();
  }

  private init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS test_script (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        file_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS test_result (
        id TEXT PRIMARY KEY,
        script_id TEXT NOT NULL,
        status TEXT NOT NULL,
        output TEXT,
        report_path TEXT,
        start_time DATETIME,
        end_time DATETIME,
        error TEXT,
        FOREIGN KEY(script_id) REFERENCES test_script(id)
      )
    `);
  }

  getScripts() {
    const stmt = this.db.prepare(`
      SELECT * FROM test_script
    `);

    return stmt.all();
  }

  createScript(script: TestScript) {
    const stmt = this.db.prepare(`
      INSERT INTO test_script (id, name, description, file_path, created_at)
      VALUES ($id, $name, $description, $filePath, $createdAt)
    `);

    return stmt.run({
      $id: script.id,
      $name: script.name,
      $description: script.description,
      $filePath: script.filePath,
      $createdAt: script.createdAt.toISOString(),
    });
  }

  getScript(id: string): TestScript | null {
    const result = this.db
      .prepare("SELECT * FROM test_script WHERE id = ?")
      .get(id) as any;
    if (!result) return null;
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      filePath: result.file_path,
      createdAt: new Date(result.created_at),
    };
  }

  createResult(result: TestResult) {
    const stmt = this.db.prepare(`
      INSERT INTO test_result (id, script_id, status, output, report_path, start_time, end_time, error)
      VALUES ($id, $scriptId, $status, $output, $reportPath, $startTime, $endTime, $error)
    `) as any;

    return stmt.run({
      $id: result.id,
      $scriptId: result.scriptId,
      $status: result.status,
      $output: result.output,
      $reportPath: result.reportPath,
      $startTime: result.startTime?.toISOString(),
      $endTime: result.endTime?.toISOString(),
      $error: result.error,
    });
  }

  updateResult(result: TestResult) {
    const stmt = this.db.prepare(`
      UPDATE test_result 
      SET status = $status, 
          output = $output, 
          report_path = $reportPath, 
          start_time = $startTime, 
          end_time = $endTime, 
          error = $error
      WHERE id = $id
    `) as any;

    return stmt.run({
      $id: result.id,
      $status: result.status,
      $output: result.output,
      $reportPath: result.reportPath,
      $startTime: result.startTime?.toISOString(),
      $endTime: result.endTime?.toISOString(),
      $error: result.error,
    });
  }

  getResults() {
    const stmt = this.db.prepare(`
      SELECT * FROM test_result ORDER BY start_time DESC
    `);

    return stmt.all();
  }

  getResult(id: string): TestResult | null {
    const result = this.db
      .prepare("SELECT * FROM test_result WHERE id = ?")
      .get(id) as any;
    if (!result) return null;
    return {
      id: result.id,
      scriptId: result.script_id,
      status: result.status,
      output: result.output,
      reportPath: result.report_path,
      startTime: result.start_time ? new Date(result.start_time) : null,
      endTime: result.end_time ? new Date(result.end_time) : null,
      error: result.error,
    };
  }
  public getDb(): Database {
    return this.db;
  }
}
