import { useNotification } from "./useNotification";
import { useCurrency } from "./useCurrency";
import * as XLSX from "xlsx";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  format?: "currency" | "date" | "datetime" | "number" | "text";
}

interface ExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ExportColumn[];
  data: any[];
  summary?: Array<{ label: string; value: string | number }>;
}

export function useReportExport() {
  const { success, error } = useNotification();
  const { formatCurrency } = useCurrency();

  const formatValue = (value: any, format?: string): string => {
    if (value === null || value === undefined) return "-";

    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "date":
        return new Date(value).toLocaleDateString("es-ES");
      case "datetime":
        return new Date(value).toLocaleString("es-ES");
      case "number":
        return value.toLocaleString("es-ES");
      default:
        return String(value);
    }
  };

  const exportToExcel = (options: ExportOptions) => {
    try {
      // Preparar datos
      const worksheetData = options.data.map((row) =>
        options.columns.reduce((acc, col) => {
          acc[col.header] = formatValue(row[col.key], col.format);
          return acc;
        }, {} as any),
      );

      // Agregar resumen al final si existe
      if (options.summary && options.summary.length > 0) {
        worksheetData.push({});
        options.summary.forEach((item) => {
          const summaryRow: any = {};
          summaryRow[options.columns[0].header] = item.label;
          summaryRow[options.columns[options.columns.length - 1].header] =
            typeof item.value === "number"
              ? formatCurrency(item.value)
              : item.value;
          worksheetData.push(summaryRow);
        });
      }

      // Crear workbook
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

      // Ajustar anchos de columna
      const columnWidths = options.columns.map((col) => ({
        wch: col.width || 15,
      }));
      worksheet["!cols"] = columnWidths;

      // Descargar archivo
      XLSX.writeFile(workbook, `${options.filename}.xlsx`);
      success("Reporte exportado a Excel");
    } catch (err) {
      console.error("Error exportando a Excel:", err);
      error("Error al exportar a Excel");
    }
  };

  const exportToPDF = async (options: ExportOptions) => {
    try {
      // Delegar la generación del PDF al main context (Electron)
      await (window as any).api.exportPDF(options);
      success("Reporte exportado a PDF");
    } catch (err) {
      console.error("Error exportando a PDF:", err);
      error("Error al exportar a PDF");
    }
  };

  const printReport = (options: ExportOptions) => {
    try {
      // Crear contenido HTML para imprimir
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${options.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              text-align: center;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .subtitle {
              text-align: center;
              color: #6b7280;
              margin-bottom: 20px;
            }
            .generated {
              text-align: right;
              color: #9ca3af;
              font-size: 12px;
              margin-bottom: 20px;
            }
            .summary {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .summary h3 {
              margin-top: 0;
              color: #374151;
            }
            .summary-item {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .summary-item:last-child {
              border-bottom: none;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #3b82f6;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>${options.title}</h1>
          ${options.subtitle ? `<div class="subtitle">${options.subtitle}</div>` : ""}
          <div class="generated">Generado: ${new Date().toLocaleString("es-ES")}</div>
      `;

      // Agregar resumen
      if (options.summary && options.summary.length > 0) {
        html += `
          <div class="summary">
            <h3>Resumen</h3>
        `;
        options.summary.forEach((item) => {
          const valueText =
            typeof item.value === "number"
              ? formatCurrency(item.value)
              : String(item.value);
          html += `
            <div class="summary-item">
              <span>${item.label}</span>
              <strong>${valueText}</strong>
            </div>
          `;
        });
        html += `</div>`;
      }

      // Agregar tabla
      html += `
        <table>
          <thead>
            <tr>
              ${options.columns.map((col) => `<th>${col.header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
      `;

      options.data.forEach((row) => {
        html += "<tr>";
        options.columns.forEach((col) => {
          html += `<td>${formatValue(row[col.key], col.format)}</td>`;
        });
        html += "</tr>";
      });

      html += `
          </tbody>
        </table>
        </body>
        </html>
      `;

      // Abrir ventana de impresión
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } catch (err) {
      console.error("Error imprimiendo reporte:", err);
      error("Error al imprimir reporte");
    }
  };

  return {
    exportToExcel,
    exportToPDF,
    printReport,
  };
}
