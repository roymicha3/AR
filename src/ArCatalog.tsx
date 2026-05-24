import { useEffect, useState } from 'react';
import type { CatalogEntry } from './api';
import { fetchCatalog } from './api';
import { ArTile } from './ArTile';

const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';

function openViewer(entry: CatalogEntry) {
  const url = new URL('/ar-viewer.html', location.href);
  url.searchParams.set('glb', entry.glb_local_url ?? '');
  if (entry.usdz_local_url) url.searchParams.set('usdz', entry.usdz_local_url);
  url.searchParams.set('name', entry.name);
  location.href = url.toString();
}

interface Props {
  base: string;
}

export function ArCatalog({ base }: Props) {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalog(base)
      .then(setEntries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [base]);

  if (loading) return <p className="status">Loading catalog…</p>;
  if (error) return <p className="status error">Failed to load catalog: {error}</p>;
  if (!entries.length) return <p className="status">No models in catalog.</p>;

  const groups = new Map<string, CatalogEntry[]>();
  for (const e of entries) {
    if (!groups.has(e.category)) groups.set(e.category, []);
    groups.get(e.category)!.push(e);
  }

  return (
    <div className="catalog">
      {Array.from(groups.entries()).map(([category, items]) => (
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
    </div>
  );
}
