"use client"; // porque usa localStorage
const KEY_PROJECTS = "mock_projects";

function mockInitIfEmpty() {
  if (!localStorage.getItem(KEY_PROJECTS)) {
    const sample = [
      { id: 1, title: "Proyecto demo", description: "Proyecto inicial", createdAt: Date.now() }
    ];
    localStorage.setItem(KEY_PROJECTS, JSON.stringify(sample));
  }
}

export function mockGetProjects() {
  mockInitIfEmpty();
  return JSON.parse(localStorage.getItem(KEY_PROJECTS) || "[]");
}

export function mockCreateProject(p) {
  const projects = mockGetProjects();
  const newP = { id: Date.now(), ...p, createdAt: Date.now() };
  projects.push(newP);
  localStorage.setItem(KEY_PROJECTS, JSON.stringify(projects));
  return newP;
}

export function mockUpdateProject(id, data) {
  const projects = mockGetProjects().map(p => p.id === id ? { ...p, ...data } : p);
  localStorage.setItem(KEY_PROJECTS, JSON.stringify(projects));
  return projects.find(p => p.id === id);
}

export function mockDeleteProject(id) {
  const projects = mockGetProjects().filter(p => p.id !== id);
  localStorage.setItem(KEY_PROJECTS, JSON.stringify(projects));
  return true;
}
