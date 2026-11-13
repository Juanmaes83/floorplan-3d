# SCULPT-R01 · Procedencia, licencias y huellas (Fase 0)

**Fecha:** 10/11/2026 · **Base RUBIK:** `master@75615fd` · **Rama:** `lab/sculpt-r01-recognition`
**Estado:** laboratorio. **No validado con planos reales. No integrado en el producto. Fuera de Vercel** (`.vercelignore` excluye `labs/`).
**Licencias:** documentadas para GOV-05. **No están resueltas jurídicamente**: nada de lo que sigue es asesoramiento legal ni sustituye esa revisión.

## 1. Genealogía comprobada

```text
wy51ai/floorplan-3d  (wuyi · MIT añadido el 01/10/2026 en fbcb8d5)
 ├── Juanmaes83/floorplan-3d  (RUBIK)     — contiene 610f37c, 16df313, a03136c de wuyi (29/09/2026)
 ├── zhuzhuyumeng/floorplan-3d            — contiene 730ec09 (master de wy51ai, con LICENSE MIT)
 │     ├── feat/floorplan-recognition = 1d235fc  ← R01 (olifod, 09/11/2026); PR wy51ai/floorplan-3d#18, abierta en el upstream
 │     └── feat/ceiling-layout        = 324eb64  ← R02 (olifod); PR wy51ai/floorplan-3d#17
 ├── caikaidev/floorplan-3d               — bifurcado ANTES de fbcb8d5: sin LICENSE
 │     └── 2495d8e                         ← R03 (kai cai), en su master; PR wy51ai/floorplan-3d#11 cerrada sin fusionar
 ├── faye25tom/floorplan-3d-ai  → fork propio Juanmaes83/floorplan-3d-ai (mismo HEAD a575a3c)
 └── wholeai/floorplan-3d-go    → fork propio Juanmaes83/floorplan-3d-go (mismo HEAD a9a226a)
```

Comprobación: `git merge-base --is-ancestor` sobre clones de solo lectura (`GIT_LFS_SKIP_SMUDGE=1`, sin hooks, sin instalar nada).

## 2. Donantes

| Id | Repositorio · referencia | Commit exacto | Autor del commit | Licencia en ese árbol | Decisión |
|---|---|---|---|---|---|
| **R01** | PR **wy51ai/floorplan-3d#18**, desde la rama `zhuzhuyumeng/floorplan-3d:feat/floorplan-recognition` | `1d235fc0a3c45783e1e1fa129944f8f34d97d297` (árbol `3c57e46b…`) | olifod | `LICENSE` MIT, © 2026 wuyi, en la raíz del mismo árbol | **Uso en laboratorio con el aviso MIT conservado; derechos pendientes de GOV-05**** (ver §3). **Imagen de prueba: NO** (ver §4) |
| R02 | PR **wy51ai/floorplan-3d#17**, desde `zhuzhuyumeng/floorplan-3d:feat/ceiling-layout` | `324eb64cf9b26f6d4df8323c2dec4591fa4691e3` | olifod | MIT (mismo árbol base) | Solo inventario (no autorizado implementar) |
| R03 | PR **wy51ai/floorplan-3d#11** (cerrada sin fusionar), desde `caikaidev/floorplan-3d` | `2495d8e0bf7d3846d2da827121c15e3e83d752bd` | kai cai (+ Ian, Claude en la rama) | **Ninguna**: el árbol no tiene `LICENSE` y la bifurcación es anterior al MIT de wuyi | **Bloqueo legal**: solo referencia de comportamiento |
| Base | wy51ai/floorplan-3d · `master` | `730ec0923a018fdf38b4687c5ef385c7dcac451f` | wuyi | MIT, © 2026 wuyi | Origen común de RUBIK y R01 |

## 3. Derechos sobre el código de R01

- El commit `1d235fc` lo publicó su autor en un repositorio cuyo árbol contiene una licencia MIT en la raíz.
- **Interpretación técnica, no jurídica:** las condiciones de GitHub (sección D.6, *inbound = outbound*) indican que lo que se añade a un repositorio con licencia queda bajo esa licencia. Si se aplica o no a este caso lo decide GOV-05.
- **Refuerzo comprobado:**
  - `js/recognition-core.js` y `js/ocr-postprocess-rules.js` son **idénticos byte a byte** (SHA-256 `52fe5237…`, `beb461c6…`) en `master@88323f3` de zhuzhuyumeng;
  - los blobs git (`d635e751…` y `c716eeef…`) coinciden con los que registra el inventario de la PR #192 (§8.1), y también con los de #17;
  - ese commit también es de olifod e incorpora el contenido de R01;
  - por tanto, el código que usamos está en la rama principal del donante, bajo su `LICENSE` MIT.
