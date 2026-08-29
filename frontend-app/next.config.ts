import type { NextConfig } from "next";

const backendUrl = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://afrilang-api.up.railway.app"
    : "http://127.0.0.1:8000")
).replace(/\/$/, "");

const nextConfig: NextConfig = {
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
