import React, { useState } from 'react';
import { CheckSquare, Check, Sparkles, Tag, Calendar as CalIcon } from 'lucide-react';

export default function TasksCard({
  tasks = [],
  isSynced = false,
}) {
  const [filter, setFilter] = useState('all'); // all, pending, done

  const pendingTasks = (tasks || []).filter(t => !t.completed);
  const doneTodayTasks = (tasks || []).filter(t => t.completed);
  const totalToday = pendingTasks.length + doneTodayTasks.length;
  const progressPercent = totalToday > 0 ? Math.round((doneTodayTasks.length / totalToday) * 100) : 0;

  const filteredTasks = (tasks || []).filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const formatDueDate = (due) => {
    if (!due) return null;
    const d = new Date(due);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="dash-card tasks-card stark-hud-card" role="region" aria-label="Tasks and To-Do">
      <div className="stark-card-corner tl" />
      <div className="stark-card-corner tr" />
      <div className="stark-card-corner bl" />
      <div className="stark-card-corner br" />

      <div className="card-section-header">
        <div className="card-title-group">
          <div className="card-title-icon icon-tasks">
            <CheckSquare size={18} />
          </div>
          <div>
            <h2 className="card-section-title">Directives & Tasks</h2>
          </div>
        </div>
        <span
          className="card-badge stark-badge"
          style={{
            color: 'var(--accent-emerald)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {isSynced && <span className="pulse-dot" style={{ backgroundColor: 'var(--accent-emerald)', width: 6, height: 6 }} />}
          {isSynced ? 'GOOGLE TASKS' : 'TASK FEED'} • {totalToday > 0 ? `${doneTodayTasks.length}/${totalToday} DONE` : 'ALL CLEAR'}
        </span>
      </div>

      {/* Today's Progress Bar */}
      <div className="task-header-row">
        <div className="task-progress-track">
          <div
            className="task-progress-fill"
            style={{
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))',
            }}
          />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', minWidth: 50, textAlign: 'right' }}>
          {progressPercent}%
        </span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { key: 'all', label: `All (${tasks.length})` },
          { key: 'pending', label: `Pending (${pendingTasks.length})` },
          { key: 'done', label: `Done Today (${doneTodayTasks.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              background: filter === tab.key ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: filter === tab.key ? 'var(--accent-emerald)' : 'var(--text-dim)',
              border: filter === tab.key ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: '3px 9px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task Items (View-Only Ambient List) */}
      <div className="task-list custom-scroll">
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: 12.5 }}>
            <Sparkles size={20} style={{ margin: '0 auto 6px', opacity: 0.5, color: 'var(--accent-emerald)' }} />
            {filter === 'done'
              ? 'No tasks completed yet today.'
              : totalToday === 0
                ? (isSynced ? 'All directives complete • No pending tasks' : 'No tasks synced • Configure Google Sync URL in Settings')
                : 'No tasks in this view.'}
          </div>
        ) : (
          filteredTasks.map((t) => {
            const dueStr = formatDueDate(t.due);
            const isDone = Boolean(t.completed);

            return (
              <div
                key={t.id}
                className={`task-item ${isDone ? 'completed' : ''}`}
                style={{
                  cursor: 'default',
                  opacity: isDone ? 0.65 : 1,
                  background: isDone ? 'rgba(52, 211, 153, 0.04)' : undefined,
                }}
              >
                <div className="task-left">
                  {/* Status Indicator */}
                  <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: isDone ? '1.5px solid var(--accent-emerald)' : '1.5px solid rgba(52, 211, 153, 0.5)',
                    backgroundColor: isDone ? 'rgba(52, 211, 153, 0.2)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginRight: 6,
                  }}>
                    {isDone ? (
                      <Check size={11} color="var(--accent-emerald)" strokeWidth={3} />
                    ) : (
                      <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span
                      className="task-text"
                      style={{
                        textDecoration: isDone ? 'line-through' : 'none',
                        color: isDone ? 'var(--text-muted)' : '#fff',
                      }}
                    >
                      {t.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--text-dim)' }}>
                      {t.listTitle && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, opacity: 0.8 }}>
                          <Tag size={10} color="var(--accent-emerald)" />
                          {t.listTitle}
                        </span>
                      )}
                      {dueStr && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--accent-amber)' }}>
                          <CalIcon size={10} />
                          {dueStr}
                        </span>
                      )}
                      {isDone && (
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                          DONE TODAY
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!isDone && t.priority === 'high' && <span className="task-priority-tag priority-high">High</span>}
                  {!isDone && t.priority === 'med' && <span className="task-priority-tag priority-med">Med</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
