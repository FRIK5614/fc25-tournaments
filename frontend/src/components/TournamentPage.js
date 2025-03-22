// src/components/TournamentPage.js
import React, { useEffect, useState } from 'react';
import { getTournaments } from '../api';

function TournamentPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      const data = await getTournaments();
      setTournaments(data);
      setLoading(false);
    }
    fetchTournaments();
  }, []);

  if (loading) return <p>Загрузка турниров...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Турниры</h2>
      {tournaments.length === 0 ? (
        <p>Турниров не найдено</p>
      ) : (
        <ul>
          {tournaments.map(tour => (
            <li key={tour._id}>
              <strong>{tour._id}</strong> - Статус: {tour.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TournamentPage;
