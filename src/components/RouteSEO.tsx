import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "https://validifier.com";
const OG_IMAGE = `${SITE}/og-image.png`;
const DEFAULT_DESC =
  "Get a 15-section validation report on your business idea in about 2–3 minutes. Viability score, competitor analysis, financial projections, and a 30-day action plan.";

type Meta = {
  title: string;
  description: string;
  canonical: string;
  robots: string; // "index,follow" | "noindex,nofollow"
  ogUrl: string;
};

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function metaFor(pathname: string, search: string): Meta {
  const isSampleQuery = new URLSearchParams(search).get("sample") === "1";

  // Sample viewer (either /sample-report or /projects/:id/report?sample=1)
  if (pathname === "/sample-report" || (pathname.startsWith("/projects/") && pathname.endsWith("/report") && isSampleQuery)) {
    return {
      title: "Sample Validation Report — See Validifier in Action",
      description:
        "Explore a complete 15-section validation report: market sizing, competitors, financials, risks, and a 30-day action plan.",
      canonical: `${SITE}/sample-report`,
      robots: "index,follow",
      ogUrl: `${SITE}/sample-report`,
    };
  }

  switch (pathname) {
    case "/":
      return {
        title: "Validifier — Turn a Business Idea Into a Go / No-Go Decision",
        description: DEFAULT_DESC,
        canonical: `${SITE}/`,
        robots: "index,follow",
        ogUrl: `${SITE}/`,
      };
    case "/pricing":
      return {
        title: "Pricing — Validifier",
        description:
          "Start free. Upgrade to Pro for deeper competitive and financial reasoning. 7-day free trial, cancel anytime.",
        canonical: `${SITE}/pricing`,
        robots: "index,follow",
        ogUrl: `${SITE}/pricing`,
      };
    case "/privacy":
      return {
        title: "Privacy Policy — Validifier",
        description: "How Validifier handles your account data, project inputs, and privacy controls.",
        canonical: `${SITE}/privacy`,
        robots: "index,follow",
        ogUrl: `${SITE}/privacy`,
      };
    case "/terms":
      return {
        title: "Terms of Service — Validifier",
        description: "The terms that govern your use of Validifier.",
        canonical: `${SITE}/terms`,
        robots: "index,follow",
        ogUrl: `${SITE}/terms`,
      };
    case "/contact":
      return {
        title: "Contact — Validifier",
        description:
          "Reach the Validifier team by email for product support, privacy requests, legal questions, or security disclosure.",
        canonical: `${SITE}/contact`,
        robots: "index,follow",
        ogUrl: `${SITE}/contact`,
      };
    case "/security":
      return {
        title: "Security Overview — Validifier",
        description:
          "How Validifier protects your account and data: TLS, managed auth, row-level security, server-only billing, and verified webhooks.",
        canonical: `${SITE}/security`,
        robots: "index,follow",
        ogUrl: `${SITE}/security`,
      };
    default: {
      // All private / owner routes
      const base: Meta = {
        title: "Validifier",
        description: DEFAULT_DESC,
        canonical: `${SITE}${pathname}`,
        robots: "noindex,nofollow",
        ogUrl: `${SITE}${pathname}`,
      };
      if (pathname === "/auth") {
        const params = new URLSearchParams(search);
        if (params.get("reset") === "true") return { ...base, title: "Set a new password — Validifier" };
        if (params.get("mode") === "signup") return { ...base, title: "Create account — Validifier" };
        return { ...base, title: "Sign in — Validifier" };
      }
      if (pathname === "/dashboard") return { ...base, title: "Dashboard — Validifier" };
      if (pathname === "/projects/new") return { ...base, title: "New Report — Validifier" };
      if (pathname.startsWith("/projects/") && pathname.endsWith("/chat"))
        return { ...base, title: "Follow-up — Validifier" };
      if (pathname.startsWith("/projects/") && pathname.endsWith("/report"))
        return { ...base, title: "Validation Report — Validifier" };
      if (pathname === "/settings") return { ...base, title: "Settings — Validifier" };
      if (pathname === "/admin") return { ...base, title: "Admin — Validifier" };
      return { ...base, title: "Not Found — Validifier" };
    }
  }
}

export default function RouteSEO() {
  const location = useLocation();

  useEffect(() => {
    const m = metaFor(location.pathname, location.search);

    document.title = m.title;
    setMeta("description", m.description);
    setMeta("robots", m.robots);
    setLink("canonical", m.canonical);

    setMeta("og:title", m.title, "property");
    setMeta("og:description", m.description, "property");
    setMeta("og:url", m.ogUrl, "property");
    setMeta("og:image", OG_IMAGE, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "Validifier", "property");

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", m.title);
    setMeta("twitter:description", m.description);
    setMeta("twitter:image", OG_IMAGE);
  }, [location.pathname, location.search]);

  return null;
}