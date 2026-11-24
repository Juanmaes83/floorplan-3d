const translations = {
  es: {
    title: 'Consultar servicios y rutas', notice: 'Cada consulta envía a Google las coordenadas de la parcela. Los resultados se muestran durante esta sesión.',
    code: 'Código de acceso', nearby: 'Buscar servicios cercanos', street: 'Comprobar Street View',
    walk: 'A pie', drive: 'En coche', route: 'Calcular desde la parcela',
    denied: 'El código de acceso no es válido.', unavailable: 'Las consultas aún no están activadas en este entorno.',
    quota: 'Se alcanzó el límite diario de consultas.', provider: 'Google no ha devuelto un resultado. Puedes usar el enlace externo.',
    waiting: 'Consultando…', empty: 'No se encontraron servicios en el radio de 1,2 km.',
    streetYes: 'Hay Street View cerca de la parcela.', streetNo: 'Google no encontró Street View cerca de este punto.',
    noRoute: 'Google no encontró una ruta.', mode: 'Modo de desplazamiento', date: 'Fecha de la imagen'
  },
  en: {
    title: 'Check services and routes', notice: 'Each lookup sends the parcel coordinates to Google. Results are shown for this session.',
    code: 'Access code', nearby: 'Find nearby services', street: 'Check Street View',
    walk: 'Walking', drive: 'Driving', route: 'Calculate from parcel',
    denied: 'The access code is invalid.', unavailable: 'Lookups are disabled in this environment.',
    quota: 'Daily lookup limit reached.', provider: 'Google returned no result. You can use the external link.',
    waiting: 'Looking up…', empty: 'No services found within 1.2 km.',
    streetYes: 'Street View is available near the parcel.', streetNo: 'Google found no Street View near this point.',
    noRoute: 'Google found no route.', mode: 'Travel mode', date: 'Image date'
  },
  zh: {
    title: '查询周边服务与路线', notice: '每次查询都会向 Google 发送地块坐标。结果仅在当前会话中显示。',
    code: '访问代码', nearby: '查询周边服务', street: '检查街景',
    walk: '步行', drive: '驾车', route: '从地块计算',
    denied: '访问代码无效。', unavailable: '此环境尚未启用查询。',
    quota: '已达到每日查询上限。', provider: 'Google 未返回结果。可以使用外部链接。',
    waiting: '正在查询…', empty: '未找到 1.2 公里范围内的服务。',
    streetYes: '地块附近可查看街景。', streetNo: 'Google 未找到此处附近的街景。',
    noRoute: 'Google 未找到路线。', mode: '出行方式', date: '图像日期'
  }
};

export function mountContextQueries(host, [longitude, latitude], language) {
  const labels = translations[language] || translations.es;
  const locale = language === 'zh' ? 'zh-CN' : language === 'en' ? 'en' : 'es';
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const el = (tag, parent, text) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    parent.append(node);
    return node;
  };
  const button = (parent, text, id) => {
    const node = el('button', parent, text);
    node.type = 'button';
    node.className = 'btn';
    node.id = id;
    return node;
  };
  const details = el('details', host);
  el('summary', details, labels.title);
  el('p', details, labels.notice);
  const label = el('label', details, labels.code);
  const code = el('input', label);
  code.type = 'password';
  code.maxLength = 200;
  code.autocomplete = 'off';
  code.id = 'territoryContextCode';
  const actions = el('div', details);
  actions.className = 'territory-orthophoto-actions';
  const nearby = button(actions, labels.nearby, 'territoryNearby');
  const street = button(actions, labels.street, 'territoryStreetCheck');
  const status = el('p', details);
  status.id = 'territoryContextStatus';
  status.setAttribute('role', 'status');
  const attribution = el('p', details, 'Google Maps');
  attribution.hidden = true;
  const results = el('ul', details);
  results.id = 'territoryNearbyResults';
  const streetResult = el('p', details);
  const scope = new AbortController();
  let active = false;
  function sync() {
    const disabled = active || code.value.length < 32;
    nearby.disabled = street.disabled = disabled;
    for (const action of results.querySelectorAll('button')) action.disabled = disabled;
  }
  async function query(action, fields = {}) {
    if (active || code.value.length < 32) return null;
    active = true;
    status.textContent = labels.waiting;
    sync();
    try {
      const response = await fetch('/api/places-context', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: scope.signal,
        headers: { 'Content-Type': 'application/json', 'X-Rubik-Context-Code': code.value },
        body: JSON.stringify({ action, latitude, longitude, language: locale, ...fields })
      });
      if (!response.ok) {
        status.textContent = ({ 401: labels.denied, 429: labels.quota, 502: labels.provider })[response.status] || labels.unavailable;
        return null;
      }
      const data = await response.json();
      if (scope.signal.aborted) return null;
      attribution.hidden = false;
      status.textContent = '';
      return data;
    } catch {
      if (!scope.signal.aborted) status.textContent = labels.unavailable;
      return null;
    } finally {
      active = false;
      sync();
    }
  }
  nearby.onclick = async () => {
    results.replaceChildren();
    const data = await query('nearby');
    if (!data) return;
    if (!data.places.length) status.textContent = labels.empty;
    for (const place of data.places) {
      const item = el('li', results);
      el('strong', item, place.name);
      if (place.address) el('p', item, place.address);
      for (const credit of place.credits) {
        if (!credit.url) el('span', item, credit.name);
        else {
          const link = el('a', item, credit.name);
          link.href = credit.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
      }
      const modeLabel = el('label', item, labels.mode);
      const mode = el('select', modeLabel);
      for (const [key, display] of [['WALK', labels.walk], ['DRIVE', labels.drive]]) mode.add(new Option(display, key));
      const calculate = button(item, labels.route, 'context-route-' + results.children.length);
      const routeResult = el('output', item);
      routeResult.setAttribute('aria-live', 'polite');
      mode.onchange = () => { routeResult.textContent = ''; };
      calculate.onclick = async () => {
        routeResult.textContent = '';
        const selectedMode = mode.value;
        mode.disabled = true;
        const route = await query('route', { placeId: place.id, mode: selectedMode });
        mode.disabled = false;
        if (route) routeResult.textContent = route.available
          ? number.format(route.meters / 1000) + ' km · ' + number.format(route.seconds / 60) + ' min'
          : labels.noRoute;
      };
    }
    sync();
  };
  street.onclick = async () => {
    streetResult.textContent = '';
    const data = await query('street');
    if (data) streetResult.textContent = data.available
      ? labels.streetYes + (data.date ? ' ' + labels.date + ' · ' + data.date : '')
      : labels.streetNo;
  };
  code.oninput = sync;
  sync();
  return () => { scope.abort(); code.value = ''; details.remove(); };
}
