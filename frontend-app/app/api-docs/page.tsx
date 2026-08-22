import { CopyCode } from "@/components/docs/CopyCode";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { pageShell, panelClass, panelHeaderClass } from "@/components/ui/styles";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/api/v1`;

const curlSearch = `curl "${API_BASE_URL}/datasets/search?language=yoruba"`;
const pythonFilter = `import httpx

response = httpx.get(
    "${API_BASE_URL}/datasets/filter",
    params={"language": "swh", "task": "asr"},
)
response.raise_for_status()

for dataset in response.json()["datasets"]:
    print(dataset["title"], dataset["source_url"])`;

const searchResponse = `{
  "language_query": "yoruba",
  "language_code": "yor",
  "total": 1,
  "datasets": [
    {
      "id": 42,
      "external_id": "african-speech/yoruba-asr",
      "title": "Yoruba ASR Corpus",
      "description": "Corpus de reconnaissance vocale en yoruba",
      "language": {
        "code": "yor",
        "name": "Yoruba",
        "family": "Niger-Congo",
        "region": "West Africa"
      },
      "language_raw": "Yorùbá",
      "source": {
        "slug": "huggingface",
        "name": "Hugging Face",
        "base_url": "https://huggingface.co"
      },
      "license": {
        "name": "CC BY 4.0",
        "spdx_id": "CC-BY-4.0",
        "url": "https://creativecommons.org/licenses/by/4.0/"
      },
      "provenance": "synchronisé",
      "data_format": "audio",
      "size": "2.5 GB",
      "source_url": "https://huggingface.co/datasets/african-speech/yoruba-asr",
      "tasks": [{"code": "asr", "label": "ASR"}],
      "published_at": null
    }
  ]
}`;

const filterResponse = `{
  "filters": {
    "language": "swh",
    "language_code": "swh",
    "source": null,
    "task": "asr",
    "task_code": "asr",
    "data_format": null
  },
  "total": 1,
  "datasets": []
}`;

const endpoints = [
  { id: "manifest", method: "GET", path: "/api/v1", title: "Manifeste", description: "Retourne la version et la liste des routes disponibles.", query: "Aucun", response: "ApiInfoResponse", example: `curl "${API_BASE_URL}"`, body: `{
  "name": "AfroLang-Library Public API",
  "version": "1.0.0",
  "read_only": true,
  "endpoints": []
}` },
  { id: "search", method: "GET", path: "/api/v1/datasets/search", title: "Rechercher par langue", description: "Résout un code ISO 639-3 ou un alias et retourne les datasets associés.", query: "language (requis) : code ou nom de langue, par exemple yor, Yoruba ou Yorùbá.", response: "DatasetSearchResponse", example: curlSearch, body: searchResponse },
  { id: "filter", method: "GET", path: "/api/v1/datasets/filter", title: "Filtrer les datasets", description: "Combine les filtres fournis avec une logique ET.", query: "Au moins un paramètre requis : language, source, task ou data_format.", response: "DatasetFilterResponse", example: `curl "${API_BASE_URL}/datasets/filter?language=swh&task=asr"`, body: filterResponse },
  { id: "detail", method: "GET", path: "/api/v1/datasets/{dataset_id}", title: "Fiche dataset", description: "Retourne les métadonnées détaillées d’un dataset et son lien source.", query: "dataset_id (chemin) : identifiant numérique du dataset.", response: "DatasetDetailResponse", example: `curl "${API_BASE_URL}/datasets/42"`, body: `{
  "id": 42,
  "external_id": "african-speech/yoruba-asr",
  "title": "Yoruba ASR Corpus",
  "language": {"code": "yor", "name": "Yoruba", "family": "Niger-Congo", "region": "West Africa"},
  "source_url": "https://huggingface.co/datasets/african-speech/yoruba-asr",
  "created_at": "2026-07-18T12:00:00+00:00",
  "updated_at": "2026-07-18T12:00:00+00:00"
}` },
  { id: "overview", method: "GET", path: "/api/v1/languages/overview", title: "Vue d’une langue", description: "Retourne les datasets, le nombre de datasets et les tâches couvertes.", query: "language (requis) : code ou nom de langue.", response: "LanguageOverviewResponse", example: `curl "${API_BASE_URL}/languages/overview?language=wolof"`, body: `{
  "language_query": "wolof",
  "language_code": "wol",
  "language": {"code": "wol", "name": "Wolof", "family": "Niger-Congo", "region": "West Africa"},
  "stats": {"dataset_count": 3, "task_count": 2, "tasks_covered": [{"code": "asr", "label": "ASR"}]},
  "datasets": []
}` },
] as const;

function DocNav() {
  const items = [{ href: "#introduction", label: "Introduction" }, { href: "#demarrage", label: "Démarrage" }, { href: "#endpoints", label: "Endpoints" }, { href: "#schemas", label: "Schémas" }, { href: "#erreurs", label: "Erreurs" }];
  return (
    <nav className={panelClass} aria-label="Navigation documentation">
      <div className={panelHeaderClass}><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.12em] text-ink-black">API publique</p></div>
      <ul className="space-y-0.5 p-2">{items.map((item) => <li key={item.href}><a href={item.href} className="block rounded-sm px-3 py-2 font-mono-ui text-[10px] font-medium uppercase tracking-[0.1em] text-slate transition hover:bg-savanna hover:text-ink-black">{item.label}</a></li>)}</ul>
      <div className="border-t border-hairline p-3"><p className="font-mono-ui text-[9px] uppercase tracking-[0.12em] text-slate">Version</p><p className="mt-1 font-mono-ui text-xs text-ink-black">v1.0.0</p></div>
    </nav>
  );
}

function EndpointCard({ endpoint }: { endpoint: (typeof endpoints)[number] }) {
  return (
    <article id={endpoint.id} className="scroll-mt-24 border-t border-hairline pt-7 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-3"><span className="rounded-sm bg-ink-black px-2 py-1 font-mono-ui text-[10px] font-medium uppercase tracking-[0.1em] text-cream-paper">{endpoint.method}</span><code className="font-mono-ui text-xs text-terracotta">{endpoint.path}</code></div>
      <h2 className="mt-3 font-display text-xl font-medium text-ink-black">{endpoint.title}</h2>
      <p className="mt-2 font-serif text-sm leading-relaxed text-slate">{endpoint.description}</p>
      <dl className="mt-5 grid gap-4 border-y border-hairline py-4 sm:grid-cols-2"><div><dt className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">Paramètres</dt><dd className="mt-1 font-serif text-sm text-ink-black">{endpoint.query}</dd></div><div><dt className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">Réponse</dt><dd className="mt-1 font-mono-ui text-xs text-ink-black">{endpoint.response}</dd></div></dl>
      <div className="mt-5 grid gap-5 xl:grid-cols-2"><div><p className="mb-2 font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">Requête</p><CopyCode code={endpoint.example} /></div><div><p className="mb-2 font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">Réponse 200</p><CopyCode code={endpoint.body} language="json" /></div></div>
    </article>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="flex min-h-full flex-col"><SiteHeader /><main className={`${pageShell} flex-1 py-8 lg:py-10`}><div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12"><aside className="space-y-6"><DocNav /></aside><div className="min-w-0 space-y-12">
      <header id="introduction" className="scroll-mt-24 border-b border-hairline pb-7"><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">Documentation développeur</p><h1 className="mt-2 font-display text-[1.9rem] font-medium leading-[1.15] text-ink-black sm:text-[2.35rem]">API publique catalogue</h1><p className="mt-4 max-w-2xl font-serif text-base leading-relaxed text-slate">Une interface de lecture seule pour rechercher les métadonnées normalisées des datasets de langues africaines. Aucun compte ni token n’est requis.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-sm border border-hairline bg-pure-white p-4"><p className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">Base URL</p><code className="mt-2 block break-all font-mono-ui text-xs text-terracotta">{API_BASE_URL}</code></div><div className="rounded-sm border border-hairline bg-pure-white p-4"><p className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">Authentification</p><p className="mt-2 font-serif text-sm text-ink-black">Aucune pour cette section</p></div></div></header>
      <section id="demarrage" className="scroll-mt-24 space-y-5"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">01 · Premier appel</p><h2 className="mt-2 font-display text-2xl font-medium text-ink-black">Démarrer en quelques secondes</h2><p className="mt-2 font-serif text-sm leading-relaxed text-slate">Les réponses sont JSON. Les variantes de noms de langue sont résolues vers un code ISO 639-3 canonique.</p></div><CopyCode code={curlSearch} /><CopyCode code={pythonFilter} language="python" /></section>
      <section id="endpoints" className="scroll-mt-24 space-y-10"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">02 · Référence</p><h2 className="mt-2 font-display text-2xl font-medium text-ink-black">Endpoints catalogue</h2></div>{endpoints.map((endpoint) => <EndpointCard key={endpoint.id} endpoint={endpoint} />)}</section>
      <section id="schemas" className="scroll-mt-24 space-y-5"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">03 · Contrats</p><h2 className="mt-2 font-display text-2xl font-medium text-ink-black">Modèles de données</h2></div><div className="grid gap-4 md:grid-cols-2">{[["DatasetSummaryResponse", "id, external_id, title, description, language, language_raw, source, license, provenance, data_format, size, source_url, tasks, published_at"], ["LanguageResponse", "code, name, family, region"], ["SourceResponse", "slug, name, base_url"], ["TaskResponse", "code, label"], ["LicenseResponse", "name, spdx_id, url"], ["AppliedFiltersResponse", "language, language_code, source, task, task_code, data_format"]].map(([name, fields]) => <div key={name} className="rounded-sm border border-hairline bg-pure-white p-4"><code className="font-mono-ui text-xs text-terracotta">{name}</code><p className="mt-2 font-serif text-sm leading-relaxed text-slate">{fields}</p></div>)}</div></section>
      <section id="erreurs" className="scroll-mt-24 space-y-5"><div><p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">04 · Robustesse</p><h2 className="mt-2 font-display text-2xl font-medium text-ink-black">Erreurs et limites</h2></div><div className="overflow-x-auto rounded-sm border border-hairline bg-pure-white"><table className="w-full min-w-[520px] text-left"><thead><tr className="border-b border-hairline"><th className="px-4 py-3 font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">Statut</th><th className="px-4 py-3 font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">Situation</th><th className="px-4 py-3 font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">Format</th></tr></thead><tbody>{[["200", "Requête traitée", "Réponse JSON du endpoint"], ["400", "Aucun filtre fourni à /datasets/filter", '{"detail":"..."}'], ["404", "Dataset introuvable", '{"detail":"Dataset introuvable"}'], ["422", "Paramètre invalide ou absent", "Détails de validation FastAPI"], ["503", "Base indisponible", '{"detail":"Base indisponible : ..."}']].map(([status, situation, format]) => <tr key={status} className="border-b border-hairline last:border-0"><td className="px-4 py-3 font-mono-ui text-xs text-terracotta">{status}</td><td className="px-4 py-3 font-serif text-sm text-ink-black">{situation}</td><td className="px-4 py-3 font-mono-ui text-xs text-slate">{format}</td></tr>)}</tbody></table></div><div className="border-l-2 border-ochre bg-ochre/10 px-4 py-3"><p className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-ochre">Rate limiting</p><p className="mt-1 font-serif text-sm leading-relaxed text-ink-black">Aucune limitation de débit n’est actuellement appliquée dans l’environnement local. Une politique de production sera publiée avant l’exposition publique.</p></div></section>
    </div></div></main><SiteFooter /></div>
  );
}