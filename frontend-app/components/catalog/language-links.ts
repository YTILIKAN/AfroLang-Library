/** Chemin de la fiche langue — seule vue « langue » distincte du catalogue. */
export function languageOverviewPath(language: string): string {
  return `/languages/${encodeURIComponent(language)}`;
}
