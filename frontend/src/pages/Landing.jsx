import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import '@fontsource/geist-sans/800.css';
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  Layers,
  Kanban,
  Users,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  Timer,
  AlertTriangle,
  Search,
  Menu,
  X,
} from 'lucide-react';
import logo from '../assets/focusonweb-logo.png';
import { usePageTitle } from '../hooks/usePageTitle';
import './Landing.css';

const DEPT_COLORS = {
  Marketing: '#fb7185',
  Operaciones: '#fbbf24',
  'Recursos Humanos': '#34d399',
  Tecnología: '#4f9dff',
  Comercial: '#38bdf8',
  Producto: '#38bdf8',
};

const departamentos = [
  { name: 'Marketing', count: 3 },
  { name: 'Operaciones', count: 5 },
  { name: 'Recursos Humanos', count: 4 },
  { name: 'Tecnología', count: 7, active: true },
  { name: 'Comercial', count: 2 },
];

const sidebarStats = [
  { icon: CheckCircle2, label: 'Cumplimiento', value: '94%' },
  { icon: Timer, label: 'En curso', value: '12' },
  { icon: AlertTriangle, label: 'Vencidas', value: '2' },
];

const boardColumns = [
  {
    label: 'Por hacer',
    count: 4,
    tasks: [
      { dept: 'Marketing', urgent: true, title: 'Cerrar la estrategia Q3', person: 'Luz Medina', initials: 'LM', time: 'Hoy 14:00', overdue: true },
      { dept: 'Operaciones', title: 'Auditoría de inventario', person: 'Franco Ferrer', initials: 'FF', time: 'Mañana' },
      { dept: 'Recursos Humanos', title: 'Onboarding de 3 ingresos', person: 'Miguel Sosa', initials: 'MS', time: 'Jue 09:00' },
    ],
  },
  {
    label: 'En progreso',
    count: 3,
    tasks: [
      { dept: 'Tecnología', title: 'Migrar la base de clientes', person: 'Ana Ríos', initials: 'AR', time: 'Vie 18:00' },
      { dept: 'Producto', title: 'Revisar sistema de diseño', person: 'Nico Paz', initials: 'NP', time: 'Vie 12:00' },
    ],
    dropHint: true,
  },
  {
    label: 'Completadas',
    count: 9,
    tasks: [
      { dept: 'Comercial', title: 'Reporte semestral de ventas', person: 'Luz Medina', initials: 'LM', time: '10:15', done: true },
      { dept: 'Operaciones', title: 'Alta de proveedores', person: 'Franco Ferrer', initials: 'FF', time: 'Ayer', done: true },
    ],
  },
];

const clientLogos = ['NORTEX', 'Vialta', 'GRUPO ANDES', 'Meridian', 'Cotelar', 'ZENIT LOGÍSTICA'];

const statsBar = [
  { value: '-64%', title: 'Menos reuniones de seguimiento', hint: 'Promedio en los primeros 90 días' },
  { value: '94%', title: 'Tareas cerradas en fecha', hint: 'Contra 71% antes de migrar' },
  { value: '8 min', title: 'Para armar un proyecto nuevo', hint: 'Con responsables y fechas cargadas' },
  { value: '+3.200', title: 'Equipos operando en la plataforma', hint: 'Pymes y empresas de la región' },
];

const deptProgress = [
  { name: 'Marketing', pct: 78 },
  { name: 'Operaciones', pct: 54 },
  { name: 'Tecnología', pct: 91 },
  { name: 'Comercial', pct: 36 },
];

const employeeLoad = [
  { initials: 'LM', name: 'Luz Medina', count: 4, pct: 55 },
  { initials: 'FF', name: 'Franco Ferrer', count: 7, pct: 95, over: true },
  { initials: 'AR', name: 'Ana Ríos', count: 3, pct: 40 },
];

const chartBars = [30, 42, 26, 55, 38, 34, 88, 92];

const roles = [
  { name: 'Administrador', scope: 'Toda la organización' },
  { name: 'Líder de área', scope: 'Su departamento' },
  { name: 'Colaborador', scope: 'Sus tareas asignadas' },
];

