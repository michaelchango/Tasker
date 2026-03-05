import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { translations } from './i18n';
import * as api from './api';
import './App.css';

// Auth Context
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const userData = await api.login(username, password);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const register = async (username, password) => {
    const userData = await api.register(username, password);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

// Theme Context
const ThemeContext = createContext(null);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  return useContext(ThemeContext);
}

// Language Context
const LangContext = createContext(null);

function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'zh';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

function useLang() {
  return useContext(LangContext);
}

// Login/Register Component
function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { lang, toggleLang } = useLang();
  const t = translations[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    try {
      if (isLogin) {
        await onLogin(username, password);
      } else {
        await api.register(username, password);
        await onLogin(username, password);
      }
    } catch (err) {
      // Translate error messages based on current language
      let errorMessage = err.message;
      if (errorMessage === 'Username already exists') {
        errorMessage = t.usernameExists;
      } else if (errorMessage === 'Invalid credentials') {
        errorMessage = t.invalidCredentials;
      } else if (errorMessage === 'Failed to create user') {
        errorMessage = t.failedToCreateUser;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t.appName}</h1>
          <button className="lang-btn" onClick={toggleLang}>{t.language}</button>
        </div>
        <h2>{isLogin ? t.login : t.register}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.username}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {!isLogin && (
            <div className="form-group">
              <label>{t.confirmPassword}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn-primary">
            {isLogin ? t.loginBtn : t.registerBtn}
          </button>
        </form>
        <p className="auth-switch">
          {isLogin ? t.noAccount : t.hasAccount}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setUsername(''); setPassword(''); setConfirmPassword(''); }}>
            {isLogin ? t.register : t.login}
          </button>
        </p>
      </div>
    </div>
  );
}

