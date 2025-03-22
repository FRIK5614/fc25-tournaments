// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Switch, Route, Link, Redirect } from 'react-router-dom';
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

        <Switch>
          <Route path="/login">
            {token ? <Redirect to="/dashboard" /> : <LoginPage onLogin={handleLogin} />}
          </Route>
          <Route path="/register">
            {token ? <Redirect to="/dashboard" /> : <RegisterPage />}
          </Route>
          <Route path="/dashboard">
            {token ? <Dashboard /> : <Redirect to="/login" />}
          </Route>
          <Route path="/profile">
            {token ? <ProfilePage /> : <Redirect to="/login" />}
          </Route>
          <Route path="/tournaments">
            {token ? <TournamentPage /> : <Redirect to="/login" />}
          </Route>
          <Route path="/">
            {token ? <Redirect to="/dashboard" /> : <LoginPage onLogin={handleLogin} />}
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
