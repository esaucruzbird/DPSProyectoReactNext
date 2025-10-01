'use client';
//hook de React que permite guardar y actualizar estado local dentro del componente (valores del formulario, errores, flags de carga)
import { useEffect, useState } from 'react';
//hook del enrutador de Next (app router). Permite navegar programáticamente (router.push("/dashboard")) desde el cliente
import { useRouter } from 'next/navigation';
//hook personalizado useAuth desde el contexto de autenticación
import { useAuth } from '../context/AuthContext';

//se declara y exporta el componente React LoginPage que será la página del login. Todo lo siguiente está dentro de dicho componente
export default function LoginPage() {
  //se llama a useAuth() y se extrae (desestructura) la función login
  //extrae login desde el AuthContext (implementa la lógica de autenticación)
  const { login } = useAuth();
  //se obtiene la instancia del router para poder navegar entre rutas después del login
  const router = useRouter();
  //se crea un estado "form" con email y password inicializados vacíos. "setForm" sirve para actualizar ese objeto cuando el usuario está escribiendo
  const [form, setForm] = useState({ email: '', password: '' });
  //estado para mensajes de error (cadena vacía si no hay error). "setError" lo actualiza para mostrar mensajes al usuario
  const [error, setError] = useState('');
  //bandera loading (booleano) para saber si hay una operación en curso (enviar credenciales
  //indicador de carga para deshabilitar botones y mostrar feedback
  const [loading, setLoading] = useState(false);
  
  /* Función para manejar cambios en los campos controlados (email, password) del formulario
    "e" es el evento del input
    "...form" copia el contenido actual del objeto form
    [e.target.name] usa el nombre del campo (name="email" o name="password") como clave dinámica
    e.target.value es el nuevo valor del input
    Es decir, actualiza solo el campo que cambió sin perder los otros  */
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  //ejecuta efectos secundarios después del render
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
    //evita que el formulario haga un submit simple y recargue la página
    e.preventDefault();
    //se limpian errores previos
    setError('');
    //valida que ambos campos tengan contenido; si falta algo, setea el mensaje de error y se sale
    if (!form.email || !form.password) {
      setError('Completa email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      //login puede ser síncrono o async; await funciona en ambos casos
      //llama a login(form) para autenticar con las credenciales del form
      await login(form);
      //si el login fue exitoso, redirige al dashboard
      router.replace('/dashboard');
    } catch (err) {
      //se captura el error, si el login falla, muestra un mensaje claro
      setError(err?.message || 'Credenciales inválidas');
    } finally {
      //se hace siempre y pone "loading" en estado de false
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

          {/*clase que define el contenedor principal del contenido de una tarjeta (padding interno, fondo, border-radius, sombra ligera, etc.)*/}
          <div className="card-body">
            <div className="form-wrap">
              {/*fragmento que usa renderizado condicional en JSX para mostrar un mensaje de error sólo cuando hay un valor “truthy” en la variable error
              Es una expresión JavaScript. Evalúa el operador &&:
              Si error es falsy (false, null, undefined, '' (cadena vacía), NaN), el resultado de la expresión es ese valor falsy y React no renderiza nada (React ignora false, null, undefined)
              Si error es truthy (por ejemplo una cadena no vacía), el resultado es el operando derecho (es decir el <div>...</div>) y React renderiza ese div 
              En el <div>, {error} inserta el valor de la variable error en el contenido del div. Si error es una cadena se mostrará tal cual lo que tenga*/}
              {error && <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3">{error}</div>}

              {/*utilidad de tailwind que aplica un margin-top de una cantidad determinada (3rem) a cada hijo vertical del contenedor excepto el primero, creando un espaciado uniforme entre ellos*/}
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="form-row">
                  <label className="block">
                    {/*mb-1 margin-bottom pequeño (separa la etiqueta del input)
                    utiliza una variable CSS definida en los estilos (--muted)
                    var(--muted) permite centralizar control de color, en globals.css se tiene definido --muted y así todos los elementos que usen var(--muted) cambian*/}
                    <div className="text-sm text-[var(--muted)] mb-1">Email</div>
                    {/*value={form.email} el input es un componente controlado por React. El valor mostrado en el campo viene siempre del estado form.email
                    Si form.email cambia (por setForm), el input actualiza lo que muestra
                    El onchange hace referencia a la función que maneja cada cambio de texto
                    Se usa el atributo email del input ("email") para saber qué propiedad del objeto form debe actualizarse. Se puede usar el mismo handler para varios inputs (name, email, password, role)*/}
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
