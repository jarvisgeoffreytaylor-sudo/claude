(function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Quote form: validation only. Not connected to a backend yet.
  // TODO: set the form action to a real endpoint (Formspree, Netlify Forms, etc.)
  // and replace the block below with a fetch() submit or remove preventDefault.
  var form = document.getElementById('quote-form');
  var status = document.getElementById('form-status');
  if (form && status) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      ['name', 'phone', 'email'].forEach(function (id) {
        var el = form.elements[id];
        var ok = el.value.trim() !== '' && (id !== 'email' || /^\S+@\S+\.\S+$/.test(el.value));
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = el;
      });
      status.className = 'form-status';
      if (bad) {
        status.classList.add('error');
        status.textContent = 'Please complete the required fields with valid details.';
        bad.focus();
        return;
      }
      status.classList.add('info');
      status.textContent = 'This form is not connected yet, so your request was not sent. Please call or email us instead.';
    });
  }
})();
