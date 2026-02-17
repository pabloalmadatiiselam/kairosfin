// componentes/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/auth';
import './Login.css';

const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = login(password);

    if (success) {
      navigate('/');
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">KairosFin</h1>
          <p className="login-subtitle">Sistema de Gestión Financiera</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label className="login-label">Contraseña de Acceso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              className="login-input"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !password}
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-footer-text">
            Acceso exclusivo para usuarios autorizados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;