const notifications = [
  { tone: 'danger', label: 'VENCIDA', title: '2 tareas vencieron en Operaciones', meta: 'hace 3 horas · aviso al líder de área' },
  { tone: 'electric', label: 'POR VENCER', title: 'Auditoría de inventario vence en 6 horas', meta: 'Franco Ferrer · recordatorio enviado' },
  { tone: 'electric', label: 'ACTIVIDAD', title: 'Ana Ríos movió 3 tareas a completadas', meta: 'hoy 11:40 · queda en el historial' },
];

const testimonials = [
  {
    quote: '"Teníamos cinco planillas y un grupo de WhatsApp por departamento. Hoy entro al tablero y en treinta segundos sé qué está trabado y de quién depende."',
    name: 'Carolina Vidal',
    role: 'Directora de Operaciones, Grupo Andes',
    badge: '148 empleados',
    initials: 'CV',
  },
  {
    quote: '"Lo que más cambió fue la reunión de los lunes: pasó de una hora de actualizaciones a quince minutos de decisiones."',
    name: 'Martín Duarte',
    role: 'Gerente General, Zenit Logística',
    badge: '6 sedes',
    initials: 'MD',
  },
];

const plans = [
  {
    name: 'EQUIPO',
    price: 'Gratis',
    priceHint: 'Hasta 10 personas',
    desc: 'Para empezar a ordenar el trabajo de un área.',
    features: ['Proyectos y departamentos ilimitados', 'Tablero Kanban con asignaciones', 'Fechas de vencimiento y alertas'],
    cta: 'Crear organización',
    to: '/register',
  },
  {
    name: 'EMPRESA',
    badge: 'MÁS ELEGIDO',
    price: 'US$ 6',
    priceHint: 'por usuario / mes',
    desc: 'Para compañías con varios departamentos y líderes de área.',
    features: [
      'Todo lo del plan Equipo',
      'Roles y permisos por departamento',
      'Reportes de cumplimiento y exportación',
      'Historial de cambios auditable',
      'Soporte prioritario en español',
    ],
    cta: 'Empezar 14 días gratis',
    to: '/register',
    highlighted: true,
  },
  {
    name: 'CORPORATIVO',
    price: 'A medida',
    priceHint: 'Más de 250 usuarios',
    desc: 'Para operaciones multi-sede con requisitos de seguridad.',
    features: ['Todo lo del plan Empresa', 'Inicio de sesión único (SSO)', 'Onboarding y capacitación dedicada', 'Acuerdo de nivel de servicio'],
    cta: 'Hablar con ventas',
    href: 'mailto:ventas@focusonweb.app',
  },
];

const footerColumns = {
  Producto: [
    { label: 'Tablero Kanban', href: '#producto' },
    { label: 'Departamentos', href: '#producto' },
    { label: 'Reportes', href: '#resultados' },
  ],
  Empresa: [
    { label: 'Sobre nosotros', href: '#soluciones' },
    { label: 'Clientes', href: '#soluciones' },
    { label: 'Contacto', href: 'mailto:hola@focusonweb.app' },
  ],
  Legal: [
    { label: 'Términos del servicio', href: '#' },
    { label: 'Política de privacidad', href: '#' },
    { label: 'Seguridad', href: '#' },
  ],
};

const TaskChip = ({ task }) => (
  <div className={`preview-task ${task.done ? 'is-done' : ''}`}>
    <div className="preview-task-tags">
      <span className="preview-task-dept" style={{ color: DEPT_COLORS[task.dept] }}>
        {task.dept.toUpperCase()}
      </span>
      {task.urgent && <span className="preview-task-urgent">URGENTE</span>}
    </div>
    <p className={`preview-task-title ${task.done ? 'is-done' : ''}`}>{task.title}</p>
    <div className="preview-task-footer">
      <span className="preview-task-avatar">{task.initials}</span>
      <span className="preview-task-person">{task.person}</span>
      <span className={`preview-task-time ${task.overdue ? 'is-overdue' : ''}`}>{task.time}</span>
    </div>
  </div>
);

