
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEventDetailPage from './pages/AdminEventDetailPage';
import UserSchedulePage from './pages/UserSchedulePage';
import Header from './components/Header';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/event/:eventId" element={<AdminEventDetailPage />} />
            <Route path="/schedule/:eventId" element={<UserSchedulePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="text-center p-4 text-sm text-slate-600 border-t border-slate-300">
          <p>&copy; {new Date().getFullYear()} BEAUTY ROAD スケジュール調整. All rights reserved.</p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
    