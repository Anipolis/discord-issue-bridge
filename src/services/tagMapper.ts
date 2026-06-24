export interface AvailableTag {
  id: string;
  name: string;
}

export function resolveTagNames(appliedTagIds: string[], availableTags: AvailableTag[]): string[] {
  const tagMap = new Map(availableTags.map((t) => [t.id, t.name]));
  return appliedTagIds.map((id) => tagMap.get(id)).filter((name): name is string => name !== undefined);
}

export function hasIgnoreTag(tagNames: string[], ignoreTags: string[]): boolean {
  const ignoreSet = new Set(ignoreTags);
  return tagNames.some((name) => ignoreSet.has(name));
}

export function mapToGitHubLabels(tagNames: string[], tagMap: Record<string, string>): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const name of tagNames) {
    const label = tagMap[name];
    if (label !== undefined && !seen.has(label)) {
      seen.add(label);
      labels.push(label);
    }
  }
  return labels;
}
