const Colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

export interface LogMessage {
  level: 'info' | 'error' | 'debug';
  message: string;
  timestamp: string;
  jobId?: string;
  error?: Error;
}

export class Logger {
  log(msg: LogMessage): void {
    const timestamp = `${Colors.cyan}[${msg.timestamp}]${Colors.reset}`;
    const levelColor = msg.level === 'error' ? Colors.red : msg.level === 'debug' ? Colors.yellow : Colors.blue;
    const level = `${levelColor}[${msg.level.toUpperCase()}]${Colors.reset}`;
    const jobId = msg.jobId ? `${Colors.magenta}[Job: ${msg.jobId}]${Colors.reset}` : '';
    const message = `${Colors.white}${msg.message}${Colors.reset}`;
    
    const prefix = `${timestamp} ${level}${jobId}`;
    
    switch (msg.level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        if (msg.error) {
          console.error(`${Colors.red}${msg.error}${Colors.reset}`);
        }
        break;
      case 'debug':
        console.debug(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}