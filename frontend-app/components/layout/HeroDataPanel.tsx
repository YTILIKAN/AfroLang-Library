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
    <div className="relative h-full min-w-[7rem] overflow-hidden opacity-30">
      <div className="data-stream-column flex flex-col gap-3 py-4 font-mono-ui text-[10px] leading-none text-pure-white">
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
    <section className="relative w-full overflow-hidden bg-schematic-blue" style={{ minHeight: "420px" }}>
      <div className="absolute inset-0 flex justify-center gap-6 px-6 pt-8 opacity-90 md:gap-10">
        {Array.from({ length: 10 }, (_, index) => (
          <StreamColumn key={index} offset={index % STREAM_LINES.length} />
        ))}
      </div>

      <div className="relative z-10 flex h-full min-h-[420px] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <span className="rounded-lg bg-cream-paper px-3 py-1 font-serif text-[13px] font-medium text-ink-black">
          Index vivant · langues africaines
        </span>
        <div className="inline-flex overflow-hidden rounded-sm bg-ink-black">
          <span className="px-4 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-cream-paper">
            Public
          </span>
          <span className="border-l border-graphite px-4 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-slate">
            Admin
          </span>
        </div>
      </div>
    </section>
  );
}
