# Paso 8 · «Desde el paisaje» · montaje de la demo y previa de emplazamiento · código `377478439` · **EMPLAZAMIENTO RECHAZADO**

## Montaje (sonda `sonda-montar-demo-paisaje.cjs`, código de salida 0, `sonda-montaje.log`)
- Vivienda ficticia de RUBIK (el ejemplo) como «Proyecto de demostración sobre entorno real», parcela rústica 11039A02800004,
  norte 180°, ancla de la huella en el punto elegido el 27/11, cota cero = MDT05 en el ancla (133,744 m), procedencia del terreno declarada.
- Terreno MDT05 y ortofoto PNOA **en vivo**. Parcela: Catastro devolvió «Ha superado el límite de peticiones por hora» (403); la sonda
  sirvió la respuesta WFS real guardada el 27/11 22:17 para esa misma referencia (`WFS_REPLAY`). Declarado aquí.
- Entregar › Escena para Blender: `ready`, nota con atribución MDT05/PNOA y «La parcela catastral se queda en RUBIK» (`entregar-escena-entorno.png`).
- ZIP: 21 ficheros con `rubik-entorno.json` (1147 vértices) y `rubik-ortofoto.jpg`; `parcel.exported=false`, sin referencia ni geometría
  catastral (`entorno-resumen.json`).

## Comprobación suelo / terreno / puerta (antes del render)
- Bajo la huella, el terreno va de **−4,12 m a +3,97 m** respecto al suelo de la vivienda; en la puerta está **2,32 m por encima** (enterrada);
  hacia fuera baja a 1,43 m a 9 m. Ladera: cotas del entorno −84,8…+21,6 m.
- Búsqueda en todo el MDT05 descargado (desplazamientos cada 3–4 m, giros 0/90/180/270°): la mejor posición deja **1,36 m** de desnivel en
  la huella. Ninguna colocación evita que quede enterrada o flotando.
- Previa ligera (código de salida 0, 50 fotogramas, `previa-2fps.mp4`, `hoja-contactos.jpg`): confirma la vivienda en ladera, la cámara
  atravesando terreno y casa en el acceso (planos oscuros) y la vivienda **sin techo vista desde fuera**.

## Decisión (criterio de Juanma: no alterar el terreno real)
- Este emplazamiento se descarta. Siguiente: elegir un sitio llano (desnivel < 0,5 m en la huella) comprobándolo primero en el MDT05 y
  después la parcela en Catastro (cuando se levante el límite por hora). Hallazgos para el render: techo visible desde fuera y tramo de acceso.
