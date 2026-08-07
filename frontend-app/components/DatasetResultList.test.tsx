import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatasetResultList } from "./DatasetResultList";
import { buildDataset } from "@/test/fixtures";

describe("DatasetResultList", () => {
  it("affiche un message explicite quand aucun dataset ne correspond", () => {
    render(<DatasetResultList total={0} datasets={[]} />);

    expect(screen.getByText(/Aucun dataset ne correspond/i)).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("affiche une fiche par dataset reçu", () => {
    const datasets = [
      buildDataset({ id: 1, title: "Yoruba ASR Corpus" }),
      buildDataset({ id: 2, title: "Wolof Parallel Corpus" }),
    ];

    render(<DatasetResultList total={datasets.length} datasets={datasets} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Yoruba ASR Corpus" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Wolof Parallel Corpus" })).toBeInTheDocument();
  });

  it("annonce le nombre de résultats", () => {
    const datasets = [buildDataset({ id: 1 })];

    render(<DatasetResultList total={1} datasets={datasets} />);

    expect(screen.getByText("1 dataset")).toBeInTheDocument();
  });

  it("accorde le compteur au pluriel", () => {
    const datasets = [buildDataset({ id: 1 }), buildDataset({ id: 2 }), buildDataset({ id: 3 })];

    render(<DatasetResultList total={3} datasets={datasets} />);

    expect(screen.getByText("3 datasets")).toBeInTheDocument();
  });
});
