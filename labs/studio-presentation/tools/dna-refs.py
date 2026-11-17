# AnyDesign (6 layers + ONE brand thing + Art-Direction QA) × Design DNA (design_system / design_style / visual_effects)
# applied to the A-grade references of reports/03, one DNA per deliverable family. Brand System Skill rule:
# "extract the logic of a reference, do not copy its identity" — each reference gets ONE explicit role.
import json,sys
NOFX={"enabled":False,"reason":"Documento impreso/PDF: sin efectos de render (Design DNA visual_effects desactivado)"}
D={
 "architecture-sheet":{"refs":{"R22":"retícula: planos a la izquierda, franja de cajetín a la derecha","R03":"cajetín vertical con número de lámina grande","R09":"filas ortogonales planta/alzado con escala por vista","R27":"comparación actual/propuesta lado a lado (pendiente: no hay versión 'actual')"},
  "one_brand_thing":"El dibujo es el protagonista: planta vectorial a escala con cuadro de superficies y cajetín normalizado.",
  "design_system":{"color":"tinta única + gris de tabiquería; acento petróleo #205b60 solo en número de lámina","typography":"sans técnica única (Inter) con tnum; serif solo en título del cuadro","spacing":"marco 10 mm, cajetín 180×50 mm (IFC Sheet)","layout":"dibujo 2/3 izquierda, cuadro + leyenda derecha, cajetín abajo-derecha","shape":"rectas, sin radios","elevation":"ninguna (plano)"},
  "design_style":{"aesthetic":{"mood":"preciso, sobrio","genre":"documentación técnica"},"composition":{"hierarchy_method":"tamaño del dibujo","balance_type":"asimétrico","negative_space_role":"separar dibujo de datos"},"imagery":{"illustration_style":"línea técnica, gruesos por tipo de muro"}},
  "qa_pass":{"color_voltage":"un único momento cromático: número de lámina","weight_ceiling":"700 solo en cajetín y totales","legend":"tira horizontal inferior (Diagram Design)"},"visual_effects":NOFX},
 "interior-book":{"refs":{"R36":"ritmo de páginas: portada, estancias, piezas clave, materiales","R13":"pliego de libro: visión, distribución, paleta","R46":"lámina única de vistas + muestras + planta + lista numerada","R10":"calma A4 apaisado, mucho blanco"},
  "one_brand_thing":"La geometría real del proyecto (axonometría y planta) abre el libro; las vistas 3D la acompañan, rotuladas como modelo, nunca como foto.",
  "design_system":{"color":"tokens RUBIK (tinta #2d332f, papel #fffdf8, filete #cbc2b3); acento arcilla #875936 (estilo cliente)","typography":"Source Serif 4 para titular y lectura; Inter para datos","layout":"12 columnas A4 apaisado, márgenes 16 mm, pie con identidad/revisión/página"},
  "design_style":{"aesthetic":{"mood":"sereno, residencial","genre":"libro de proyecto"},"composition":{"hierarchy_method":"una idea por página","flow_direction":"de lo general (axonometría) a lo particular (estancias, materiales)"},"imagery":{"photo_treatment":"vistas 3D sin retoque, siempre con pie de procedencia"}},
  "qa_pass":{"density_alternation":"página de cifras densa ↔ página de imagen a sangre","image_treatment":"todas con pie de procedencia"},"visual_effects":NOFX},
 "materials-furniture-book":{"refs":{"R19":"tabla de compra con medidas y proveedor (proveedor: no disponible → explícito)","R46":"muestras + lista numerada","R17":"numeración de piezas M-01…","R20":"muestra de color junto a su uso"},
  "one_brand_thing":"Cada material y cada objeto es una fila verificable: medida, estancia y referencia (o su ausencia declarada).",
  "design_system":{"color":"muestras = color del material en el modelo; resto en tinta","typography":"Inter tabular para tablas; serif para titulares","layout":"columna narrativa 4/12 + tabla 8/12"},
  "design_style":{"aesthetic":{"mood":"inventario honesto"},"composition":{"grouping_strategy":"por estancia"}},
  "qa_pass":{"feedback_restraint":"'sin referencia' en cursiva gris, no en color de alarma"},"visual_effects":NOFX},
 "commercial-proposal":{"refs":{"R25":"portada sobria con estudio + estimación en tabla","R06":"alcance y tabla de honorarios con fases","R30":"cifra total protagonista","R13":"propuesta con capítulos y total"},
  "one_brand_thing":"La cifra total grande, con su estado ('pendiente de revisión') escrito al lado.",
  "design_system":{"color":"tinta; acento arcilla solo en la cifra total","typography":"Inter 700 tabular para cifras; serif para títulos","layout":"tabla 8/12 + resumen 4/12"},
  "design_style":{"aesthetic":{"mood":"claro, contractual"},"brand_voice_in_ui":{"tone":"preciso","empty_state_approach":"sección vacía declarada (condiciones no facilitadas)"}},
  "qa_pass":{"color_voltage":"un único acento en el total"},"visual_effects":NOFX},
 "real-estate":{"refs":{"R04":"página de cifras grandes con rango y procedencia","R41":"simulación de precio en tabla (solo la parte reforma: el resto no existe en RUBIK)","R33":"antes/después en plantas (pendiente: no hay 'antes')","R11":"axonometría como pieza explicativa"},
  "one_brand_thing":"Cifras grandes calculadas sobre el modelo, cada una con su origen debajo.",
  "design_system":{"color":"tinta #2d332f como acento (estilo inmobiliario RUBIK)","typography":"Inter 700 para cifras, serif para titulares","layout":"cifras en rejilla 3×3 sobre 7/12"},
  "design_style":{"aesthetic":{"mood":"directo, comercial sin exagerar"},"composition":{"focal_strategy":"cifras"}},
  "qa_pass":{"absent_by_design":"sin precio de venta, ubicación ni certificado: declarado, no inventado"},"visual_effects":NOFX},
}
json.dump({"schema":"rubik-studio-lab.design-dna","version":1,"method":["anydesign@b0ca769 analysis-framework 6 capas + QA pass","design-dna@9d9d795 schema 3 dimensiones","brand-system-skill@30f6084 'extract the logic, do not copy identity' + un rol por referencia"],"deliverables":D},open(sys.argv[1],'w'),ensure_ascii=False,indent=1)
print('ok',len(D))
