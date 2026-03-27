import { useState } from 'react';
import client from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Normal login
      const { data } = await client.post('/auth/login', { email, password });
      setAuth(data.user, data.access_token, data.user.tenantId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 style={{ marginBottom: '8px' }}>AdminSaaS</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Inicia sesión en tu negocio
        </p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

        </form>
      </div>

      <style>{`
        .login-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 20px;
        }
        .login-card {
          background: white;
          padding: 32px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }
        .input-group {
          text-align: left;
          margin-bottom: 16px;
        }
        .input-group label {
          display: block;
          font-size: 14px;
          margin-bottom: 4px;
          color: var(--text-secondary);
        }
        .input-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          outline: none;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          background: var(--brand);
          color: white;
          border-radius: var(--radius-sm);
          font-weight: 700;
          margin-top: 16px;
          cursor: pointer;
          border: none;
        }
        .login-btn:disabled { opacity: 0.7; }
        .error-box {
          background: #f8d7da;
          color: var(--danger);
          padding: 12px;
          border-radius: var(--radius-sm);
          margin-bottom: 16px;
          font-size: 14px;
        }
        .toggle-btn {
            background: none;
            border: none;
            color: var(--brand);
            font-weight: 600;
            cursor: pointer;
            padding: 0;
            text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;
