import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageOverview } from "./LanguageOverview";
import { buildLanguageOverview } from "@/test/fixtures";

describe("LanguageOverview", () => {
  it("affiche le nom et le code normalisé de la langue", () => {
    render(<LanguageOverview overview={buildLanguageOverview()} />);

    expect(screen.getByRole("heading", { name: /Yoruba/ })).toBeInTheDocument();
    expect(screen.getByText(/yor/)).toBeInTheDocument();
  });

  it("affiche la famille et la région quand elles sont connues", () => {
    render(<LanguageOverview overview={buildLanguageOverview()} />);

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

    render(<LanguageOverview overview={overview} />);

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

    render(<LanguageOverview overview={overview} />);

    expect(screen.getByText("ASR")).toBeInTheDocument();
    expect(screen.getByText("Traduction")).toBeInTheDocument();
  });

  it("signale l'absence de tâche renseignée plutôt qu'une liste vide", () => {
    const overview = buildLanguageOverview({
      stats: { dataset_count: 1, task_count: 0, tasks_covered: [] },
    });

    render(<LanguageOverview overview={overview} />);

    expect(screen.getByText(/Aucune tâche renseignée/i)).toBeInTheDocument();
  });

  it("se replie sur la requête et le code quand la langue est inconnue de l'index", () => {
    const overview = buildLanguageOverview({
      language_query: "zzz",
      language_code: "inconnu",
      language: null,
      stats: { dataset_count: 0, task_count: 0, tasks_covered: [] },
      datasets: [],
    });

    render(<LanguageOverview overview={overview} />);

    expect(screen.getByRole("heading", { name: /zzz/ })).toBeInTheDocument();
    expect(screen.getByText(/langue n'est pas reconnue/i)).toBeInTheDocument();
  });
});
