import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AdminGate } from "@/components/auth/AdminGate";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { buildAccount } from "@/test/accounts";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/datasets",
  useSearchParams: () => new URLSearchParams(),
}));

const fetchMe = vi.fn();
const apiLogin = vi.fn();
const apiLogout = vi.fn();
vi.mock("@/lib/api/accounts", () => ({
  fetchMe: () => fetchMe(),
  login: (...args: unknown[]) => apiLogin(...args),
  logout: () => apiLogout(),
  register: vi.fn(),
}));

const getStoredToken = vi.fn();
const clearStoredToken = vi.fn();
vi.mock("@/lib/auth-storage", () => ({
  getStoredToken: () => getStoredToken(),
  clearStoredToken: () => clearStoredToken(),
  setStoredToken: vi.fn(),
}));

function renderGate() {
  return render(
    <AuthProvider>
      <AdminGate>{(account) => <p>Console admin de {account.display_name}</p>}</AdminGate>
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminGate (Story 4.3)", () => {
  it("réclame une connexion admin quand aucune session n'existe", async () => {
    getStoredToken.mockReturnValue(null);
    renderGate();

    expect(await screen.findByText("Connexion admin")).toBeInTheDocument();
    expect(screen.queryByText(/Console admin/)).not.toBeInTheDocument();
  });

  it("ouvre la console pour un compte admin", async () => {
    getStoredToken.mockReturnValue("jeton-admin");
    fetchMe.mockResolvedValue(buildAccount({ role: "admin", display_name: "Awa" }));
    renderGate();

    expect(await screen.findByText("Console admin de Awa")).toBeInTheDocument();
  });

  it("refuse l'interface à un compte chercheur (AD-14)", async () => {
    getStoredToken.mockReturnValue("jeton-chercheur");
    fetchMe.mockResolvedValue(buildAccount({ role: "chercheur" }));
    renderGate();

    expect(await screen.findByText("Interface réservée aux administrateurs")).toBeInTheDocument();
    expect(screen.queryByText(/Console admin/)).not.toBeInTheDocument();
  });

  it("purge la session quand un chercheur se connecte par le formulaire admin", async () => {
    const user = userEvent.setup();
    getStoredToken.mockReturnValue(null);
    apiLogin.mockResolvedValue({
      access_token: "jeton-chercheur",
      token_type: "bearer",
      expires_at: "2026-12-31T00:00:00Z",
      account: buildAccount({ role: "chercheur" }),
    });
    renderGate();

    await user.type(await screen.findByLabelText("E-mail"), "kofi@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Interface réservée aux administrateurs")).toBeInTheDocument();
    expect(clearStoredToken).toHaveBeenCalled();
    expect(screen.queryByText(/Console admin/)).not.toBeInTheDocument();
  });
});
