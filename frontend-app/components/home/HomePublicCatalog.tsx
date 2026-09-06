"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { HomeCatalogSection } from "@/components/home/HomeCatalogSection";
import { listDatasets } from "@/lib/api/catalog";
import { DatasetSummary } from "@/lib/types";

export interface PublicCatalogData {
  datasets: DatasetSummary[];
  total: number;
  languageCount: number;
  taskCount: number;
  sourceCount: number;
  loadError: boolean;
  loading: boolean;
}

function aggregateStats(datasets: DatasetSummary[]) {
  const languageCodes = new Set<string>();
  const taskCodes = new Set<string>();
  const sourceSlugs = new Set<string>();

  for (const dataset of datasets) {
    languageCodes.add(dataset.language.code);
    sourceSlugs.add(dataset.source.slug);
    for (const task of dataset.tasks) {
      taskCodes.add(task.code);
    }
  }

  return {
    languageCount: languageCodes.size,
    taskCount: taskCodes.size,
    sourceCount: sourceSlugs.size,
  };
}

const INITIAL_STATE: PublicCatalogData = {
  datasets: [],
  total: 0,
  languageCount: 0,
  taskCount: 0,
  sourceCount: 0,
  loadError: false,
  loading: true,
};

const CatalogContext = createContext<PublicCatalogData>(INITIAL_STATE);

function usePublicCatalogState() {
  const [state, setState] = useState<PublicCatalogData>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    // 500 fiches pour les compteurs de l'en-tête (langues, tâches, sources) : l'API n'expose
    // pas encore d'agrégat. La section n'en rend que HOME_PREVIEW_SIZE, le reste vit sur /catalog.
    listDatasets(500)
      .then((response) => {
        if (cancelled) {
          return;
        }
        const stats = aggregateStats(response.datasets);
        setState({
          datasets: response.datasets,
          total: response.total,
          languageCount: stats.languageCount,
          taskCount: stats.taskCount,
          sourceCount: stats.sourceCount,
          loadError: false,
          loading: false,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setState((previous) => ({ ...previous, loadError: true, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function HomePublicCatalogProvider({ children }: { children: ReactNode }) {
  const state = usePublicCatalogState();
  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>;
}

function usePublicCatalog() {
  return useContext(CatalogContext);
}

function StatValue({ value, loading }: { value: number | string; loading: boolean }) {
  if (loading) {
    return <span className="text-slate">…</span>;
  }
  return value;
}

export function HomeCatalogStats() {
  const state = usePublicCatalog();

  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4 border-t border-hairline pt-6">
      <div>
        <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Datasets</dt>
        <dd className="mt-1 font-display text-2xl tabular-nums text-ink-black">
          <StatValue loading={state.loading} value={state.loadError ? "—" : state.total} />
        </dd>
      </div>
      <div>
        <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Langues</dt>
        <dd className="mt-1 font-display text-2xl tabular-nums text-ink-black">
          <StatValue loading={state.loading} value={state.loadError ? "—" : state.languageCount} />
        </dd>
      </div>
      <div>
        <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Tâches</dt>
        <dd className="mt-1 font-display text-2xl tabular-nums text-ink-black">
          <StatValue loading={state.loading} value={state.loadError ? "—" : state.taskCount} />
        </dd>
      </div>
      <div>
        <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Sources</dt>
        <dd className="mt-1 font-display text-2xl tabular-nums text-ink-black">
          <StatValue loading={state.loading} value={state.loadError ? "—" : state.sourceCount} />
        </dd>
      </div>
    </dl>
  );
}

export function HomeCatalogGrid() {
  const state = usePublicCatalog();

  return (
    <HomeCatalogSection
      datasets={state.datasets}
      total={state.total}
      loadError={state.loadError}
      loading={state.loading}
    />
  );
}
