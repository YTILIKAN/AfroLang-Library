export type LanguageFormMode = "search" | "overview";

export function buildLanguageHref(mode: LanguageFormMode, language: string): string {
  const encoded = encodeURIComponent(language);
  return mode === "overview" ? `/languages/${encoded}` : `/search?language=${encoded}`;
}

export function languageOverviewPath(language: string): string {
  return buildLanguageHref("overview", language);
}
