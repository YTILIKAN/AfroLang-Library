import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogSearchBar } from "./CatalogSearchBar";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

describe("CatalogSearchBar", () => {
  it("envoie la saisie vers le catalogue en recherche plein texte", async () => {
    const user = userEvent.setup();
    render(<CatalogSearchBar />);

    await user.type(screen.getByLabelText("Rechercher"), "Yorùbá");
    await user.click(screen.getByRole("button", { name: /Explorer/i }));

    expect(push).toHaveBeenCalledWith("/catalog?q=Yor%C3%B9b%C3%A1");
  });

  it("ouvre l'index complet quand la saisie est vide", async () => {
    const user = userEvent.setup();
    render(<CatalogSearchBar />);

    await user.click(screen.getByRole("button", { name: /Explorer/i }));

    expect(push).toHaveBeenCalledWith("/catalog");
  });
});
