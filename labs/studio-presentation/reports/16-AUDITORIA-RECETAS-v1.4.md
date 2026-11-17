# 16 · Auditoría de completitud profesional RP01–RP21 (v1.4 ampliada)

Generado por `tools/auditoria-recetas.cjs` (oráculo independiente del catálogo sobre el texto de los PDF finales). Catálogo rubik-lab-recetas/1.

| Receta | Nivel | Finalidad | Perfiles · fases | Documentos | Campos sin representar (ES) | Estado real | Corte |
|---|---|---|---|---|---|---|---|
| RP01 | L | Alcance, servicios y honorarios | AR,AT,IN,RE · A | commercial-proposal-client-v3 | — | L completa documentalmente (ES y EN); pendiente revisión humana |  |
| RP02 | L | Viabilidad y estado actual | AR,AT,IM · A | architecture-book, architecture-sheet-strip | — | L completa documentalmente (ES y EN); corte: revisionAnterior → E2 (ENT-04), fotosAportadas → E4; pendiente revisión humana | revisionAnterior → E2 (ENT-04),fotosAportadas → E4 |
| RP03 | L | Anteproyecto integral y opciones | AR,IN,RE · A | interior-book-v3, materials-furniture-book-v3, commercial-proposal-client-v3, real-estate-sheet-v3, architecture-book, architecture-sheet-strip | — | [documentos heredados de «integral»] L completa documentalmente (ES y EN); corte: variantesGuardadas → E2 (UX-07); pendiente revisión humana | variantesGuardadas → E2 (UX-07) |
| RP04 | L | Vivienda y potencial de reforma | IM,RE · A | real-estate-sheet-v3 | — | L completa documentalmente (ES y EN); corte: revisionAnterior → E2 (ENT-04); pendiente revisión humana | revisionAnterior → E2 (ENT-04) |
| RP05 | L | Estimación económica inicial | AT,RE,CO · A | commercial-proposal-client-v3 | — | L completa documentalmente (ES y EN); pendiente revisión humana |  |
| RP06 | L | Concepto, moodboard y opciones | IN,AR · A | interior-book-v3, materials-furniture-book-v3 | — | L completa documentalmente (ES y EN); pendiente revisión humana |  |
| RP07 | L | Ficha comercial de vivienda | IM · A | real-estate-sheet-v3-sin-presupuesto | — | L completa documentalmente (ES y EN); pendiente revisión humana |  |
| RP08 | L | Oferta técnica y planificación | CO,RE · A | architecture-sheet-strip | — | L completa documentalmente (ES y EN); corte: vinculoPlanPresupuesto → E3/E6 (FT3D-8); pendiente revisión humana | vinculoPlanPresupuesto → E3/E6 (FT3D-8) |
| RP09 | L | Architecture Book y juego de láminas | AR,AT,RE · D | architecture-book, architecture-sheet-strip | — | L completa documentalmente (ES y EN); corte: revisionAnterior → E2 (ENT-04), dimensionesHuecos → E4; pendiente revisión humana | revisionAnterior → E2 (ENT-04),dimensionesHuecos → E4 |
| RP10 | L | Memoria descriptiva y superficies | AR,AT · D | architecture-book | — | L completa documentalmente (ES y EN); corte: revisionAnterior → E2 (ENT-04); pendiente revisión humana | revisionAnterior → E2 (ENT-04) |
| RP11 | L | Libro FF&E y fichas de activos | IN,AR,IM · D | materials-furniture-book-v3 | — | L completa documentalmente (ES y EN); pendiente revisión humana |  |
| RP12 | L | Mediciones y presupuesto detallado | AT,AR,RE,CO · D | commercial-proposal-client-v3 | — | L completa documentalmente (ES y EN); pendiente revisión humana |  |
| RP13 | C | Comparativo de ofertas homologadas | AT,CO,RE · D | — | presupuesto | C: contrato y bloqueo (no implementar motor) |  |
| RP14 | C | Orden de cambio de diseño u obra | RE,AR,AT,IN,CO · D | — | — | C: contrato y bloqueo (no implementar motor) | revisionAnterior → E2 (ENT-04) |
| RP15 | C | Seguimiento y certificaciones de obra | CO,AT,RE,IM · D | — | planObra | C: contrato y bloqueo (no implementar motor) |  |
| RP16 | F | Visita, actas, RFI y decisiones | AR,AT,CO,RE · D | — | — | F: futuro, dependencias registradas |  |
| RP17 | C | Personalización y especificación técnica | IN,AR,IM · D | — | materiales, objetos, catalogoProductos | C: contrato y bloqueo (no implementar motor) |  |
| RP18 | F | Recepción y remates | RE,CO,AT · P | — | — | F: futuro, dependencias registradas |  |
| RP19 | F | As-built y manual de mantenimiento | AR,AT,CO,RE · P | — | — | F: futuro, dependencias registradas |  |
| RP20 | F | Liquidación, garantías y entrega de llaves | CO,AT,RE,IM · P | — | — | F: futuro, dependencias registradas |  |
| RP21 | C | Dossier del propietario y portfolio final | IM,IN,RE,AR · P | — | — | C: contrato y bloqueo (no implementar motor) |  |

## Perfiles × fases (18)

| Perfil | Fase | Recetas | L |
|---|---|---|---|
| AR | A | RP01, RP02, RP03, RP06 | RP01, RP02, RP03, RP06 |
| AR | D | RP09, RP10, RP11, RP12, RP14, RP16, RP17 | RP09, RP10, RP11, RP12 |
| AR | P | RP19, RP21 | **ninguna** |
| AT | A | RP01, RP02, RP05 | RP01, RP02, RP05 |
| AT | D | RP09, RP10, RP12, RP13, RP14, RP15, RP16 | RP09, RP10, RP12 |
| AT | P | RP18, RP19, RP20 | **ninguna** |
| IN | A | RP01, RP03, RP06 | RP01, RP03, RP06 |
| IN | D | RP11, RP14, RP17 | RP11 |
| IN | P | RP21 | **ninguna** |
| RE | A | RP01, RP03, RP04, RP05, RP08 | RP01, RP03, RP04, RP05, RP08 |
| RE | D | RP09, RP12, RP13, RP14, RP15, RP16 | RP09, RP12 |
| RE | P | RP18, RP19, RP20, RP21 | **ninguna** |
| CO | A | RP05, RP08 | RP05, RP08 |
| CO | D | RP12, RP13, RP14, RP15, RP16 | RP12 |
| CO | P | RP18, RP19, RP20 | **ninguna** |
| IM | A | RP02, RP04, RP07 | RP02, RP04, RP07 |
| IM | D | RP11, RP15, RP17 | RP11 |
| IM | P | RP20, RP21 | **ninguna** |

**Resumen:** 12/12 recetas L representan todos sus campos en los bytes finales. Incompletas: ninguna. Combinaciones sin receta L: AR·P, AT·P, IN·P, RE·P, CO·P, IM·P.

Límite del oráculo: detecta presencia de contenido por patrones; no juzga su corrección (eso lo hacen los QA de cada bloque) ni sustituye la revisión humana.
