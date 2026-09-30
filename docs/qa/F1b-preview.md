# Checklist F1b por commit

Base: PR #5, HEAD 966ab8395dcef2875de0e25337cae9058052ea34; destino de PR apilada:
feat/f1-local-projects-mobile. El SHA exacto publicado figura en el informe de entrega;
no existe URL de preview comprobada en esta sesión.

- [ ] PR F1b abierta contra la rama de #5, dependencia explícita.
- [ ] Deployment Vercel ligado al SHA publicado y READY.
- [ ] Acceso/protección comprobados en sesión sin autenticar, sin afirmar que un
      enlace protegido sea público.
- [ ] Revisar 390×844 y 844×390 táctil; escritorio 1440×900.
- [ ] Importar PNG/JPG autorizado, mover/girar/ocultar referencia y variar opacidad.
- [ ] Calibrar y repetir; segunda cota independiente, discrepancia visible y revisión.
- [ ] Trazar/editar/eliminar muros, puerta, ventana y estancia; cancelar borrador,
      deshacer/rehacer; distinguir navegar/dibujar.
- [ ] Revisar/localizar W1–W4 y confirmar revisión de elementos.
- [ ] Amueblar, ver 3D, girar cámara y volver a 2D con mismo proyecto.
- [ ] Exportar ZIP, importar en sesión limpia, recargar y borrar imagen/proyecto.
- [ ] Sin WebGL: mensaje y 2D editable; cuota/imagen corrupta sin pérdida de estado.
- [ ] Validar cinco planos reales según F1b-five-plans.md.

Pruebas propias locales automatizadas y capturas están documentadas en F1b.md.
SwiftShader es renderizado por software; no marca aprobada la revisión humana.

Bloqueos observados: api.github.com rechaza la conexión con HTTP 403 del proxy;
no se usa GraphQL para insistir. No hay .vercel, vercel.json, CLI/token/herramientas
Vercel disponibles en el entorno. Esto no demuestra que no exista un proyecto remoto:
impide identificar deployment, confirmar READY o comprobar su protección.
No se cambió la red, se fusionó nada ni se desplegó a producción.

El nuevo DEVELOPMENT-WORKFLOW.md informa una preview de la **base a4b5a9d**:
https://floorplan-3d-6ii3r2tdm-juanma-espinosas-projects.vercel.app/
No corresponde a F1b ni se presenta como su preview vigente; no se dispone de un
deployment de la rama F1b ni se acredita su READY/protección por ese enlace.

## Publicación observada

Código y pruebas publicados en `feat/f1b-image-calibration-tracing`, commit
`9cd74a59fdb6db14ee132674df974e6c71a3057d`, sobre 966ab83. El commit siguiente
solo registra esta evidencia documental; el SHA final de rama se consulta con
`git rev-parse HEAD` o en el informe de entrega. No equivale a un deployment READY.

Crear la PR por REST, sin GraphQL, falló exactamente:
`Post "https://api.github.com/repos/Juanmaes83/floorplan-3d/pulls": Forbidden`.
No existe PR F1b creada por esta sesión. Abrirla contra feat/f1-local-projects-mobile
con dependencia de #5 cuando la API o la interfaz autorizada estén disponibles.
La rama está publicada para conservar todo el trabajo, sin merge ni force push.

La sesión no autenticada tampoco pudo llegar a la preview histórica de la base:
`curl: (56) CONNECT tunnel failed, response 403` (proxy del entorno). Esto no permite
concluir si Vercel la protege: no se alcanzó el deployment. La página pública del
commit no mostró enlaces Vercel/checks; no se inventa estado remoto ni enlace F1b.
