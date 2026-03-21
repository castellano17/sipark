const fs = require("fs");

const filePath = "src-electron/api.cjs";
let content = fs.readFileSync(filePath, "utf8");


// Reemplazar todas las referencias a u.full_name con CONCAT
const replacements = [
  {
    name: "UserActivity - GROUP BY con full_name",
    old: `      GROUP BY ual.user_id, u.username, u.full_name, u.role`,
    new: `      GROUP BY ual.user_id, u.username, u.first_name, u.last_name, u.role`,
  },
  {
    name: "SystemAccess - GROUP BY con full_name",
    old: `      GROUP BY ual.user_id, u.username, u.full_name, u.role`,
    new: `      GROUP BY ual.user_id, u.username, u.first_name, u.last_name, u.role`,
  },
  {
    name: "SalesAudit - GROUP BY con full_name",
    old: `      GROUP BY sa.user_id, u.username, u.full_name, u.role`,
    new: `      GROUP BY sa.user_id, u.username, u.first_name, u.last_name, u.role`,
  },
];

let fixedCount = 0;

replacements.forEach((fix) => {
  const occurrences = (
    content.match(
      new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    ) || []
  ).length;

  if (occurrences > 0) {
    content = content.replace(
      new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      fix.new,
    );
    fixedCount += occurrences;
  } else {
  }
});

fs.writeFileSync(filePath, content, "utf8");

