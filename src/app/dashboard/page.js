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

  if (!loaded) return null;

  return (
    <div className="min-h-screen p-8">
      <div className="container-center">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="lead">Bienvenido <strong>{user?.name}</strong> · {user?.role}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { logout(); router.push("/login"); }} className="btn btn-ghost">Salir</button>
          </div>
        </header>

        <div className="grid-3">
          <aside className="card p-4">
            <div className="card-body">
              <h3 className="font-semibold">Crear proyecto</h3>
              {user?.role !== "gerente" ? (
                <p className="text-sm text-[var(--muted)] mt-2">Solo gerentes pueden crear proyectos.</p>
              ) : (
                <div className="mt-3">
                  <input placeholder="Título del proyecto" value={title} onChange={(e)=>setTitle(e.target.value)} className="input" />
                  <textarea placeholder="Descripción (opcional)" value={desc} onChange={(e)=>setDesc(e.target.value)} rows={4} className="input mt-3"></textarea>
                  <button onClick={() => {
                    if(!title) return;
                    setSaving(true);
                    const p = mockCreateProject({ title, description: desc });
                    setProjects(prev=>[p,...prev]);
                    setTitle(""); setDesc(""); setSaving(false);
                  }} disabled={saving} className="btn btn-primary w-full mt-3">{saving ? "Guardando..." : "Crear proyecto"}</button>
                </div>
              )}
            </div>
          </aside>

          <section>
            <div className="card p-4">
              <div className="card-body">
                <h3 className="font-semibold">Proyectos</h3>
                {projects.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] mt-3">No hay proyectos aún.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {projects.map(p => (
                      <li key={p.id} className="project-item">
                        <div>
                          <div className="font-semibold">{p.title}</div>
                          <div className="text-sm text-[var(--muted)]">{p.description}</div>
                        </div>
                        <div>
                          <button onClick={()=>{ mockDeleteProject(p.id); setProjects(prev=>prev.filter(x=>x.id!==p.id)); }} className="btn btn-ghost">Eliminar</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

