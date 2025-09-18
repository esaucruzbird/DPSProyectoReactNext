"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "usuario" });
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Complete todos los campos");
      return;
    }
    try {
      register(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl mb-4">Registro</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <input className="w-full p-2 mb-2 border" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <input className="w-full p-2 mb-2 border" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
        <input type="password" className="w-full p-2 mb-2 border" placeholder="Contraseña" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
        <label className="block mb-2">
          Rol:
          <select className="ml-2 p-1 border" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
            <option value="usuario">Usuario</option>
            <option value="gerente">Gerente</option>
          </select>
        </label>
        <button className="w-full bg-blue-600 text-white p-2 rounded">Registrarme</button>
      </form>
    </div>
  );
}
