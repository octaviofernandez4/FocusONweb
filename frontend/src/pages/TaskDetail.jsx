import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Paperclip, FileText } from 'lucide-react';
import { getTasks, updateTask } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { getTaskAccess, ESTADO_LABEL, PRIORIDAD_LABEL } from '../utils/taskAccess';
import { formatTamanio } from '../utils/fileSize';
import ReopenTaskModal from '../components/ReopenTaskModal';
import ApproveTaskModal from '../components/ApproveTaskModal';
import './TaskDetail.css';

const formatFechaHora = (fecha) => {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatActualizada = (fecha) => {
  if (!fecha) return '';
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (minutos < 60) return `Actualizada hace ${Math.max(minutos, 1)} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Actualizada hace ${horas} h`;
  return `Actualizada hace ${Math.floor(horas / 24)} d`;
};

const TaskDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(location.state?.task || null);
  const [isLoading, setIsLoading] = useState(!location.state?.task);
  const [modalReabrirAbierto, setModalReabrirAbierto] = useState(false);
  const [modalAprobarAbierto, setModalAprobarAbierto] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await getTasks();
      setTask(data.find((t) => t._id === id) || null);
    } catch (error) {
      console.error('Error al cargar la tarea:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Ojo: React Router no remonta el componente al navegar de una tarea a otra
  // (misma ruta, distinto :id) — hay que resincronizar "a mano" cada vez que
  // cambia el id, si no la tarea vieja queda pegada en el estado.
  useEffect(() => {
    if (location.state?.task && location.state.task._id === id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTask(location.state.task);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      cargar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) return <p className="empty-state">Cargando tarea…</p>;
  if (!task) return <p className="empty-state">No se encontró esa tarea.</p>;

  const { estado, esEmpresa, esAsignatario, puedeTocarCheck, esReapertura, tituloBoton } = getTaskAccess(task, user);

  // El botón solo lo ve la empresa (ver más abajo), así que acá solo hace
  // falta decidir cuál de los dos modales abrir: reabrir o aprobar.
  const handleAccion = () => {
    if (esReapertura) {
      setModalReabrirAbierto(true);
    } else {
      setModalAprobarAbierto(true);
    }
  };

  const handleReopenSubmit = async ({ nuevaFecha }) => {
    try {
      const { tarea } = await updateTask(task._id, {
        ...task,
        completed: false,
        pendingReview: false,
        dueDate: nuevaFecha,
      });
      setTask(tarea);
      setModalReabrirAbierto(false);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al reabrir la tarea');
    }
  };

  const handleApproveSubmit = async ({ qualityLevel, comentario }) => {
    try {
      const { tarea } = await updateTask(task._id, {
        ...task,
        completed: true,
        qualityLevel,
        completionComment: comentario,
      });
      setTask(tarea);
      setModalAprobarAbierto(false);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al aprobar la tarea');
    }
  };

  return (
    <div className="taskdetail-page">
      <div className="taskdetail-breadcrumb">
        <button className="icon-btn" title="Volver" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} />
        </button>
        <span>Proyectos</span>
        {task.project?.name && (
          <>
            <span>/</span>
            <span>{task.project.name}</span>
          </>
        )}
        <span>/</span>
        <span>Tarea-{task._id.slice(-4).toUpperCase()}</span>
      </div>

      <div className="taskdetail-body">
        <div className="taskdetail-main card-panel">
          <h1>{task.title}</h1>
          <div className="taskdetail-meta-row">
            <span className={`pill ${estado === 'review' ? 'pill-amber' : estado === 'completed' ? 'pill-emerald' : 'pill-neutral'}`}>
              {ESTADO_LABEL[estado]}
            </span>
            <span className="taskdetail-updated">{formatActualizada(task.updatedAt)}</span>
          </div>

          {task.description ? (
            <p className="taskdetail-description">{task.description}</p>
          ) : (
            <p className="taskdetail-description taskdetail-no-desc">Esta tarea no tiene descripción.</p>
          )}

          {task.attachments?.length > 0 && (
            <div className="taskdetail-attachments">
              <div className="taskdetail-attachments-header">
                <h2>Adjuntos ({task.attachments.length})</h2>
              </div>
              <div className="taskdetail-attachments-grid">
                {task.attachments.map((file) => (
                  <a
                    key={file.url || file.name}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="taskdetail-attachment"
                  >
                    <FileText size={18} />
                    <div>
                      <p>{file.name}</p>
                      <span>{formatTamanio(file.size)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="taskdetail-side">
          <div className="taskdetail-details card-panel">
            <h2>Detalles</h2>

            <div className="taskdetail-field">
              <span className="taskdetail-field-label">ASIGNADO A</span>
              <p className="taskdetail-field-value">
                {task.assignedTo?.name ? `${task.assignedTo.name} ${task.assignedTo.lastname || ''}` : 'Sin asignar'}
              </p>
            </div>

            <div className="taskdetail-field">
              <span className="taskdetail-field-label">FECHA LÍMITE</span>
              <p className="taskdetail-field-value">{formatFechaHora(task.dueDate)}</p>
            </div>

            <div className="taskdetail-field">
              <span className="taskdetail-field-label">PRIORIDAD</span>
              <span className={`pill ${task.priority === 'high' ? 'pill-rose' : task.priority === 'low' ? 'pill-neutral' : 'pill-sky'}`}>
                {PRIORIDAD_LABEL[task.priority] || 'MEDIA'}
              </span>
            </div>

            {task.project?.name && (
              <div className="taskdetail-field">
                <span className="taskdetail-field-label">PROYECTO</span>
                <p className="taskdetail-field-value">{task.project.name}</p>
              </div>
            )}
          </div>

          {(esEmpresa || esAsignatario) && (
            <div className="taskdetail-actions card-panel">
              {/* "Marcar como lista"/"Deshacer" solo vive en Mis tareas (con su confirmación);
                  acá el empleado solo puede ver el detalle y pedir aclaración. */}
              {esEmpresa && puedeTocarCheck && (
                <button className="btn-primary" onClick={handleAccion}>{tituloBoton}</button>
              )}
              <button className="btn-ghost" onClick={() => alert('Próximamente: solicitar aclaración')}>
                <Paperclip size={15} /> Solicitar aclaración
              </button>
            </div>
          )}
        </div>
      </div>

      <ReopenTaskModal
        isOpen={modalReabrirAbierto}
        onClose={() => setModalReabrirAbierto(false)}
        task={task}
        onSubmit={handleReopenSubmit}
      />

      <ApproveTaskModal
        isOpen={modalAprobarAbierto}
        onClose={() => setModalAprobarAbierto(false)}
        task={task}
        onSubmit={handleApproveSubmit}
      />
    </div>
  );
};

export default TaskDetail;
