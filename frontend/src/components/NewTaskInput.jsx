import { useState } from 'react';
import { Plus } from 'lucide-react';
import DateChip from './DateChip';
import './NewTaskInput.css';

const todayISO = () => new Date().toISOString().slice(0, 10);

// Alta rápida de tareas: solo título + fecha (chip). Para descripción/proyecto/prioridad
// se edita después desde la tarea ya creada — mantiene esta barra de un solo renglón.
const NewTaskInput = ({ onCreate }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayISO());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onCreate({ title: title.trim(), dueDate });
    setTitle('');
  };

  return (
    <form className="new-task-input" onSubmit={handleSubmit}>
      <button type="submit" className="icon-btn new-task-submit" aria-label="Agregar tarea">
        <Plus size={18} />
      </button>
      <input
        type="text"
        placeholder="Agregar una tarea nueva…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <DateChip value={dueDate} onChange={setDueDate} />
    </form>
  );
};

export default NewTaskInput;
