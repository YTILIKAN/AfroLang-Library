import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MyDatasetsPanel } from "@/components/contribute/MyDatasetsPanel";
import { ApiError } from "@/lib/api/client";
import { buildContribution } from "@/test/accounts";

const listMyDatasets = vi.fn();
const updateMyDataset = vi.fn();
const deleteMyDataset = vi.fn();
vi.mock("@/lib/api/accounts", () => ({
  listMyDatasets: () => listMyDatasets(),
  updateMyDataset: (...args: unknown[]) => updateMyDataset(...args),
  deleteMyDataset: (...args: unknown[]) => deleteMyDataset(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MyDatasetsPanel (Story 3.6)", () => {
  it("n'affiche que les contributions renvoyées par /accounts/datasets/mine (FR-18)", async () => {
    listMyDatasets.mockResolvedValue({
      total: 2,
      datasets: [
        buildContribution({ id: 9001, title: "Corpus Twi" }),
        buildContribution({ id: 9002, title: "Archive Ewe", provenance: "manuel" }),
      ],
    });
    render(<MyDatasetsPanel />);

    expect(await screen.findByText("Corpus Twi")).toBeInTheDocument();
    expect(screen.getByText("Archive Ewe")).toBeInTheDocument();
    expect(screen.getByText("2 contributions — API /accounts/datasets/mine")).toBeInTheDocument();
  });

  it("propose de soumettre quand le chercheur n'a encore rien contribué", async () => {
    listMyDatasets.mockResolvedValue({ total: 0, datasets: [] });
    render(<MyDatasetsPanel />);

    expect(await screen.findByText(/Aucune contribution pour le moment/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Soumettre un dataset/i })).toHaveAttribute(
      "href",
      "/contribute/submit",
    );
  });

  it("met à jour le titre d'une soumission puis recharge la liste", async () => {
    const user = userEvent.setup();
    listMyDatasets
      .mockResolvedValueOnce({ total: 1, datasets: [buildContribution({ title: "Corpus Twi" })] })
      .mockResolvedValueOnce({
        total: 1,
        datasets: [buildContribution({ title: "Corpus Twi v2" })],
      });
    updateMyDataset.mockResolvedValue(buildContribution({ title: "Corpus Twi v2" }));
    render(<MyDatasetsPanel />);

    await user.click(await screen.findByRole("button", { name: "Modifier" }));
    const field = screen.getByRole("textbox");
    await user.clear(field);
    await user.type(field, "Corpus Twi v2");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(updateMyDataset).toHaveBeenCalledWith(9001, { title: "Corpus Twi v2" }));
    expect(await screen.findByText("Corpus Twi v2")).toBeInTheDocument();
  });

  it("supprime une soumission après confirmation", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    listMyDatasets
      .mockResolvedValueOnce({ total: 1, datasets: [buildContribution()] })
      .mockResolvedValueOnce({ total: 0, datasets: [] });
    deleteMyDataset.mockResolvedValue({ detail: "Dataset supprimé" });
    render(<MyDatasetsPanel />);

    await user.click(await screen.findByRole("button", { name: "Supprimer" }));

    await waitFor(() => expect(deleteMyDataset).toHaveBeenCalledWith(9001));
    expect(await screen.findByText(/Aucune contribution pour le moment/i)).toBeInTheDocument();
  });

  it("ne supprime rien si la confirmation est refusée", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    listMyDatasets.mockResolvedValue({ total: 1, datasets: [buildContribution()] });
    render(<MyDatasetsPanel />);

    await user.click(await screen.findByRole("button", { name: "Supprimer" }));

    expect(deleteMyDataset).not.toHaveBeenCalled();
  });

  it("remonte le refus du serveur quand la soumission n'appartient pas au compte (AD-14)", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    listMyDatasets.mockResolvedValue({ total: 1, datasets: [buildContribution()] });
    deleteMyDataset.mockRejectedValue(new ApiError("Accès refusé à ce dataset", 403));
    render(<MyDatasetsPanel />);

    await user.click(await screen.findByRole("button", { name: "Supprimer" }));

    expect(await screen.findByText("Accès refusé à ce dataset")).toBeInTheDocument();
  });

  it("affiche l'origine de chaque contribution (AD-15)", async () => {
    listMyDatasets.mockResolvedValue({
      total: 1,
      datasets: [buildContribution({ provenance: "manuel" })],
    });
    render(<MyDatasetsPanel />);

    const row = (await screen.findByText("Corpus Twi")).closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("manuel")).toBeInTheDocument();
  });

  it("signale l'échec de chargement de la liste", async () => {
    listMyDatasets.mockRejectedValue(new ApiError("Session expirée", 401));
    render(<MyDatasetsPanel />);

    expect(await screen.findByText("Session expirée")).toBeInTheDocument();
  });
});
