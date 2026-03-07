import { useState, useEffect } from "react";
import { Search, Printer, Calendar, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { useNotification } from "../hooks/useNotification";
import { useCurrency } from "../hooks/useCurrency";
import { SaleDetailModal } from "./SaleDetailModal";
import type { Sale } from "../types";

export function SalesHistory() {
  const { info, error } = useNotification();
  const { formatCurrency } = useCurrency();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState(() => {
    // Fecha de hoy en formato YYYY-MM-DD (hora local)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    let filtered = sales;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.client_name?.toLowerCase().includes(query) ||
          s.id.toString().includes(query),
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((s) => {
        const timestamp =
          typeof s.timestamp === "string"
            ? s.timestamp
            : new Date(s.timestamp).toISOString().split("T")[0];
        return timestamp.startsWith(dateFilter);
      });
    }

    setFilteredSales(filtered);
  }, [searchQuery, dateFilter, sales]);

  const loadSales = async () => {
    try {
      const data = await window.api.getSales(100);
      console.log("📊 Ventas cargadas:", data.length);
      console.log("📊 Primeras 5 ventas:", data.slice(0, 5));
      console.log(
        "📊 Ejemplo venta completa:",
        JSON.stringify(data[0], null, 2),
      );
      setSales(data);
      setFilteredSales(data);
    } catch (err) {
      error("Error cargando ventas");
      console.error("Error loading sales:", err);
    }
  };

  const handleReprint = (saleId: number) => {
    console.log("Reimprimir ticket:", saleId);
    info(`Reimprimiendo ticket #${saleId}`);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <>
      <div className="h-full flex flex-col p-4 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Historial de Ventas</h1>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Mostrado</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente o ID de venta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-64 relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setDateFilter("");
            }}
          >
            Limpiar
          </Button>
        </div>

        {/* Tabla de Ventas */}
        <Card className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Fecha y Hora
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Método
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Total
                </th>
                <th className="w-40 px-4 py-3 text-center text-sm font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No se encontraron ventas
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">#{sale.id}</td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(sale.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {sale.client_name || (
                        <span className="text-gray-400">Venta Rápida</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {sale.payment_method || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSaleId(sale.id)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReprint(sale.id)}
                          className="gap-2"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Modal de detalle */}
      <SaleDetailModal
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
      />
    </>
  );
}
