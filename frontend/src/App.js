// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import TournamentPage from './components/TournamentPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div>
        <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
          {token ? (
            <>
              <Link to="/dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>
              <Link to="/profile" style={{ marginRight: '1rem' }}>Профиль</Link>
              <Link to="/tournaments" style={{ marginRight: '1rem' }}>Турниры</Link>
              <button onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ marginRight: '1rem' }}>Вход</Link>
              <Link to="/register" style={{ marginRight: '1rem' }}>Регистрация</Link>
            </>
          )}
        </nav>

        <Routes>
          <Route path="/login" element={ token ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} /> } />
          <Route path="/register" element={ token ? <Navigate to="/dashboard" replace /> : <RegisterPage /> } />
          <Route path="/dashboard" element={ token ? <Dashboard /> : <Navigate to="/login" replace /> } />
          <Route path="/profile" element={ token ? <ProfilePage /> : <Navigate to="/login" replace /> } />
          <Route path="/tournaments" element={ token ? <TournamentPage /> : <Navigate to="/login" replace /> } />
          <Route path="/" element={ token ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} /> } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
