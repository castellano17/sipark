const fs = require('fs');
const content = fs.readFileSync('c:/Users/Esmir/Desktop/sipark/src-electron/database-pg.cjs', 'utf8');

// Extraer la función convertSqliteToPostgres
const match = content.match(/function convertSqliteToPostgres\(sql\) \{([\s\S]+?)\n\}/);
if (!match) {
    console.log("No se encontró la función");
    process.exit(1);
}

const functionBody = match[1];
const convertSqliteToPostgres = new Function('sql', functionBody + '\nreturn pgSql;');

const testSql = "SELECT CAST((julianday(cm.end_date) - julianday('now')) AS INTEGER) as days_remaining FROM client_memberships cm";
console.log("Original:", testSql);
console.log("Convertido:", convertSqliteToPostgres(testSql));
