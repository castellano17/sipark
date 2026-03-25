import React, { useState, useEffect, useRef } from "react";
import {
  Gift, Plus, Search, Printer, Tag, BarChart2, Pause, Play,
  XCircle, CheckCircle, Clock,
  AlertTriangle, Eye, RefreshCw
} from "lucide-react";
import { Button } from "./ui/button";
import { useNotification } from "@/hooks/useNotification";

type CampaignType = "hours" | "discount_pct" | "discount_fixed" | "free_package";

interface Campaign {
  id: number;
  name: string;
  description: string;
  type: CampaignType;
  benefit_value: number;
  code_count: number;
  max_uses_per_code: number;
  valid_from: string | null;
  valid_until: string | null;
  target_audience: string;
  min_purchase: number;
  status: "active" | "paused" | "finished";
  created_at: string;
  total_vouchers: number;
  total_redemptions: number;
}

const TYPE_LABELS: Record<CampaignType, string> = {
  hours: "Horas de Juego Gratis",
  discount_pct: "Descuento Porcentual (%)",
  discount_fixed: "Descuento Fijo (C$)",
  free_package: "Paquete Gratis",
};

const TYPE_COLORS: Record<CampaignType, string> = {
  hours: "bg-blue-100 text-blue-700",
  discount_pct: "bg-purple-100 text-purple-700",
  discount_fixed: "bg-green-100 text-green-700",
  free_package: "bg-orange-100 text-orange-700",
};

// Convierte cualquier valor de fecha a string (PostgreSQL puede devolver Date objects)
const fmtDate = (d: any): string => {
  if (!d) return "";
  if (d instanceof Date) return d.toLocaleDateString("es-NI");
  return String(d);
};

const getBenefitLabel = (type: CampaignType, value: any) => {
  const numValue = parseFloat(value) || 0;
  switch (type) {
    case "hours": return `${numValue} hora${numValue !== 1 ? "s" : ""} gratis`;
    case "discount_pct": return `${numValue}% de descuento`;
    case "discount_fixed": return `C$${numValue.toFixed(2)} de descuento`;
    case "free_package": return `Paquete gratis`;
    default: return `${numValue}`;
  }
};

