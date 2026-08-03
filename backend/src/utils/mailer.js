const nodemailer = require('nodemailer');
const { decrypt } = require('./crypto');

const escaparHtml = (texto) => String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Cada organización manda sus emails automáticos desde SU PROPIA cuenta de
// Gmail (la que cargó el admin en Configuración > Email para notificaciones),
// no desde una cuenta genérica de la app — por eso el transporter se arma al
// vuelo con las credenciales de esa organización en particular.
const construirTransportador = (org) => {
    if (!org?.notificationEmail || !org?.notificationEmailAppPasswordEnc) return null;

    let appPassword;
    try {
        appPassword = decrypt(org.notificationEmailAppPasswordEnc);
    } catch (error) {
        console.error('No se pudo desencriptar la contraseña de aplicación de la organización:', error);
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: org.notificationEmail, pass: appPassword }
    });
};

// Avisa por mail a quien le acaban de asignar una tarea. Si la organización no
// configuró su email de notificaciones, o el envío falla, no interrumpe el
// flujo que la llamó — solo lo deja registrado en consola.
const enviarEmailTareaAsignada = async ({ org, destinatario, nombreDestinatario, tituloTarea }) => {
    const transportador = construirTransportador(org);
    if (!transportador) return;

    const urlApp = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/mytasks`;

    try {
        await transportador.sendMail({
            from: `"${org.name}" <${org.notificationEmail}>`,
            to: destinatario,
            subject: `Nueva tarea asignada: ${tituloTarea}`,
            text: `Hola ${nombreDestinatario},\n\nSe te asignó la tarea "${tituloTarea}" en FocusOnWeb.\n\nEntrá a la app para verla: ${urlApp}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 480px;">
                    <h2 style="margin: 0 0 0.8rem;">Nueva tarea asignada</h2>
                    <p>Hola ${escaparHtml(nombreDestinatario)},</p>
                    <p>${escaparHtml(org.name)} te asignó la siguiente tarea:</p>
                    <p style="font-size: 1.05rem; font-weight: 700; padding: 0.8rem 1rem; background: #f1f5f9; border-radius: 8px;">
                        ${escaparHtml(tituloTarea)}
                    </p>
                    <p><a href="${urlApp}" style="color: #0a6cff;">Ver mis tareas en FocusOnWeb</a></p>
                </div>
            `
        });
    } catch (error) {
        console.error('Error al enviar el email de tarea asignada:', error);
    }
};

// Invita por mail a alguien que todavía NO es parte de la organización. A
// diferencia de enviarEmailTareaAsignada, acá SÍ dejamos que el error se
// propague — quien llama a esta función necesita saber si el envío falló
// para avisarle al admin (le está pidiendo explícitamente mandar este mail).
const enviarEmailInvitacion = async ({ org, destinatario, inviteUrl }) => {
    const transportador = construirTransportador(org);
    if (!transportador) {
        throw new Error('La organización no tiene configurado su email de notificaciones');
    }

    await transportador.sendMail({
        from: `"${org.name}" <${org.notificationEmail}>`,
        to: destinatario,
        subject: `Te invitaron a unirte a ${org.name} en FocusOnWeb`,
        text: `Hola,\n\n${org.name} te invitó a sumarte a su equipo en FocusOnWeb.\n\nUnite acá: ${inviteUrl}\n\nEste link vence en 7 días.`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 480px;">
                <h2 style="margin: 0 0 0.8rem;">Te invitaron a unirte a ${escaparHtml(org.name)}</h2>
                <p>Te sumaron al equipo en FocusOnWeb. Hacé clic para unirte:</p>
                <p><a href="${inviteUrl}" style="display: inline-block; padding: 0.7rem 1.2rem; background: #0a6cff; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700;">Unirme a ${escaparHtml(org.name)}</a></p>
                <p style="color: #64748b; font-size: 0.85rem;">Este link vence en 7 días.</p>
            </div>
        `
    });
};

module.exports = { enviarEmailTareaAsignada, enviarEmailInvitacion };
