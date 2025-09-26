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

//claves usadas en localStorage
const KEY_PROJECTS = "mock_projects_v2";
const KEY_USERS = "users"; // lista de usuarios guardada por AuthContext

//helpers

const msPerDay = 1000 * 60 * 60 * 24; //milisegundos en un día

//devuelve la fecha actual en formato "YYYY-MM-DD"
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

//convierte "YYYY-MM-DD" a Date (UTC midnight)
function parseISO(dateStr) {
  //retorna null si dateStr es falsy
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  //se usa Date.UTC para evitar problemas con timezones locales al comparar días
  return new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
}

//retorna días inclusivos entre start y end (si end < start entonces 0)
export function daysBetweenInclusive(startISO, endISO) {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  if (!s || !e) return 0;
  const diff = Math.floor((e - s) / msPerDay);
  return diff >= 0 ? diff + 1 : 0;
}

//lectura directa de los proyectos desde localStorage
function getProjectsRaw() {
  try {
    //si JSON inválido o falla, devuelve array vacío
    return JSON.parse(localStorage.getItem(KEY_PROJECTS) || "[]");
  } catch (e) {
    return [];
  }
}

//guarda array de proyectos en localStorage (serializa a JSON)
function saveProjectsRaw(arr) {
  localStorage.setItem(KEY_PROJECTS, JSON.stringify(arr));
}

//lectura directa de usuarios (guardados por AuthContext)
function getUsersRaw() {
  try {
    //si JSON inválido o falla, devuelve array vacío
    return JSON.parse(localStorage.getItem(KEY_USERS) || "[]");
  } catch (e) {
    return [];
  }
}

