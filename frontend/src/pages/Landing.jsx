import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ArrowRight, PlayCircle, Users, Layers, Gauge } from 'lucide-react';
import logo from '../assets/focusonweb-logo.png';
import './Landing.css';

const previewTasks = [
  { title: 'Cerrar la estrategia Q3', tag: 'Trabajo', tagColor: 'indigo', priority: 'Alta prioridad', done: false, meta: 'Vence hoy, 14:00' },
  { title: 'Revisar el sistema de diseño', tag: 'Diseño', tagColor: 'pink', priority: null, done: true, meta: 'Completada a las 10:15' },
  { title: 'Preparar la sync semanal', tag: 'Reunión', tagColor: 'rose', priority: null, done: false, meta: 'Vence mañana' },
];

const features = [
  {
    icon: Users,
    title: 'Pensado para equipos',
    text: 'Organizá el trabajo de tu empresa en un solo lugar: proyectos, tareas y responsables, todo compartido y en tiempo real.',
  },
  {
    icon: Layers,
    title: 'Proyectos a tu manera',
    text: 'Agrupá tareas en proyectos con color propio. Cada equipo ve solo lo que le importa, sin perder el panorama general.',
  },
  {
    icon: Gauge,
    title: 'Progreso real',
    text: 'Estadísticas de cumplimiento, tareas perdidas y racha semanal para saber exactamente cómo avanza tu equipo.',
  },
];

const Landing = () => {
  return (
    <div className="landing">
      <header className="landing-nav-wrapper">
        <div className="landing-nav">
          <div className="landing-logo">
            <img src={logo} alt="FocusOnWeb" />
            <span>FocusOnWeb</span>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="btn-ghost landing-nav-btn">Iniciar sesión</Link>
            <Link to="/register" className="btn-primary landing-cta-small">Registrarse</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <motion.div
            className="landing-hero-copy"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>
              Dominá tu día con <span className="gradient-text">FocusOnWeb</span>
            </h1>
            <p>
              La forma moderna de organizar el trabajo de tu equipo. Menos reuniones para saber
              "quién hace qué", más foco real en lo que importa hoy.
            </p>
            <div className="landing-hero-actions">
              <Link to="/register" className="btn-primary landing-cta">
                Comenzar gratis <ArrowRight size={18} />
              </Link>
              <a href="#funciones" className="btn-ghost landing-cta">
                <PlayCircle size={18} /> Ver funciones
              </a>
            </div>
          </motion.div>

          <motion.div
            className="landing-hero-preview"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {previewTasks.map((task) => (
              <div key={task.title} className={`landing-preview-card ${task.done ? 'is-done' : ''}`}>
                <div className="landing-preview-status">
                  {task.done ? <CheckCircle2 size={20} className="icon-success" /> : <Circle size={20} className="icon-muted" />}
                </div>
                <div className="landing-preview-body">
                  <p className={`landing-preview-title ${task.done ? 'is-done' : ''}`}>{task.title}</p>
                  <span className="landing-preview-meta">{task.meta}</span>
                  <div className="landing-preview-tags">
                    <span className={`pill pill-${task.tagColor}`}>{task.tag.toUpperCase()}</span>
                    {task.priority && <span className="pill pill-neutral">{task.priority.toUpperCase()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        <section id="funciones" className="landing-flow">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
          >
            Diseñado para el flujo de tu equipo
          </motion.h2>
          <p className="landing-flow-subtitle">
            Cada detalle está pensado para no interponerse en tu trabajo, y estar ahí cuando lo necesitás.
          </p>

          <div className="landing-features">
            {features.map(({ icon: Icon, title, text }, i) => (
              <motion.div
                key={title}
                className="landing-feature-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="landing-feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="precios" className="landing-cta-section">
          <h2>Empezá gratis, escalá cuando tu equipo crezca</h2>
          <p>Creá tu organización en segundos e invitá a tu equipo con un link.</p>
          <Link to="/register" className="btn-primary landing-cta">
            Crear mi organización <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <footer id="comunidad" className="landing-footer">
        <span>© {new Date().getFullYear()} FocusOnWeb</span>
        <div className="landing-footer-links">
          <Link to="/login">Ingresar</Link>
          <Link to="/register">Comenzar</Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
