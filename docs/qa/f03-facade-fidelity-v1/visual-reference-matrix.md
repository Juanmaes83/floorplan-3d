# F03 — Matriz de referencias visuales verificadas

Inspección individual de los 12 PNG publicados, realizada sobre los archivos de esta rama. Las categorías describen el contenido visible, no comprueban autoría, fotografía frente a imagen generada, dimensiones ni licencia. Los collages aportan dirección cualitativa, pero sus paneles no se contabilizan como escenas originales independientes.

| ID | Archivo | Descripción comprobada | Categoría | Uso previsto en F03 | Confianza | Limitaciones | Escena independiente |
|---|---|---|---|---|---|---|---|
| V-01 | `14236036-ea00-48f6-89e7-9f75dcc2051e.png` | Vivienda contemporánea de dos niveles, estuco blanco cálido, piedra y grandes huecos; coronación plana visible. | `SCENE_FULL_FRONT` | Continuidad mineral, relación con huecos y contraste de rugosidades. | Alta | Sólo frente principal; sin cotas ni verificación de construcción real. | Sí |
| V-02 | `2ce99dbf-6fd5-41be-b102-8cf184bd90db.png` | Finca rural oblicua con revoco claro, mampostería, cubierta de teja y carpintería oscura. | `SCENE_FULL_OBLIQUE` | Lectura de grano, esquinas y transición revoco–piedra bajo luz rasante. | Alta | No reproducir teja, chimenea o arcos ausentes en Rubik. | Sí |
| V-03 | `3725ba05-4a35-433a-bb3d-983804406b06.png` | Collage 3×3: seis escenas arquitectónicas y tres detalles de revestimiento. | `CONTACT_SHEET_MIXED` | Dirección cualitativa de escala de grano y sombras. | Alta | No separar ni contar paneles como originales; resolución limitada por panel. | No |
| V-04 | `52467fe7-2618-4034-a1b3-550f81036ed7.png` | Lámina 10–18 con cinco escenas y cuatro detalles minerales etiquetados. | `CONTACT_SHEET_MIXED` | Comparación cualitativa de cal, estuco, revoco fino y rugoso. | Alta | Etiquetas incrustadas no demuestran procedencia ni equivalencia material. | No |
| V-05 | `88a2a672-6030-4e2d-9ddf-ffab022abae5.png` | Frente de edificio residencial de cuatro plantas, revoco claro, zócalo pétreo y balcones repetidos. | `SCENE_FULL_FRONT` | Continuidad en paños repetidos y encuentros con balcones. | Alta | Escala tipológica distinta de la vivienda Rubik. | Sí |
| V-06 | `Catálogo Mediterráneo de Fachadas y Texturas.png` | Lámina 3×3 etiquetada 10–18, con cinco familias arquitectónicas y cuatro acabados. | `CONTACT_SHEET_MIXED` | Guía cualitativa; no fuente de tokens persistidos. | Alta | Los rótulos `ARCH.FAMILY`/`MATERIAL.WALL` no son API aprobada. | No |
| V-07 | `a9ed6dc5-5200-46f2-88a7-e4af8b2927e2.png` | Vivienda minimalista frontal con estuco casi liso, grandes ventanales, entrada retranqueada y garaje. | `SCENE_FULL_FRONT` | Control de sutileza: evitar grano excesivo en acabado blanco liso. | Alta | No añadir garaje, volúmenes o huecos al modelo. | Sí |
| V-08 | `c112f716-7a3f-44da-814b-f1bebc73bd79.png` | Fachada rural blanca frontal, revoco irregular, acceso de arco y cubierta perimetral de teja. | `SCENE_FULL_FRONT` | Variación suave de superficial y respuesta mate. | Alta | Geometría ornamental no transferible a Rubik. | Sí |
| V-09 | `cf411fa9-18fe-461f-a98f-16673356e2cb.png` | Frente urbano envejecido con revoco desconchado, zócalo y persianas; lateral parcialmente visible. | `SCENE_FULL_OBLIQUE` | Referencia excluida del acabado nuevo; útil para detectar repetición artificial. | Alta | El deterioro no se aplicará a white_stucco ni sustituirá su identidad. | Sí |
| V-10 | `d8ec669c-8b2d-4d60-89f6-60dfa71a56c1.png` | Vivienda mediterránea oblicua con revoco claro, mampostería, porche y cubierta de teja. | `SCENE_FULL_OBLIQUE` | Luz rasante, continuidad en esquina y escala del microrelieve. | Alta | No importar porche, teja ni piedra a muros incompatibles. | Sí |
| V-11 | `dfb59322-707c-4dcb-84cd-5bed2d243b87.png` | Vivienda blanca frontal de formas redondeadas, revoco artesanal y pérgolas de madera. | `SCENE_FULL_FRONT` | Evaluar variación de rugosidad sin falsear geometría redondeada. | Alta | El normal map no debe simular cambios de plano inexistentes. | Sí |
| V-12 | `fd9cfd61-fb5b-4c54-b406-64b2d02bbb27.png` | Fachada moderna frontal de hormigón visto con grandes huecos y marquesinas. | `SCENE_FULL_FRONT` | Sólo referencia visual de hormigón; exclusión de la receta white_stucco. | Alta | No compatible semánticamente con `surface-white-plaster-02`. | Sí |

## Resultado de cobertura

- **9 escenas independientes verificadas:** 6 frontales y 3 oblicuas.
- **3 collages:** V-03, V-04 y V-06; cero escenas adicionales contabilizadas.
- **Déficit frente al objetivo histórico de 36:** 27 escenas originales.
- **Gate F03-1:** clasificación trazable completada. Esto no certifica licencia, autoría ni aceptación visual de una futura integración.
- Los 13 albedos y 9 mapas complementarios permanecen fuera de esta cuenta; los cuatro JPG históricos no publicados siguen inaccesibles desde el repositorio.