- **Riesgo residual (documentado para GOV-05, no resuelto):**
  1. la rama de la PR no está fusionada como tal: el contenido entró en `master` por otro commit;
  2. el autor no añadió un aviso propio;
  3. su identidad git es local (`olifod@192.168.100.9`).

  Si el propietario quiere certeza plena, debe pedir confirmación al autor antes de cualquier integración (GOV-05).
- Ningún archivo de R01 contiene avisos de terceros ni código atribuido a otra fuente (búsqueda de `copyright`, `license`, `adapted from`, URLs: solo aparece el espacio de nombres SVG del W3C).
- Dependencias que R01 declara pero que **no se instalan ni se copian**:
  - `tesseract.js@6.0.1` (Apache-2.0; tiene **script de instalación**, no examinado, así que no se ejecuta);
  - `@tesseract.js-data/chi_sim` (datos de idioma).
- **No se cambia la licencia de RUBIK.** Solo se copian dos archivos del donante al taller, con su aviso MIT al lado (`workshop/LICENSE-donor-MIT.txt`).
- **Hallazgo previo, solo informativo:** RUBIK deriva de wy51ai, pero `master` no incluye hoy el aviso MIT de wuyi, que la licencia exige conservar en las copias sustanciales. Decisión del propietario o de GOV-05; esta rama no lo cambia.
- **Cuestiones abiertas para GOV-05** (ninguna está resuelta):
  1. si basta el MIT del árbol para las contribuciones de olifod, o hace falta confirmación del autor;
  2. cómo incorporar a RUBIK el aviso de wuyi;
  3. la licencia y la redistribución de tesseract.js y de los datos de idioma, si algún día se usan;
  4. la imagen del donante, que no se redistribuye.

## 4. Por qué SOURCE EXACT no se sube al repositorio

`tests/fixtures/user-floorplan.png` (SHA-256 `6206fcc8…`, 1014×1128) es una **captura de pantalla de una vivienda real tomada de una aplicación comercial**: lleva botones de la app, cotas y superficies de estancias. Por eso:

- no podemos acreditar ni los derechos de la captura ni el consentimiento sobre la vivienda;
- el repositorio de RUBIK es público.

En consecuencia:

- **SOURCE EXACT vive solo en local** (`/home/user/donors/r01-exact`, contenedor efímero). Se reconstruye y verifica byte a byte con `fetch-source-exact.sh`, que escribe **fuera** del repositorio.
- **Seguridad del script** (corregida tras la auditoría del 10/11):
  - nunca borra ni sobrescribe: si el destino existe y no es un directorio vacío, se niega (salida 3);
  - rechaza enlaces simbólicos y rutas dentro del repositorio;
  - construye y verifica en un directorio temporal propio, y solo después lo mueve al destino;
  - `--verify DIR` solo lee.
- La CI (`source-exact`) lo reconstruye en el directorio temporal del runner, sin subirlo, y lo vuelve a verificar.
- En el repositorio solo hay:
  - `SOURCE-EXACT.sha256`: las huellas de los 23 archivos, incluida la de la imagen, pero no la imagen;
  - el **taller**: copias de los dos módulos puros que necesitamos.
- Con esa imagen solo se ha hecho un recuento local, por ejemplo de muros o estancias. **No se publica ninguna geometría ni medida obtenida de ella.**

## 5. Huellas

- `git archive 1d235fc | sha256sum` = `86135d18bc20d280af3b867deca25b61d06bc465efc1e6aad26762a6509fea3f`.
- Por archivo: `SOURCE-EXACT.sha256` (verificable con `sha256sum -c`).
- Copias del taller, idénticas al origen en el commit de importación:
  - `workshop/recognition-core.js` = `52fe5237…` (`js/recognition-core.js`);
  - `workshop/ocr-postprocess-rules.js` = `beb461c6…` (`js/ocr-postprocess-rules.js`).

  Los cambios posteriores del taller van en commits separados y se describen en `../../../docs/technical/sculpt-r01-recognition.md`.

## 6. Reglas de esta rama

- No modificar SOURCE EXACT: REMOVE significa «no se usa en el taller», nunca borrar archivos de la fuente.
- No instalar dependencias del donante.
- No usar OCR en la nube ni APIs de pago.
- No usar planos de clientes.
- No escribir geometría canónica: el adaptador produce **evidencia**, no muros de proyecto.
