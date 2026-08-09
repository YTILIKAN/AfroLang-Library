import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResearcherLoginForm } from "./AuthForms";
import { AuthProvider } from "./AuthProvider";
import { ApiError } from "@/lib/api/client";
import { buildAccount } from "@/test/accounts";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

const login = vi.fn();
const fetchMe = vi.fn();
const apiLogout = vi.fn();
vi.mock("@/lib/api/accounts", () => ({
  login: (...args: unknown[]) => login(...args),
  fetchMe: () => fetchMe(),
  logout: () => apiLogout(),
  register: vi.fn(),
}));

const setStoredToken = vi.fn();
const getStoredToken = vi.fn();
vi.mock("@/lib/auth-storage", () => ({
  setStoredToken: (token: string) => setStoredToken(token),
  getStoredToken: () => getStoredToken(),
  clearStoredToken: vi.fn(),
}));

function renderLogin(redirectTo?: string) {
  return render(
    <AuthProvider>
      <ResearcherLoginForm redirectTo={redirectTo} />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getStoredToken.mockReturnValue(null);
});

describe("ResearcherLoginForm (Story 3.4)", () => {
  it("ne pré-remplit aucun identifiant", () => {
    renderLogin();

    expect(screen.getByLabelText("E-mail")).toHaveValue("");
    expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
  });

  it("authentifie le chercheur, conserve le jeton et redirige (FR-16)", async () => {
    const user = userEvent.setup();
    const account = buildAccount();
    login.mockResolvedValue({
      access_token: "jeton-123",
      token_type: "bearer",
      expires_at: "2026-12-31T00:00:00Z",
      account,
    });
    renderLogin();

    await user.type(screen.getByLabelText("E-mail"), "kofi@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("kofi@example.com", "password123"));
    expect(setStoredToken).toHaveBeenCalledWith("jeton-123");
    expect(push).toHaveBeenCalledWith("/contribute");
  });

  it("redirige vers la destination demandée après connexion", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      access_token: "jeton-123",
      token_type: "bearer",
      expires_at: "2026-12-31T00:00:00Z",
      account: buildAccount(),
    });
    renderLogin("/contribute/mine");

    await user.type(screen.getByLabelText("E-mail"), "kofi@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/contribute/mine"));
  });

  it("affiche le message d'erreur du serveur sans stocker de jeton", async () => {
    const user = userEvent.setup();
    login.mockRejectedValue(new ApiError("Identifiants invalides", 401));
    renderLogin();

    await user.type(screen.getByLabelText("E-mail"), "kofi@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    expect(await screen.findByText("Identifiants invalides")).toBeInTheDocument();
    expect(setStoredToken).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("refuse un compte désactivé sans ouvrir de session", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      access_token: "jeton-123",
      token_type: "bearer",
      expires_at: "2026-12-31T00:00:00Z",
      account: buildAccount({ is_active: false }),
    });
    renderLogin();

    await user.type(screen.getByLabelText("E-mail"), "kofi@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    expect(await screen.findByText(/compte est désactivé/i)).toBeInTheDocument();
    expect(setStoredToken).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("propose la création de compte pour un nouveau chercheur", () => {
    renderLogin();

    expect(screen.getByRole("link", { name: /Créer un compte/i })).toHaveAttribute(
      "href",
      "/auth/register",
    );
  });
});
