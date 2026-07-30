import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getTasks, updateTask, deleteTask } from '../services/taskService';
import { deleteProject } from '../services/projectService';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { getProjectColor } from '../utils/projectColors';
import TaskCard from '../components/TaskCard';
import NewTaskModal from '../components/NewTaskModal';
import NewProjectModal from '../components/NewProjectModal';
import './Projects.css';

const Projects = () => {
  const { user } = useAuth();
  const { isAdmin, projects, refreshOrg } = useOrg();
  const esEmpresa = user?.accountType === 'empresa';
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const cargarTareas = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTareas();
  }, [cargarTareas]);

  const tareasPorProyecto = (projectId) => tasks.filter((t) => (t.project?._id || t.project) === projectId);

  const proyectoSeleccionado = projects.find((p) => p._id === selectedId) || null;
  const tareasFiltradas = proyectoSeleccionado ? tareasPorProyecto(proyectoSeleccionado._id) : tasks;

  const seleccionarProyecto = (projectId) => {
    setSearchParams(projectId ? { id: projectId } : {});
  };

  const abrirEdicion = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const abrirCreacion = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEliminarProyecto = async (project) => {
    if (!window.confirm(`¿Borrar el proyecto "${project.name}"? Solo se puede si no tiene tareas.`)) return;
    try {
      await deleteProject(project._id);
      if (selectedId === project._id) seleccionarProyecto(null);
      await refreshOrg();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al borrar el proyecto');
    }
  };

  const handleToggle = async (task) => {
    try {
      const payload = esEmpresa
        ? { ...task, completed: !task.completed }
        : { ...task, pendingReview: !task.pendingReview };
      await updateTask(task._id, payload);
      await cargarTareas();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al actualizar la tarea');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      await cargarTareas();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al eliminar la tarea');
    }
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Proyectos</h1>
          <p className="page-subtitle">Organizá las tareas de tu equipo por proyecto.</p>
        </div>
        <div className="projects-header-actions">
          {esEmpresa && (
            <>
              <button className="btn-primary projects-new-btn" onClick={() => setIsTaskModalOpen(true)}>
                <Plus size={16} /> Asignar Nueva Tarea
              </button>
              <button className="btn-ghost projects-new-btn" onClick={abrirCreacion}>
                <Plus size={16} /> Nuevo proyecto
              </button>
            </>
          )}
        </div>
      </div>

      <div className="projects-chips">
        <button
          className={`project-chip ${!proyectoSeleccionado ? 'is-active' : ''}`}
          onClick={() => seleccionarProyecto(null)}
        >
          Todas ({tasks.length})
        </button>
        {projects.map((project) => {
          const color = getProjectColor(project.color);
          const count = tareasPorProyecto(project._id).length;
          return (
            <div key={project._id} className={`project-chip-wrapper ${proyectoSeleccionado?._id === project._id ? 'is-active' : ''}`}>
              <button className="project-chip" onClick={() => seleccionarProyecto(project._id)}>
                <span className="project-chip-dot" style={{ background: color.dot }} />
                {project.name} ({count})
              </button>
              {isAdmin && (
                <div className="project-chip-actions">
                  <button className="icon-btn" title="Editar proyecto" onClick={() => abrirEdicion(project)}>
                    <Pencil size={13} />
                  </button>
                  <button className="icon-btn icon-btn-danger" title="Borrar proyecto" onClick={() => handleEliminarProyecto(project)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <p className="empty-state">Cargando tareas…</p>
      ) : tareasFiltradas.length === 0 ? (
        <p className="empty-state">No hay tareas en este proyecto todavía.</p>
      ) : (
        <div className="projects-grid">
          {tareasFiltradas.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onDelete={handleDelete}
              onToggleComplete={handleToggle}
            />
          ))}
        </div>
      )}

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={refreshOrg}
        project={editingProject}
        existingCount={projects.length}
      />

      {esEmpresa && (
        <NewTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onCreated={cargarTareas}
          defaultProjectId={proyectoSeleccionado?._id}
        />
      )}
    </div>
  );
};

export default Projects;
