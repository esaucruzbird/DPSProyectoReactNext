"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "usuario" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    try {
      setLoading(true);
      register(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-extrabold text-slate-800">Registro</h1>
          <p className="text-sm text-slate-500 mt-1">Crea tu cuenta para administrar proyectos y tareas.</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>}

          <label className="block">
            <span className="text-sm text-slate-700">Nombre</span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tu nombre"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-700">Email</span>
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              type="email"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-700">Contraseña</span>
            <input
              name="password"
              value={form.password}
              onChange={onChange}
              type="password"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Contraseña segura"
            />
          </label>

          <label className="flex items-center gap-3">
            <span className="text-sm text-slate-700">Rol</span>
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              className="ml-auto rounded-lg border border-slate-300 px-2 py-1"
            >
              <option value="usuario">Usuario</option>
              <option value="gerente">Gerente</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Registrarme"}
          </button>

          <div className="text-center text-sm text-slate-500">
            ¿Ya tienes cuenta? <a className="text-indigo-600 hover:underline" href="/login">Inicia sesión</a>
          </div>
        </form>
      </div>
    </main>
  );
}
