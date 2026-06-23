import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  X,
  Search,
  MessageSquare,
  FileText,
  LampDesk,
  LayoutGrid,
  Home,
  ArrowRight,
} from "lucide-react";
import { resolveImageUrl, coverBackgroundStyle } from "../lib/imageUrl";

const NAV_SHORTCUTS = [
  { label: "Dashboard", path: "/dashboard", icon: Home, keywords: ["dashboard", "home"] },
  { label: "Focus Spaces", path: "/solo-study", icon: LampDesk, keywords: ["focus", "solo", "study space", "focus space", "ambient"] },
  { label: "Forums", path: "/forum", icon: LayoutGrid, keywords: ["forum", "forums", "discussion", "topic"] },
  { label: "Direct Messages", path: "/chat", icon: MessageSquare, keywords: ["chat", "message", "messages", "dm", "direct"] },
];

const EMPTY_RESULTS = {
  users: [],
  topics: [],
  posts: [],
  focusSpaces: [],
};

function matchNavShortcuts(query) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  return NAV_SHORTCUTS.filter(({ label, keywords }) => {
    const labelMatch = label.toLowerCase().includes(normalized);
    const keywordMatch = keywords.some(
      (keyword) => keyword.includes(normalized) || normalized.includes(keyword)
    );
    return labelMatch || keywordMatch;
  }).slice(0, 2);
}

function SectionHeader({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 mt-4 first:mt-0">
      {children}
    </p>
  );
}

const SearchDrawer = ({ isOpen, onClose, API_URL }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const navMatches = useMemo(() => matchNavShortcuts(query), [query]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults(EMPTY_RESULTS);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(EMPTY_RESULTS);
      setIsLoading(false);
      return undefined;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/search`, {
          params: { q: trimmed },
          withCredentials: true,
        });
        setResults(response.data);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setResults(EMPTY_RESULTS);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, API_URL]);

  const closeAndNavigate = useCallback(
    (path, options) => {
      navigate(path, options);
      onClose();
    },
    [navigate, onClose]
  );

  const openForumTopic = useCallback(
    (topicId) => {
      localStorage.setItem("selectedTopic", JSON.stringify(topicId));
      closeAndNavigate("/forum", { state: { selectTopicId: topicId } });
    },
    [closeAndNavigate]
  );

  const hasApiResults =
    results.users.length > 0 ||
    results.topics.length > 0 ||
    results.posts.length > 0 ||
    results.focusSpaces.length > 0;

  const hasResults = hasApiResults || navMatches.length > 0;
  const trimmedQuery = query.trim();

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-[#1a1425] shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Search</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close search">
            <X className="h-6 w-6 text-gray-400" />
          </Button>
        </div>

        <div className="relative mb-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Users, forums, focus spaces…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#2a2435] text-white border-purple-600/20 pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading && trimmedQuery && (
            <p className="text-gray-400 text-sm mt-3">Searching…</p>
          )}

          {!isLoading && trimmedQuery && !hasResults && (
            <p className="text-sm text-gray-400 mt-4">
              No results found for &ldquo;{trimmedQuery}&rdquo;
            </p>
          )}

          {!isLoading && navMatches.length > 0 && (
            <div>
              <SectionHeader>Go to</SectionHeader>
              <ul className="space-y-1">
                {navMatches.map((item) => (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => closeAndNavigate(item.path)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-purple-600/15 transition-colors text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-purple-300">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm text-white">{item.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-auto text-gray-500" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isLoading && results.users.length > 0 && (
            <div>
              <SectionHeader>People</SectionHeader>
              <ul className="space-y-2">
                {results.users.map((user) => (
                  <li key={user.username}>
                    <button
                      type="button"
                      className="w-full flex items-center p-2 hover:bg-purple-600/20 rounded-lg transition-colors relative overflow-hidden h-14 text-left"
                      onClick={() => closeAndNavigate(`/profile/${user.username}`)}
                      style={coverBackgroundStyle(user.coverImage)}
                    >
                      <img
                        className="relative z-10 h-8 w-8 mr-3 rounded-lg object-cover"
                        src={resolveImageUrl(user.profileImage, "profile")}
                        alt=""
                      />
                      <span className="relative z-10 text-white text-sm">{user.username}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isLoading && results.topics.length > 0 && (
            <div>
              <SectionHeader>Topics</SectionHeader>
              <ul className="space-y-1">
                {results.topics.map((topic) => (
                  <li key={topic.id}>
                    <button
                      type="button"
                      onClick={() => openForumTopic(topic.id)}
                      className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-purple-600/15 transition-colors text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-purple-300 mt-0.5">
                        <MessageSquare className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-white truncate">{topic.title}</span>
                        <span className="block text-xs text-gray-400 truncate">
                          {topic.category} · {topic.author}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isLoading && results.posts.length > 0 && (
            <div>
              <SectionHeader>Posts</SectionHeader>
              <ul className="space-y-1">
                {results.posts.map((post) => (
                  <li key={post.id}>
                    <button
                      type="button"
                      onClick={() => openForumTopic(post.topicId)}
                      className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-purple-600/15 transition-colors text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-purple-300 mt-0.5">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-gray-200 line-clamp-2">{post.content}</span>
                        <span className="block text-xs text-gray-400 truncate mt-1">
                          in {post.topicTitle || "topic"} · {post.author}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isLoading && results.focusSpaces.length > 0 && (
            <div>
              <SectionHeader>Focus Spaces</SectionHeader>
              <ul className="space-y-1">
                {results.focusSpaces.map((space) => (
                  <li key={space.id}>
                    <button
                      type="button"
                      onClick={() => closeAndNavigate(`/solo-study/${space.id}`)}
                      className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-purple-600/15 transition-colors text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600/15 text-purple-300 mt-0.5">
                        <LampDesk className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-white truncate">{space.title}</span>
                          {(space.sectionLabel || space.categoryLabel) && (
                            <span className="shrink-0 text-[10px] font-medium text-purple-200 px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10">
                              {space.sectionLabel || space.categoryLabel}
                            </span>
                          )}
                        </span>
                        {space.description && (
                          <span className="block text-xs text-gray-400 line-clamp-1 mt-0.5">
                            {space.description}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDrawer;
