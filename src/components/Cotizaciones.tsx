import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileText, Construction } from "lucide-react";

export const Cotizaciones: React.FC = () => {
  return (
    <div className="flex flex-col h-full gap-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cotizaciones</h1>
          <p className="text-slate-600 mt-1">
            Gestión de cotizaciones y presupuestos
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md w-full shadow-lg border-none">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <FileText className="w-20 h-20 text-purple-500" />
                <Construction className="w-10 h-10 text-orange-500 absolute -bottom-2 -right-2" />
              </div>
            </div>
            <CardTitle className="text-2xl">Módulo en Construcción</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 mb-4">
              El módulo de Cotizaciones está actualmente en desarrollo.
            </p>
            <p className="text-sm text-slate-500">
              Pronto podrás crear, gestionar y enviar cotizaciones a tus
              clientes desde aquí.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
