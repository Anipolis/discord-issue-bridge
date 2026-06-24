# discord-issue-bridge

Create GitHub issues from Discord forum posts and threads.

## Overview

Discordのフォーラムチャンネルへの新規スレッドを検知し、対応するGitHub Issueを自動作成するBotです。

## Setup

### 1. Discord Bot の設定

[Discord Developer Portal](https://discord.com/developers/applications) で以下を設定してください。

**Privileged Gateway Intents:**
- `Message Content Intent`: ON（投稿本文・添付ファイルの取得に必要）
- `Server Members Intent`: 不要
- `Presence Intent`: 不要

**Bot Permissions:**
- View Channel
- Read Message History
- Send Messages
- Send Messages in Threads

### 2. GitHub Fine-grained Personal Access Token の設定

対象リポジトリに絞った Fine-grained PAT を作成してください。

**必要な権限:**
- `Issues`: Read and write
- `Metadata`: Read

### 3. 環境変数の設定

```sh
cp .env.example .env
```

`.env` に実際の値を記入します。

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_FORUM_CHANNEL_IDS=123456789012345678,234567890123456789

GITHUB_TOKEN=your_github_fine_grained_pat
GITHUB_OWNER=YourOrg
GITHUB_REPO=your-repo

DATABASE_URL=sqlite:./data/bot.db
LOG_LEVEL=info
DRY_RUN=false
```

### 4. 設定ファイルの用意

```sh
cp config.example.json config.json
```

`config.json` でタグマッピング・除外タグ等を設定します。

## Running

### Docker Compose（推奨）

```sh
docker compose up -d
```

### ローカル開発

```sh
npm install
npm run dev
```

### ビルド & 起動

```sh
npm run build
npm start
```

## DRY_RUN モード

`DRY_RUN=true` に設定すると、GitHub Issueの作成をスキップし、作成予定の内容をログへ出力します。テスト時に使用してください。

## Testing

```sh
npm test
```

## Logs

JSON 構造化ログを stdout へ出力します。

```json
{"level":"info","event":"issue_created","discord_thread_id":"123","github_issue_number":42,"github_issue_url":"https://github.com/..."}
```
