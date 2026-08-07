interface FilterOption {
  value: string;
  label: string;
}

const SOURCE_OPTIONS: FilterOption[] = [
  { value: "huggingface", label: "Hugging Face" },
  { value: "kaggle", label: "Kaggle" },
];

/** Vocabulaire contrôlé des tâches NLP — miroir de `ingestion/normalization/vocabulary.py`. */
const TASK_OPTIONS: FilterOption[] = [
  { value: "asr", label: "ASR" },
  { value: "nmt", label: "Traduction" },
  { value: "ner", label: "NER" },
  { value: "classification", label: "Classification" },
  { value: "tts", label: "TTS" },
  { value: "summarization", label: "Résumé" },
];

/** « inconnu » est une valeur réelle en base quand la source ne renseigne pas le format (FR-8). */
const DATA_FORMAT_OPTIONS: FilterOption[] = [
  { value: "audio", label: "Audio" },
  { value: "text", label: "Texte" },
  { value: "inconnu", label: "Inconnu" },
];

const SELECT_CLASS =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-emerald-600 focus:outline-none";

function FilterSelect({
  id,
  label,
  emptyLabel,
  options,
  value,
}: {
  id: string;
  label: string;
  emptyLabel: string;
  options: FilterOption[];
  value?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      <select id={id} name={id} defaultValue={value ?? ""} className={SELECT_CLASS}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterControls({
  source,
  task,
  dataFormat,
}: {
  source?: string;
  task?: string;
  dataFormat?: string;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      <FilterSelect
        id="source"
        label="Source"
        emptyLabel="Toutes"
        options={SOURCE_OPTIONS}
        value={source}
      />
      <FilterSelect
        id="task"
        label="Tâche NLP"
        emptyLabel="Toutes"
        options={TASK_OPTIONS}
        value={task}
      />
      <FilterSelect
        id="data_format"
        label="Format"
        emptyLabel="Tous"
        options={DATA_FORMAT_OPTIONS}
        value={dataFormat}
      />
    </div>
  );
}
