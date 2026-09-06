import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DatasetAdminPanel } from "@/components/admin/DatasetAdminPanel";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import { buildDataset } from "@/test/fixtures";

// Le panneau rend AdminShell > SiteHeader, qui consomme le routeur et la session.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/datasets",
  useSearchParams: () => new URLSearchParams(),
}));

const listAdminDatasets = vi.fn();
const createAdminDataset = vi.fn();
const updateAdminDataset = vi.fn();
const deleteAdminDataset = vi.fn();
vi.mock("@/lib/api/accounts", () => ({
  listAdminDatasets: () => listAdminDatasets(),
  createAdminDataset: (...args: unknown[]) => createAdminDataset(...args),
  updateAdminDataset: (...args: unknown[]) => updateAdminDataset(...args),
  deleteAdminDataset: (...args: unknown[]) => deleteAdminDataset(...args),
  fetchMe: vi.fn().mockRejectedValue(new Error("pas de session")),
  logout: vi.fn().mockResolvedValue(undefined),
}));

// Sans jeton stocké, AuthProvider se stabilise sur une session anonyme sans appel réseau.
vi.mock("@/lib/auth-storage", () => ({
  getStoredToken: () => null,
  clearStoredToken: vi.fn(),
  setStoredToken: vi.fn(),
}));

function renderPanel() {
  return render(
    <AuthProvider>
      <DatasetAdminPanel adminName="Awa" onLogout={vi.fn()} />
    </AuthProvider>,
  );
}

