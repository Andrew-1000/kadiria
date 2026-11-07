import type { PrereqStatus } from '#shared/calc/bq'

/**
 * The visitor's answers to "which documents do you have?", kept in app state so the
 * Prepare documents page and the BQ wizard share them during the session.
 */
export function usePrereqAnswers() {
  return useState<Record<string, PrereqStatus>>('prereq-answers', () => ({}))
}
