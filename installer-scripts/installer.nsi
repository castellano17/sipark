# NSIS Script para SIPARK con PostgreSQL embebido
# Este script crea un instalador que incluye PostgreSQL portable

!include "MUI2.nsh"
!include "FileFunc.nsh"

# Definiciones
!define APP_NAME "SIPARK"
!define APP_VERSION "1.0.4"
!define APP_PUBLISHER "SIPARK"
!define APP_EXE "SIPARK.exe"
!define POSTGRES_VERSION "16.2"

# Configuración general
Name "${APP_NAME}"
OutFile "SIPARK-Setup-${APP_VERSION}.exe"
InstallDir "$PROGRAMFILES64\${APP_NAME}"
InstallDirRegKey HKLM "Software\${APP_NAME}" "Install_Dir"
RequestExecutionLevel admin

# Interfaz
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

# Páginas
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

# Idiomas
!insertmacro MUI_LANGUAGE "Spanish"

# Sección principal
Section "Aplicación Principal" SecMain
    SetOutPath "$INSTDIR"
    
    # Copiar archivos de la aplicación
    File /r "release\win-unpacked\*.*"
    
    # Crear accesos directos
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
    CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
    
    # Registro
    WriteRegStr HKLM "Software\${APP_NAME}" "Install_Dir" "$INSTDIR"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" '"$INSTDIR\uninstall.exe"'
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" 1
    WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

# Sección PostgreSQL
Section "PostgreSQL ${POSTGRES_VERSION}" SecPostgres
    DetailPrint "Instalando PostgreSQL Portable..."
    SetOutPath "$INSTDIR\postgresql"
    
    # Copiar binarios de PostgreSQL portable
    File /r "postgresql-portable\*.*"
    
    # Ejecutar script de inicialización
    DetailPrint "Inicializando base de datos..."
    nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -File "$INSTDIR\installer-scripts\install-postgres-portable.ps1" -InstallDir "$INSTDIR"'
    Pop $0
    
    ${If} $0 != 0
        MessageBox MB_OK|MB_ICONEXCLAMATION "Error al inicializar PostgreSQL. Código: $0"
    ${EndIf}
    
    # Configurar base de datos
    DetailPrint "Configurando base de datos..."
    nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -File "$INSTDIR\installer-scripts\setup-database.ps1" -InstallDir "$INSTDIR"'
    Pop $0
    
    ${If} $0 != 0
        MessageBox MB_OK|MB_ICONEXCLAMATION "Error al configurar la base de datos. Código: $0"
    ${EndIf}
SectionEnd

# Sección de servicio Windows
Section "Servicio PostgreSQL" SecService
    DetailPrint "Registrando servicio de PostgreSQL..."
    
    nsExec::ExecToLog '"$INSTDIR\postgresql\bin\pg_ctl.exe" register -N "SIPARK_PostgreSQL" -D "$INSTDIR\postgresql\data" -U "NT AUTHORITY\NetworkService"'
    Pop $0
    
    ${If} $0 == 0
        DetailPrint "Iniciando servicio..."
        nsExec::ExecToLog 'sc start SIPARK_PostgreSQL'
    ${Else}
        DetailPrint "Nota: El servicio no se pudo registrar automáticamente"
    ${EndIf}
SectionEnd

# Descripciones
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
    !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} "Archivos principales de la aplicación SIPARK"
    !insertmacro MUI_DESCRIPTION_TEXT ${SecPostgres} "Base de datos PostgreSQL portable (requerido)"
    !insertmacro MUI_DESCRIPTION_TEXT ${SecService} "Registrar PostgreSQL como servicio de Windows"
!insertmacro MUI_FUNCTION_DESCRIPTION_END

# Desinstalador
Section "Uninstall"
    # Detener servicio
    nsExec::ExecToLog 'sc stop SIPARK_PostgreSQL'
    nsExec::ExecToLog 'sc delete SIPARK_PostgreSQL'
    
    # Detener PostgreSQL
    nsExec::ExecToLog '"$INSTDIR\postgresql\bin\pg_ctl.exe" stop -D "$INSTDIR\postgresql\data"'
    
    # Eliminar archivos
    Delete "$INSTDIR\${APP_EXE}"
    Delete "$INSTDIR\uninstall.exe"
    RMDir /r "$INSTDIR"
    
    # Eliminar accesos directos
    Delete "$SMPROGRAMS\${APP_NAME}\*.*"
    RMDir "$SMPROGRAMS\${APP_NAME}"
    Delete "$DESKTOP\${APP_NAME}.lnk"
    
    # Eliminar registro
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
    DeleteRegKey HKLM "Software\${APP_NAME}"
SectionEnd
