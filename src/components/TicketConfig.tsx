import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Save, Printer, Eye, Upload, X } from "lucide-react";
import { useNotification } from "@/hooks/useNotification";

interface TicketSettings {
  // Información de la empresa
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessWebsite: string;
  businessEmail: string;
  taxId: string;

  // Elementos a mostrar (switches)
  showLogo: boolean;
  showBusinessName: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showWebsite: boolean;
  showEmail: boolean;
  showTaxId: boolean;
  showCashier: boolean;
  showDateTime: boolean;
  showTicketNumber: boolean;
  showThankYouMessage: boolean;

  // Mensajes personalizados
  headerMessage: string;
  footerMessage: string;
  thankYouMessage: string;

  // Configuración de impresión
  paperWidth: number; // en caracteres (40 o 48 típicamente)
  fontSize: string; // 'small' | 'normal' | 'large'
}

const defaultSettings: TicketSettings = {
  businessName: "MI LUDOTECA",
  businessAddress: "Calle Principal #123, Ciudad",
  businessPhone: "+1 234 567 8900",
  businessWebsite: "www.miludoteca.com",
  businessEmail: "info@miludoteca.com",
  taxId: "RFC: ABC123456XYZ",
  showLogo: true,
  showBusinessName: true,
  showAddress: true,
  showPhone: true,
  showWebsite: false,
  showEmail: false,
  showTaxId: true,
  showCashier: true,
  showDateTime: true,
  showTicketNumber: true,
  showThankYouMessage: true,
  headerMessage: "",
  footerMessage: "¡Vuelve pronto!",
  thankYouMessage: "Gracias por tu visita",
  paperWidth: 40,
  fontSize: "normal",
};

