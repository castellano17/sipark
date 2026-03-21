const fs = require("fs");
const path = require("path");

const reportsDir = path.join(__dirname, "src/components/reports");

// Get all report files
const reportFiles = fs
  .readdirSync(reportsDir)
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => path.join(reportsDir, file));

  `\n📊 Analizando ${reportFiles.length} reportes para compatibilidad con PostgreSQL...\n`,
);

const issues = {
  toFixed: [],
  toLocaleString: [],
  dateOperations: [],
  stringMethods: [],
};

let totalFixed = 0;

reportFiles.forEach((filePath) => {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  let modified = content;
  let fileFixed = false;

  // Pattern 1: .toFixed() without Number() wrapper
  // Match patterns like: variable.toFixed(), obj.property.toFixed(), etc.
  const toFixedPattern = /(\w+(?:\.\w+)*?)\.toFixed\(/g;
  const matches = [...content.matchAll(toFixedPattern)];

  if (matches.length > 0) {
    matches.forEach((match) => {
      const variable = match[1];
      // Check if already wrapped with Number()
      const beforeMatch = content.substring(
        Math.max(0, match.index - 10),
        match.index,
      );
      if (!beforeMatch.includes("Number(")) {
        issues.toFixed.push({ file: fileName, variable });

        // Fix: wrap with Number()
        const regex = new RegExp(
          `(${variable.replace(/\./g, "\\.")})\.toFixed\\(`,
          "g",
        );
        modified = modified.replace(regex, "Number($1).toFixed(");
        fileFixed = true;
      }
    });
  }

  // Pattern 2: .toLocaleString() without Number() wrapper
  const toLocaleStringPattern = /(\w+(?:\.\w+)*?)\.toLocaleString\(/g;
  const localeMatches = [...content.matchAll(toLocaleStringPattern)];

  if (localeMatches.length > 0) {
    localeMatches.forEach((match) => {
      const variable = match[1];
      const beforeMatch = content.substring(
        Math.max(0, match.index - 10),
        match.index,
      );
      if (!beforeMatch.includes("Number(")) {
        issues.toLocaleString.push({ file: fileName, variable });

        // Fix: wrap with Number()
        const regex = new RegExp(
          `(${variable.replace(/\./g, "\\.")})\.toLocaleString\\(`,
          "g",
        );
        modified = modified.replace(regex, "Number($1).toLocaleString(");
        fileFixed = true;
      }
    });
  }

  // Pattern 3: Date string methods (.startsWith, .includes, .substring) on potential Date objects
  const dateStringMethods =
    /(\w+(?:\.\w+)*?)\.(startsWith|includes|substring)\(/g;
  const dateMatches = [...content.matchAll(dateStringMethods)];

  if (dateMatches.length > 0) {
    dateMatches.forEach((match) => {
      const variable = match[1];
      const method = match[2];
      // Check if it's likely a date field (contains 'date', 'time', 'timestamp')
      if (
        variable.toLowerCase().includes("date") ||
        variable.toLowerCase().includes("time") ||
        variable.toLowerCase().includes("timestamp")
      ) {
        const beforeMatch = content.substring(
          Math.max(0, match.index - 30),
          match.index,
        );
        if (
          !beforeMatch.includes("typeof") &&
          !beforeMatch.includes("String(")
        ) {
            `   ⚠️  Posible problema de fecha: ${variable}.${method}()`,
          );
          issues.dateOperations.push({ file: fileName, variable, method });
        }
      }
    });
  }

  // Write fixed content
  if (fileFixed) {
    fs.writeFileSync(filePath, modified, "utf8");
    totalFixed++;
  }
});


if (issues.toFixed.length > 0) {
}

if (issues.toLocaleString.length > 0) {
    `\n🔧 Problemas .toLocaleString() corregidos: ${issues.toLocaleString.length}`,
  );
}

if (issues.dateOperations.length > 0) {
    `\n⚠️  Posibles problemas de fecha detectados: ${issues.dateOperations.length}`,
  );
}

