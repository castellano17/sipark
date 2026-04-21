import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Calendar,
  Plus,
  Search,
  Eye,
  X,
  Printer,
  Phone,
  Mail,
} from "lucide-react";
import { useSnackbar } from "notistack";

interface Reservation {
  id: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  event_date: string;
  event_time: string;
  package_name: string;
  total_amount: number;
  deposit_amount: number;
  status: string;
  payment_status: string;
  notes: string;
}

interface PackageItem {
  id: number;
  name: string;
  price: number;
  type: string;
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export const Reservaciones: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<number | null>(
    null,
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [packageSearch, setPackageSearch] = useState("");
  const [filteredPackages, setFilteredPackages] = useState<PackageItem[]>([]);
  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    client_id: 0,
    client_name: "",
    client_phone: "",
    client_email: "",
    event_date: "",
    event_time: "",
    package_id: 0,
    package_name: "",
    total_amount: 0,
    deposit_amount: 0,
    notes: "",
  });

  useEffect(() => {
    loadReservations();
    loadPackages();
    loadClients();

    // Verificar si hay un ID en sessionStorage
    const reservationId = sessionStorage.getItem("selectedReservationId");
    if (reservationId) {
      loadAndShowReservation(parseInt(reservationId));
      sessionStorage.removeItem("selectedReservationId");
    }
  }, []);

  useEffect(() => {
    if (clientSearch.length >= 1) {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          client.phone.includes(clientSearch),
      );
      setFilteredClients(filtered);
      setShowClientDropdown(true);
    } else {
      setFilteredClients([]);
      setShowClientDropdown(false);
    }
  }, [clientSearch, clients]);

  useEffect(() => {
    if (packageSearch.length >= 1) {
      const filtered = packages.filter((pkg) =>
        pkg.name.toLowerCase().includes(packageSearch.toLowerCase()),
      );
      setFilteredPackages(filtered);
      setShowPackageDropdown(true);
    } else {
      setFilteredPackages([]);
      setShowPackageDropdown(false);
    }
  }, [packageSearch, packages]);

  const loadReservations = async () => {
    try {
      const result = await window.api.getAllReservations();
      if (result.success) {
        setReservations(result.data || []);
      }
    } catch (error) {
    }
  };

  const loadPackages = async () => {
    try {
      const result = await window.api.getProductsServices();
      // api.getProductsServices devuelve un array directamente
      if (Array.isArray(result)) {
        const pkgs = result.filter((p: PackageItem) => p.type === "package");
        setPackages(pkgs);
      }
    } catch (error) {
    }
  };

  const loadClients = async () => {
    try {
      const result = await window.api.getClients();
      // api.getClients devuelve un array directamente
      if (Array.isArray(result)) {
        setClients(result);
      }
    } catch (error) {
    }
  };

  const loadAndShowReservation = async (id: number) => {
    try {
      const result = await window.api.getReservationById(id);
      if (result.success && result.data) {
        setSelectedReservation(result.data);
      }
    } catch (error) {
    }
  };

  const handleSelectClient = (client: Client) => {
    setFormData({
      ...formData,
      client_id: client.id,
      client_name: client.name,
      client_phone: client.phone,
      client_email: client.email || "",
    });
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const handleSelectPackage = (pkg: PackageItem) => {
    setFormData({
      ...formData,
      package_id: pkg.id,
      package_name: pkg.name,
      total_amount: pkg.price,
    });
    setPackageSearch(pkg.name);
    setShowPackageDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_name.trim()) return enqueueSnackbar("El campo 'Nombre' es obligatorio", { variant: "warning" });
    if (!formData.event_date) return enqueueSnackbar("El campo 'Fecha del Evento' es obligatorio", { variant: "warning" });
    if (!formData.event_time) return enqueueSnackbar("El campo 'Hora del Evento' es obligatorio", { variant: "warning" });
    if (!formData.package_id) return enqueueSnackbar("El campo 'Paquete' es obligatorio", { variant: "warning" });

    const result = await window.api.createReservation(formData);

    if (result.success) {
      enqueueSnackbar("Reservación creada exitosamente", {
        variant: "success",
      });
      setShowModal(false);
      resetForm();
      loadReservations();
    } else {
      enqueueSnackbar("Error al crear reservación", { variant: "error" });
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: 0,
      client_name: "",
      client_phone: "",
      client_email: "",
      event_date: "",
      event_time: "",
      package_id: 0,
      package_name: "",
      total_amount: 0,
      deposit_amount: 0,
      notes: "",
    });
    setClientSearch("");
    setPackageSearch("");
  };

  const handleCancelReservation = async (id: number) => {
    setReservationToCancel(id);
    setShowCancelConfirm(true);
  };

  const confirmCancelReservation = async () => {
    if (!reservationToCancel) return;

    try {
      const result = await window.api.cancelReservation(reservationToCancel);
      if (result.success) {
        enqueueSnackbar("Reservación cancelada", { variant: "success" });
        loadReservations();
      } else {
        enqueueSnackbar("Error al cancelar reservación", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar("Error al cancelar reservación", { variant: "error" });
    } finally {
      setShowCancelConfirm(false);
      setReservationToCancel(null);
    }
  };

  const handlePrintReservation = async (reservation: Reservation) => {
    try {
      enqueueSnackbar("Generando PDF...", { variant: "info" });
      await window.api.generateReservationPDF(reservation);
      enqueueSnackbar("PDF generado exitosamente", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Error al generar PDF", { variant: "error" });
    }
  };

  const handleOpenPaymentModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    const remaining = reservation.total_amount - reservation.deposit_amount;
    setPaymentAmount(remaining);
    setShowPaymentModal(true);
  };

  const handleRegisterPayment = async () => {
    if (!selectedReservation) return;

    try {
      const cashBox = await window.api.getActiveCashBox();

      if (!cashBox) {
        enqueueSnackbar("No hay caja abierta", { variant: "error" });
        return;
      }

      // Registrar pago...

      const result = await window.api.registerReservationPayment(
        selectedReservation.id,
        {
          amount: paymentAmount,
          paymentMethod,
          cashBoxId: cashBox.id,
          userId: null,
        },
      );


      if (result.success) {
        enqueueSnackbar("Pago registrado exitosamente", {
          variant: "success",
        });
        setShowPaymentModal(false);
        setSelectedReservation(null);
        loadReservations();
      } else {
        enqueueSnackbar(`Error: ${result.error || "Error al registrar pago"}`, {
          variant: "error",
        });
      }
    } catch (error) {
      enqueueSnackbar(`Error: ${error.message}`, { variant: "error" });
    }
  };

  const handleOpenCompleteModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    const remaining = reservation.total_amount - reservation.deposit_amount;
    setPaymentAmount(remaining);
    setShowCompleteModal(true);
  };

  const handleCompleteReservation = async () => {
    if (!selectedReservation) return;

    try {
      const cashBox = await window.api.getActiveCashBox();
      if (!cashBox) {
        enqueueSnackbar("No hay caja abierta", { variant: "error" });
        return;
      }

      const remaining =
        selectedReservation.total_amount - selectedReservation.deposit_amount;

      const result = await window.api.completeReservation(
        selectedReservation.id,
        {
          remainingAmount: remaining,
          paymentMethod,
          cashBoxId: cashBox.id,
          userId: null,
        },
      );

      if (result.success) {
        enqueueSnackbar("Evento completado exitosamente", {
          variant: "success",
        });
        setShowCompleteModal(false);
        setSelectedReservation(null);
        loadReservations();
      } else {
        enqueueSnackbar("Error al completar evento", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar("Error al completar evento", { variant: "error" });
    }
  };

  const filteredReservations = reservations.filter((r) => {
    let eventDate = "";
    if (typeof r.event_date === "string") {
      eventDate = r.event_date.includes("T") ? r.event_date.split("T")[0] : r.event_date;
    } else {
      eventDate = new Date(r.event_date).toISOString().split("T")[0];
    }
    
    return (
      r.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eventDate.includes(searchTerm)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "confirmed":
        return "Confirmada";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reservaciones</h1>
          <p className="text-slate-600 mt-1">
            Gestión de reservaciones y eventos
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Reservación
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cliente o fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-left p-3">Hora</th>
                  <th className="text-left p-3">Paquete</th>
                  <th className="text-right p-3">Total</th>
                  <th className="w-40 text-center p-3">Estado</th>
                  <th className="text-center p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3">
                      <div>
                        <div className="font-medium">
                          {reservation.client_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {reservation.client_phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {(() => {
                        const dateStr = typeof reservation.event_date === "string" && reservation.event_date.includes("T")
                          ? reservation.event_date.split("T")[0]
                          : reservation.event_date;
                        return new Date(`${dateStr}T00:00:00`).toLocaleDateString();
                      })()}
                    </td>
                    <td className="p-3">{reservation.event_time}</td>
                    <td className="p-3">{reservation.package_name}</td>
                    <td className="p-3 text-right font-medium">
                      ${Number(reservation.total_amount).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(reservation.status)}`}
                      >
                        {getStatusText(reservation.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReservation(reservation)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintReservation(reservation)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        {reservation.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() =>
                              handleCancelReservation(reservation.id)
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Nueva Reservación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Nueva Reservación</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Buscar Cliente
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o teléfono..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      onFocus={() =>
                        clientSearch && setShowClientDropdown(true)
                      }
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {showClientDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredClients.length > 0 ? (
                          filteredClients.map((client) => (
                            <div
                              key={client.id}
                              onClick={() => handleSelectClient(client)}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-gray-500">
                                {client.phone}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-gray-500">
                            {clients.length === 0
                              ? "No hay clientes registrados"
                              : "No se encontraron clientes"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

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
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) =>
                      setFormData({ ...formData, client_email: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Fecha del Evento *
                    </label>
                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) =>
                        setFormData({ ...formData, event_date: e.target.value })
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Hora del Evento *
                    </label>
                    <input
                      type="time"
                      value={formData.event_time}
                      onChange={(e) =>
                        setFormData({ ...formData, event_time: e.target.value })
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Buscar Paquete *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar paquete..."
                      value={packageSearch}
                      onChange={(e) => setPackageSearch(e.target.value)}
                      onFocus={() =>
                        packageSearch && setShowPackageDropdown(true)
                      }
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {showPackageDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredPackages.length > 0 ? (
                          filteredPackages.map((pkg) => (
                            <div
                              key={pkg.id}
                              onClick={() => handleSelectPackage(pkg)}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium">{pkg.name}</div>
                              <div className="text-sm text-gray-500">
                                ${Number(pkg.price).toFixed(2)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-gray-500">
                            {packages.length === 0
                              ? "No hay paquetes registrados"
                              : "No se encontraron paquetes"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Total
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_amount: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Anticipo
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deposit_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deposit_amount: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
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

                <div className="flex gap-2 justify-end">
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
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Crear Reservación
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Detalle */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  Detalle de Reservación
                </CardTitle>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReservation.status)}`}
                >
                  {getStatusText(selectedReservation.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Cliente */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {selectedReservation.client_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">
                      {selectedReservation.client_name}
                    </h3>
                    <p className="text-sm text-slate-500">Cliente</p>
                  </div>
                </div>
                <div className="space-y-2 ml-12">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{selectedReservation.client_phone}</span>
                  </div>
                  {selectedReservation.client_email && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{selectedReservation.client_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Evento */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg text-slate-900">
                    Información del Evento
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 ml-7">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Fecha</p>
                    <p className="font-medium text-slate-900">
                      {new Date(
                        selectedReservation.event_date,
                      ).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Hora</p>
                    <p className="font-medium text-slate-900">
                      {selectedReservation.event_time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Paquete */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-lg text-slate-900 mb-2">
                  Paquete Seleccionado
                </h3>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="font-medium text-blue-600">
                    {selectedReservation.package_name}
                  </p>
                </div>
              </div>

              {/* Montos */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-lg text-slate-900 mb-3">
                  Resumen de Pagos
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-600">Total</span>
                    <span className="text-xl font-bold text-slate-900">
                      ${Number(selectedReservation.total_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Anticipo</span>
                    <span className="text-lg font-medium text-green-600">
                      ${Number(selectedReservation.deposit_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300">
                    <span className="font-semibold text-slate-900">
                      Pendiente
                    </span>
                    <span className="text-xl font-bold text-red-600">
                      $
                      {(
                        selectedReservation.total_amount -
                        selectedReservation.deposit_amount
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedReservation.notes && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h3 className="font-semibold text-slate-900 mb-2">Notas</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedReservation.notes}
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReservation(null)}
                  className="px-6"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => handlePrintReservation(selectedReservation)}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                {selectedReservation.status !== "cancelled" &&
                  selectedReservation.status !== "completed" &&
                  selectedReservation.deposit_amount <
                    selectedReservation.total_amount && (
                    <Button
                      onClick={() =>
                        handleOpenPaymentModal(selectedReservation)
                      }
                      className="bg-green-600 hover:bg-green-700 px-6"
                    >
                      Registrar Pago
                    </Button>
                  )}
                {selectedReservation.status === "confirmed" && (
                    <Button
                      onClick={() =>
                        handleOpenCompleteModal(selectedReservation)
                      }
                      className="bg-purple-600 hover:bg-purple-700 px-6"
                    >
                      Completar Evento
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Confirmación Cancelar */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Estás seguro de cancelar esta reservación?
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Esta acción cambiará el estado de la reservación a cancelada.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCancelConfirm(false);
                      setReservationToCancel(null);
                    }}
                    className="px-6"
                  >
                    No, mantener
                  </Button>
                  <Button
                    onClick={confirmCancelReservation}
                    className="bg-red-600 hover:bg-red-700 px-6"
                  >
                    Sí, cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Registrar Pago */}
      {showPaymentModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="bg-green-600 text-white">
              <CardTitle>Registrar Pago</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Cliente</p>
                <p className="font-semibold">
                  {selectedReservation.client_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Reservación</p>
                <p className="text-2xl font-bold">
                  ${Number(selectedReservation.total_amount).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Ya Pagado</p>
                <p className="text-lg font-semibold text-green-600">
                  ${Number(selectedReservation.deposit_amount).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Saldo Pendiente</p>
                <p className="text-lg font-semibold text-red-600">
                  $
                  {(
                    selectedReservation.total_amount -
                    selectedReservation.deposit_amount
                  ).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Monto a Pagar *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Método de Pago *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedReservation(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRegisterPayment}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Registrar Pago
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Completar Evento */}
      {showCompleteModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="bg-purple-600 text-white">
              <CardTitle>Completar Evento</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-900 mb-2">
                  El evento se marcará como completado. Si hay saldo pendiente,
                  se registrará el pago automáticamente.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Cliente</p>
                <p className="font-semibold">
                  {selectedReservation.client_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Evento</p>
                <p className="font-semibold">
                  {selectedReservation.package_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Saldo Pendiente</p>
                <p className="text-2xl font-bold text-red-600">
                  $
                  {(
                    selectedReservation.total_amount -
                    selectedReservation.deposit_amount
                  ).toFixed(2)}
                </p>
              </div>
              {selectedReservation.total_amount -
                selectedReservation.deposit_amount >
                0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Método de Pago del Saldo *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedReservation(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCompleteReservation}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Completar Evento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
