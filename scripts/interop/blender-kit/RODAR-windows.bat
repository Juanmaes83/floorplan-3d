@echo off
rem RUBIK SOTA - Rodaje local con Blender Cycles (Windows) - par de rodar.sh
rem Doble clic (entrega recomendada 1440p, interior, dia) o desde esta carpeta:
rem   RODAR-windows.bat [revision^|entrega1440^|entrega4k] [interior^|aereo^|detalle^|balcon^|primerplano] [dia^|tarde] [fotogramas, p. ej. 0-11]
rem   revision = 1280x720 rapido - entrega1440 = 2560x1440 nativo (recomendado) - entrega4k = 3840x2160 nativo (opcional)
rem Prerrequisitos: Windows 10/11 de 64 bits, Blender 5.2.1 LTS o compatible (blender.org), conexion a dl.polyhaven.org la
rem primera vez (recursos CC0 verificados por SHA-256; sin red se conserva el color plano y se declara) y FFmpeg en el PATH
rem para montar el MP4 (opcional: sin FFmpeg quedan los fotogramas PNG). Reanudable; nunca borra nada.
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "PERFIL=%~1"
if "%PERFIL%"=="" set "PERFIL=entrega1440"
set "TOMA=%~2"
if "%TOMA%"=="" set "TOMA=interior"
set "LUZ=%~3"
if "%LUZ%"=="" set "LUZ=dia"
set "FR=%~4"
if /i not "%PERFIL%"=="revision" if /i not "%PERFIL%"=="entrega1440" if /i not "%PERFIL%"=="entrega4k" (
  echo Perfil desconocido / unknown profile: %PERFIL% ^(revision, entrega1440, entrega4k^)
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

if not exist "escena-preparada\scene.blend" (
  echo 1/4 - Preparando la escena / preparing the scene...
  "%BL%" --background --factory-startup --python-exit-code 1 --python rubik_blender_prepare.py -- . escena-preparada
  if errorlevel 1 ( echo La preparacion fallo: descarga de nuevo la escena desde RUBIK. & goto :fin_error )
)

set "SALIDA=resultados\rodaje-%PERFIL%-%TOMA%-%LUZ%"
if not exist "resultados" mkdir "resultados"
set "FRARG="
if not "%FR%"=="" set "FRARG=--frames %FR%"
echo 2-3/4 - Recursos y rodaje ^(%PERFIL%, %TOMA%, %LUZ%^) / assets and shoot...
"%BL%" --background --factory-startup --python-exit-code 1 --python rubik_blender_rodaje.py -- escena-preparada . "%SALIDA%" --profile %PERFIL% --shot %TOMA% --light %LUZ% --tex rodaje-texturas --fetch %FRARG%
if errorlevel 1 ( echo El rodaje se detuvo. Vuelve a lanzarlo: continua por el primer fotograma que falte. & goto :fin_error )

where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo 4/4 - FFmpeg no esta instalado: los fotogramas estan en %SALIDA%\frames ^(montalos a 24 fps^).
) else (
  echo 4/4 - Montando el MP4 / building the MP4...
  ffmpeg -y -loglevel error -framerate 24 -i "%SALIDA%\frames\f%%04d.png" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart "%SALIDA%\rodaje.mp4"
  if errorlevel 1 ( echo El montaje del MP4 fallo; los fotogramas siguen en %SALIDA%\frames. & goto :fin_error )
  echo Listo / Done: %SALIDA%\rodaje.mp4
)
echo Informe / report: %SALIDA%\rodaje-report.json ^(equipo, tiempos, acabados y aproximaciones^). Abrelo en RUBIK - Entregar.
pause
exit /b 0

:fin_error
echo.
echo Tu proyecto de RUBIK no ha cambiado. Corrige lo indicado y vuelve a lanzar: continuara donde se quedo.
echo Your RUBIK project is unchanged. Fix the above and run again: it resumes where it stopped.
pause
exit /b 1
