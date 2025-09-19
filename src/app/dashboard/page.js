"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import useRequireAuth from "../../hooks/useRequireAuth";
import {
  mockGetProjects,
  mockCreateProject,
  mockUpdateProject,
  mockDeleteProject,
  mockCreateTask,
  mockUpdateTask,
  mockDeleteTask,
  mockProjectDaysInfo,
  mockListUsers,
} from "@/lib/mockApi";

//import { mockGetProjects, mockCreateProject, mockDeleteProject } from "@/lib/mockApi";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { loaded } = useRequireAuth();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  // Estado para crear/editar proyecto (solo gerente)
  const [projForm, setProjForm] = useState({
    id: null,
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [projError, setProjError] = useState("");

  // estados para task create/edit dentro del proyecto expandido
  const [taskForm, setTaskForm] = useState({
    id: null,
    name: "",
    description: "",
    assignedDays: 0,
    assignedTo: null,
    status: "pendiente",
  });
  const [taskError, setTaskError] = useState("");

  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    if (!loaded) return;
    setProjects(mockGetProjects());
    setUsersList(mockListUsers());
  }, [loaded]);

  // Helpers
  function refresh() {
    setProjects(mockGetProjects());
  }

  // PROJECTS CRUD ------------------------------------------------------------
  const handleCreateProject = () => {
    setProjError("");
    try {
      const created = mockCreateProject({
        title: projForm.title,
        description: projForm.description,
        startDate: projForm.startDate,
        endDate: projForm.endDate,
      });
      setProjForm({ id: null, title: "", description: "", startDate: "", endDate: "" });
      refresh();
      setExpandedProjectId(created.id);
    } catch (err) {
      setProjError(err.message || "Error creando proyecto");
    }
  };

  const handleUpdateProject = () => {
    setProjError("");
    try {
      mockUpdateProject(projForm.id, {
        title: projForm.title,
        description: projForm.description,
        startDate: projForm.startDate,
        endDate: projForm.endDate,
      });
      setProjForm({ id: null, title: "", description: "", startDate: "", endDate: "" });
      refresh();
    } catch (err) {
      setProjError(err.message || "Error actualizando proyecto");
    }
  };

  const handleDeleteProject = (id) => {
    if (!confirm("¿Eliminar proyecto? Esta acción es irreversible.")) return;
    mockDeleteProject(id);
    refresh();
    if (expandedProjectId === id) setExpandedProjectId(null);
  };

  const openEditProject = (p) => {
    setProjForm({
      id: p.id,
      title: p.title,
      description: p.description,
      startDate: p.startDate,
      endDate: p.endDate,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // TASKS CRUD ---------------------------------------------------------------
  const openNewTaskFor = (projectId) => {
    setTaskError("");
    setTaskForm({ id: null, name: "", description: "", assignedDays: 0, assignedTo: null, status: "pendiente", projectId });
    setExpandedProjectId(projectId);
  };

  const openEditTask = (projectId, task) => {
    setTaskError("");
    setTaskForm({
      id: task.id,
      name: task.name,
      description: task.description,
      assignedDays: task.assignedDays,
      assignedTo: task.assignedTo,
      status: task.status,
      projectId,
    });
    setExpandedProjectId(projectId);
  };

  const handleSaveTask = () => {
    setTaskError("");
    const { projectId } = taskForm;
    if (!projectId) return setTaskError("Proyecto no seleccionado");
    try {
      if (taskForm.id) {
        mockUpdateTask(projectId, taskForm.id, {
          name: taskForm.name,
          description: taskForm.description,
          assignedDays: Number(taskForm.assignedDays),
          assignedTo: taskForm.assignedTo,
          status: taskForm.status,
        });
      } else {
        mockCreateTask(projectId, {
          name: taskForm.name,
          description: taskForm.description,
          assignedDays: Number(taskForm.assignedDays),
          assignedTo: taskForm.assignedTo,
          status: taskForm.status,
        });
      }
      setTaskForm({ id: null, name: "", description: "", assignedDays: 0, assignedTo: null, status: "pendiente", projectId: null });
      refresh();
    } catch (err) {
      setTaskError(err.message || "Error guardando tarea");
    }
  };

  const handleDeleteTask = (projectId, taskId) => {
    if (!confirm("¿Eliminar tarea?")) return;
    mockDeleteTask(projectId, taskId);
    refresh();
  };

  // UI render helpers --------------------------------------------------------
  if (!loaded) return null;

  // Seguridad: si user es null, userId será null y evitamos leer .id directamente
  const userId = user?.id ?? null;

  // Filtrado para rol usuario: ver sólo proyectos donde tiene alguna tarea asignada
  const visibleProjects = user?.role === "gerente"
    ? projects
    : (userId ? projects.filter((p) => (p.tasks || []).some((t) => t.assignedTo === userId)) : []);
    //: projects.filter((p) => (p.tasks || []).some((t) => t.assignedTo === user.id));

  return (
    <div className="min-h-screen p-8">
      <div className="container-center">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="lead">Bienvenido <strong>{user?.name}</strong> — {user?.role}</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn btn-ghost" onClick={() => { logout(); router.push("/login"); }}>Salir</button>
          </div>
        </header>

        {/* PROYECTO: formulario crear/editar (solo gerente) */}
        {user?.role === "gerente" && (
          <div className="card mb-6">
            <div className="card-header form-wrap">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <div>
                  <h2 className="font-semibold">Crear / Editar proyecto</h2>
                  <div className="lead">Define título, descripción y fechas del proyecto.</div>
                </div>
                <div>
                  {projForm.id ? (
                    <button className="btn btn-ghost" onClick={() => setProjForm({ id: null, title: "", description: "", startDate: "", endDate: "" })}>Limpiar</button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="card-body form-wrap">
              {projError && <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3">{projError}</div>}

              <div className="grid" style={{ gap: "0.75rem" }}>
                <input placeholder="Título" className="input" value={projForm.title} onChange={(e)=>setProjForm({...projForm,title:e.target.value})}/>
                <input placeholder="Descripción" className="input" value={projForm.description} onChange={(e)=>setProjForm({...projForm,description:e.target.value})}/>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <label style={{ flex: 1 }}>
                    <div className="text-sm text-[var(--muted)] mb-1">Fecha inicio</div>
                    <input type="date" className="input" value={projForm.startDate} onChange={(e)=>setProjForm({...projForm,startDate:e.target.value})}/>
                  </label>
                  <label style={{ flex: 1 }}>
                    <div className="text-sm text-[var(--muted)] mb-1">Fecha fin</div>
                    <input type="date" className="input" value={projForm.endDate} onChange={(e)=>setProjForm({...projForm,endDate:e.target.value})}/>
                  </label>
                </div>

                <div style={{ display: "flex", gap: ".5rem" }}>
                  {projForm.id ? (
                    <button className="btn btn-primary" onClick={handleUpdateProject}>Actualizar proyecto</button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleCreateProject}>Crear proyecto</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LISTADO DE PROYECTOS */}
        <div className="space-y-4">
          {visibleProjects.length === 0 ? <div className="text-sm text-[var(--muted)]">No hay proyectos visibles.</div> : null}

          {visibleProjects.map((p) => {
            const daysInfo = mockProjectDaysInfo(p);
            return (
              <div key={p.id} className="card">
                <div className="card-header form-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.title}</div>
                    <div className="text-sm text-[var(--muted)]">{p.description}</div>
                    <div className="text-sm text-[var(--muted)] mt-1">
                      {p.startDate} → {p.endDate} · Disponibles: {daysInfo.available}d · Ocupados: {daysInfo.used}d
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: ".5rem" }}>
                    <button className="btn btn-ghost" onClick={() => { setExpandedProjectId(expandedProjectId === p.id ? null : p.id); }}>
                      {expandedProjectId === p.id ? "Cerrar" : "Abrir"}
                    </button>

                    {/* acciones gerente */}
                    {user?.role === "gerente" && (
                      <>
                        <button className="btn btn-ghost" onClick={() => openEditProject(p)}>Editar</button>
                        <button className="btn btn-ghost" onClick={() => handleDeleteProject(p.id)}>Eliminar</button>
                      </>
                    )}
                  </div>
                </div>

                {expandedProjectId === p.id && (
                  <div className="card-body form-wrap">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                      <h4 className="font-semibold">Tareas</h4>
                      <div style={{ display: "flex", gap: ".5rem" }}>
                        {/* Nuevo: si gerente puede crear tarea, si usuario sólo puede crear si está asignado? aquí solo gerente crea */}
                        {user?.role === "gerente" && (
                          <button className="btn btn-primary" onClick={() => openNewTaskFor(p.id)}>Nueva tarea</button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      {(p.tasks || []).length === 0 && <div className="text-sm text-[var(--muted)]">Sin tareas aún.</div>}

                      {(p.tasks || []).map((t) => {
                        const assignedToName = usersList.find(u => u.id === t.assignedTo)?.name || "No asignado";
                        //const canEditTask = user?.role === "gerente" || t.assignedTo === user.id;
                        const canEditTask = user?.role === "gerente" || t.assignedTo === userId;
                        //const userIsAssignedHere = t.assignedTo === user.id;
                        const userIsAssignedHere = t.assignedTo === userId;
                        return (
                          <div key={t.id} className="project-item">
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700 }}>{t.name}</div>
                              <div className="text-sm text-[var(--muted)]">{t.description}</div>
                              <div className="text-sm text-[var(--muted)] mt-1">Días asignados: {t.assignedDays} · Responsable: {assignedToName}</div>
                              <div className="text-sm text-[var(--muted)]">Estado: <strong>{t.status}</strong></div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                              {/* Si usuario asignado, permite cambiar estado (solo su tarea) */}
                              {user?.role === "usuario" && userIsAssignedHere && (
                                <select className="input" value={t.status} onChange={(e)=>{ mockUpdateTask(p.id, t.id, { status: e.target.value }); refresh(); }}>
                                  <option value="pendiente">pendiente</option>
                                  <option value="en_progreso">en_progreso</option>
                                  <option value="completada">completada</option>
                                </select>
                              )}

                              {/* gerente: editar / eliminar / cambiar estado / reasignar */}
                              {user?.role === "gerente" && (
                                <>
                                  <button className="btn btn-ghost" onClick={() => openEditTask(p.id, t)}>Editar</button>
                                  <button className="btn btn-ghost" onClick={() => handleDeleteTask(p.id, t.id)}>Eliminar</button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Formulario tarea (aparece si taskForm.projectId === p.id) */}
                    {taskForm.projectId === p.id && (
                      <div className="mt-4">
                        <h5 className="font-semibold">Crear / Editar tarea</h5>
                        {taskError && <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3">{taskError}</div>}
                        <div style={{ display: "grid", gap: ".5rem", marginTop: ".5rem" }}>
                          <input placeholder="Nombre de la tarea" className="input" value={taskForm.name} onChange={(e)=>setTaskForm({...taskForm,name:e.target.value})}/>
                          <textarea placeholder="Descripción" className="input" rows={3} value={taskForm.description} onChange={(e)=>setTaskForm({...taskForm,description:e.target.value})}></textarea>

                          <div style={{ display: "flex", gap: ".5rem" }}>
                            <input type="number" className="input" min={0} placeholder="Días asignados" value={taskForm.assignedDays} onChange={(e)=>setTaskForm({...taskForm,assignedDays: Number(e.target.value)})}/>
                            <select className="input" value={taskForm.assignedTo ?? ""} onChange={(e)=>setTaskForm({...taskForm,assignedTo: e.target.value ? Number(e.target.value) : null})}>
                              <option value="">-- asignar a --</option>
                              {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                            </select>
                          </div>

                          <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
                            <select className="input" value={taskForm.status} onChange={(e)=>setTaskForm({...taskForm,status:e.target.value})}>
                              <option value="pendiente">pendiente</option>
                              <option value="en_progreso">en_progreso</option>
                              <option value="completada">completada</option>
                            </select>

                            <div style={{ flex: 1, display: "flex", gap: ".5rem" }}>
                              <button className="btn btn-primary" onClick={handleSaveTask}>{taskForm.id ? "Actualizar tarea" : "Crear tarea"}</button>
                              <button className="btn btn-ghost" onClick={() => setTaskForm({ id: null, name: "", description: "", assignedDays: 0, assignedTo: null, status: "pendiente", projectId: null })}>Cancelar</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}



