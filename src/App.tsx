import { ArCatalog } from './ArCatalog';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>AR Model Viewer</h1>
        <p className="app-subtitle">Browse models and open them in AR on your device</p>
      </header>
      <main>
        <ArCatalog base={API_BASE} />
      </main>
    </div>
  );
}

export default App;
