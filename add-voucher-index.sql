-- Migración: Agregar índice case-insensitive para códigos de voucher
-- Ejecutar este script si ya tienes una base de datos existente

-- Crear índice funcional para búsquedas case-insensitive
CREATE INDEX IF NOT EXISTS idx_promotion_vouchers_code_upper 
ON promotion_vouchers(UPPER(code));

-- Verificar que el índice se creó correctamente
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'promotion_vouchers'
ORDER BY indexname;
