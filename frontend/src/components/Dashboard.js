// src/components/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Dashboard</h2>
      <p>Добро пожаловать в систему турниров FC25!</p>
      <ul>
        <li><Link to="/tournaments">Смотреть турниры</Link></li>
        <li><Link to="/profile">Мой профиль</Link></li>
      </ul>
    </div>
  );
}

export default Dashboard;
