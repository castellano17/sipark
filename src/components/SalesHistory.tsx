import { useState, useEffect } from "react";
import { Search, Printer, Calendar, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { useNotification } from "../hooks/useNotification";
import { useCurrency } from "../hooks/useCurrency";
import { SaleDetailModal } from "./SaleDetailModal";
import { usePrinter } from "../hooks/usePrinter";
import type { Sale } from "../types";

// Helper: badge de tipo de venta
function SaleTypeBadge({ type }: { type: string }) {
  if (type === 'membership') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
        🪪 Membresía
      </span>
    );
  }
  if (type === 'package') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        📦 Paquete
      </span>
    );
  }
  if (type === 'promo') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
        🎟️ Promo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
      🛒 Producto
    </span>
  );
}

export function SalesHistory() {
  const { info, error } = useNotification();
  const { formatCurrency } = useCurrency();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [typeFilter, setTypeFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    let filtered = sales;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.client_name?.toLowerCase().includes(query)) ||
          s.id.toString().includes(query),
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((s) => {
        const saleDate = new Date(s.timestamp);
        const year = saleDate.getFullYear();
        const month = String(saleDate.getMonth() + 1).padStart(2, "0");
        const day = String(saleDate.getDate()).padStart(2, "0");
        const localDate = `${year}-${month}-${day}`;
        return localDate === dateFilter;
      });
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter((s) => (s as any).sale_type === typeFilter);
    }

    setFilteredSales(filtered);
    setCurrentPage(1);
  }, [searchQuery, dateFilter, typeFilter, sales]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  const { printTicket } = usePrinter();

  const [loading, setLoading] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await window.api.getSales(500);
      setSales(data);
      setFilteredSales(data);
    } catch (err) {
      error("Error cargando ventas");
    } finally {
      setLoading(false);
    }
  };

  const handleReprint = async (saleId: number) => {
    try {
      info(`Reimprimiendo ticket #${saleId}...`);
      const saleFull = await window.api.getSaleWithItems(saleId);
      if (!saleFull) {
        error("No se encontraron los detalles de la venta");
        return;
      }
      
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

      await printTicket({
        saleId: saleFull.id,
        clientName: saleFull.client_name,
        cashierName: currentUser.name || currentUser.username || "Admin",
        items: saleFull.items.map((i: any) => ({
          product_name: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
        })),
        subtotal: saleFull.subtotal,
        discount: saleFull.discount || 0,
        total: saleFull.total,
        paymentMethod: saleFull.payment_method,
      });
    } catch (err) {
      error("Error al reimprimir el ticket");
    }
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

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

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
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 relative min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-48 relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Filtro Tipo con Botones */}
          <div className="flex bg-gray-100 p-1 rounded-lg gap-1 border">
            {[
              { id: 'all', label: 'Todos', icon: '📋' },
              { id: 'product', label: 'Productos', icon: '🛒' },
              { id: 'package', label: 'Paquetes', icon: '📦' },
              { id: 'membership', label: 'Membresías', icon: '🪪' },
              { id: 'promo', label: 'Promos', icon: '🎟️' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setTypeFilter(type.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                  ${typeFilter === type.id 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
                `}
              >
                <span>{type.icon}</span>
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setDateFilter("");
              setTypeFilter("all");
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
                  Productos
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Tipo
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
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No se encontraron ventas
                  </td>
                </tr>
              ) : (
                currentItems.map((sale) => (
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
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={(sale as any).products || ''}>
                      {(sale as any).products || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <SaleTypeBadge type={(sale as any).sale_type || 'product'} />
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

          {/* Pagination */}
          {filteredSales.length > 0 && (
            <div className="px-6 py-4 bg-white border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Mostrando <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> a{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(indexOfLastItem, filteredSales.length)}
                </span>{" "}
                de <span className="font-semibold text-gray-900">{filteredSales.length}</span> ventas
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center mr-4">
                  <span className="text-xs text-gray-500 mr-2">Filas por página:</span>
                  <select 
                    className="text-xs border rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[60px]"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    {[10, 15, 25, 50, 100].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 p-0" title="Primera página">
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0" title="Anterior">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'}`}>
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0" title="Siguiente">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 p-0" title="Última página">
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
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
