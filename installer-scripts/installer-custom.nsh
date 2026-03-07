# Script NSIS personalizado para SIPARK
# Se ejecuta durante la instalación para configurar PostgreSQL

!macro customInstall
  DetailPrint "Configurando PostgreSQL para SIPARK..."
  
  # Inicializar PostgreSQL
  nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "& \"$INSTDIR\resources\installer-scripts\install-postgres-portable.ps1\" -InstallDir \"$INSTDIR\resources\""'
  Pop $0
  
  ${If} $0 != 0
    DetailPrint "Advertencia: Error al inicializar PostgreSQL (código: $0)"
  ${Else}
    DetailPrint "PostgreSQL inicializado correctamente"
  ${EndIf}
  
  # Configurar base de datos
  nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "& \"$INSTDIR\resources\installer-scripts\setup-database.ps1\" -InstallDir \"$INSTDIR\resources\""'
  Pop $0
  
  ${If} $0 != 0
    DetailPrint "Advertencia: Error al configurar base de datos (código: $0)"
  ${Else}
    DetailPrint "Base de datos configurada correctamente"
  ${EndIf}
!macroend

!macro customUnInstall
  DetailPrint "Deteniendo PostgreSQL..."
  
  # Detener PostgreSQL
  nsExec::ExecToLog '"$INSTDIR\resources\postgresql\bin\pg_ctl.exe" stop -D "$INSTDIR\resources\postgresql\data" -m fast'
  
  # Preguntar si desea eliminar los datos
  MessageBox MB_YESNO "¿Desea eliminar también los datos de la base de datos?" IDYES removeData IDNO keepData
  
  removeData:
    DetailPrint "Eliminando datos de PostgreSQL..."
    RMDir /r "$INSTDIR\resources\postgresql\data"
    Goto done
  
  keepData:
    DetailPrint "Conservando datos de PostgreSQL"
  
  done:
!macroend
