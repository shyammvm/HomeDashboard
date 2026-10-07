import React, { useState, useEffect } from 'react';
import { CheckSquare, Check, Plus, Trash2, ListTodo, Sparkles } from 'lucide-react';

const DEFAULT_TASKS = [
  { id: '1', title: 'Review Q4 system architecture doc', completed: false, priority: 'high' },
  { id: '2', title: 'Submit quarterly budget variance report', completed: true, priority: 'med' },
  { id: '3', title: 'Drink 2.5L water & 15m posture stretch', completed: false, priority: 'normal' },
  { id: '4', title: 'Order replacement HEPA filters', completed: false, priority: 'med' },
  { id: '5', title: 'Read 2 chapters of "Designing Data-Intensive Applications"', completed: false, priority: 'normal' },
];

export default function TasksCard() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('aether_tasks');
      return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [newPriority, setNewPriority] = useState('normal');
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    localStorage.setItem('aether_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskText.trim(),
      completed: false,
      priority: newPriority,
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
  };

  const deleteTask = (e, id) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="dash-card tasks-card" role="region" aria-label="Tasks and To-Do">
      <div className="card-section-header">
        <div className="card-title-group">
          <div className="card-title-icon icon-tasks">
            <CheckSquare size={18} />
          </div>
          <div>
            <h2 className="card-section-title">Daily Tasks & Focus</h2>
          </div>
        </div>
        <span className="card-badge" style={{ color: 'var(--accent-emerald)' }}>
          {completedCount}/{tasks.length} DONE
        </span>
      </div>

      {/* Progress Track */}
      <div className="task-header-row">
        <div className="task-progress-track">
          <div className="task-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', minWidth: 32, textAlign: 'right' }}>
          {progressPercent}%
        </span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {['all', 'active', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              background: filter === tab ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: filter === tab ? 'var(--accent-emerald)' : 'var(--text-dim)',
              border: filter === tab ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: '3px 9px',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'capitalize',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task Items */}
      <div className="task-list custom-scroll">
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: 12.5 }}>
            <Sparkles size={20} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`task-item ${t.completed ? 'completed' : ''}`}
              onClick={() => toggleTask(t.id)}
            >
              <div className="task-left">
                <div className="task-checkbox">
                  {t.completed && <Check size={13} strokeWidth={3} />}
                </div>
                <span className="task-text">{t.title}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {t.priority === 'high' && <span className="task-priority-tag priority-high">High</span>}
                {t.priority === 'med' && <span className="task-priority-tag priority-med">Med</span>}
                <button
                  onClick={(e) => deleteTask(e, t.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                  }}
                  title="Delete Task"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Input Bar */}
      <form onSubmit={addTask} className="task-input-bar">
        <input
          type="text"
          className="task-input-box"
          placeholder="Add new task or action item..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            fontSize: 12,
            padding: '0 6px',
            outline: 'none',
          }}
        >
          <option value="normal">Normal</option>
          <option value="med">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="task-add-btn" aria-label="Add task">
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
