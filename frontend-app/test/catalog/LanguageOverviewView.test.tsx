import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LanguageOverviewView } from "@/components/catalog/LanguageOverviewView";
import { buildLanguageOverview } from "@/test/fixtures";

/** La `dd` qui suit le libellé « Couverture » porte les tâches couvertes. */
function coverageList(): HTMLElement {
  const term = screen.getByText("Couverture");
  const list = term.nextElementSibling;
  if (!(list instanceof HTMLElement)) {
    throw new Error("Liste des tâches couvertes introuvable");
  }
  return list;
}

describe("LanguageOverviewView", () => {
  it("affiche le nom et le code normalisé de la langue", () => {
    render(<LanguageOverviewView overview={buildLanguageOverview()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Yoruba" })).toBeInTheDocument();
    // Le code, la famille et la région tiennent dans le sous-titre de l'en-tête.
    expect(screen.getByText(/^yor ·/)).toHaveTextContent("yor · Niger-Congo · Afrique de l'Ouest");
  });

  it("affiche la famille et la région quand elles sont connues", () => {
    render(<LanguageOverviewView overview={buildLanguageOverview()} />);

    expect(screen.getByText(/Niger-Congo/)).toBeInTheDocument();
    expect(screen.getByText(/Afrique de l'Ouest/)).toBeInTheDocument();
  });

  it("affiche les compteurs de datasets et de tâches couvertes (FR-14)", () => {
    const overview = buildLanguageOverview({
      stats: {
        dataset_count: 3,
        task_count: 2,
        tasks_covered: [
          { code: "asr", label: "ASR" },
          { code: "nmt", label: "Traduction" },
        ],
      },
    });

    render(<LanguageOverviewView overview={overview} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("liste les tâches NLP couvertes", () => {
    const overview = buildLanguageOverview({
      stats: {
        dataset_count: 2,
        task_count: 2,
        tasks_covered: [
          { code: "asr", label: "ASR" },
          { code: "nmt", label: "Traduction" },
        ],
      },
    });

    render(<LanguageOverviewView overview={overview} />);

    const coverage = within(coverageList());
    expect(coverage.getByText("ASR")).toBeInTheDocument();
    expect(coverage.getByText("Traduction")).toBeInTheDocument();
  });

  it("signale l'absence de tâche renseignée plutôt qu'une liste vide", () => {
    const overview = buildLanguageOverview({
      stats: { dataset_count: 1, task_count: 0, tasks_covered: [] },
    });

    render(<LanguageOverviewView overview={overview} />);

    expect(within(coverageList()).getByText("—")).toBeInTheDocument();
  });

  it("se replie sur la requête quand la langue est inconnue de l'index", () => {
    const overview = buildLanguageOverview({
      language_query: "zzz",
      language_code: "inconnu",
      language: null,
      stats: { dataset_count: 0, task_count: 0, tasks_covered: [] },
      datasets: [],
    });

    render(<LanguageOverviewView overview={overview} />);

    expect(screen.getByRole("heading", { level: 1, name: /Langue non reconnue/i })).toBeInTheDocument();
    expect(screen.getByText(/Aucune entrée pour/)).toHaveTextContent("zzz");
    expect(screen.queryByText("Datasets")).not.toBeInTheDocument();
  });

  it("liste les datasets référencés pour la langue", () => {
    render(<LanguageOverviewView overview={buildLanguageOverview()} />);

    expect(screen.getByRole("link", { name: "Yoruba ASR Corpus" })).toBeInTheDocument();
  });
});
