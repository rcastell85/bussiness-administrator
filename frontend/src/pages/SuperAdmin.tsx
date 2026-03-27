import { useState } from 'react';
import client from '../api/client';
import { ShieldCheck, UserPlus } from 'lucide-react';

const SuperAdmin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await client.post('/auth/signup', { email, password, tenantId: tenantId.toLowerCase().replace(/\s/g, '') });
      
      setSuccess(`¡Negocio '${tenantId}' registrado con éxito! Ya pueden iniciar sesión con ${email}`);
      setEmail('');
      setPassword('');
      setTenantId('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar el nuevo negocio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--brand)' }}>
          <ShieldCheck size={48} />
        </div>
        <h1 style={{ marginBottom: '8px' }}>Portal Súper Admin</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Registro Privado de Nuevos Clientes (B2B)
        </p>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>ID del Negocio (Sin espacios)</label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="ej. panaderialacentral"
              required
            />
          </div>

          <div className="input-group">
            <label>Correo Electrónico a Asignar</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@negocio.com"
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña a Asignar</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Creando...' : <span style={{display: 'flex', alignItems: 'center', justifyContent:'center', gap: '8px'}}><UserPlus size={18}/> Crear Nuevo Cliente</span>}
          </button>
        </form>
      </div>

      <style>{`
        .admin-container { height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; padding: 20px; }
        .admin-card { background: white; padding: 32px; border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 450px; text-align: center; }
        .input-group { text-align: left; margin-bottom: 16px; }
        .input-group label { display: block; font-size: 14px; margin-bottom: 4px; color: var(--text-secondary); font-weight: 600; }
        .input-group input { width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: var(--radius-sm); outline: none; transition: border 0.2s; }
        .input-group input:focus { border-color: var(--brand); }
        .login-btn { width: 100%; padding: 14px; background: var(--brand); color: white; border-radius: var(--radius-sm); font-weight: 700; margin-top: 16px; cursor: pointer; border: none; transition: background 0.2s; }
        .login-btn:hover { background: #0056b3; }
        .login-btn:disabled { opacity: 0.7; }
        .error-box { background: #f8d7da; color: var(--danger); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 14px; }
        .success-box { background: #d4edda; color: #155724; padding: 12px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 14px; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default SuperAdmin;
