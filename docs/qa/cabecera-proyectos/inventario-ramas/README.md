# Inventario de ramas antiguas frente a master (`origin/master` dacb5d39) · EN CURSO

- 337 ramas remotas con commits propios que no están en master (`git rev-list origin/master..rama`).
- Medida por contenido (no por commits: muchas ramas tienen historia anterior a una reescritura): de los ficheros que toca cada rama,
  cuántos son **idénticos** en master (ya integrados), **ausentes** en master y **distintos**.
- `inventario-parcial.csv`: 174 de 337 ramas procesadas a las 11:06 (ordenadas por fecha). Script: `inventario.sh`.
- Pendiente: completar las 337 y clasificar cada rama (integrar / recuperar por partes / descartar) con evidencia. Decisión conjunta.
