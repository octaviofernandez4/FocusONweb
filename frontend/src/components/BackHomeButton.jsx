import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackHomeButton.css';

const BackHomeButton = () => (
  <Link to="/" className="back-home-btn">
    <ArrowLeft size={16} /> Volver al inicio
  </Link>
);

export default BackHomeButton;
