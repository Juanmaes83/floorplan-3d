# OP-02 · Impacto de la corrección de órbita y paseo

Se comparó `f34ad8ef79ea5f3232b90ffafb55319e4e140590` con [las muestras archivadas de `ee90df6`](https://github.com/Juanmaes83/floorplan-3d/blob/f34ad8ef79ea5f3232b90ffafb55319e4e140590/labs/sculpt/op-02/rubik-after.json), usando [el mismo medidor](https://github.com/Juanmaes83/floorplan-3d/blob/f34ad8ef79ea5f3232b90ffafb55319e4e140590/labs/sculpt/op-02/measure-rubik.cjs). Mismo equipo Windows 11, Node 22.13.0, Playwright 1.62.1, Chromium 151.0.7922.34 y SwiftShader. Una muestra nueva por escena y perfil. Solo se añadió una segunda muestra de la escena amueblada por sus intervalos p95 iniciales.

| Perfil y escena | Entrada a cámara distinta, ms, anterior → nuevo | Intervalo p95 entre frames durante interacción, ms, anterior → nuevo |
|---|---:|---:|
| Escritorio · vacía | 17,2 → 16,5 | 18,1–18,3 → 17,3 |
| Escritorio · amueblada | 23,9 → 22,3 / 26,0 | 211,5–221,6 → 250,8 / 212,1 |
| Escritorio · multiplanta | 18,5 → 16,4 | 39,4–45,8 → 48,0 |
| Táctil · vacía | 33,3 → 33,6 | 26,3–33,8 → 30,3 |
| Táctil · amueblada | 39,7 → 39,0 / 39,5 | 244,4–382,2 → 395,9 / 229,0 |
| Táctil · multiplanta | 35,0 → 33,2 | 44,2–55,5 → 50,5 |

Las 6/6 ventanas principales y las dos muestras amuebladas adicionales dieron cero callbacks, renders y reconstrucciones en reposo estable. Las seis muestras principales reprodujeron los PNG y las poses de cámara archivados para los seis pares de escena y perfil. La primera respuesta se mantuvo próxima a las medias anteriores. El p95 amueblado mostró variación entre muestras. La segunda captura dio 212,1 ms en escritorio y 229,0 ms en táctil. La muestra multiplanta de escritorio quedó 2,2 ms por encima del máximo archivado. Con esta muestra pequeña, los intervalos son descriptivos. El medidor registra arrastre orbital y reposo, por lo que la evidencia de movimiento de paseo procede de [Studio Presentation](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44393395327/job/135116769356) y [NAV3D](https://github.com/Juanmaes83/floorplan-3d/actions/runs/44393395751/job/135116771060).

[Muestras principales](op02-f34ad8e-benchmark-delta.json) · [Muestras adicionales de la escena amueblada](op02-f34ad8e-benchmark-amueblada.json).
