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
  RefreshCw,
  Copy,
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
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [systemLogo, setSystemLogo] = useState("");

  // Formas de pago
  const [checkPayeeName, setCheckPayeeName] = useState("");
  const [bankAccounts, setBankAccounts] = useState<Array<{bankName: string; bankAccountType: string; bankAccountNumber: string; bankAccountHolder: string}>>([]);
  const [editingBankIndex, setEditingBankIndex] = useState<number | null>(null);
  const [newBankForm, setNewBankForm] = useState({ bankName: "", bankAccountType: "cordobas", bankAccountNumber: "", bankAccountHolder: "" });
  const [showAddBankForm, setShowAddBankForm] = useState(false);

  // Operaciones
  const [currency, setCurrency] = useState("NIO");
  const [exchangeRate, setExchangeRate] = useState("1.00");
  const [nfcEntryPrice, setNfcEntryPrice] = useState("100.00");
  const [extraMinutePrice, setExtraMinutePrice] = useState("1.00");
  const [nfcCustomMessage, setNfcCustomMessage] = useState("¡Bienvenido a SIPARK!");
  const [nfcSystemMode, setNfcSystemMode] = useState("production");
  const [nfcAlertDuration, setNfcAlertDuration] = useState("5");
  const [receiptCopies, setReceiptCopies] = useState("1"); // Número de copias de recibo

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

  // Device Debugging
  const [usbDevices, setUsbDevices] = useState<any[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<any>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [nfcVidPid, setNfcVidPid] = useState("");
  const [nfcVidPidEditing, setNfcVidPidEditing] = useState(false);

  const { setSetting, getAllSettings, checkDatabaseConnection } = useDatabase();
  const { success, error: errorNotification } = useNotification();
  const {
    printers,
    ticketPrinter,
    normalPrinter,
    setTicketPrinter,
    setNormalPrinter,
    isLoading: isLoadingPrinters,
    printerStatus,
    loadPrinters,
    printTestTicket,
    printTestNormal,
  } = usePrinter();

  useEffect(() => {
    cargarConfiguracion();
    verificarConexionBD();
    cargarEstadoScheduler();
    loadDeviceStatus();
  }, []);

  const loadDeviceStatus = async () => {
    try {
      setLoadingDevices(true);
      const [devices, status] = await Promise.all([
        (window as any).api.getUsbDevicesDebug(),
        (window as any).api.getConnectedDevices()
      ]);
      setUsbDevices(devices || []);
      setDeviceStatus(status);
    } catch (err) {
      console.error("Error loading device status:", err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const verificarConexionBD = async () => {
    try {
      const result = await checkDatabaseConnection();
      setDbConnected(result.connected);
      setDbMessage(result.message);
    } catch (err) {
      setDbConnected(false);
      setDbMessage("Error de conexión");
    }
  };

  const cargarEstadoScheduler = async () => {
    try {
      const status = await (window as any).api.getSchedulerStatus();
      setSchedulerStatus(status);
    } catch (err) {
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
            case "company_phone":
              setCompanyPhone(setting.value);
              break;
            case "company_address":
              setCompanyAddress(setting.value);
              break;
            case "payment_methods":
              try {
                const pm = JSON.parse(setting.value);
                setCheckPayeeName(pm.checkPayeeName || "");
                if (Array.isArray(pm.bankAccounts)) {
                  setBankAccounts(pm.bankAccounts);
                } else if (pm.bankName && pm.bankAccountNumber) {
                  // Manejar formato antiguo (una sola cuenta)
                  setBankAccounts([
                    {
                      bankName: pm.bankName,
                      bankAccountType: pm.bankAccountType || "cordobas",
                      bankAccountNumber: pm.bankAccountNumber,
                      bankAccountHolder: pm.bankAccountHolder || "",
                    },
                  ]);
                } else {
                  setBankAccounts([]);
                }
              } catch (e) {
                setBankAccounts([]);
              }
              break;
            case "currency_primary":
              setCurrency(setting.value);
              break;
            case "exchange_rate":
              setExchangeRate(setting.value);
              break;
            case "nfc_entry_price":
              setNfcEntryPrice(setting.value);
              break;
            case "extra_minute_price":
              setExtraMinutePrice(setting.value);
              break;
            case "nfc_custom_message":
              setNfcCustomMessage(setting.value);
              break;
            case "nfc_system_mode":
              setNfcSystemMode(setting.value);
              break;
            case "nfc_alert_duration":
              setNfcAlertDuration(setting.value);
              break;
            case "nfc_reader_vid_pid":
              setNfcVidPid(setting.value || "");
              break;
            case "receipt_copies":
              setReceiptCopies(setting.value || "1");
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
            case "system_logo":
              setSystemLogo(setting.value);
              break;
          }
        });
      }
    } catch (err) {
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
      await setSetting("company_phone", companyPhone);
      await setSetting("company_address", companyAddress);

      const paymentMethods = {
        checkPayeeName,
        bankAccounts,
      };
      await setSetting("payment_methods", JSON.stringify(paymentMethods));
      
      await (window as any).api.applyBranding();
      success("Configuración de empresa guardada correctamente");
    } catch (err) {
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
      await setSetting("nfc_entry_price", nfcEntryPrice.toString());
      await setSetting("extra_minute_price", extraMinutePrice.toString());
      await setSetting("nfc_custom_message", nfcCustomMessage);
      await setSetting("nfc_system_mode", nfcSystemMode);
      await setSetting("nfc_alert_duration", nfcAlertDuration.toString());
      await setSetting("receipt_copies", receiptCopies);
      success("Configuración de operaciones guardada correctamente");
    } catch (err) {
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-100 h-auto">
          <TabsTrigger value="empresa" className="gap-2 py-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Empresa</span>
            <span className="sm:hidden text-xs">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="operaciones" className="gap-2 py-2">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Operaciones</span>
            <span className="sm:hidden text-xs">Oper.</span>
          </TabsTrigger>
          <TabsTrigger value="contabilidad" className="gap-2 py-2">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Contabilid.</span>
            <span className="sm:hidden text-xs">Contab.</span>
          </TabsTrigger>
          <TabsTrigger value="hardware" className="gap-2 py-2">
            <HardDrive className="w-4 h-4" />
            <span className="hidden sm:inline">Hardware</span>
            <span className="sm:hidden text-xs">Hardw.</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Empresa */}
        <TabsContent value="empresa" className="flex-1 overflow-auto">
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                    placeholder="SIPARK"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const logoName = await (window as any).api.selectSystemLogo();
                          if (logoName) {
                            setSystemLogo(logoName);
                            await (window as any).api.applyBranding();
                            success("Logo actualizado correctamente.");
                          }
                        } catch (err) {
                          errorNotification("Error al cambiar el logo");
                        }
                      }}
                      className="text-xs gap-2 border-slate-300 hover:bg-slate-50 font-semibold"
                    >
                      {(() => {
                        const isVite = window.location.port === "5173";
                        const serverPort = isVite ? "9595" : (window.location.port || "80");
                        const baseUrl = `http://${window.location.hostname}:${serverPort}`;
                        return <img src={systemLogo ? `${baseUrl}/brand/${systemLogo}` : "./icon.png"} className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />;
                      })()}
                      Seleccionar Logo de Marca
                    </Button>
                    <p className="text-[10px] text-slate-500 italic">Formatos: PNG, JPG (Se recomienda cuadrado)</p>
                  </div>
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

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Teléfono de la Empresa
                  </label>
                  <input
                    type="text"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+505 2222-3333"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Dirección de la Empresa
                  </label>
                  <textarea
                    rows={2}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Calle y número, ciudad, país"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Formas de Pago (para Cotizaciones)</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Cheque a nombre de:
                      </label>
                      <input
                        type="text"
                        value={checkPayeeName}
                        onChange={(e) => setCheckPayeeName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Nombre para cheques"
                      />
                    </div>

                    {/* Lista de cuentas bancarias */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Cuentas Bancarias para Transferencia</p>
                        <button
                          type="button"
                          onClick={() => { setShowAddBankForm(true); setEditingBankIndex(null); setNewBankForm({ bankName: "", bankAccountType: "cordobas", bankAccountNumber: "", bankAccountHolder: "" }); }}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          + Agregar
                        </button>
                      </div>

                      {/* Formulario de agregar/editar */}
                      {(showAddBankForm || editingBankIndex !== null) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 space-y-2">
                          <p className="text-xs font-bold text-blue-800">{editingBankIndex !== null ? "Editar cuenta" : "Nueva cuenta bancaria"}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Nombre del Banco</label>
                              <input
                                type="text"
                                value={newBankForm.bankName}
                                onChange={(e) => setNewBankForm({ ...newBankForm, bankName: e.target.value })}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                                placeholder="Banpro, BAC, Lafise..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Tipo de Cuenta</label>
                              <select
                                value={newBankForm.bankAccountType}
                                onChange={(e) => setNewBankForm({ ...newBankForm, bankAccountType: e.target.value })}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                              >
                                <option value="cordobas">Córdobas (NIO)</option>
                                <option value="dolares">Dólares (USD)</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Número de Cuenta</label>
                              <input
                                type="text"
                                value={newBankForm.bankAccountNumber}
                                onChange={(e) => setNewBankForm({ ...newBankForm, bankAccountNumber: e.target.value })}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                                placeholder="0000-0000-0000"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Nombre de la Cuenta</label>
                              <input
                                type="text"
                                value={newBankForm.bankAccountHolder}
                                onChange={(e) => setNewBankForm({ ...newBankForm, bankAccountHolder: e.target.value })}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                                placeholder="Razón social o nombre"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => { setShowAddBankForm(false); setEditingBankIndex(null); }}
                              className="text-xs px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-100"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!newBankForm.bankName || !newBankForm.bankAccountNumber) return;
                                let updatedAccounts;
                                if (editingBankIndex !== null) {
                                  updatedAccounts = [...bankAccounts];
                                  updatedAccounts[editingBankIndex] = newBankForm;
                                  setEditingBankIndex(null);
                                } else {
                                  updatedAccounts = [...bankAccounts, newBankForm];
                                  setShowAddBankForm(false);
                                }
                                setBankAccounts(updatedAccounts);
                                setNewBankForm({ bankName: "", bankAccountType: "cordobas", bankAccountNumber: "", bankAccountHolder: "" });
                                
                                // Opcional: Auto-guardar para evitar confusión del usuario
                                const paymentMethods = {
                                  checkPayeeName,
                                  bankAccounts: updatedAccounts,
                                };
                                await setSetting("payment_methods", JSON.stringify(paymentMethods));
                              }}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                            >
                              {editingBankIndex !== null ? "Guardar" : "Agregar"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Lista de cuentas guardadas */}
                      {bankAccounts.length === 0 && !showAddBankForm && editingBankIndex === null && (
                        <p className="text-xs text-slate-400 italic">No hay cuentas bancarias configuradas.</p>
                      )}
                      {bankAccounts.map((acct, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-2">
                          <div className="flex items-start justify-between">
                            <div className="text-sm">
                              <p className="font-semibold text-slate-800">{acct.bankName} — <span className="text-slate-500">{acct.bankAccountType === "dolares" ? "Dólares (USD)" : "Córdobas (NIO)"}</span></p>
                              <p className="text-slate-600">N° {acct.bankAccountNumber}</p>
                              {acct.bankAccountHolder && <p className="text-slate-500 text-xs">{acct.bankAccountHolder}</p>}
                            </div>
                            <div className="flex gap-1 ml-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => { setNewBankForm(acct); setEditingBankIndex(idx); setShowAddBankForm(false); }}
                                className="text-xs text-blue-600 hover:underline px-1"
                              >Editar</button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const updatedAccounts = bankAccounts.filter((_, i) => i !== idx);
                                  setBankAccounts(updatedAccounts);
                                  // Auto-guardar eliminación
                                  const paymentMethods = {
                                    checkPayeeName,
                                    bankAccounts: updatedAccounts,
                                  };
                                  await setSetting("payment_methods", JSON.stringify(paymentMethods));
                                }}
                                className="text-xs text-red-500 hover:underline px-1"
                              >Eliminar</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
        <TabsContent value="operaciones" className="flex-1 overflow-auto">
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

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Precio de Entrada con Membresía
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={nfcEntryPrice}
                      onChange={(e) => setNfcEntryPrice(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="100.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Precio de Minuto Extra
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={extraMinutePrice}
                      onChange={(e) => setExtraMinutePrice(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1.00"
                    />
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Se cobrará por cada minuto adicional al terminar el paquete.
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Mensaje personalizado en Pantalla TV (Ventas/Membresía)
                    </label>
                    <input
                      type="text"
                      value={nfcCustomMessage}
                      onChange={(e) => setNfcCustomMessage(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: ¡Disfruta tu estancia! / ¡Feliz día!"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Aparecerá en la pantalla al cobrar con éxito.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Duración del Mensaje de Éxito (Segundos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={nfcAlertDuration}
                      onChange={(e) => setNfcAlertDuration(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tiempo que se mostrará antes de volver la publicidad.
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                     Modo de Lector NFC
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="radio" name="nfcMode" value="production" checked={nfcSystemMode === "production"} onChange={(e) => setNfcSystemMode(e.target.value)} className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-semibold">Modo Producción</p>
                        <p className="text-xs text-slate-500">Usa Hardware USB Real (Node-HID). Previene bloqueos de teclado.</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer mt-2">
                      <input type="radio" name="nfcMode" value="development" checked={nfcSystemMode === "development"} onChange={(e) => setNfcSystemMode(e.target.value)} className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-semibold">Modo Desarrollo</p>
                        <p className="text-xs text-slate-500">Muestra un botón flotante en POS para simular inserción manual de UIDs NFC.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Selector de Copias de Recibo */}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <label className="block text-sm font-semibold text-slate-900 mb-3">
                    Copias de Recibo a Imprimir
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setReceiptCopies("1")}
                      className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${
                        receiptCopies === "1"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">1</div>
                        <div className="text-xs font-medium">Copia Única</div>
                        <div className="text-[10px] text-slate-500 mt-1">Original Cliente</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptCopies("2")}
                      className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${
                        receiptCopies === "2"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">2</div>
                        <div className="text-xs font-medium">Dos Copias</div>
                        <div className="text-[10px] text-slate-500 mt-1">Cliente + Contabilidad</div>
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    {receiptCopies === "1" 
                      ? "Se imprimirá una sola copia marcada como 'Original Cliente'"
                      : "Se imprimirán dos copias: 'Original Cliente' y 'Copia: Contabilidad'"
                    }
                  </p>
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
        <TabsContent value="contabilidad" className="flex-1 overflow-auto">
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
        <TabsContent value="hardware" className="flex-1 overflow-auto">
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

            {/* Dispositivos Conectados - DEBUG */}
            <Card className="shadow-md border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">Dispositivos Conectados</CardTitle>
                  <CardDescription>
                    Información de dispositivos USB detectados
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDeviceStatus}
                  disabled={loadingDevices}
                  className="gap-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingDevices ? "animate-spin" : ""}`} />
                  {loadingDevices ? "Actualizando..." : "Actualizar"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Estado actual */}
                {deviceStatus && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-700">Impresora</span>
                          <span className={`w-2 h-2 rounded-full ${deviceStatus.printerConnected ? "bg-emerald-500" : "bg-rose-500"}`} />
                        </div>
                        <p className="text-xs text-slate-600">
                          {deviceStatus.printerConnected ? "Conectada" : "No detectada"}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-700">Lector NFC</span>
                          <span className={`w-2 h-2 rounded-full ${deviceStatus.nfcReaders > 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                        </div>
                        <p className="text-xs text-slate-600">
                          {deviceStatus.nfcReaders > 0 ? `${deviceStatus.nfcReaders} detectado(s)` : "No detectado"}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-700">Cajón</span>
                          <span className={`w-2 h-2 rounded-full ${deviceStatus.drawerAvailable ? "bg-emerald-500" : "bg-slate-400"}`} />
                        </div>
                        <p className="text-xs text-slate-600">
                          {deviceStatus.drawerAvailable ? "Disponible" : "No disponible"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                      <p className="font-semibold text-blue-900 mb-1">Última actualización:</p>
                      <p className="text-blue-800">{new Date(deviceStatus.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {!deviceStatus && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      Haz clic en "Actualizar" para detectar dispositivos
                    </p>
                  </div>
                )}

                {/* Lista de dispositivos USB HID */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    Dispositivos USB HID Detectados ({usbDevices.length})
                  </h4>
                  
                  {usbDevices.length === 0 ? (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-800 font-semibold mb-2">
                        ⚠️ No se detectaron dispositivos USB HID
                      </p>
                      <p className="text-xs text-amber-700 mb-2">
                        Esto puede significar:
                      </p>
                      <ul className="text-xs text-amber-700 list-disc ml-4 space-y-1">
                        <li>La librería node-hid no tiene permisos en Windows</li>
                        <li>Los dispositivos no están conectados</li>
                        <li>La aplicación necesita ejecutarse como administrador</li>
                      </ul>
                      <p className="text-xs text-amber-700 mt-2">
                        💡 Intenta: Cierra la app, ejecuta como administrador (clic derecho → "Ejecutar como administrador") y vuelve a intentar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {usbDevices.map((device, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2 flex items-center justify-between mb-1">
                              <span className="text-slate-900 font-semibold">{device.product}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${device.source === 'node-hid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {device.source === 'node-hid' ? 'HID' : 'PowerShell'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Fabricante:</span>
                              <span className="ml-2 text-slate-900">{device.manufacturer}</span>
                            </div>
                            {device.vendorId !== 'N/A' && (
                              <div>
                                <span className="text-slate-500">VID:PID:</span>
                                <span className="ml-2 text-slate-900">{device.vendorId}:{device.productId}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 h-5 px-2"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${device.vendorId}:${device.productId}`);
                                    success("VID:PID copiado al portapapeles");
                                  }}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            {device.usage !== 'N/A' && (
                              <div>
                                <span className="text-slate-500">Usage:</span>
                                <span className="ml-2 text-slate-900">{device.usage} (Page: {device.usagePage})</span>
                              </div>
                            )}
                            {device.serialNumber && device.serialNumber !== 'N/A' && (
                              <div className="col-span-2">
                                <span className="text-slate-500">Serial/ID:</span>
                                <span className="ml-2 text-slate-900 break-all">{device.serialNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Configuración manual de NFC VID:PID */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    Configuración Manual de Lector NFC
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-800 mb-2">
                        💡 <strong>Tip:</strong> Si tu lector NFC YARONGTECH no se detecta automáticamente, puedes configurarlo manualmente:
                      </p>
                      <ol className="text-xs text-blue-800 ml-4 list-decimal space-y-1">
                        <li>Busca tu dispositivo en la lista de arriba</li>
                        <li>Copia el VID:PID haciendo clic en el botón de copiar</li>
                        <li>Habilita el campo de abajo y pega el código</li>
                        <li>Guarda la configuración</li>
                      </ol>
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          VID:PID del Lector NFC
                        </label>
                        <input
                          type="text"
                          value={nfcVidPid}
                          onChange={(e) => setNfcVidPid(e.target.value)}
                          disabled={!nfcVidPidEditing}
                          placeholder="Ej: 0xFFFF:0x0035"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                        {nfcVidPid && (
                          <p className="text-xs text-slate-500 mt-1">
                            Configurado: {nfcVidPid}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => setNfcVidPidEditing(!nfcVidPidEditing)}
                        className="gap-2"
                      >
                        {nfcVidPidEditing ? "Cancelar" : "Editar"}
                      </Button>
                      
                      {nfcVidPidEditing && (
                        <Button
                          onClick={async () => {
                            try {
                              setLoading(true);
                              await setSetting("nfc_reader_vid_pid", nfcVidPid);
                              success("VID:PID del lector NFC guardado. Reinicia la aplicación para aplicar cambios.");
                              setNfcVidPidEditing(false);
                              // Recargar dispositivos
                              await loadDeviceStatus();
                            } catch (err) {
                              errorNotification("Error al guardar VID:PID");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading || !nfcVidPid}
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Guardar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800">
                    ⚠️ <strong>Nota:</strong> Después de configurar el VID:PID, debes reiniciar la aplicación para que los cambios surtan efecto.
                  </p>
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

            {/* Configuración de Impresoras */}
            <Card className="shadow-md border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">Impresoras</CardTitle>
                  <CardDescription>
                    Configura la impresora para tickets/recibos
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPrinters()}
                  disabled={isLoadingPrinters}
                  className="gap-2 border-slate-300 hover:bg-slate-50"
                >
                  <Printer className={`w-4 h-4 ${isLoadingPrinters ? "animate-spin" : ""}`} />
                  {isLoadingPrinters ? "Buscando..." : "Buscar Impresoras"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Impresora de Tickets (Térmica)
                  </label>
                  <select
                    value={ticketPrinter}
                    onChange={async (e) => {
                      setTicketPrinter(e.target.value);
                      await setSetting("ticket_printer", e.target.value);
                    }}
                    disabled={isLoadingPrinters || printers.length === 0}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed mb-4"
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

                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Impresora Normal (A4 / Documentos)
                  </label>
                  <select
                    value={normalPrinter}
                    onChange={async (e) => {
                      setNormalPrinter(e.target.value);
                      await setSetting("normal_printer", e.target.value);
                    }}
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
                    {ticketPrinter
                      ? `Impresora tickets: ${ticketPrinter}`
                      : "Selecciona una impresora de tickets"}
                  </p>
                </div>

                <Button
                  onClick={async () => {
                    try {
                      const result = await printTestTicket(ticketPrinter);
                      if (result) success("Ticket de prueba enviado");
                    } catch (err: any) {
                      errorNotification(`Error tickets: ${err.message || "Fallo desconocido"}`);
                    }
                  }}
                  disabled={!ticketPrinter || isLoadingPrinters}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed mb-3"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ticket Térmico de Prueba
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      const result = await printTestNormal(normalPrinter);
                      if (result) success("Prueba en impresora normal enviada");
                    } catch (err: any) {
                      errorNotification(`Error normal: ${err.message || "Fallo desconocido"}`);
                    }
                  }}
                  disabled={!normalPrinter || isLoadingPrinters}
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Prueba en Impresora Normal
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

            <div className="flex items-center gap-0.5 p-3 bg-amber-50 rounded-lg border border-amber-200">
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
                <p className="text-xs text-green-800 flex items-center gap-0.5">
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
