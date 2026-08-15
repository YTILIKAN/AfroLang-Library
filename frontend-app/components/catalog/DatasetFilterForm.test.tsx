import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatasetFilterForm } from "./DatasetFilterForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

describe("DatasetFilterForm", () => {
  it("pré-remplit les champs avec les filtres déjà appliqués", () => {
    render(<DatasetFilterForm defaults={{ language: "swahili", task: "asr" }} />);

    expect(screen.getByLabelText("Langue")).toHaveValue("swahili");
    expect(screen.getByLabelText("Tâche NLP")).toHaveValue("asr");
  });

  it("navigue vers /filter avec les seuls filtres renseignés", async () => {
    const user = userEvent.setup();
    render(<DatasetFilterForm />);

    await user.type(screen.getByLabelText("Langue"), "swahili");
    await user.selectOptions(screen.getByLabelText("Source"), "kaggle");
    await user.click(screen.getByRole("button", { name: /Appliquer les filtres/i }));

    expect(push).toHaveBeenCalledWith("/filter?language=swahili&source=kaggle");
  });

  it("combine les quatre critères dans une seule requête (FR-12)", async () => {
    const user = userEvent.setup();
    render(<DatasetFilterForm />);

    await user.type(screen.getByLabelText("Langue"), "swahili");
    await user.selectOptions(screen.getByLabelText("Source"), "huggingface");
    await user.selectOptions(screen.getByLabelText("Tâche NLP"), "asr");
    await user.selectOptions(screen.getByLabelText("Format de données"), "audio");
    await user.click(screen.getByRole("button", { name: /Appliquer les filtres/i }));

    expect(push).toHaveBeenCalledWith(
      "/filter?language=swahili&source=huggingface&task=asr&data_format=audio",
    );
  });

  it("propose les deux origines de contribution en plus des connecteurs", async () => {
    const user = userEvent.setup();
    render(<DatasetFilterForm />);

    // `contribution` (source dotée d'une API) et `manual` (source sans API, FR-5) sont les
    // slugs posés par contributor_service : sans eux, un dataset soumis par un chercheur
    // n'est pas filtrable par source.
    await user.selectOptions(screen.getByLabelText("Source"), "contribution");
    await user.click(screen.getByRole("button", { name: /Appliquer les filtres/i }));

    expect(push).toHaveBeenCalledWith("/filter?source=contribution");
    expect(screen.getByRole("option", { name: "Manuel" })).toBeInTheDocument();
  });

  it("refuse une soumission sans aucun critère et n'appelle pas l'API", async () => {
    const user = userEvent.setup();
    render(<DatasetFilterForm />);

    await user.click(screen.getByRole("button", { name: /Appliquer les filtres/i }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText(/Au moins un filtre requis/i)).toBeInTheDocument();
  });

  it("vide les champs et revient à /filter à la réinitialisation", async () => {
    const user = userEvent.setup();
    render(<DatasetFilterForm defaults={{ language: "swahili", source: "kaggle" }} />);

    await user.click(screen.getByRole("button", { name: /Réinitialiser/i }));

    expect(screen.getByLabelText("Langue")).toHaveValue("");
    expect(screen.getByLabelText("Source")).toHaveValue("");
    expect(push).toHaveBeenCalledWith("/filter");
  });
});
