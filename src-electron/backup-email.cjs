const nodemailer = require("nodemailer");
const { createLocalBackup } = require("./backup.cjs");
const fs = require("fs");

/**
 * Envía un respaldo de la base de datos por email
 * @param {Object} config - Configuración del email
 * @param {string} config.host - Servidor SMTP (ej: smtp.gmail.com)
 * @param {number} config.port - Puerto SMTP (587 para TLS, 465 para SSL)
 * @param {boolean} config.secure - Usar SSL (true para puerto 465)
 * @param {string} config.user - Usuario/email del remitente
 * @param {string} config.password - Contraseña o App Password
 * @param {string} config.to - Email del destinatario
 */
async function sendBackupByEmail(config) {
  try {
    // Crear respaldo temporal
    const backup = await createLocalBackup();

    // Configurar transporte de email
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true para 465, false para otros puertos
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    // Verificar conexión
    await transporter.verify();

    // Preparar email
    const mailOptions = {
      from: config.user,
      to: config.to,
      subject: `Respaldo Base de Datos SIPARK - ${new Date().toLocaleDateString("es-ES")}`,
      text: `Respaldo automático de la base de datos SIPARK.\n\nFecha: ${new Date().toLocaleString("es-ES")}\nTamaño: ${backup.sizeFormatted}\n\nEste es un respaldo automático. Por favor, guárdelo en un lugar seguro.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Respaldo Base de Datos SIPARK</h2>
          <p>Se ha generado un respaldo automático de la base de datos.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa;"><strong>Fecha:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${new Date().toLocaleString("es-ES")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa;"><strong>Tamaño:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${backup.sizeFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa;"><strong>Archivo:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${backup.path.split("/").pop()}</td>
            </tr>
          </table>
          <p style="color: #dc2626; font-weight: bold;">⚠️ Importante: Guarde este archivo en un lugar seguro.</p>
          <p style="color: #64748b; font-size: 12px;">Este es un mensaje automático. Por favor, no responda a este correo.</p>
        </div>
      `,
      attachments: [
        {
          filename: backup.path.split("/").pop(),
          path: backup.path,
        },
      ],
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);


    // Limpiar archivo temporal (opcional)
    // fs.unlinkSync(backup.path);

    return {
      success: true,
      messageId: info.messageId,
      backupSize: backup.sizeFormatted,
      sentTo: config.to,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Valida la configuración de email
 */
async function validateEmailConfig(config) {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    await transporter.verify();
    return { valid: true, message: "Configuración válida" };
  } catch (error) {
    return { valid: false, message: error.message };
  }
}

module.exports = {
  sendBackupByEmail,
  validateEmailConfig,
};
