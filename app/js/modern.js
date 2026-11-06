(function () {
  'use strict';
  function element(tag, className, text) {
    var node = document.createElement(tag); node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  window.addEventListener('load', function () {
    var icons = {
      arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 19 19 5M5 5h14v14"/></svg>',
      search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
      movies:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4l3 5m3-5 3 5"/></svg>',
      settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 3-1 3-3 1-2 3 2 2v3l3 1 1 3h5l1-3 3-1v-3l2-2-2-3-3-1-1-3z"/><circle cx="11.5" cy="11" r="3"/></svg>',
      channels:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/></svg>'
    };
    var home = document.getElementById('screen-home');
    var wordmark = element('div', 'modern-wordmark');
    wordmark.innerHTML = '<span class="modern-symbol">XT</span><div class="modern-name">Xuper<span>Tizen</span></div>';
    home.appendChild(wordmark);
    var observer = new MutationObserver(decorate);
    observer.observe(document.getElementById('home-pages'), { childList:true, subtree:true });
    function decorate() {
      home.querySelectorAll('.bento:not([data-modern-ready])').forEach(function (card) {
        card.setAttribute('data-modern-ready', 'true');
        var item = card._item;
        if (!item) return;
        var fallback = element('div', 'modern-card-fallback', (item.title || '').slice(0, 1));
        card.insertBefore(fallback, card.firstChild);
        if (!card.querySelector('.bento-title')) card.appendChild(element('div', 'bento-title', item.title));
        if (!card.querySelector('.bento-shade')) card.appendChild(element('div', 'bento-shade'));
        card.setAttribute('aria-label', item.title || 'Ver detalle');
      });
      var main = home.querySelector('.live-main');
      if (!main || main.querySelector('.modern-live-copy')) return;
      var copy = element('div', 'modern-live-copy');
      copy.innerHTML = '<div class="hero-kicker">DESCUBRE TU PRÓXIMO CANAL</div><h2>Una pantalla.<br>Mil posibilidades.</h2><p>Explora tus canales y encuentra<br>algo que quieras ver.</p><div class="hero-action"><span>OK</span> Abrir reproductor ' + icons.arrow + '</div>';
      main.appendChild(copy);
      var page = main.parentElement;
      var heading = element('div', 'modern-channel-heading');
      heading.innerHTML = 'Tus canales <span>EXPLORA EN DIRECTO</span>';
      page.appendChild(heading);
      var quick = element('section', 'modern-quick');
      quick.appendChild(element('h2', 'modern-section-title', 'Más cerca de lo que te gusta'));
      var grid = element('div', 'modern-quick-grid');
      var definitions = [
        [icons.search, 'Encuentra tu canal', 'Busca por nombre, sin perderte.', function () {
          __xuper.show('player'); __xuper.key(37);
          var search = document.querySelector('.pc-search');
          if (search && search._activate) search._activate();
        }],
        [icons.movies, 'Una buena película', 'Explora tu próxima historia.', function () { __xuper.selectTab(2); }],
        [icons.settings, 'A tu manera', 'Personaliza tu experiencia.', function () { __xuper.openSettings(); }]
      ];
      definitions.forEach(function (definition, index) {
        var card = element('button', 'modern-quick-card focusable');
        card.innerHTML = '<span class="quick-icon">' + definition[0] + '</span><span><strong>' + definition[1] + '</strong><small>' + definition[2] + '</small></span><span class="quick-arrow">' + icons.arrow + '</span>';
        card._activate = definition[3];
        card._onMove = function (direction) {
          if (direction === 'left' && index > 0) { __xuper.focus(grid.children[index-1]); return true; }
          if (direction === 'right' && index < 2) { __xuper.focus(grid.children[index+1]); return true; }
          if (direction === 'up') { __xuper.focus('.live-focus'); return true; }
          return false;
        };
        grid.appendChild(card);
      });
      quick.appendChild(grid); page.appendChild(quick);
      var menuLabels = ['TV en vivo', 'Destacados', 'Películas', 'Series', 'Kids', 'Anime', 'Novelas', 'Explorar', 'Historial'];
      home.querySelectorAll('.tab-item .tab-title').forEach(function (title, index) {
        title.textContent = menuLabels[index] || title.textContent;
      });
      var focus = page.querySelector('.live-focus');
      if (focus) {
        var originalMove = focus._onMove;
        focus._onMove = function (direction) {
          if (direction === 'down' && __xuper.state.channel >= __xuper.channels.length - 1) {
            __xuper.focus(grid.children[0]); return true;
          }
          return originalMove ? originalMove(direction) : false;
        };
      }
      [['search', icons.search, 'Buscar películas y series'], ['filter', icons.channels, 'Buscar canales'], ['personal', icons.settings, 'Ajustes']].forEach(function (item) {
        var control = home.querySelector('.notify-item.' + item[0]);
        if (!control) return;
        var glyph = control.querySelector('.n-normal');
        glyph.style.backgroundImage = 'none'; glyph.innerHTML = item[1];
        control.setAttribute('aria-label', item[2]);
        if (item[0] === 'filter') control._activate = definitions[0][3];
      });
    }
    decorate();

  });
})();
