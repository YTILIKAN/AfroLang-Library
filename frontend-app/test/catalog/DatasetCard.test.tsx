import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatasetCard } from "@/components/catalog/DatasetCard";
import { buildDataset } from "@/test/fixtures";

describe("DatasetCard", () => {
  it("affiche les métadonnées normalisées du dataset", () => {
    render(<DatasetCard dataset={buildDataset()} />);

    expect(screen.getByRole("link", { name: "Yoruba ASR Corpus" })).toBeInTheDocument();
    expect(screen.getByText("Yoruba (yor)")).toBeInTheDocument();
    expect(screen.getByText("ASR")).toBeInTheDocument();
    expect(screen.getByText("audio")).toBeInTheDocument();
    expect(screen.getByText("2.5 GB")).toBeInTheDocument();
    expect(screen.getByText("CC BY 4.0")).toBeInTheDocument();
  });

  it("affiche « inconnu » quand aucune tâche n'est renseignée (AC 1.7)", () => {
    render(<DatasetCard dataset={buildDataset({ tasks: [] })} />);

    expect(screen.getByText("inconnu")).toBeInTheDocument();
  });

  it("affiche « inconnu » pour un format, une taille et une licence absents", () => {
    render(<DatasetCard dataset={buildDataset({ data_format: "", size: "", license: null })} />);

    expect(screen.getAllByText("inconnu")).toHaveLength(3);
  });

  it("mène à la fiche interne du dataset (Story 1.12)", () => {
    render(<DatasetCard dataset={buildDataset({ id: 42 })} />);

    expect(screen.getByRole("link", { name: "Yoruba ASR Corpus" })).toHaveAttribute(
      "href",
      "/datasets/42",
    );
  });

  it("redirige vers la source d'origine dans un nouvel onglet sécurisé (FR-13)", () => {
    render(<DatasetCard dataset={buildDataset()} />);

    const link = screen.getByRole("link", { name: /Source externe/i });
    expect(link).toHaveAttribute("href", "https://huggingface.co/datasets/masakhane/yoruba-asr");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("signale la provenance de l'entrée (AD-15)", () => {
    render(<DatasetCard dataset={buildDataset({ provenance: "contribué" })} />);

    expect(screen.getByText("contribué")).toBeInTheDocument();
  });
});
