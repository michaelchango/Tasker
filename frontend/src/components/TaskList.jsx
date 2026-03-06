function TaskList({ tasks, onToggle, onEdit, onDelete, t }) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <h3>{t.noTasks}</h3>
        <p>{t.noTasksHint}</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map(task => (
        <div 
          key={task.id} 
          className={`task-item ${task.completed ? 'completed' : ''}`}
        >
          <div 
            className={`task-checkbox ${task.completed ? 'checked' : ''}`}
            onClick={() => onToggle(task.id)}
          />
          <div className="task-content" onClick={() => onEdit(task)}>
            <div className="task-title">{task.title}</div>
            <div className="task-meta">
              {task.due_date && (() => {
                const [y, m, d] = task.due_date.split('-');
                const dt = new Date(y, Number(m) - 1, Number(d));
                return <span>📅 {dt.toLocaleDateString()}</span>;
              })()}
              {task.priority && (
                <span className={`priority-badge ${task.priority}`}>
                  {t[task.priority] || task.priority}
                </span>
              )}
            </div>
          </div>
          <div className="task-actions">
            <button onClick={() => onEdit(task)}>✏️</button>
            <button className="delete" onClick={() => onDelete(task.id)}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TaskList;
