// src/components/RegisterPage.js
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { register } from '../api';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    country: '',
    platform: '',
    gamertag: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const history = useHistory();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    try {
      const data = await register(formData);
      if(data.message) {
        alert(data.message);
        history.push('/login');
      } else {
        setError(data.error || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Ошибка запроса');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Регистрация</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Имя пользователя:</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required/>
        </div>
        <div>
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required/>
        </div>
        <div>
          <label>Телефон:</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} required/>
        </div>
        <div>
          <label>Страна:</label>
          <input type="text" name="country" value={formData.country} onChange={handleChange} required/>
        </div>
        <div>
          <label>Платформа:</label>
          <select name="platform" value={formData.platform} onChange={handleChange} required>
            <option value="">Выберите</option>
            <option value="PS5">PS5</option>
            <option value="Xbox">Xbox</option>
            <option value="PC">PC</option>
          </select>
        </div>
        <div>
          <label>Никнейм в игре:</label>
          <input type="text" name="gamertag" value={formData.gamertag} onChange={handleChange} required/>
        </div>
        <div>
          <label>Пароль:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required/>
        </div>
        <div>
          <label>Подтверждение пароля:</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required/>
        </div>
        <button type="submit">Зарегистрироваться</button>
      </form>
    </div>
  );
}

export default RegisterPage;
