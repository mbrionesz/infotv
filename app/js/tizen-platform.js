(function () {
  'use strict';
  // Chrome 56 (Tizen 4.0) lacks globalThis and Promise.finally.
  if (typeof window.globalThis === 'undefined') window.globalThis = window;
  if (!String.prototype.padStart) String.prototype.padStart = function (length, value) {
    var text = String(this), padding = String(value === undefined ? ' ' : value);
    if (!padding) return text;
    while (text.length < length) text = padding + text;
    return text.slice(text.length - Math.max(length, String(this).length));
  };
  if (!Promise.prototype.finally) Promise.prototype.finally = function (callback) {
    return this.then(function (value) { return Promise.resolve(callback()).then(function () { return value; }); }, function (error) {
      return Promise.resolve(callback()).then(function () { throw error; });
    });
  };
  var previous = 0;
  document.addEventListener('keydown', function (event) {
    if(window.XuperStandalone&&window.XuperStandalone.handleRemote(event)){event.preventDefault();event.stopImmediatePropagation();return;}
    if (event.keyCode === 10009) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (window.__xuper) window.__xuper.key(461);
    } else if (event.repeat && event.keyCode >= 37 && event.keyCode <= 40) {
      var now = performance.now();
      if (now - previous < 85) { event.preventDefault(); event.stopImmediatePropagation(); } else previous = now;
    }
  }, true);
  document.addEventListener('keyup', function (event) {
    if (event.keyCode === 10009) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  try {
    ['MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaStop', 'MediaRewind', 'MediaFastForward','ChannelUp','ChannelDown','ColorF0Red','ColorF1Green','ColorF2Yellow','ColorF3Blue'].forEach(function (key) {
      try { tizen.tvinputdevice.registerKey(key); } catch (_) {}
    });
  } catch (_) {}
  window.webOSTV = { platformBack: function () {
    try { if (window.XuperPlayer) window.XuperPlayer.stop(); tizen.application.getCurrentApplication().exit(); } catch (_) {}
  }};
  window.addEventListener('pagehide', function () { if (window.XuperPlayer) window.XuperPlayer.stop(); });
  window.addEventListener('load', function () {
    var playerScreen = document.getElementById('screen-player');
    new MutationObserver(function () {
      if (!playerScreen.classList.contains('is-active') && !playerScreen.classList.contains('is-mini') && window.XuperPlayer) window.XuperPlayer.stop();
    }).observe(playerScreen, { attributes:true, attributeFilter:['class'] });
    var smooth = document.getElementById('psv-btn-p1');
    if (smooth) { smooth.style.display = 'none'; smooth.classList.remove('focusable'); }
    var normal = document.getElementById('psv-btn-p2');
    if (normal) normal.textContent = 'Automático Samsung';
    var help = document.querySelector('.psv-mode-help');
    if (help) help.textContent = 'La compatibilidad de imagen y audio depende del formato de la señal y de tu televisor.';
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) { record.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        var images = node.matches('img') ? [node] : node.querySelectorAll('img');
        images.forEach(function (image) { image.decoding = 'async'; });
      }); });
    });
    observer.observe(document.getElementById('app'), { childList:true, subtree:true });
  });
})();
