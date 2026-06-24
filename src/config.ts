import { readFileSync, existsSync } from 'node:fs';
import { z } from 'zod';
import type { AppConfig, EnvConfig } from './types/index.js';

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_FORUM_CHANNEL_IDS: z.string().min(1, 'DISCORD_FORUM_CHANNEL_IDS is required'),
  GITHUB_TOKEN: z.string().min(1, 'GITHUB_TOKEN is required'),
  GITHUB_OWNER: z.string().min(1, 'GITHUB_OWNER is required'),
  GITHUB_REPO: z.string().min(1, 'GITHUB_REPO is required'),
  DATABASE_URL: z.string().default('sqlite:./data/bot.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DRY_RUN: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

const appConfigSchema = z
  .object({
    tagMap: z.record(z.string()).default({}),
    ignoreTags: z.array(z.string()).default([]),
    createMissingLabels: z.boolean().default(false),
    replyWhenCreated: z.boolean().default(true),
    replyWhenAlreadyLinked: z.boolean().default(false),
    syncThreadRepliesToIssueComments: z.boolean().default(false),
  })
  .default({});

export function loadEnvConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = result.data;
  return {
    discordToken: env.DISCORD_TOKEN,
    discordForumChannelIds: env.DISCORD_FORUM_CHANNEL_IDS.split(',')
      .map((id) => id.trim())
      .filter(Boolean),
    githubToken: env.GITHUB_TOKEN,
    githubOwner: env.GITHUB_OWNER,
    githubRepo: env.GITHUB_REPO,
    databaseUrl: env.DATABASE_URL,
    logLevel: env.LOG_LEVEL,
    dryRun: env.DRY_RUN,
  };
}

export function loadAppConfig(configPath = 'config.json'): AppConfig {
  if (!existsSync(configPath)) {
    return appConfigSchema.parse({});
  }
  const raw = JSON.parse(readFileSync(configPath, 'utf-8')) as unknown;
  const result = appConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid config.json:\n${issues}`);
  }
  return result.data;
}
