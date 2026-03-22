import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCurrency } from "../../hooks/useCurrency";
import { useReportExport } from "../../hooks/useReportExport";
import { FileDown, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10b981", "#ef4444"];

interface IncomeVsExpensesProps {
  onBack: () => void;
}

export default function IncomeVsExpenses({ onBack }: IncomeVsExpensesProps) {
  const { formatCurrency } = useCurrency();
  const { exportToExcel } = useReportExport();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await (window.api as any).getIncomeVsExpenses(
        startDate,
        endDate,
      );
      setReportData(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading && !reportData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      </div>
    );
  }

  const pieData = reportData
    ? [
        { name: "Ingresos", value: reportData.income },
        { name: "Gastos", value: reportData.expenses },
      ]
    : [];

  const barData = reportData
    ? [
        {
          name: "Financiero",
          Ingresos: reportData.income,
          Gastos: reportData.expenses,
          Utilidad: reportData.netProfit,
        },
      ]
    : [];

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">💰 Ingresos vs Gastos</h1>
            <p className="text-sm text-gray-600">
              Análisis financiero del período
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Fecha Inicio
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={loadReport} disabled={loading} className="w-full">
              {loading ? "Cargando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      </Card>

      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <p className="text-xs font-medium text-green-700 mb-2">
                Ingresos
              </p>
              <p className="text-lg font-bold text-green-900 break-words">
                {formatCurrency(reportData.income)}
              </p>
              <TrendingUp className="w-4 h-4 text-green-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
              <p className="text-xs font-medium text-red-700 mb-2">Gastos</p>
              <p className="text-lg font-bold text-red-900 break-words">
                {formatCurrency(reportData.expenses)}
              </p>
              <TrendingDown className="w-4 h-4 text-red-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Utilidad Neta
              </p>
              <p
                className={`text-lg font-bold break-words ${reportData.netProfit >= 0 ? "text-blue-900" : "text-red-900"}`}
              >
                {formatCurrency(reportData.netProfit)}
              </p>
              <DollarSign className="w-4 h-4 text-blue-500 mt-2" />
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-2">
                Margen de Utilidad
              </p>
              <p
                className={`text-lg font-bold ${parseFloat(reportData.profitMargin) >= 0 ? "text-purple-900" : "text-red-900"}`}
              >
                {reportData.profitMargin}%
              </p>
              <TrendingUp className="w-4 h-4 text-purple-500 mt-2" />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Distribución</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) =>
                      `${entry.name}: ${formatCurrency(entry.value)}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Comparativo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    labelStyle={{ color: "#000" }}
                  />
                  <Legend />
                  <Bar dataKey="Ingresos" fill="#10b981" />
                  <Bar dataKey="Gastos" fill="#ef4444" />
                  <Bar dataKey="Utilidad" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Resumen Financiero</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportToExcel({
                    title: "Ingresos vs Gastos",
                    subtitle: `Del ${startDate} al ${endDate}`,
                    filename: `ingresos-gastos-${startDate}-${endDate}`,
                    columns: [
                      { header: "Concepto", key: "concept", width: 30 },
                      {
                        header: "Monto",
                        key: "amount",
                        format: "currency",
                        width: 20,
                      },
                    ],
                    data: [
                      { concept: "Ingresos", amount: reportData.income },
                      { concept: "Gastos", amount: reportData.expenses },
                      {
                        concept: "Utilidad Neta",
                        amount: reportData.netProfit,
                      },
                      {
                        concept: "Margen de Utilidad",
                        amount: reportData.profitMargin + "%",
                      },
                    ],
                  });
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-green-50 rounded">
                <span className="font-medium">Ingresos</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(reportData.income)}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-red-50 rounded">
                <span className="font-medium">Gastos</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(reportData.expenses)}
                </span>
              </div>
              <div
                className={`flex justify-between p-3 rounded ${reportData.netProfit >= 0 ? "bg-blue-50" : "bg-red-50"}`}
              >
                <span className="font-medium">Utilidad Neta</span>
                <span
                  className={`font-bold ${reportData.netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}
                >
                  {formatCurrency(reportData.netProfit)}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-purple-50 rounded">
                <span className="font-medium">Margen de Utilidad</span>
                <span className="font-bold text-purple-600">
                  {reportData.profitMargin}%
                </span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
