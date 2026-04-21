import { useState, useEffect } from "react";
import { X, DollarSign, CreditCard, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { useCurrency } from "../hooks/useCurrency";
import type { CurrentSale, PaymentDetails } from "../types";

interface PaymentModalProps {
  sale: CurrentSale;
  onClose: () => void;
  onConfirm: (payment: PaymentDetails) => void;
}

export function PaymentModal({ sale, onClose, onConfirm }: PaymentModalProps) {
  const { formatCurrency } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer"
  >("cash");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [reference, setReference] = useState("");

  const change =
    paymentMethod === "cash"
      ? Math.max(0, parseFloat(amountReceived || "0") - sale.total)
      : 0;

  const canConfirm = () => {
    if (paymentMethod === "cash") {
      // Permitir confirmar sin monto recibido (se usará el total)
      const received = parseFloat(amountReceived || "0");
      return received === 0 || received >= sale.total;
    }
    if (paymentMethod === "card" || paymentMethod === "transfer") {
      return reference.trim().length > 0;
    }
    return false;
  };

  const handleConfirm = () => {
    // Si no se ingresó monto recibido, usar el total exacto
    const receivedAmount = amountReceived.trim() === "" || parseFloat(amountReceived) === 0
      ? sale.total
      : parseFloat(amountReceived);

    const payment: PaymentDetails = {
      method: paymentMethod,
      amount_received: paymentMethod === "cash" ? receivedAmount : sale.total,
      change: paymentMethod === "cash" ? Math.max(0, receivedAmount - sale.total) : 0,
      reference: reference || undefined,
    };
    onConfirm(payment);
  };

  // Manejar tecla Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && canConfirm()) {
        e.preventDefault();
        handleConfirm();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paymentMethod, amountReceived, reference, sale.total]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-xl p-6 border-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Procesar Pago</h2>
          <Button
                        className="h-8 w-8 p-0" variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Total a Pagar */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-gray-600 mb-1">Total a Pagar</div>
          <div className="text-4xl font-bold text-blue-600">
            {formatCurrency(sale.total)}
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-3 block">
            Método de Pago
          </label>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={paymentMethod === "cash" ? "default" : "outline"}
              onClick={() => setPaymentMethod("cash")}
              className="h-20 flex flex-col gap-2"
            >
              <DollarSign className="w-6 h-6" />
              <span>Efectivo</span>
            </Button>
            <Button
              variant={paymentMethod === "card" ? "default" : "outline"}
              onClick={() => setPaymentMethod("card")}
              className="h-20 flex flex-col gap-2"
            >
              <CreditCard className="w-6 h-6" />
              <span>Tarjeta</span>
            </Button>
            <Button
              variant={paymentMethod === "transfer" ? "default" : "outline"}
              onClick={() => setPaymentMethod("transfer")}
              className="h-20 flex flex-col gap-2"
            >
              <Smartphone className="w-6 h-6" />
              <span>Transferencia</span>
            </Button>
          </div>
        </div>

        {/* Campos según método */}
        {paymentMethod === "cash" && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Monto Recibido
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="text-xl"
                  placeholder={sale.total.toFixed(2)}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dejar vacío si el cliente paga el monto exacto
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg flex flex-col justify-center">
                <div className="text-sm text-gray-600 mb-1">Cambio</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(change)}
                </div>
              </div>
            </div>
          </div>
        )}

        {(paymentMethod === "card" || paymentMethod === "transfer") && (
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              {paymentMethod === "card"
                ? "Número de Autorización"
                : "Referencia"}
            </label>
            <Input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={
                paymentMethod === "card" ? "Ej: 123456" : "Ej: REF-001"
              }
              autoFocus
            />
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1" title="Cancelar (ESC)">
            Cancelar
            <span className="ml-2 text-xs opacity-50">ESC</span>
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            className="flex-1 relative"
            title="Confirmar pago (Enter)"
          >
            Confirmar Pago
            <span className="ml-2 text-xs opacity-70">↵</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
