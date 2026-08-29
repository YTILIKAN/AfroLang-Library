import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActiveFilterTags } from "./ActiveFilterTags";
import { AppliedFilters } from "@/lib/types";

function buildFilters(overrides: Partial<AppliedFilters> = {}): AppliedFilters {
  return {
    q: null,
    language: null,
    language_code: null,
    source: null,
    task: null,
    task_code: null,
    data_format: null,
    ...overrides,
  };
}

describe("ActiveFilterTags", () => {
  it("n'affiche rien quand aucun filtre n'est actif", () => {
    const { container } = render(<ActiveFilterTags filters={buildFilters()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("affiche la requête plein texte comme critère à part entière", () => {
    render(<ActiveFilterTags filters={buildFilters({ q: "corpus asr" })} />);

    expect(screen.getByText("Recherche · corpus asr")).toBeInTheDocument();
  });

  it("affiche la langue avec son code normalisé côté serveur (Story 2.1)", () => {
    render(
      <ActiveFilterTags filters={buildFilters({ language: "Swahili", language_code: "swh" })} />,
    );

    expect(screen.getByText("Langue · Swahili (swh)")).toBeInTheDocument();
  });

  it("omet le code de langue quand la normalisation n'a rien reconnu", () => {
    render(
      <ActiveFilterTags filters={buildFilters({ language: "zzz", language_code: "inconnu" })} />,
    );

    expect(screen.getByText("Langue · zzz")).toBeInTheDocument();
  });

  it("affiche un libellé par filtre actif combiné (FR-12)", () => {
    render(
      <ActiveFilterTags
        filters={buildFilters({
          q: "corpus",
          language: "Swahili",
          language_code: "swh",
          source: "huggingface",
          task: "ASR",
          task_code: "asr",
          data_format: "audio",
        })}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Recherche · corpus")).toBeInTheDocument();
    expect(screen.getByText("Source · huggingface")).toBeInTheDocument();
    expect(screen.getByText("Tâche · ASR (asr)")).toBeInTheDocument();
    expect(screen.getByText("Format · audio")).toBeInTheDocument();
  });
});
