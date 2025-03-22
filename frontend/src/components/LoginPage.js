import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      if (data.token) {
        onLogin(data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch (err) {
      setError('Ошибка запроса');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Вход</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div>
          <label>Пароль:</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <button type="submit">Войти</button>
      </form>
    </div>
  );
}

export default LoginPage;
