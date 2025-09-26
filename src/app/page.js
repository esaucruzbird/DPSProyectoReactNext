// src/app/page.js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  //extrae login desde el AuthContext (implementa la lógica de autenticación)
  const { login } = useAuth();
  //router del App Router de Next para redirecciones
  const router = useRouter();
  //estado que contiene los valores del formulario
  const [form, setForm] = useState({ email: '', password: '' });
  //mensaje de error para mostrar al usuario
  const [error, setError] = useState('');
  //indicador de carga para deshabilitar botones y mostrar feedback
  const [loading, setLoading] = useState(false);
  //maneja cambios en inputs controlados (email / password)
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    // Si ya hay session en localStorage, redirigir al dashboard
    try {
      const raw = localStorage.getItem('session');
      if (raw) {
        //replace evita que el usuario vuelva atrás al login con el botón "atrás"
        router.replace('/dashboard');
        return;
      }
    } catch (e) {
      //ignorar errores de acceso a localStorage
      //puede fallar en navegadores con políticas estrictas o en entornos sin localStorage
      console.warn('No se pudo acceder a localStorage:', e);
    }

    //escucha cambios en localStorage (p. ej. login en otra pestaña)
    //el evento "storage" no se dispara en la misma pestaña que realizó el cambio
    function onStorage(e) {
      //si la clave 'session' se creó o actualizó en otra pestaña, redirige
      if (e.key === 'session' && e.newValue) {
        //al detectarse que se creó/actualizó la session en otra pestaña, redirige
        router.replace('/dashboard');
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [router]);

  //envío del formulario
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    //validación básica en cliente: ambos campos deben tener contenido
    if (!form.email || !form.password) {
      setError('Completa email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      // login puede ser síncrono o async; await funciona en ambos casos
      await login(form);
      //si el login fue exitoso, redirige al dashboard
      router.replace('/dashboard');
    } catch (err) {
      //muestra el mensaje de error devuelto por login (si existe) o uno genérico
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
              {/*fragmento que usa renderizado condicional en JSX para mostrar un mensaje de error sólo cuando hay un valor “truthy” en la variable error
              Es una expresión JavaScript. Evalúa el operador &&:
              Si error es falsy (false, null, undefined, '' (cadena vacía), NaN), el resultado de la expresión es ese valor falsy y React no renderiza nada (React ignora false, null, undefined)
              Si error es truthy (por ejemplo una cadena no vacía), el resultado es el operando derecho (es decir el <div>...</div>) y React renderiza ese div 
              En el <div>, {error} inserta el valor de la variable error en el contenido del div. Si error es una cadena se mostrará tal cual lo que tenga*/}
              {error && <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3">{error}</div>}

              <form onSubmit={onSubmit} className="space-y-3">
                <div className="form-row">
                  <label className="block">
                    <div className="text-sm text-[var(--muted)] mb-1">Email</div>
                    {/*controla el campo email con la propiedad form.email*/}
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
                    {/*form.password refleja el estado
                    type="password" enmascara caracteres*/}
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
                  {/*type="submit": envía el formulario y dispara el onSubmit definido en el <form>
                  disabled={loading}: cuando loading es true, el botón se desactiva, evita envíos múltiples
                  w-full (Tailwind) hace que el botón ocupe todo el ancho del contenedor
                  loading hace un renderizado condicional, muestra texto distinto según loading Cuando se está procesando, se da feedback al usuario*/}
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
