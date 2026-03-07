import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Building2,
  Settings as SettingsIcon,
  Calculator,
  HardDrive,
  Save,
  Printer,
  Mail,
  Cloud,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import { useNotification } from "@/hooks/useNotification";
import { usePrinter } from "@/hooks/usePrinter";

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("empresa");
  const [loading, setLoading] = useState(false);

  // Modales
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showGDriveModal, setShowGDriveModal] = useState(false);

  // Empresa
  const [systemName, setSystemName] = useState("SIPARK");
  const [companyName, setCompanyName] = useState("");
  const [companyRuc, setCompanyRuc] = useState("");

  // Operaciones
  const [currency, setCurrency] = useState("NIO");
  const [exchangeRate, setExchangeRate] = useState("1.00");

  // Contabilidad
  const [enableTax, setEnableTax] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState("15");
  const [invoiceNextNumber, setInvoiceNextNumber] = useState("1");

  // Hardware
  const [dbConnected, setDbConnected] = useState(false);
  const [dbMessage, setDbMessage] = useState("Verificando...");

  // Email Config
  const [emailConfig, setEmailConfig] = useState({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: "",
    password: "",
    to: "",
  });
  const [emailConfigured, setEmailConfigured] = useState(false);

  // Google Drive Config
  const [gdriveConfig, setGdriveConfig] = useState({
    client_id: "",
    client_secret: "",
    refresh_token: "",
  });
  const [gdriveConfigured, setGdriveConfigured] = useState(false);
  const [gdriveAuthUrl, setGdriveAuthUrl] = useState("");
  const [gdriveAuthCode, setGdriveAuthCode] = useState("");

  // Auto Backup Config
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequency] = useState("24");
  const [autoBackupEmailEnabled, setAutoBackupEmailEnabled] = useState(false);
  const [autoBackupGDriveEnabled, setAutoBackupGDriveEnabled] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);

  const { setSetting, getAllSettings, checkDatabaseConnection } = useDatabase();
  const { success, error: errorNotification } = useNotification();
  const {
    printers,
    selectedPrinter,
    setSelectedPrinter,
    isLoading: isLoadingPrinters,
    printerStatus,
    printTestTicket,
  } = usePrinter();

  useEffect(() => {
    cargarConfiguracion();
    verificarConexionBD();
    cargarEstadoScheduler();
  }, []);

  const verificarConexionBD = async () => {
    try {
      const result = await checkDatabaseConnection();
      setDbConnected(result.connected);
      setDbMessage(result.message);
    } catch (err) {
      console.error("Error verificando BD:", err);
      setDbConnected(false);
      setDbMessage("Error de conexión");
    }
  };

  const cargarEstadoScheduler = async () => {
    try {
      const status = await (window as any).api.getSchedulerStatus();
      setSchedulerStatus(status);
    } catch (err) {
      console.error("Error cargando estado del scheduler:", err);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const settings = await getAllSettings();

      if (settings && Array.isArray(settings)) {
        settings.forEach((setting: any) => {
          switch (setting.key) {
            case "system_name":
              setSystemName(setting.value);
              break;
            case "company_name":
              setCompanyName(setting.value);
              break;
            case "company_ruc":
              setCompanyRuc(setting.value);
              break;
            case "currency_primary":
              setCurrency(setting.value);
              break;
            case "exchange_rate":
              setExchangeRate(setting.value);
              break;
            case "enable_tax":
              setEnableTax(setting.value === "true");
              break;
            case "tax_percentage":
              setTaxPercentage(setting.value);
              break;
            case "invoice_next_number":
              setInvoiceNextNumber(setting.value);
              break;
            case "auto_backup_enabled":
              setAutoBackupEnabled(setting.value === "true");
              break;
            case "auto_backup_frequency":
              setAutoBackupFrequency(setting.value);
              break;
            case "auto_backup_email_enabled":
              setAutoBackupEmailEnabled(setting.value === "true");
              break;
            case "auto_backup_gdrive_enabled":
              setAutoBackupGDriveEnabled(setting.value === "true");
              break;
            case "backup_email_config":
              try {
                const emailCfg = JSON.parse(setting.value);
                setEmailConfig(emailCfg);
                setEmailConfigured(true);
              } catch (e) {}
              break;
            case "backup_gdrive_config":
              try {
                const gdriveCfg = JSON.parse(setting.value);
                setGdriveConfig(gdriveCfg);
                setGdriveConfigured(true);
              } catch (e) {}
              break;
          }
        });
      }
    } catch (err) {
      console.error("Error cargando configuración:", err);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de Email Backup
  const handleTestEmail = async () => {
    try {
      setLoading(true);
      const result = await (window as any).api.validateEmailConfig(emailConfig);
      if (result.valid) {
        success("Configuración de email válida");
        setEmailConfigured(true);
        // Guardar configuración
        await setSetting("backup_email_config", JSON.stringify(emailConfig));
      } else {
        errorNotification(`Error: ${result.message}`);
      }
    } catch (err: any) {
      errorNotification(`Error validando email: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailBackup = async () => {
    try {
      setLoading(true);
      const result = await (window as any).api.sendBackupByEmail(emailConfig);
      if (result.success) {
        success(`Respaldo enviado a ${result.sentTo}`);
      }
    } catch (err: any) {
      errorNotification(`Error enviando respaldo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de Google Drive Backup
  const handleGenerateGDriveAuthUrl = async () => {
    try {
      if (!gdriveConfig.client_id || !gdriveConfig.client_secret) {
        errorNotification("Ingresa Client ID y Client Secret primero");
        return;
      }
      const url = await (window as any).api.getGDriveAuthUrl(
        gdriveConfig.client_id,
        gdriveConfig.client_secret,
      );
      setGdriveAuthUrl(url);
      // Abrir URL en navegador
      window.open(url, "_blank");
    } catch (err: any) {
      errorNotification(`Error generando URL: ${err.message}`);
    }
  };

  const handleGetGDriveRefreshToken = async () => {
    try {
      if (!gdriveAuthCode) {
        errorNotification("Ingresa el código de autorización");
        return;
      }
      setLoading(true);
      const result = await (window as any).api.getGDriveRefreshToken(
        gdriveConfig.client_id,
        gdriveConfig.client_secret,
        gdriveAuthCode,
      );
      if (result.success) {
        setGdriveConfig({
          ...gdriveConfig,
          refresh_token: result.refresh_token,
        });
        success("Refresh token obtenido correctamente");
      }
    } catch (err: any) {
      errorNotification(`Error obteniendo token: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestGDrive = async () => {
    try {
      setLoading(true);
      const result = await (window as any).api.validateGDriveCredentials(
        gdriveConfig,
      );
      if (result.valid) {
        success("Credenciales de Google Drive válidas");
        setGdriveConfigured(true);
        // Guardar configuración
        await setSetting("backup_gdrive_config", JSON.stringify(gdriveConfig));
      } else {
        errorNotification(`Error: ${result.message}`);
      }
    } catch (err: any) {
      errorNotification(`Error validando Google Drive: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadToGDrive = async () => {
    try {
      setLoading(true);
      const result = await (window as any).api.uploadBackupToGDrive(
        gdriveConfig,
        null,
      );
      if (result.success) {
        success(
          `Respaldo subido a Google Drive: ${result.fileName} (${result.sizeFormatted})`,
        );
        // Mostrar información adicional
        console.log("Archivo en Google Drive:", {
          nombre: result.fileName,
          id: result.fileId,
          enlace: result.webViewLink,
        });
      }
    } catch (err: any) {
      errorNotification(`Error subiendo a Google Drive: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracionEmpresa = async () => {
    try {
      setLoading(true);
      await setSetting("system_name", systemName);
      await setSetting("company_name", companyName);
      await setSetting("company_ruc", companyRuc);
      success("Configuración de empresa guardada correctamente");
    } catch (err) {
      console.error("Error guardando configuración:", err);
      errorNotification("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracionOperaciones = async () => {
    try {
      setLoading(true);
      await setSetting("currency_primary", currency);
      await setSetting("exchange_rate", exchangeRate);
      success("Configuración de operaciones guardada correctamente");
    } catch (err) {
      console.error("Error guardando configuración:", err);
      errorNotification("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracionContable = async () => {
    try {
      setLoading(true);
      await setSetting("enable_tax", enableTax.toString());
      await setSetting("tax_percentage", taxPercentage);
      await setSetting("invoice_next_number", invoiceNextNumber);
      success("Configuración contable guardada correctamente");
    } catch (err) {
      console.error("Error guardando configuración:", err);
      errorNotification("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracionAutoBackup = async () => {
    try {
      setLoading(true);
      await setSetting("auto_backup_enabled", autoBackupEnabled.toString());
      await setSetting("auto_backup_frequency", autoBackupFrequency);
      await setSetting(
        "auto_backup_email_enabled",
        autoBackupEmailEnabled.toString(),
      );
      await setSetting(
        "auto_backup_gdrive_enabled",
        autoBackupGDriveEnabled.toString(),
      );

      // Reiniciar scheduler si está habilitado
      if (autoBackupEnabled) {
        await (window as any).api.stopBackupScheduler();
        await (window as any).api.startBackupScheduler();
      } else {
        await (window as any).api.stopBackupScheduler();
      }

      await cargarEstadoScheduler();
      success("Configuración de respaldo automático guardada");
    } catch (err) {
      console.error("Error guardando configuración:", err);
      errorNotification("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Configuración</h1>
        <p className="text-slate-600 mt-1">
          Administra los parámetros del sistema SIPARK
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-4 bg-slate-100">
          <TabsTrigger value="empresa" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="operaciones" className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Operaciones</span>
          </TabsTrigger>
          <TabsTrigger value="contabilidad" className="gap-2">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Contabilidad</span>
          </TabsTrigger>
          <TabsTrigger value="hardware" className="gap-2">
            <HardDrive className="w-4 h-4" />
            <span className="hidden sm:inline">Hardware</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Empresa */}
        <TabsContent value="empresa" className="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Datos de Empresa */}
            <Card className="shadow-md border-none">
              <CardHeader>
                <CardTitle className="text-lg">Datos de Empresa</CardTitle>
                <CardDescription>
                  Información general de la ludoteca
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Nombre del Sistema
                  </label>
                  <input
                    type="text"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SIPARK"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mi Ludoteca S.A."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    RUC / NIT
                  </label>
                  <input
                    type="text"
                    value={companyRuc}
                    onChange={(e) => setCompanyRuc(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456789"
                  />
                </div>

                <Button
                  onClick={guardarConfiguracionEmpresa}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </CardContent>
            </Card>

            {/* Información */}
            <Card className="shadow-md border-none bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  Información del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-600">Versión</p>
                  <p className="font-semibold text-slate-900">1.0.0</p>
                </div>
                <div>
                  <p className="text-slate-600">Base de Datos</p>
                  <p className="font-semibold text-slate-900">SQLite3</p>
                </div>
                <div>
                  <p className="text-slate-600">Ubicación de BD</p>
                  <p className="font-semibold text-slate-900 break-all">
                    ~/.config/sipark.db
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Operaciones */}
        <TabsContent value="operaciones" className="">
          <div className="space-y-6">
            {/* Configuración de Moneda */}
            <Card className="shadow-md border-none">
              <CardHeader>
                <CardTitle className="text-lg">
                  Configuración de Moneda
                </CardTitle>
                <CardDescription>
                  Establece la moneda principal y tasa de cambio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Moneda Principal
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="NIO">NIO - Córdoba Nicaragüense</option>
                      <option value="USD">USD - Dólar Estadounidense</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Tasa de Cambio
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1.00"
                    />
                  </div>
                </div>

                <Button
                  onClick={guardarConfiguracionOperaciones}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Contabilidad */}
        <TabsContent value="contabilidad" className="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configuración Fiscal */}
            <Card className="shadow-md border-none">
              <CardHeader>
                <CardTitle className="text-lg">Configuración Fiscal</CardTitle>
                <CardDescription>
                  Parámetros de impuestos y facturación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Habilitar IVA
                    </p>
                    <p className="text-sm text-slate-600">
                      Aplicar impuesto a las ventas
                    </p>
                  </div>
                  <button
                    onClick={() => setEnableTax(!enableTax)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      enableTax ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        enableTax ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {enableTax && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Porcentaje de IVA (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="15"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Próximo Número de Factura
                  </label>
                  <input
                    type="number"
                    value={invoiceNextNumber}
                    onChange={(e) => setInvoiceNextNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <Button
                  onClick={guardarConfiguracionContable}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </CardContent>
            </Card>

            {/* Resumen Fiscal */}
            <Card className="shadow-md border-none bg-emerald-50">
              <CardHeader>
                <CardTitle className="text-lg">Resumen Fiscal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-600">Estado del IVA</p>
                  <p className="font-semibold text-slate-900">
                    {enableTax ? `Activo (${taxPercentage}%)` : "Inactivo"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Próxima Factura</p>
                  <p className="font-semibold text-slate-900">
                    #{invoiceNextNumber}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">RUC Registrado</p>
                  <p className="font-semibold text-slate-900">
                    {companyRuc || "No configurado"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Hardware */}
        <TabsContent value="hardware" className="">
          <div className="space-y-6">
            {/* Base de Datos */}
            <Card className="shadow-md border-none">
              <CardHeader>
                <CardTitle className="text-lg">Base de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {dbMessage}
                    </span>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        dbConnected
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          dbConnected ? "bg-emerald-600" : "bg-rose-600"
                        }`}
                      ></span>
                      {dbConnected ? "OK" : "Error"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Respaldo de Base de Datos */}
            <Card className="shadow-md border-none">
              <CardHeader>
                <CardTitle className="text-lg">
                  Respaldo de Base de Datos
                </CardTitle>
                <CardDescription>
                  Crea copias de seguridad de tus datos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await (window as any).api.createBackup();
                        if (result.success) {
                          success(`Respaldo creado: ${result.sizeFormatted}`);
                        } else if (result.canceled) {
                          // Usuario canceló
                        }
                      } catch (err) {
                        console.error("Error creando respaldo:", err);
                        errorNotification("Error al crear respaldo");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Crear Respaldo Local
                  </Button>

                  <Button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await (
                          window as any
                        ).api.restoreBackup();
                        if (result.success) {
                          success(
                            "Base de datos restaurada. Reinicia la aplicación.",
                          );
                        } else if (result.canceled) {
                          // Usuario canceló
                        }
                      } catch (err) {
                        console.error("Error restaurando:", err);
                        errorNotification("Error al restaurar respaldo");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <HardDrive className="w-4 h-4" />
                    Restaurar Respaldo
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Los respaldos se guardan
                    automáticamente en formato .db y pueden ser restaurados en
                    cualquier momento.
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    Respaldo en la Nube
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={() => setShowEmailModal(true)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Enviar por Email
                      {emailConfigured && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </Button>

                    <Button
                      onClick={() => setShowGDriveModal(true)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Cloud className="w-4 h-4" />
                      Subir a Google Drive
                      {gdriveConfigured && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Respaldo Automático */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    Respaldo Automático
                  </h4>

                  <div className="space-y-4">
                    {/* Habilitar respaldo automático */}
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Habilitar Respaldo Automático
                        </p>
                        <p className="text-sm text-slate-600">
                          Crear respaldos automáticos periódicamente
                        </p>
                      </div>
                      <button
                        onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          autoBackupEnabled ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            autoBackupEnabled
                              ? "translate-x-7"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {autoBackupEnabled && (
                      <>
                        {/* Frecuencia */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Frecuencia de Respaldo
                          </label>
                          <select
                            value={autoBackupFrequency}
                            onChange={(e) =>
                              setAutoBackupFrequency(e.target.value)
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="12">Cada 12 horas</option>
                            <option value="24">Cada 24 horas (diario)</option>
                            <option value="48">Cada 48 horas</option>
                            <option value="168">Cada semana</option>
                          </select>
                        </div>

                        {/* Destinos */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Destinos de Respaldo
                          </label>

                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-600" />
                              <span className="text-sm text-slate-900">
                                Enviar por Email
                              </span>
                              {!emailConfigured && (
                                <span className="text-xs text-amber-600">
                                  (Configurar primero)
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                setAutoBackupEmailEnabled(
                                  !autoBackupEmailEnabled,
                                )
                              }
                              disabled={!emailConfigured}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                autoBackupEmailEnabled
                                  ? "bg-blue-600"
                                  : "bg-slate-300"
                              } ${!emailConfigured ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  autoBackupEmailEnabled
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Cloud className="w-4 h-4 text-slate-600" />
                              <span className="text-sm text-slate-900">
                                Subir a Google Drive
                              </span>
                              {!gdriveConfigured && (
                                <span className="text-xs text-amber-600">
                                  (Configurar primero)
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                setAutoBackupGDriveEnabled(
                                  !autoBackupGDriveEnabled,
                                )
                              }
                              disabled={!gdriveConfigured}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                autoBackupGDriveEnabled
                                  ? "bg-blue-600"
                                  : "bg-slate-300"
                              } ${!gdriveConfigured ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  autoBackupGDriveEnabled
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Estado del scheduler */}
                        {schedulerStatus && (
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-600">
                              <strong>Estado:</strong>{" "}
                              {schedulerStatus.running ? "Activo" : "Inactivo"}
                            </p>
                            {schedulerStatus.lastBackupTime && (
                              <p className="text-xs text-slate-600 mt-1">
                                <strong>Último respaldo:</strong>{" "}
                                {new Date(
                                  schedulerStatus.lastBackupTime,
                                ).toLocaleString()}
                              </p>
                            )}
                            {schedulerStatus.nextBackupTime && (
                              <p className="text-xs text-slate-600 mt-1">
                                <strong>Próximo respaldo:</strong>{" "}
                                {new Date(
                                  schedulerStatus.nextBackupTime,
                                ).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}

                        <Button
                          onClick={guardarConfiguracionAutoBackup}
                          disabled={loading}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {loading
                            ? "Guardando..."
                            : "Guardar Configuración de Respaldo"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limpiar Base de Datos */}
            <Card className="shadow-md border-none border-rose-200">
              <CardHeader>
                <CardTitle className="text-lg text-rose-700">
                  Zona de Peligro
                </CardTitle>
                <CardDescription>
                  Acciones irreversibles que afectan los datos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Limpiar Base de Datos
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Esta acción eliminará TODOS los datos del sistema:
                    productos, ventas, clientes, proveedores, compras, cajas,
                    inventario y sesiones. Solo se mantendrá la configuración
                    del sistema.
                  </p>
                  <Button
                    onClick={async () => {
                      if (
                        window.confirm(
                          "⚠️ ¿Estás COMPLETAMENTE SEGURO?\n\nEsta acción eliminará TODOS los datos:\n• Productos y servicios\n• Ventas e historial\n• Clientes\n• Proveedores y compras\n• Inventario y ajustes\n• Cajas y movimientos\n• Sesiones activas\n\nSolo se mantendrá la configuración del sistema.\n\n¿Deseas continuar?",
                        )
                      ) {
                        try {
                          setLoading(true);
                          await (window as any).api.clearAllData();
                          success(
                            "Base de datos limpiada exitosamente. Reinicia la aplicación.",
                          );
                        } catch (err) {
                          console.error("Error limpiando BD:", err);
                          errorNotification(
                            "Error al limpiar la base de datos",
                          );
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    disabled={loading}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-2"
                  >
                    <HardDrive className="w-4 h-4" />
                    {loading ? "Limpiando..." : "Limpiar Base de Datos"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Impresora Térmica */}
            <Card className="shadow-md border-none">
              <CardHeader>
                <CardTitle className="text-lg">Impresora Térmica</CardTitle>
                <CardDescription>
                  Configura la impresora para tickets y recibos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Seleccionar Impresora
                  </label>
                  <select
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    disabled={isLoadingPrinters || printers.length === 0}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {printers.length === 0 ? (
                      <option value="">No hay impresoras disponibles</option>
                    ) : (
                      printers.map((printer) => (
                        <option key={printer.name} value={printer.name}>
                          {printer.displayName}
                          {printer.isDefault ? " (Predeterminada)" : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-900">
                      Estado de Conexión
                    </span>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        printerStatus === "connected"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          printerStatus === "connected"
                            ? "bg-emerald-600"
                            : "bg-rose-600"
                        }`}
                      ></span>
                      {printerStatus === "connected"
                        ? "Conectada"
                        : "Desconectada"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {selectedPrinter
                      ? `Impresora seleccionada: ${selectedPrinter}`
                      : "Selecciona una impresora"}
                  </p>
                </div>

                <Button
                  onClick={() => printTestTicket(selectedPrinter)}
                  disabled={!selectedPrinter || isLoadingPrinters}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ticket de Prueba
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Configurar Email */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Configurar Respaldo por Email
            </DialogTitle>
            <DialogDescription>
              Configura tu servidor SMTP para enviar respaldos automáticos por
              correo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Servidor SMTP
                </label>
                <Input
                  value={emailConfig.host}
                  onChange={(e) =>
                    setEmailConfig({ ...emailConfig, host: e.target.value })
                  }
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Puerto</label>
                <Input
                  type="number"
                  value={emailConfig.port}
                  onChange={(e) =>
                    setEmailConfig({
                      ...emailConfig,
                      port: parseInt(e.target.value),
                    })
                  }
                  placeholder="587"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email (Usuario)
              </label>
              <Input
                type="email"
                value={emailConfig.user}
                onChange={(e) =>
                  setEmailConfig({ ...emailConfig, user: e.target.value })
                }
                placeholder="tu-email@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña / App Password
              </label>
              <Input
                type="password"
                value={emailConfig.password}
                onChange={(e) =>
                  setEmailConfig({ ...emailConfig, password: e.target.value })
                }
                placeholder="••••••••••••••••"
              />
              <p className="text-xs text-slate-500 mt-1">
                Para Gmail, usa una App Password en lugar de tu contraseña
                normal
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email Destinatario
              </label>
              <Input
                type="email"
                value={emailConfig.to}
                onChange={(e) =>
                  setEmailConfig({ ...emailConfig, to: e.target.value })
                }
                placeholder="respaldos@tuempresa.com"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800">
                ⚠️ Para Gmail: Habilita la verificación en 2 pasos y genera una
                App Password en tu cuenta de Google
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEmailModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={handleTestEmail}
              disabled={loading}
            >
              Probar Conexión
            </Button>
            <Button
              onClick={handleSendEmailBackup}
              disabled={loading || !emailConfigured}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Enviando..." : "Enviar Respaldo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Configurar Google Drive */}
      <Dialog open={showGDriveModal} onOpenChange={setShowGDriveModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Configurar Google Drive
            </DialogTitle>
            <DialogDescription>
              Configura OAuth2 para subir respaldos automáticos a Google Drive
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm mb-2">
                Pasos para configurar:
              </h4>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Ve a Google Cloud Console y crea un proyecto</li>
                <li>Habilita la API de Google Drive</li>
                <li>Crea credenciales OAuth 2.0 (Aplicación de escritorio)</li>
                <li>Copia el Client ID y Client Secret aquí</li>
                <li>Genera la URL de autorización y obtén el código</li>
              </ol>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800">
                📁 <strong>Ubicación del archivo:</strong> Los respaldos se
                subirán a "Mi unidad" en Google Drive con el nombre{" "}
                <code className="bg-amber-100 px-1 rounded">
                  sipark_backup_FECHA_HORA.db
                </code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Client ID
              </label>
              <Input
                value={gdriveConfig.client_id}
                onChange={(e) =>
                  setGdriveConfig({
                    ...gdriveConfig,
                    client_id: e.target.value,
                  })
                }
                placeholder="123456789-abc.apps.googleusercontent.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Client Secret
              </label>
              <Input
                type="password"
                value={gdriveConfig.client_secret}
                onChange={(e) =>
                  setGdriveConfig({
                    ...gdriveConfig,
                    client_secret: e.target.value,
                  })
                }
                placeholder="GOCSPX-••••••••••••••••••••"
              />
            </div>

            <Button
              onClick={handleGenerateGDriveAuthUrl}
              variant="outline"
              className="w-full"
              disabled={!gdriveConfig.client_id || !gdriveConfig.client_secret}
            >
              Generar URL de Autorización
            </Button>

            {gdriveAuthUrl && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 mb-2">
                  Se abrió una ventana del navegador. Autoriza la aplicación y
                  copia el código:
                </p>
                <Input
                  value={gdriveAuthCode}
                  onChange={(e) => setGdriveAuthCode(e.target.value)}
                  placeholder="Pega aquí el código de autorización"
                />
                <Button
                  onClick={handleGetGDriveRefreshToken}
                  disabled={!gdriveAuthCode || loading}
                  className="w-full mt-2"
                  size="sm"
                >
                  Obtener Refresh Token
                </Button>
              </div>
            )}

            {gdriveConfig.refresh_token && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Refresh Token configurado correctamente
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGDriveModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={handleTestGDrive}
              disabled={loading || !gdriveConfig.refresh_token}
            >
              Probar Conexión
            </Button>
            <Button
              onClick={handleUploadToGDrive}
              disabled={loading || !gdriveConfigured}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Subiendo..." : "Subir Respaldo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
