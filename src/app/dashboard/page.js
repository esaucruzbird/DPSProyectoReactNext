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
  //declaración del estado del modal que controla si hay un modal abierto y cuál proyecto muestra
  const [modalProject, setModalProject] = useState(null);

  const [projForm, setProjForm] = useState({ id: null, title: '', description: '', startDate: '', endDate: '' });
  const [projError, setProjError] = useState('');

  const [taskForm, setTaskForm] = useState({
    id: null,
    name: '',
    description: '',
    assignedDays: 1,
    assignedTo: null,
    status: STATUS_OPTIONS[0],
    projectId: null,
  });
  const [taskError, setTaskError] = useState('');

  const [usersList, setUsersList] = useState([]);
  const [toasts, setToasts] = useState([]);

  //Define un efecto que se ejecuta cuando cambia la dependencia loaded. useEffect corre después del render
  useEffect(() => {
    //comprueba si la autenticación/carga de datos no está lista (loaded viene de useRequireAuth())si aún no está lista, sale del efecto sin hacer nada. Evita leer datos antes de que el contexto de auth esté preparado
    if (!loaded) return;
    //llama a la función mockGetProjects() (API mock local) y actualiza el estado projects con el arreglo devuelto. Esto carga la lista de proyectos en memoria del componente
    setProjects(mockGetProjects());
    //llama a mockListUsers() y guarda el resultado en usersList (lista de usuarios para selects y asignaciones)
    setUsersList(mockListUsers());
  }, [loaded]);

  function refresh() {
    //recupera la lista actualizada de proyectos y la guarda en projects, para después de crear o editar o eliminar
    setProjects(mockGetProjects());
    //comprueba si actualmente hay un modal abierto, en ese caso hay que actualizar también el objeto modalProject por si el proyecto abrió el modal y este fue modificado
    if (modalProject) {
      //vuelve a obtener la lista de proyectos y busca el proyecto con la misma id que el modal actual. Si no existe (porque fue eliminado), updated será null
      const updated = mockGetProjects().find((p) => p.id === modalProject.id) || null;
      //actualiza el estado modalProject con el proyecto actualizado (o null si ya no existe). Esto mantiene sincronizada la vista del modal con los datos actuales
      setModalProject(updated);
    }
  }

  //declara la función que crea un toast (mensaje temporal). Recibe lo que trae message, type (por defecto 'success') y timeout en ms (3500 ms por defecto)
  function pushToast(message, type = 'success', timeout = 3500) {
    //genera un identificador único (suficientemente único para este uso) combinado de timestamp con número aleatorio para poder identificar y eliminar ese toast después
    const id = Date.now() + Math.random();
    //actualiza el estado toasts añadiendo el nuevo toast al array
    setToasts((t) => [...t, { id, message, type }]);
    //programa la eliminación automática del toast tras timeout milisegundos, filtra el array toasts y elimina el que tenga el id generado
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout);
  }

  //=operador de encadenamiento opcional: intenta acceder a user.id sin lanzar error si user es undefined o null, si user no existe, user?.id resulta undefined. Por tanto, se agrega ?? null operador nulo: si user?.id es undefined o null, asigna null. Es decir, asegura que userId sea un valor definido (número o null) en lugar de "undefined"
  const userId = user?.id ?? null;

  // PROJECT CRUD
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
      setModalProject(created);
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
      if (modalProject && modalProject.id === id) setModalProject(null);
      pushToast('Proyecto eliminado', 'success');
    } catch (err) {
      pushToast(err.message || 'Error eliminando proyecto', 'error');
    }
  };

  const openEditProject = (p) => {
    setProjForm({ id: p.id, title: p.title, description: p.description, startDate: p.startDate, endDate: p.endDate });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // TASKS CRUD
  //abre el modal y prepara taskForm para creación
  const openNewTaskFor = (projectId) => {
    setTaskError('');
    setTaskForm({ id: null, name: '', description: '', assignedDays: 1, assignedTo: null, status: STATUS_OPTIONS[0], projectId });
    const p = projects.find((x) => x.id === projectId);
    if (p) setModalProject(p);
  };

  ////abre el modal y prepara taskForm para modificación
  const openEditTask = (projectId, task) => {
    setTaskError('');
    setTaskForm({
      id: task.id,
      name: task.name,
      description: task.description,
      assignedDays: task.assignedDays ?? 1,
      assignedTo: task.assignedTo,
      status: task.status || STATUS_OPTIONS[0],
      projectId,
    });
    const p = projects.find((x) => x.id === projectId);
    if (p) setModalProject(p);
  };

  const handleSaveTask = () => {
    setTaskError('');
    const { projectId } = taskForm;
    if (!projectId) return setTaskError('Proyecto no seleccionado');

    const days = Number(taskForm.assignedDays || 0);
    if (!Number.isFinite(days) || days < 1) {
      setTaskError('La tarea debe tener al menos 1 día asignado.');
      pushToast('La tarea debe tener al menos 1 día asignado.', 'error');
      return;
    }

    try {
      if (taskForm.id) {
        mockUpdateTask(projectId, taskForm.id, {
          name: taskForm.name,
          description: taskForm.description,
          assignedDays: days,
          assignedTo: taskForm.assignedTo,
          status: taskForm.status,
        });
        pushToast('Tarea actualizada', 'success');
      } else {
        mockCreateTask(projectId, {
          name: taskForm.name,
          description: taskForm.description,
          assignedDays: days,
          assignedTo: taskForm.assignedTo,
          status: taskForm.status,
        });
        pushToast('Tarea creada', 'success');
      }
      setTaskForm({ id: null, name: '', description: '', assignedDays: 1, assignedTo: null, status: STATUS_OPTIONS[0], projectId: null });
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

  // Modal helpers
  //función para abrir modal
  const openModal = (project) => {
    setModalProject(project);
  };
  //función para cerrar modal
  const closeModal = () => {
    setModalProject(null);
    //reseteando los campos del formulario para las tareas
    setTaskForm({ id: null, name: '', description: '', assignedDays: 1, assignedTo: null, status: STATUS_OPTIONS[0], projectId: null });
  };

  // block body scroll while modal open, Esc to close
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') closeModal();
    }
    if (modalProject) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [modalProject]);

  if (!loaded) return null;

  //si no se cumple lo de ser rol gerente solo verá proyectos que le correspondan, se filtra por id
  const visibleProjects =
    user?.role === 'gerente' ? projects : userId ? projects.filter((p) => (p.tasks || []).some((t) => t.assignedTo === userId)) : [];

  return (
    <div className="min-h-screen p-8">
      {/* TOASTS */}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            <div>{t.message}</div>
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
                router.push('/');
              }}
            >
              Salir
            </button>
          </div>
        </header>

        {/* Project create o edit (gerente)
        este bloque para crear o editar proyecto solo aparece si role === 'gerente'*/}
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
                      Cancelar edición
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

        {/* Projects list */}
        <div className="space-y-4">
          {visibleProjects.length === 0 ? <div className="text-sm text-[var(--muted)]">No hay proyectos visibles.</div> : null}

          {/*Se obtiene available por mockProjectDaysInfo, se suma assignedDays de tareas con status === 'Completado', se calcula porcentaje y se aplica al ancho style.width */}
          {visibleProjects.map((p) => {
            const daysInfo = mockProjectDaysInfo(p);
            const available = daysInfo.available;
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
                      {p.startDate} → {p.endDate} · Disponibles: {daysInfo.available}d · Ocupados: {daysInfo.used}d
                    </div>

                    <div
                      style={{ marginTop: 8, width: '100%', background: 'rgba(2,6,23,0.06)', borderRadius: 8, height: 12 }}
                      className="progress-track"
                    >
                      
                      <div
                        style={{
                          width: `${safePercent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--blue-600), var(--blue-700))',
                          borderRadius: 8,
                          transition: 'width .3s ease',
                        }}
                      />
                    </div>
                    <div className="text-sm text-[var(--muted)] mt-1">
                      Progreso: {safePercent}% ({completedDays}d de {daysInfo.available}d)
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                    {/*botón para abrir el modal en la lista de proyectos*/}
                    <button className="btn btn-open" onClick={() => openModal(p)}>
                      Abrir
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
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: project y tasks
      modal se muestra solo cuando modalProject no es null*/}
      {modalProject && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target.classList.contains('modal-overlay')) closeModal();
          }}
        >
          <div className="modal-content modal" role="dialog" aria-modal="true" aria-label={`Proyecto ${modalProject.title}`}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontWeight: 800 }}>{modalProject.title}</h3>
                <div className="text-sm text-[var(--muted)]">{modalProject.description}</div>
              </div>

              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <button className="modal-close" aria-label="Cerrar modal" onClick={() => closeModal()}>
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-body">
              {/* header info + "Nueva tarea" */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 0' }}>
                  <div className="text-sm text-[var(--muted)]">
                    {modalProject.startDate} → {modalProject.endDate}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    Disponibles: {mockProjectDaysInfo(modalProject).available}d · Ocupados: {mockProjectDaysInfo(modalProject).used}d
                  </div>

                  <div
                    style={{ marginTop: 8, width: '100%', background: 'rgba(2,6,23,0.06)', borderRadius: 8, height: 14 }}
                    className="progress-track"
                  >
                    {/*Se obtiene available por mockProjectDaysInfo, se suma assignedDays de tareas con status === 'Completado', se calcula porcentaje y se aplica al ancho style.width */}
                    <div
                      style={{
                        width: `${
                          mockProjectDaysInfo(modalProject).available > 0
                            ? Math.round(
                                ((modalProject.tasks || [])
                                  .filter((t) => String(t.status) === 'Completado')
                                  .reduce((s, t) => s + Number(t.assignedDays || 0), 0) /
                                  mockProjectDaysInfo(modalProject).available) *
                                  100
                              )
                            : 0
                        }%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--blue-600), var(--blue-700))',
                        borderRadius: 8,
                        transition: 'width .3s ease',
                      }}
                    />
                  </div>
                </div>

                <div style={{ minWidth: 160, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '.5rem' }}>
                  {user?.role === 'gerente' && (
                    <button
                      className="btn btn-primary btn-fixed"
                      onClick={() => openNewTaskFor(modalProject.id)}
                      disabled={mockProjectDaysInfo(modalProject).remaining <= 0}
                    >
                      Nueva tarea
                    </button>
                  )}
                </div>
              </div>

              {/* ---------- CREATE FORM (aparece en la cabecera si estamos en modo creación) ---------- */}
              {taskForm.projectId === modalProject.id && taskForm.id === null && (
                <div style={{ marginTop: 12 }} className="card task-card">
                  <div className="card-body">
                    <h4 style={{ margin: 0, fontWeight: 700 }}>Crear tarea</h4>
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
                          min={1}
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
                            Crear tarea
                          </button>
                          <button
                            className="btn btn-open"
                            onClick={() =>
                              setTaskForm({
                                id: null,
                                name: '',
                                description: '',
                                assignedDays: 1,
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
                </div>
              )}

              {/* ---------- TASK LIST: cada tarea puede mostrar su propio formulario inline si está en modo edición ---------- */}
              <div className="modal-tasks" style={{ marginTop: 12 }}>
                {(modalProject.tasks || []).length === 0 && <div className="text-sm text-[var(--muted)]">Sin tareas aún.</div>}

                {(modalProject.tasks || []).map((t) => {
                  const assignedToName = usersList.find((u) => u.id === t.assignedTo)?.name || 'No asignado';
                  let badgeClass = 'badge-new';
                  if (String(t.status) === 'Nuevo') badgeClass = 'badge-new';
                  if (String(t.status) === 'En curso') badgeClass = 'badge-progress';
                  if (String(t.status) === 'Cerrado') badgeClass = 'badge-closed';
                  if (String(t.status) === 'Completado') badgeClass = 'badge-done';

                  //ayuda para cuales tareas si deben mostrarse a X usuarios en funcion de su id
                  const userIsAssignedHere = t.assignedTo === userId;
                  const isEditingThis = taskForm.id === t.id;

                  return (
                    <div key={t.id} className="task-card project-item">
                      {/* Si estamos editando exactamente esta tarea, mostramos el formulario inline en lugar de la vista normal */}
                      {isEditingThis ? (
                        <div style={{ width: '100%' }}>
                          <h4 style={{ marginTop: 0, marginBottom: 8, fontWeight: 700 }}>Editar tarea</h4>
                          {taskError && <div className="text-sm text-red-700 bg-red-50 p-2 rounded mb-3">{taskError}</div>}

                          <div style={{ display: 'grid', gap: '.5rem' }}>
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
                                min={1}
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
                                  Actualizar tarea
                                </button>
                                <button
                                  className="btn btn-open"
                                  onClick={() =>
                                    setTaskForm({
                                      id: null,
                                      name: '',
                                      description: '',
                                      assignedDays: 1,
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
                      ) : (
                        <>
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

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-end', minWidth: 120 }}>
                            {/*si user.role === 'usuario' y está asignado, se le muestra un <select> para cambiar estado (solo donde salga el por funcion)*/}
                            {user?.role === 'usuario' && userIsAssignedHere && (
                              <select
                                className="input"
                                value={t.status}
                                onChange={(e) => {
                                  mockUpdateTask(modalProject.id, t.id, { status: e.target.value });
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
                                <button className="btn btn-sm btn-edit btn-fixed" onClick={() => openEditTask(modalProject.id, t)}>
                                  Editar
                                </button>
                                <button className="btn btn-sm btn-delete btn-fixed" onClick={() => handleDeleteTask(modalProject.id, t.id)}>
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* (Ya no hay formulario global al final; creación/edición está arriba o inline) */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
