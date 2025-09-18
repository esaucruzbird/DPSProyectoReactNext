"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    try {
      login(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl mb-4">Iniciar sesión</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <input className="w-full p-2 mb-2 border" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
        <input type="password" className="w-full p-2 mb-2 border" placeholder="Contraseña" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
        <button className="w-full bg-green-600 text-white p-2 rounded">Entrar</button>
      </form>
    </div>
  );
}