/** Trois entrées, une par origine — l'admin les gère toutes (FR-19). */
function allOrigins() {
  return [
    buildDataset({ id: 1, title: "Yoruba ASR Corpus", provenance: "synchronisé" }),
    buildDataset({
      id: 2,
      title: "Corpus Twi",
      provenance: "contribué",
      source: { slug: "contribution", name: "Contribution", base_url: "" },
    }),
    buildDataset({
      id: 3,
      title: "Archive Ewe",
      provenance: "manuel",
      source: { slug: "manual", name: "Manual", base_url: "" },
    }),
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DatasetAdminPanel (Story 4.3)", () => {
  it("affiche tous les datasets de l'index, quelle qu'en soit l'origine (FR-19)", async () => {
    listAdminDatasets.mockResolvedValue({ total: 3, datasets: allOrigins() });
    renderPanel();

    expect(await screen.findByText("Yoruba ASR Corpus")).toBeInTheDocument();
    expect(screen.getByText("Corpus Twi")).toBeInTheDocument();
    expect(screen.getByText("Archive Ewe")).toBeInTheDocument();
    expect(screen.getByText("synchronisé")).toBeInTheDocument();
    expect(screen.getByText("contribué")).toBeInTheDocument();
    expect(screen.getByText("manuel")).toBeInTheDocument();
    expect(screen.getByText(/3 entrées/)).toBeInTheDocument();
  });

  it("ajoute un dataset sans inventer les métadonnées laissées vides", async () => {
    const user = userEvent.setup();
    listAdminDatasets
      .mockResolvedValueOnce({ total: 0, datasets: [] })
      .mockResolvedValueOnce({ total: 1, datasets: [buildDataset({ title: "Corpus Ghomala" })] });
    createAdminDataset.mockResolvedValue(buildDataset({ title: "Corpus Ghomala" }));
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Ajouter un dataset" }));
    await user.type(screen.getByLabelText("Titre"), "Corpus Ghomala");
    await user.type(screen.getByLabelText("Lien source (source_url)"), "https://example.org/ghomala");
    await user.type(screen.getByLabelText("Langue (code ou alias)"), "bbj");
    await user.type(screen.getByLabelText("Tâche NLP"), "classification");
    await user.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() =>
      expect(createAdminDataset).toHaveBeenCalledWith({
        title: "Corpus Ghomala",
        source_url: "https://example.org/ghomala",
        language: "bbj",
        task: "classification",
        provenance: "manuel",
        source_slug: "manual",
      }),
    );
    expect(await screen.findByText("Corpus Ghomala")).toBeInTheDocument();
  });

  it("n'envoie en modification que les champs réellement changés", async () => {
    const user = userEvent.setup();
    const dataset = buildDataset({ id: 1, title: "Yoruba ASR Corpus" });
    listAdminDatasets.mockResolvedValue({ total: 1, datasets: [dataset] });
    updateAdminDataset.mockResolvedValue(dataset);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Modifier Yoruba ASR Corpus" }));
    const title = screen.getByLabelText("Titre");
    await user.clear(title);
    await user.type(title, "Yoruba ASR Corpus v2");
    await user.click(screen.getByRole("button", { name: "Mettre à jour" }));

    await waitFor(() =>
      expect(updateAdminDataset).toHaveBeenCalledWith(1, { title: "Yoruba ASR Corpus v2" }),
    );
  });

  it("n'appelle pas l'API quand la modification ne change rien", async () => {
    const user = userEvent.setup();
    listAdminDatasets.mockResolvedValue({ total: 1, datasets: [buildDataset()] });
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Modifier Yoruba ASR Corpus" }));
    await user.click(screen.getByRole("button", { name: "Mettre à jour" }));

    await waitFor(() => expect(listAdminDatasets).toHaveBeenCalledTimes(2));
    expect(updateAdminDataset).not.toHaveBeenCalled();
  });

  it("repose la sentinelle « inconnu » quand un champ est vidé", async () => {
    const user = userEvent.setup();
    const dataset = buildDataset({ id: 7, description: "Corpus de reconnaissance vocale" });
    listAdminDatasets.mockResolvedValue({ total: 1, datasets: [dataset] });
    updateAdminDataset.mockResolvedValue(dataset);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: `Modifier ${dataset.title}` }));
    await user.clear(screen.getByLabelText("Description"));
    await user.click(screen.getByRole("button", { name: "Mettre à jour" }));

    await waitFor(() => expect(updateAdminDataset).toHaveBeenCalledWith(7, { description: "inconnu" }));
  });

  it("n'affiche pas « inconnu » comme valeur pré-remplie du formulaire", async () => {
    const user = userEvent.setup();
    listAdminDatasets.mockResolvedValue({
      total: 1,
      datasets: [buildDataset({ description: "inconnu", size: "inconnu", license: null })],
    });
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Modifier Yoruba ASR Corpus" }));

    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.getByLabelText("Taille")).toHaveValue("");
    expect(screen.getByLabelText("Licence")).toHaveValue("");
  });

  it("avertit qu'une saisie de tâche remplace les tâches multiples", async () => {
    const user = userEvent.setup();
    listAdminDatasets.mockResolvedValue({
      total: 1,
      datasets: [
        buildDataset({
          tasks: [
            { code: "asr", label: "ASR" },
            { code: "nmt", label: "Traduction" },
          ],
        }),
      ],
    });
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Modifier Yoruba ASR Corpus" }));

    expect(screen.getByText(/plusieurs tâches \(ASR, Traduction\)/)).toBeInTheDocument();
  });

  it("supprime un dataset après confirmation puis recharge la liste", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    listAdminDatasets
      .mockResolvedValueOnce({ total: 1, datasets: [buildDataset({ id: 4 })] })
      .mockResolvedValueOnce({ total: 0, datasets: [] });
    deleteAdminDataset.mockResolvedValue({ detail: "Dataset supprimé" });
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Supprimer Yoruba ASR Corpus" }));

    await waitFor(() => expect(deleteAdminDataset).toHaveBeenCalledWith(4));
    expect(await screen.findByText("Aucun dataset dans l'index.")).toBeInTheDocument();
  });

  it("ne supprime rien si la confirmation est refusée", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    listAdminDatasets.mockResolvedValue({ total: 1, datasets: [buildDataset()] });
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Supprimer Yoruba ASR Corpus" }));

    expect(deleteAdminDataset).not.toHaveBeenCalled();
  });

  it("remonte le refus du serveur pour un compte non-admin (AD-14)", async () => {
    listAdminDatasets.mockRejectedValue(new ApiError("Réservé au rôle Admin", 403));
    renderPanel();

    expect(await screen.findByText("Réservé au rôle Admin")).toBeInTheDocument();
  });

  it("filtre la liste sur le titre, la langue, la source ou l'origine", async () => {
    const user = userEvent.setup();
    listAdminDatasets.mockResolvedValue({ total: 3, datasets: allOrigins() });
    renderPanel();

    await user.type(
      await screen.findByLabelText("Filtrer la liste (titre, langue, source, origine)"),
      "contribué",
    );

    expect(screen.getByText("Corpus Twi")).toBeInTheDocument();
    expect(screen.queryByText("Archive Ewe")).not.toBeInTheDocument();
    expect(screen.getByText(/1 \/ 3 datasets/)).toBeInTheDocument();
  });
});
