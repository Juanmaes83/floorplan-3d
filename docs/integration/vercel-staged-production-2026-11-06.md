# Vercel — Production en dos pasos: merge en `master` sin publicar (2026-11-06)

**Proyecto:** `floorplan-3d`. **Decisión del propietario:** opción (a), autorizada por Juanma el 6/11.

## Configuración

- La rama Production sigue siendo `master`.
- La opción «Auto-assign Custom Production Domains» está **desactivada**:
  - **Fase A:** autorizada y aplicada por API con `autoAssignCustomDomains: false`.
  - Juanma la verificó en el panel.
- Cada merge en `master` crea un despliegue con destino Production. **No se publica en el dominio oficial** hasta que alguien ejecute un «Promote» expreso.

## Dominios

| Alias | Función | Acceso anónimo |
|---|---|---|
| `floorplan-3d-alpha.vercel.app` | **Único dominio público oficial**. Solo cambia con un «Promote». | Público |
| `floorplan-3d-juanma-espinosas-projects.vercel.app` | Alias técnico. Puede seguir a `master`. | `login_required` |
| `floorplan-3d-git-master-juanma-espinosas-projects.vercel.app` | Alias técnico de la rama. Sigue a `master`. | `login_required` |

- **Despliegue aprobado de referencia:** `dpl_F7EomNZLJ1NvLxhE5RV9VkkdN4fB`, de `master@0cfe6a5`.
- **Protección SSO:** `all_except_custom_domains`.

## Fase B

Este mismo commit, que solo añade este documento, es la prueba controlada. Comprobaciones:

- Vercel crea un despliegue Production en estado READY.
- `floorplan-3d-alpha.vercel.app` sigue en `dpl_F7EomNZLJ1NvLxhE5RV9VkkdN4fB`.

## Después de cada «Promote» o rollback

Hay que volver a comprobar dos cosas:

1. Que «Auto-assign Custom Production Domains» sigue desactivada. Algunos flujos de recuperación pueden reactivarla.
2. Los tres alias.
