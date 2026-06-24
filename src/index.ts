import 'dotenv/config';
import { Events } from 'discord.js';
import { loadEnvConfig, loadAppConfig } from './config.js';
import { createDiscordClient } from './discord/client.js';
import { handleThreadCreate } from './discord/handlers/threadCreate.js';
import { openDatabase } from './db/index.js';
import { createOctokit } from './github/client.js';
import { logger, setLogLevel } from './utils/logger.js';

async function main(): Promise<void> {
  const envConfig = loadEnvConfig();
  const appConfig = loadAppConfig();

  setLogLevel(envConfig.logLevel);

  logger.info('bot_starting', { dry_run: envConfig.dryRun });

  const db = openDatabase(envConfig.databaseUrl);
  const octokit = createOctokit(envConfig.githubToken);
  const client = createDiscordClient();

  const activeTasks = new Set<Promise<void>>();
  let isShuttingDown = false;

  client.once(Events.ClientReady, (c) => {
    logger.info('bot_ready', { username: c.user.tag });
  });

  client.on(Events.ThreadCreate, (thread, newlyCreated) => {
    if (isShuttingDown) return;
    const task = handleThreadCreate(thread, newlyCreated, db, octokit, envConfig, appConfig);
    activeTasks.add(task);
    void task.finally(() => activeTasks.delete(task));
  });

  const shutdown = async (): Promise<void> => {
    logger.info('bot_shutting_down');
    isShuttingDown = true;
    client.destroy();
    await Promise.allSettled([...activeTasks]);
    db.close();
    process.exit(0);
  };

  process.on('SIGINT', () => { void shutdown(); });
  process.on('SIGTERM', () => { void shutdown(); });

  await client.login(envConfig.discordToken);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(JSON.stringify({ level: 'error', event: 'startup_failed', error: message }) + '\n');
  process.exit(1);
});
