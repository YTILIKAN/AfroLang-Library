import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AccountAdminPanel } from "./AccountAdminPanel";
import { ApiError } from "@/lib/api/client";
import { buildAccount } from "@/test/fixtures";

const listAdminAccounts = vi.fn();
const createAdminAccount = vi.fn();
const updateAdminAccount = vi.fn();
vi.mock("@/lib/api/accounts", () => ({
  listAdminAccounts: () => listAdminAccounts(),
  createAdminAccount: (...args: unknown[]) => createAdminAccount(...args),
  updateAdminAccount: (...args: unknown[]) => updateAdminAccount(...args),
}));

/** L'admin connecté porte l'id 10 — les gardes d'auto-désactivation s'y réfèrent. */
const CURRENT_ADMIN_ID = 10;

function renderPanel() {
  return render(
    <AccountAdminPanel
      adminName="Kofi"
      currentAccountId={CURRENT_ADMIN_ID}
      onLogout={vi.fn()}
    />,
  );
}

function buildCurrentAdmin() {
  return buildAccount({
    id: CURRENT_ADMIN_ID,
    email: "kofi@afriland.org",
    display_name: "Kofi Mensah",
    role: "admin",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AccountAdminPanel (Story 4.4)", () => {
  it("liste les comptes avec leur rôle et leur statut", async () => {
    listAdminAccounts.mockResolvedValue({
      total: 2,
      accounts: [
        buildCurrentAdmin(),
        buildAccount({ id: 2, display_name: "Awa Ndiaye", is_active: false }),
      ],
    });
    renderPanel();

    expect(await screen.findByText("Awa Ndiaye")).toBeInTheDocument();
    expect(screen.getByText("kofi@afriland.org")).toBeInTheDocument();
    expect(screen.getByLabelText("Rôle de Kofi Mensah")).toHaveValue("admin");
    expect(screen.getByLabelText("Rôle de Awa Ndiaye")).toHaveValue("chercheur");
    expect(screen.getByText("Actif")).toBeInTheDocument();
    expect(screen.getByText("Désactivé")).toBeInTheDocument();
    expect(screen.getByText(/2 comptes — API \/accounts\/admin\/accounts/)).toBeInTheDocument();
  });

  it("crée un compte en lui attribuant un rôle (FR-20)", async () => {
    const user = userEvent.setup();
    listAdminAccounts
      .mockResolvedValueOnce({ total: 0, accounts: [] })
      .mockResolvedValueOnce({ total: 1, accounts: [buildAccount({ display_name: "Aïcha Diallo" })] });
    createAdminAccount.mockResolvedValue(buildAccount({ display_name: "Aïcha Diallo" }));
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Créer un compte" }));
    await user.type(screen.getByLabelText("E-mail"), "aicha@university.org");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    await user.type(screen.getByLabelText("Nom affiché"), "Aïcha Diallo");
    await user.selectOptions(screen.getByLabelText("Rôle"), "admin");
    await user.click(screen.getByRole("button", { name: "Créer le compte" }));

    await waitFor(() =>
      expect(createAdminAccount).toHaveBeenCalledWith({
        email: "aicha@university.org",
        password: "password123",
        display_name: "Aïcha Diallo",
        role: "admin",
      }),
    );
    expect(await screen.findByText("Aïcha Diallo")).toBeInTheDocument();
  });

  it("attribue un nouveau rôle à un compte existant (FR-20)", async () => {
    const user = userEvent.setup();
    const account = buildAccount({ id: 2, display_name: "Awa Ndiaye" });
    listAdminAccounts.mockResolvedValue({ total: 1, accounts: [account] });
    updateAdminAccount.mockResolvedValue({ ...account, role: "admin" });
    renderPanel();

    await user.selectOptions(await screen.findByLabelText("Rôle de Awa Ndiaye"), "admin");

    await waitFor(() => expect(updateAdminAccount).toHaveBeenCalledWith(2, { role: "admin" }));
  });

  it("désactive un compte puis recharge la liste (FR-20)", async () => {
    const user = userEvent.setup();
    const account = buildAccount({ id: 2, display_name: "Awa Ndiaye" });
    listAdminAccounts
      .mockResolvedValueOnce({ total: 1, accounts: [account] })
      .mockResolvedValueOnce({ total: 1, accounts: [{ ...account, is_active: false }] });
    updateAdminAccount.mockResolvedValue({ ...account, is_active: false });
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Désactiver Awa Ndiaye" }));

    await waitFor(() => expect(updateAdminAccount).toHaveBeenCalledWith(2, { is_active: false }));
    expect(await screen.findByText("Désactivé")).toBeInTheDocument();
  });

  it("réactive un compte désactivé", async () => {
    const user = userEvent.setup();
    const account = buildAccount({ id: 2, display_name: "Awa Ndiaye", is_active: false });
    listAdminAccounts.mockResolvedValue({ total: 1, accounts: [account] });
    updateAdminAccount.mockResolvedValue({ ...account, is_active: true });
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Réactiver Awa Ndiaye" }));

    await waitFor(() => expect(updateAdminAccount).toHaveBeenCalledWith(2, { is_active: true }));
  });

  it("interdit à l'admin de désactiver son propre compte", async () => {
    listAdminAccounts.mockResolvedValue({ total: 1, accounts: [buildCurrentAdmin()] });
    renderPanel();

    expect(await screen.findByRole("button", { name: "Désactiver Kofi Mensah" })).toBeDisabled();
    expect(updateAdminAccount).not.toHaveBeenCalled();
  });

  it("remonte le refus du serveur pour un compte non-admin (AD-14)", async () => {
    listAdminAccounts.mockRejectedValue(new ApiError("Réservé au rôle Admin", 403));
    renderPanel();

    expect(await screen.findByText("Réservé au rôle Admin")).toBeInTheDocument();
  });

  it("affiche le conflit d'e-mail renvoyé par le serveur", async () => {
    const user = userEvent.setup();
    listAdminAccounts.mockResolvedValue({ total: 0, accounts: [] });
    createAdminAccount.mockRejectedValue(
      new ApiError("Un compte existe déjà avec cet e-mail", 409),
    );
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Créer un compte" }));
    await user.type(screen.getByLabelText("E-mail"), "awa@university.org");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    await user.type(screen.getByLabelText("Nom affiché"), "Awa Ndiaye");
    await user.click(screen.getByRole("button", { name: "Créer le compte" }));

    expect(await screen.findByText("Un compte existe déjà avec cet e-mail")).toBeInTheDocument();
  });
});
