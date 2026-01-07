import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Overview from './pages/Overview';
import OfficeDetail from './pages/OfficeDetail';
import DataEntry from './pages/DataEntry';
import Rankings from './pages/Rankings';
import Directory from './pages/Directory';
import Compliance from './pages/Compliance';
import Settings from './pages/Settings';
import './App.css';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold">LabPulse</h1>
        <div className="flex gap-6">
          <Link
            to="/"
            className={`px-4 py-2 rounded-md transition-colors ${
              location.pathname === '/'
                ? 'bg-blue-700 text-white'
                : 'text-blue-100 hover:bg-blue-600'
            }`}
          >
            Overview
          </Link>
          <Link
            to="/data-entry"
            className={`px-4 py-2 rounded-md transition-colors ${
              location.pathname === '/data-entry'
                ? 'bg-blue-700 text-white'
                : 'text-blue-100 hover:bg-blue-600'
            }`}
          >
            Data Entry
          </Link>
          <Link
            to="/rankings"
            className={`px-4 py-2 rounded-md transition-colors ${
              location.pathname === '/rankings'
                ? 'bg-blue-700 text-white'
                : 'text-blue-100 hover:bg-blue-600'
            }`}
          >
            Rankings
          </Link>
          <Link
            to="/directory"
            className={`px-4 py-2 rounded-md transition-colors ${
              location.pathname === '/directory'
                ? 'bg-blue-700 text-white'
                : 'text-blue-100 hover:bg-blue-600'
            }`}
          >
            Directory
          </Link>
          <Link
            to="/compliance"
            className={`px-4 py-2 rounded-md transition-colors ${
              location.pathname === '/compliance'
                ? 'bg-blue-700 text-white'
                : 'text-blue-100 hover:bg-blue-600'
            }`}
          >
            Compliance
          </Link>
          <Link
            to="/settings"
            className={`px-4 py-2 rounded-md transition-colors ${
              location.pathname === '/settings'
                ? 'bg-blue-700 text-white'
                : 'text-blue-100 hover:bg-blue-600'
            }`}
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <Navigation />

        {/* Main Content */}
        <main className="container mx-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/office/:officeId" element={<OfficeDetail />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
