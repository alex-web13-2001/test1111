import { useEffect, useMemo, useState } from 'react';
import {
  fetchProjects,
  fetchProjectDetail,
  createProject,
  updateProject,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
  fetchUsers,
  createUser,
  fetchDashboardTasks,
  createTask,
  updateTask,
  deleteTask
} from './api.js';

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2);

const priorityOptions = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent 🔥' }
];

const emptyTaskForm = {
  title: '',
  description: '',
  categoryId: '',
  tagIds: [],
  priority: 'medium',
  assigneeId: '',
  dueDate: '',
  links: [{ id: createId(), label: '', url: '' }]
};

const emptyProjectForm = {
  name: '',
  description: '',
  categoryIds: [],
  links: [{ id: createId(), label: '', url: '' }]
};

const emptyCategoryForm = { name: '', color: '#845ef7', description: '' };
const emptyTagForm = { name: '', description: '' };
const emptyUserForm = { name: '', email: '', password: '' };

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    return date.toLocaleDateString();
  } catch {
    return value;
  }
};

const statusTitle = (status, project) => {
  const column = project?.columns?.find((item) => item.status === status);
  return column ? column.title : status;
};

const Sidebar = ({
  view,
  onChangeView,
  projects,
  selectedProjectId,
  onSelectProject
}) => (
  <aside className="sidebar">
    <div className="brand">
      <span className="brand-icon">◎</span>
      <span className="brand-name">FlowSphere</span>
    </div>

    <nav className="sidebar-nav">
      <button
        type="button"
        className={view === 'dashboard' ? 'active' : ''}
        onClick={() => onChangeView('dashboard')}
      >
        Dashboard
      </button>
      <button
        type="button"
        className={view === 'projects' ? 'active' : ''}
        onClick={() => onChangeView('projects')}
      >
        Projects
      </button>
      <button
        type="button"
        className={view === 'reference' ? 'active' : ''}
        onClick={() => onChangeView('reference')}
      >
        Reference Data
      </button>
      <button
        type="button"
        className={view === 'team' ? 'active' : ''}
        onClick={() => onChangeView('team')}
      >
        Team
      </button>
    </nav>

    <div className="sidebar-projects">
      <header>
        <h4>Projects</h4>
        <button type="button" onClick={() => onChangeView('projects')}>
          View all
        </button>
      </header>
      <div className="sidebar-project-list">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className={selectedProjectId === project.id && view === 'project' ? 'active' : ''}
            onClick={() => {
              onSelectProject(project.id);
              onChangeView('project');
            }}
          >
            {project.name}
          </button>
        ))}
        {projects.length === 0 && <p className="muted">No projects yet</p>}
      </div>
    </div>
  </aside>
);

