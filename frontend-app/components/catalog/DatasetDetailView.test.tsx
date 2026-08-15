import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { DatasetDetailView } from "./DatasetDetailView";
import { buildDatasetDetail } from "@/test/fixtures";

describe("DatasetDetailView (Story 1.12)", () => {
  it("affiche les métadonnées normalisées de la fiche (FR-13)", () => {
    render(<DatasetDetailView dataset={buildDatasetDetail()} />);

    expect(screen.getByRole("heading", { name: "Yoruba ASR Corpus" })).toBeInTheDocument();
    expect(screen.getByText("Yoruba (yor)")).toBeInTheDocument();
    expect(screen.getByText("ASR (asr)")).toBeInTheDocument();
    expect(screen.getByText("audio")).toBeInTheDocument();
    expect(screen.getByText("2.5 GB")).toBeInTheDocument();
    expect(screen.getByText("CC BY 4.0")).toBeInTheDocument();
    expect(screen.getByText("Hugging Face (huggingface)")).toBeInTheDocument();
  });

  it("affiche « inconnu » pour chaque métadonnée absente plutôt que de l'inventer", () => {
    render(
      <DatasetDetailView
        dataset={buildDatasetDetail({
          description: "",
          data_format: "",
          size: "",
          license: null,
          tasks: [],
        })}
      />,
    );

    // Description, tâches, format, taille, licence.
    expect(screen.getAllByText("inconnu")).toHaveLength(5);
  });

  it("redirige vers la source d'origine dans un nouvel onglet sécurisé", () => {
    render(<DatasetDetailView dataset={buildDatasetDetail()} />);

    const link = screen.getByRole("link", { name: "Ouvrir sur la source" });
    expect(link).toHaveAttribute("href", "https://huggingface.co/datasets/masakhane/yoruba-asr");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("masque le libellé source brut quand il est inconnu", () => {
    render(<DatasetDetailView dataset={buildDatasetDetail({ language_raw: "inconnu" })} />);

    expect(screen.queryByText("Libellé source")).not.toBeInTheDocument();
  });

  it("n'affiche la date de publication que si la source la fournit", () => {
    const { rerender } = render(<DatasetDetailView dataset={buildDatasetDetail()} />);
    expect(screen.getByText(/Publié :/)).toBeInTheDocument();

    rerender(<DatasetDetailView dataset={buildDatasetDetail({ published_at: null })} />);
    expect(screen.queryByText(/Publié :/)).not.toBeInTheDocument();
    expect(screen.getByText(/Indexé :/)).toBeInTheDocument();
  });

  it("signale la provenance de l'entrée (AD-15)", () => {
    render(<DatasetDetailView dataset={buildDatasetDetail({ provenance: "contribué" })} />);

    expect(screen.getByText("contribué")).toBeInTheDocument();
  });
});
