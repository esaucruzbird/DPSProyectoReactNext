"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import useRequireAuth from "../../hooks/useRequireAuth";
import { mockGetProjects } from "../../lib/mockApi";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { loaded } = useRequireAuth(); // esto redirige si no está auth
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (!loaded) return;
    setProjects(mockGetProjects());
  }, [loaded]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl">Dashboard — Bienvenido {user?.name} ({user?.role})</h1>
        <button className="px-3 py-1 border rounded" onClick={() => logout()}>Salir</button>
      </div>

      <section className="mt-6">
        <h2 className="font-semibold">Proyectos</h2>
        {projects.length === 0 ? <p className="text-sm text-gray-500">No hay proyectos aún</p> : (
          <ul className="mt-2">
            {projects.map(p => <li key={p.id} className="border p-2 mb-2 rounded">{p.title}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
