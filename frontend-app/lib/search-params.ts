export type SearchParams = { [key: string]: string | string[] | undefined };

/** Première valeur d'un paramètre de requête, quel que soit son nombre d'occurrences. */
export function readParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}
