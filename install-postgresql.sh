#!/bin/bash

# Script de instalación y configuración de PostgreSQL para Ludoteca POS
# Compatible con Ubuntu/Debian

set -e

echo "🚀 Instalación de PostgreSQL para Ludoteca POS"
echo "=============================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Este script debe ejecutarse como root (sudo)${NC}"
  exit 1
fi

# Obtener IP del servidor
SERVER_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}📡 IP del servidor detectada: $SERVER_IP${NC}"
echo ""

# Solicitar datos
read -p "Nombre de la base de datos [ludoteca_pos]: " DB_NAME
DB_NAME=${DB_NAME:-ludoteca_pos}

read -p "Usuario de la base de datos [ludoteca_user]: " DB_USER
DB_USER=${DB_USER:-ludoteca_user}

read -sp "Password para el usuario (dejar vacío para generar): " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
  DB_PASSWORD=$(openssl rand -base64 12)
  echo -e "${YELLOW}🔐 Password generado: $DB_PASSWORD${NC}"
fi

read -p "Rango de red local [192.168.1.0/24]: " NETWORK_RANGE
NETWORK_RANGE=${NETWORK_RANGE:-192.168.1.0/24}

echo ""
echo "📋 Configuración:"
echo "  - Base de datos: $DB_NAME"
echo "  - Usuario: $DB_USER"
echo "  - Password: $DB_PASSWORD"
echo "  - Red permitida: $NETWORK_RANGE"
echo ""
read -p "¿Continuar? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
  echo "❌ Instalación cancelada"
  exit 0
fi

echo ""
echo "📦 Instalando PostgreSQL..."
apt update
apt install -y postgresql postgresql-contrib

echo ""
echo "🔧 Configurando PostgreSQL..."

# Detectar versión de PostgreSQL
PG_VERSION=$(ls /etc/postgresql/ | head -n 1)
PG_CONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

# Backup de archivos originales
cp "$PG_CONF" "$PG_CONF.backup"
cp "$PG_HBA" "$PG_HBA.backup"

# Configurar listen_addresses
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"

# Agregar regla de acceso remoto
echo "" >> "$PG_HBA"
echo "# Ludoteca POS - Acceso desde red local" >> "$PG_HBA"
echo "host    all             all             $NETWORK_RANGE            md5" >> "$PG_HBA"

echo ""
echo "🗄️ Creando base de datos y usuario..."

# Crear base de datos y usuario
sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

echo ""
echo "🔥 Configurando firewall..."
ufw allow 5432/tcp
ufw reload

echo ""
echo "🔄 Reiniciando PostgreSQL..."
systemctl restart postgresql
systemctl enable postgresql

echo ""
echo "✅ Instalación completada!"
echo ""
echo "📝 Información importante:"
echo "=========================="
echo ""
echo "IP del servidor: $SERVER_IP"
echo "Puerto: 5432"
echo "Base de datos: $DB_NAME"
echo "Usuario: $DB_USER"
echo "Password: $DB_PASSWORD"
echo ""
echo "🔧 Próximos pasos:"
echo "=================="
echo ""
echo "1. En cada computadora cliente, crear el archivo db-config.json:"
echo ""
echo "   {" 
echo "     \"host\": \"$SERVER_IP\","
echo "     \"port\": 5432,"
echo "     \"database\": \"$DB_NAME\","
echo "     \"user\": \"$DB_USER\","
echo "     \"password\": \"$DB_PASSWORD\""
echo "   }"
echo ""
echo "2. Instalar dependencia: npm install pg"
echo ""
echo "3. Modificar electron-main.ts para usar database-pg.cjs"
echo ""
echo "4. Ejecutar: npm run dev"
echo ""
echo "🧪 Probar conexión desde cliente:"
echo "================================="
echo ""
echo "   psql -U $DB_USER -d $DB_NAME -h $SERVER_IP"
echo ""
echo "⚠️  IMPORTANTE: Guarda esta información en un lugar seguro!"
echo ""

# Guardar configuración en archivo
cat > /root/ludoteca-db-config.txt <<EOF
Configuración de PostgreSQL - Ludoteca POS
==========================================

Fecha: $(date)
IP del servidor: $SERVER_IP
Puerto: 5432
Base de datos: $DB_NAME
Usuario: $DB_USER
Password: $DB_PASSWORD
Red permitida: $NETWORK_RANGE

Archivos de configuración:
- postgresql.conf: $PG_CONF
- pg_hba.conf: $PG_HBA

Backups:
- $PG_CONF.backup
- $PG_HBA.backup
EOF

echo "💾 Configuración guardada en: /root/ludoteca-db-config.txt"
echo ""
echo "🎉 ¡Listo! PostgreSQL está configurado y listo para usar."
