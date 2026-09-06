import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogExplorerForm } from "@/components/catalog/CatalogExplorerForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

/** Les facettes sont repliées tant qu'aucun critère n'est appliqué : il faut les déployer. */
async function openFacets(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Filtres/i }));
}

describe("CatalogExplorerForm", () => {
  it("pré-remplit les champs avec les critères déjà appliqués", () => {
    render(<CatalogExplorerForm defaults={{ q: "corpus", language: "swahili", task: "asr" }} />);

    expect(screen.getByLabelText("Rechercher")).toHaveValue("corpus");
    expect(screen.getByLabelText("Langue")).toHaveValue("swahili");
    expect(screen.getByLabelText("Tâche NLP")).toHaveValue("asr");
  });

  it("navigue vers /catalog avec les seuls critères renseignés", async () => {
    const user = userEvent.setup();
    render(<CatalogExplorerForm />);

    await openFacets(user);
    await user.type(screen.getByLabelText("Langue"), "swahili");
    await user.selectOptions(screen.getByLabelText("Source"), "kaggle");
    await user.click(screen.getByRole("button", { name: /Appliquer/i }));

    expect(push).toHaveBeenCalledWith("/catalog?language=swahili&source=kaggle");
  });

  it("combine la recherche plein texte et les quatre facettes (FR-11, FR-12)", async () => {
    const user = userEvent.setup();
    render(<CatalogExplorerForm />);

    await user.type(screen.getByLabelText("Rechercher"), "corpus");
    await openFacets(user);
    await user.type(screen.getByLabelText("Langue"), "swahili");
    await user.selectOptions(screen.getByLabelText("Source"), "huggingface");
    await user.selectOptions(screen.getByLabelText("Tâche NLP"), "asr");
    await user.selectOptions(screen.getByLabelText("Format de données"), "audio");
    await user.click(screen.getByRole("button", { name: /Appliquer/i }));

    expect(push).toHaveBeenCalledWith(
      "/catalog?q=corpus&language=swahili&source=huggingface&task=asr&data_format=audio",
    );
  });

  it("propose les deux origines de contribution en plus des connecteurs", async () => {
    const user = userEvent.setup();
    render(<CatalogExplorerForm />);

    // `contribution` (source dotée d'une API) et `manual` (source sans API, FR-5) sont les
    // slugs posés par contributor_service : sans eux, un dataset soumis par un chercheur
    // n'est pas filtrable par source.
    await openFacets(user);
    await user.selectOptions(screen.getByLabelText("Source"), "contribution");
    await user.click(screen.getByRole("button", { name: /Appliquer/i }));

    expect(push).toHaveBeenCalledWith("/catalog?source=contribution");
    expect(screen.getByRole("option", { name: "Manuel" })).toBeInTheDocument();
  });

  it("accepte une soumission vide : /catalog sans critère affiche l'index complet", async () => {
    const user = userEvent.setup();
    render(<CatalogExplorerForm />);

    await openFacets(user);
    await user.click(screen.getByRole("button", { name: /Appliquer/i }));

    expect(push).toHaveBeenCalledWith("/catalog");
  });

  it("vide tous les champs et revient à /catalog à la réinitialisation", async () => {
    const user = userEvent.setup();
    render(
      <CatalogExplorerForm defaults={{ q: "corpus", language: "swahili", source: "kaggle" }} />,
    );

    await user.click(screen.getByRole("button", { name: /Réinitialiser/i }));

    expect(screen.getByLabelText("Rechercher")).toHaveValue("");
    expect(screen.getByLabelText("Langue")).toHaveValue("");
    expect(screen.getByLabelText("Source")).toHaveValue("");
    expect(push).toHaveBeenCalledWith("/catalog");
  });

  it("le bouton Rechercher soumet aussi les facettes — un seul formulaire, un seul état", async () => {
    const user = userEvent.setup();
    render(<CatalogExplorerForm />);

    await user.type(screen.getByLabelText("Rechercher"), "traduction");
    await openFacets(user);
    await user.selectOptions(screen.getByLabelText("Format de données"), "text");
    await user.click(screen.getByRole("button", { name: /^Rechercher$/i }));

    expect(push).toHaveBeenCalledWith("/catalog?q=traduction&data_format=text");
  });

  it("replie les facettes par défaut et les déploie au clic", async () => {
    const user = userEvent.setup();
    render(<CatalogExplorerForm />);

    const toggle = screen.getByRole("button", { name: /Filtres/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /Appliquer/i })).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Appliquer/i })).toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("déploie les facettes d'emblée quand un critère de facette est déjà appliqué", () => {
    render(<CatalogExplorerForm defaults={{ language: "swahili" }} />);

    expect(screen.getByRole("button", { name: /Filtres/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("laisse les facettes repliées quand seule la recherche plein texte est appliquée", () => {
    render(<CatalogExplorerForm defaults={{ q: "corpus" }} />);

    expect(screen.getByRole("button", { name: /Filtres/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("indique le nombre de facettes actives sur le bouton replié", () => {
    render(<CatalogExplorerForm defaults={{ q: "corpus", language: "swahili", task: "asr" }} />);

    expect(screen.getByRole("button", { name: /Filtres.*2 actifs/i })).toBeInTheDocument();
  });
});