//inicializa si vacio
//si no existen proyectos, crea un ejemplo y lo guarda
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
        tasks: [ //se crea una tarea de ejemplo en el proyecto de prueba
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

//API principal
//retorna todos los proyectos (asegura inicializar si está vacío)
export function mockGetProjects() {
  initIfEmpty();
  return getProjectsRaw();
}

//retorna un proyecto por id, o un null si no existe
export function mockGetProject(id) {
  const projects = mockGetProjects();
  return projects.find((p) => p.id === id) || null;
}

//crea un nuevo proyecto
export function mockCreateProject({ title, description, startDate, endDate }) {
  if (!title || !startDate || !endDate) {
    //valida campos obligatorios
    throw new Error("Faltan campos obligatorios (title, startDate, endDate).");
  }
  if (daysBetweenInclusive(startDate, endDate) <= 0) {
    //valida que endDate >= startDate (usando daysBetweenInclusive)
    throw new Error("La fecha de fin debe ser igual o posterior a la fecha de inicio.");
  }

  const projects = mockGetProjects();
  const newP = {
    id: Date.now(), //id simple basado en timestamp (temporal, prueba)
    title,
    description: description || "",
    startDate,
    endDate,
    tasks: [],
    createdAt: Date.now(),
  };
  //inserta al inicio (más reciente primero) del array y guarda
  projects.unshift(newP);
  saveProjectsRaw(projects);
  return newP;
}

//actualiza proyecto por id con los campos de `data`
export function mockUpdateProject(id, data) {
  const projects = mockGetProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Proyecto no encontrado");

  //si cambian fechas, validar que los días disponibles no sean menores a los ya asignados a tareas (newAvailableDays >= usedDays)
  //recupera el proyecto existente por índice (idx). p es el objeto actual antes de aplicar cambios
  const p = projects[idx];
  /*usa el operador nullish coalescing ?? para decidir las fechas objetivo
  si data.startDate (o data.endDate) está definido (no null/undefined), se usa ese valor nuevo.
  si no, se mantiene la fecha actual del proyecto*/
  const newStart = data.startDate ?? p.startDate;
  const newEnd = data.endDate ?? p.endDate;
  //calcula días disponibles entre newStart y newEnd usando la función que devuelve días incluidos (si start=end, devuelve 1)
  const available = daysBetweenInclusive(newStart, newEnd);
  //suma todos los assignedDays ya asignados a las tareas del proyecto actual
  //Number(... || 0) fuerza a número, cubre undefined/null/cadenas vacías y evita NaN si es falsy
  const used = (p.tasks || []).reduce((s, t) => s + Number(t.assignedDays || 0), 0);
  //si las nuevas fechas no contienen suficientes días para cubrir las tareas ya existentes, aborta con error explicativo
  if (available < used) {
    throw new Error(`Las nuevas fechas no permiten los ${used} días ya asignados a tareas. Disponibles: ${available}`);
  }
  //mezcla (shallow merge) el objeto antiguo p con data y lo vuelve a colocar en el array en la misma posición. Esto permite actualizar sólo las propiedades incluidas en data
  projects[idx] = { ...p, ...data };
  //persiste (sobrescribe) el array completo en localStorage
  saveProjectsRaw(projects);
  //devuelve el proyecto actualizado
  return projects[idx];
}

//elimina un proyecto por id (guarda el array filtrado)
export function mockDeleteProject(id) {
  const projects = mockGetProjects();
  const filtered = projects.filter((p) => p.id !== id);
  saveProjectsRaw(filtered);
  return true;
}

//tasks

//retorna availableDays y usedDays para el proyecto
export function mockProjectDaysInfo(project) {
  //días totales del proyecto (días disponibles entre inicio y final de la tarea)
  const available = daysBetweenInclusive(project.startDate, project.endDate);
  //suma de assignedDays de todas las tareas (numérico)
  const used = (project.tasks || []).reduce((s, t) => s + Number(t.assignedDays || 0), 0);
  //remaining: disponible - usado, pero no menor que 0 (se garantiza que sea >= 0)
  return { available, used, remaining: Math.max(0, available - used) };
}

//validación para poder asignar `assignedDays` a tareas del proyecto
function validateTaskAssignment(project, assignedDays, skipTaskId = null) {
  //calcula días disponibles del proyecto (respecto al inicio y final del proyecto)
  const available = daysBetweenInclusive(project.startDate, project.endDate);
  //acumulador de días ya usados por tareas (excluyendo la tarea en edición si corresponde)
  let used = 0;
  //recorre las tareas (project.tasks puede ser undefined -por tanto se usa || [])
  (project.tasks || []).forEach((t) => {
    //skipTaskId: si se está actualizando una tarea existente, se excluye esa tarea del cálculo (para evitar doble conteo)
    //usamos esa condición original, esto asume que skipTaskId nunca será 0 o un valor "falsy" válido para IDs.
    if (skipTaskId && t.id === skipTaskId) return; //ignora la tarea actual si corresponde
    //se suman los assignedDays de la tarea actual. Si no existe, usamos 0
    //se usa Number() para forzar conversión
    used += Number(t.assignedDays || 0);
  });
  //validación mínima: assignedDays no puede ser negativo
  if (assignedDays < 0) throw new Error("assignedDays debe ser positivo");
  //comprobamos que la suma de días usados con assignedDays no exceda los días disponibles
  //si excede, lanzamos un error con el detalle de días disponibles
  if (used + Number(assignedDays) > available) {
    throw new Error(`No hay días suficientes. Disponibles: ${available - used}, se intentó asignar: ${assignedDays}`);
  }
  //si se llega hasta aquí, la asignación fue válida
}

//crea una tarea dentro de un proyecto
export function mockCreateTask(projectId, { name, description, status = "pendiente", assignedDays = 0, assignedTo = null }) {
  //validación, la tarea debe tener nombre
  if (!name) throw new Error("El nombre de la tarea es obligatorio");
  //trae todos los proyectos (inicializa si están vacíos)
  const projects = mockGetProjects();
  //se busca el índice del proyecto destino
  const pIdx = projects.findIndex((p) => p.id === projectId);
  if (pIdx === -1) throw new Error("Proyecto no encontrado");//error claro si no existe el proyecto

  //referencia al proyecto encontrado
  const project = projects[pIdx];
  //validar fechas disponibles, valida que haya días disponibles en el proyecto antes de crear la tarea validateTaskAssignment lanza error si no es posible asignar los días. Se convierte assignedDays a Number para la validación
  validateTaskAssignment(project, Number(assignedDays));

  //construcción del objeto tarea
  const task = {
    id: Date.now(),//id simple basado en timestamp (aceptable al ser un demo)
    name,
    description: description || "",
    status,
    assignedDays: Number(assignedDays || 0),//garantizamos número
    assignedTo: assignedTo || null,
    createdAt: Date.now(),
  };

  //aseguramos que project.tasks exista (array)
  project.tasks = project.tasks || [];
  //se añade la nueva tarea
  project.tasks.push(task);
  //se persiste el cambio en el array de proyectos y en localStorage
  projects[pIdx] = project;
  saveProjectsRaw(projects);
  //se devuelve la tarea creada para que la UI la use inmediatamente
  return task;
}

//actualiza una tarea existente
export function mockUpdateTask(projectId, taskId, data) {
  //leemos proyectos y localizamos el índice del proyecto
  const projects = mockGetProjects();
  const pIdx = projects.findIndex((p) => p.id === projectId);
  if (pIdx === -1) throw new Error("Proyecto no encontrado");

  const project = projects[pIdx];
  //localizamos la tarea dentro del proyecto
  const tIdx = (project.tasks || []).findIndex((t) => t.id === taskId);
  if (tIdx === -1) throw new Error("Tarea no encontrada");

  //si actualizan assignedDays, validar permitiendo excluir la tarea actual
  //si el update incluye assignedDays, validar la reasignación
  //OJO: pasamos taskId como skipTaskId para excluir la tarea actual del proyecto,
  //así permitimos reasignar días sin que se duplique el conteo
  if (data.assignedDays !== undefined) {
    //convertimos a Number para la validación, validateTaskAssignment se encargará
    //de lanzar error si la nueva asignación no cabe
    validateTaskAssignment(project, Number(data.assignedDays), taskId);
  }

  //se hace merge de la tarea existente con los datos nuevos
  //esto permite actualizar solo los campos que vienen en `data`
  project.tasks[tIdx] = { ...project.tasks[tIdx], ...data };
  //guardamos el proyecto actualizado en la lista
  projects[pIdx] = project;
  //se persiste en el localStorage
  saveProjectsRaw(projects);
  //devolvemos la tarea actualizada
  return project.tasks[tIdx];
}

//elimina una tarea de un proyecto
export function mockDeleteTask(projectId, taskId) {
  //lectura de proyectos
  const projects = mockGetProjects();
  //búsqueda del proyecto objetivo
  const pIdx = projects.findIndex((p) => p.id === projectId);
  //validación de lo que sucede si no se encuntra el proyecto
  if (pIdx === -1) throw new Error("Proyecto no encontrado");

  //filtramos la lista de tareas para eliminar la tarea con taskId
  const project = projects[pIdx];
  //si la tarea no existía, la operación queda vacía
  project.tasks = (project.tasks || []).filter((t) => t.id !== taskId);
  //persistencia de los cambios
  projects[pIdx] = project;
  saveProjectsRaw(projects);
  //retornamos true para indicar éxito, también se podría devolver el proyecto actualizado
  return true;
}

//usuarios utilidad (para asignar tareas desde UI)
//retorna solo usuarios con role === 'usuario'
export function mockListUsers() {
  //lee users guardados por el AuthContext
  const u = getUsersRaw();
  //filtra solo role 'usuario' y map a id, name, email
  return (u || [])
    .filter((x) => x.role === "usuario")
    .map((x) => ({ id: x.id, name: x.name, email: x.email }));

  // map a id, name, email
  //return (u || []).map((x) => ({ id: x.id, name: x.name, email: x.email }));
}
