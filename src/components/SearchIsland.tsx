import { useState, useEffect, useRef } from 'preact/hooks';
import type { FunctionComponent } from 'preact';

interface SearchEntry {
  uri: string;
  title: string;
  tags?: string[];
  summary?: string;
  headings?: string[];
  body?: string;
}

interface SearchIndex {
  entries: SearchEntry[];
}

const SearchIsland: FunctionComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (!index) {
      setLoading(true);
      fetch('/search-index.json')
        .then((r) => r.json())
        .then((data: SearchIndex) => {
          setIndex(data.entries || data as any);
          setLoading(false);
        })
        .catch(() => setLoading(false));
      return;
    }

    const q = query.toLowerCase().trim();
    const scored = index
      .map((entry) => {
        let score = 0;
        const title = (entry.title || '').toLowerCase();
        const tags = (entry.tags || []).join(' ').toLowerCase();
        const summary = (entry.summary || '').toLowerCase();
        const headings = (entry.headings || []).join(' ').toLowerCase();
        const body = (entry.body || '').toLowerCase();

        if (title.includes(q)) score += 10;
        if (tags.includes(q)) score += 6;
        if (summary.includes(q)) score += 5;
        if (headings.includes(q)) score += 4;
        if (body.includes(q)) score += 1;

        return { entry, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((r) => r.entry);

    setResults(scored);
  }, [query, index]);

  return (
    <div class="search-island">
      <div class="search-input-wrap">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          placeholder="输入关键词搜索…"
          class="search-input"
          aria-label="搜索内容"
        />
      </div>

      {loading && <p class="search-status">加载索引中…</p>}

      {!loading && query && results.length === 0 && (
        <p class="search-status">未找到匹配内容</p>
      )}

      {results.length > 0 && (
        <ul class="search-results">
          {results.map((entry) => (
            <li key={entry.uri} class="search-result-item">
              <a href={`/${entry.uri}`} class="search-result-link">
                <span class="search-result-title">{entry.title}</span>
                {entry.summary && (
                  <span class="search-result-summary">{entry.summary}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchIsland;
