// src/components/ProfilePage.js
import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile, uploadAvatar } from '../api';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editData, setEditData] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      const data = await getProfile();
      setProfile(data);
      setEditData({
        username: data.username,
        phone: data.phone,
        country: data.country,
        platform: data.platform,
        gamertag: data.gamertag
      });
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await updateProfile(editData);
    setProfile(data.user);
    setMessage('Профиль обновлен');
  };

  const handleAvatarChange = (e) => {
    setAvatarFile(e.target.files[0]);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const data = await uploadAvatar(avatarFile);
    setProfile(data.user);
    setMessage('Аватар обновлен');
  };

  if (!profile) return <p>Загрузка...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Профиль пользователя</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <div>
        <img src={profile.avatar ? `/${profile.avatar}` : 'placeholder.jpg'} alt="avatar" width="100" />
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Имя пользователя:</label>
          <input type="text" name="username" value={editData.username} onChange={handleChange} required/>
        </div>
        <div>
          <label>Телефон:</label>
          <input type="text" name="phone" value={editData.phone} onChange={handleChange} required/>
        </div>
        <div>
          <label>Страна:</label>
          <input type="text" name="country" value={editData.country} onChange={handleChange} required/>
        </div>
        <div>
          <label>Платформа:</label>
          <input type="text" name="platform" value={editData.platform} onChange={handleChange} required/>
        </div>
        <div>
          <label>Никнейм в игре:</label>
          <input type="text" name="gamertag" value={editData.gamertag} onChange={handleChange} required/>
        </div>
        <button type="submit">Обновить профиль</button>
      </form>
      <hr />
      <div>
        <h3>Загрузка аватара</h3>
        <input type="file" onChange={handleAvatarChange} />
        <button onClick={handleAvatarUpload}>Загрузить аватар</button>
      </div>
    </div>
  );
}

export default ProfilePage;
