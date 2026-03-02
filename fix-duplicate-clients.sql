-- Script para eliminar clientes duplicados
-- Mantiene el cliente más antiguo (menor ID) y elimina los duplicados

-- Ver duplicados antes de eliminar
SELECT name, phone, COUNT(*) as cantidad
FROM clients
GROUP BY name, phone
HAVING COUNT(*) > 1;

-- Eliminar duplicados manteniendo el registro más antiguo
DELETE FROM clients
WHERE id NOT IN (
  SELECT MIN(id)
  FROM clients
  GROUP BY name, phone
);

-- Verificar que no queden duplicados
SELECT name, phone, COUNT(*) as cantidad
FROM clients
GROUP BY name, phone
HAVING COUNT(*) > 1;
