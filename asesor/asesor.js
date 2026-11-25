(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const profiles = window.RubikAssistantUnified;
  const example = window.RubikAdvisorExample;
  const profile = byId('profile');
  const chips = byId('chips');
  const results = byId('results');
  const text = byId('text');
  const start = byId('start');
  const close = byId('close');
  const state = byId('state');
  const format = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  let active = false;
  let summary = '';

  for (const id of profiles.ids) profile.add(new Option(profiles.profile(id).nombre, id));
  const requested = new URLSearchParams(location.search).get('perfil');
  if (profiles.ids.includes(requested)) profile.value = requested;

  function showArea() {
    results.replaceChildren();
    const total = document.createElement('p');
    total.textContent = 'Superficie útil orientativa: ' + format.format(example.area) + ' m².';
    const list = document.createElement('ul');
    for (const room of example.rooms.filter(room => room.counted)) {
      const line = document.createElement('li');
      line.textContent = room.name + ': ' + format.format(room.area) + ' m²';
      list.append(line);
    }
    results.append(total, list);
    summary = 'Se consultaron las superficies de la vivienda de ejemplo.';
  }

  const plain = value => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  function findRoom(question) {
    const normalized = plain(question);
    return example.rooms.find(room => normalized.includes(plain(room.name)));
  }

  function showRoom(question) {
    const room = findRoom(question);
    results.textContent = room
      ? room.name + ' · Superficie orientativa: ' + format.format(room.area) + ' m². La imagen muestra la vivienda completa.'
      : 'Consulta el listado de superficies para ver todas las estancias del ejemplo.';
    if (room) summary = 'Se consultó: ' + room.name + '.';
  }

  function continueByText() {
    const transfer = window.AsesorMemory.handoff(summary);
    const payload = transfer.ok ? transfer.entrega : null;
    byId('handoff').textContent = payload
      ? [payload.nombrePreferido && 'Nombre: ' + payload.nombrePreferido, payload.resumen].filter(Boolean).join(' · ') || 'Sin contexto guardado.'
      : 'Continuación sin traspaso de datos.';
    text.hidden = false;
    state.textContent = 'Consulta por texto · sesión simulada';
    text.querySelector('h2').focus();
  }

  function paint() {
    const selected = profiles.profile(profile.value);
    document.querySelector('.profile-greeting').textContent = selected.saludo;
    byId('profile-tone').textContent = selected.tono;
    chips.replaceChildren();
    selected.ejemplos.forEach((question, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.dataset.profileExample = String(index);
      button.textContent = question;
      button.disabled = !active;
      button.addEventListener('click', () => {
        if (index === 2) continueByText();
        else if (/\bbano\b/.test(plain(question)) && !findRoom(question)) showArea();
        else if (index === 1 || findRoom(question)) showRoom(question);
        else showArea();
      });
      chips.append(button);
    });
  }

  function setActive(value) {
    active = value;
    profile.disabled = value;
    start.disabled = value;
    close.disabled = !value;
    text.hidden = true;
    results.replaceChildren();
    byId('handoff').textContent = '';
    summary = '';
    state.textContent = value ? 'Conversación iniciada · sesión simulada' : 'Conversación terminada';
    paint();
  }

  start.addEventListener('click', () => {
    setActive(true);
    chips.querySelector('button').focus();
  });
  close.addEventListener('click', () => {
    setActive(false);
    start.focus();
  });
  profile.addEventListener('change', paint);
  for (const id of ['memConsent', 'memErase', 'memHandoff']) {
    byId(id).addEventListener('change', () => {
      if (!byId('memConsent').checked || !byId('memHandoff').checked) byId('handoff').textContent = '';
    });
  }
  byId('memErase').addEventListener('click', () => { byId('handoff').textContent = ''; });
  paint();
})();
