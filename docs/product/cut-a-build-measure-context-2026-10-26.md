# Corte A — construir y medir: acceso, contexto y descubribilidad

**Base inicial:** `master` `56c644e09e91bf366a1a9ffd1eaed505df2b8af8`  
**Fuente de decisión:** `docs/product/approved-next-capabilities-2026-10-25.md`  
**Estado:** corte de implementación preparado; no declara funcionalidad nueva como disponible.

## Objetivo
Mejorar el acceso, la descubribilidad y el contexto de uso de las herramientas existentes de selección, construcción/dibujo de muros y medición, sin crear sistemas paralelos ni duplicar lógica.

## Alcance
- Reconstruir el estado real de las herramientas existentes en `master`.
- Identificar cómo se accede hoy a selección, construir/dibujar y medir en desktop y móvil.
- Reducir fricción para encontrar esas herramientas desde el flujo guiado y/o la paleta existente.
- Añadir contexto o siguiente acción útil cuando sea necesario.
- Mantener una única fuente funcional para dibujo y medición.

## Fuera de alcance de este corte
- No implementar todavía tipo estructural/declarado de muro.
- No implementar el nuevo modelo de superficies.
- No implementar familias funcionales de estancias.
- No implementar la ficha profesional de superficies.
- No implementar orientación/sol geográfico.
- No rediseñar desde cero el editor ni crear una segunda paleta.

## Reglas
- Reutilizar controles, comandos y estado existentes siempre que sea posible.
- Mantener compatibilidad con proyectos actuales.
- No añadir afirmaciones de certificación, normativa o medición oficial.
- Evitar automatismos irreversibles; el profesional debe conservar control y edición.
- No ocultar herramientas existentes a usuarios avanzados para favorecer el flujo guiado.

## Trabajo previo obligatorio
Antes de modificar producto:
1. Inventariar archivos, controles y comandos reales relacionados con construir/dibujar, selección y medición.
2. Mapear entradas actuales en desktop, móvil, flujo guiado y paleta completa.
3. Identificar duplicidades reales frente a simples accesos diferentes al mismo comando.
4. Detectar regresiones conocidas o límites ya documentados que afecten a esos accesos.
5. Proponer el cambio mínimo que mejore descubribilidad sin ampliar alcance.

## Criterios de aceptación
- Un profesional puede localizar claramente cómo construir/dibujar y medir sin aprender una interfaz nueva.
- Las acciones nuevas de acceso reutilizan la lógica existente; no existe una segunda implementación funcional.
- Desktop y móvil conservan acceso a las herramientas afectadas.
- El flujo guiado y la paleta completa no se contradicen.
- No se introduce una regresión confirmada en selección, dibujo, medición, importación o presentación.
- Los tests dirigidos de los flujos afectados pasan en el SHA candidato.
- Si hay cambio visible, existe preview exacto del SHA y revisión humana antes de integrar.

## Estrategia de PR
Mantener este corte aislado. Si durante el inventario aparece trabajo necesario de los puntos 2–6, documentarlo pero no mezclarlo en esta PR.
