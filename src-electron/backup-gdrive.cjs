const { google } = require("googleapis");
const fs = require("fs");
const { createLocalBackup } = require("./backup.cjs");

/**
 * Sube un respaldo a Google Drive
 * @param {Object} credentials - Credenciales OAuth2 de Google
 * @param {string} credentials.client_id - Client ID
 * @param {string} credentials.client_secret - Client Secret
 * @param {string} credentials.refresh_token - Refresh Token
 * @param {string} folderId - ID de la carpeta en Google Drive (opcional)
 */
async function uploadToGoogleDrive(credentials, folderId = null) {
  try {
    // Crear respaldo temporal
    const backup = await createLocalBackup();

    // Configurar OAuth2
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      "urn:ietf:wg:oauth:2.0:oob", // Redirect URI para aplicaciones de escritorio
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refresh_token,
    });

    // Inicializar Drive API
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Preparar metadata del archivo
    const fileName = backup.path.split("/").pop();
    const fileMetadata = {
      name: fileName,
      mimeType: "application/sql",
      description: `Respaldo automático de SIPARK - ${new Date().toLocaleString()}`,
    };

    // Si se especifica carpeta, agregar como parent
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    // Preparar media
    const media = {
      mimeType: "application/sql",
      body: fs.createReadStream(backup.path),
    };

    // Subir archivo
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name, size, createdTime, webViewLink",
    });


    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      size: response.data.size,
      sizeFormatted: backup.sizeFormatted,
      createdTime: response.data.createdTime,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error("❌ Error subiendo a Google Drive:", error);
    throw error;
  }
}

/**
 * Lista los respaldos en Google Drive
 */
async function listGoogleDriveBackups(credentials, folderId = null) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      "urn:ietf:wg:oauth:2.0:oob",
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refresh_token,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Construir query
    let query = "name contains 'sipark_backup' and trashed=false";
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const response = await drive.files.list({
      q: query,
      fields: "files(id, name, size, createdTime, modifiedTime, webViewLink)",
      orderBy: "createdTime desc",
      pageSize: 50,
    });

    return response.data.files.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      sizeFormatted: `${(parseInt(file.size) / (1024 * 1024)).toFixed(2)} MB`,
      created: file.createdTime,
      modified: file.modifiedTime,
      webViewLink: file.webViewLink,
    }));
  } catch (error) {
    console.error("Error listando respaldos en Google Drive:", error);
    throw error;
  }
}

/**
 * Descarga un respaldo desde Google Drive
 */
async function downloadFromGoogleDrive(credentials, fileId, destinationPath) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      "urn:ietf:wg:oauth:2.0:oob",
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refresh_token,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const dest = fs.createWriteStream(destinationPath);

    const response = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" },
    );

    return new Promise((resolve, reject) => {
      response.data
        .on("end", () => {
          resolve({ success: true, path: destinationPath });
        })
        .on("error", (err) => {
          console.error("Error descargando archivo:", err);
          reject(err);
        })
        .pipe(dest);
    });
  } catch (error) {
    console.error("Error descargando desde Google Drive:", error);
    throw error;
  }
}

/**
 * Valida las credenciales de Google Drive
 */
async function validateGoogleDriveCredentials(credentials) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      "urn:ietf:wg:oauth:2.0:oob",
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refresh_token,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Intentar listar archivos para validar credenciales
    await drive.files.list({ pageSize: 1 });

    return { valid: true, message: "Credenciales válidas" };
  } catch (error) {
    return { valid: false, message: error.message };
  }
}

/**
 * Genera URL para obtener código de autorización
 */
function getAuthUrl(clientId, clientSecret) {
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "urn:ietf:wg:oauth:2.0:oob",
  );

  const scopes = ["https://www.googleapis.com/auth/drive.file"];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });

  return url;
}

/**
 * Obtiene refresh token desde código de autorización
 */
async function getRefreshToken(clientId, clientSecret, code) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "urn:ietf:wg:oauth:2.0:oob",
    );

    const { tokens } = await oauth2Client.getToken(code);

    return {
      success: true,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
    };
  } catch (error) {
    console.error("Error obteniendo refresh token:", error);
    throw error;
  }
}

module.exports = {
  uploadToGoogleDrive,
  listGoogleDriveBackups,
  downloadFromGoogleDrive,
  validateGoogleDriveCredentials,
  getAuthUrl,
  getRefreshToken,
};
