(function () {
  'use strict';

  var doc = document;
  var header = doc.getElementById('site-header');
  var nav = doc.getElementById('site-nav');
  var menuButton = doc.querySelector('.menu-toggle');
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.site-nav a[href^="#"]'));
  var year = doc.getElementById('current-year');

  if (year) year.textContent = String(new Date().getFullYear());

  function closeMenu() {
    if (!nav || !menuButton) return;
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
  }

  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      var isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      nav.classList.toggle('is-open', !isOpen);
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
    });
    navLinks.forEach(function (link) { link.addEventListener('click', closeMenu); });
    doc.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeMenu(); });
    doc.addEventListener('click', function (event) {
      if (nav.classList.contains('is-open') && !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Reveal sections only when browser motion support is available.
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    doc.documentElement.classList.add('js-ready');
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    doc.querySelectorAll('.reveal').forEach(function (element) { revealObserver.observe(element); });
  }

  // Keep the active navigation item in sync with the current section.
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          var active = link.getAttribute('href') === '#' + id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    ['plataforma', 'como-funciona', 'seguridad', 'planes'].forEach(function (id) {
      var section = doc.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  // Plan cards preselect the matching plan in the proposal form.
  var planSelect = doc.getElementById('plan-select');
  doc.querySelectorAll('[data-plan]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (planSelect) planSelect.value = link.getAttribute('data-plan');
    });
  });

  // The static website prepares a shareable request; it does not transmit data.
  var form = doc.getElementById('proposal-form');
  var status = doc.getElementById('form-status');
  var output = doc.getElementById('request-output');
  var copyButton = doc.getElementById('copy-request');

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function fallbackCopy(text) {
    if (!output) return false;
    output.hidden = false;
    output.value = text;
    output.focus();
    output.select();
    try { return doc.execCommand('copy'); } catch (_) { return false; }
  }

  function copyRequest() {
    if (!output || !output.value) return;
    var text = output.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus('Solicitud copiada. Ya puedes compartirla con el equipo Centinet.');
      }).catch(function () {
        var copied = fallbackCopy(text);
        setStatus(copied ? 'Solicitud copiada. Ya puedes compartirla con el equipo Centinet.' : 'Selecciona el texto de la solicitud y cópialo para compartirlo.');
      });
    } else {
      var copied = fallbackCopy(text);
      setStatus(copied ? 'Solicitud copiada. Ya puedes compartirla con el equipo Centinet.' : 'Selecciona el texto de la solicitud y cópialo para compartirlo.');
    }
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var request = [
        'SOLICITUD DE INFORMACIÓN — CENTINET',
        '',
        'Nombre: ' + String(data.get('name') || '').trim(),
        'Empresa: ' + String(data.get('company') || '').trim(),
        'Correo: ' + String(data.get('email') || '').trim(),
        'Plan de interés: ' + String(data.get('plan') || 'Por definir'),
        '',
        'Entorno / necesidades:',
        String(data.get('needs') || 'Por conversar.').trim() || 'Por conversar.'
      ].join('\n');

      output.value = request;
      output.hidden = false;
      copyButton.hidden = false;
      setStatus('Tu solicitud está lista. Cópiala y compártela por el canal oficial de Centinet.');
      copyRequest();
    });
  }

  if (copyButton) copyButton.addEventListener('click', copyRequest);

  // CTF flag validation. The PDF answer key is stored as SHA-256 digests,
  // so the expected flags are not exposed as readable strings in the page.
  var flagDigests = {
    '1': 'f41d70d4675424b0478c4b7c62a6275d49ed64578fc58b6e29e9242ac1277532',
    '2': 'b603a952bc3841ba23777ec551f11e7ec792958adc59f11619272e58cdeb1fdb',
    '3': 'ae134533c75fe295692e2e531f4e508f46d0fb8105e5377c30e3fe2c678b734e',
    '4': 'b9b320ab96e46c10e5fc57f903ad594d33a5a9fad1ccba79fe25dde75dee99fc'
  };

  // Compact SHA-256 implementation keeps flag checking functional even on
  // a local or HTTP-hosted static page where Web Crypto may be unavailable.
  var sha256RoundConstants = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  function rotateRight(value, bits) {
    return (value >>> bits) | (value << (32 - bits));
  }

  function sha256(value) {
    var encoded = unescape(encodeURIComponent(value));
    var byteLength = encoded.length;
    var bitLength = byteLength * 8;
    var paddedLength = Math.ceil((byteLength + 9) / 64) * 64;
    var bytes = new Uint8Array(paddedLength);
    var i;

    for (i = 0; i < byteLength; i += 1) bytes[i] = encoded.charCodeAt(i);
    bytes[byteLength] = 0x80;

    var highBits = Math.floor(bitLength / 0x100000000);
    var lowBits = bitLength >>> 0;
    for (i = 0; i < 4; i += 1) {
      bytes[paddedLength - 8 + i] = (highBits >>> (24 - i * 8)) & 0xff;
      bytes[paddedLength - 4 + i] = (lowBits >>> (24 - i * 8)) & 0xff;
    }

    var hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var words = new Uint32Array(64);

    for (var offset = 0; offset < paddedLength; offset += 64) {
      for (i = 0; i < 16; i += 1) {
        var position = offset + i * 4;
        words[i] = ((bytes[position] << 24) | (bytes[position + 1] << 16) |
          (bytes[position + 2] << 8) | bytes[position + 3]) >>> 0;
      }

      for (i = 16; i < 64; i += 1) {
        var x = words[i - 15];
        var y = words[i - 2];
        var sigma0 = rotateRight(x, 7) ^ rotateRight(x, 18) ^ (x >>> 3);
        var sigma1 = rotateRight(y, 17) ^ rotateRight(y, 19) ^ (y >>> 10);
        words[i] = (words[i - 16] + sigma0 + words[i - 7] + sigma1) >>> 0;
      }

      var a = hash[0], b = hash[1], c = hash[2], d = hash[3];
      var e = hash[4], f = hash[5], g = hash[6], h = hash[7];

      for (i = 0; i < 64; i += 1) {
        var sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
        var choose = (e & f) ^ (~e & g);
        var temp1 = (h + sum1 + choose + sha256RoundConstants[i] + words[i]) >>> 0;
        var sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
        var majority = (a & b) ^ (a & c) ^ (b & c);
        var temp2 = (sum0 + majority) >>> 0;

        h = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }

      hash[0] = (hash[0] + a) >>> 0;
      hash[1] = (hash[1] + b) >>> 0;
      hash[2] = (hash[2] + c) >>> 0;
      hash[3] = (hash[3] + d) >>> 0;
      hash[4] = (hash[4] + e) >>> 0;
      hash[5] = (hash[5] + f) >>> 0;
      hash[6] = (hash[6] + g) >>> 0;
      hash[7] = (hash[7] + h) >>> 0;
    }

    return hash.map(function (word) { return word.toString(16).padStart(8, '0'); }).join('');
  }

  doc.querySelectorAll('[data-flag-check]').forEach(function (flagForm) {
    var challenge = flagForm.getAttribute('data-flag-check');
    var input = flagForm.querySelector('input[name="flag"]');
    var feedback = flagForm.querySelector('.ctf-flag-feedback');
    var submit = flagForm.querySelector('button[type="submit"]');
    if (!input || !feedback || !submit || !flagDigests[challenge]) return;

    input.addEventListener('input', function () {
      flagForm.classList.remove('is-correct', 'is-incorrect');
      feedback.textContent = '';
      feedback.removeAttribute('data-state');
    });

    flagForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var answer = input.value.trim();
      flagForm.classList.remove('is-correct', 'is-incorrect');

      if (!answer) {
        flagForm.classList.add('is-incorrect');
        feedback.textContent = 'Escribe la flag antes de comprobarla.';
        input.focus();
        return;
      }

      submit.disabled = true;
      feedback.textContent = 'Comprobando…';

      try {
        var correct = sha256(answer) === flagDigests[challenge];
        flagForm.classList.add(correct ? 'is-correct' : 'is-incorrect');
        feedback.textContent = correct
          ? '✓ ¡Correcta! Has completado este reto.'
          : '✕ Flag incorrecta. Revisa el valor e inténtalo de nuevo.';
        feedback.setAttribute('data-state', correct ? 'correct' : 'incorrect');
      } catch (_) {
        flagForm.classList.add('is-incorrect');
        feedback.textContent = 'No se pudo procesar la respuesta. Revisa el texto e inténtalo de nuevo.';
      } finally {
        submit.disabled = false;
      }
    });
  });
}());
