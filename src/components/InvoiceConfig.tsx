import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Save, Eye, Upload, X } from "lucide-react";
import { useNotification } from "@/hooks/useNotification";

interface InvoiceSettings {
  // Información de la empresa
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessWebsite: string;
  businessEmail: string;
  taxId: string;

  // Información fiscal
  fiscalRegime: string;
  cfdiUse: string;

  // Logo
  logoPath: string;

  // Elementos a mostrar (switches)
  showLogo: boolean;
  showBusinessName: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showWebsite: boolean;
  showEmail: boolean;
  showTaxId: boolean;
  showFiscalRegime: boolean;
  showInvoiceNumber: boolean;
  showDateTime: boolean;
  showPaymentTerms: boolean;

  // Mensajes personalizados
  headerMessage: string;
  footerMessage: string;
  paymentTerms: string;
  bankInfo: string;

  // Configuración de diseño
  primaryColor: string;
  fontSize: string;
}

const defaultSettings: InvoiceSettings = {
  businessName: "MI LUDOTECA S.A. DE C.V.",
  businessAddress:
    "Calle Principal #123, Col. Centro, CP 12345, Ciudad, Estado",
  businessPhone: "+1 234 567 8900",
  businessWebsite: "www.miludoteca.com",
  businessEmail: "facturacion@miludoteca.com",
  taxId: "ABC123456XYZ",
  fiscalRegime: "601 - General de Ley Personas Morales",
  cfdiUse: "G03 - Gastos en general",
  logoPath: "",
  showLogo: true,
  showBusinessName: true,
  showAddress: true,
  showPhone: true,
  showWebsite: true,
  showEmail: true,
  showTaxId: true,
  showFiscalRegime: true,
  showInvoiceNumber: true,
  showDateTime: true,
  showPaymentTerms: true,
  headerMessage: "",
  footerMessage: "Gracias por su preferencia",
  paymentTerms: "Pago a 30 días",
  bankInfo: "Banco: BBVA | Cuenta: 1234567890 | CLABE: 012345678901234567",
  primaryColor: "#2563eb",
  fontSize: "normal",
};

