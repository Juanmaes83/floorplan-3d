@echo off
rem RUBIK SOTA - Render con Blender (Windows) - M03
rem Doble clic, o desde esta carpeta:  RENDERIZAR-windows.bat [review|preview|delivery]
rem 1) prepara la escena, 2) renderiza con Cycles, 3) verifica que la escena se reabre igual.
rem Si se interrumpe, vuelve a lanzarlo: continua donde se quedo. Nunca borra nada.
rem Blender: variable BLENDER=C:\ruta\blender.exe, o la instalacion estandar en Program Files.
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "PERFIL=%~1"
if "%PERFIL%"=="" set "PERFIL=review"
if /i not "%PERFIL%"=="review" if /i not "%PERFIL%"=="preview" if /i not "%PERFIL%"=="delivery" (
  echo Perfil desconocido / unknown profile: %PERFIL% ^(preview, review, delivery^)
  goto :fin_error
)

set "BL=%BLENDER%"
if "%BL%"=="" (
  for /f "delims=" %%B in ('where blender 2^>nul') do if "!BL!"=="" set "BL=%%B"
)
if "%BL%"=="" (
  for /d %%D in ("%ProgramFiles%\Blender Foundation\Blender*") do if exist "%%D\blender.exe" set "BL=%%D\blender.exe"
)
if "%BL%"=="" (
  echo No se encuentra Blender. Instalalo ^(blender.org, gratuito^) o indica su ruta con la variable BLENDER.
  echo Blender not found. Install it ^(blender.org, free^) or set the BLENDER variable to blender.exe.
  goto :fin_error
)
echo Blender: %BL%

rem 1 - Preparacion (una vez). Una preparacion interrumpida se aparta, nunca se borra.
set "PREPARADA=0"
if exist "escena-preparada\scene.blend" if exist "escena-preparada\import-report.json" set "PREPARADA=1"
if "%PREPARADA%"=="0" (
  if exist "escena-preparada" (
    set "APARTE=escena-preparada.incompleta-%RANDOM%%RANDOM%"
    ren "escena-preparada" "!APARTE!"
    echo Preparacion incompleta apartada en / moved to: !APARTE!
  )
  echo 1/3 - Preparando la escena / preparing the scene...
  "%BL%" --background --factory-startup --python-exit-code 1 --python rubik_blender_prepare.py -- . escena-preparada
  if errorlevel 1 ( echo La preparacion fallo: descarga de nuevo la escena desde RUBIK. & goto :fin_error )
) else (
  echo 1/3 - Escena ya preparada / scene already prepared
)

rem 2 - Render (reanudable).
set "SALIDA=resultados\%PERFIL%"
if not exist "resultados" mkdir "resultados"
echo 2/3 - Renderizando con Cycles ^(perfil %PERFIL%^) / rendering with Cycles...
"%BL%" --background --factory-startup --python-exit-code 1 --python rubik_blender_render.py -- escena-preparada . "%SALIDA%" --profile %PERFIL%
if errorlevel 1 ( echo El render se detuvo. Vuelve a lanzarlo para continuar / render stopped: run again to resume. & goto :fin_error )

rem 3 - Verificacion de reapertura en un proceso nuevo.
if not exist "escena-preparada\verificacion-reapertura.json" (
  echo 3/3 - Verificando que la escena se reabre igual / verifying the scene reopens identically...
  "%BL%" --background --factory-startup --python-exit-code 1 --python rubik_blender_verify.py -- escena-preparada escena-preparada\verificacion-reapertura.json
  if errorlevel 1 ( echo La escena guardada no se reabre igual. & goto :fin_error )
)
copy /y "escena-preparada\verificacion-reapertura.json" "%SALIDA%\verificacion-reapertura.json" >nul 2>nul

echo.
echo Listo / Done: %SALIDA%
echo Siguiente paso: en RUBIK - Entregar - Escena para Blender - "Revisar render...", elige manifest.json del ZIP original y luego la carpeta %SALIDA%.
echo Next step: in RUBIK - Deliver - Scene for Blender - "Review render...", choose manifest.json from the original ZIP, then the folder %SALIDA%.
pause
exit /b 0

:fin_error
echo.
echo Tu proyecto de RUBIK no ha cambiado. Corrige lo indicado y vuelve a lanzar: continuara donde se quedo.
echo Your RUBIK project is unchanged. Fix the above and run again: it resumes where it stopped.
pause
exit /b 1
