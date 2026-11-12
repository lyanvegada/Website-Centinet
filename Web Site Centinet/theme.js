(function () {
  'use strict';

  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: light)');
  var saved = null;
  var explicit = false;

  try {
    saved = localStorage.getItem('centinet-theme');
    explicit = saved === 'light' || saved === 'dark';
  } catch (_) {}

  function apply(theme) {
    root.dataset.theme = theme;
    var button = document.querySelector('.theme-toggle');
    var meta = document.querySelector('meta[name="theme-color"]');

    if (button) {
      var isLight = theme === 'light';
      button.setAttribute('aria-label', isLight ? 'Activar modo oscuro' : 'Activar modo claro');
      button.setAttribute('aria-pressed', String(isLight));
      button.setAttribute('title', isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
    }
    if (meta) meta.content = theme === 'light' ? '#f7f7fb' : '#080910';
  }

  apply(explicit ? saved : (media.matches ? 'light' : 'dark'));

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;

    apply(root.dataset.theme || 'dark');
    button.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      explicit = true;
      try { localStorage.setItem('centinet-theme', next); } catch (_) {}
      apply(next);
    });
  });

  if (media.addEventListener) {
    media.addEventListener('change', function (event) {
      if (!explicit) apply(event.matches ? 'light' : 'dark');
    });
  }
}());
