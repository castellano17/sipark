import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Edit,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  ClipboardList,
  FileText,
  Printer,
  FileDown,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useReportExport } from "../hooks/useReportExport";
import { Dialog } from "./ui/dialog";
import { useNotification } from "../hooks/useNotification";
import { usePermissions } from "../hooks/usePermissions";
import { useCurrency } from "../hooks/useCurrency";

interface Product {
  id: number;
  name: string;
  price: number;
  type: string;
  category: string;
  barcode: string;
  stock: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface StockAdjustment {
  id: number;
  product_id: number;
  product_name: string;
  adjustment_type: string;
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  reason: string;
  notes: string;
  user: string;
  timestamp: string;
}

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [lowStockCount, setLowStockCount] = useState(0);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [newCategoryValue, setNewCategoryValue] = useState("");
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: "in",
    quantity: "",
    reason: "",
    notes: "",
  });
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [adjustmentSearch, setAdjustmentSearch] = useState("");
  const [adjustmentTypeFilter, setAdjustmentTypeFilter] =
    useState<string>("all");
  const [showAuditModal, setShowAuditModal] = useState(false);
  const { success, error } = useNotification();
  const { canEdit } = usePermissions();
  const { formatCurrency } = useCurrency();
  const { exportToExcel: exportExcel, exportToPDF, printReport } = useReportExport();

  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);



  const adjustmentTypes = [
    {
      value: "in",
      label: "Entrada - Ajuste de Inventario",
      color: "text-green-600",
    },
    {
      value: "out",
      label: "Salida - Ajuste de Inventario",
      color: "text-orange-600",
    },
    { value: "loss", label: "Merma/Pérdida", color: "text-red-600" },
    { value: "return", label: "Devolución de Cliente", color: "text-blue-600" },
    {
      value: "return_supplier",
      label: "Devolución a Proveedor",
      color: "text-purple-600",
    },
  ];

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadLowStock();
    loadAdjustments();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const loadProducts = async () => {
    try {
      const data = await window.api.getInventoryProducts();
      setProducts(data);
    } catch (err) {
      error("Error cargando inventario");
    }
  };

  const loadCategories = async () => {
    try {
      const data = await window.api.getCategories();
      setDbCategories(data);
    } catch (err) {
    }
  };

  const loadLowStock = async () => {
    try {
      const data = await window.api.getLowStockProducts(10);
      setLowStockCount(data.length);
    } catch (err) {
    }
  };

  const loadAdjustments = async () => {
    try {
      const data = await window.api.getStockAdjustments();
      setAdjustments(data || []);
    } catch (err) {
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => (p.category === selectedCategory || p.type === selectedCategory));
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.barcode?.includes(searchTerm),
      );
    }

    setFilteredProducts(filtered);
  };

  const handleUpdateCategory = async (productId: number) => {
    try {
      if (!newCategoryValue) {
        error("Seleccione una categoría");
        return;
      }

      await window.api.updateProductCategory(productId, newCategoryValue);
      success("Categoría actualizada");
      setEditingCategory(null);
      setNewCategoryValue("");
      loadProducts();
    } catch (err) {
      error("Error actualizando categoría");
    }
  };

  const openAdjustmentModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentData({
      type: "in",
      quantity: "",
      reason: "",
      notes: "",
    });
    setShowAdjustmentModal(true);
  };

  const closeAdjustmentModal = () => {
    setShowAdjustmentModal(false);
    setSelectedProduct(null);
    setAdjustmentData({
      type: "in",
      quantity: "",
      reason: "",
      notes: "",
    });
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct) return;

    const quantity = parseInt(adjustmentData.quantity);
    if (isNaN(quantity) || quantity === 0) {
      error("Ingrese una cantidad válida");
      return;
    }

    if (!adjustmentData.reason.trim()) {
      error("La razón es obligatoria");
      return;
    }

    try {
      const adjustment = adjustmentData.type === "in" ? quantity : -quantity;

      await window.api.adjustProductStock(
        selectedProduct.id,
        adjustment,
        adjustmentData.reason,
        adjustmentData.notes,
        "Admin",
      );

      success(`Stock ajustado correctamente`);
      closeAdjustmentModal();
      loadProducts();
      loadLowStock();
      loadAdjustments();
    } catch (err: any) {
      error(err.message || "Error ajustando stock");
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { color: "text-red-600", bg: "bg-red-50", label: "Agotado" };
    if (stock <= 5)
      return { color: "text-orange-600", bg: "bg-orange-50", label: "Crítico" };
    if (stock <= 10)
      return { color: "text-yellow-600", bg: "bg-yellow-50", label: "Bajo" };
    return { color: "text-green-600", bg: "bg-green-50", label: "Normal" };
  };

  const getAdjustmentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      in: "Entrada",
      out: "Salida",
      loss: "Merma/Pérdida",
      return: "Devolución Cliente",
      return_supplier: "Devolución Proveedor",
    };
    return types[type] || type;
  };

  const getAdjustmentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      in: "text-green-600 bg-green-50",
      out: "text-orange-600 bg-orange-50",
      loss: "text-red-600 bg-red-50",
      return: "text-blue-600 bg-blue-50",
      return_supplier: "text-purple-600 bg-purple-50",
    };
    return colors[type] || "text-gray-600 bg-gray-50";
  };

  const filteredAdjustments = adjustments.filter((adj) => {
    const matchesSearch =
      adj.product_name.toLowerCase().includes(adjustmentSearch.toLowerCase()) ||
      adj.reason.toLowerCase().includes(adjustmentSearch.toLowerCase()) ||
      adj.user.toLowerCase().includes(adjustmentSearch.toLowerCase());

    const matchesType =
      adjustmentTypeFilter === "all" ||
      adj.adjustment_type === adjustmentTypeFilter;

    return matchesSearch && matchesType;
  });



  const getSummary = () => {
    return [
      { label: "Total Productos", value: products.length },
      { label: "Total Items en Stock", value: totalItems },
      { label: "Valor Total Inventario", value: formatCurrency(totalValue) },
      { label: "Productos con Bajo Stock", value: lowStockCount },
    ];
  };

  const reportConfig = {
    title: "Inventario General de Productos",
    subtitle: `Búsqueda: ${searchTerm || "Todas"} | Categoría: ${selectedCategory}`,
    filename: `inventario-general-${new Date().toISOString().split("T")[0]}`,
    columns: [
      { header: "Producto", key: "name", width: 40 },
      { header: "Categoría", key: "category", width: 25 },
      { header: "Código de Barras", key: "barcode", width: 22 },
      { header: "Precio", key: "price", width: 15, format: "currency" as const },
      { header: "Stock", key: "stock", width: 10, format: "number" as const },
      { header: "Subtotal", key: "subtotal", width: 18, format: "currency" as const },
    ],
    data: filteredProducts.map((p) => ({
      ...p,
      category: p.category || p.type || "-",
      subtotal: p.price * p.stock,
    })),
    summary: getSummary(),
  };

  const adjustmentReportConfig = {
    title: "Historial de Ajustes de Inventario",
    subtitle: `Búsqueda: ${adjustmentSearch || "Todas"} | Tipo: ${adjustmentTypeFilter}`,
    filename: `ajustes-inventario-${new Date().toISOString().split("T")[0]}`,
    columns: [
      { header: "Fecha/Hora", key: "timestamp", width: 25, format: "datetime" as const },
      { header: "Producto", key: "product_name", width: 30 },
      { header: "Tipo", key: "type_label", width: 20 },
      { header: "Cantidad", key: "quantity_change", width: 10, format: "number" as const },
      { header: "Stock Ant.", key: "stock_before", width: 10, format: "number" as const },
      { header: "Stock Nuevo", key: "stock_after", width: 10, format: "number" as const },
      { header: "Razón", key: "reason", width: 35 },
      { header: "Usuario", key: "user", width: 15 },
    ],
    data: filteredAdjustments.map((adj) => ({
      ...adj,
      type_label: getAdjustmentTypeLabel(adj.adjustment_type),
    })),
  };


  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
            <p className="text-sm text-gray-500">
              Gestión de productos físicos (bebidas, snacks, alquileres)
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-white border rounded-lg p-1 mr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportExcel(reportConfig)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Exportar a Excel"
              >
                <FileDown className="w-4 h-4 mr-1" />
                Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToPDF(reportConfig)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Exportar a PDF"
              >
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => printReport(reportConfig)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Imprimir"
              >
                <Printer className="w-4 h-4 mr-1" />
                Imprimir
              </Button>
            </div>
            <Button
              onClick={() => setShowAuditModal(true)}
              variant="outline"
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Historial de Ajustes
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Productos</p>
                <p className="text-xl font-bold">{products.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-xl font-bold">{totalItems}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="text-xl font-bold">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock Bajo</p>
                <p className="text-xl font-bold text-orange-600">
                  {lowStockCount}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap pb-2 overflow-x-auto max-w-full">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="gap-2"
            >
              <Package className="w-4 h-4" />
              Todos
            </Button>
            {dbCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="w-40 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.stock);
                  const isEditingCategoryRow = editingCategory === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditingCategoryRow ? (
                          <div className="flex items-center gap-2">
                            <select
                              className="px-2 py-1 border rounded text-sm"
                              value={newCategoryValue}
                              onChange={(e) =>
                                setNewCategoryValue(e.target.value)
                              }
                              autoFocus
                            >
                              <option value="">Seleccionar...</option>
                              {dbCategories.map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateCategory(product.id)}
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCategory(null);
                                setNewCategoryValue("");
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <span className="text-sm text-gray-600 capitalize">
                              {product.category || product.type || "-"}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCategory(product.id);
                                setNewCategoryValue(
                                  product.category || product.type || "",
                                );
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 font-mono">
                          {product.barcode || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium">
                          {formatCurrency(product.price)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold">
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAdjustmentModal(product)}
                            className="gap-2"
                            disabled={!canEdit("inventory")}
                          >
                            <ClipboardList className="w-4 h-4" />
                            Ajustar Stock
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron productos</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Ajuste de Stock */}
      {showAdjustmentModal && selectedProduct && (
        <Dialog open={showAdjustmentModal} onOpenChange={closeAdjustmentModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl bg-white max-h-[95vh] overflow-y-auto flex flex-col border-0">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-600 to-orange-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Ajuste de Stock
                    </h2>
                    <p className="text-sm text-orange-100">
                      {selectedProduct.name} - Stock actual:{" "}
                      {selectedProduct.stock}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo de Ajuste *
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={adjustmentData.type}
                    onChange={(e) =>
                      setAdjustmentData({
                        ...adjustmentData,
                        type: e.target.value,
                      })
                    }
                  >
                    {adjustmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {adjustmentData.type === "in" &&
                      "Aumenta el stock (ej: conteo físico encontró más unidades)"}
                    {adjustmentData.type === "out" &&
                      "Reduce el stock (ej: conteo físico encontró menos unidades)"}
                    {adjustmentData.type === "loss" &&
                      "Reduce el stock por merma, daño, vencimiento o robo"}
                    {adjustmentData.type === "return" &&
                      "Aumenta el stock por devolución de cliente"}
                    {adjustmentData.type === "return_supplier" &&
                      "Reduce el stock por devolución a proveedor"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cantidad *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={adjustmentData.quantity}
                    onChange={(e) =>
                      setAdjustmentData({
                        ...adjustmentData,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="Ingrese la cantidad"
                  />
                  {adjustmentData.quantity && (
                    <Card className="mt-2 p-3 bg-orange-50 border-orange-200">
                      <p className="text-sm font-medium text-orange-900">
                        Nuevo stock:{" "}
                        <span className="text-lg font-bold">
                          {selectedProduct.stock +
                            (adjustmentData.type === "in"
                              ? parseInt(adjustmentData.quantity)
                              : -parseInt(adjustmentData.quantity))}
                        </span>
                      </p>
                    </Card>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Razón * (Obligatoria para auditoría)
                  </label>
                  <Input
                    value={adjustmentData.reason}
                    onChange={(e) =>
                      setAdjustmentData({
                        ...adjustmentData,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Ej: Conteo físico mensual, Producto dañado, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notas Adicionales (Opcional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    value={adjustmentData.notes}
                    onChange={(e) =>
                      setAdjustmentData({
                        ...adjustmentData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Información adicional sobre el ajuste..."
                  />
                </div>

                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg h-fit">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Importante:</p>
                      <p>
                        Este ajuste quedará registrado en el historial de
                        auditoría con fecha, hora, usuario y razón. Asegúrate de
                        que la información sea correcta.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <Button variant="outline" onClick={closeAdjustmentModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleStockAdjustment}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Confirmar Ajuste
                </Button>
              </div>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Modal de Auditoría de Ajustes */}
      {showAuditModal && (
        <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col bg-white border-0">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-slate-700 to-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Historial de Ajustes de Inventario
                    </h2>
                    <p className="text-sm text-slate-200">
                      Auditoría completa de movimientos de stock
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex bg-white/10 border border-white/20 rounded-lg p-1 mr-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportExcel(adjustmentReportConfig)}
                      className="text-white hover:bg-white/20"
                      title="Exportar a Excel"
                    >
                      <FileDown className="w-4 h-4 mr-1" />
                      Excel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportToPDF(adjustmentReportConfig)}
                      className="text-white hover:bg-white/20"
                      title="Exportar a PDF"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => printReport(adjustmentReportConfig)}
                      className="text-white hover:bg-white/20"
                      title="Imprimir"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="p-6 border-b bg-gray-50 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por producto, razón o usuario..."
                      value={adjustmentSearch}
                      onChange={(e) => setAdjustmentSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    className="px-4 py-2 border rounded-md"
                    value={adjustmentTypeFilter}
                    onChange={(e) => setAdjustmentTypeFilter(e.target.value)}
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="in">Entrada</option>
                    <option value="out">Salida</option>
                    <option value="loss">Merma/Pérdida</option>
                    <option value="return">Devolución Cliente</option>
                    <option value="return_supplier">
                      Devolución Proveedor
                    </option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  Mostrando {filteredAdjustments.length} de {adjustments.length}{" "}
                  ajustes
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                <Card>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          Fecha/Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold">
                          Stock Anterior
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold">
                          Stock Nuevo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          Razón
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          Usuario
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredAdjustments.map((adj) => (
                        <tr key={adj.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {new Date(adj.timestamp).toLocaleString("es-ES")}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {adj.product_name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getAdjustmentTypeColor(adj.adjustment_type)}`}
                            >
                              {getAdjustmentTypeLabel(adj.adjustment_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold">
                            {adj.quantity_change > 0 ? "+" : ""}
                            {adj.quantity_change}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {adj.stock_before}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold">
                            {adj.stock_after}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>{adj.reason}</div>
                            {adj.notes && (
                              <div className="text-xs text-gray-500 mt-1">
                                {adj.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">{adj.user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredAdjustments.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No hay ajustes registrados
                      </p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAuditModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </Card>
          </div>
        </Dialog>
      )}
    </div>
  );
}
