const nodemailer = require('nodemailer');
const { decrypt } = require('./crypto');
const Organization = require('../models/Organization');

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

// Sin esto, un envío que empieza a fallar (contraseña de aplicación revocada,
// límite de Gmail alcanzado, etc.) queda solo en la consola del backend —
// nadie del lado de la empresa se entera hasta que un empleado dice que nunca
// le llegó nada. Se guarda en la organización para poder mostrarlo en
// Configuración, y se limpia solo en el próximo envío que sí funcione.
const registrarErrorEmail = (orgId, error) =>
    Organization.findByIdAndUpdate(orgId, {
        notificationEmailLastError: error.message,
        notificationEmailLastErrorAt: new Date()
    }).catch((e) => console.error('No se pudo registrar el error de email en la organización:', e));

const limpiarErrorEmail = (orgId) =>
    Organization.findByIdAndUpdate(orgId, {
        notificationEmailLastError: null,
        notificationEmailLastErrorAt: null
    }).catch((e) => console.error('No se pudo limpiar el error de email de la organización:', e));

// Avisa por mail a quien le acaban de asignar una tarea. Si la organización no
// configuró su email de notificaciones, o el envío falla, no interrumpe el
// flujo que la llamó — el error queda registrado en la organización (ver
// registrarErrorEmail) en vez de solo en la consola.
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
        await limpiarErrorEmail(org._id);
    } catch (error) {
        console.error('Error al enviar el email de tarea asignada:', error);
        await registrarErrorEmail(org._id, error);
    }
};

