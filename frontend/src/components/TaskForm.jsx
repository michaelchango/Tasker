youort { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { zhCN, enUS } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

function TaskForm({ task, onSubmit, onClose, t }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  });
  
  const [locale, setLocale] = useState(enUS);

  useEffect(() => {
    // 根据当前语言设置日期选择器语言
    const isChinese = navigator.language.includes('zh') || t.cancel === '取消';
    setLocale(isChinese ? zhCN : enUS);
  }, [t]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.split('T')[0] : ''
      });
    }
  }, [task]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // format a Date object to yyyy-MM-dd without timezone shifts
  function formatLocalDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function handleDateChange(date) {
    const dateStr = date ? formatLocalDate(date) : '';
    setFormData(prev => ({ ...prev, due_date: dateStr }));
  }

  const selectedDate = formData.due_date
    ? (() => {
        const [y, m, d] = formData.due_date.split('-');
        return new Date(y, Number(m) - 1, Number(d));
      })()
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? t.editTask : t.newTask}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="title" className="required">{t.title}</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t.titlePlaceholder}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">{t.description}</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t.descriptionPlaceholder}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">{t.priority}</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">{t.low}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="high">{t.high}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="test_date">测试日期</label>
                <DatePicker
                  id="test_date"
                  selected={null}
                  onChange={() => {}}
                  locale={locale}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="点击测试"
                  className="date-picker-input"
                  wrapperClassName="date-picker-wrapper"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={10}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="due_date">{t.dueDate}</label>
              <DatePicker
                id="due_date"
                selected={selectedDate}
                onChange={handleDateChange}
                locale={locale}
                dateFormat="yyyy-MM-dd"
                placeholderText={t.selectDate || '请选择'}
                className="date-picker-input"
                wrapperClassName="date-picker-wrapper"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={10}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              {t.cancel}
            </button>
            <button type="submit" className="btn-submit">
              {task ? t.saveChanges : t.addTask}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskForm;
