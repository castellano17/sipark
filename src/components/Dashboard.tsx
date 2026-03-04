import React, { useState, useEffect } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import { useCashBox } from "@/hooks/useCashBox";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar as CalendarIcon,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

interface DashboardProps {
  currentUser: any;
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [stats, setStats] = useState({
    totalSales: 0,
    inProgress: 0,
    pending: 0,
    completed: 0,
  });
  const [weekReservations, setWeekReservations] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [activeMemberships, setActiveMemberships] = useState<any[]>([]);
  const [monthMemberships, setMonthMemberships] = useState({
    active: 0,
    expired: 0,
    expiring: 0,
  });

  const { getActiveSessions } = useDatabase();
  const { getActiveCashBox, getCashBoxSales } = useCashBox();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const sessions = await getActiveSessions();

      // Obtener ventas del día desde la caja activa
      let totalSales = 0;
      const activeCashBox = await getActiveCashBox();

      if (activeCashBox) {
        const sales = await getCashBoxSales(activeCashBox.id);
        totalSales = sales.reduce(
          (sum: number, sale: any) => sum + (sale.total || 0),
          0,
        );
      }

      setStats({
        totalSales: totalSales,
        inProgress: sessions.length || 0,
        pending: 0,
        completed: totalSales > 0 ? 1 : 0,
      });

      // Cargar membresías activas
      await loadActiveMemberships();

      // Cargar estadísticas de membresías del mes
      await loadMonthMemberships();

