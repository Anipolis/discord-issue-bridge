export function threadUrl(guildId: string, threadId: string): string {
  return `https://discord.com/channels/${guildId}/${threadId}`;
}

export function messageUrl(guildId: string, threadId: string, messageId: string): string {
  return `https://discord.com/channels/${guildId}/${threadId}/${messageId}`;
}
