export interface CatalogEntry {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  ar_url: string;
  glb_local_url: string | null;
  usdz_local_url: string | null;
}

export async function fetchCatalog(base: string): Promise<CatalogEntry[]> {
  if (import.meta.env.VITE_LOCAL_MODE === 'true') {
    const res = await fetch('/catalog.json');
    if (!res.ok) throw new Error(`Local catalog fetch failed: ${res.status}`);
    return res.json();
  }
  const res = await fetch(`${base}/api/catalog`);
  if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
  return res.json();
}
