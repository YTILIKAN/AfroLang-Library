import { CatalogNav } from "@/components/layout/CatalogNav";
import { ErrorBanner, WorkflowShell } from "@/components/layout/WorkflowShell";
import { LanguageOverviewView } from "@/components/catalog/LanguageOverviewView";
import { getLanguageOverview } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";

interface LanguagePageProps {
  params: Promise<{ language: string }>;
}

export default async function LanguagePage({ params }: LanguagePageProps) {
  const { language: rawLanguage } = await params;
  const languageQuery = decodeURIComponent(rawLanguage).trim();

  if (!languageQuery) {
    return (
      <WorkflowShell sidebar={<CatalogNav />}>
        <ErrorBanner message="Paramètre langue manquant." />
      </WorkflowShell>
    );
  }

  let error: string | null = null;
  let overview: Awaited<ReturnType<typeof getLanguageOverview>> | null = null;

  try {
    overview = await getLanguageOverview(languageQuery);
  } catch (err) {
    error = err instanceof ApiError ? err.message : "Chargement impossible";
  }

  return (
    <WorkflowShell sidebar={<CatalogNav />}>
      {error ? <ErrorBanner message={error} /> : overview ? <LanguageOverviewView overview={overview} /> : null}
    </WorkflowShell>
  );
}
