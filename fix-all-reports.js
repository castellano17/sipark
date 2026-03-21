const fs = require("fs");
const path = require("path");

const reportsDir = "src/components/reports";
const reports = fs.readdirSync(reportsDir).filter((f) => f.endsWith(".tsx"));


let totalFixed = 0;
const issues = [];

reports.forEach((file) => {
  const filePath = path.join(reportsDir, file);
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // 1. Buscar .toFixed() sin Number()
  const toFixedMatches = content.match(/(\w+\.\w+)\.toFixed\(/g);
  if (toFixedMatches) {
    toFixedMatches.forEach((match) => {
      const prop = match.replace(".toFixed(", "");
      // Si no tiene Number() antes
      const hasNumber = new RegExp(
        `Number\\(${prop.replace(/\./g, "\\.")}\\)\\.toFixed\\(`,
      ).test(content);
      if (!hasNumber && !content.includes(`(${prop})`)) {
        // Verificar si es una propiedad numérica de DB
        if (
          prop.match(
            /\.(price|total|amount|subtotal|discount|tax|payment|cost|revenue|balance|duration|percentage|avg_|sum_|count|growth)/,
          )
        ) {
          issues.push({ file, type: "toFixed sin Number()", prop });

          // Corregir
          const regex = new RegExp(
            `(${prop.replace(/\./g, "\\.")})\.toFixed\\(`,
            "g",
          );
          content = content.replace(regex, `Number($1).toFixed(`);
          modified = true;
        }
      }
    });
  }

  // 2. Buscar métodos de string en campos de fecha/timestamp
  const dateStringMethods = content.match(
    /\.(timestamp|date|created_at|updated_at|visit_date|event_date|start_time|end_time)\.(startsWith|includes|endsWith|substring|slice)\(/g,
  );
  if (dateStringMethods) {
    dateStringMethods.forEach((match) => {
      issues.push({ file, type: "Método de string en fecha", match });
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    totalFixed++;
  }
});


if (issues.length > 0) {

  const byType = {};
  issues.forEach((issue) => {
    if (!byType[issue.type]) byType[issue.type] = [];
    byType[issue.type].push(issue);
  });

  Object.keys(byType).forEach((type) => {
    const files = [...new Set(byType[type].map((i) => i.file))];
  });
}

