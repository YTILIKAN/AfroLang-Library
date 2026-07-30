const STREAM_LINES = [
  "yor · asr · huggingface · 2.5gb",
  "wol · nmt · parallel corpus · 120mb",
  "swh · classification · kaggle · 45mb",
  "amh · ner · masakhane · inconnu",
  "twi · tts · contributed · manual",
  "fon · asr · zindi · audio",
  "hau · nmt · opus · text",
  "zul · classification · hf · 80mb",
  "ibo · summarization · manual",
  "som · asr · openslr · stream",
];

function StreamColumn({ offset }: { offset: number }) {
  const lines = [...STREAM_LINES.slice(offset), ...STREAM_LINES.slice(0, offset)];

  return (
    <div className="relative h-full min-w-[7rem] overflow-hidden opacity-25">
      <div className="data-stream-column flex flex-col gap-3 py-4 font-mono-ui text-[10px] leading-none text-ochre/90">
        {[...lines, ...lines].map((line, index) => (
          <span key={`${line}-${index}`} className="whitespace-nowrap">
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HeroDataPanel() {
  return (
    <section className="hero-african relative w-full overflow-hidden pattern-weave" style={{ minHeight: "440px" }}>
      <div className="absolute inset-0 flex justify-center gap-6 px-6 pt-8 md:gap-10">
        {Array.from({ length: 10 }, (_, index) => (
          <StreamColumn key={index} offset={index % STREAM_LINES.length} />
        ))}
      </div>

      <div className="relative z-10 flex h-full min-h-[440px] flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <span className="rounded-sm border border-ochre/30 bg-cream-paper/95 px-4 py-1.5 font-mono-ui text-[11px] font-medium uppercase tracking-[0.12em] text-ink-black shadow-[var(--shadow-subtle)]">
          Index vivant · langues africaines
        </span>

        <div className="max-w-2xl space-y-3">
          <h2 className="font-display text-[32px] font-medium leading-[1.15] tracking-[0.02em] text-cream-paper md:text-[40px]">
            Des voix, des corpus,{" "}
            <span className="text-ochre">un continent de données</span>
          </h2>
          <p className="font-serif text-sm leading-relaxed text-savanna/90 md:text-base">
            Yoruba, Wolof, Swahili, Amharique… Métadonnées ouvertes pour la recherche NLP en Afrique.
          </p>
        </div>

        <div className="inline-flex overflow-hidden rounded-sm border border-graphite/60 bg-ink-black/90">
          <span className="px-4 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-ochre">
            Public
          </span>
          <span className="border-l border-graphite/60 px-4 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-slate">
            Admin
          </span>
          <span className="border-l border-graphite/60 px-4 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-forest">
            Contribuer
          </span>
        </div>
      </div>
    </section>
  );
}
