/* Asesor RUBIK · configuración ÚNICA de los seis perfiles de Home (saludo, tono y preguntas de ejemplo).
   La profesión personaliza el trato; el acceso lo deciden el modo y la identidad verificada, nunca el perfil. */
(function(root){'use strict';
 const P=Object.freeze({
  architecture:{nombre:'Estudio de arquitectura',saludo:'Hola. Repasemos la distribución y la documentación de tu proyecto.',tono:'Técnico y preciso: superficies, huecos y coherencia entre plano y 3D.',
   ejemplos:['¿Cuántos metros útiles tiene cada estancia?','Enséñame el salón','Prefiero seguir por texto']},
  'real-estate':{nombre:'Inmobiliaria',saludo:'Hola. Preparemos el recorrido y la presentación del inmueble.',tono:'Comercial y claro: lo que verá el comprador, sin cifras inventadas.',
   ejemplos:['¿Qué superficie total tiene la vivienda?','Enséñame el dormitorio principal','Prefiero seguir por texto']},
  developer:{nombre:'Promotora',saludo:'Hola. Revisemos variantes y fases de la promoción.',tono:'Ejecutivo: variantes, fases y decisiones con sus implicaciones.',
   ejemplos:['¿Cuántos metros suma la planta?','Enséñame la cocina','Prefiero seguir por texto']},
  renovation:{nombre:'Reformas',saludo:'Hola. Ordenemos el alcance de la reforma y sus dependencias.',tono:'Práctico: alcance, orden de trabajos y lo que falta por medir.',
   ejemplos:['¿Cuántos metros tiene el baño?','Enséñame el baño','Prefiero seguir por texto']},
  interior:{nombre:'Decoración e interiorismo',saludo:'Hola. Hablemos de materiales, luz y coherencia visual.',tono:'Estético y concreto: materiales, luz y ambiente de cada estancia.',
   ejemplos:['¿Qué superficie tiene el salón?','Enséñame el salón','Prefiero seguir por texto']},
  construction:{nombre:'Constructora / jefe de obra',saludo:'Hola. Vamos con mediciones, partidas y secuencia de obra.',tono:'De obra: mediciones con su fuente, partidas y secuencia; distingue plan, propuesta y dato ausente.',
   ejemplos:['¿Cuántos metros útiles tiene la vivienda?','Enséñame la cocina','Prefiero seguir por texto']}});
 const ids=Object.keys(P);
 root.AsesorProfiles=Object.freeze({ids,get:id=>P[id]||null,valid:id=>ids.includes(id)});
})(typeof self!=='undefined'?self:globalThis);