const DashboardView = ({
  tasks,
  filters,
  onFilterChange,
  projects,
  categories,
  tags,
  users,
  loading
}) => (
  <section className="panel">
    <header className="panel-header">
      <div>
        <h1>Portfolio dashboard</h1>
        <p className="muted">
          Track delivery across every project, filter by status or assignee and jump directly into the board.
        </p>
      </div>
    </header>

    <div className="filters">
      <select
        value={filters.projectId}
        onChange={(event) => onFilterChange({ ...filters, projectId: event.target.value })}
      >
        <option value="">All projects</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <select
        value={filters.categoryId}
        onChange={(event) => onFilterChange({ ...filters, categoryId: event.target.value })}
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        value={filters.tagId}
        onChange={(event) => onFilterChange({ ...filters, tagId: event.target.value })}
      >
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>
      <select
        value={filters.assigneeId}
        onChange={(event) => onFilterChange({ ...filters, assigneeId: event.target.value })}
      >
        <option value="">Everyone</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(event) => onFilterChange({ ...filters, status: event.target.value })}
      >
        <option value="">All statuses</option>
        <option value="assigned">Assigned</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>
      <select
        value={filters.priority}
        onChange={(event) => onFilterChange({ ...filters, priority: event.target.value })}
      >
        <option value="">All priorities</option>
        {priorityOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        type="search"
        value={filters.search}
        placeholder="Search tasks"
        onChange={(event) => onFilterChange({ ...filters, search: event.target.value })}
      />
    </div>

    <div className="table-wrapper">
      {loading ? (
        <p>Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="muted">No tasks match the filters.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Category</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <div className="task-cell">
                    <strong>{task.title}</strong>
                    {task.description && <span className="muted">{task.description}</span>}
                  </div>
                </td>
                <td>{task.project?.name || '—'}</td>
                <td>
                  {task.category ? (
                    <span className="pill" style={{ background: task.category.color }}>
                      {task.category.name}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  {task.tags.length > 0 ? task.tags.map((tag) => <span key={tag.id} className="tag">#{tag.name}</span>) : '—'}
                </td>
                <td>{statusTitle(task.status, task.project)}</td>
                <td>
                  <span className={`priority ${task.priority}`}>
                    {priorityOptions.find((option) => option.id === task.priority)?.label || task.priority}
                  </span>
                </td>
                <td>{task.assignee?.name || '—'}</td>
                <td>{formatDate(task.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </section>
);

const ProjectsView = ({
  projects,
  categories,
  onCreateProject,
  onSelectProject,
  loading,
  form,
  onChangeForm
}) => (
  <section className="panel two-column">
    <div className="column">
      <header className="panel-header">
        <div>
          <h1>Projects</h1>
          <p className="muted">Organise workstreams and curate a dedicated kanban board for each team.</p>
        </div>
      </header>
      <div className="project-list">
        {projects.length === 0 && <p className="muted">Create your first project to get started.</p>}
        {projects.map((project) => (
          <article key={project.id} className="project-card">
            <header>
              <h3>{project.name}</h3>
              <button type="button" onClick={() => onSelectProject(project.id)}>
                Open board
              </button>
            </header>
            {project.description && <p>{project.description}</p>}
            <footer>
              <div>
                <span className="muted">Columns:</span>
                <span>{project.columns.map((column) => column.title).join(', ')}</span>
              </div>
              <div>
                <span className="muted">Categories:</span>
                <span>
                  {project.categoryIds.length === 0
                    ? '—'
                    : project.categoryIds
                        .map((categoryId) => categories.find((category) => category.id === categoryId)?.name)
                        .filter(Boolean)
                        .join(', ')}
                </span>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </div>
    <div className="column">
      <div className="card">
        <h2>New project</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onCreateProject();
          }}
        >
          <label>
            Name
            <input
              type="text"
              value={form.name}
              onChange={(event) => onChangeForm({ ...form, name: event.target.value })}
              placeholder="Launch campaign"
              required
            />
          </label>
          <label>
            Description
            <textarea
              rows="3"
              value={form.description}
              onChange={(event) => onChangeForm({ ...form, description: event.target.value })}
              placeholder="Outline objectives, stakeholders and milestones"
            />
          </label>
          <fieldset>
            <legend>Categories</legend>
            <div className="checkbox-grid">
              {categories.map((category) => (
                <label key={category.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.categoryIds.includes(category.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        onChangeForm({
                          ...form,
                          categoryIds: [...form.categoryIds, category.id]
                        });
                      } else {
                        onChangeForm({
                          ...form,
                          categoryIds: form.categoryIds.filter((id) => id !== category.id)
                        });
                      }
                    }}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
              {categories.length === 0 && <p className="muted">Create categories in Reference Data.</p>}
            </div>
          </fieldset>
          <fieldset>
            <legend>Links</legend>
            {form.links.map((link, index) => (
              <div key={link.id} className="link-row">
                <input
                  type="text"
                  placeholder="Label"
                  value={link.label}
                  onChange={(event) => {
                    const next = form.links.slice();
                    next[index] = { ...link, label: event.target.value };
                    onChangeForm({ ...form, links: next });
                  }}
                />
                <input
                  type="url"
                  placeholder="https://"
                  value={link.url}
                  onChange={(event) => {
                    const next = form.links.slice();
                    next[index] = { ...link, url: event.target.value };
                    onChangeForm({ ...form, links: next });
                  }}
                />
                {form.links.length > 1 && (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      const next = form.links.filter((item) => item.id !== link.id);
                      onChangeForm({ ...form, links: next });
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {form.links.length < 5 && (
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  onChangeForm({
                    ...form,
                    links: [...form.links, { id: createId(), label: '', url: '' }]
                  })
                }
              >
                Add link
              </button>
            )}
          </fieldset>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create project'}
          </button>
        </form>
      </div>
    </div>
  </section>
);

const TaskCard = ({ task, project, categories, tags, users, onUpdate, onDelete, onDragStart }) => (
  <article
    className={`task-card priority-${task.priority}`}
    draggable
    onDragStart={(event) => onDragStart(event, task)}
  >
    <header>
      <h4>{task.title}</h4>
      <button type="button" onClick={() => onDelete(task.id)}>
        ×
      </button>
    </header>
    {task.description && <p>{task.description}</p>}
    <dl>
      <div>
        <dt>Status</dt>
        <dd>
          <select value={task.status} onChange={(event) => onUpdate(task.id, { status: event.target.value })}>
            {project.columns.map((column) => (
              <option key={column.id} value={column.status}>
                {column.title}
              </option>
            ))}
          </select>
        </dd>
      </div>
      <div>
        <dt>Priority</dt>
        <dd>
          <select value={task.priority} onChange={(event) => onUpdate(task.id, { priority: event.target.value })}>
            {priorityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </dd>
      </div>
      <div>
        <dt>Assignee</dt>
        <dd>
          <select
            value={task.assigneeId || ''}
            onChange={(event) =>
              onUpdate(task.id, { assigneeId: event.target.value || null })
            }
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </dd>
      </div>
      <div>
        <dt>Category</dt>
        <dd>
          <select
            value={task.categoryId || ''}
            onChange={(event) => onUpdate(task.id, { categoryId: event.target.value || null })}
          >
            <option value="">None</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </dd>
      </div>
      <div>
        <dt>Due</dt>
        <dd>
          <input
            type="date"
            value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
            onChange={(event) => onUpdate(task.id, { dueDate: event.target.value || null })}
          />
        </dd>
      </div>
    </dl>
    {task.tags.length > 0 && (
      <footer>
        {task.tags.map((tag) => (
          <span key={tag.id} className="tag">
            #{tag.name}
          </span>
        ))}
      </footer>
    )}
  </article>
);

const ProjectBoardView = ({
  project,
  tasks,
  categories,
  tags,
  users,
  taskForm,
  onTaskFormChange,
  onCreateTask,
  creatingTask,
  onUpdateTask,
  onDeleteTask,
  onDropTask,
  onDragStartTask,
  columnDraft,
  onColumnDraftChange,
  onSaveColumns,
  savingColumns,
  onUpdateProject,
  projectForm,
  onProjectFormChange,
  savingProject
}) => {
  const groupedTasks = useMemo(() => {
    return project.columns.reduce((acc, column) => {
      acc[column.status] = tasks.filter((task) => task.status === column.status);
      return acc;
    }, {});
  }, [project.columns, tasks]);

  return (
    <section className="panel full-height">
      <header className="panel-header project-header">
        <div>
          <h1>{project.name}</h1>
          {project.description ? <p>{project.description}</p> : <p className="muted">Add a description to highlight context.</p>}
          <div className="meta">
            {project.categoryIds.map((categoryId) => {
              const category = categories.find((item) => item.id === categoryId);
              return (
                <span key={categoryId} className="pill" style={{ background: category?.color || '#ced4da' }}>
                  {category?.name || 'Unknown'}
                </span>
              );
            })}
          </div>
          {project.links?.length > 0 && (
            <ul className="link-list">
              {project.links.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.label || link.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <div className="board-grid">
        <div className="board-columns">
          <div className="card task-form">
            <h2>Create task</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onCreateTask();
              }}
            >
              <label>
                Title
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(event) => onTaskFormChange({ ...taskForm, title: event.target.value })}
                  placeholder="Design onboarding flow"
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  rows="3"
                  value={taskForm.description}
                  onChange={(event) => onTaskFormChange({ ...taskForm, description: event.target.value })}
                  placeholder="Add acceptance criteria or background"
                />
              </label>
              <div className="grid">
                <label>
                  Category
                  <select
                    value={taskForm.categoryId}
                    onChange={(event) => onTaskFormChange({ ...taskForm, categoryId: event.target.value })}
                  >
                    <option value="">None</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select
                    value={taskForm.priority}
                    onChange={(event) => onTaskFormChange({ ...taskForm, priority: event.target.value })}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid">
                <label>
                  Assignee
                  <select
                    value={taskForm.assigneeId}
                    onChange={(event) => onTaskFormChange({ ...taskForm, assigneeId: event.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Due date
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(event) => onTaskFormChange({ ...taskForm, dueDate: event.target.value })}
                  />
                </label>
              </div>
              <fieldset>
                <legend>Tags</legend>
                <div className="checkbox-grid">
                  {tags.map((tag) => (
                    <label key={tag.id} className="checkbox">
                      <input
                        type="checkbox"
                        checked={taskForm.tagIds.includes(tag.id)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            onTaskFormChange({
                              ...taskForm,
                              tagIds: [...taskForm.tagIds, tag.id]
                            });
                          } else {
                            onTaskFormChange({
                              ...taskForm,
                              tagIds: taskForm.tagIds.filter((id) => id !== tag.id)
                            });
                          }
                        }}
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))}
                  {tags.length === 0 && <p className="muted">Create tags in Reference Data.</p>}
                </div>
              </fieldset>
              <fieldset>
                <legend>Links</legend>
                {taskForm.links.map((link, index) => (
                  <div key={link.id} className="link-row">
                    <input
                      type="text"
                      placeholder="Label"
                      value={link.label}
                      onChange={(event) => {
                        const next = taskForm.links.slice();
                        next[index] = { ...link, label: event.target.value };
                        onTaskFormChange({ ...taskForm, links: next });
                      }}
                    />
                    <input
                      type="url"
                      placeholder="https://"
                      value={link.url}
                      onChange={(event) => {
                        const next = taskForm.links.slice();
                        next[index] = { ...link, url: event.target.value };
                        onTaskFormChange({ ...taskForm, links: next });
                      }}
                    />
                    {taskForm.links.length > 1 && (
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          const next = taskForm.links.filter((item) => item.id !== link.id);
                          onTaskFormChange({ ...taskForm, links: next });
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {taskForm.links.length < 5 && (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() =>
                      onTaskFormChange({
                        ...taskForm,
                        links: [...taskForm.links, { id: createId(), label: '', url: '' }]
                      })
                    }
                  >
                    Add link
                  </button>
                )}
              </fieldset>
              <button type="submit" disabled={creatingTask}>
                {creatingTask ? 'Creating…' : 'Add task'}
              </button>
            </form>
          </div>

          <div className="board-columns-inner">
            {project.columns.map((column) => (
              <div
                key={column.id}
                className="board-column"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDropTask(event, column)}
              >
                <header>
                  <h3>{column.title}</h3>
                  <span className="badge">{groupedTasks[column.status]?.length || 0}</span>
                </header>
                <div className="column-body">
                  {groupedTasks[column.status]?.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={project}
                      categories={categories}
                      tags={tags}
                      users={users}
                      onUpdate={onUpdateTask}
                      onDelete={onDeleteTask}
                      onDragStart={onDragStartTask}
                    />
                  ))}
                  {(groupedTasks[column.status]?.length || 0) === 0 && (
                    <p className="muted">No tasks</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="board-sidebar">
          <div className="card">
            <h2>Project details</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onUpdateProject();
              }}
            >
              <label>
                Name
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(event) => onProjectFormChange({ ...projectForm, name: event.target.value })}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  rows="3"
                  value={projectForm.description}
                  onChange={(event) =>
                    onProjectFormChange({ ...projectForm, description: event.target.value })
                  }
                />
              </label>
              <fieldset>
                <legend>Categories</legend>
                <div className="checkbox-grid">
                  {categories.map((category) => (
                    <label key={category.id} className="checkbox">
                      <input
                        type="checkbox"
                        checked={projectForm.categoryIds.includes(category.id)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            onProjectFormChange({
                              ...projectForm,
                              categoryIds: [...projectForm.categoryIds, category.id]
                            });
                          } else {
                            onProjectFormChange({
                              ...projectForm,
                              categoryIds: projectForm.categoryIds.filter((id) => id !== category.id)
                            });
                          }
                        }}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Links</legend>
                {projectForm.links.map((link, index) => (
                  <div key={link.id} className="link-row">
                    <input
                      type="text"
                      placeholder="Label"
                      value={link.label}
                      onChange={(event) => {
                        const next = projectForm.links.slice();
                        next[index] = { ...link, label: event.target.value };
                        onProjectFormChange({ ...projectForm, links: next });
                      }}
                    />
                    <input
                      type="url"
                      placeholder="https://"
                      value={link.url}
                      onChange={(event) => {
                        const next = projectForm.links.slice();
                        next[index] = { ...link, url: event.target.value };
                        onProjectFormChange({ ...projectForm, links: next });
                      }}
                    />
                    {projectForm.links.length > 1 && (
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          const next = projectForm.links.filter((item) => item.id !== link.id);
                          onProjectFormChange({ ...projectForm, links: next });
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {projectForm.links.length < 5 && (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() =>
                      onProjectFormChange({
                        ...projectForm,
                        links: [...projectForm.links, { id: createId(), label: '', url: '' }]
                      })
                    }
                  >
                    Add link
                  </button>
                )}
              </fieldset>
              <button type="submit" disabled={savingProject}>
                {savingProject ? 'Saving…' : 'Save project'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Workflow</h2>
            <p className="muted">
              Rename, reorder or add columns. Ensure there is always a column with the Done status.
            </p>
            <ul className="column-list">
              {columnDraft.map((column, index) => (
                <li key={column.id}>
                  <div className="column-row">
                    <div className="column-fields">
                      <input
                        type="text"
                        value={column.title}
                        onChange={(event) => {
                          const next = columnDraft.slice();
                          next[index] = { ...column, title: event.target.value };
                          onColumnDraftChange(next);
                        }}
                      />
                      <input
                        type="text"
                        value={column.status}
                        onChange={(event) => {
                          const next = columnDraft.slice();
                          next[index] = {
                            ...column,
                            status: event.target.value.replace(/\s+/g, '_').toLowerCase()
                          };
                          onColumnDraftChange(next);
                        }}
                      />
                    </div>
                    <div className="column-actions">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          if (index === 0) {
                            return;
                          }
                          const next = columnDraft.slice();
                          const [removed] = next.splice(index, 1);
                          next.splice(index - 1, 0, removed);
                          onColumnDraftChange(next);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          if (index === columnDraft.length - 1) {
                            return;
                          }
                          const next = columnDraft.slice();
                          const [removed] = next.splice(index, 1);
                          next.splice(index + 1, 0, removed);
                          onColumnDraftChange(next);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          const next = columnDraft.filter((item) => item.id !== column.id);
                          if (!next.some((item) => item.status === 'done')) {
                            alert('Workflow must contain a Done column.');
                            return;
                          }
                          onColumnDraftChange(next);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="ghost"
              onClick={() =>
                onColumnDraftChange([
                  ...columnDraft,
                  {
                    id: createId(),
                    title: 'New column',
                    status: 'new_status'
                  }
                ])
              }
            >
              Add column
            </button>
            <button type="button" className="primary" onClick={onSaveColumns} disabled={savingColumns}>
              {savingColumns ? 'Saving…' : 'Save workflow'}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
};

const ReferenceView = ({
  categories,
  tags,
  categoryForm,
  onChangeCategoryForm,
  onCreateCategory,
  onDeleteCategory,
  tagForm,
  onChangeTagForm,
  onCreateTag,
  onDeleteTag
}) => (
  <section className="panel two-column">
    <div className="column">
      <div className="card">
        <h2>Categories</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onCreateCategory();
          }}
        >
          <label>
            Name
            <input
              type="text"
              value={categoryForm.name}
              onChange={(event) => onChangeCategoryForm({ ...categoryForm, name: event.target.value })}
              required
            />
          </label>
          <label>
            Color
            <input
              type="color"
              value={categoryForm.color}
              onChange={(event) => onChangeCategoryForm({ ...categoryForm, color: event.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              rows="2"
              value={categoryForm.description}
              onChange={(event) =>
                onChangeCategoryForm({ ...categoryForm, description: event.target.value })
              }
            />
          </label>
          <button type="submit">Add category</button>
        </form>
        <ul className="reference-list">
          {categories.map((category) => (
            <li key={category.id}>
              <span className="pill" style={{ background: category.color }} />
              <div>
                <strong>{category.name}</strong>
                {category.description && <span className="muted">{category.description}</span>}
              </div>
              <button type="button" className="ghost" onClick={() => onDeleteCategory(category.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
    <div className="column">
      <div className="card">
        <h2>Tags</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onCreateTag();
          }}
        >
          <label>
            Name
            <input
              type="text"
              value={tagForm.name}
              onChange={(event) => onChangeTagForm({ ...tagForm, name: event.target.value })}
              required
            />
          </label>
          <label>
            Description
            <textarea
              rows="2"
              value={tagForm.description}
              onChange={(event) => onChangeTagForm({ ...tagForm, description: event.target.value })}
            />
          </label>
          <button type="submit">Add tag</button>
        </form>
        <ul className="reference-list">
          {tags.map((tag) => (
            <li key={tag.id}>
              <div>
                <strong>#{tag.name}</strong>
                {tag.description && <span className="muted">{tag.description}</span>}
              </div>
              <button type="button" className="ghost" onClick={() => onDeleteTag(tag.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

const TeamView = ({ users, userForm, onChangeUserForm, onCreateUser }) => (
  <section className="panel two-column">
    <div className="column">
      <header className="panel-header">
        <div>
          <h1>Team directory</h1>
          <p className="muted">Invite collaborators and assign owners to every task.</p>
        </div>
      </header>
      <ul className="reference-list team">
        {users.map((user) => (
          <li key={user.id}>
            <div>
              <strong>{user.name}</strong>
              <span className="muted">{user.email}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
    <div className="column">
      <div className="card">
        <h2>Add teammate</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onCreateUser();
          }}
        >
          <label>
            Name
            <input
              type="text"
              value={userForm.name}
              onChange={(event) => onChangeUserForm({ ...userForm, name: event.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={userForm.email}
              onChange={(event) => onChangeUserForm({ ...userForm, email: event.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={userForm.password}
              onChange={(event) => onChangeUserForm({ ...userForm, password: event.target.value })}
              required
            />
          </label>
          <button type="submit">Create user</button>
        </form>
        <p className="muted small">
          Passwords are stored securely on the server. Share credentials privately with your teammate.
        </p>
      </div>
    </div>
  </section>
);

function App() {
  const [view, setView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashboardFilters, setDashboardFilters] = useState({
    projectId: '',
    categoryId: '',
    tagId: '',
    assigneeId: '',
    status: '',
    priority: '',
    search: ''
  });
  const [dashboardTasks, setDashboardTasks] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [creatingTask, setCreatingTask] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [projectDraft, setProjectDraft] = useState([]);
  const [savingColumns, setSavingColumns] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState(emptyProjectForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [tagForm, setTagForm] = useState(emptyTagForm);
  const [userForm, setUserForm] = useState(emptyUserForm);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const showError = (text) => {
    setError(text);
    setTimeout(() => setError(''), 4000);
  };

  const loadBaseData = async () => {
    try {
      const [projectsResponse, categoriesResponse, tagsResponse, usersResponse] = await Promise.all([
        fetchProjects(),
        fetchCategories(),
        fetchTags(),
        fetchUsers()
      ]);
      setProjects(projectsResponse.data);
      setCategories(categoriesResponse.data);
      setTags(tagsResponse.data);
      setUsers(usersResponse.data);
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
  };

  const loadDashboard = async (filters = dashboardFilters) => {
    try {
      setDashboardLoading(true);
      const response = await fetchDashboardTasks(filters);
      setDashboardTasks(response.data);
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadProjectDetail = async (projectId) => {
    try {
      setProjectLoading(true);
      const response = await fetchProjectDetail(projectId);
      setProjectDetail(response.data);
      setProjects((prev) =>
        prev.some((project) => project.id === response.data.project.id)
          ? prev.map((project) => (project.id === response.data.project.id ? response.data.project : project))
          : prev
      );
      setTaskForm({ ...emptyTaskForm, links: [{ id: createId(), label: '', url: '' }] });
      setProjectDraft(response.data.project.columns.map((column) => ({ ...column })));
      setProjectForm({
        name: response.data.project.name,
        description: response.data.project.description || '',
        categoryIds: response.data.project.categoryIds || [],
        links:
          response.data.project.links?.length > 0
            ? response.data.project.links.map((link) => ({ ...link }))
            : [{ id: createId(), label: '', url: '' }]
      });
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    } finally {
      setProjectLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    loadDashboard(dashboardFilters);
  }, [dashboardFilters.projectId, dashboardFilters.categoryId, dashboardFilters.tagId, dashboardFilters.assigneeId, dashboardFilters.status, dashboardFilters.priority, dashboardFilters.search]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetail(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleCreateProject = async () => {
    if (!newProjectForm.name.trim()) {
      showError('Project name is required');
      return;
    }
    try {
      setProjectsLoading(true);
      const payload = {
        ...newProjectForm,
        links: newProjectForm.links.filter((link) => link.url || link.label)
      };
      const response = await createProject(payload);
      showMessage('Project created');
      setProjects((prev) => [...prev, response.data]);
      setNewProjectForm({ ...emptyProjectForm, links: [{ id: createId(), label: '', url: '' }] });
      setSelectedProjectId(response.data.id);
      setView('project');
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      showError('Task title is required');
      return;
    }
    try {
      setCreatingTask(true);
      const payload = {
        ...taskForm,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
        links: taskForm.links.filter((link) => link.url || link.label)
      };
      const response = await createTask(selectedProjectId, payload);
      setProjectDetail((prev) => ({
        ...prev,
        tasks: [...prev.tasks, response.data]
      }));
      setTaskForm({ ...emptyTaskForm, links: [{ id: createId(), label: '', url: '' }] });
      showMessage('Task created');
      loadDashboard();
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await updateTask(taskId, updates);
      setProjectDetail((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) => (task.id === taskId ? response.data : task))
      }));
      loadDashboard();
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) {
      return;
    }
    try {
      await deleteTask(taskId);
      setProjectDetail((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((task) => task.id !== taskId)
      }));
      loadDashboard();
      showMessage('Task removed');
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
  };

  const handleDropTask = async (event, column) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    if (!taskId || !projectDetail) {
      return;
    }
    const targetTasks = projectDetail.tasks.filter((task) => task.status === column.status);
    try {
      await updateTask(taskId, { status: column.status, position: targetTasks.length });
      await loadProjectDetail(selectedProjectId);
      loadDashboard();
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
  };

  const handleDragStart = (event, task) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id);
  };

  const handleSaveColumns = async () => {
    if (!projectDetail) {
      return;
    }
    try {
      setSavingColumns(true);
      const response = await updateProject(projectDetail.project.id, { columns: projectDraft });
      setProjectDetail((prev) => ({
        ...prev,
        project: { ...prev.project, columns: response.data.columns }
      }));
      setProjectDraft(response.data.columns.map((column) => ({ ...column })));
      setProjects((prev) => prev.map((project) => (project.id === response.data.id ? response.data : project)));
      showMessage('Workflow updated');
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    } finally {
      setSavingColumns(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!projectDetail) {
      return;
    }
    if (!projectForm.name.trim()) {
      showError('Project name cannot be empty');
      return;
    }
    try {
      setSavingProject(true);
      const payload = {
        name: projectForm.name,
        description: projectForm.description,
        categoryIds: projectForm.categoryIds,
        links: projectForm.links.filter((link) => link.url || link.label)
      };
      const response = await updateProject(projectDetail.project.id, payload);
      setProjectDetail((prev) => ({
        ...prev,
        project: { ...prev.project, ...response.data }
      }));
      setProjects((prev) => prev.map((project) => (project.id === response.data.id ? response.data : project)));
      showMessage('Project updated');
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    } finally {
      setSavingProject(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      showError('Category name is required');
      return;
    }
    try {
      const response = await createCategory(categoryForm);
      setCategories((prev) => [...prev, response.data]);
      setCategoryForm(emptyCategoryForm);
      showMessage('Category created');
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? Tasks using it will be cleared.')) {
      return;
    }
    try {
      await deleteCategory(categoryId);
      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
      if (selectedProjectId) {
        loadProjectDetail(selectedProjectId);
      }
      loadDashboard();
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
  };

  const handleCreateTag = async () => {
    if (!tagForm.name.trim()) {
      showError('Tag name is required');
      return;
    }
    try {
      const response = await createTag(tagForm);
      setTags((prev) => [...prev, response.data]);
      setTagForm(emptyTagForm);
      showMessage('Tag created');
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Delete this tag?')) {
      return;
    }
    try {
      await deleteTag(tagId);
      setTags((prev) => prev.filter((tag) => tag.id !== tagId));
      if (selectedProjectId) {
        loadProjectDetail(selectedProjectId);
      }
      loadDashboard();
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password) {
      showError('Provide name, email and password');
      return;
    }
    try {
      const response = await createUser(userForm);
      setUsers((prev) => [...prev, response.data]);
      setUserForm(emptyUserForm);
      showMessage('User created');
    } catch (err) {
      showError(err.response?.data?.message || err.message);
    }
  };

  const content = () => {
    if (view === 'dashboard') {
      return (
        <DashboardView
          tasks={dashboardTasks}
          filters={dashboardFilters}
          onFilterChange={setDashboardFilters}
          projects={projects}
          categories={categories}
          tags={tags}
          users={users}
          loading={dashboardLoading}
        />
      );
    }
    if (view === 'projects') {
      return (
        <ProjectsView
          projects={projects}
          categories={categories}
          onCreateProject={handleCreateProject}
          onSelectProject={(projectId) => {
            setSelectedProjectId(projectId);
            setView('project');
          }}
          loading={projectsLoading}
          form={newProjectForm}
          onChangeForm={setNewProjectForm}
        />
      );
    }
    if (view === 'reference') {
      return (
        <ReferenceView
          categories={categories}
          tags={tags}
          categoryForm={categoryForm}
          onChangeCategoryForm={setCategoryForm}
          onCreateCategory={handleCreateCategory}
          onDeleteCategory={handleDeleteCategory}
          tagForm={tagForm}
          onChangeTagForm={setTagForm}
          onCreateTag={handleCreateTag}
          onDeleteTag={handleDeleteTag}
        />
      );
    }
    if (view === 'team') {
      return (
        <TeamView users={users} userForm={userForm} onChangeUserForm={setUserForm} onCreateUser={handleCreateUser} />
      );
    }
    if (view === 'project') {
      if (projectLoading || !projectDetail) {
        return (
          <section className="panel">
            <p>Loading project…</p>
          </section>
        );
      }
      return (
        <ProjectBoardView
          project={projectDetail.project}
          tasks={projectDetail.tasks}
          categories={categories}
          tags={tags}
          users={users}
          taskForm={taskForm}
          onTaskFormChange={setTaskForm}
          onCreateTask={handleCreateTask}
          creatingTask={creatingTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onDropTask={handleDropTask}
          onDragStartTask={handleDragStart}
          columnDraft={projectDraft}
          onColumnDraftChange={setProjectDraft}
          onSaveColumns={handleSaveColumns}
          savingColumns={savingColumns}
          onUpdateProject={handleUpdateProject}
          projectForm={projectForm}
          onProjectFormChange={setProjectForm}
          savingProject={savingProject}
        />
      );
    }
    return null;
  };

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        onChangeView={setView}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
      />
      <main>
        {(message || error) && (
          <div className={`toast ${error ? 'error' : 'success'}`}>{error || message}</div>
        )}
        {content()}
      </main>
    </div>
  );
}

export default App;
