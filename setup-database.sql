-- Script para configurar PostgreSQL para SIPARK
-- Ejecutar como usuario postgres (superusuario)

-- Crear usuario
CREATE USER ludoteca_user WITH PASSWORD 'ludoteca2024';

-- Crear base de datos
CREATE DATABASE ludoteca_pos OWNER ludoteca_user;

-- Dar permisos al usuario
GRANT ALL PRIVILEGES ON DATABASE ludoteca_pos TO ludoteca_user;

-- Conectar a la base de datos y dar permisos en el schema public
\c ludoteca_pos
GRANT ALL ON SCHEMA public TO ludoteca_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ludoteca_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ludoteca_user;

-- Configurar permisos por defecto para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ludoteca_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ludoteca_user;

-- Mensaje de confirmación
\echo '✅ Base de datos ludoteca_pos creada correctamente'
\echo '✅ Usuario ludoteca_user configurado'
\echo '✅ Permisos otorgados'
\echo ''
\echo 'Ahora puedes ejecutar SIPARK'
