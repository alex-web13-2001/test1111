import { useEffect, useMemo, useState } from 'react';
import { createTask, deleteTask, fetchTasks, updateTask } from './api.js';

const STATUSES = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

const emptyForm = {
  title: '',
  description: ''
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedTasks = useMemo(() => {
    return STATUSES.reduce((acc, status) => {
      acc[status.id] = tasks.filter((task) => task.status === status.id);
      return acc;
    }, {});
  }, [tasks]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data } = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await createTask({ ...form });
      setTasks((prev) => [...prev, data]);
      setForm(emptyForm);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (task, status) => {
    try {
      const { data } = await updateTask(task.id, { status });
      setTasks((prev) => prev.map((item) => (item.id === task.id ? data : item)));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Kanban Board</h1>
        <p>Track progress across To Do, In Progress and Done columns.</p>
      </header>

      <section className="new-task">
        <h2>Create a task</h2>
        <form onSubmit={handleCreateTask}>
          <div className="form-row">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Implement feature"
              value={form.title}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-row">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              placeholder="Add context for the assignee"
              value={form.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Add task'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <main>
        {loading ? (
          <p>Loading tasks…</p>
        ) : (
          <div className="board">
            {STATUSES.map((status) => (
              <div key={status.id} className="column">
                <h3>
                  {status.title}
                  <span className="badge">{groupedTasks[status.id]?.length || 0}</span>
                </h3>
                <div className="column-body">
                  {(groupedTasks[status.id] || []).map((task) => (
                    <article key={task.id} className="card">
                      <header>
                        <h4>{task.title}</h4>
                        <button type="button" onClick={() => handleDeleteTask(task.id)}>
                          ×
                        </button>
                      </header>
                      {task.description && <p>{task.description}</p>}
                      <footer>
                        <label htmlFor={`status-${task.id}`}>Status</label>
                        <select
                          id={`status-${task.id}`}
                          value={task.status}
                          onChange={(event) => handleStatusChange(task, event.target.value)}
                        >
                          {STATUSES.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.title}
                            </option>
                          ))}
                        </select>
                      </footer>
                    </article>
                  ))}
                  {(groupedTasks[status.id] || []).length === 0 && (
                    <p className="empty">No tasks</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
