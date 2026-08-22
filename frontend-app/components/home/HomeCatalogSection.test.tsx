import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CATALOG_PAGE_SIZE, HomeCatalogSection } from "./HomeCatalogSection";
import { buildDataset } from "@/test/fixtures";

function buildDatasets(count: number) {
  return Array.from({ length: count }, (_, index) =>
    buildDataset({ id: index + 1, title: `Dataset ${index + 1}` }),
  );
}

function renderSection(count: number) {
  const datasets = buildDatasets(count);
  render(<HomeCatalogSection datasets={datasets} total={count} loadError={false} />);
  return datasets;
}

describe("HomeCatalogSection", () => {
  it("n'affiche qu'un palier de 10 datasets à l'ouverture", () => {
    renderSection(24);

    expect(screen.getAllByRole("listitem")).toHaveLength(CATALOG_PAGE_SIZE);
    expect(screen.getByText("Dataset 10")).toBeInTheDocument();
    expect(screen.queryByText("Dataset 11")).not.toBeInTheDocument();
  });

  it("indique le nombre de fiches affichées sur le total chargé", () => {
    renderSection(24);

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
  });

  it("révèle le palier suivant à chaque « Lire plus » jusqu'à tout afficher", async () => {
    const user = userEvent.setup();
    renderSection(24);

    await user.click(screen.getByRole("button", { name: "Lire plus (10)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(20);

    await user.click(screen.getByRole("button", { name: "Lire plus (4)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(24);
    expect(screen.queryByRole("button", { name: /Lire plus/ })).not.toBeInTheDocument();
  });

  it("bascule entre l'index complet et le palier réduit depuis la barre", async () => {
    const user = userEvent.setup();
    renderSection(24);

    const toggle = screen.getByRole("button", { name: "Tout afficher" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(screen.getAllByRole("listitem")).toHaveLength(24);

    const collapse = screen.getByRole("button", { name: "Réduire la liste" });
    expect(collapse).toHaveAttribute("aria-pressed", "true");

    await user.click(collapse);
    expect(screen.getAllByRole("listitem")).toHaveLength(CATALOG_PAGE_SIZE);
  });

  it("n'affiche ni barre ni « Lire plus » quand la section tient en un palier", () => {
    renderSection(CATALOG_PAGE_SIZE);

    expect(screen.getAllByRole("listitem")).toHaveLength(CATALOG_PAGE_SIZE);
    expect(screen.queryByRole("button", { name: "Tout afficher" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Lire plus/ })).not.toBeInTheDocument();
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