export const TicketConfig: React.FC = () => {
  const [settings, setSettings] = useState<TicketSettings>(defaultSettings);
  const [printerMode, setPrinterMode] = useState<"test" | "real">("test");
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { success, error } = useNotification();

  useEffect(() => {
    loadSettings();
    loadLogo();
    loadPrinterMode();
  }, []);

  const loadPrinterMode = async () => {
    try {
      const mode = await (window as any).api.getSetting("printer_mode");
      if (mode) {
        setPrinterMode(mode as "test" | "real");
      }
    } catch (err) {
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await (window as any).api.getSetting(
        "ticket_config",
      );
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
    }
  };

  const loadLogo = async () => {
    try {
      const logo = await (window as any).api.getLogo("ticket");
      if (logo) {
        setLogoPreview(logo);
      }
    } catch (err) {
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await (window as any).api.setSetting(
        "ticket_config",
        JSON.stringify(settings),
      );
      await (window as any).api.setSetting("printer_mode", printerMode);
      success("Configuración guardada correctamente");
    } catch (err) {
      error("Error guardando configuración");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTest = async () => {
    try {
      const printers = await (window as any).api.getPrinters();
      if (printers.length === 0) {
        error("No se encontraron impresoras");
        return;
      }
      await (window as any).api.printTestTicket(printers[0].name);
      success("Ticket de prueba enviado a impresora");
    } catch (err) {
      error("Error imprimiendo ticket de prueba");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      error("Por favor selecciona una imagen válida");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      error("La imagen no debe superar 2MB");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setLogoPreview(base64);

        const extension = file.name.split(".").pop() || "png";
        await (window as any).api.saveLogo("ticket", base64, extension);
        success("Logo cargado correctamente");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      error("Error cargando logo");
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await (window as any).api.deleteLogo("ticket");
      setLogoPreview("");
      success("Logo eliminado");
    } catch (err) {
      error("Error eliminando logo");
    }
  };

  const updateSetting = (key: keyof TicketSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Generar vista previa del ticket
  const generatePreview = () => {
    const lines: string[] = [];
    const width = settings.paperWidth;
    const center = (text: string) => {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      return " ".repeat(padding) + text;
    };
    const line = "=".repeat(width);

    lines.push(line);

    // El logo se mostrará como imagen HTML, no como texto
    if (settings.showLogo && logoPreview) {
      lines.push("[LOGO]"); // Marcador para reemplazar con imagen
      lines.push("");
    }

    if (settings.showBusinessName) {
      lines.push(center(settings.businessName.toUpperCase()));
      lines.push("");
    }

    if (settings.showAddress) {
      lines.push(center(settings.businessAddress));
    }

    if (settings.showPhone) {
      lines.push(center(`Tel: ${settings.businessPhone}`));
    }

    if (settings.showWebsite) {
      lines.push(center(settings.businessWebsite));
    }

    if (settings.showEmail) {
      lines.push(center(settings.businessEmail));
    }

    if (settings.showTaxId) {
      lines.push(center(settings.taxId));
    }

    lines.push(line);

    if (settings.headerMessage) {
      lines.push(center(settings.headerMessage));
      lines.push("");
    }

    if (settings.showTicketNumber) {
      lines.push(`Ticket: #00123`);
    }

    if (settings.showDateTime) {
      lines.push(`Fecha: ${new Date().toLocaleDateString("es-ES")}`);
      lines.push(`Hora: ${new Date().toLocaleTimeString("es-ES")}`);
    }

    if (settings.showCashier) {
      lines.push(`Cajero: Admin`);
    }

    lines.push("");
    lines.push(line);
    lines.push("DETALLE DE VENTA");
    lines.push(line);
    lines.push("");
    lines.push("1x Paquete Básico         $3,500.00");
    lines.push("2x Coca Cola 600ml          $50.00");
    lines.push("");
    lines.push(line);
    lines.push(`Subtotal:              $3,550.00`);
    lines.push(`Descuento:                 $0.00`);
    lines.push(`TOTAL:                 $3,550.00`);
    lines.push(line);
    lines.push("");
    lines.push(`Pago: Efectivo         $4,000.00`);
    lines.push(`Cambio:                  $450.00`);
    lines.push("");

    if (settings.showThankYouMessage && settings.thankYouMessage) {
      lines.push(line);
      lines.push(center(settings.thankYouMessage));
    }

    if (settings.footerMessage) {
      lines.push(center(settings.footerMessage));
    }

    lines.push(line);
    lines.push("");

    return lines.join("\n");
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Configuración de Tickets
          </h1>
          <p className="text-slate-600 mt-1">
            Personaliza el diseño de tus tickets de venta
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            size="default"
            className="flex-1 sm:flex-none gap-2"
          >
            <Eye className="w-5 h-5" />
            <span className="hidden sm:inline">{showPreview ? "Ocultar" : "Mostrar"} Vista Previa</span>
            <span className="sm:hidden">{showPreview ? "Ocultar" : "Vista"}</span>
          </Button>
          <Button
            onClick={handlePrintTest}
            variant="outline"
            size="default"
            className="flex-1 sm:flex-none gap-2"
          >
            <Printer className="w-5 h-5" />
            <span className="hidden sm:inline">Imprimir Prueba</span>
            <span className="sm:hidden">Prueba</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            size="default"
            className="flex-1 sm:flex-none gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto mt-2 sm:mt-0"
          >
            <Save className="w-5 h-5" />
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Configuración */}
          <div className="space-y-6">
            {/* Logo */}
            <Card className="shadow-md border-none">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Logo para Tickets
                </h3>
                <div className="space-y-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-full h-32 object-contain border border-slate-200 rounded-lg bg-slate-50"
                      />
                      <Button
                        onClick={handleRemoveLogo}
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 gap-2"
                      >
                        <X className="w-4 h-4" />
                        Eliminar
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 mb-3">
                        Selecciona una imagen para el logo
                      </p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                      >
                        Seleccionar Imagen
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-slate-500">
                    Formatos: JPG, PNG, GIF. Tamaño máximo: 2MB
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Información de la Empresa */}
            <Card className="shadow-md border-none">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Información de la Empresa
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre del Negocio
                    </label>
                    <Input
                      value={settings.businessName}
                      onChange={(e) =>
                        updateSetting("businessName", e.target.value)
                      }
                      placeholder="MI LUDOTECA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Dirección
                    </label>
                    <Input
                      value={settings.businessAddress}
                      onChange={(e) =>
                        updateSetting("businessAddress", e.target.value)
                      }
                      placeholder="Calle Principal #123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Teléfono
                    </label>
                    <Input
                      value={settings.businessPhone}
                      onChange={(e) =>
                        updateSetting("businessPhone", e.target.value)
                      }
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sitio Web
                    </label>
                    <Input
                      value={settings.businessWebsite}
                      onChange={(e) =>
                        updateSetting("businessWebsite", e.target.value)
                      }
                      placeholder="www.miludoteca.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email
                    </label>
                    <Input
                      value={settings.businessEmail}
                      onChange={(e) =>
                        updateSetting("businessEmail", e.target.value)
                      }
                      placeholder="info@miludoteca.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      RFC / Tax ID
                    </label>
                    <Input
                      value={settings.taxId}
                      onChange={(e) => updateSetting("taxId", e.target.value)}
                      placeholder="RFC: ABC123456XYZ"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Elementos a Mostrar */}
            <Card className="shadow-md border-none">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Elementos del Ticket
                </h3>
                <div className="space-y-3">
                  {[
                    { key: "showLogo", label: "Mostrar Logo/Iconos" },
                    { key: "showBusinessName", label: "Nombre del Negocio" },
                    { key: "showAddress", label: "Dirección" },
                    { key: "showPhone", label: "Teléfono" },
                    { key: "showWebsite", label: "Sitio Web" },
                    { key: "showEmail", label: "Email" },
                    { key: "showTaxId", label: "RFC / Tax ID" },
                    { key: "showTicketNumber", label: "Número de Ticket" },
                    { key: "showDateTime", label: "Fecha y Hora" },
                    { key: "showCashier", label: "Nombre del Cajero" },
                    {
                      key: "showThankYouMessage",
                      label: "Mensaje de Agradecimiento",
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {item.label}
                      </span>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            settings[
                              item.key as keyof TicketSettings
                            ] as boolean
                          }
                          onChange={(e) =>
                            updateSetting(
                              item.key as keyof TicketSettings,
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mensajes Personalizados */}
            <Card className="shadow-md border-none">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Mensajes Personalizados
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mensaje de Encabezado
                    </label>
                    <Input
                      value={settings.headerMessage}
                      onChange={(e) =>
                        updateSetting("headerMessage", e.target.value)
                      }
                      placeholder="Ej: ¡Bienvenidos!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mensaje de Agradecimiento
                    </label>
                    <Input
                      value={settings.thankYouMessage}
                      onChange={(e) =>
                        updateSetting("thankYouMessage", e.target.value)
                      }
                      placeholder="Gracias por tu visita"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mensaje de Pie de Página
                    </label>
                    <Input
                      value={settings.footerMessage}
                      onChange={(e) =>
                        updateSetting("footerMessage", e.target.value)
                      }
                      placeholder="¡Vuelve pronto!"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Impresión */}
            <Card className="shadow-md border-none">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Configuración de Impresión
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ancho del Papel (caracteres)
                    </label>
                    <select
                      value={settings.paperWidth}
                      onChange={(e) =>
                        updateSetting("paperWidth", parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={32}>32 caracteres (58mm)</option>
                      <option value={40}>40 caracteres (80mm)</option>
                      <option value={48}>48 caracteres (80mm ancho)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tamaño de Fuente
                    </label>
                    <select
                      value={settings.fontSize}
                      onChange={(e) =>
                        updateSetting("fontSize", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="small">Pequeña</option>
                      <option value="normal">Normal</option>
                      <option value="large">Grande</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modo de Impresión */}
            <Card className="shadow-md border-none border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Modo de Operación
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    printerMode === "real" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {printerMode === "real" ? "ENVÍO REAL" : "MODO PRUEBA"}
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    En <b>Modo Prueba</b>, los tickets se muestran solo en la consola del navegador para que puedas verificar el diseño sin gastar papel.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPrinterMode("test")}
                      variant={printerMode === "test" ? "default" : "outline"}
                      className={`flex-1 ${printerMode === "test" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                    >
                      Modo Prueba (Consola)
                    </Button>
                    <Button
                      onClick={() => setPrinterMode("real")}
                      variant={printerMode === "real" ? "default" : "outline"}
                      className={`flex-1 ${printerMode === "real" ? "bg-green-600 hover:bg-green-700" : ""}`}
                    >
                      Modo Real (Impresora)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista Previa */}
          {showPreview && (
            <div className="lg:sticky lg:top-6 h-fit">
              <Card className="shadow-md border-none">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Vista Previa del Ticket
                  </h3>
                  <div className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-4 overflow-x-auto">
                    {settings.showLogo && logoPreview && (
                      <div className="flex justify-center mb-2">
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="max-w-[120px] max-h-[80px] object-contain"
                        />
                      </div>
                    )}
                    <pre
                      className={`font-mono ${
                        settings.fontSize === "small"
                          ? "text-xs"
                          : settings.fontSize === "large"
                            ? "text-base"
                            : "text-sm"
                      } text-slate-800 whitespace-pre`}
                      style={{ lineHeight: "1.4" }}
                    >
                      {generatePreview().replace("[LOGO]\n\n", "")}
                    </pre>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Esta es una vista previa aproximada. El ticket real puede
                    variar según la impresora.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
