// src/app/page.js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    // Si ya hay session en localStorage, redirigir al dashboard
    try {
      const raw = localStorage.getItem('session');
      if (raw) {
        router.replace('/dashboard');
        return;
      }
    } catch (e) {
      // Ignorar errores de acceso a localStorage
      console.warn('No se pudo acceder a localStorage:', e);
    }

    // Escuchar cambios en localStorage (p. ej. login en otra pestaña)
    function onStorage(e) {
      if (e.key === 'session' && e.newValue) {
        // Al detectarse que se creó/actualizó la session en otra pestaña, redirigir
        router.replace('/dashboard');
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Completa email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      // login puede ser síncrono o async; await funciona en ambos casos
      await login(form);
      // Después de hacer login, redirigimos al dashboard
      router.replace('/dashboard');
    } catch (err) {
      setError(err?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="container-center">
        <div className="card">
          <div className="card-header">
            <div className="form-wrap">
              <h1 className="page-title">Iniciar sesión</h1>
              <p className="lead">Accede a tu cuenta para ver y administrar tus proyectos.</p>
            </div>
          </div>

          <div className="card-body">
            <div className="form-wrap">
              {error && <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3">{error}</div>}

              <form onSubmit={onSubmit} className="space-y-3">
                <div className="form-row">
                  <label className="block">
                    <div className="text-sm text-[var(--muted)] mb-1">Email</div>
                    <input
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className="input"
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label className="block">
                    <div className="text-sm text-[var(--muted)] mb-1">Contraseña</div>
                    <input
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      type="password"
                      placeholder="Tu contraseña"
                      className="input"
                    />
                  </label>
                </div>

                <div className="form-row">
                  <button type="submit" disabled={loading} className="btn btn-primary w-full">
                    {loading ? 'Validando...' : 'Entrar'}
                  </button>
                </div>

                <div className="form-row text-center">
                  <a className="link" href="/register">
                    ¿No tienes cuenta? Regístrate
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
