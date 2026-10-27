# BCCA_ES — revisión documental del gate de reutilización

**Revisión:** 27-10-2026. **Producto:** Base de Costes de la Construcción de Andalucía (BCCA), edición publicada en enero de 2024. **Conclusión de máquina para gestión por Rubik:** `UNKNOWN`. **Activación de datos BCCA reales gestionados por Rubik:** `DISABLED`.

Este registro describe evidencia publicada; no constituye asesoramiento jurídico ni atribuye una licencia que no aparece en las fuentes consultadas.

## Fuentes oficiales consultadas

1. [Página oficial BCCA, enero de 2024](https://www.juntadeandalucia.es/organismos/viviendajuventudyordenaciondelterritorio/areas/vivienda-rehabilitacion/planes-instrumentos/paginas/bcca-ene-2024.html): identifica la BCCA y su titularidad en la Consejería de Fomento, Articulación del Territorio y Vivienda; presenta el BC3 comprimido y documentos de precios para descarga e importación en programas de mediciones. Describe los precios como referencia que debe ajustarse a cada proyecto. No presenta en la página una licencia específica que autorice el procesamiento comercial por Rubik, el alojamiento o la redistribución por terceros.
2. [Índice oficial BCCA](https://www.juntadeandalucia.es/organismos/viviendajuventudyordenaciondelterritorio/areas/vivienda-rehabilitacion/planes-instrumentos/paginas/vivienda-bcca.html): enumera ediciones y actualizaciones. No fija por sí mismo condiciones de licencia para la edición concreta.
3. [Explicación oficial del portal de Datos Abiertos](https://www.juntadeandalucia.es/organismos/transparencia/entender-transparencia/datos-abiertos.html): explica que cada conjunto tiene información propia de licencia y que sus condiciones pueden incluir limitaciones comerciales. No identifica una licencia BCCA.
4. [Página de reutilización de datos presupuestarios](https://www.juntadeandalucia.es/organismos/transparencia/informacion-economica-presupuestaria/visor-presupuestos/reutilizacion.html): permite reutilizar **esos datos presupuestarios** bajo CC 4.0; su alcance no incluye automáticamente la BCCA.
5. [Banco de Precios AOPJA](https://www.juntadeandalucia.es/organismos/aopja/areas/transferencia-difusion/documentacion-tecnica/paginas/banco-precios.html): habla de libre acceso y distribución para **otra base de precios**. No se traslada esa declaración a la BCCA.

## Evidencia por decisión

| Pregunta | Evidencia disponible | Conclusión |
|---|---|---|
| Fuente oficial / identidad | Página de la Consejería sobre BCCA enero 2024 | Confirmada para ese producto |
| Titularidad | La página atribuye la BCCA a la Consejería | Confirmada |
| Descarga | BC3/ZIP e informes publicados para descarga | Confirmada; descarga no equivale a permiso universal |
| Procesamiento/uso comercial por Rubik | La página no publica licencia específica aplicable a ese procesamiento | `UNKNOWN` |
| Reutilización por Rubik | No se acreditó una autorización específica suficiente para el producto y el alcance comercial | `UNKNOWN` |
| Redistribución/alojamiento por Rubik | No se acreditó autorización específica | `UNKNOWN`; fuera del modo actual |
| Atribución | La titularidad está indicada, pero no se presenta una condición de licencia BCCA concreta | No inventar texto de atribución obligatorio |
| Licencia específica | No identificada en las fuentes anteriores | `unknown` en metadata y quotes |

## Alcance de los modos

`user-supplied`: el profesional obtiene y suministra el BC3. Rubik lo procesa localmente; no lo descarga, aloja, empaqueta, redistribuye ni actualiza. Si el gate técnico pasa y no se conoce restricción incompatible, las consultas pueden operar con `license.status='unknown'`. Esto **no afirma** que la licencia comercial esté verificada. Una restricción explícita incompatible (`RESTRICTED`) bloquea el modo.

`rubik-managed`: representa una capacidad futura de descarga, alojamiento, empaquetado, redistribución o actualización por Rubik. Con la evidencia actual, `LEGAL GATE = UNKNOWN`, por lo que queda desactivado. Solo una decisión posterior `VERIFIED`, con evidencia oficial suficiente sobre el uso comercial y la reutilización requeridos, permitiría activar técnicamente ese modo. Esta PR no implementa ninguna operación de red o distribución.

`synthetic`: datos íntegramente inventados para tests; su permiso de ejecución no constituye evidencia legal sobre BCCA.

**Separación explícita:** el modo actual `user-supplied` no requiere redistribución por Rubik. La ausencia de esa operación no demuestra por sí sola autorización comercial para otros usos. La metadata y el CostQuote conservan `unknown` sin convertirlo en `verified`.
