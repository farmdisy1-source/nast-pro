export type StudentLinkKind = 'poll' | 'quiz' | 'mood' | 'mood-code';

export function studentLink(kind: StudentLinkKind, code?: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  if (kind === 'mood') return `${base}#/s/mood`;
  if (kind === 'mood-code') return `${base}#/s/mood/${code}`;
  return `${base}#/s/${kind}/${code}`;
}
