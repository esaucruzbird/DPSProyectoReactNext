'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'usuario' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    try {
      setLoading(true);
      register(form);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al registrar');
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
              <h1 className="page-title">Registro</h1>
              <p className="lead">Crea una cuenta para comenzar a gestionar proyectos y tareas.</p>
            </div>
          </div>

          <div className="card-body">
            <div className="form-wrap">
              {error && <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3">{error}</div>}

              <form onSubmit={onSubmit} className="space-y-3">
                <div className="form-row">
                  <label className="block">
                    <div className="text-sm text-[var(--muted)] mb-1">Nombre</div>
                    <input name="name" value={form.name} onChange={onChange} placeholder="Tu nombre" className="input" />
                  </label>
                </div>

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
                      placeholder="Contraseña segura"
                      className="input"
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label className="block">
                    <div className="text-sm text-[var(--muted)] mb-1">Rol</div>
                    <select name="role" value={form.role} onChange={onChange} className="input">
                      <option value="usuario">Usuario</option>
                      <option value="gerente">Gerente</option>
                    </select>
                  </label>
                </div>

                <div className="form-row">
                  <button type="submit" disabled={loading} className="btn btn-primary w-full">
                    {loading ? 'Creando cuenta...' : 'Registrarme'}
                  </button>
                </div>
                
                <div className="form-row text-center">
                  <Link href="/" className="link">
                    ¿Ya tienes cuenta? Inicia sesión
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
