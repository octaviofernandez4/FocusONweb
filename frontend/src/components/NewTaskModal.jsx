import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, UploadCloud } from 'lucide-react';
import { createTask } from '../services/taskService';
import { taskAssignSchema } from '../schemas/taskAssignSchema';
import { useOrg } from '../hooks/useOrg';
import Modal from './Modal';
import './NewTaskModal.css';

// Modal de "Asignar Nueva Tarea" — reemplaza el input inline de creación rápida.
// Solo lo usan cuentas empresa (la ruta del backend también lo exige).
const NewTaskModal = ({ isOpen, onClose, onCreated, defaultProjectId }) => {
  const { projects } = useOrg();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskAssignSchema)
  });

  useEffect(() => {
    if (isOpen) {
      reset({ assignedToEmail: '', title: '', description: '', dueDate: '', project: defaultProjectId || '' });
    }
  }, [isOpen, defaultProjectId, reset]);

  const onSubmit = async (data) => {
    try {
      await createTask({
        title: data.title,
        description: data.description || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        assignedToEmail: data.assignedToEmail,
        project: data.project || undefined
      });
      await onCreated();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al asignar la tarea');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar Nueva Tarea" size="lg">
      <p className="new-task-modal-subtitle">Configurá los detalles de la tarea para tu equipo.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="new-task-modal-form">
        <div className="form-group">
          <label>Asignar a (email)</label>
          <div className={`input-with-icon ${errors.assignedToEmail ? 'input-error' : ''}`}>
            <Mail size={17} />
            <input type="email" placeholder="ejemplo@empresa.com" {...register('assignedToEmail')} />
          </div>
          <span className="error-text">{errors.assignedToEmail?.message}</span>
        </div>

        <div className="form-group">
          <label>Título de la tarea</label>
          <input type="text" placeholder="Ej. Preparar reporte trimestral" {...register('title')} className={errors.title ? 'input-error' : ''} />
          <span className="error-text">{errors.title?.message}</span>
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea rows={3} placeholder="Detalles de la tarea…" {...register('description')} className="new-task-modal-textarea" />
        </div>

        <div className="form-group">
          <label>Fecha de entrega</label>
          <input type="date" {...register('dueDate')} />
        </div>

        {projects.length > 0 && (
          <div className="form-group">
            <label>Proyecto</label>
            <select {...register('project')} className="new-task-modal-select">
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Adjuntar archivos o fotos</label>
          <div className="new-task-modal-dropzone" title="Todavía no disponible">
            <UploadCloud size={28} />
            <p><strong>Subir un archivo</strong> — función en desarrollo</p>
            <span>PNG, JPG, PDF hasta 10MB (próximamente)</span>
          </div>
        </div>

        <div className="new-task-modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary new-task-modal-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Asignando…' : 'Asignar Tarea'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewTaskModal;
