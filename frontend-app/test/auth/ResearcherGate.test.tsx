import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ResearcherGate } from "@/components/auth/ResearcherGate";
import { buildAccount } from "@/test/accounts";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/contribute",
  useSearchParams: () => new URLSearchParams(),
}));

const fetchMe = vi.fn();
const apiLogout = vi.fn();
vi.mock("@/lib/api/accounts", () => ({
  fetchMe: () => fetchMe(),
  logout: () => apiLogout(),
  login: vi.fn(),
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
      <ResearcherGate>{(account) => <p>Zone de contribution de {account.display_name}</p>}</ResearcherGate>
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ResearcherGate (Story 3.4)", () => {
  it("réclame une connexion quand aucune session n'existe", async () => {
    getStoredToken.mockReturnValue(null);
    renderGate();

    expect(await screen.findByRole("button", { name: /Se connecter/i })).toBeInTheDocument();
    expect(screen.queryByText(/Zone de contribution/)).not.toBeInTheDocument();
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it("ouvre la zone de contribution pour un chercheur authentifié", async () => {
    getStoredToken.mockReturnValue("jeton-123");
    fetchMe.mockResolvedValue(buildAccount());
    renderGate();

    expect(await screen.findByText("Zone de contribution de Kofi")).toBeInTheDocument();
  });

  it("bloque un compte désactivé au lieu de le laisser contribuer", async () => {
    getStoredToken.mockReturnValue("jeton-123");
    fetchMe.mockResolvedValue(buildAccount({ is_active: false }));
    renderGate();

    expect(await screen.findByText(/Compte désactivé/i)).toBeInTheDocument();
    expect(screen.queryByText(/Zone de contribution/)).not.toBeInTheDocument();
  });

  it("purge le jeton invalide et redemande une connexion", async () => {
    getStoredToken.mockReturnValue("jeton-perime");
    fetchMe.mockRejectedValue(new Error("401"));
    renderGate();

    expect(await screen.findByRole("button", { name: /Se connecter/i })).toBeInTheDocument();
    expect(clearStoredToken).toHaveBeenCalled();
  });

  it("ferme la session à la déconnexion et referme la zone de contribution", async () => {
    const user = userEvent.setup();
    getStoredToken.mockReturnValue("jeton-123");
    fetchMe.mockResolvedValue(buildAccount({ is_active: false }));
    apiLogout.mockResolvedValue(undefined);
    renderGate();

    await user.click(await screen.findByRole("button", { name: /Se déconnecter/i }));

    await waitFor(() => expect(apiLogout).toHaveBeenCalled());
    expect(clearStoredToken).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: /^Se connecter$/i })).toBeInTheDocument();
  });
});
