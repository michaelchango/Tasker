import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { translations } from './i18n';
import * as api from './api';
import DatePicker from 'react-datepicker';
import { zhCN, enUS } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

// helper for custom header in react-datepicker
export function getMonthNames(lang = 'zh') {
  return lang === 'zh'
    ? ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
}

// format a date object to yyyy-MM-dd using local components (avoids timezone shift)
export function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// reusable date picker field component
function DatePickerField({ label, value, onChange, placeholder, locale, renderHeader }) {
  // convert stored yyyy-MM-dd string to a Date in local zone
  const selectedDate = value
    ? (() => {
        const [y, m, d] = value.split('-');
        return new Date(y, Number(m) - 1, Number(d));
      })()
    : null;

  return (
    <div className="form-group">
      <label>{label}</label>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => onChange(date ? formatLocalDate(date) : '')}
        locale={locale}
        dateFormat="yyyy-MM-dd"
        placeholderText={placeholder}
        className="date-picker-input"
        wrapperClassName="date-picker-wrapper"
        showYearDropdown
        scrollableYearDropdown
        yearDropdownItemNumber={10}
        renderCustomHeader={renderHeader}
        isClearable
      />
    </div>
  );
}


function renderCustomHeader({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled
}) {
  const currentYear = date.getFullYear();
  // show only 2020 through 2040 in the year dropdown
  const MIN_YEAR = 2020;
  const MAX_YEAR = 2040;
  const yearRange = [];
  for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
    yearRange.push(y);
  }

  // determine language for month names (read from localStorage which is kept in sync by LangProvider)
  const lang = localStorage.getItem('lang') || 'zh';
  const monthNames = getMonthNames(lang);

  return (
    <div className="datepicker-header">
      <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>&lt;</button>
      <select
        value={currentYear}
        onChange={(e) => changeYear(Number(e.target.value))}
      >
        {yearRange.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={date.getMonth()}
        onChange={(e) => changeMonth(Number(e.target.value))}
      >
        {monthNames.map((m, idx) => (
          <option key={m} value={idx}>{m}</option>
        ))}
      </select>
      <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled}>&gt;</button>
    </div>
  );
}

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
  const [dateLocale, setDateLocale] = useState(enUS);

  // Detect language for date picker
  useEffect(() => {
    setDateLocale(lang === 'zh' ? zhCN : enUS);
  }, [lang]);

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

  // clear state when user logs out
  useEffect(() => {
    if (!user) {
      setSpaces([]);
      setSelectedSpace(null);
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
      setPreviewSpaces([]);
      setPreviewProjects([]);
      setDraggedSpace(null);
      setDraggedProject(null);
      setSidebarCollapsed(false);
      setShowMobileMenu(false);
      setShowSpaceModal(false);
      setShowProjectModal(false);
      setShowTaskModal(false);
      setEditingSpace(null);
      setEditingProject(null);
      setEditingTask(null);
      setShowConfirm(null);
    }
  }, [user]);

  // Load spaces on mount
  useEffect(() => {
    if (user) {
      loadSpaces();
    } else {
      // clear state when logged out
      setSpaces([]);
      setSelectedSpace(null);
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
      localStorage.removeItem('selectedSpaceId');
      localStorage.removeItem('selectedProjectId');
    }
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

  // due date state for task modal
  const [taskDueDate, setTaskDueDate] = useState('');

  useEffect(() => {
    if (showTaskModal) {
      setTaskDueDate(editingTask?.due_date?.split('T')[0] || '');
    }
  }, [showTaskModal, editingTask]);

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
                    onDragStart={(e) => { 
                      const idx = spaces.findIndex(s => s.id === space.id); 
                      draggedSpaceOriginalIndex.current = idx; 
                      setDraggedSpace(space); 
                      setDragOverSpaceIndex(idx); 
                      e.dataTransfer.effectAllowed = 'move'; 
                    }}
                    onDragOver={(e) => { 
                      e.preventDefault(); 
                      if (draggedSpace && space.id !== draggedSpace.id) {
                        const dropIndex = (previewSpaces.length > 0 ? previewSpaces : spaces).findIndex(s => s.id === space.id);
                        
                        if (dragOverSpaceIndex !== dropIndex) {
                          setDragOverSpaceIndex(dropIndex);
                          
                          // Calculate new position in preview array
                          const current = [...(previewSpaces.length > 0 ? previewSpaces : spaces)];
                          // Find where dragged item is currently in preview
                          const currentDraggedIndex = current.findIndex(s => s.id === draggedSpace.id);
                          // Remove from current position
                          current.splice(currentDraggedIndex, 1);
                          // Insert at new position
                          current.splice(dropIndex, 0, draggedSpace);
                          setPreviewSpaces(current);
                        }
                      }
                      e.dataTransfer.dropEffect = 'move'; 
                    }}
                    onDragLeave={() => {}}
                    onDrop={(e) => { 
                      e.preventDefault();
                      setDragOverSpaceIndex(null);
                      
                      if (previewSpaces.length > 0) {
                        setSpaces(previewSpaces);
                        // Save sort order
                        const spaceOrders = previewSpaces.map((s, index) => ({ id: s.id, sort_order: index }));
                        api.updateSpaceSortOrder(spaceOrders);
                      }
                      
                      setDraggedSpace(null);
                      setPreviewSpaces([]);
                    }}
                    onDragEnd={() => { 
                      setDraggedSpace(null); 
                      setDragOverSpaceIndex(null); 
                      setPreviewSpaces([]); 
                    }}
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
                    onDragStart={(e) => { 
                      const idx = projects.findIndex(p => p.id === project.id); 
                      draggedProjectOriginalIndex.current = idx; 
                      setDraggedProject(project); 
                      setDragOverProjectIndex(idx); 
                      e.dataTransfer.effectAllowed = 'move'; 
                    }}
                    onDragOver={(e) => { 
                      e.preventDefault(); 
                      if (draggedProject && project.id !== draggedProject.id) {
                        const dropIndex = (previewProjects.length > 0 ? previewProjects : projects).findIndex(p => p.id === project.id);
                        
                        if (dragOverProjectIndex !== dropIndex) {
                          setDragOverProjectIndex(dropIndex);
                          
                          // Calculate new position in preview array
                          const current = [...(previewProjects.length > 0 ? previewProjects : projects)];
                          // Find where dragged item is currently in preview
                          const currentDraggedIndex = current.findIndex(p => p.id === draggedProject.id);
                          // Remove from current position
                          current.splice(currentDraggedIndex, 1);
                          // Insert at new position
                          current.splice(dropIndex, 0, draggedProject);
                          setPreviewProjects(current);
                        }
                      }
                      e.dataTransfer.dropEffect = 'move'; 
                    }}
                    onDragLeave={() => {}}
                    onDrop={(e) => { 
                      e.preventDefault();
                      setDragOverProjectIndex(null);
                      
                      if (previewProjects.length > 0) {
                        setProjects(previewProjects);
                        // Save sort order
                        const projectOrders = previewProjects.map((p, index) => ({ id: p.id, sort_order: index }));
                        api.updateProjectSortOrder(projectOrders);
                      }
                      
                      setDraggedProject(null);
                      setPreviewProjects([]);
                    }}
                    onDragEnd={() => { 
                      setDraggedProject(null); 
                      setDragOverProjectIndex(null); 
                      setPreviewProjects([]); 
                    }}
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
                      <span>{t.taskDescription || '描述'}</span>
                      <span>{t.taskPriority}</span>
                      <span>{t.taskStatus}</span>
                      <span>{t.dueDate}</span>
                      <span></span>
                    </div>
                    {tasks.map(task => (
                      <div key={task.id} className="task-row">
                        <span className="task-name">{task.name}</span>
                        <span className="task-description">
                          {task.description || '-'}
                        </span>
                        {task.priority && (
                          <span className={`priority ${task.priority}`}>
                            {task.priority === 'low' ? t.taskPriorityLow : task.priority === 'high' ? t.taskPriorityHigh : t.taskPriorityMedium}
                          </span>
                        )}
                        <span className="status">{getStatusLabel(task.status)}</span>
                        <span>{task.due_date ? (() => {
                          const [y, m, d] = task.due_date.split('-');
                          const dt = new Date(y, Number(m) - 1, Number(d));
                          return dt.toLocaleDateString();
                        })() : '-'}</span>
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
              due_date: taskDueDate || null
            };
            editingTask ? handleUpdateTask(task) : handleCreateTask(task);
          }}>
            <div className="form-group">
              <label className="required">{t.taskName}</label>
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
            {/* primary due date */}
            <DatePickerField
              label={t.dueDate}
              value={taskDueDate}
              onChange={setTaskDueDate}
              placeholder={t.selectDate || '请选择'}
              locale={dateLocale}
              renderHeader={renderCustomHeader}
            />
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