export default function Promotions() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "create" | "redeem">("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [showVouchers, setShowVouchers] = useState<number | null>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemResult, setRedeemResult] = useState<any>(null);
  const redeemRef = useRef<HTMLInputElement>(null);

  const { notify } = useNotification();
  const showNotification = (type: "success" | "error" | "warning" | "info", message: string) => notify({ type, message });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const api = (window as any).api;

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "hours" as CampaignType,
    benefitValue: "",
    codeCount: "10",
    maxUsesPerCode: "1",
    validFrom: "",
    validUntil: "",
    targetAudience: "all",
    minPurchase: "0",
  });

  useEffect(() => {
    loadCampaigns();
  }, [filterStatus]);

  useEffect(() => {
    if (activeTab === "redeem") setTimeout(() => redeemRef.current?.focus(), 100);
  }, [activeTab]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await api.getCampaigns(filterStatus || null);
      setCampaigns(data);
    } catch (e: any) {
      showNotification("error", "Error cargando campañas: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.benefitValue || !form.codeCount) {
      showNotification("warning", "Completa todos los campos requeridos");
      return;
    }
    setLoading(true);
    try {
      const result = await api.createCampaign({
        name: form.name.trim(),
        description: form.description.trim() || null,
        type: form.type,
        benefitValue: parseFloat(form.benefitValue),
        codeCount: parseInt(form.codeCount),
        maxUsesPerCode: parseInt(form.maxUsesPerCode),
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        targetAudience: form.targetAudience,
        minPurchase: parseFloat(form.minPurchase) || 0,
        createdBy: null,
      });
      showNotification("success", `¡Campaña creada! ${result.codesGenerated} vouchers generados.`);
      setForm({ name: "", description: "", type: "hours", benefitValue: "", codeCount: "10", maxUsesPerCode: "1", validFrom: "", validUntil: "", targetAudience: "all", minPurchase: "0" });
      setActiveTab("campaigns");
      loadCampaigns();
    } catch (e: any) {
      showNotification("error", "Error creando campaña: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    try {
      await api.updateCampaignStatus(campaign.id, newStatus);
      showNotification("success", `Campaña ${newStatus === "active" ? "activada" : "pausada"}`);
      loadCampaigns();
    } catch (e: any) {
      showNotification("error", "Error: " + e.message);
    }
  };

  const handleFinishCampaign = async (campaign: Campaign) => {
    if (!confirm(`¿Finalizar la campaña "${campaign.name}"? No podrá reactivarse.`)) return;
    try {
      await api.updateCampaignStatus(campaign.id, "finished");
      showNotification("success", "Campaña finalizada");
      loadCampaigns();
    } catch (e: any) {
      showNotification("error", "Error: " + e.message);
    }
  };

  const handleLoadVouchers = async (id: number) => {
    if (showVouchers === id) { setShowVouchers(null); setSelectedCampaign(null); return; }
    setLoading(true);
    try {
      const detail = await api.getCampaignById(id);
      setSelectedCampaign(detail);
      setShowVouchers(id);
      const reds = await api.getVoucherRedemptions(id);
      setRedemptions(reds);
    } catch (e: any) {
      showNotification("error", "Error cargando vouchers: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (campaignId: number, printMode: "normal" | "pdf" | "ticket" = "normal") => {
    setLoading(true);
    try {
      const [vouchers, business] = await Promise.all([
        api.getVouchersForPrint(campaignId),
        api.getBusinessSettings().catch(() => ({ name: "SIPARK", phone: "", address: "" })),
      ]);
      if (!vouchers || vouchers.length === 0) {
        showNotification("warning", "No hay vouchers para imprimir");
        return;
      }

      // ── TICKET TÉRMICO: usa ESC/POS nativo ──────────────────────────
      if (printMode === "ticket") {
        const ticketPrinter = await api.getSetting("ticket_printer");
        if (!ticketPrinter) {
          showNotification("error", "No hay impresora de tickets configurada (ve a Configuración → Impresoras)");
          return;
        }

        const ESC = "\x1B";
        const GS  = "\x1D";
        const INIT       = `${ESC}@`;
        const CENTER     = `${ESC}a\x01`;
        const LEFT       = `${ESC}a\x00`;
        const BOLD_ON    = `${ESC}E\x01`;
        const BOLD_OFF   = `${ESC}E\x00`;
        const DOUBLE     = `${ESC}!\x30`;
        const NORMAL     = `${ESC}!\x00`;
        const CUT        = `${GS}V\x41\x05`;  // corte con avance

        // QR Code ESC/POS nativo (Model 2)
        const escQR = (data: string, size = 10) => {
          const lenWithHeader = data.length + 3;
          const lenL = lenWithHeader & 0xFF;
          const lenH = (lenWithHeader >> 8) & 0xFF;
          return (
            `${GS}(k\x04\x00\x31\x41\x32\x00` +      // Model 2
            `${GS}(k\x03\x00\x31\x43${String.fromCharCode(size)}` + // Tamaño módulo
            `${GS}(k\x03\x00\x31\x45\x30` +         // Error correction M
            `${GS}(k${String.fromCharCode(lenL, lenH)}\x31\x50\x30${data}` + // Datos
            `${GS}(k\x03\x00\x31\x51\x30`            // Imprimir
          );
        };

        // Barcode CODE128 nativo
        const escBarcode = (data: string) =>
          `${GS}h\x50` +                              // height = 80 dots
          `${GS}w\x02` +                              // width multiplier
          `${GS}H\x02` +                              // HRI abajo
          `${GS}k\x49${String.fromCharCode(data.length)}${data}`; // CODE128

        const businessLine = business.name || "SIPARK";
        let printed = 0;

        for (const v of vouchers.slice(0, 10)) {
          const benefit = getBenefitLabel(v.type as CampaignType, parseFloat(v.benefit_value));
          const till = v.valid_until ? `Valido hasta: ${formatDateES(v.valid_until)}` : "";

          let t = INIT + CENTER;
          t += BOLD_ON + DOUBLE + businessLine + "\n" + NORMAL + BOLD_OFF;
          t += v.campaign_name + "\n";
          t += "--------------------------------\n";
          t += BOLD_ON + benefit + "\n" + BOLD_OFF;
          t += "\n";
          t += escQR(v.code, 10);  // QR nativo grande
          t += "\n";
          t += escBarcode(v.code);  // Barcode nativo legible
          t += "\n";
          t += LEFT + BOLD_ON + DOUBLE + v.code + "\n" + NORMAL + BOLD_OFF;
          if (till) t += CENTER + till + "\n";
          t += CENTER + `Usos: ${v.max_uses === 1 ? "1 uso" : `${v.max_uses} usos`}` + "\n";
          t += "\n\n\n";
          t += CUT;

          try {
            await api.printTicket(ticketPrinter, t);
            printed++;
          } catch (err) {
            // continúa con el siguiente
          }
        }

        if (printed > 0) {
          showNotification("success", `${printed} voucher(s) enviados a impresora`);
        } else {
          showNotification("error", "No se pudieron imprimir los vouchers");
        }
        return;
      }

      // ── IMPRESIÓN NORMAL (ventana de navegador) ──────────────────────
      const html = buildPrintHTML(vouchers, business, printMode);
      const printWindow = window.open("", "_blank");
      if (!printWindow) { showNotification("error", "No se pudo abrir ventana de impresión"); return; }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 600);
    } catch (e: any) {
      showNotification("error", "Error preparando impresión: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Formatea fecha string 'YYYY-MM-DD' a 'DD de mes de YYYY' en español
  const formatDateES = (d: any): string => {
    if (!d) return "";
    try {
      const dt = d instanceof Date ? d : new Date(String(d) + "T12:00:00");
      return dt.toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Managua" });
    } catch { return String(d); }
  };

  const buildPrintHTML = (vouchers: any[], business: any, printMode: string) => {
    const isTicket = printMode === "ticket";
    const voucherWidth = isTicket ? "72mm" : "380px";
    const businessHeader = `
      <div class="biz-header">
        <h1 class="biz-name">${business.name || "SIPARK"}</h1>
        ${business.address ? `<p class="biz-info">${business.address}</p>` : ""}
        ${business.phone ? `<p class="biz-info">Tel: ${business.phone}</p>` : ""}
        <hr class="biz-divider"/>
      </div>
    `;
    const rows = vouchers.map(v => {
      const benefit = getBenefitLabel(v.type as CampaignType, parseFloat(v.benefit_value));
      const validUntilStr = v.valid_until ? `Válido hasta: ${formatDateES(v.valid_until)}` : "";
      // Barcode: decodificar SVG base64 e insertar INLINE (img+data:svg no renderiza en popup)
      let barcodeHtml = `<p class="no-img">Sin código de barras</p>`;
      if (v.barcode_data) {
        if (v.barcode_data.startsWith("data:image/svg+xml;base64,")) {
          try {
            const svgContent = atob(v.barcode_data.split(",")[1]);
            barcodeHtml = `<div class="barcode-svg">${svgContent}</div>`;
          } catch { barcodeHtml = `<img src="${v.barcode_data}" class="barcode" alt="Barcode" />`; }
        } else {
          barcodeHtml = `<img src="${v.barcode_data}" class="barcode" alt="Barcode" />`;
        }
      }
      const qrImg = v.qr_data ? `<img src="${v.qr_data}" class="qr" alt="QR" />` : "";

      return `
        <div class="voucher" style="max-width:${voucherWidth}">
          ${businessHeader}
          <h2 class="campaign-name">${v.campaign_name}</h2>
          <p class="benefit">${benefit}</p>
          <div class="voucher-images">
            ${qrImg}
            <div class="barcode-wrap">${barcodeHtml}</div>
          </div>
          <div class="voucher-code">${v.code}</div>
          ${v.campaign_description ? `<p class="desc">${v.campaign_description}</p>` : ""}
          ${validUntilStr ? `<p class="valid">${validUntilStr}</p>` : ""}
          <p class="uses">Usos: ${v.max_uses === 1 ? "1 uso" : `${v.max_uses} usos`}</p>
          <p class="footer">Nicaragua — Hora de Managua (GMT-6)</p>
        </div>
      `;
    }).join("");


    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Vouchers — ${business.name || "SIPARK"}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;margin:0;padding:16px;background:#fff;color:#111}
        @page{size:A4;margin:12mm}
        .biz-header{text-align:center;margin-bottom:8px}
        .biz-name{font-size:20px;font-weight:bold;margin:0 0 2px}
        .biz-info{font-size:13px;color:#444;margin:1px 0}
        .biz-divider{border:none;border-top:1px solid #999;margin:6px 0}
        .voucher{border:2px dashed #666;border-radius:12px;padding:16px;margin:12px auto;
          text-align:center;page-break-inside:avoid;max-width:160mm}
        h2.campaign-name{margin:0 0 4px;font-size:18px;color:#1a1a2e}
        .benefit{font-size:24px;font-weight:bold;color:#4f46e5;margin:4px 0}
        .voucher-images{display:flex;flex-direction:column;align-items:center;gap:10px;margin:12px 0}
        .qr{width:50mm;height:50mm;object-fit:contain}
        .barcode-wrap{width:100%;display:block;text-align:center}
        .barcode{width:130mm;height:18mm;object-fit:contain;display:block;margin:0 auto}
        .barcode-svg{width:130mm;height:18mm;overflow:hidden;margin:0 auto}
        .barcode-svg svg{width:100%;height:100%}
        .no-img{font-size:10px;color:#999}
        .voucher-code{font-family:monospace;font-size:22px;font-weight:bold;letter-spacing:4px;color:#333;margin:8px 0}
        .desc{font-size:13px;color:#666;margin:3px 0}
        .valid{font-size:14px;color:#555;margin:2px 0;font-weight:bold}
        .uses{font-size:12px;color:#888;margin:2px 0}
        .footer{font-size:10px;color:#aaa;margin:4px 0 0}
      </style></head><body>${rows}</body></html>`;
  };

  const handleRedeemCheck = async () => {
    if (!redeemCode.trim()) return;
    setLoading(true);
    setRedeemResult(null);
    try {
      const result = await api.getVoucherByCode(redeemCode.trim());
      setRedeemResult(result);
    } catch (e: any) {
      showNotification("error", "Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRedeemCheck();
  };

  const statusBadge = (status: string) => {
    const s: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      paused: "bg-amber-100 text-amber-700",
      finished: "bg-slate-100 text-slate-600",
    };
    const labels: Record<string, string> = { active: "Activa", paused: "Pausada", finished: "Finalizada" };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s[status] || "bg-slate-100 text-slate-600"}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Promociones y Vouchers</h1>
            <p className="text-sm text-slate-500">Campañas con códigos QR y código de barras</p>
          </div>
        </div>
        <Button onClick={() => setActiveTab("create")} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Nueva Campaña
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-2 md:px-6 flex gap-1 overflow-x-auto">
        {([["campaigns", "Campañas", BarChart2], ["create", "Crear Campaña", Plus], ["redeem", "Canje Manual", Tag]] as const).map(([tab, label, Icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-3 md:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6">

        {/* ── TAB: CAMPAIGNS ── */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700">
                <option value="">Todas</option>
                <option value="active">Activas</option>
                <option value="paused">Pausadas</option>
                <option value="finished">Finalizadas</option>
              </select>
              <Button variant="outline" size="sm" onClick={loadCampaigns} className="gap-1">
                <RefreshCw className="w-3 h-3" /> Actualizar
              </Button>
              <span className="text-sm text-slate-500">{campaigns.length} campaña(s)</span>
            </div>

            {loading && <div className="text-center py-8 text-slate-400">Cargando campañas...</div>}

            {!loading && campaigns.length === 0 && (
              <div className="text-center py-16">
                <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No hay campañas. ¡Crea la primera!</p>
              </div>
            )}

            {campaigns.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{c.name}</h3>
                      {statusBadge(c.status)}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type]}`}>
                        {TYPE_LABELS[c.type]}
                      </span>
                    </div>
                    {c.description && <p className="text-sm text-slate-500 mt-1 truncate">{c.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{getBenefitLabel(c.type, c.benefit_value)}</span>
                      <span>{c.total_vouchers} vouchers</span>
                      <span className={c.total_redemptions >= (c.total_vouchers * (c.max_uses_per_code || 1)) ? "text-red-600 font-bold" : ""}>
                        {c.total_redemptions >= (c.total_vouchers * (c.max_uses_per_code || 1))
                          ? "Todos Canjeados"
                          : `Canjeados: ${c.total_redemptions || 0} / ${c.total_vouchers * (c.max_uses_per_code || 1)}`}
                      </span>
                      {c.valid_until && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Hasta: {fmtDate(c.valid_until)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handlePrint(c.id, 'normal')} title="Imprimir vouchers (Normal/PDF)">
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrint(c.id, 'ticket')} title="Imprimir ticket térmico" className="text-xs px-2">
                      🖨️ Ticket
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleLoadVouchers(c.id)} title="Ver vouchers">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {c.status !== "finished" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(c)}
                          title={c.status === "active" ? "Pausar" : "Activar"}>
                          {c.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleFinishCampaign(c)}
                          title="Finalizar" className="text-red-500 hover:text-red-600">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Voucher detail panel */}
                {showVouchers === c.id && selectedCampaign && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Vouchers de la campaña</h4>
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-xs min-w-[400px]">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-200">
                            <th className="pb-2 pr-4 pl-2">Código</th>
                            <th className="pb-2 pr-4">Usos</th>
                            <th className="pb-2 pr-4">Estado</th>
                            <th className="pb-2">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedCampaign.vouchers?.slice(0, 30).map((v: any) => (
                            <tr key={v.id} className="hover:bg-white">
                              <td className="py-1.5 pr-4 pl-2 font-mono font-bold text-slate-700">{v.code}</td>
                              <td className="py-1.5 pr-4 text-slate-600">{v.times_used}/{v.max_uses}</td>
                              <td className="py-1.5 pr-4">
                                {!v.is_active ? (
                                  <span className="text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" />Inactivo</span>
                                ) : v.times_used >= v.max_uses ? (
                                  <span className="text-slate-400">Agotado</span>
                                ) : (
                                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Disponible</span>
                                )}
                              </td>
                              <td className="py-1.5">
                                {v.is_active && v.times_used < v.max_uses && (
                                  <button onClick={async () => {
                                    await api.deactivateVoucher(v.id);
                                    handleLoadVouchers(c.id);
                                  }} className="text-red-400 hover:text-red-600 text-xs">Desactivar</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {selectedCampaign.vouchers?.length > 30 && (
                        <p className="text-xs text-slate-400 mt-2">Mostrando 30 de {selectedCampaign.vouchers.length} vouchers</p>
                      )}
                    </div>
                    {redemptions.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Últimos canjes</h4>
                            <div className="space-y-1">
                              {redemptions.slice(0, 10).map((r: any) => (
                                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 bg-white rounded px-3 py-1.5 gap-0.5">
                                  <span className="font-mono font-bold">{r.code}</span>
                                  <span>{r.client_name || "Cliente no registrado"}</span>
                                  <span>{r.redeemed_by_name}</span>
                                  <span className="text-slate-400">{r.redeemed_at ? new Date(r.redeemed_at).toLocaleString("es-NI") : ""}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: CREATE ── */}
        {activeTab === "create" && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" /> Nueva Campaña
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la campaña *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej. Promoción Semana Santa 2025" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (aparece en el voucher)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2} placeholder="Ej. Válido solo fines de semana. No acumulable." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de beneficio *</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CampaignType }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {form.type === "hours" ? "Horas" : form.type === "discount_pct" ? "% Descuento" : form.type === "discount_fixed" ? "Monto C$" : "ID Paquete"} *
                    </label>
                    <input type="number" min="0.01" step="0.01" value={form.benefitValue}
                      onChange={e => setForm(f => ({ ...f, benefitValue: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ej. 2" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de vouchers *</label>
                    <input type="number" min="1" max="5000" value={form.codeCount}
                      onChange={e => setForm(f => ({ ...f, codeCount: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Usos por voucher</label>
                    <input type="number" min="1" value={form.maxUsesPerCode}
                      onChange={e => setForm(f => ({ ...f, maxUsesPerCode: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Válido desde</label>
                    <input type="date" value={form.validFrom}
                      onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Válido hasta</label>
                    <input type="date" value={form.validUntil}
                      onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Audiencia</label>
                    <select value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="all">Todos</option>
                      <option value="member">Solo miembros</option>
                      <option value="new_client">Clientes nuevos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Compra mínima (C$)</label>
                    <input type="number" min="0" step="0.01" value={form.minPurchase}
                      onChange={e => setForm(f => ({ ...f, minPurchase: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                    {loading ? "Generando vouchers..." : "Crear Campaña y Generar Vouchers"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setActiveTab("campaigns")}>Cancelar</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB: REDEEM MANUAL ── */}
        {activeTab === "redeem" && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" /> Verificar Voucher
              </h2>
              <p className="text-sm text-slate-500 mb-5">Escanea el código de barras o escribe el código del voucher</p>
              <div className="flex gap-2">
                <input
                  ref={redeemRef}
                  value={redeemCode}
                  onChange={e => { setRedeemCode(e.target.value); setRedeemResult(null); }}
                  onKeyDown={handleRedeemKeyDown}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Escanear o escribir código..." autoFocus />
                <Button onClick={handleRedeemCheck} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {redeemResult && (
                <div className={`mt-4 p-4 rounded-lg ${redeemResult.valid ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                  {redeemResult.valid ? (
                    <>
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                        <CheckCircle className="w-5 h-5" /> Voucher válido
                      </div>
                      <div className="space-y-1 text-sm text-slate-700">
                        <p><span className="text-slate-500">Campaña:</span> {redeemResult.voucher.campaign_name}</p>
                        <p><span className="text-slate-500">Beneficio:</span> <strong>{getBenefitLabel(redeemResult.voucher.type, parseFloat(redeemResult.voucher.benefit_value))}</strong></p>
                        <p><span className="text-slate-500">Usos restantes:</span> {redeemResult.voucher.max_uses - redeemResult.voucher.times_used}</p>
                        {redeemResult.voucher.valid_until && <p><span className="text-slate-500">Vence:</span> {fmtDate(redeemResult.voucher.valid_until)}</p>}
                      </div>
                      <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />Para canjear, escanea el código de barras directamente en el POS
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">{redeemResult.reason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
