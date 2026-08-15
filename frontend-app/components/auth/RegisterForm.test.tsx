import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider } from "./AuthProvider";
import { RegisterForm } from "./RegisterForm";
import { ApiError } from "@/lib/api/client";
import { buildAccount } from "@/test/accounts";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

const register = vi.fn();
const login = vi.fn();
const fetchMe = vi.fn();
vi.mock("@/lib/api/accounts", () => ({
  register: (...args: unknown[]) => register(...args),
  login: (...args: unknown[]) => login(...args),
  fetchMe: () => fetchMe(),
  logout: vi.fn(),
}));

const setStoredToken = vi.fn();
const getStoredToken = vi.fn();
vi.mock("@/lib/auth-storage", () => ({
  setStoredToken: (token: string) => setStoredToken(token),
  getStoredToken: () => getStoredToken(),
  clearStoredToken: vi.fn(),
}));

function renderRegister() {
  return render(
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>,
  );
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nom affiché"), "Kofi");
  await user.type(screen.getByLabelText("E-mail"), "kofi@example.com");
  await user.type(screen.getByLabelText("Mot de passe"), "password123");
  await user.click(screen.getByRole("button", { name: /Créer le compte/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  getStoredToken.mockReturnValue(null);
});

describe("RegisterForm (Story 3.4)", () => {
  it("crée le compte puis ouvre la session et rejoint l'espace contribution (FR-16)", async () => {
    register.mockResolvedValue(buildAccount());
    login.mockResolvedValue({
      access_token: "jeton-123",
      token_type: "bearer",
      expires_at: "2026-12-31T00:00:00Z",
      account: buildAccount(),
    });
    renderRegister();

    await fillAndSubmit();

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        email: "kofi@example.com",
        password: "password123",
        display_name: "Kofi",
      }),
    );
    expect(login).toHaveBeenCalledWith("kofi@example.com", "password123");
    expect(setStoredToken).toHaveBeenCalledWith("jeton-123");
    expect(push).toHaveBeenCalledWith("/contribute");
  });

  it("remonte l'erreur du serveur et n'ouvre pas de session", async () => {
    register.mockRejectedValue(new ApiError("E-mail déjà utilisé", 409));
    renderRegister();

    await fillAndSubmit();

    expect(await screen.findByText("E-mail déjà utilisé")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
    expect(setStoredToken).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("impose un mot de passe d'au moins 8 caractères", () => {
    renderRegister();

    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("minLength", "8");
  });
});
