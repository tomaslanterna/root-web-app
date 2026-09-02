import { useEffect, useState } from "react";
import type { Post } from "@/lib/mocks";
import { searchApi, type SearchType, type SearchUser } from "@/services/search";
import type { Event } from "@/types/events";
import { useMutation } from "./useMutation";

export type SearchTab = "usuarios" | "eventos" | "posteos";
export type SearchResult = SearchUser | Event | Post;

const searchTypeByTab: Record<SearchTab, SearchType> = {
  usuarios: "USER",
  eventos: "EVENT",
  posteos: "POST",
};

interface SearchVariables {
  query: string;
  tab: SearchTab;
}

export function useSearch(query: string, activeTab: SearchTab) {
  const currentKey = `${activeTab}:${query.trim()}`;
  const [response, setResponse] = useState<{ key: string; results: SearchResult[] }>({
    key: "",
    results: [],
  });
  const { mutate, isLoading, error } = useMutation<SearchResult[], SearchVariables>(({ query: value, tab }) =>
    searchApi.search<SearchResult>({
      query: value,
      type: searchTypeByTab[tab],
      country: "AR",
    }),
  );

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    let isCurrent = true;
    const timeout = window.setTimeout(() => {
      void mutate({ query: trimmedQuery, tab: activeTab })
        .then((nextResults) => {
          if (isCurrent) {
            setResponse({ key: currentKey, results: nextResults });
          }
        })
        .catch(() => {
          if (isCurrent) {
            setResponse({ key: currentKey, results: [] });
          }
        });
    }, 500);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [activeTab, currentKey, mutate, query]);

  return {
    results: response.key === currentKey && query.trim() ? response.results : [],
    isLoading: Boolean(query.trim()) && (isLoading || response.key !== currentKey),
    error,
  };
}
