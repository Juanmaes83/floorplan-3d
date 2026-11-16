# Auditoría forense de consolidación de RUBIK SOTA

**Corte:** 16 de noviembre de 2026, 10:02:54 UTC. **Master auditado:** `46174d6918e336119a79f5bda9fd2733aa5464c4`. Se analizaron las **29 PR abiertas** en ese momento mediante descripciones, comentarios, historial, archivos, comparación de árboles y simulación local de merge. Este es un diagnóstico fechado, **no una certificación permanente** del estado presente de GitHub, Vercel o el producto.

## Resultado en breve

RUBIK ya es una aplicación principal en `master`; sus módulos comparten el proyecto geométrico, aunque presupuesto, catálogo y otros estados se guardan por separado. La clasificación principal de las PR es **A=6 absorbidas, B=4 parcialmente absorbidas, C=1 candidata, D=1 bloqueada, E=8 laboratorios, F=9 documentales históricas, G=0, H=0**. El merge simulado directamente contra master fue limpio para 18 y conflictivo para 11; limpieza Git no significa aceptación técnica ni de producto.

Las pruebas locales de este corte dieron **130/131** casos puros/API simulada y **35/38** de navegador. El fallo puro provino de la comparación byte a byte de esquemas con CRLF en el checkout Windows; los tres fallos de navegador fueron controles móviles reproducidos. Los checks de GitHub se registran aparte por su SHA, sin sumar tandas distintas.

Brechas principales: portabilidad del proyecto junto a presupuesto/catálogo, lector de entrega para destinatario externo sin sesión, identidad multiestudio autenticada, controles móviles si el piloto los incluye y alias público anterior al HEAD. El Asistente V2 está en master; la preparación final de #238 V3 queda pendiente del SHA, pruebas y límites que entregue Claude. Ninguna PR se fusionó, cerró ni desplegó por esta auditoría.

## Lectura y evidencias

1. [Resumen ejecutivo](01-RESUMEN-EJECUTIVO.md): dictamen comprensible y prioridades.
2. [Matriz de las 29 PR](MATRIZ-29-PR.md): estado y decisión de cada PR.
3. [Fichas técnicas de PR](FICHAS-TECNICAS-PR.md): análisis individual, SHAs, archivos, pruebas, conflictos y condiciones.
4. [Inventario de master](04-INVENTARIO-MASTER.md): capacidades y límites del producto vigente en el SHA auditado.
5. [Mapa de arquitectura y dependencias](05-MAPA-ARQUITECTURA-Y-DEPENDENCIAS.md): contratos compartidos y puntos sensibles.
6. [Recorridos E2E y brechas](06-RECORRIDOS-E2E-Y-BRECHAS.md): recorridos A–H y tramos no demostrados.
7. [Plan de consolidación](07-PLAN-CONSOLIDACION-CODEX.md): cortes futuros, dependencias, gates y autorizaciones.
8. [Registro de evidencias](08-REGISTRO-EVIDENCIAS.md): comandos, resultados, CI, despliegue y límites.
9. [Riesgos y decisiones del propietario](09-RIESGOS-Y-DECISIONES-PROPIETARIO.md): riesgos y cinco decisiones prioritarias.

[Datos forenses estructurados](pr-forensics.json) conserva los cuerpos de PR, comentarios, commits, archivos, SHAs, comprobaciones Git y resultados de merge simulado. [SHA-256 del paquete](MANIFIESTO-SHA256.txt) permite comprobar los artefactos publicados.

## Alcance y límites

No se ejecutaron las 29 ramas en navegador ni un recorrido A–H único con el mismo proyecto y un destinatario externo. No se probó un modelo de pago, Redis real, una entrega pública, hardware físico ni el trabajo local activo de Claude. Las dos tandas de pruebas ejecutadas, los checks consultados y las afirmaciones históricas se distinguen en el registro. El siguiente corte de V3 necesita entrega final de Claude y nueva auditoría sobre su SHA; la documentación de Home y la validación de proyecto/economía pueden prepararse antes.

**Sanitización para repositorio público:** se omitieron 334 campos `pr.commits[].authors[].email` del JSON, porque no son necesarios para reproducir SHA, historia o contenido y algunos contienen una dirección personal. El original íntegro permanece en la carpeta local de auditoría. Se sustituyeron dos rutas absolutas del checkout local por `<clon-local-de-auditoria>` en el registro de evidencias. No se alteraron conclusiones ni resultados técnicos.
