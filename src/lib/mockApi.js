"use client";

/**
 * Estructura:
 * Project {
 *   id,
 *   title,
 *   description,
 *   startDate: "YYYY-MM-DD",
 *   endDate: "YYYY-MM-DD",
 *   tasks: [ Task ],
 *   createdAt
 * }
 *
 * Task {
 *   id,
 *   name,
 *   description,
 *   status, // "pendiente" | "en_progreso" | "completada"
 *   assignedDays, // entero
 *   assignedTo, // user id
 *   createdAt
 * }
 *
 * Validaciones:
 * - availableDays = daysBetween(startDate, endDate) (inclusive)
 * - sum(tasks.assignedDays) <= availableDays
 */

const KEY_PROJECTS = "mock_projects_v2";
const KEY_USERS = "users"; // lista de usuarios guardada por AuthContext

// Helpers -------------------------------------------------------------------

const msPerDay = 1000 * 60 * 60 * 24;

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** Convierte "YYYY-MM-DD" a Date (UTC midnight) */
function parseISO(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  return new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
}

/** Retorna días inclusivos entre start y end (si end < start => 0) */
export function daysBetweenInclusive(startISO, endISO) {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  if (!s || !e) return 0;
  const diff = Math.floor((e - s) / msPerDay);
  return diff >= 0 ? diff + 1 : 0;
}

function getProjectsRaw() {
  try {
    return JSON.parse(localStorage.getItem(KEY_PROJECTS) || "[]");
  } catch (e) {
    return [];
  }
}
function saveProjectsRaw(arr) {
  localStorage.setItem(KEY_PROJECTS, JSON.stringify(arr));
}

function getUsersRaw() {
  try {
    return JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
  } catch (e) {
    return [];
  }
}

// Inicializa si vacio -------------------------------------------------------
function initIfEmpty() {
  const p = getProjectsRaw();
  if (p.length === 0) {
    const sample = [
      {
        id: 1,
        title: "Proyecto demo ampliado",
        description: "Proyecto ejemplo con fechas y tareas",
        startDate: todayISO(),
        endDate: (function () {
          const d = new Date();
          d.setDate(d.getDate() + 14);
          return d.toISOString().slice(0, 10);
        })(),
        tasks: [
          {
            id: 11,
            name: "Tarea piloto",
            description: "Tarea de ejemplo",
            status: "pendiente",
            assignedDays: 2,
            assignedTo: null,
            createdAt: Date.now(),
          },
        ],
        createdAt: Date.now(),
      },
    ];
    saveProjectsRaw(sample);
  }
}

// API principal --------------------------------------------------------------
export function mockGetProjects() {
  initIfEmpty();
  return getProjectsRaw();
}

export function mockGetProject(id) {
  const projects = mockGetProjects();
  return projects.find((p) => p.id === id) || null;
}

export function mockCreateProject({ title, description, startDate, endDate }) {
  if (!title || !startDate || !endDate) {
    throw new Error("Faltan campos obligatorios (title, startDate, endDate).");
  }
  if (daysBetweenInclusive(startDate, endDate) <= 0) {
    throw new Error("La fecha de fin debe ser igual o posterior a la fecha de inicio.");
  }

  const projects = mockGetProjects();
  const newP = {
    id: Date.now(),
    title,
    description: description || "",
    startDate,
    endDate,
    tasks: [],
    createdAt: Date.now(),
  };
  projects.unshift(newP);
  saveProjectsRaw(projects);
  return newP;
}

export function mockUpdateProject(id, data) {
  const projects = mockGetProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Proyecto no encontrado");

  // si cambian fechas, validar que newAvailableDays >= usedDays
  const p = projects[idx];
  const newStart = data.startDate ?? p.startDate;
  const newEnd = data.endDate ?? p.endDate;
  const available = daysBetweenInclusive(newStart, newEnd);
  const used = (p.tasks || []).reduce((s, t) => s + Number(t.assignedDays || 0), 0);
  if (available < used) {
    throw new Error(`Las nuevas fechas no permiten los ${used} días ya asignados a tareas. Disponibles: ${available}`);
  }

  projects[idx] = { ...p, ...data };
  saveProjectsRaw(projects);
  return projects[idx];
}

