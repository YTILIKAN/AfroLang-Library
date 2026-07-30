import Link from "next/link";

interface AfriLandLogoProps {
  className?: string;
}

export function AfriLandLogo({ className = "" }: AfriLandLogoProps) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`.trim()}
      aria-label="AfriLand — accueil"
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden>
        <span className="absolute inset-0 rotate-45 rounded-sm border border-ochre/80 bg-ochre/15" />
        <span className="absolute inset-1 rotate-45 rounded-sm border border-terracotta/60" />
        <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-base font-medium tracking-[0.04em] text-ink-black group-hover:text-indigo-deep transition-colors">
          AfriLand
        </span>
        <span className="mt-0.5 font-mono-ui text-[9px] font-medium uppercase tracking-[0.14em] text-slate">
          Langues africaines
        </span>
      </span>
    </Link>
  );
}
