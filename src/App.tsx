import { ArCatalog } from './ArCatalog';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

const TOOLS = [
  {
    href: '/ar-generate.html',
    name: 'Generate 3D',
    desc: 'Photo → model via fal.ai, Meshy, or Tripo',
    colorClass: 'tool-icon--generate',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    href: '/ar-fence-builder.html',
    name: 'Fence Builder',
    desc: 'Extract fence components from a photo, then place a full run in AR',
    colorClass: 'tool-icon--fence',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2"/>
        <line x1="2"  y1="9"  x2="22" y2="9"/>
        <line x1="2"  y1="15" x2="22" y2="15"/>
        <line x1="8"  y1="3"  x2="8"  y2="21"/>
        <line x1="16" y1="3"  x2="16" y2="21"/>
      </svg>
    ),
  },
];

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>AR Studio</h1>
        <p className="app-subtitle">Browse, generate, and place 3D models in AR</p>
      </header>

      <section className="tools-section">
        <p className="section-label">Tools</p>
        <div className="tool-cards">
          {TOOLS.map(tool => (
            <a key={tool.href} className="tool-card" href={tool.href}>
              <div className={`tool-icon ${tool.colorClass}`}>{tool.icon}</div>
              <div className="tool-body">
                <div className="tool-name">{tool.name}</div>
                <div className="tool-desc">{tool.desc}</div>
              </div>
              <span className="tool-arrow">→</span>
            </a>
          ))}
        </div>
      </section>

      <main>
        <p className="section-label">Catalog</p>
        <ArCatalog base={API_BASE} />
      </main>
    </div>
  );
}

export default App;
