import { ArCatalog } from './ArCatalog';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-row">
          <div>
            <h1>AR Model Viewer</h1>
            <p className="app-subtitle">Browse models and open them in AR on your device</p>
          </div>
          <nav className="app-nav">
            <a className="nav-link" href="/ar-generate.html">Generate 3D</a>
            <a className="nav-link" href="/ar-fence-builder.html">Fence Builder</a>
          </nav>
        </div>
      </header>
      <main>
        <ArCatalog base={API_BASE} />
      </main>
    </div>
  );
}

export default App;
