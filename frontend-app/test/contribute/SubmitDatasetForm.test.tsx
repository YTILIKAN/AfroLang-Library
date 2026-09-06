import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SubmitDatasetForm } from "@/components/contribute/SubmitDatasetForm";
import { ApiError } from "@/lib/api/client";
import { buildContribution } from "@/test/accounts";

const submitDataset = vi.fn();
vi.mock("@/lib/api/accounts", () => ({
  submitDataset: (...args: unknown[]) => submitDataset(...args),
}));

const MANUAL_LABEL = /Source sans API publique/i;

async function fillRequiredFields() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Titre/), "Corpus Twi");
  await user.type(screen.getByLabelText(/URL source/), "https://example.com/twi");
  await user.type(screen.getByLabelText("Langue"), "twi");
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  submitDataset.mockResolvedValue(buildContribution());
});

describe("SubmitDatasetForm (Story 3.5)", () => {
  it("soumet les métadonnées et le lien saisis (FR-17)", async () => {
    render(<SubmitDatasetForm />);
    const user = await fillRequiredFields();

    await user.click(screen.getByRole("button", { name: /Soumettre/i }));

    await waitFor(() => expect(submitDataset).toHaveBeenCalledTimes(1));
    expect(submitDataset).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Corpus Twi",
        source_url: "https://example.com/twi",
        language: "twi",
        task: "asr",
      }),
    );
  });

  it("marque la soumission comme source sans API pour lui donner l'origine manuel (FR-5)", async () => {
    render(<SubmitDatasetForm />);
    const user = await fillRequiredFields();

    await user.click(screen.getByLabelText(MANUAL_LABEL));
    await user.click(screen.getByRole("button", { name: /Soumettre/i }));

    await waitFor(() => expect(submitDataset).toHaveBeenCalledTimes(1));
    expect(submitDataset.mock.calls[0][0]).toMatchObject({ manual_source: true });
  });

  it("n'encode pas l'origine manuelle dans la description", async () => {
    render(<SubmitDatasetForm />);
    const user = await fillRequiredFields();

    await user.type(screen.getByLabelText("Description"), "Corpus vocal twi");
    await user.click(screen.getByLabelText(MANUAL_LABEL));
    await user.click(screen.getByRole("button", { name: /Soumettre/i }));

    await waitFor(() => expect(submitDataset).toHaveBeenCalledTimes(1));
    expect(submitDataset.mock.calls[0][0].description).toBe("Corpus vocal twi");
  });

  it("laisse le drapeau à faux pour une source disposant d'une API", async () => {
    render(<SubmitDatasetForm />);
    const user = await fillRequiredFields();

    await user.click(screen.getByRole("button", { name: /Soumettre/i }));

    await waitFor(() => expect(submitDataset).toHaveBeenCalledTimes(1));
    expect(submitDataset.mock.calls[0][0]).toMatchObject({ manual_source: false });
  });

  it("omet les champs optionnels laissés vides", async () => {
    render(<SubmitDatasetForm />);
    const user = await fillRequiredFields();

    await user.click(screen.getByRole("button", { name: /Soumettre/i }));

    await waitFor(() => expect(submitDataset).toHaveBeenCalledTimes(1));
    const payload = submitDataset.mock.calls[0][0];
    expect(payload).not.toHaveProperty("description");
    expect(payload).not.toHaveProperty("license_name");
    expect(payload).not.toHaveProperty("size");
  });

  it("confirme la soumission avec sa provenance et mène à « mes datasets »", async () => {
    submitDataset.mockResolvedValue(buildContribution({ id: 9001, provenance: "manuel" }));
    render(<SubmitDatasetForm />);
    const user = await fillRequiredFields();

    await user.click(screen.getByRole("button", { name: /Soumettre/i }));

    expect(await screen.findByText(/Soumission enregistrée/i)).toBeInTheDocument();
    expect(screen.getByText(/provenance manuel/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mes datasets/i })).toHaveAttribute(
      "href",
      "/contribute/mine",
    );
  });

  it("affiche l'erreur du serveur et garde la saisie", async () => {
    submitDataset.mockRejectedValue(new ApiError("Langue inconnue", 400));
    render(<SubmitDatasetForm />);
    const user = await fillRequiredFields();

    await user.click(screen.getByRole("button", { name: /Soumettre/i }));

    expect(await screen.findByText("Langue inconnue")).toBeInTheDocument();
    expect(screen.getByLabelText(/Titre/)).toHaveValue("Corpus Twi");
  });
});
