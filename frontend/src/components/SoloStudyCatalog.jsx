import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./ui/button";
import { Menu, LampDesk, ArrowRight } from "lucide-react";
import LeftSidebar from "./LeftSidebar";
import SearchDrawer from "./SearchDrawer";
import LoadingSpinner from "./LoadingSpinner";
import { cn } from "../lib/utils";
import { API_URL } from "../config/env";

const CATALOG_CACHE_KEY = "lyceum-focus-spaces-catalog";
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

function readCatalogCache() {
  try {
    const raw = sessionStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CATALOG_CACHE_TTL_MS) {
      return null;
    }
    return {
      categories: parsed.categories || [],
      sections: parsed.sections || [],
      environments: parsed.environments || [],
    };
  } catch {
    return null;
  }
}

function writeCatalogCache({ categories, sections, environments }) {
  try {
    sessionStorage.setItem(
      CATALOG_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        categories,
        sections,
        environments,
      })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

function sortEnvironments(items) {
  return [...items].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
  );
}

function buildSectionLayout(categoryId, sections, environments) {
  const categorySections = sections
    .filter((s) => s.category === categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

  const sectionBlocks = categorySections
    .map((section) => ({
      id: section.id,
      label: section.label,
      items: sortEnvironments(
        environments.filter((env) => env.section === section.id)
      ),
    }))
    .filter((block) => block.items.length > 0);

  const unsectioned = sortEnvironments(
    environments.filter((env) => !env.section)
  );

  return { sectionBlocks, unsectioned };
}

function EnvironmentCard({ env, onSelect }) {
  const badge = env.sectionLabel || env.categoryLabel || env.category;

  return (
    <button
      type="button"
      onClick={() => onSelect(env.id)}
      className="group text-left rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 hover:border-white/30 hover:bg-white/[0.14] transition-all duration-200 overflow-hidden shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
    >
      <div className="p-5">
        <span className="inline-block text-xs font-medium text-purple-200 mb-3 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">
          {badge}
        </span>
        <h2 className="text-lg font-semibold text-white mb-2 leading-snug">
          {env.title}
        </h2>
        <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
          {env.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/75 group-hover:text-white group-hover:gap-2.5 transition-all duration-200">
          Enter space
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

export default function SoloStudyCatalog() {
  const cached = readCatalogCache();
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState(cached?.categories ?? []);
  const [sections, setSections] = useState(cached?.sections ?? []);
  const [environments, setEnvironments] = useState(cached?.environments ?? []);
  const [loading, setLoading] = useState(!cached);
  const [loadError, setLoadError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { body, documentElement: html } = document;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, []);

  const loadCatalog = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setLoadError(null);
      const { data } = await axios.get(`${API_URL}/focus-spaces`);
      const next = {
        categories: data.categories || [],
        sections: data.sections || [],
        environments: data.environments || [],
      };
      setCategories(next.categories);
      setSections(next.sections);
      setEnvironments(next.environments);
      writeCatalogCache(next);
    } catch (err) {
      console.error("Failed to load focus spaces:", err);
      setLoadError("Couldn’t load focus spaces. Check your connection and try again.");
      // Keep any cached / previous environments — don’t fake an empty catalog.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog({ silent: Boolean(cached) });
    // Intentionally once on mount; cached is a one-shot read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCatalog]);

  const filtered =
    category === "all"
      ? environments
      : environments.filter((env) => env.category === category);

  const activeCategory = categories.find((c) => c.id === category);
  const useSectionLayout =
    category !== "all" && activeCategory?.useSections && sections.some((s) => s.category === category);

  const sectionLayout = useSectionLayout
    ? buildSectionLayout(category, sections, filtered)
    : null;

  const categoryFilters = [
    { id: "all", label: "All spaces" },
    ...categories.map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-gradient-to-br from-[#1a1339] via-[#1a1425] to-[#0f0a1f] text-white">
      <LeftSidebar
        isSidebarOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
        openSearchDrawer={() => setIsSearchDrawerOpen(true)}
      />

      <div className="flex-1 min-w-0 md:ml-16 min-h-0 overflow-y-auto overflow-x-hidden overscroll-none p-4 md:p-6">
        <Button
          className="md:hidden fixed top-4 left-4 z-20 h-10 w-10 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 text-white shadow-xl"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="max-w-6xl mx-auto pt-12 md:pt-4 space-y-5">
          <header className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 px-4 py-4 md:px-5 md:py-4 shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/25 border border-purple-400/25">
                  <LampDesk className="h-5 w-5 text-purple-300" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  Solo Focus Spaces
                </h1>
              </div>

              {!loading && (
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {categoryFilters.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                        category === cat.id
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-900/25"
                          : "bg-white/10 text-gray-200 border border-white/20 hover:bg-white/15 hover:text-white"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>

          {loadError && (
            <div className="rounded-2xl bg-red-500/10 border border-red-400/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-red-100">{loadError}</p>
              <Button
                type="button"
                size="sm"
                className="bg-white/10 hover:bg-white/15 text-white border border-white/20"
                onClick={() => loadCatalog()}
              >
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <LoadingSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-12 text-center shadow-xl space-y-3">
              <p className="text-gray-300">
                {loadError
                  ? "Focus spaces couldn’t be loaded."
                  : "No environments in this category yet."}
              </p>
              {loadError && (
                <Button
                  type="button"
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                  onClick={() => loadCatalog()}
                >
                  Retry
                </Button>
              )}
            </div>
          ) : sectionLayout &&
            (sectionLayout.sectionBlocks.length > 0 || sectionLayout.unsectioned.length > 0) ? (
            <div className="space-y-8 pb-6">
              {sectionLayout.sectionBlocks.map((section) => (
                <section key={section.id}>
                  <h2 className="mb-4 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-purple-200/90">
                    {section.label}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {section.items.map((env) => (
                      <EnvironmentCard
                        key={env.id}
                        env={env}
                        onSelect={(id) => navigate(`/solo-study/${id}`)}
                      />
                    ))}
                  </div>
                </section>
              ))}
              {sectionLayout.unsectioned.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sectionLayout.unsectioned.map((env) => (
                    <EnvironmentCard
                      key={env.id}
                      env={env}
                      onSelect={(id) => navigate(`/solo-study/${id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
              {sortEnvironments(filtered).map((env) => (
                <EnvironmentCard
                  key={env.id}
                  env={env}
                  onSelect={(id) => navigate(`/solo-study/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <SearchDrawer
        isOpen={isSearchDrawerOpen}
        onClose={() => setIsSearchDrawerOpen(false)}
        API_URL={API_URL}
      />
    </div>
  );
}
