import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Overview from './pages/Overview';
import OfficeDetail from './pages/OfficeDetail';
import DataEntry from './pages/DataEntry';
import Rankings from './pages/Rankings';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">LabPulse</h1>
            <div className="flex gap-6">
              <Link to="/" className="text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors">Overview</Link>
              <Link to="/data-entry" className="text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors">Data Entry</Link>
              <Link to="/rankings" className="text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors">Rankings</Link>
              <Link to="/settings" className="text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors">Settings</Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/office/:officeId" element={<OfficeDetail />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