export const InvoiceConfig: React.FC = () => {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useNotification();

  useEffect(() => {
    loadSettings();
    loadLogo();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await (window as any).api.getSetting(
        "invoice_config",
      );
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
    }
  };

  const loadLogo = async () => {
    try {
      const logo = await (window as any).api.getLogo("invoice");
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
        "invoice_config",
        JSON.stringify(settings),
      );
      success("Configuración guardada correctamente");
    } catch (err) {
      error("Error guardando configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      error("Por favor selecciona una imagen válida");
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      error("La imagen no debe superar 2MB");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setLogoPreview(base64);

        // Guardar logo
        const extension = file.name.split(".").pop() || "png";
        await (window as any).api.saveLogo("invoice", base64, extension);
        success("Logo cargado correctamente");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      error("Error cargando logo");
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await (window as any).api.deleteLogo("invoice");
      setLogoPreview("");
      success("Logo eliminado");
    } catch (err) {
      error("Error eliminando logo");
    }
  };

  const updateSetting = (key: keyof InvoiceSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Generar vista previa de la factura
  const generatePreview = () => {
    return (
      <div className="bg-white p-8 border border-slate-300 rounded-lg shadow-sm">
        {/* Header */}
        <div
          className="flex justify-between items-start mb-6 pb-4 border-b-2"
          style={{ borderColor: settings.primaryColor }}
        >
          <div className="flex items-start gap-4">
            {settings.showLogo && logoPreview && (
              <img
                src={logoPreview}
                alt="Logo"
                className="w-24 h-24 object-contain"
              />
            )}
            <div>
              {settings.showBusinessName && (
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  {settings.businessName}
                </h1>
              )}
              {settings.showAddress && (
                <p className="text-sm text-slate-600">
                  {settings.businessAddress}
                </p>
              )}
              {settings.showPhone && (
                <p className="text-sm text-slate-600">
                  Tel: {settings.businessPhone}
                </p>
              )}
              {settings.showEmail && (
                <p className="text-sm text-slate-600">
                  {settings.businessEmail}
                </p>
              )}
              {settings.showWebsite && (
                <p className="text-sm text-slate-600">
                  {settings.businessWebsite}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-3 mb-2">
              <h2
                className="text-3xl font-bold"
                style={{ color: settings.primaryColor }}
              >
                FACTURA
              </h2>
              {settings.showInvoiceNumber && (
                <span className="text-2xl font-bold text-slate-900">00123</span>
              )}
            </div>
            {settings.showDateTime && (
              <>
                <p className="text-sm text-slate-600">
                  Fecha: {new Date().toLocaleDateString("es-ES")}
                </p>
                <p className="text-sm text-slate-600">
                  Hora: {new Date().toLocaleTimeString("es-ES")}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Información Fiscal */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded">
          <div>
            {settings.showTaxId && (
              <p className="text-sm">
                <span className="font-semibold">RFC:</span> {settings.taxId}
              </p>
            )}
            {settings.showFiscalRegime && (
              <p className="text-sm">
                <span className="font-semibold">Régimen Fiscal:</span>{" "}
                {settings.fiscalRegime}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm">
              <span className="font-semibold">Uso CFDI:</span>{" "}
              {settings.cfdiUse}
            </p>
            {settings.showPaymentTerms && (
              <p className="text-sm">
                <span className="font-semibold">Condiciones:</span>{" "}
                {settings.paymentTerms}
              </p>
            )}
          </div>
        </div>

        {/* Cliente */}
        <div className="mb-6 p-4 border border-slate-200 rounded">
          <h3 className="font-semibold text-slate-900 mb-2">CLIENTE</h3>
          <p className="text-sm text-slate-700">Juan Pérez García</p>
          <p className="text-sm text-slate-600">RFC: PEGJ850101ABC</p>
          <p className="text-sm text-slate-600">Calle Ejemplo #456, Ciudad</p>
        </div>

        {/* Tabla de Conceptos */}
        <table className="w-full mb-6">
          <thead>
            <tr
              className="border-b-2"
              style={{ borderColor: settings.primaryColor }}
            >
              <th className="text-left py-2 text-sm font-semibold">Cantidad</th>
              <th className="text-left py-2 text-sm font-semibold">
                Descripción
              </th>
              <th className="text-right py-2 text-sm font-semibold">
                P. Unitario
              </th>
              <th className="text-right py-2 text-sm font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-3 text-sm">1</td>
              <td className="py-3 text-sm">Paquete Fiesta Básico - 3 horas</td>
              <td className="py-3 text-sm text-right">$3,500.00</td>
              <td className="py-3 text-sm text-right">$3,500.00</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 text-sm">2</td>
              <td className="py-3 text-sm">Bebida Coca Cola 600ml</td>
              <td className="py-3 text-sm text-right">$25.00</td>
              <td className="py-3 text-sm text-right">$50.00</td>
            </tr>
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm">
              <span>Subtotal:</span>
              <span>$3,550.00</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span>IVA (16%):</span>
              <span>$568.00</span>
            </div>
            <div
              className="flex justify-between py-3 text-lg font-bold border-t-2"
              style={{ borderColor: settings.primaryColor }}
            >
              <span>TOTAL:</span>
              <span>$4,118.00</span>
            </div>
          </div>
        </div>

        {/* Información Bancaria */}
        {settings.bankInfo && (
          <div className="mb-4 p-3 bg-slate-50 rounded">
            <p className="text-xs font-semibold text-slate-700 mb-1">
              DATOS BANCARIOS
            </p>
            <p className="text-xs text-slate-600">{settings.bankInfo}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-200">
          {settings.footerMessage && (
            <p className="text-sm text-slate-600">{settings.footerMessage}</p>
          )}
          <p className="text-xs text-slate-500 mt-2">
            Este documento es una representación impresa de un CFDI
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Configuración de Facturas
          </h1>
          <p className="text-slate-600 mt-1">
            Personaliza el diseño de tus facturas
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
                  Logo de la Empresa
                </h3>
                <div className="space-y-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-full h-48 object-contain border border-slate-200 rounded-lg bg-slate-50"
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
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 mb-3">
                        Arrastra una imagen o haz clic para seleccionar
                      </p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
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
                      Razón Social
                    </label>
                    <Input
                      value={settings.businessName}
                      onChange={(e) =>
                        updateSetting("businessName", e.target.value)
                      }
                      placeholder="MI LUDOTECA S.A. DE C.V."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Dirección Fiscal
                    </label>
                    <Input
                      value={settings.businessAddress}
                      onChange={(e) =>
                        updateSetting("businessAddress", e.target.value)
                      }
                      placeholder="Calle Principal #123, Col. Centro"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                        RFC
                      </label>
                      <Input
                        value={settings.taxId}
                        onChange={(e) => updateSetting("taxId", e.target.value)}
                        placeholder="ABC123456XYZ"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email de Facturación
                    </label>
                    <Input
                      value={settings.businessEmail}
                      onChange={(e) =>
                        updateSetting("businessEmail", e.target.value)
                      }
                      placeholder="facturacion@miludoteca.com"
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
                </div>
              </CardContent>
            </Card>

            {/* Información Fiscal */}
            <Card className="shadow-md border-none">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Información Fiscal
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Régimen Fiscal
                    </label>
                    <Input
                      value={settings.fiscalRegime}
                      onChange={(e) =>
                        updateSetting("fiscalRegime", e.target.value)
                      }
                      placeholder="601 - General de Ley Personas Morales"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Uso CFDI
                    </label>
                    <Input
                      value={settings.cfdiUse}
                      onChange={(e) => updateSetting("cfdiUse", e.target.value)}
                      placeholder="G03 - Gastos en general"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Condiciones de Pago
                    </label>
                    <Input
                      value={settings.paymentTerms}
                      onChange={(e) =>
                        updateSetting("paymentTerms", e.target.value)
                      }
                      placeholder="Pago a 30 días"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Información Bancaria
                    </label>
                    <textarea
                      value={settings.bankInfo}
                      onChange={(e) =>
                        updateSetting("bankInfo", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Banco: BBVA | Cuenta: 1234567890"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Elementos a Mostrar */}
            <Card className="shadow-md border-none">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Elementos de la Factura
                </h3>
                <div className="space-y-3">
                  {[
                    { key: "showLogo", label: "Mostrar Logo" },
                    { key: "showBusinessName", label: "Razón Social" },
                    { key: "showAddress", label: "Dirección" },
                    { key: "showPhone", label: "Teléfono" },
                    { key: "showWebsite", label: "Sitio Web" },
                    { key: "showEmail", label: "Email" },
                    { key: "showTaxId", label: "RFC" },
                    { key: "showFiscalRegime", label: "Régimen Fiscal" },
                    { key: "showInvoiceNumber", label: "Número de Factura" },
                    { key: "showDateTime", label: "Fecha y Hora" },
                    { key: "showPaymentTerms", label: "Condiciones de Pago" },
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
                              item.key as keyof InvoiceSettings
                            ] as boolean
                          }
                          onChange={(e) =>
                            updateSetting(
                              item.key as keyof InvoiceSettings,
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

            {/* Mensajes y Diseño */}
            <Card className="shadow-md border-none">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Mensajes y Diseño
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
                      placeholder="Mensaje opcional en el encabezado"
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
                      placeholder="Gracias por su preferencia"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Color Principal
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          updateSetting("primaryColor", e.target.value)
                        }
                        className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) =>
                          updateSetting("primaryColor", e.target.value)
                        }
                        placeholder="#2563eb"
                      />
                    </div>
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
          </div>

          {/* Vista Previa */}
          {showPreview && (
            <div className="lg:sticky lg:top-6 h-fit">
              <Card className="shadow-md border-none">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Vista Previa de la Factura
                  </h3>
                  <div className="overflow-auto max-h-[800px]">
                    {generatePreview()}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Esta es una vista previa aproximada del diseño de la
                    factura.
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
