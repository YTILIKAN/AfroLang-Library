import type { NextConfig } from "next";

const backendUrl = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://afrilang-api.up.railway.app"
    : "http://127.0.0.1:8000")
).replace(/\/$/, "");

/**
 * Next 16 refuse toute requête vers `/_next/*` dont l'en-tête `Origin` n'est pas listé ici
 * (403 « Unauthorized »). Depuis une autre machine du réseau — http://<IP-LAN>:3000 — le HTML
 * rendu côté serveur passait, mais les échanges client (RSC, HMR) étaient bloqués : les
 * composants client ne s'hydrataient pas et les compteurs de l'accueil, qui viennent d'un
 * `useEffect`, restaient sur « … ». Les plages privées couvrent les IP DHCP habituelles ;
 * DEV_ALLOWED_ORIGINS (liste séparée par des virgules) ajoute un hôte ponctuel — tunnel, VM.
 */
const allowedDevOrigins = [
  "10.*.*.*",
  "172.*.*.*",
  "192.168.*.*",
  ...(process.env.DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,

  /**
   * `/search`, `/filter` et `/languages` interrogeaient le même index — les deux premiers
   * avec la même requête serveur. Ils sont fusionnés dans `/catalog`, qui accepte les mêmes
   * paramètres : la chaîne de requête est conservée par Next, les liens existants restent
   * valides. `/languages/[code]` survit : la fiche langue agrège des compteurs (FR-14).
   */
  async redirects() {
    return [
      { source: "/search", destination: "/catalog", permanent: true },
      { source: "/filter", destination: "/catalog", permanent: true },
      { source: "/languages", destination: "/catalog", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api-backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
