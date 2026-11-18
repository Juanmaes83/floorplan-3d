# Copia fiel · openPlan3D @ 771c9e1 (SCULPT · SOURCE EXACT)

**No modificar.** Esta carpeta es la copia original e inmutable. La adaptación RUBIK va en otra ruta y se compara contra esta copia.

| Campo | Valor |
|---|---|
| Repositorio | https://github.com/Juanmaes83/openPlan3D |
| Commit | `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d` (14/11/2026) |
| Licencia | MIT, © 2026 theLodgeStudio (`LICENSE`) |
| Dependencia clave de G-02 | `dxf-writer` 1.18.4, MIT |
| Huellas | `MANIFEST.sha256` (84 archivos). Comprobar con `sha256sum -c MANIFEST.sha256` |
| Fuera del despliegue | `labs/` está excluido por `.vercelignore` |

## Qué contiene

1. **Familia G-02 · exportación DXF:** el cierre de importaciones de `src/lib/utils/cadExport.ts`, 63 archivos. Es grande porque arrastra el editor del donante (modelo `Project`, stores de Svelte, catálogo, detección de estancias).
2. **Familia de persistencia, para F0:**
   - `services/storagePersistence.ts`, `localDatabase.ts`, `libraryRestore.ts` y `datastore.ts`;
   - `stores/saveStatus.ts` y `versionHistory.ts`;
   - `utils/snapshotStorage.ts` y `projectBackup.ts`.
3. **Las pruebas de ambas familias**, `package.json` y `package-lock.json`.

## Baseline (FASE 2), ejecutado sobre esta misma revisión

Entorno: Node 22, en una copia aislada fuera del repositorio.

```bash
npm ci --ignore-scripts
npx svelte-kit sync
npx vitest run tests/exports.test.ts tests/dxf-door-symbol.test.ts tests/canvas-symbol-dxf.test.ts tests/export-visibility.test.ts tests/export-wall-measure-mode.test.ts
npx vitest run tests/backup-entry-points.test.ts tests/datastore.test.ts tests/project-validation.test.ts tests/storage-persistence.test.ts tests/version-history.test.ts
```

| Familia | Resultado |
|---|---|
| G-02 · exportación DXF (5 archivos) | **69/69** |
| Persistencia (5 archivos) | **132/132** |

Sin `svelte-kit sync` las pruebas no arrancan: falta `.svelte-kit/tsconfig.json`. Es el paso de preparación del propio donante.
