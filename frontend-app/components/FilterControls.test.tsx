import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterControls } from "./FilterControls";

describe("FilterControls", () => {
  it("propose les filtres source, tâche NLP et format de données", () => {
    render(<FilterControls />);

    expect(screen.getByLabelText("Source")).toBeInTheDocument();
    expect(screen.getByLabelText("Tâche NLP")).toBeInTheDocument();
    expect(screen.getByLabelText("Format")).toBeInTheDocument();
  });

  it("soumet les filtres en GET avec les bons noms de champs", () => {
    render(<FilterControls />);

    expect(screen.getByLabelText("Source")).toHaveAttribute("name", "source");
    expect(screen.getByLabelText("Tâche NLP")).toHaveAttribute("name", "task");
    expect(screen.getByLabelText("Format")).toHaveAttribute("name", "data_format");
  });

  it("propose les sources connectées de l'index", () => {
    render(<FilterControls />);

    expect(screen.getByRole("option", { name: "Hugging Face" })).toHaveValue("huggingface");
    expect(screen.getByRole("option", { name: "Kaggle" })).toHaveValue("kaggle");
  });

  // Codes et libellés issus du vocabulaire contrôlé backend
  // (ingestion/normalization/vocabulary.py) — FR-7, FR-12.
  it.each([
    ["ASR", "asr"],
    ["Traduction", "nmt"],
    ["NER", "ner"],
    ["Classification", "classification"],
    ["TTS", "tts"],
    ["Résumé", "summarization"],
  ])("propose la tâche « %s » avec le code normalisé %s", (label, code) => {
    render(<FilterControls />);

    expect(screen.getByRole("option", { name: label })).toHaveValue(code);
  });

  it("propose les formats de données, « inconnu » compris (FR-8)", () => {
    render(<FilterControls />);

    expect(screen.getByRole("option", { name: "Audio" })).toHaveValue("audio");
    expect(screen.getByRole("option", { name: "Texte" })).toHaveValue("text");
    expect(screen.getByRole("option", { name: "Inconnu" })).toHaveValue("inconnu");
  });

  it("présélectionne les filtres actifs reçus en props", () => {
    render(<FilterControls source="kaggle" task="classification" dataFormat="text" />);

    expect(screen.getByLabelText("Source")).toHaveValue("kaggle");
    expect(screen.getByLabelText("Tâche NLP")).toHaveValue("classification");
    expect(screen.getByLabelText("Format")).toHaveValue("text");
  });

  it("n'active aucun filtre par défaut", () => {
    render(<FilterControls />);

    expect(screen.getByLabelText("Source")).toHaveValue("");
    expect(screen.getByLabelText("Tâche NLP")).toHaveValue("");
    expect(screen.getByLabelText("Format")).toHaveValue("");
  });
});
