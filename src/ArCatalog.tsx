import { useEffect, useState } from 'react';
import type { CatalogEntry } from './api';
import { fetchCatalog } from './api';
import { ArTile } from './ArTile';

const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';

const AR_LIBRARY_KEY = 'ar_library';

function openViewer(entry: CatalogEntry) {
  const url = new URL('/ar-viewer.html', location.href);
  url.searchParams.set('glb', entry.glb_local_url ?? '');
  if (entry.usdz_local_url) url.searchParams.set('usdz', entry.usdz_local_url);
  url.searchParams.set('name', entry.name);
  location.href = url.toString();
}

function loadLibrary(): CatalogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(AR_LIBRARY_KEY) || '[]');
  } catch {
    return [];
  }
}

interface Props {
  base: string;
}

export function ArCatalog({ base }: Props) {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [library, setLibrary] = useState<CatalogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    setLibrary(loadLibrary());
    fetchCatalog(base)
      .then(setEntries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));

    const onStorage = (e: StorageEvent) => {
      if (e.key === AR_LIBRARY_KEY) setLibrary(loadLibrary());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [base]);

  if (loading) return <p className="status">Loading catalog…</p>;
  if (error) return <p className="status error">Failed to load catalog: {error}</p>;

  const allEntries = [...entries];
  const groups = new Map<string, CatalogEntry[]>();
  for (const e of allEntries) {
    if (!groups.has(e.category)) groups.set(e.category, []);
    groups.get(e.category)!.push(e);
  }

  const categories = Array.from(groups.keys());
  const hasLibrary = library.length > 0;

  const visibleGroups = activeFilter
    ? new Map([[activeFilter, groups.get(activeFilter) ?? []]])
    : groups;

  return (
    <div className="catalog">
      {(categories.length > 1 || hasLibrary) && (
        <div className="category-filter">
          <button
            className={`filter-btn${activeFilter === null ? ' active' : ''}`}
            onClick={() => setActiveFilter(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn${activeFilter === cat ? ' active' : ''}`}
              onClick={() => setActiveFilter(cat === activeFilter ? null : cat)}
            >
              {cat}
            </button>
          ))}
          {hasLibrary && (
            <button
              className={`filter-btn${activeFilter === '__library__' ? ' active' : ''}`}
              onClick={() => setActiveFilter(activeFilter === '__library__' ? null : '__library__')}
            >
              Your Models
            </button>
          )}
        </div>
      )}

      {(!activeFilter || activeFilter === '__library__') && hasLibrary && (
        <section className="category-section">
          <h2 className="category-heading">Your Models</h2>
          <div className="tile-row">
            {library.map((entry) => (
              <ArTile
                key={entry.id}
                entry={entry}
                base={base}
                onSelect={LOCAL_MODE ? openViewer : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {activeFilter !== '__library__' && (
        <>
          {Array.from(visibleGroups.entries()).map(([category, items]) => (
            <section key={category} className="category-section">
              <h2 className="category-heading">{category}</h2>
              <div className="tile-row">
                {items.map((entry) => (
                  <ArTile
                    key={entry.id}
                    entry={entry}
                    base={base}
                    onSelect={LOCAL_MODE ? openViewer : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
          {!entries.length && !loading && (
            <p className="status">No models in catalog.</p>
          )}
        </>
      )}
    </div>
  );
}