// Main Layout
function MainLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLang();
  const t = translations[lang];

  const [spaces, setSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [draggedSpace, setDraggedSpace] = useState(null);
  const [dragOverSpaceIndex, setDragOverSpaceIndex] = useState(null);
  const [previewSpaces, setPreviewSpaces] = useState([]);
  const draggedSpaceOriginalIndex = useRef(null);
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProjectIndex, setDragOverProjectIndex] = useState(null);
  const [previewProjects, setPreviewProjects] = useState([]);
  const draggedProjectOriginalIndex = useRef(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Modals
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formProjectType, setFormProjectType] = useState('general');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);

  // Load saved state
  const [savedSelectedSpaceId, setSavedSelectedSpaceId] = useState(() => {
    const saved = localStorage.getItem('selectedSpaceId');
    return saved ? parseInt(saved, 10) : null;
  });

  const [savedSelectedProjectId, setSavedSelectedProjectId] = useState(() => {
    const saved = localStorage.getItem('selectedProjectId');
    return saved ? parseInt(saved, 10) : null;
  });

  // Load spaces on mount
  useEffect(() => {
    if (user) loadSpaces();
  }, [user]);

  // Load projects when space changes
  useEffect(() => {
    if (selectedSpace) {
      localStorage.setItem('selectedSpaceId', selectedSpace.id);
      // Get saved project ID from localStorage directly (not from state)
      const savedProjectId = localStorage.getItem('selectedProjectId');
      const parsedProjectId = savedProjectId ? parseInt(savedProjectId, 10) : null;
      
      // Pass the saved project ID to loadProjects
      loadProjects(parsedProjectId);
    }
  }, [selectedSpace]);

  // Load tasks when project changes
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedProjectId', selectedProject.id);
      loadTasks();
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  async function loadSpaces() {
    const data = await api.getSpaces(user.id);
    setSpaces(data);
    // Restore selected space from localStorage
    if (data.length > 0) {
      if (savedSelectedSpaceId) {
        const savedSpace = data.find(s => s.id === savedSelectedSpaceId);
        if (savedSpace) {
          setSelectedSpace(savedSpace);
        } else {
          setSelectedSpace(data[0]);
        }
      } else if (!selectedSpace) {
        setSelectedSpace(data[0]);
      }
    }
  }

  async function loadProjects(savedProjectId = null) {
    const data = await api.getProjects(selectedSpace.id);
    setProjects(data);
    // Restore selected project from localStorage
    if (data.length > 0) {
      if (savedProjectId) {
        const savedProject = data.find(p => p.id === savedProjectId);
        if (savedProject) {
          setSelectedProject(savedProject);
        } else {
          setSelectedProject(null);
        }
      } else {
        setSelectedProject(null);
      }
    } else {
      setSelectedProject(null);
    }
    setTasks([]);
  }

  async function loadTasks() {
    const data = await api.getTasks(selectedProject.id);
    setTasks(data);
  }

  // Space handlers
  async function handleCreateSpace(name) {
    await api.createSpace(user.id, name);
    await loadSpaces();
    setShowSpaceModal(false);
  }

  async function handleUpdateSpace(name) {
    await api.updateSpace(editingSpace.id, name);
    await loadSpaces();
    setEditingSpace(null);
    setShowSpaceModal(false);
  }

  async function handleDeleteSpace(id) {
    await api.deleteSpace(id);
    if (selectedSpace?.id === id) {
      setSelectedSpace(null);
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
    }
    await loadSpaces();
    setShowConfirm(null);
  }

  // Project handlers
  async function handleCreateProject(project) {
    await api.createProject(selectedSpace.id, project);
    await loadProjects();
    setShowProjectModal(false);
  }

  async function handleUpdateProject(project) {
    await api.updateProject(editingProject.id, project);
    await loadProjects();
    setEditingProject(null);
    setShowProjectModal(false);
  }

  async function handleDeleteProject(id) {
    await api.deleteProject(id);
    if (selectedProject?.id === id) {
      setSelectedProject(null);
      setTasks([]);
    }
    await loadProjects();
    setShowConfirm(null);
  }

  // Task handlers
  async function handleCreateTask(task) {
    await api.createTask(selectedProject.id, task);
    await loadTasks();
    setShowTaskModal(false);
  }

  async function handleUpdateTask(task) {
    await api.updateTask(editingTask.id, task);
    await loadTasks();
    setEditingTask(null);
    setShowTaskModal(false);
  }

  async function handleDeleteTask(id) {
    await api.deleteTask(id);
    await loadTasks();
    setShowConfirm(null);
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'planning': t.projectStatusPlanning,
      'in_progress': t.projectStatusInProgress,
      'completed': t.projectStatusCompleted,
      'on_hold': t.projectStatusOnHold,
      'todo': t.taskStatusTodo,
      'done': t.taskStatusDone
    };
    return statusMap[status] || status;
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${showMobileMenu ? 'show' : ''}`}>
        <div className="sidebar-header">
          {!sidebarCollapsed && <h2>{t.spaces}</h2>}
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        
        {!sidebarCollapsed && (
          <>
            <button className="add-btn-small" onClick={() => { setEditingSpace(null); setShowSpaceModal(true); }}>
              + {t.addSpace}
            </button>
            
            <div className="space-list">
              {spaces.length === 0 ? (
                <p className="empty-hint">{t.noSpaces}</p>
              ) : (
                (previewSpaces.length > 0 ? previewSpaces : spaces).map((space, index) => (
                  <div 
                    key={space.id} 
                    className={`space-item ${selectedSpace?.id === space.id ? 'active' : ''} ${dragOverSpaceIndex === index ? 'drag-over' : ''} ${draggedSpace?.id === space.id ? 'dragging' : ''}`}
                    onClick={() => setSelectedSpace(space)}
                    draggable
                    onDragStart={(e) => { const idx = spaces.findIndex(s => s.id === space.id); draggedSpaceOriginalIndex.current = idx; setDraggedSpace(space); setPreviewSpaces([...spaces]); setDragOverSpaceIndex(idx); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragOver={(e) => { 
                      e.preventDefault(); 
                      if (draggedSpace && space.id !== draggedSpace.id) {
                        const originalIndex = draggedSpaceOriginalIndex.current;
                        const dropIndex = spaces.findIndex(s => s.id === space.id);
                        
                        // Only update if different from current hover position
                        if (dragOverSpaceIndex !== dropIndex) {
                          setDragOverSpaceIndex(dropIndex);
                          
                          // Create preview by moving item from original position to drop position
                          const newSpaces = [...spaces];
                          newSpaces.splice(originalIndex, 1);
                          newSpaces.splice(dropIndex, 0, draggedSpace);
                          setPreviewSpaces(newSpaces);
                        }
                      }
                      e.dataTransfer.dropEffect = 'move'; 
                    }}
                    onDragLeave={() => {}}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverSpaceIndex(null);
                      
                      // Get the dragged item's original index from ref
                      const originalIndex = draggedSpaceOriginalIndex.current;
                      const currentDropIndex = dragOverSpaceIndex;
                      
                      // If dropped on original position, keep current order (no change)
                      if (originalIndex === currentDropIndex) {
                        setDraggedSpace(null);
                        setPreviewSpaces([]);
                        return;
                      }
                      
                      // Apply the preview order
                      const finalSpaces = previewSpaces.length > 0 ? previewSpaces : spaces;
                      setSpaces(finalSpaces);
                      // Save sort order
                      const spaceOrders = finalSpaces.map((s, index) => ({ id: s.id, sort_order: index }));
                      api.updateSpaceSortOrder(spaceOrders);
                      
                      setDraggedSpace(null);
                      setPreviewSpaces([]);
                    }}
                    onDragEnd={() => { draggedSpaceOriginalIndex.current = null; setDraggedSpace(null); setDragOverSpaceIndex(null); setPreviewSpaces([]); }}
                  >
                    <span className="space-name">{space.name}</span>
                    <div className="space-actions">
                      <button onClick={(e) => { e.stopPropagation(); setEditingSpace(space); setShowSpaceModal(true); }}>✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); setShowConfirm({ type: 'space', id: space.id, name: space.name }); }}>🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="content-header">
          <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            ☰
          </button>
          <h1>{selectedSpace ? selectedSpace.name : t.selectSpace}</h1>
          <div className="header-actions">
            <span className="username-display">{user.username}</span>
            <button className="theme-btn" onClick={toggleTheme}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button className="lang-btn" onClick={toggleLang}>{t.language}</button>
            <button className="logout-btn" onClick={logout}>{t.logout}</button>
          </div>
        </header>

        {/* Projects View */}
        {selectedSpace && (
          <div className="content-body">
            <div className="section-header">
              <h2>{t.projects}</h2>
              <button className="add-btn" onClick={() => { setEditingProject(null); setFormProjectType('general'); setShowProjectModal(true); }}>
                + {t.addProject}
              </button>
            </div>

            {projects.length === 0 ? (
              <p className="empty-hint">{t.noProjects}</p>
            ) : (
              <div className="project-grid">
                {(previewProjects.length > 0 ? previewProjects : projects).map((project, index) => (
                  <div 
                    key={project.id} 
                    className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''} ${dragOverProjectIndex === index ? 'drag-over' : ''} ${draggedProject?.id === project.id ? 'dragging' : ''}`}
                    onClick={() => setSelectedProject(project)}
                    draggable
                    onDragStart={(e) => { const idx = projects.findIndex(p => p.id === project.id); draggedProjectOriginalIndex.current = idx; setDraggedProject(project); setPreviewProjects([...projects]); setDragOverProjectIndex(idx); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragOver={(e) => { 
                      e.preventDefault(); 
                      if (draggedProject && project.id !== draggedProject.id) {
                        const originalIndex = draggedProjectOriginalIndex.current;
                        const dropIndex = projects.findIndex(p => p.id === project.id);
                        
                        // Only update if different from current hover position
                        if (dragOverProjectIndex !== dropIndex) {
                          setDragOverProjectIndex(dropIndex);
                          
                          // Create preview by moving item from original position to drop position
                          const newProjects = [...projects];
                          newProjects.splice(originalIndex, 1);
                          newProjects.splice(dropIndex, 0, draggedProject);
                          setPreviewProjects(newProjects);
                        }
                      }
                      e.dataTransfer.dropEffect = 'move'; 
                    }}
                    onDragLeave={() => {}}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverProjectIndex(null);
                      
                      // Get the dragged item's original index
                      const originalIndex = projects.findIndex(p => p.id === draggedProject.id);
                      const currentDropIndex = dragOverProjectIndex;
                      
                      // If dropped on original position, keep current order (no change)
                      if (originalIndex === currentDropIndex) {
                        // Do nothing to projects - keep current order
                      } else {
                        // Apply the preview order
                        const finalProjects = previewProjects.length > 0 ? previewProjects : projects;
                        setProjects(finalProjects);
                        const projectOrders = finalProjects.map((p, index) => ({ id: p.id, sort_order: index }));
                        api.updateProjectSortOrder(projectOrders);
                      }
                      
                      setDraggedProject(null);
                      setPreviewProjects([]);
                    }}
                    onDragEnd={() => { draggedProjectOriginalIndex.current = null; setDraggedProject(null); setDragOverProjectIndex(null); setPreviewProjects([]); }}
                  >
                    <div className="project-card-header">
                      <h3>{project.name}</h3>
                      <div className="project-actions">
                        <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); setFormProjectType(project.type); setShowProjectModal(true); }}>✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); setShowConfirm({ type: 'project', id: project.id, name: project.name }); }}>🗑️</button>
                      </div>
                    </div>
                    <p className="project-type">{project.type === 'general' ? t.projectTypeGeneral : t.projectTypeDev}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Tasks View */}
            {selectedProject && (
              <div className="tasks-section">
                <div className="section-header">
                  <h2>{t.tasks}</h2>
                  <button className="add-btn" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
                    + {t.addTask}
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <p className="empty-hint">{t.noTasks}</p>
                ) : (
                  <div className="task-table">
                    <div className="task-row header">
                      <span>{t.taskName}</span>
                      <span>{t.taskPriority}</span>
                      <span>{t.taskStatus}</span>
                      <span>{t.dueDate}</span>
                      <span></span>
                    </div>
                    {tasks.map(task => (
                      <div key={task.id} className="task-row">
                        <span className="task-name">{task.name}</span>
                        <span className={`priority ${task.priority}`}>{task.priority === 'low' ? t.taskPriorityLow : task.priority === 'high' ? t.taskPriorityHigh : t.taskPriorityMedium}</span>
                        <span className="status">{getStatusLabel(task.status)}</span>
                        <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</span>
                        <div className="task-actions">
                          <button onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>✏️</button>
                          <button onClick={() => setShowConfirm({ type: 'task', id: task.id })}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Space Modal */}
      {showSpaceModal && (
        <Modal onClose={() => setShowSpaceModal(false)}>
          <h2>{editingSpace ? t.editSpace : t.addSpace}</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const name = e.target.elements.name.value;
            editingSpace ? handleUpdateSpace(name) : handleCreateSpace(name);
          }}>
            <div className="form-group">
              <label>{t.spaceName}</label>
              <input name="name" defaultValue={editingSpace?.name} required autoFocus />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowSpaceModal(false)}>{t.cancel}</button>
              <button type="submit" className="btn-primary">{t.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <Modal onClose={() => setShowProjectModal(false)}>
          <h2>{editingProject ? t.editProject : t.addProject}</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const project = {
              name: formData.get('name'),
              type: formData.get('type'),
              remarks: formData.get('remarks'),
              dev: formData.get('dev'),
              test: formData.get('test'),
              ops: formData.get('ops'),
              release_date: formData.get('release_date') || null,
              docs_url: formData.get('docs_url')
            };
            editingProject ? handleUpdateProject(project) : handleCreateProject(project);
          }}>
            <div className="form-group">
              <label>{t.projectName}</label>
              <input name="name" defaultValue={editingProject?.name} required />
            </div>
            <div className="form-group">
              <label>{t.projectType}</label>
              <select name="type" defaultValue={editingProject?.type || 'general'} onChange={(e) => setFormProjectType(e.target.value)}>
                <option value="general">{t.projectTypeGeneral}</option>
                <option value="development">{t.projectTypeDev}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t.remarks}</label>
              <textarea name="remarks" defaultValue={editingProject?.remarks} />
            </div>
            
            {/* Development project fields */}
            <div className="dev-fields" style={{ display: editingProject?.type === 'development' || (editingProject === null && formProjectType === 'development') ? 'block' : 'none' }}>
              <div className="form-group">
                <label>{t.devInfo}</label>
                <input name="dev" defaultValue={editingProject?.dev} />
              </div>
              <div className="form-group">
                <label>{t.testInfo}</label>
                <input name="test" defaultValue={editingProject?.test} />
              </div>
              <div className="form-group">
                <label>{t.opsInfo}</label>
                <input name="ops" defaultValue={editingProject?.ops} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t.releaseDate}</label>
                  <input type="date" name="release_date" defaultValue={editingProject?.release_date?.split('T')[0]} />
                </div>
                <div className="form-group">
                  <label>{t.docsUrl}</label>
                  <input name="docs_url" defaultValue={editingProject?.docs_url} />
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowProjectModal(false)}>{t.cancel}</button>
              <button type="submit" className="btn-primary">{t.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <Modal onClose={() => setShowTaskModal(false)}>
          <h2>{editingTask ? t.editTask : t.addTask}</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const task = {
              name: formData.get('name'),
              description: formData.get('description'),
              priority: formData.get('priority'),
              status: formData.get('status'),
              due_date: formData.get('due_date') || null
            };
            editingTask ? handleUpdateTask(task) : handleCreateTask(task);
          }}>
            <div className="form-group">
              <label>{t.taskName}</label>
              <input name="name" defaultValue={editingTask?.name} required />
            </div>
            <div className="form-group">
              <label>{t.taskDescription}</label>
              <textarea name="description" defaultValue={editingTask?.description} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t.taskPriority}</label>
                <select name="priority" defaultValue={editingTask?.priority || 'medium'}>
                  <option value="low">{t.taskPriorityLow}</option>
                  <option value="medium">{t.taskPriorityMedium}</option>
                  <option value="high">{t.taskPriorityHigh}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.taskStatus}</label>
                <select name="status" defaultValue={editingTask?.status || 'todo'}>
                  <option value="todo">{t.taskStatusTodo}</option>
                  <option value="in_progress">{t.taskStatusInProgress}</option>
                  <option value="done">{t.taskStatusDone}</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>{t.dueDate}</label>
              <input type="date" name="due_date" defaultValue={editingTask?.due_date?.split('T')[0]} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowTaskModal(false)}>{t.cancel}</button>
              <button type="submit" className="btn-primary">{t.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t.confirmDelete}</h3>
            <p>
              {showConfirm.type === 'space' && t.confirmDeleteSpace}
              {showConfirm.type === 'project' && t.confirmDeleteProject}
              {showConfirm.type === 'task' && t.confirmDeleteTask}
            </p>
            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(null)}>{t.cancel}</button>
              <button 
                className="btn-danger"
                onClick={() => {
                  if (showConfirm.type === 'space') handleDeleteSpace(showConfirm.id);
                  if (showConfirm.type === 'project') handleDeleteProject(showConfirm.id);
                  if (showConfirm.type === 'task') handleDeleteTask(showConfirm.id);
                }}
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal Component
function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// App Component
function App() {
  const { user, login, loading } = useAuth();

  if (loading) {
    return <div className="loading-page">Loading...</div>;
  }

  return user ? <MainLayout /> : <AuthPage onLogin={login} />;
}

// Root with providers
export default function Root() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LangProvider>
          <App />
        </LangProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
