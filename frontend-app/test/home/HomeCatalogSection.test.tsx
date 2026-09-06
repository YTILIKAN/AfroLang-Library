import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HOME_PREVIEW_SIZE, HomeCatalogSection } from "@/components/home/HomeCatalogSection";
import { buildDataset } from "@/test/fixtures";

function buildDatasets(count: number) {
  return Array.from({ length: count }, (_, index) =>
    buildDataset({ id: index + 1, title: `Dataset ${index + 1}` }),
  );
}

function renderSection(loaded: number, total = loaded) {
  const datasets = buildDatasets(loaded);
  render(<HomeCatalogSection datasets={datasets} total={total} loadError={false} />);
  return datasets;
}

describe("HomeCatalogSection", () => {
  it("n'affiche qu'un aperçu de six fiches, quelle que soit la taille de l'index", () => {
    renderSection(24);

    expect(screen.getAllByRole("listitem")).toHaveLength(HOME_PREVIEW_SIZE);
    expect(screen.getByText("Dataset 6")).toBeInTheDocument();
    expect(screen.queryByText("Dataset 7")).not.toBeInTheDocument();
  });

  it("renvoie « Lire plus » vers le catalogue avec le reste à parcourir", () => {
    renderSection(24);

    const link = screen.getByRole("link", { name: "Lire plus (18)" });
    expect(link).toHaveAttribute("href", "/catalog");
    expect(screen.getByText("Encore 18 datasets dans le catalogue complet")).toBeInTheDocument();
  });

  it("compte le reste sur le total de l'index, pas sur les fiches chargées", () => {
    renderSection(HOME_PREVIEW_SIZE, 42);

    expect(screen.getByRole("link", { name: "Lire plus (36)" })).toBeInTheDocument();
  });

  it("propose d'explorer le catalogue quand l'aperçu couvre tout l'index", () => {
    renderSection(HOME_PREVIEW_SIZE);

    const link = screen.getByRole("link", { name: "Explorer le catalogue" });
    expect(link).toHaveAttribute("href", "/catalog");
    expect(screen.queryByRole("link", { name: /Lire plus/ })).not.toBeInTheDocument();
  });

  it("laisse les états de chargement et d'erreur intacts", () => {
    const { rerender } = render(
      <HomeCatalogSection datasets={[]} total={0} loadError={false} loading />,
    );
    expect(screen.getByText("Chargement du catalogue…")).toBeInTheDocument();

    rerender(<HomeCatalogSection datasets={[]} total={0} loadError />);
    expect(screen.getByText("Catalogue momentanément indisponible")).toBeInTheDocument();
  });
});
