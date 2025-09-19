'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import useRequireAuth from '../../hooks/useRequireAuth';
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
  daysBetweenInclusive,
} from '@/lib/mockApi';

//import { mockGetProjects, mockCreateProject, mockDeleteProject } from "@/lib/mockApi";

const STATUS_OPTIONS = ['Nuevo', 'En curso', 'Cerrado', 'Completado'];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { loaded } = useRequireAuth();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  const [projForm, setProjForm] = useState({ id: null, title: '', description: '', startDate: '', endDate: '' });
  const [projError, setProjError] = useState('');

  const [taskForm, setTaskForm] = useState({
    id: null,
    name: '',
    description: '',
    assignedDays: 0,
    assignedTo: null,
    status: STATUS_OPTIONS[0],
    projectId: null,
  });
  const [taskError, setTaskError] = useState('');

  const [usersList, setUsersList] = useState([]);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!loaded) return;
    setProjects(mockGetProjects());
    setUsersList(mockListUsers());
  }, [loaded]);

  function refresh() {
    setProjects(mockGetProjects());
  }

  function pushToast(message, type = 'success', timeout = 3500) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout);
  }

  const userId = user?.id ?? null;

  // Create / Update / Delete project & tasks (igual lógica que antes)
  const handleCreateProject = () => {
    setProjError('');
    try {
      const created = mockCreateProject({
        title: projForm.title,
        description: projForm.description,
        startDate: projForm.startDate,
        endDate: projForm.endDate,
      });
      setProjForm({ id: null, title: '', description: '', startDate: '', endDate: '' });
      refresh();
      setExpandedProjectId(created.id);
      pushToast('Proyecto creado correctamente', 'success');
    } catch (err) {
      setProjError(err.message || 'Error creando proyecto');
      pushToast(err.message || 'Error creando proyecto', 'error');
    }
  };

  const handleUpdateProject = () => {
    setProjError('');
    try {
      mockUpdateProject(projForm.id, {
        title: projForm.title,
        description: projForm.description,
        startDate: projForm.startDate,
        endDate: projForm.endDate,
      });
      setProjForm({ id: null, title: '', description: '', startDate: '', endDate: '' });
      refresh();
      pushToast('Proyecto actualizado', 'success');
    } catch (err) {
      setProjError(err.message || 'Error actualizando proyecto');
      pushToast(err.message || 'Error actualizando proyecto', 'error');
    }
  };

  const handleDeleteProject = (id) => {
    if (!confirm('¿Eliminar proyecto? Esta acción es irreversible.')) return;
    try {
      mockDeleteProject(id);
      refresh();
      if (expandedProjectId === id) setExpandedProjectId(null);
      pushToast('Proyecto eliminado', 'success');
    } catch (err) {
      pushToast(err.message || 'Error eliminando proyecto', 'error');
    }
  };

  const openEditProject = (p) => {
    setProjForm({ id: p.id, title: p.title, description: p.description, startDate: p.startDate, endDate: p.endDate });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tasks
  const openNewTaskFor = (projectId) => {
    setTaskError('');
    setTaskForm({ id: null, name: '', description: '', assignedDays: 0, assignedTo: null, status: STATUS_OPTIONS[0], projectId });
    setExpandedProjectId(projectId);
  };

  const openEditTask = (projectId, task) => {
    setTaskError('');
    setTaskForm({
      id: task.id,
      name: task.name,
      description: task.description,
      assignedDays: task.assignedDays,
      assignedTo: task.assignedTo,
      status: task.status || STATUS_OPTIONS[0],
      projectId,
    });
    setExpandedProjectId(projectId);
  };

  const handleSaveTask = () => {
    setTaskError('');
    const { projectId } = taskForm;
    if (!projectId) return setTaskError('Proyecto no seleccionado');
    try {
      if (taskForm.id) {
        mockUpdateTask(projectId, taskForm.id, {
          name: taskForm.name,
          description: taskForm.description,
          assignedDays: Number(taskForm.assignedDays),
          assignedTo: taskForm.assignedTo,
          status: taskForm.status,
        });
        pushToast('Tarea actualizada', 'success');
      } else {
        mockCreateTask(projectId, {
          name: taskForm.name,
          description: taskForm.description,
          assignedDays: Number(taskForm.assignedDays),
          assignedTo: taskForm.assignedTo,
          status: taskForm.status,
        });
        pushToast('Tarea creada', 'success');
      }
      setTaskForm({ id: null, name: '', description: '', assignedDays: 0, assignedTo: null, status: STATUS_OPTIONS[0], projectId: null });
      refresh();
    } catch (err) {
      setTaskError(err.message || 'Error guardando tarea');
      pushToast(err.message || 'Error guardando tarea', 'error');
    }
  };

  const handleDeleteTask = (projectId, taskId) => {
    if (!confirm('¿Eliminar tarea?')) return;
    try {
      mockDeleteTask(projectId, taskId);
      refresh();
      pushToast('Tarea eliminada', 'success');
    } catch (err) {
      pushToast(err.message || 'Error eliminando tarea', 'error');
    }
  };

  if (!loaded) return null;

  const visibleProjects =
    user?.role === 'gerente' ? projects : userId ? projects.filter((p) => (p.tasks || []).some((t) => t.assignedTo === userId)) : [];

  return (
    <div className="min-h-screen p-8">
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {t.message}
          </div>
        ))}
      </div>

      <div className="container-center">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="lead">
              Bienvenido <strong>{user?.name}</strong> — {user?.role}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="btn btn-logout"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              Salir
            </button>
          </div>
        </header>

        {user?.role === 'gerente' && (
          <div className="card project-card mb-6">
            <div className="card-header form-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <h2 className="font-semibold">Crear / Editar proyecto</h2>
                  <div className="lead">Define título, descripción y fechas del proyecto.</div>
                </div>
                <div>
                  {projForm.id ? (
                    <button
                      className="btn btn-open"
                      onClick={() => setProjForm({ id: null, title: '', description: '', startDate: '', endDate: '' })}
                    >
                      Limpiar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="card-body form-wrap">
              {projError && <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3">{projError}</div>}
              <div className="grid" style={{ gap: '0.75rem' }}>
                <input
                  placeholder="Título"
                  className="input"
                  value={projForm.title}
                  onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
                />
                <input
                  placeholder="Descripción"
                  className="input"
                  value={projForm.description}
                  onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
                />
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <label style={{ flex: 1 }}>
                    <div className="text-sm text-[var(--muted)] mb-1">Fecha inicio</div>
                    <input
                      type="date"
                      className="input"
                      value={projForm.startDate}
                      onChange={(e) => setProjForm({ ...projForm, startDate: e.target.value })}
                    />
                  </label>
                  <label style={{ flex: 1 }}>
                    <div className="text-sm text-[var(--muted)] mb-1">Fecha fin</div>
                    <input
                      type="date"
                      className="input"
                      value={projForm.endDate}
                      onChange={(e) => setProjForm({ ...projForm, endDate: e.target.value })}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '.5rem' }}>
                  {projForm.id ? (
                    <button className="btn btn-primary" onClick={handleUpdateProject}>
                      Actualizar proyecto
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleCreateProject}>
                      Crear proyecto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {visibleProjects.length === 0 ? <div className="text-sm text-[var(--muted)]">No hay proyectos visibles.</div> : null}

          {visibleProjects.map((p) => {
            const daysInfo = mockProjectDaysInfo(p);
            const available = daysInfo.available;
            const remaining = daysInfo.remaining;
            const completedDays = (p.tasks || [])
              .filter((t) => String(t.status) === 'Completado')
              .reduce((s, t) => s + Number(t.assignedDays || 0), 0);
            const percent = available > 0 ? Math.round((completedDays / available) * 100) : 0;
            const safePercent = Math.max(0, Math.min(100, percent));

            return (
              <div key={p.id} className="card project-card">
                <div
                  className="card-header form-wrap"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
                >
                  <div style={{ flex: '1 1 0' }}>
                    <div style={{ fontWeight: 700 }}>{p.title}</div>
                    <div className="text-sm text-[var(--muted)]">{p.description}</div>
                    <div className="text-sm text-[var(--muted)] mt-1">
                      {p.startDate} → {p.endDate} · Disponibles: {available}d · Ocupados: {daysInfo.used}d
                    </div>

                    <div style={{ marginTop: 8, width: '100%', background: 'rgba(2,6,23,0.04)', borderRadius: 8, height: 12 }}>
                      <div
                        style={{
                          width: `${safePercent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--primary), var(--primary-600))',
                          borderRadius: 8,
                          transition: 'width .3s ease',
                        }}
                      />
                    </div>
                    <div className="text-sm text-[var(--muted)] mt-1">
                      Progreso: {safePercent}% ({completedDays}d de {available}d)
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                    <button
                      className="btn btn-open"
                      onClick={() => {
                        setExpandedProjectId(expandedProjectId === p.id ? null : p.id);
                      }}
                    >
                      {expandedProjectId === p.id ? 'Cerrar' : 'Abrir'}
                    </button>

                    {user?.role === 'gerente' && (
                      <>
                        <button className="btn btn-edit" onClick={() => openEditProject(p)}>
                          Editar
                        </button>
                        <button className="btn btn-delete" onClick={() => handleDeleteProject(p.id)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {expandedProjectId === p.id && (
                  <div className="card-body form-wrap">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <h4 className="font-semibold">Tareas</h4>
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                        {user?.role === 'gerente' && (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() => openNewTaskFor(p.id)}
                              disabled={remaining <= 0}
                              title={remaining <= 0 ? 'No quedan días disponibles en este proyecto' : 'Crear nueva tarea'}
                            >
                              Nueva tarea
                            </button>
                            {remaining <= 0 && <div className="warn">No quedan días disponibles</div>}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      {(p.tasks || []).length === 0 && <div className="text-sm text-[var(--muted)]">Sin tareas aún.</div>}

                      {(p.tasks || []).map((t) => {
                        const assignedToName = usersList.find((u) => u.id === t.assignedTo)?.name || 'No asignado';
                        let badgeClass = 'badge-new';
                        if (String(t.status) === 'Nuevo') badgeClass = 'badge-new';
                        if (String(t.status) === 'En curso') badgeClass = 'badge-progress';
                        if (String(t.status) === 'Cerrado') badgeClass = 'badge-closed';
                        if (String(t.status) === 'Completado') badgeClass = 'badge-done';

                        const userIsAssignedHere = t.assignedTo === userId;
                        return (
                          <div key={t.id} className="task-card project-item">
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ fontWeight: 700 }}>{t.name}</div>
                                <div className={badgeClass} style={{ fontWeight: 700 }}>
                                  {t.status}
                                </div>
                              </div>
                              <div className="text-sm text-[var(--muted)]">{t.description}</div>
                              <div className="text-sm text-[var(--muted)] mt-1">
                                Días asignados: {t.assignedDays} · Responsable: {assignedToName}
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', minWidth: 160 }}>
                              {user?.role === 'usuario' && userIsAssignedHere && (
                                <select
                                  className="input"
                                  value={t.status}
                                  onChange={(e) => {
                                    mockUpdateTask(p.id, t.id, { status: e.target.value });
                                    refresh();
                                    pushToast('Estado actualizado', 'success');
                                  }}
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {user?.role === 'gerente' && (
                                <>
                                  {/* botones más pequeños en las tareas (btn-sm) para consistencia visual */}
                                  <button className="btn btn-sm btn-edit" onClick={() => openEditTask(p.id, t)}>
                                    Editar
                                  </button>
                                  <button className="btn btn-sm btn-delete" onClick={() => handleDeleteTask(p.id, t.id)}>
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {taskForm.projectId === p.id && (
                      <div className="mt-4">
                        <h5 className="font-semibold">Crear / Editar tarea</h5>
                        {taskError && <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3">{taskError}</div>}
                        <div style={{ display: 'grid', gap: '.5rem', marginTop: '.5rem' }}>
                          <input
                            placeholder="Nombre de la tarea"
                            className="input"
                            value={taskForm.name}
                            onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                          />
                          <textarea
                            placeholder="Descripción"
                            className="input"
                            rows={3}
                            value={taskForm.description}
                            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                          ></textarea>

                          <div style={{ display: 'flex', gap: '.5rem' }}>
                            <input
                              type="number"
                              className="input"
                              min={0}
                              placeholder="Días asignados"
                              value={taskForm.assignedDays}
                              onChange={(e) => setTaskForm({ ...taskForm, assignedDays: Number(e.target.value) })}
                            />
                            <select
                              className="input"
                              value={taskForm.assignedTo ?? ''}
                              onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value ? Number(e.target.value) : null })}
                            >
                              <option value="">-- asignar a --</option>
                              {usersList.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.email})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                            <select
                              className="input"
                              value={taskForm.status}
                              onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>

                            <div style={{ flex: 1, display: 'flex', gap: '.5rem' }}>
                              <button className="btn btn-primary" onClick={handleSaveTask}>
                                {taskForm.id ? 'Actualizar tarea' : 'Crear tarea'}
                              </button>
                              <button
                                className="btn btn-open"
                                onClick={() =>
                                  setTaskForm({
                                    id: null,
                                    name: '',
                                    description: '',
                                    assignedDays: 0,
                                    assignedTo: null,
                                    status: STATUS_OPTIONS[0],
                                    projectId: null,
                                  })
                                }
                              >
                                Cancelar
                              </button>
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
