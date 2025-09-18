"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import useRequireAuth from "../../hooks/useRequireAuth";
import { mockGetProjects, mockCreateProject, mockDeleteProject } from "@/lib/mockApi";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { loaded } = useRequireAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    setProjects(mockGetProjects());
  }, [loaded]);

  const handleCreate = () => {
    if (!title) return;
    setSaving(true);
    const p = mockCreateProject({ title, description: desc });
    setProjects(prev => [p, ...prev]);
    setTitle("");
    setDesc("");
    setSaving(false);
  };

  const handleDelete = (id) => {
    mockDeleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Bienvenido, <span className="font-semibold">{user?.name}</span> — {user?.role}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="px-3 py-1 rounded-lg border hover:bg-red-50"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-lg">Crear proyecto</h2>
          {user?.role !== "gerente" ? (
            <p className="text-sm text-slate-500 mt-2">Solo gerentes pueden crear proyectos.</p>
          ) : (
            <>
              <input
                placeholder="Título del proyecto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-3 w-full rounded-md border px-3 py-2"
              />
              <textarea
                placeholder="Descripción (opcional)"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="mt-3 w-full rounded-md border px-3 py-2"
                rows={4}
              />
              <button
                onClick={handleCreate}
                disabled={saving}
                className="mt-3 w-full rounded-md bg-indigo-600 text-white px-3 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Crear proyecto"}
              </button>
            </>
          )}
        </section>

        <section className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-lg">Proyectos</h2>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500 mt-3">No hay proyectos aún.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {projects.map(p => (
                  <li key={p.id} className="flex items-start justify-between border rounded-md p-3">
                    <div>
                      <div className="font-semibold text-slate-800">{p.title}</div>
                      <div className="text-sm text-slate-500">{p.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-sm px-3 py-1 rounded border hover:bg-red-50" onClick={() => handleDelete(p.id)}>Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

