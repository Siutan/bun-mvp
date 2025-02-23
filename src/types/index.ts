export interface TestScript {
    id: string;
    name: string;
    description: string;
    filePath: string;
    createdAt: Date;
  }
  
  export interface TestResult {
    id: string;
    scriptId: string;
    status: 'queued' | 'in-progress' | 'completed' | 'failed';
    output: string | null;
    reportPath: string | null;
    startTime: Date | null;
    endTime: Date | null;
    error: string | null;
  }