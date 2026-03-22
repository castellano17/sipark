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

const getBenefitLabel = (type: CampaignType, value: number) => {
  switch (type) {
    case "hours": return `${value} hora${value !== 1 ? "s" : ""} gratis`;
    case "discount_pct": return `${value}% de descuento`;
    case "discount_fixed": return `C$${value.toFixed(2)} de descuento`;
    case "free_package": return `Paquete gratis`;
    default: return `${value}`;
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

  const handlePrint = async (campaignId: number) => {
    setLoading(true);
    try {
      const vouchers = await api.getVouchersForPrint(campaignId);
      if (!vouchers || vouchers.length === 0) {
        showNotification("warning", "No hay vouchers para imprimir");
        return;
      }
      // Abrir ventana de impresión con los vouchers
      const printWindow = window.open("", "_blank");
      if (!printWindow) { showNotification("error", "No se pudo abrir ventana de impresión"); return; }
      const html = buildPrintHTML(vouchers);
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    } catch (e: any) {
      showNotification("error", "Error preparando impresión: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const buildPrintHTML = (vouchers: any[]) => {
    const rows = vouchers.map(v => `
      <div class="voucher">
        <div class="voucher-header">
          <h2>${v.campaign_name}</h2>
          <p class="benefit">${getBenefitLabel(v.type as CampaignType, parseFloat(v.benefit_value))}</p>
        </div>
        <div class="voucher-images">
          ${v.qr_data ? `<img src="${v.qr_data}" class="qr" alt="QR"/>` : ""}
          ${v.barcode_data ? `<img src="${v.barcode_data}" class="barcode" alt="Barcode"/>` : ""}
        </div>
        <div class="voucher-code">${v.code}</div>
        ${v.campaign_description ? `<p class="desc">${v.campaign_description}</p>` : ""}
        ${v.valid_until ? `<p class="valid">Válido hasta: ${v.valid_until}</p>` : ""}
        <p class="uses">Usos: ${v.max_uses === 1 ? "1 uso" : `${v.max_uses} usos`}</p>
      </div>
    `).join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vouchers</title>
      <style>
        body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#fff}
        .voucher{border:2px dashed #666;border-radius:12px;padding:16px;margin:12px auto;max-width:380px;text-align:center;page-break-inside:avoid}
        .voucher-header h2{margin:0 0 4px;font-size:16px;color:#1a1a2e}
        .benefit{font-size:20px;font-weight:bold;color:#4f46e5;margin:4px 0}
        .voucher-images{display:flex;justify-content:center;align-items:center;gap:12px;margin:12px 0}
        .qr{width:120px;height:120px}
        .barcode{width:200px;height:60px}
        .voucher-code{font-family:monospace;font-size:18px;font-weight:bold;letter-spacing:3px;color:#333;margin:6px 0}
        .desc{font-size:12px;color:#666;margin:4px 0}
        .valid,.uses{font-size:11px;color:#888;margin:2px 0}
        @media print{body{padding:5px}@page{margin:10mm}}
      </style>
    </head><body>${rows}</body></html>`;
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
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Gift className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Promociones y Vouchers</h1>
            <p className="text-sm text-slate-500">Campañas con códigos QR y código de barras</p>
          </div>
        </div>
        <Button onClick={() => setActiveTab("create")} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Nueva Campaña
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-1">
        {([["campaigns", "Campañas", BarChart2], ["create", "Crear Campaña", Plus], ["redeem", "Canje Manual", Tag]] as const).map(([tab, label, Icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* ── TAB: CAMPAIGNS ── */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
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
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{c.name}</h3>
                      {statusBadge(c.status)}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type]}`}>
                        {TYPE_LABELS[c.type]}
                      </span>
                    </div>
                    {c.description && <p className="text-sm text-slate-500 mt-1 truncate">{c.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{getBenefitLabel(c.type, c.benefit_value)}</span>
                      <span>{c.total_vouchers} vouchers</span>
                      <span>{c.total_redemptions || 0} canjeados</span>
                      {c.valid_until && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Hasta: {c.valid_until}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handlePrint(c.id)} title="Imprimir vouchers">
                      <Printer className="w-4 h-4" />
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-200">
                            <th className="pb-2 pr-4">Código</th>
                            <th className="pb-2 pr-4">Usos</th>
                            <th className="pb-2 pr-4">Estado</th>
                            <th className="pb-2">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedCampaign.vouchers?.slice(0, 30).map((v: any) => (
                            <tr key={v.id} className="hover:bg-white">
                              <td className="py-1.5 pr-4 font-mono font-bold text-slate-700">{v.code}</td>
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
                            <div key={r.id} className="flex items-center justify-between text-xs text-slate-600 bg-white rounded px-3 py-1.5">
                              <span className="font-mono font-bold">{r.code}</span>
                              <span>{r.client_name || "Cliente no registrado"}</span>
                              <span>{r.redeemed_by_name}</span>
                              <span>{new Date(r.redeemed_at).toLocaleString("es-NI")}</span>
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                        {redeemResult.voucher.valid_until && <p><span className="text-slate-500">Vence:</span> {redeemResult.voucher.valid_until}</p>}
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