// Avisa a la persona asignada que le pidieron una aclaración sobre una tarea.
const enviarEmailAclaracionSolicitada = async ({ org, destinatario, nombreDestinatario, tituloTarea, pregunta }) => {
    const transportador = construirTransportador(org);
    if (!transportador) return;

    const urlApp = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/mytasks`;

    try {
        await transportador.sendMail({
            from: `"${org.name}" <${org.notificationEmail}>`,
            to: destinatario,
            subject: `Te pidieron una aclaración: ${tituloTarea}`,
            text: `Hola ${nombreDestinatario},\n\n${org.name} te pidió una aclaración sobre la tarea "${tituloTarea}":\n\n"${pregunta}"\n\nEntrá a la app para responder: ${urlApp}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 480px;">
                    <h2 style="margin: 0 0 0.8rem;">Te pidieron una aclaración</h2>
                    <p>Hola ${escaparHtml(nombreDestinatario)},</p>
                    <p>${escaparHtml(org.name)} te pidió una aclaración sobre la tarea "${escaparHtml(tituloTarea)}":</p>
                    <p style="font-style: italic; padding: 0.8rem 1rem; background: #f1f5f9; border-radius: 8px;">
                        "${escaparHtml(pregunta)}"
                    </p>
                    <p><a href="${urlApp}" style="color: #0a6cff;">Responder en FocusOnWeb</a></p>
                </div>
            `
        });
        await limpiarErrorEmail(org._id);
    } catch (error) {
        console.error('Error al enviar el email de solicitud de aclaración:', error);
        await registrarErrorEmail(org._id, error);
    }
};

// Avisa a quien pidió la aclaración (el creador de la tarea) que ya la respondieron.
const enviarEmailAclaracionRespondida = async ({ org, destinatario, nombreDestinatario, tituloTarea, respuesta }) => {
    const transportador = construirTransportador(org);
    if (!transportador) return;

    const urlApp = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/dashboard`;

    try {
        await transportador.sendMail({
            from: `"${org.name}" <${org.notificationEmail}>`,
            to: destinatario,
            subject: `Te respondieron: ${tituloTarea}`,
            text: `Hola ${nombreDestinatario},\n\nTe respondieron la aclaración que pediste sobre "${tituloTarea}":\n\n"${respuesta}"\n\nEntrá a la app para verla: ${urlApp}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 480px;">
                    <h2 style="margin: 0 0 0.8rem;">Te respondieron tu pregunta</h2>
                    <p>Hola ${escaparHtml(nombreDestinatario)},</p>
                    <p>Te respondieron la aclaración que pediste sobre "${escaparHtml(tituloTarea)}":</p>
                    <p style="font-style: italic; padding: 0.8rem 1rem; background: #f1f5f9; border-radius: 8px;">
                        "${escaparHtml(respuesta)}"
                    </p>
                    <p><a href="${urlApp}" style="color: #0a6cff;">Ver en FocusOnWeb</a></p>
                </div>
            `
        });
        await limpiarErrorEmail(org._id);
    } catch (error) {
        console.error('Error al enviar el email de respuesta de aclaración:', error);
        await registrarErrorEmail(org._id, error);
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

    try {
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
        await limpiarErrorEmail(org._id);
    } catch (error) {
        await registrarErrorEmail(org._id, error);
        throw error;
    }
};

// Manda un email de prueba a la propia cuenta configurada, para que el admin
// pueda verificar que la config anda ANTES de depender de ella en un flujo
// real (en vez de enterarse recién cuando falla en silencio).
const enviarEmailPrueba = async ({ org }) => {
    const transportador = construirTransportador(org);
    if (!transportador) {
        throw new Error('La organización no tiene configurado su email de notificaciones');
    }

    try {
        await transportador.sendMail({
            from: `"${org.name}" <${org.notificationEmail}>`,
            to: org.notificationEmail,
            subject: 'Email de prueba — FocusOnWeb',
            text: `Este es un email de prueba. Si lo recibiste, el email de notificaciones de ${org.name} está funcionando correctamente.`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 480px;">
                    <h2 style="margin: 0 0 0.8rem;">Email de prueba</h2>
                    <p>Si lo recibiste, el email de notificaciones de <strong>${escaparHtml(org.name)}</strong> está funcionando correctamente.</p>
                </div>
            `
        });
        await limpiarErrorEmail(org._id);
    } catch (error) {
        await registrarErrorEmail(org._id, error);
        throw error;
    }
};

// Recuperar contraseña es distinto a todo lo de arriba: no es un aviso de
// negocio de una organización puntual, es una acción de seguridad de la
// cuenta — alguien bloqueado afuera no tiene forma de acceder a la config de
// email de SU organización. Por eso sale de una cuenta "del sistema" propia
// (SYSTEM_EMAIL_USER/SYSTEM_EMAIL_APP_PASSWORD en el .env), no de la org.
let transportadorSistema = null;
let transportadorSistemaListo = false;

const getTransportadorSistema = () => {
    if (transportadorSistemaListo) return transportadorSistema;
    transportadorSistemaListo = true;

    if (!process.env.SYSTEM_EMAIL_USER || !process.env.SYSTEM_EMAIL_APP_PASSWORD) {
        console.warn('📧 SYSTEM_EMAIL_USER/SYSTEM_EMAIL_APP_PASSWORD no configurados — no se van a poder mandar emails de recuperación de contraseña');
        return null;
    }

    transportadorSistema = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.SYSTEM_EMAIL_USER, pass: process.env.SYSTEM_EMAIL_APP_PASSWORD }
    });
    return transportadorSistema;
};

// Devuelve true/false según si se pudo mandar — quien llama decide qué hacer
// (acá SÍ importa saberlo, a diferencia del resto, porque si falla el usuario
// se queda sin forma de entrar a su cuenta).
const enviarEmailResetContrasena = async ({ destinatario, nombreDestinatario, resetUrl }) => {
    const transportador = getTransportadorSistema();
    if (!transportador) return false;

    try {
        await transportador.sendMail({
            from: `"FocusOnWeb" <${process.env.SYSTEM_EMAIL_USER}>`,
            to: destinatario,
            subject: 'Recuperá tu contraseña — FocusOnWeb',
            text: `Hola ${nombreDestinatario},\n\nPediste restablecer tu contraseña en FocusOnWeb. Este link vence en 1 hora:\n\n${resetUrl}\n\nSi no fuiste vos, ignorá este email — tu contraseña sigue siendo la misma.`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 480px;">
                    <h2 style="margin: 0 0 0.8rem;">Recuperá tu contraseña</h2>
                    <p>Hola ${escaparHtml(nombreDestinatario)},</p>
                    <p>Pediste restablecer tu contraseña en FocusOnWeb. Este link vence en 1 hora:</p>
                    <p><a href="${resetUrl}" style="display: inline-block; padding: 0.7rem 1.2rem; background: #0a6cff; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700;">Restablecer contraseña</a></p>
                    <p style="color: #64748b; font-size: 0.85rem;">Si no fuiste vos, ignorá este email — tu contraseña sigue siendo la misma.</p>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Error al enviar el email de recuperación de contraseña:', error);
        return false;
    }
};

module.exports = {
    enviarEmailTareaAsignada,
    enviarEmailInvitacion,
    enviarEmailPrueba,
    enviarEmailAclaracionSolicitada,
    enviarEmailAclaracionRespondida,
    enviarEmailResetContrasena
};