const Landing = () => {
  usePageTitle();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="landing">
      <header className="landing-nav-wrapper">
        <div className="landing-nav">
          <div className="landing-logo">
            <img src={logo} alt="FocusOnWeb" />
            <span>FocusOn<span className="landing-logo-accent">Web</span></span>
          </div>
          <nav className="landing-nav-links">
            <a href="#producto">Producto</a>
            <a href="#soluciones">Soluciones</a>
            <a href="#resultados">Resultados</a>
            <a href="#planes">Planes</a>
          </nav>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-nav-login">Iniciar sesión</Link>
            <Link to="/register" className="landing-nav-cta">Empezar gratis</Link>
          </div>
          <button
            className="landing-nav-hamburger"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="landing-mobile-menu">
          <div className="landing-mobile-menu-header">
            <div className="landing-logo">
              <img src={logo} alt="FocusOnWeb" />
              <span>FocusOn<span className="landing-logo-accent">Web</span></span>
            </div>
            <button className="landing-nav-hamburger" onClick={closeMenu} aria-label="Cerrar menú">
              <X size={22} />
            </button>
          </div>
          <nav className="landing-mobile-menu-links">
            <a href="#producto" onClick={closeMenu}>Producto</a>
            <a href="#soluciones" onClick={closeMenu}>Soluciones</a>
            <a href="#resultados" onClick={closeMenu}>Resultados</a>
            <a href="#planes" onClick={closeMenu}>Planes</a>
          </nav>
          <div className="landing-mobile-menu-actions">
            <Link to="/login" className="landing-btn-ghost" onClick={closeMenu}>Iniciar sesión</Link>
            <Link to="/register" className="landing-btn-primary" onClick={closeMenu}>Empezar gratis</Link>
          </div>
        </div>
      )}

      <main>
        <section className="landing-hero">
          <motion.div
            className="landing-hero-left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="landing-badge">
              <span className="landing-badge-dot" />
              Plataforma de gestión operativa para empresas
            </span>
            <h1>
              Toda tu <span className="gradient-text">empresa</span>
              <br />
              trabajando en
              <br />
              foco.
            </h1>
            <div className="landing-hero-actions">
              <Link to="/register" className="landing-btn-primary">
                Crear mi organización <ArrowRight size={18} />
              </Link>
              <a href="#producto" className="landing-btn-ghost">Ver el tablero en vivo</a>
            </div>
          </motion.div>

          <motion.div
            className="landing-hero-right"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p>
              FocusOnWeb centraliza departamentos, proyectos y responsables en un solo tablero.
              Sin planillas paralelas, sin reuniones para saber quién hace qué.
            </p>
            <div className="landing-logos-strip">
              <span className="landing-logos-label">Equipos que ya operan con FocusOnWeb</span>
              <div className="landing-logos-row">
                {clientLogos.map((name) => (
                  <span key={name}>{name}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <div className="landing-bullets-row">
          <div className="landing-bullet">
            <ShieldCheck size={17} className="icon-electric" />
            Permisos por departamento y auditoría de cambios
          </div>
          <div className="landing-bullet">
            <Building2 size={17} className="icon-electric" />
            Multi-sede y multi-equipo desde el plan gratuito
          </div>
        </div>

        <motion.div
          id="producto"
          className="landing-preview-window"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <div className="preview-chrome">
            <span className="preview-chrome-dot" />
            <span className="preview-chrome-dot" />
            <span className="preview-chrome-dot" />
            <div className="preview-chrome-url"><Search size={13} /> focusonweb.app/tablero/acme-sa</div>
          </div>

          <div className="preview-body">
            <aside className="preview-sidebar">
              <span className="preview-sidebar-label">Departamentos</span>
              <div className="preview-dept-list">
                {departamentos.map((dept) => (
                  <div key={dept.name} className={`preview-dept-row ${dept.active ? 'is-active' : ''}`}>
                    <span className="preview-dept-dot" style={{ background: DEPT_COLORS[dept.name] }} />
                    <span className="preview-dept-name">{dept.name}</span>
                    <span className="preview-dept-count">{dept.count}</span>
                  </div>
                ))}
              </div>
              <div className="preview-sidebar-stats">
                {sidebarStats.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="preview-sidebar-stat">
                    <span className="preview-sidebar-stat-label"><Icon size={14} /> {label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </aside>

            <div className="preview-board">
              {boardColumns.map((col) => (
                <div key={col.label} className="preview-board-col">
                  <div className="preview-board-col-header">
                    <strong>{col.label}</strong>
                    <span>{col.count} tareas</span>
                  </div>
                  {col.tasks.map((task) => (
                    <TaskChip key={task.title} task={task} />
                  ))}
                  {col.dropHint && <div className="preview-drop-hint">Soltar tarea acá</div>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.section
          id="resultados"
          className="landing-stats-bar"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          {statsBar.map((stat) => (
            <div key={stat.title} className="landing-stat-block">
              <strong>{stat.value}</strong>
              <p>{stat.title}</p>
              <span>{stat.hint}</span>
            </div>
          ))}
        </motion.section>

        <section className="landing-flow">
          <span className="landing-section-label">La plataforma</span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
          >
            Del organigrama a la tarea, sin perder el hilo.
          </motion.h2>
          <p className="landing-flow-subtitle">
            Cada departamento tiene su espacio, cada persona su carga de trabajo y la dirección un
            panorama consolidado en tiempo real.
          </p>

          <div className="landing-bento">
            <div className="bento-row bento-row-top">
              <motion.div
                className="bento-card bento-card-wide"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bento-card-icon"><Layers size={20} /></div>
                <h3>Departamentos con avance real</h3>
                <p>Agrupá proyectos por área con color propio. La barra de progreso se calcula con las tareas cerradas, no con estimaciones a mano.</p>
                <div className="bento-dept-progress">
                  {deptProgress.map((d) => (
                    <div key={d.name} className="bento-dept-row">
                      <div className="bento-dept-row-head">
                        <span className="preview-dept-dot" style={{ background: DEPT_COLORS[d.name] }} />
                        <span>{d.name}</span>
                        <strong>{d.pct}%</strong>
                      </div>
                      <div className="bento-bar-track">
                        <span className="bento-bar-fill" style={{ width: `${d.pct}%`, background: DEPT_COLORS[d.name] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="bento-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: 0.05 }}
              >
                <div className="bento-card-icon"><Kanban size={20} /></div>
                <h3>Tablero Kanban por estado</h3>
                <p>Por hacer, en curso y completadas. Arrastrá la tarjeta y el estado se actualiza para todo el equipo al instante.</p>
                <div className="bento-mini-board">
                  {['Por hacer', 'En curso', 'Listo'].map((label, i) => (
                    <div key={label} className="bento-mini-col">
                      <span>{label}</span>
                      {Array.from({ length: 3 - (i === 2 ? 1 : 0) }).map((_, j) => (
                        <div key={j} className={`bento-mini-chip ${i === 1 && j === 0 ? 'is-active' : ''}`} />
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="bento-row bento-row-triple">
              <motion.div
                className="bento-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bento-card-icon"><Users size={20} /></div>
                <h3>Carga por empleado</h3>
                <p>Antes de asignar, mirá cuántas tareas abiertas tiene cada persona y evitá sobrecargar al mismo de siempre.</p>
                <div className="bento-employee-list">
                  {employeeLoad.map((emp) => (
                    <div key={emp.name} className="bento-employee-row">
                      <span className="preview-task-avatar">{emp.initials}</span>
                      <div className="bento-employee-info">
                        <span>{emp.name}</span>
                        <div className="bento-bar-track">
                          <span className={`bento-bar-fill ${emp.over ? 'is-danger' : ''}`} style={{ width: `${emp.pct}%` }} />
                        </div>
                      </div>
                      <strong>{emp.count}</strong>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="bento-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: 0.05 }}
              >
                <div className="bento-card-icon"><BarChart3 size={20} /></div>
                <h3>Reportes para dirección</h3>
                <p>Cumplimiento, tareas vencidas y racha semanal por área. Exportable para el comité del lunes.</p>
                <div className="bento-chart">
                  {chartBars.map((h, i) => (
                    <span key={i} className={`bento-chart-bar ${i >= chartBars.length - 2 ? 'is-active' : ''}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="bento-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="bento-card-icon"><ShieldCheck size={20} /></div>
                <h3>Permisos y trazabilidad</h3>
                <p>Roles de administrador, líder de área y colaborador. Cada cambio de estado queda registrado con autor y hora.</p>
                <div className="bento-roles-list">
                  {roles.map((role) => (
                    <div key={role.name} className="bento-role-row">
                      <strong>{role.name}</strong>
                      <span>{role.scope}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              className="bento-card bento-card-full"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bento-card-full-left">
                <div className="bento-card-icon"><Bell size={20} /></div>
                <h3>Nada se pasa de fecha</h3>
                <p>Avisos automáticos antes del vencimiento y resaltado de tareas atrasadas en el tablero y por correo, para el responsable y para su líder de área.</p>
              </div>
              <div className="bento-card-full-right">
                {notifications.map((n) => (
                  <div key={n.title} className={`bento-notification tone-${n.tone}`}>
                    <span className="bento-notification-label">
                      <span className="bento-notification-dot" /> {n.label}
                    </span>
                    <p>{n.title}</p>
                    <span className="bento-notification-meta">{n.meta}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section id="soluciones" className="landing-testimonials-section">
          <span className="landing-section-label">Confían en la plataforma</span>
          <div className="landing-testimonials">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                className="landing-testimonial-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4 }}
              >
                <p>{t.quote}</p>
                <div className="landing-testimonial-footer">
                  <div className="landing-testimonial-author">
                    <span className="preview-task-avatar">{t.initials}</span>
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                  <span className="landing-testimonial-badge">{t.badge}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="planes" className="landing-pricing-section">
          <span className="landing-section-label">Planes</span>
          <h2>Empezá gratis, escalá cuando el equipo crezca.</h2>

          <div className="landing-pricing">
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                className={`landing-plan-card ${plan.highlighted ? 'is-highlighted' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4 }}
              >
                {plan.badge && <span className="landing-plan-badge">{plan.badge}</span>}
                <span className="landing-plan-name">{plan.name}</span>
                <div className="landing-plan-price">
                  {plan.price} <small>{plan.priceHint}</small>
                </div>
                <p className="landing-plan-desc">{plan.desc}</p>
                <ul className="landing-plan-features">
                  {plan.features.map((f) => (
                    <li key={f}><Check size={16} className="icon-electric" /> {f}</li>
                  ))}
                </ul>
                {plan.to ? (
                  <Link to={plan.to} className={plan.highlighted ? 'landing-btn-primary' : 'landing-btn-ghost'}>
                    {plan.cta}
                  </Link>
                ) : (
                  <a href={plan.href} className="landing-btn-ghost">{plan.cta}</a>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="landing-cta-section">
          <h2>Ordená la operación de tu empresa esta semana.</h2>
          <p>Creá tu organización, cargá tus departamentos e invitá al equipo con un link. Sin tarjeta de crédito y sin migraciones eternas.</p>
          <div className="landing-hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/register" className="landing-btn-primary">
              Crear mi organización <ArrowRight size={18} />
            </Link>
            <a href="#planes" className="landing-btn-ghost">Comparar planes</a>
          </div>
          <span className="landing-cta-fineprint">Configuración inicial en menos de 10 minutos · Datos alojados en la región</span>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            <div className="landing-logo">
              <img src={logo} alt="FocusOnWeb" />
              <span>FocusOn<span className="landing-logo-accent">Web</span></span>
            </div>
            <p>La plataforma donde las empresas organizan departamentos, proyectos y responsables en un solo lugar.</p>
          </div>

          {Object.entries(footerColumns).map(([title, links]) => (
            <div key={title} className="landing-footer-col">
              <strong>{title}</strong>
              {links.map((link) => (
                <a key={link.label} href={link.href}>{link.label}</a>
              ))}
            </div>
          ))}
        </div>

        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} FocusOnWeb</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
