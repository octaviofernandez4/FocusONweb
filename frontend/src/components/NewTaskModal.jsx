import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, UploadCloud, FileText, X, Loader2, AlertTriangle } from 'lucide-react';
import { createTask } from '../services/taskService';
import { uploadFile } from '../services/uploadService';
import { taskAssignSchema } from '../schemas/taskAssignSchema';
import { useOrg } from '../hooks/useOrg';
import { formatTamanio } from '../utils/fileSize';
import { esFechaPasada } from '../utils/dateHelpers';
import Modal from './Modal';
import AlertModal from './AlertModal';
import TaskCreatedModal from './TaskCreatedModal';
import './NewTaskModal.css';

const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'application/pdf'];
const TAMANIO_MAXIMO = 10 * 1024 * 1024; // 10MB

// Modal de "Asignar Nueva Tarea" — reemplaza el input inline de creación rápida.
// Solo lo usan cuentas empresa (la ruta del backend también lo exige).
const NewTaskModal = ({ isOpen, onClose, onCreated, defaultProjectId }) => {
  const { projects } = useOrg();
  const fileInputRef = useRef(null);

  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [fechaInvalida, setFechaInvalida] = useState(false);
  const [tareaCreada, setTareaCreada] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskAssignSchema)
  });

  useEffect(() => {
    if (isOpen) {
      reset({ assignedToEmail: '', title: '', description: '', priority: 'medium', dueDate: '', project: defaultProjectId || '' });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAttachments([]);
      setUploadError('');
    }
  }, [isOpen, defaultProjectId, reset]);

  const subirArchivos = async (files) => {
    setUploadError('');
    for (const file of files) {
      if (!TIPOS_PERMITIDOS.includes(file.type)) {
        setUploadError('Solo se permiten archivos PNG, JPG o PDF');
        continue;
      }
      if (file.size > TAMANIO_MAXIMO) {
        setUploadError('Cada archivo puede pesar hasta 10MB');
        continue;
      }
      setIsUploading(true);
      try {
        const subido = await uploadFile(file);
        setAttachments((prev) => [...prev, subido]);
      } catch (error) {
        console.error(error);
        setUploadError(error.response?.data?.mensaje || 'Hubo un error al subir el archivo');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) subirArchivos(files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) subirArchivos(files);
  };

  const quitarAdjunto = (url) => setAttachments((prev) => prev.filter((a) => a.url !== url));

  const onSubmit = async (data) => {
    if (esFechaPasada(data.dueDate)) {
      setFechaInvalida(true);
      return;
    }
    try {
      const { tarea } = await createTask({
        title: data.title,
        description: data.description || undefined,
        priority: data.priority || undefined,
        // "2026-07-30" a secas se interpreta como medianoche UTC — en Argentina (UTC-3)
        // eso cae en "29/7 21:00" local, o sea "ayer". Le sumamos la hora para que la
        // fecha se arme en horario local y una tarea para hoy quede para hoy.
        dueDate: data.dueDate ? new Date(`${data.dueDate}T23:59:59`).toISOString() : undefined,
        assignedToEmail: data.assignedToEmail,
        project: data.project || undefined,
        attachments
      });
      await onCreated();
      onClose();
      setTareaCreada(tarea);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.mensaje || 'Hubo un error al asignar la tarea');
    }
  };

  const nombreAsignado = tareaCreada?.assignedTo?.name
    ? `${tareaCreada.assignedTo.name} ${tareaCreada.assignedTo.lastname || ''}`.trim()
    : null;

  return (
    <>
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
          <label>Prioridad</label>
          <select {...register('priority')} className="new-task-modal-select">
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
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
          <div
            className={`new-task-modal-dropzone ${isDragging ? 'is-dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              multiple
              hidden
              onChange={handleFileInputChange}
            />
            {isUploading ? <Loader2 size={28} className="new-task-modal-spinner" /> : <UploadCloud size={28} />}
            <p><strong>{isUploading ? 'Subiendo…' : 'Subí un archivo'}</strong> o arrastrá y soltá</p>
            <span>PNG, JPG, PDF hasta 10MB</span>
          </div>
          {uploadError && <span className="error-text">{uploadError}</span>}

          {attachments.length > 0 && (
            <div className="new-task-modal-attachments">
              {attachments.map((a) => (
                <div key={a.url} className="new-task-modal-attachment">
                  <FileText size={16} />
                  <div className="new-task-modal-attachment-info">
                    <p>{a.name}</p>
                    <span>{formatTamanio(a.size)}</span>
                  </div>
                  <button type="button" className="icon-btn icon-btn-danger" onClick={() => quitarAdjunto(a.url)} title="Quitar">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="new-task-modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary new-task-modal-submit" disabled={isSubmitting || isUploading}>
            {isSubmitting ? 'Asignando…' : 'Asignar Tarea'}
          </button>
        </div>
      </form>
    </Modal>

    <AlertModal
      isOpen={fechaInvalida}
      onClose={() => setFechaInvalida(false)}
      icon={AlertTriangle}
      title="Fecha inválida"
      buttonLabel="CORREGIR FECHA"
    >
      <p className="alert-modal-error">Error: no podés seleccionar una fecha que ya pasó.</p>
      <p>Para mantener la integridad del proyecto y asegurar un seguimiento preciso, los plazos de las tareas deben establecerse en fechas futuras.</p>
    </AlertModal>

    <TaskCreatedModal
      isOpen={!!tareaCreada}
      onClose={() => setTareaCreada(null)}
      assigneeName={nombreAsignado}
    />
    </>
  );
};

export default NewTaskModal;
