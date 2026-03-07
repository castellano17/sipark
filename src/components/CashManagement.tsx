import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Lock, Unlock, Printer } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useNotification } from "../hooks/useNotification";
import { useCurrency } from "../hooks/useCurrency";
import { useCashBox } from "../hooks/useCashBox";

interface CashMovement {
  id: number;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
}

export function CashManagement() {
  const { error: showError, success } = useNotification();
  const { formatCurrency } = useCurrency();
  const {
    openCashBox: openCashBoxAPI,
    getActiveCashBox,
    closeCashBox: closeCashBoxAPI,
    addCashMovement,
    getCashBoxMovements,
    getCashBoxSales,
  } = useCashBox();

  const [activeCashBox, setActiveCashBox] = useState<any>(null);
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showClosePrintModal, setShowClosePrintModal] = useState(false);
  const [pendingCashBoxId, setPendingCashBoxId] = useState<number | null>(null);
  const [closeData, setCloseData] = useState<any>(null);
  const [savedClosingNotes, setSavedClosingNotes] = useState("");

  useEffect(() => {
    loadCashBoxData();
  }, []);

  const loadCashBoxData = async () => {
    const cashBox = await getActiveCashBox();
    setActiveCashBox(cashBox);

    if (cashBox) {
      const movs = await getCashBoxMovements(cashBox.id);
      setMovements(movs);

      const salesData = await getCashBoxSales(cashBox.id);
      setSales(salesData);
    }
  };

  const handleOpenCashBox = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      showError("Ingrese un monto válido");
      return;
    }

    const cashBoxId = await openCashBoxAPI(amount, "Admin");
    if (cashBoxId) {
      success("Caja aperturada exitosamente");
      setOpeningAmount("");
      setPendingCashBoxId(cashBoxId);
      setShowPrintModal(true);
      await loadCashBoxData();
    }
  };

  const handlePrintOpeningTicket = async () => {
    if (!pendingCashBoxId || !activeCashBox) return;

    const openedAt = new Date(activeCashBox.opened_at);

    let ticketText = "\n";
    ticketText += "================================\n";
    ticketText += "     APERTURA DE CAJA          \n";
    ticketText += "================================\n";
    ticketText += `Fecha: ${openedAt.toLocaleString("es-ES")}\n`;
    ticketText += `Cajero: ${activeCashBox.opened_by}\n`;
    ticketText += `ID Caja: #${activeCashBox.id}\n`;
    ticketText += "--------------------------------\n";
    ticketText += `Monto Inicial: ${formatCurrency(activeCashBox.opening_amount)}\n`;
    ticketText += "================================\n";
    ticketText += "\n";
    ticketText += "Firmas:\n";
    ticketText += "\n";
    ticketText += `Cajero: ${activeCashBox.opened_by}\n`;
    ticketText += "_______________________\n";
    ticketText += "\n";
    ticketText += "Supervisor:\n";
    ticketText += "_______________________\n";
    ticketText += "\n\n";

    console.log("Imprimiendo apertura (ticket):", ticketText);
    success("Ticket de apertura generado");
    // TODO: Integrar con impresora térmica real
  };

  const handlePrintOpeningPDF = async () => {
    if (!pendingCashBoxId || !activeCashBox) return;

    try {
      const filepath = await window.api.generateOpeningPDF(activeCashBox);
      success("PDF de apertura generado y abierto");
      console.log("PDF generado en:", filepath);
    } catch (error) {
      showError("Error generando PDF de apertura");
      console.error(error);
    }
  };

  const handleAddExpense = async () => {
    if (!activeCashBox) return;

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      showError("Ingrese un monto válido");
      return;
    }
    if (!expenseDescription.trim()) {
      showError("Ingrese una descripción");
      return;
    }

    const result = await addCashMovement(
      activeCashBox.id,
      "expense",
      amount,
      expenseDescription,
    );

    if (result) {
      success("Gasto registrado exitosamente");
      setExpenseAmount("");
      setExpenseDescription("");
      await loadCashBoxData();
    }
  };

  const handleCloseCashBox = async () => {
    if (!activeCashBox) return;

    const amount = parseFloat(closingAmount);
    if (isNaN(amount) || amount < 0) {
      showError("Ingrese el monto contado");
      return;
    }

    // Calcular diferencia
    const expectedAmount = currentBalance;
    const difference = amount - expectedAmount;

    // Validar notas si hay diferencia (más de medio centavo)
    if (Math.abs(difference) >= 0.005 && !closingNotes.trim()) {
      showError("Debe ingresar una nota explicando la diferencia en el cuadre");
      return;
    }

    const result = await closeCashBoxAPI(
      activeCashBox.id,
      amount,
      "Admin",
      closingNotes,
    );

    if (result) {
      // Guardar datos para el modal de impresión incluyendo datos de la caja
      setCloseData({
        ...result,
        cashBoxData: {
          opened_at: activeCashBox.opened_at,
          opened_by: activeCashBox.opened_by,
        },
      });
      setSavedClosingNotes(closingNotes); // Guardar las notas para usarlas en el PDF
      setShowCloseModal(false);
      setShowClosePrintModal(true);

      success("Caja cerrada exitosamente");
      setClosingAmount("");
      setClosingNotes("");
      await loadCashBoxData();
    }
  };

  const handlePrintCloseTicket = async () => {
    if (!closeData) return;
    await printCashBoxClose(closeData, "ticket", savedClosingNotes);
  };

  const handlePrintClosePDF = async () => {
    if (!closeData) return;

    try {
      const dataWithNotes = {
        ...closeData,
        notes: savedClosingNotes, // Usar las notas guardadas
      };
      const filepath = await window.api.generateClosingPDF(dataWithNotes);
      success("PDF de cuadre generado y abierto");
      console.log("PDF generado en:", filepath);
    } catch (error) {
      showError("Error generando PDF de cuadre");
      console.error(error);
    }
  };

  const printCashBoxClose = async (
    closeData: any,
    format: "ticket" | "pdf",
    notes: string = "",
  ) => {
    const openedAt = new Date(closeData.cashBoxData.opened_at);
    const closedAt = new Date();

    if (format === "ticket") {
      let ticketText = "\n";
      ticketText += "================================\n";
      ticketText += "       CUADRE DE CAJA          \n";
      ticketText += "================================\n";
      ticketText += `Apertura: ${openedAt.toLocaleString("es-ES")}\n`;
      ticketText += `Cierre:   ${closedAt.toLocaleString("es-ES")}\n`;
      ticketText += `Cajero: ${closeData.cashBoxData.opened_by}\n`;
      ticketText += `ID Caja: #${closeData.cashBoxId}\n`;
      ticketText += "--------------------------------\n";
      ticketText += `Monto Apertura:  ${formatCurrency(closeData.openingAmount)}\n`;
      ticketText += `Total Ventas:    ${formatCurrency(closeData.salesTotal)}\n`;
      ticketText += `Total Gastos:   -${formatCurrency(closeData.expensesTotal)}\n`;
      ticketText += "--------------------------------\n";
      ticketText += `Esperado:        ${formatCurrency(closeData.expectedAmount)}\n`;
      ticketText += `Contado:         ${formatCurrency(closeData.closingAmount)}\n`;
      ticketText += "--------------------------------\n";

      const diffColor = closeData.difference >= 0 ? "+" : "";
      ticketText += `Diferencia:      ${diffColor}${formatCurrency(closeData.difference)}\n`;

      if (Math.abs(closeData.difference) >= 0.005) {
        ticketText +=
          closeData.difference > 0 ? "(SOBRANTE)\n" : "(FALTANTE)\n";
      } else {
        ticketText += "(CUADRADO)\n";
      }

      ticketText += "================================\n";
      ticketText += `Ventas realizadas: ${sales.length}\n`;
      ticketText += "================================\n";

      if (notes) {
        ticketText += `Notas: ${notes}\n`;
        ticketText += "================================\n";
      }

      ticketText += "\n";
      ticketText += "Firmas:\n";
      ticketText += "\n";
      ticketText += `Cajero: ${closeData.cashBoxData.opened_by}\n`;
      ticketText += "_______________________\n";
      ticketText += "\n";
      ticketText += "Supervisor:\n";
      ticketText += "_______________________\n";
      ticketText += "\n\n";

      console.log("Imprimiendo cuadre (ticket):", ticketText);
      success("Ticket de cuadre generado");
      // TODO: Integrar con impresora térmica real
    } else {
      // Formato PDF
      console.log("Generando PDF de cuadre...");
      success("PDF de cuadre generado");
      // TODO: Implementar generación de PDF
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalExpenses = movements
    .filter((m) => m.type === "expense")
    .reduce((sum, m) => sum + Math.abs(m.amount), 0);
  const currentBalance = activeCashBox
    ? activeCashBox.opening_amount + totalSales - totalExpenses
    : 0;

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Caja</h1>
        <div className="flex items-center gap-2">
          {activeCashBox ? (
            <div className="flex items-center gap-2 text-green-600">
              <Unlock className="w-5 h-5" />
              <span className="font-semibold">Caja Abierta</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <Lock className="w-5 h-5" />
              <span className="font-semibold">Caja Cerrada</span>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex gap-4">
        {/* Panel Izquierdo */}
        <div className="w-96 space-y-4">
          {/* Balance Actual */}
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-2">Balance Actual</div>
            <div className="text-4xl font-bold text-blue-600 mb-4">
              {formatCurrency(currentBalance)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Ventas</div>
                <div className="font-semibold text-green-600">
                  {formatCurrency(totalSales)}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Gastos</div>
                <div className="font-semibold text-red-600">
                  {formatCurrency(totalExpenses)}
                </div>
              </div>
            </div>
          </Card>

          {/* Apertura/Cierre */}
          {!activeCashBox ? (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Apertura de Caja</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Monto Inicial
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button onClick={handleOpenCashBox} className="w-full gap-2">
                  <Unlock className="w-4 h-4" />
                  Abrir Caja
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Registrar Gasto</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Monto
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Descripción
                    </label>
                    <Input
                      type="text"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      placeholder="Ej: Compra de insumos"
                    />
                  </div>
                  <Button
                    onClick={handleAddExpense}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <TrendingDown className="w-4 h-4" />
                    Registrar Gasto
                  </Button>
                </div>
              </Card>

              <Button
                onClick={() => setShowCloseModal(true)}
                variant="destructive"
                className="w-full gap-2"
              >
                <Lock className="w-4 h-4" />
                Cerrar Caja
              </Button>
            </>
          )}
        </div>

        {/* Historial de Movimientos */}
        <Card className="flex-1 p-6">
          <h3 className="font-semibold mb-4">Movimientos y Ventas</h3>
          <div className="space-y-2 overflow-auto max-h-[calc(100vh-250px)]">
            {!activeCashBox ? (
              <div className="text-center text-gray-400 py-8">
                No hay caja abierta
              </div>
            ) : (
              <>
                {/* Ventas */}
                {sales.map((sale) => (
                  <div
                    key={`sale-${sale.id}`}
                    className="flex items-center justify-between p-3 bg-green-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium">
                          Venta #{sale.id}{" "}
                          {sale.client_name && `- ${sale.client_name}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(sale.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      +{formatCurrency(sale.total)}
                    </div>
                  </div>
                ))}

                {/* Gastos */}
                {movements
                  .filter((m) => m.type === "expense")
                  .map((movement) => (
                    <div
                      key={`mov-${movement.id}`}
                      className="flex items-center justify-between p-3 bg-red-50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                          <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {movement.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(movement.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-red-600">
                        {formatCurrency(Math.abs(movement.amount))}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Cierre */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] p-6 border-0">
            <h2 className="text-2xl font-bold mb-4">Cerrar Caja</h2>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="text-sm text-gray-600">Monto Esperado</div>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(currentBalance)}
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Monto Contado (Real)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {closingAmount && (
                <div
                  className={`p-4 rounded-lg ${
                    parseFloat(closingAmount) - currentBalance >= 0
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <div className="text-sm text-gray-600">Diferencia</div>
                  <div
                    className={`text-2xl font-bold ${
                      parseFloat(closingAmount) - currentBalance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {parseFloat(closingAmount) - currentBalance >= 0 ? "+" : ""}
                    {formatCurrency(parseFloat(closingAmount) - currentBalance)}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notas{" "}
                  {Math.abs(
                    parseFloat(closingAmount || "0") - currentBalance,
                  ) >= 0.005 && closingAmount
                    ? "(Requerido)"
                    : "(Opcional)"}
                </label>
                <Input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Observaciones del cierre..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCloseModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCloseCashBox}
                disabled={!closingAmount}
                className="flex-1 gap-2"
              >
                <Printer className="w-4 h-4" />
                Cerrar e Imprimir
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Imprimir Ticket de Apertura */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Caja Aperturada</DialogTitle>
            <DialogDescription>
              La caja ha sido aperturada exitosamente
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 mb-2">
                ✓ Caja aperturada correctamente
              </p>
              <p className="text-lg font-bold text-green-900">
                Monto inicial:{" "}
                {formatCurrency(activeCashBox?.opening_amount || 0)}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPrintModal(false);
                setPendingCashBoxId(null);
              }}
              className="w-full sm:w-auto"
            >
              No Imprimir
            </Button>
            <Button
              onClick={handlePrintOpeningPDF}
              className="bg-purple-600 hover:bg-purple-700 gap-2 w-full sm:flex-1"
            >
              <Printer className="w-4 h-4" />
              Imprimir PDF
            </Button>
            <Button
              onClick={handlePrintOpeningTicket}
              className="bg-blue-600 hover:bg-blue-700 gap-2 w-full sm:flex-1"
            >
              <Printer className="w-4 h-4" />
              Imprimir Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Imprimir Ticket de Cierre */}
      <Dialog open={showClosePrintModal} onOpenChange={setShowClosePrintModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Caja Cerrada</DialogTitle>
            <DialogDescription>
              El cuadre de caja ha sido completado
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Monto Apertura:</span>
                <span className="font-semibold">
                  {formatCurrency(closeData?.openingAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Ventas:</span>
                <span className="font-semibold text-green-600">
                  +{formatCurrency(closeData?.salesTotal || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Gastos:</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(closeData?.expensesTotal || 0)}
                </span>
              </div>
              <div className="border-t border-slate-300 pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Esperado:</span>
                  <span className="font-semibold">
                    {formatCurrency(closeData?.expectedAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Contado:</span>
                  <span className="font-semibold">
                    {formatCurrency(closeData?.closingAmount || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                Math.abs(closeData?.difference || 0) < 0.005
                  ? "bg-green-50 border-green-200"
                  : closeData?.difference > 0
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
              }`}
            >
              <p className="text-sm font-medium mb-1">
                {Math.abs(closeData?.difference || 0) < 0.005
                  ? "✓ Caja Cuadrada"
                  : closeData?.difference > 0
                    ? "↑ Sobrante"
                    : "↓ Faltante"}
              </p>
              <p className="text-2xl font-bold">
                {closeData?.difference >= 0 ? "+" : ""}
                {formatCurrency(closeData?.difference || 0)}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowClosePrintModal(false);
                setCloseData(null);
                setSavedClosingNotes("");
              }}
              className="w-full sm:w-auto"
            >
              No Imprimir
            </Button>
            <Button
              onClick={handlePrintClosePDF}
              className="bg-purple-600 hover:bg-purple-700 gap-2 w-full sm:flex-1"
            >
              <Printer className="w-4 h-4" />
              Imprimir PDF
            </Button>
            <Button
              onClick={handlePrintCloseTicket}
              className="bg-blue-600 hover:bg-blue-700 gap-2 w-full sm:flex-1"
            >
              <Printer className="w-4 h-4" />
              Imprimir Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
