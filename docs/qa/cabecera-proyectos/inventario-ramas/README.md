# Inventario de ramas antiguas frente a master (`origin/master` dacb5d39) · EN CURSO

- `ramas-pendientes-de-master.txt`: las 337 ramas remotas con commits propios fuera de master, por fecha (lista de entrada).
- Medida por contenido: de los ficheros que toca cada rama, cuántos son **idénticos** en master (ya integrados), **ausentes** y **distintos**.
- `inventario-parcial.csv`: **182 de 337** procesadas (última: `feat/hybrid-registered-elevation-v1`), guardado 11:08 del 28/11.
- **Retomar sin repetir**: ejecutar `inventario.sh` solo sobre las líneas de `ramas-pendientes-de-master.txt` posteriores a `feat/hybrid-registered-elevation-v1`
  (p. ej. `sed -n "$(grep -n ' origin/feat/hybrid-registered-elevation-v1 ' ramas-pendientes-de-master.txt | cut -d: -f1),\$p"` → quitar la primera línea) y
  añadir las filas al CSV. Después: clasificar cada rama (integrar / recuperar por partes / descartar) con evidencia; decisión conjunta.