      // Cargar reservaciones de la semana
      loadWeekReservations();
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error);
    }
  };

  const loadActiveMemberships = async () => {
    try {
      const result = await window.api.getActiveMemberships("active");

      // La API devuelve { memberships: [], summary: {} }
      const memberships = result?.memberships || [];

      // Filtrar por la semana actual
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weekMemberships = memberships.filter((m: any) => {
        const startDate = new Date(m.start_date);
        return startDate >= startOfWeek && startDate <= endOfWeek;
      });

      setActiveMemberships(weekMemberships);
    } catch (error) {
      console.error("Error cargando membresías activas:", error);
      setActiveMemberships([]);
    }
  };

  const loadMonthMemberships = async () => {
    try {
      const result = await window.api.getActiveMemberships("all");

      // La API devuelve { memberships: [], summary: {} }
      const allMemberships = result?.memberships || [];

      let active = 0;
      let expired = 0;
      let expiring = 0;

      allMemberships.forEach((m: any) => {
        // Usar los campos calculados por la API
        if (m.is_expired || m.status === "expired") {
          expired++;
        } else if (m.status === "active") {
          active++;
          if (m.is_expiring_soon) {
            expiring++;
          }
        }
      });

      setMonthMemberships({ active, expired, expiring });
    } catch (error) {
      console.error("Error cargando estadísticas de membresías:", error);
      setMonthMemberships({ active: 0, expired: 0, expiring: 0 });
    }
  };

  const loadWeekReservations = async () => {
    try {
      // Obtener el primer y último día del mes actual
      const firstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );

      const result = await window.api.getReservationsByDateRange(
        firstDay.toISOString().split("T")[0],
        lastDay.toISOString().split("T")[0],
      );

      if (result.success) {
        const reservations = result.data.map((res: any) => ({
          id: res.id,
          date: new Date(res.event_date + "T" + res.event_time),
          time: res.event_time,
          title: res.package_name,
          client: res.client_name,
          color:
            res.status === "confirmed"
              ? "bg-green-500"
              : res.status === "cancelled"
                ? "bg-red-500"
                : "bg-blue-500",
        }));
        setAllReservations(reservations);
        filterReservationsByDate(selectedDate, reservations);
      }
    } catch (error) {
      console.error("Error cargando reservaciones:", error);
    }
  };

  const filterReservationsByDate = (
    date: Date,
    reservations = allReservations,
  ) => {
    const filtered = reservations.filter((reservation) => {
      return (
        reservation.date.getDate() === date.getDate() &&
        reservation.date.getMonth() === date.getMonth() &&
        reservation.date.getFullYear() === date.getFullYear()
      );
    });
    setWeekReservations(filtered);
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    setSelectedDate(newDate);
    filterReservationsByDate(newDate);
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + direction,
      1,
    );
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <div className="flex flex-col h-full gap-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header con Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-slate-600" />
          <span className="text-sm text-slate-600">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Card */}
          <Card className="shadow-lg border-none bg-gradient-to-r from-blue-500 to-purple-600 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    Bienvenido,{" "}
                    {currentUser?.full_name || currentUser?.username}
                  </h2>
                  <h3 className="text-3xl font-bold mb-4">Abrir Venta</h3>
                  <p className="text-blue-100 mb-6 max-w-md">
                    Gestiona tus ventas, productos y servicios de manera rápida
                    y eficiente
                  </p>
                  <Button
                    onClick={() => onNavigate("/pos")}
                    className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg shadow-md"
                  >
                    Vender
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="hidden md:block">
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Ccircle cx='100' cy='100' r='80'/%3E%3Ccircle cx='100' cy='100' r='60'/%3E%3Ccircle cx='100' cy='100' r='40'/%3E%3C/g%3E%3C/svg%3E"
                    alt="decoration"
                    className="w-48 h-48 opacity-30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-md border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold break-words overflow-hidden">
                  {formatCurrency(stats.totalSales)}
                </p>
                <p className="text-sm text-blue-100">Total Ventas del Día</p>
              </CardContent>
            </Card>

            <Card
              className="shadow-md border-none bg-gradient-to-br from-cyan-500 to-cyan-600 text-white cursor-pointer hover:scale-105 transition-transform"
              onClick={() => onNavigate("/operaciones")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-3xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-cyan-100">En Progreso</p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-none bg-gradient-to-br from-pink-500 to-pink-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-3xl font-bold">{stats.pending}</p>
                <p className="text-sm text-pink-100">Pendientes</p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-none bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-3xl font-bold">{stats.completed}</p>
                <p className="text-sm text-green-100">Completadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Membresías Activas de la Semana */}
            <Card className="shadow-md border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  Membresías de la Semana
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600"
                  onClick={() =>
                    onNavigate("/operaciones/gestionar-membresias")
                  }
                >
                  Ver todas
                </Button>
              </CardHeader>
              <CardContent>
                {activeMemberships.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeMemberships.slice(0, 5).map((membership: any) => (
                      <div
                        key={membership.id}
                        onClick={() =>
                          onNavigate("/operaciones/gestionar-membresias")
                        }
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-semibold text-sm text-slate-900">
                              {membership.client_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {membership.membership_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-green-600">
                            {membership.status === "active"
                              ? "Activa"
                              : membership.status}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(membership.start_date).toLocaleDateString(
                              "es-ES",
                              { day: "2-digit", month: "short" },
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        No hay membresías nuevas esta semana
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Membresías del Mes */}
            <Card className="shadow-md border-none">
              <CardHeader>
                <CardTitle className="text-lg">Membresías del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Círculo de fondo */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                      />
                      {/* Activas (azul) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={
                          251.2 -
                          (251.2 * monthMemberships.active) /
                            Math.max(
                              monthMemberships.active +
                                monthMemberships.expired +
                                monthMemberships.expiring,
                              1,
                            )
                        }
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                      />
                      {/* Por vencer (naranja) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="32"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="8"
                        strokeDasharray="201"
                        strokeDashoffset={
                          201 -
                          (201 * monthMemberships.expiring) /
                            Math.max(
                              monthMemberships.active +
                                monthMemberships.expired +
                                monthMemberships.expiring,
                              1,
                            )
                        }
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                      />
                      {/* Vencidas (rojo) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="8"
                        strokeDasharray="150.8"
                        strokeDashoffset={
                          150.8 -
                          (150.8 * monthMemberships.expired) /
                            Math.max(
                              monthMemberships.active +
                                monthMemberships.expired +
                                monthMemberships.expiring,
                              1,
                            )
                        }
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-slate-600">
                        Activas: {monthMemberships.active}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm text-slate-600">
                        Por vencer: {monthMemberships.expiring}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-slate-600">
                        Vencidas: {monthMemberships.expired}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ocupación y Uso del Día */}
          <Card className="shadow-md border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Actividad del Día</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600"
                onClick={() => onNavigate("/operaciones")}
              >
                Ver sesiones
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-900">
                        Sesiones Activas
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {stats.inProgress}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-blue-700 mt-2">
                    <span>En progreso ahora</span>
                    <span className="font-semibold">
                      {stats.inProgress > 0 ? "Activo" : "Sin sesiones"}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-purple-600" />
                      <p className="text-sm font-semibold text-purple-900">
                        Ventas Realizadas
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">
                      {stats.completed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-purple-700 mt-2">
                    <span>Transacciones hoy</span>
                    <span className="font-semibold">
                      {formatCurrency(stats.totalSales)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha - 1/3 */}
        <div className="space-y-6">
          {/* Calendario */}
          <Card className="shadow-md border-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                {["D", "L", "M", "M", "J", "V", "S"].map((day, i) => (
                  <div key={i} className="font-semibold text-slate-600 py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="py-2"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday =
                    day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();
                  const isSelected =
                    day === selectedDate.getDate() &&
                    currentDate.getMonth() === selectedDate.getMonth() &&
                    currentDate.getFullYear() === selectedDate.getFullYear();

                  // Verificar si hay reservaciones en este día
                  const hasReservations = allReservations.some(
                    (res) =>
                      res.date.getDate() === day &&
                      res.date.getMonth() === currentDate.getMonth() &&
                      res.date.getFullYear() === currentDate.getFullYear(),
                  );

                  return (
                    <div
                      key={day}
                      onClick={() => handleDateSelect(day)}
                      className={`py-2 rounded-lg cursor-pointer transition-all relative ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold shadow-md"
                          : isToday
                            ? "bg-blue-100 text-blue-600 font-bold"
                            : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {day}
                      {hasReservations && !isSelected && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Reservaciones de la Semana */}
          <Card className="shadow-md border-none">
            <CardHeader>
              <CardTitle className="text-lg">Reservaciones del Día</CardTitle>
              <p className="text-xs text-slate-500">
                {selectedDate.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </CardHeader>
            <CardContent>
              {weekReservations.length > 0 ? (
                <div className="space-y-3">
                  {weekReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      onClick={() => {
                        sessionStorage.setItem(
                          "selectedReservationId",
                          reservation.id.toString(),
                        );
                        onNavigate("/reservaciones");
                      }}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="text-center min-w-[70px]">
                        <p className="text-xs font-semibold text-slate-900">
                          {reservation.time}
                        </p>
                      </div>
                      <div
                        className={`w-1 h-12 rounded-full ${reservation.color}`}
                      ></div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-900">
                          {reservation.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {reservation.client}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarIcon className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    Sin reservaciones
                  </p>
                  <p className="text-xs text-slate-500">
                    No hay reservaciones para{" "}
                    {selectedDate.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ocupación en Tiempo Real */}
          <Card className="shadow-md border-none">
            <CardHeader>
              <CardTitle className="text-lg">Ocupación Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * stats.inProgress) / 10}
                      transform="rotate(-90 50 50)"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-slate-900">
                      {stats.inProgress}
                    </p>
                    <p className="text-xs text-slate-500">Activas</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">
                    Sesiones en progreso
                  </p>
                  <p className="text-xs text-slate-500">
                    {stats.inProgress > 0
                      ? `${Math.round((stats.inProgress / 10) * 100)}% de capacidad`
                      : "Sin sesiones activas"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
