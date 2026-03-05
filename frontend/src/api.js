const API_BASE = '/api';

// Auth
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  return res.json();
}

export async function register(username, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }
  return res.json();
}

// Spaces
export async function getSpaces(userId) {
  const res = await fetch(`${API_BASE}/spaces?userId=${userId}`);
  return res.json();
}

export async function createSpace(userId, name) {
  const res = await fetch(`${API_BASE}/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name })
  });
  return res.json();
}

export async function updateSpace(id, name) {
  const res = await fetch(`${API_BASE}/spaces/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return res.json();
}

export async function deleteSpace(id) {
  await fetch(`${API_BASE}/spaces/${id}`, {
    method: 'DELETE'
  });
}

export async function updateSpaceSortOrder(spaceOrders) {
  const res = await fetch(`${API_BASE}/spaces/sort`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spaceOrders })
  });
  return res.json();
}

// Projects
export async function getProjects(spaceId) {
  const res = await fetch(`${API_BASE}/projects/space/${spaceId}`);
  return res.json();
}

export async function createProject(spaceId, project) {
  const res = await fetch(`${API_BASE}/projects/space/${spaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  });
  return res.json();
}

export async function updateProject(id, project) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  });
  return res.json();
}

export async function deleteProject(id) {
  await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE'
  });
}

export async function updateProjectSortOrder(projectOrders) {
  const res = await fetch(`${API_BASE}/projects/sort`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectOrders })
  });
  return res.json();
}

// Tasks
export async function getTasks(projectId) {
  const res = await fetch(`${API_BASE}/tasks/project/${projectId}`);
  return res.json();
}

export async function createTask(projectId, task) {
  const res = await fetch(`${API_BASE}/tasks/project/${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  return res.json();
}

export async function updateTask(id, task) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  return res.json();
}

export async function deleteTask(id) {
  await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE'
  });
}
