import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LanguageOverviewView } from "@/components/catalog/LanguageOverviewView";
import { pageShell, sectionGap } from "@/components/ui/styles";
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
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <main className={`${pageShell} ${sectionGap} flex-1 pt-12`}>
          <p className="font-serif text-sm text-slate">Paramètre langue manquant.</p>
        </main>
        <SiteFooter />
      </div>
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
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className={`${pageShell} ${sectionGap} flex-1 pt-12`}>
        {error ? (
          <div className="border border-hairline bg-fog px-4 py-3 font-serif text-sm text-ink-black">{error}</div>
        ) : overview ? (
          <LanguageOverviewView overview={overview} />
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
