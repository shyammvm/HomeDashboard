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
            <CheckSquare size={16} />
          </div>
          <div>
            <div className="card-section-super">SEC-ACT // PROTOCOLS</div>
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
          {isSynced ? 'GOOGLE TASKS' : 'LOCAL LIST'} • {totalToday > 0 ? `${doneTodayTasks.length}/${totalToday} DONE` : 'NOMINAL'}
        </span>
      </div>

      {/* Today's Tactical Progress Bar */}
      <div className="task-header-row">
        <div className="task-progress-track">
          <div
            className="task-progress-fill"
            style={{
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
            }}
          />
        </div>
        <span className="task-progress-val">
          {progressPercent}%
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="task-filter-pills-row">
        {[
          { key: 'all', label: `ALL [${tasks.length}]` },
          { key: 'pending', label: `ACTIVE [${pendingTasks.length}]` },
          { key: 'done', label: `CLEARED [${doneTodayTasks.length}]` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`task-filter-pill ${filter === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task Items (View-Only Ambient List) */}
      <div className="task-list custom-scroll">
        {filteredTasks.length === 0 ? (
          <div className="tactical-empty-box">
            <div className="tactical-empty-reticle">
              <CheckSquare size={20} color="var(--stark-cyan)" />
            </div>
            <div className="tactical-empty-title">
              {filter === 'done'
                ? 'STANDBY // ZERO PROTOCOLS CLEARED TODAY'
                : totalToday === 0
                  ? 'DIRECTIVES NOMINAL // 0 PENDING ACTIONS'
                  : 'ZERO DIRECTIVES IN ACTIVE FILTER'}
            </div>
            <div className="tactical-empty-sub">
              {isSynced ? 'GOOGLE TASKS ENGINE ACTIVE • ALL ACTIONS CLEARED' : 'LOCAL ENGINE NOMINAL • CONFIGURE CLOUD SYNC IN SETTINGS'}
            </div>
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
