'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  //extrae la función register desde el AuthContext (implementación en context/AuthContext)
  const { register } = useAuth();
  //hook de navegación (App Router). Se usa router.push para navegar después de registrar
  const router = useRouter();
  //estado del formulario: controlado por React
  //los campos: name, email, password y role (por defecto 'usuario')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'usuario' });
  //estado para mensajes de error (cadena). Si no hay error, entonces una cadena vacía
  const [error, setError] = useState('');
  //indicador de carga (deshabilita el botón mientras se crea la cuenta)
  const [loading, setLoading] = useState(false);

  //maneja cambios en inputs/selects: actualiza la propiedad correspondiente del objeto `form`
  //usa e.target.name para identificar el campo (name, email, password o role)
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  //maneja el envío del formulario
  const onSubmit = (e) => {
    e.preventDefault(); //evita que el form recargue la página
    setError(''); //limpia errores previos
    //validación básica en cliente: todos los campos obligatorios deben tener contenido
    if (!form.name || !form.email || !form.password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    try {
      setLoading(true); //activa indicador de carga
      //llama a register desde AuthContext, en el AuthContext `register` es síncrono
      register(form);
      //redirige a /dashboard después del registro
      router.push('/dashboard');
    } catch (err) {
      //si register lanza error, se muestra (por ejemplo: "El correo ya está registrado")
      setError(err.message || 'Error al registrar');
    } finally {
      //desactiva indicador de carga (se ejecuta tanto en éxito como en error)
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

          {/*clase que define el contenedor principal del contenido de una tarjeta (padding interno, fondo, border-radius, sombra ligera, etc.)*/}
          <div className="card-body">
            <div className="form-wrap">
              {error && <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3">{error}</div>}

              {/*utilidad de tailwind que aplica un margin-top de una cantidad determinada (3rem) a cada hijo vertical del contenedor excepto el primero, creando un espaciado uniforme entre ellos*/}
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="form-row">
                  <label className="block">
                    {/*mb-1 margin-bottom pequeño (separa la etiqueta del input)
                    utiliza una variable CSS definida en los estilos (--muted)
                    var(--muted) permite centralizar control de color, en globals.css se tiene definido --muted y así todos los elementos que usen var(--muted) cambian*/}
                    <div className="text-sm text-[var(--muted)] mb-1">Nombre</div>
                    {/*value={form.name} el input es un componente controlado por React. El valor mostrado en el campo viene siempre del estado form.name
                    Si form.name cambia (por setForm), el input actualiza lo que muestra
                    El onchange hace referencia a la función que maneja cada cambio de texto
                    Se usa el atributo name del input ("name") para saber qué propiedad del objeto form debe actualizarse. Se puede usar el mismo handler para varios inputs (name, email, password, role)*/}
                    <input name="name" value={form.name} onChange={onChange} placeholder="Tu nombre" className="input" />
                  </label>
                </div>

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
                      placeholder="Contraseña segura"
                      className="input"
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label className="block">
                    <div className="text-sm text-[var(--muted)] mb-1">Rol</div>
                    {/*value={form.role} define la opción seleccionada en base al estado
                    cada <option value=""> define el valor que se asignará a form.role cuando esa opción sea seleccionada
                    */}
                    <select name="role" value={form.role} onChange={onChange} className="input">
                      <option value="usuario">Usuario</option>
                      <option value="gerente">Gerente</option>
                    </select>
                  </label>
                </div>

                <div className="form-row">
                  {/*type="submit": envía el formulario y dispara el onSubmit definido en el <form>
                  disabled={loading}: cuando loading es true, el botón se desactiva, evita envíos múltiples
                  w-full (Tailwind) hace que el botón ocupe todo el ancho del contenedor
                  loading hace un renderizado condicional, muestra texto distinto según loading Cuando se está procesando, se da feedback al usuario*/}
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
