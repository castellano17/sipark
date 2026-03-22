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
  items?: QuotationItem[];
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
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [quotationToApprove, setQuotationToApprove] = useState<Quotation | null>(null);
  const [approveData, setApproveData] = useState({
    event_date: "",
    event_time: "",
    package_id: "",
    deposit_amount: 0,
  });

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

    if (!formData.client_name.trim()) {
      enqueueSnackbar("El campo 'Nombre' es obligatorio", {
        variant: "warning",
      });
      return;
    }

    if (!formData.valid_until) {
      enqueueSnackbar("El campo 'Válida Hasta' es obligatorio", {
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
        const currentUserStr = localStorage.getItem("currentUser");
        const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        const printedBy = currentUser ? currentUser.username : "Sistema";
        await window.api.generateQuotationPDF({ ...result.data, printedBy });
        enqueueSnackbar("PDF generado exitosamente", { variant: "success" });
      }
    } catch (error) {
      console.error("Error generando PDF:", error);
      enqueueSnackbar("Error al generar PDF", { variant: "error" });
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    if (status === "approved") {
      try {
        // Obtener la cotización completa con items
        const result = await window.api.getQuotationById(id);
        if (result.success && result.data) {
          const q = result.data;
          setQuotationToApprove(q);

          // Buscar un paquete en los ítems (robusto: buscar tanto 'package' como 'paquete')
          const pkgItem = q.items?.find((item: any) => {
            const p = products.find(prod => prod.id === item.product_id);
            return p?.type?.toLowerCase() === "package" || p?.type?.toLowerCase() === "paquete";
          });

          // Formatear fecha para el input date (YYYY-MM-DD)
          let formattedDate = "";
          if (q.valid_until) {
            try {
              const d = new Date(q.valid_until);
              // Evitar problemas de zona horaria usando split 'T'
              formattedDate = d.toISOString().split('T')[0];
            } catch (e) {
              formattedDate = q.valid_until;
            }
          }

          setApproveData({
            event_date: formattedDate,
            event_time: "", // La hora sí se debe pedir
            package_id: pkgItem ? pkgItem.product_id.toString() : (q.items?.find((i: any) => i.product_id)?.product_id?.toString() || ""),
            deposit_amount: 0,
          });
          setShowApproveModal(true);
        } else {
          enqueueSnackbar("Error al obtener detalles de la cotización", { variant: "error" });
        }
      } catch (error) {
        console.error("Error al preparar aprobación:", error);
        enqueueSnackbar("Error al procesar la cotización", { variant: "error" });
      }
      return;
    }

    const result = await window.api.updateQuotationStatus(id, status);
    if (result.success) {
      enqueueSnackbar("Estado actualizado", { variant: "success" });
      loadQuotations();
      if (selectedQuotation && selectedQuotation.id === id) {
        setSelectedQuotation({ ...selectedQuotation, status });
      }
    }
  };

  const handleApproveConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotationToApprove) return;

    if (!approveData.event_date || !approveData.event_time || !approveData.package_id) {
      enqueueSnackbar("Por favor complete todos los campos obligatorios para la reservación", { variant: "warning" });
      return;
    }

    try {
      // 1. Vincular o crear el cliente (asegurando un ID válido)
      let finalClientId = 1; // Cliente General por defecto (debe existir)
      
      try {
        if (quotationToApprove && quotationToApprove.client_phone) {
          // Intentar buscar cliente por teléfono
          const clientsRes = await window.api.getClients();
          const existingClient = (clientsRes && Array.isArray(clientsRes)) 
            ? clientsRes.find((c: any) => c.phone === quotationToApprove.client_phone) 
            : null;
          
          if (existingClient && existingClient.id) {
            finalClientId = Number(existingClient.id);
          } else {
            // Crear nuevo cliente
            const newClientId = await window.api.createClient(
              quotationToApprove.client_name,
              "Persona de Cotización",
              quotationToApprove.client_phone || null,
              null, // child name
              0, // child age
              null, // allergies
              "Creado automáticamente desde Cotización"
            );
            
            if (newClientId && typeof newClientId === 'number') {
              finalClientId = newClientId;
            } else if (newClientId && (newClientId as any).id) {
              finalClientId = Number((newClientId as any).id);
            }
          }
        }
      } catch (clientErr) {
        console.warn("Error vinculando cliente, usando Cliente General (ID 1):", clientErr);
        finalClientId = 1;
      }

      // 2. Crear la reservación
      const resResult = await window.api.createReservation({
        client_id: Number(finalClientId),
        client_name: quotationToApprove.client_name,
        client_phone: quotationToApprove.client_phone,
        client_email: quotationToApprove.client_email,
        event_date: approveData.event_date,
        event_time: approveData.event_time,
        package_id: parseInt(approveData.package_id || "0"),
        package_name: products.find(p => p.id === parseInt(approveData.package_id))?.name || "",
        num_children: 0,
        total_amount: quotationToApprove.total,
        deposit_amount: approveData.deposit_amount || 0,
        status: "pending",
        notes: `Generada automáticamente desde Cotización #${quotationToApprove.quotation_number}\n${quotationToApprove.notes || ""}`
      });

      if (!resResult.success) {
        enqueueSnackbar("Error al crear reserva: " + resResult.error, { variant: "error" });
        return;
      }

      // 2. Actualizar estado de la cotización a aprobada
      const updResult = await window.api.updateQuotationStatus(quotationToApprove.id, "approved");
      if (updResult.success) {
        enqueueSnackbar("Cotización aprobada y reservación agendada", { variant: "success" });
        setShowApproveModal(false);
        loadQuotations();
        if (selectedQuotation && selectedQuotation.id === quotationToApprove.id) {
          setSelectedQuotation({ ...selectedQuotation, status: "approved" });
        }
      } else {
        enqueueSnackbar("Reserva creada pero falló actualizar la cotización", { variant: "warning" });
      }
    } catch (error) {
      console.error("Error en aprobación:", error);
      enqueueSnackbar("Error en el proceso de aprobación", { variant: "error" });
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
                  <th className="text-left p-3">Evento</th>
                  <th className="text-right p-3">Total</th>
                  <th className="w-40 text-center p-3">Estado</th>
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
                      {new Date(quotation.valid_until || quotation.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right font-medium">
                      ${Number(quotation.total).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(quotation.status)}`}
                      >
                        {getStatusText(quotation.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-0.5">
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
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Datos del Cliente */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Datos del Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
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
                                        ${Number(product.price).toFixed(2)}
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
                            value={`$${Number(item.subtotal).toFixed(2)}`}
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
                        Fecha del Evento *
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
                    Evento: {new Date(selectedQuotation.valid_until).toLocaleDateString()}
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
                              ${Number(item.unit_price).toFixed(2)}
                            </td>
                            <td className="p-2 text-right font-medium">
                              ${Number(item.subtotal).toFixed(2)}
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
                      ${Number(selectedQuotation.subtotal).toFixed(2)}
                    </span>
                  </div>
                  {selectedQuotation.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento:</span>
                      <span>-${Number(selectedQuotation.discount).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedQuotation.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Impuesto:</span>
                      <span>${Number(selectedQuotation.tax).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t-2 pt-2 flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-purple-600">
                      ${Number(selectedQuotation.total).toFixed(2)}
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
      {/* Modal para aprobar y agendar reservación */}
      {showApproveModal && quotationToApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Aprobar Cotización y Agendar Reservación</h2>
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md mb-4 text-sm">
              Al marcar esta cotización como Aprobada, se creará una Reservación automáticamente.
              Por favor completa los detalles del evento.
            </div>

            <form onSubmit={handleApproveConfirm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha del Evento *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full p-2 border rounded-md"
                    value={approveData.event_date}
                    onChange={(e) =>
                      setApproveData({ ...approveData, event_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hora del Evento *
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full p-2 border rounded-md"
                    value={approveData.event_time}
                    onChange={(e) =>
                      setApproveData({ ...approveData, event_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Paquete *
                </label>
                <select
                  required
                  className="w-full p-2 border rounded-md"
                  value={approveData.package_id}
                  onChange={(e) =>
                    setApproveData({ ...approveData, package_id: e.target.value })
                  }
                >
                  <option value="">Seleccione un paquete</option>
                  {products
                    .filter((p) => p.type?.toLowerCase() === "paquete" || p.type?.toLowerCase() === "package")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Anticipo (Deposit)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded-md"
                  value={approveData.deposit_amount}
                  onChange={(e) =>
                    setApproveData({
                      ...approveData,
                      deposit_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowApproveModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 max-w-[200px]">
                  Aprobar y Agendar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
