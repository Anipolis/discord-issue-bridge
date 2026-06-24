const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

let currentLevel: Level = 'info';

export function setLogLevel(level: string): void {
  if (level in LEVELS) {
    currentLevel = level as Level;
  }
}

function log(level: Level, event: string, fields: Record<string, unknown> = {}): void {
  if (LEVELS[level] < LEVELS[currentLevel]) return;
  const entry = { level, event, timestamp: new Date().toISOString(), ...fields };
  const output = JSON.stringify(entry);
  if (level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

export const logger = {
  debug: (event: string, fields?: Record<string, unknown>) => log('debug', event, fields),
  info: (event: string, fields?: Record<string, unknown>) => log('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => log('warn', event, fields),
  error: (event: string, fields?: Record<string, unknown>) => log('error', event, fields),
};
