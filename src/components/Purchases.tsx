import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Eye,
  FileText,
  Truck,
  Package,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { PurchaseDetailModal } from "./PurchaseDetailModal";
import { useNotification } from "../hooks/useNotification";
import { useCurrency } from "../hooks/useCurrency";

interface PurchaseOrder {
  id: number;
  supplier_id: number;
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  total_items: number;
  notes: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface Supplier {
  id: number;
  name: string;
}

interface PurchaseItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export function Purchases() {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(
    null,
  );
  const { success, error } = useNotification();
  const { formatCurrency } = useCurrency();

  // Helper para obtener fecha local en formato YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    supplier_id: "",
    invoice_number: "",
    invoice_date: getLocalDateString(),
    notes: "",
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    product_id: "",
    quantity: "",
    unit_cost: "",
  });
  const [productSearch, setProductSearch] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierList, setShowSupplierList] = useState(false);

  useEffect(() => {
    loadPurchases();
    loadSuppliers();
    loadProducts();

    // Cerrar listas al hacer clic fuera
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".product-search-container")) {
        setShowProductList(false);
      }
      if (!target.closest(".supplier-search-container")) {
        setShowSupplierList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadPurchases = async () => {
    try {
      const data = await window.api.getPurchaseOrders(50);
      setPurchases(data);
    } catch (err) {
      error("Error cargando compras");
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await window.api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      error("Error cargando proveedores");
    }
  };

  const loadProducts = async () => {
    try {
      const data = await window.api.getInventoryProducts();
      setProducts(data);
    } catch (err) {
      error("Error cargando productos");
    }
  };

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.barcode && p.barcode.includes(productSearch)),
  );

  // Filtrar proveedores por búsqueda
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.contact_name &&
        s.contact_name.toLowerCase().includes(supplierSearch.toLowerCase())),
  );

  // Seleccionar producto de la lista
  const handleSelectProduct = (product: Product) => {
    setCurrentItem({
      ...currentItem,
      product_id: product.id.toString(),
    });
    setProductSearch(product.name);
    setShowProductList(false);
  };

  // Seleccionar proveedor de la lista
  const handleSelectSupplier = (supplier: Supplier) => {
    setFormData({
      ...formData,
      supplier_id: supplier.id.toString(),
    });
    setSupplierSearch(supplier.name);
    setShowSupplierList(false);
  };

  const handleAddItem = () => {
    if (
      !currentItem.product_id ||
      !currentItem.quantity ||
      !currentItem.unit_cost
    ) {
      error("Complete todos los campos del producto");
      return;
    }

    const product = products.find(
      (p) => p.id === parseInt(currentItem.product_id),
    );
    if (!product) return;

    const quantity = parseInt(currentItem.quantity);
    const unitCost = parseFloat(currentItem.unit_cost);
    const subtotal = quantity * unitCost;

    const newItem: PurchaseItem = {
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_cost: unitCost,
      subtotal,
    };

    setItems([...items, newItem]);
    setCurrentItem({ product_id: "", quantity: "", unit_cost: "" });
    setProductSearch("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.supplier_id ||
      !formData.invoice_number ||
      items.length === 0
    ) {
      error(
        "Complete todos los campos requeridos y agregue al menos un producto",
      );
      return;
    }

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    try {
      await window.api.createPurchaseOrder({
        supplier_id: parseInt(formData.supplier_id),
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        total_amount: totalAmount,
        items,
        notes: formData.notes,
      });

      success("Compra registrada y stock actualizado");
      handleCloseModal();
      loadPurchases();
      loadProducts();
    } catch (err) {
      error("Error registrando compra");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      supplier_id: "",
      invoice_number: "",
      invoice_date: getLocalDateString(),
      notes: "",
    });
    setItems([]);
    setCurrentItem({ product_id: "", quantity: "", unit_cost: "" });
    setProductSearch("");
    setSupplierSearch("");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES");
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
            <p className="text-sm text-gray-500">
              Registro de compras a proveedores
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Compra
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  Factura
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  Fecha
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold">
                  Items
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold">
                  Total
                </th>
                <th className="w-40 px-4 py-3 text-center text-xs font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {purchase.invoice_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      {purchase.supplier_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDate(purchase.invoice_date)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {purchase.total_items}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(purchase.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPurchaseId(purchase.id)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {purchases.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay compras registradas</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Nueva Compra */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col bg-white border-0">
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Nueva Compra
                    </h2>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-6">
                  {/* Datos de la factura */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="relative supplier-search-container">
                      <label className="block text-sm font-medium mb-2">
                        Proveedor *
                      </label>
                      <Input
                        type="text"
                        placeholder="Buscar proveedor..."
                        value={supplierSearch}
                        onChange={(e) => {
                          setSupplierSearch(e.target.value);
                          setShowSupplierList(true);
                        }}
                        onFocus={() => setShowSupplierList(true)}
                        required
                      />
                      {showSupplierList && supplierSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map((supplier) => (
                              <div
                                key={supplier.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleSelectSupplier(supplier)}
                              >
                                <div className="font-medium">
                                  {supplier.name}
                                </div>
                                {supplier.contact_name && (
                                  <div className="text-xs text-gray-500">
                                    Contacto: {supplier.contact_name}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500 text-sm">
                              No se encontraron proveedores
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        No. Factura *
                      </label>
                      <Input
                        value={formData.invoice_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            invoice_number: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Fecha *
                      </label>
                      <Input
                        type="date"
                        value={formData.invoice_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            invoice_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Agregar productos */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold mb-3">Agregar Productos</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2 relative product-search-container">
                        <Input
                          type="text"
                          placeholder="Buscar producto por nombre o código..."
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductList(true);
                          }}
                          onFocus={() => setShowProductList(true)}
                          className="w-full"
                        />
                        {showProductList && productSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredProducts.length > 0 ? (
                              filteredProducts.map((product) => (
                                <div
                                  key={product.id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handleSelectProduct(product)}
                                >
                                  <div className="font-medium">
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Stock: {product.stock || 0}
                                    {product.barcode && ` • ${product.barcode}`}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500 text-sm">
                                No se encontraron productos
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={currentItem.quantity}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            quantity: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Costo unitario"
                        value={currentItem.unit_cost}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            unit_cost: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="mt-3 w-full"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>

                  {/* Lista de productos */}
                  {items.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">
                        Productos Agregados
                      </h3>
                      <Card>
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs">
                                Producto
                              </th>
                              <th className="px-4 py-2 text-center text-xs">
                                Cantidad
                              </th>
                              <th className="px-4 py-2 text-right text-xs">
                                Costo Unit.
                              </th>
                              <th className="px-4 py-2 text-right text-xs">
                                Subtotal
                              </th>
                              <th className="px-4 py-2 text-center text-xs"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm">
                                  {item.product_name}
                                </td>
                                <td className="px-4 py-2 text-center text-sm font-semibold">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-2 text-right text-sm">
                                  {formatCurrency(item.unit_cost)}
                                </td>
                                <td className="px-4 py-2 text-right text-sm font-semibold">
                                  {formatCurrency(item.subtotal)}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveItem(index)}
                                  >
                                    ✕
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>

                      <div className="mt-4 flex justify-end">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Notas
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md"
                      rows={2}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={items.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Registrar Compra
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Modal de Detalle de Compra */}
      <PurchaseDetailModal
        purchaseId={selectedPurchaseId}
        onClose={() => setSelectedPurchaseId(null)}
      />
    </div>
  );
}
