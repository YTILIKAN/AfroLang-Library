import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatasetCard } from "./DatasetCard";
import { buildDataset } from "@/test/fixtures";

describe("DatasetCard", () => {
  it("affiche les métadonnées normalisées du dataset", () => {
    render(<DatasetCard dataset={buildDataset()} />);

    expect(screen.getByRole("heading", { name: "Yoruba ASR Corpus" })).toBeInTheDocument();
    expect(screen.getByText("Yoruba")).toBeInTheDocument();
    expect(screen.getByText("ASR")).toBeInTheDocument();
    expect(screen.getByText("2.5 GB")).toBeInTheDocument();
    expect(screen.getByText("CC BY 4.0")).toBeInTheDocument();
  });

  it("affiche « inconnu » quand la licence est absente (null)", () => {
    render(<DatasetCard dataset={buildDataset({ license: null })} />);

    expect(screen.getByText("inconnu")).toBeInTheDocument();
  });

  it("affiche « inconnu » quand aucune tâche n'est renseignée", () => {
    render(<DatasetCard dataset={buildDataset({ tasks: [] })} />);

    expect(screen.getByText("inconnu")).toBeInTheDocument();
  });

  it("redirige vers la source d'origine au clic, dans un nouvel onglet sécurisé", () => {
    render(<DatasetCard dataset={buildDataset()} />);

    const link = screen.getByRole("link", { name: /Yoruba ASR Corpus/i });
    expect(link).toHaveAttribute("href", "https://huggingface.co/datasets/masakhane/yoruba-asr");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