export function mockDeleteProject(id) {
  const projects = mockGetProjects();
  const filtered = projects.filter((p) => p.id !== id);
  saveProjectsRaw(filtered);
  return true;
}

// Tasks ---------------------------------------------------------------------

/** Retorna availableDays y usedDays para un proyecto */
export function mockProjectDaysInfo(project) {
  const available = daysBetweenInclusive(project.startDate, project.endDate);
  const used = (project.tasks || []).reduce((s, t) => s + Number(t.assignedDays || 0), 0);
  return { available, used, remaining: Math.max(0, available - used) };
}

/** Validación para poder asignar `assignedDays` en un proyecto */
function validateTaskAssignment(project, assignedDays, skipTaskId = null) {
  const available = daysBetweenInclusive(project.startDate, project.endDate);
  let used = 0;
  (project.tasks || []).forEach((t) => {
    if (skipTaskId && t.id === skipTaskId) return;
    used += Number(t.assignedDays || 0);
  });
  if (assignedDays < 0) throw new Error("assignedDays debe ser positivo");
  if (used + Number(assignedDays) > available) {
    throw new Error(`No hay días suficientes. Disponibles: ${available - used}, se intentó asignar: ${assignedDays}`);
  }
}

// create task
export function mockCreateTask(projectId, { name, description, status = "pendiente", assignedDays = 0, assignedTo = null }) {
  if (!name) throw new Error("El nombre de la tarea es obligatorio");
  const projects = mockGetProjects();
  const pIdx = projects.findIndex((p) => p.id === projectId);
  if (pIdx === -1) throw new Error("Proyecto no encontrado");

  const project = projects[pIdx];
  // validar fechas disponibles
  validateTaskAssignment(project, Number(assignedDays));

  const task = {
    id: Date.now(),
    name,
    description: description || "",
    status,
    assignedDays: Number(assignedDays || 0),
    assignedTo: assignedTo || null,
    createdAt: Date.now(),
  };

  project.tasks = project.tasks || [];
  project.tasks.push(task);
  projects[pIdx] = project;
  saveProjectsRaw(projects);
  return task;
}

// update task
export function mockUpdateTask(projectId, taskId, data) {
  const projects = mockGetProjects();
  const pIdx = projects.findIndex((p) => p.id === projectId);
  if (pIdx === -1) throw new Error("Proyecto no encontrado");

  const project = projects[pIdx];
  const tIdx = (project.tasks || []).findIndex((t) => t.id === taskId);
  if (tIdx === -1) throw new Error("Tarea no encontrada");

  // si actualizan assignedDays, validate with skipTaskId to exclude current task
  if (data.assignedDays !== undefined) {
    validateTaskAssignment(project, Number(data.assignedDays), taskId);
  }

  project.tasks[tIdx] = { ...project.tasks[tIdx], ...data };
  projects[pIdx] = project;
  saveProjectsRaw(projects);
  return project.tasks[tIdx];
}

export function mockDeleteTask(projectId, taskId) {
  const projects = mockGetProjects();
  const pIdx = projects.findIndex((p) => p.id === projectId);
  if (pIdx === -1) throw new Error("Proyecto no encontrado");

  const project = projects[pIdx];
  project.tasks = (project.tasks || []).filter((t) => t.id !== taskId);
  projects[pIdx] = project;
  saveProjectsRaw(projects);
  return true;
}

// Usuarios utilidad (para asignar tareas desde UI)
// retorna solo usuarios con role === 'usuario'
export function mockListUsers() {
  // lee users guardados por el AuthContext
  const u = getUsersRaw();
  // filtra solo role 'usuario' y map a id, name, email
  return (u || [])
    .filter((x) => x.role === "usuario")
    .map((x) => ({ id: x.id, name: x.name, email: x.email }));

  // map a id, name, email
  //return (u || []).map((x) => ({ id: x.id, name: x.name, email: x.email }));
}
