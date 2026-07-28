import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProject, updateProject } from '../services/projectService';
import { projectSchema } from '../schemas/projectSchema';
import { PROJECT_COLOR_KEYS, nextProjectColor, getProjectColor } from '../utils/projectColors';
import Modal from './Modal';
import './NewProjectModal.css';

// Modal de crear/editar proyecto. Si se pasa `project`, edita ese proyecto;
// si no, crea uno nuevo (con un color sugerido en round-robin).
const NewProjectModal = ({ isOpen, onClose, onSaved, project, existingCount = 0 }) => {
  const isEditing = Boolean(project);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(projectSchema)
  });

  useEffect(() => {
    if (isOpen) {
      reset({ name: project?.name || '', color: project?.color || nextProjectColor(existingCount) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, project]);

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await updateProject(project._id, data);
      } else {
        await createProject(data);
      }
      await onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al guardar el proyecto');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar proyecto' : 'Nuevo proyecto'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Nombre</label>
          <input type="text" placeholder="Ej: Marketing" {...register('name')} className={errors.name ? 'input-error' : ''} />
          <span className="error-text">{errors.name?.message}</span>
        </div>

        <div className="form-group">
          <label>Color</label>
          <div className="color-picker">
            {PROJECT_COLOR_KEYS.map((key) => (
              <label key={key} className="color-swatch-label">
                <input type="radio" value={key} {...register('color')} />
                <span className="color-swatch" style={{ background: getProjectColor(key).dot }} />
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear proyecto'}
        </button>
      </form>
    </Modal>
  );
};

export default NewProjectModal;
