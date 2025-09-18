"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Completa email y contraseña.");
      return;
    }
    try {
      setLoading(true);
      login(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center">
          <h1 className="text-2xl font-extrabold text-slate-800">Iniciar sesión</h1>
          <p className="text-sm text-slate-500 mt-1">Ingresa con tu correo y contraseña.</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>}

          <label className="block">
            <span className="text-sm text-slate-700">Email</span>
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              type="email"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Tu contraseña"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 text-white px-4 py-2 font-semibold hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "Validando..." : "Entrar"}
          </button>

          <div className="text-center text-sm text-slate-500">
            ¿No tienes cuenta? <a className="text-indigo-600 hover:underline" href="/register">Regístrate</a>
          </div>
        </form>
      </div>
    </main>
  );
}
