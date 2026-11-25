# Preparación del Preview privado · prueba real de Nuance (la ejecuta el propietario)

Claude no hace llamadas reales ni declara validado el proveedor. Las pruebas automatizadas usan `tests/fixtures/nuance-mock.cjs` y registran cero peticiones a Nuance.

## Controles que ya existen (cerrados por defecto)

- `api/advisor-session.js`: el servidor inicia la sesión; el navegador nunca recibe la clave de servidor.
- Bloqueo de sesión hasta confirmar un estado terminal.
- Solo el modo cliente admite conexión real en el piloto.
- Código de operador.
- Cancelación previa al inicio y cierre `/abandon` (token de sesión) o `/end` (clave de servidor), con reconciliación.

## Pasos para el propietario

1. Desplegar la rama en un **Preview privado** (no Production) con protección de despliegue activa.
2. Configurar en Preview las variables del adaptador indicadas en `api/advisor-session.js`: clave de servidor, código de operador y almacén del bloqueo de sesión. Fijar el presupuesto y la duración máxima en el panel de Nuance.
3. Abrir `labs/asesor-rubik/` sin `?mock-provider=1`, en modo cliente, e introducir el código de operador.
4. Mantener una conversación en español con reconocimiento y respuesta en español. Comprobar:
   - consultar superficies;
   - mostrar una estancia;
   - pedir costes: debe denegarse en modo cliente;
   - «Prefiero seguir por texto»: traspaso.
5. Cerrar la conversación y comprobar en el panel de Nuance que su estado es terminal (`ended` o `abandoned`).
6. Probar la cancelación durante el arranque y la pérdida de red: no debe quedar ninguna sesión abierta.
7. Guardar el identificador de conversación, la hora y el estado final como evidencia. Solo entonces se puede declarar validado el proveedor.
