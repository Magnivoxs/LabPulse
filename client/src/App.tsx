import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LabDetailPage from './pages/LabDetailPage';
import LabsManagementPage from './pages/LabsManagementPage';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="labs" element={<LabsManagementPage />} />
          <Route path="labs/:labId" element={<LabDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
