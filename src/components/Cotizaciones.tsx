import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useSnackbar } from "notistack";

interface Quotation {
  id: number;
  quotation_number: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_address: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  valid_until: string;
  status: string;
  notes: string;
  created_at: string;
}

interface QuotationItem {
  id?: number;
  product_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  type: string;
}

export const Cotizaciones: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    client_address: "",
    discount: 0,
    tax: 0,
    valid_until: "",
    notes: "",
  });

  const [items, setItems] = useState<QuotationItem[]>([
    { description: "", quantity: 1, unit_price: 0, subtotal: 0 },
  ]);
  const [productSearch, setProductSearch] = useState<string[]>([""]);
  const [filteredProducts, setFilteredProducts] = useState<Product[][]>([[]]);
  const [showProductDropdown, setShowProductDropdown] = useState<boolean[]>([
    false,
  ]);

  useEffect(() => {
    loadQuotations();
    loadProducts();
  }, []);

  const loadQuotations = async () => {
    try {
      const result = await window.api.getAllQuotations();
      if (result.success) {
        setQuotations(result.data || []);
      }
    } catch (error) {
      console.error("Error cargando cotizaciones:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await window.api.getProductsServices();
      if (Array.isArray(result)) {
        setProducts(result);
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { description: "", quantity: 1, unit_price: 0, subtotal: 0 },
    ]);
    setProductSearch([...productSearch, ""]);
    setFilteredProducts([...filteredProducts, []]);
    setShowProductDropdown([...showProductDropdown, false]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setProductSearch(productSearch.filter((_, i) => i !== index));
      setFilteredProducts(filteredProducts.filter((_, i) => i !== index));
      setShowProductDropdown(showProductDropdown.filter((_, i) => i !== index));
    }
  };

  const handleProductSearchChange = (index: number, value: string) => {
    const newSearch = [...productSearch];
    newSearch[index] = value;
    setProductSearch(newSearch);

    if (value.length >= 1) {
      const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(value.toLowerCase()),
      );
      const newFiltered = [...filteredProducts];
      newFiltered[index] = filtered;
      setFilteredProducts(newFiltered);

      const newShow = [...showProductDropdown];
      newShow[index] = true;
      setShowProductDropdown(newShow);
    } else {
      const newShow = [...showProductDropdown];
      newShow[index] = false;
      setShowProductDropdown(newShow);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof QuotationItem,
    value: any,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Calcular subtotal
    if (field === "quantity" || field === "unit_price") {
      newItems[index].subtotal =
        newItems[index].quantity * newItems[index].unit_price;
    }

    setItems(newItems);
  };

  const handleProductSelect = (index: number, product: Product) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product_id: product.id,
      description: product.name,
      unit_price: product.price,
      subtotal: newItems[index].quantity * product.price,
    };
    setItems(newItems);

    const newSearch = [...productSearch];
    newSearch[index] = product.name;
    setProductSearch(newSearch);

    const newShow = [...showProductDropdown];
    newShow[index] = false;
    setShowProductDropdown(newShow);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = formData.discount || 0;
    const taxAmount = formData.tax || 0;
    const total = subtotal - discountAmount + taxAmount;
    return { subtotal, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_name) {
      enqueueSnackbar("El nombre del cliente es requerido", {
        variant: "warning",
      });
      return;
    }

    if (items.some((item) => !item.description || item.quantity <= 0)) {
      enqueueSnackbar("Completa todos los items correctamente", {
        variant: "warning",
      });
      return;
    }

    const result = await window.api.createQuotation({
      ...formData,
      items,
    });

    if (result.success) {
      enqueueSnackbar("Cotización creada exitosamente", {
        variant: "success",
      });
      setShowModal(false);
      resetForm();
      loadQuotations();
    } else {
      enqueueSnackbar("Error al crear cotización", { variant: "error" });
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_phone: "",
      client_email: "",
      client_address: "",
      discount: 0,
      tax: 0,
      valid_until: "",
      notes: "",
    });
    setItems([{ description: "", quantity: 1, unit_price: 0, subtotal: 0 }]);
    setProductSearch([""]);
    setFilteredProducts([[]]);
    setShowProductDropdown([false]);
  };

  const handleViewQuotation = async (id: number) => {
    const result = await window.api.getQuotationById(id);
    if (result.success) {
      setSelectedQuotation(result.data);
    }
  };

  const handleDeleteQuotation = async (id: number) => {
    const result = await window.api.deleteQuotation(id);
    if (result.success) {
      enqueueSnackbar("Cotización eliminada", { variant: "success" });
      loadQuotations();
    }
  };

  const handlePrintQuotation = async (quotation: Quotation) => {
    try {
      enqueueSnackbar("Generando PDF...", { variant: "info" });
      const result = await window.api.getQuotationById(quotation.id);
      if (result.success) {
        await window.api.generateQuotationPDF(result.data);
        enqueueSnackbar("PDF generado exitosamente", { variant: "success" });
      }
    } catch (error) {
      console.error("Error generando PDF:", error);
      enqueueSnackbar("Error al generar PDF", { variant: "error" });
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const result = await window.api.updateQuotationStatus(id, status);
    if (result.success) {
      enqueueSnackbar("Estado actualizado", { variant: "success" });
      loadQuotations();
      if (selectedQuotation && selectedQuotation.id === id) {
        setSelectedQuotation({ ...selectedQuotation, status });
      }
    }
  };

  const filteredQuotations = quotations.filter(
    (q) =>
      q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "approved":
        return "Aprobada";
      case "rejected":
        return "Rechazada";
      default:
        return status;
    }
  };

  const { subtotal, total } = calculateTotals();

  return (
    <div className="flex flex-col h-full gap-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cotizaciones</h1>
          <p className="text-slate-600 mt-1">
            Gestión de cotizaciones y presupuestos
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cliente o número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Número</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-center p-3">Estado</th>
                  <th className="text-center p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((quotation) => (
                  <tr key={quotation.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">
                      {quotation.quotation_number}
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">
                          {quotation.client_name}
                        </div>
                        {quotation.client_phone && (
                          <div className="text-sm text-gray-500">
                            {quotation.client_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {new Date(quotation.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right font-medium">
                      ${quotation.total.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(quotation.status)}`}
                      >
                        {getStatusText(quotation.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewQuotation(quotation.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintQuotation(quotation)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDeleteQuotation(quotation.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Nueva Cotización */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-purple-600 text-white">
              <CardTitle>Nueva Cotización</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Datos del Cliente */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Datos del Cliente
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.client_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            client_name: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.client_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            client_phone: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.client_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            client_email: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={formData.client_address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            client_address: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Items</h3>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddItem}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded"
                      >
                        <div className="col-span-5">
                          <label className="block text-xs font-medium mb-1">
                            Descripción *
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Descripción del item..."
                          />
                          <div className="relative mt-1">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <input
                              type="text"
                              value={productSearch[index] || ""}
                              onChange={(e) =>
                                handleProductSearchChange(index, e.target.value)
                              }
                              onFocus={() => {
                                if (productSearch[index]) {
                                  const newShow = [...showProductDropdown];
                                  newShow[index] = true;
                                  setShowProductDropdown(newShow);
                                }
                              }}
                              placeholder="Buscar producto..."
                              className="w-full pl-7 pr-2 py-1 border rounded text-xs"
                            />
                            {showProductDropdown[index] &&
                              filteredProducts[index]?.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  {filteredProducts[index].map((product) => (
                                    <div
                                      key={product.id}
                                      onClick={() =>
                                        handleProductSelect(index, product)
                                      }
                                      className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                    >
                                      <div className="text-xs font-medium">
                                        {product.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        ${product.price.toFixed(2)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium mb-1">
                            Cantidad *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium mb-1">
                            Precio Unit.
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "unit_price",
                                Number(e.target.value),
                              )
                            }
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium mb-1">
                            Subtotal
                          </label>
                          <input
                            type="text"
                            value={`$${item.subtotal.toFixed(2)}`}
                            disabled
                            className="w-full p-2 border rounded text-sm bg-gray-100"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-red-600 w-full"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totales y Opciones */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Válida Hasta
                      </label>
                      <input
                        type="date"
                        value={formData.valid_until}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            valid_until: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Notas
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="w-full p-2 border rounded"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Descuento:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount: Number(e.target.value),
                          })
                        }
                        className="w-24 p-1 border rounded text-right"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Impuesto:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.tax}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tax: Number(e.target.value),
                          })
                        }
                        className="w-24 p-1 border rounded text-right"
                      />
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-purple-600">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Crear Cotización
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Detalle */}
      {selectedQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Cotización {selectedQuotation.quotation_number}
                  </CardTitle>
                  <p className="text-sm text-purple-100 mt-1">
                    {new Date(
                      selectedQuotation.created_at,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedQuotation.status)}`}
                >
                  {getStatusText(selectedQuotation.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Cliente */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <h3 className="font-semibold text-lg mb-3">Cliente</h3>
                <div className="space-y-1">
                  <p className="font-medium">{selectedQuotation.client_name}</p>
                  {selectedQuotation.client_phone && (
                    <p className="text-sm text-gray-600">
                      Tel: {selectedQuotation.client_phone}
                    </p>
                  )}
                  {selectedQuotation.client_email && (
                    <p className="text-sm text-gray-600">
                      Email: {selectedQuotation.client_email}
                    </p>
                  )}
                  {selectedQuotation.client_address && (
                    <p className="text-sm text-gray-600">
                      Dir: {selectedQuotation.client_address}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 text-sm">Descripción</th>
                        <th className="text-center p-2 text-sm">Cant.</th>
                        <th className="text-right p-2 text-sm">P. Unit.</th>
                        <th className="text-right p-2 text-sm">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuotation.items?.map(
                        (item: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.description}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-right">
                              ${item.unit_price.toFixed(2)}
                            </td>
                            <td className="p-2 text-right font-medium">
                              ${item.subtotal.toFixed(2)}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      ${selectedQuotation.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {selectedQuotation.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento:</span>
                      <span>-${selectedQuotation.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedQuotation.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Impuesto:</span>
                      <span>${selectedQuotation.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t-2 pt-2 flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-purple-600">
                      ${selectedQuotation.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedQuotation.notes && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h3 className="font-semibold mb-2">Notas</h3>
                  <p className="text-sm text-gray-700">
                    {selectedQuotation.notes}
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 justify-between pt-4 border-t">
                <div className="flex gap-2">
                  {selectedQuotation.status === "pending" && (
                    <>
                      <Button
                        onClick={() =>
                          handleUpdateStatus(selectedQuotation.id, "approved")
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button
                        onClick={() =>
                          handleUpdateStatus(selectedQuotation.id, "rejected")
                        }
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedQuotation(null)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => handlePrintQuotation(selectedQuotation)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
