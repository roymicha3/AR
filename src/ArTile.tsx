import type { CatalogEntry } from './api';

interface Props {
  entry: CatalogEntry;
  base: string;
  onSelect?: (entry: CatalogEntry) => void;
}

export function ArTile({ entry, base, onSelect }: Props) {
  const thumbnail = entry.thumbnail_url ? (
    <img src={entry.thumbnail_url} alt={entry.name} loading="lazy" />
  ) : (
    <div className="ar-tile-placeholder">3D</div>
  );

  if (onSelect) {
    return (
      <button className="ar-tile" onClick={() => onSelect(entry)} title={entry.name}>
        {thumbnail}
        <span className="ar-tile-name">{entry.name}</span>
      </button>
    );
  }

  return (
    <a
      className="ar-tile"
      href={`${base}${entry.ar_url}`}
      target="_blank"
      rel="noopener noreferrer"
      title={entry.name}
    >
      {thumbnail}
      <span className="ar-tile-name">{entry.name}</span>
    </a>
  );
}
