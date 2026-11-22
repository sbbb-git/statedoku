// Statedoku, the application form of the internship pages (22 November 2026).
// Asks /api/apply whether it can send; if so, draws the form, otherwise tells
// the candidate to email the application. The résumé is read in the browser
// and sent as base64 inside JSON (the endpoint takes JSON only). Nothing is
// kept here: no localStorage, no cookie.
(function () {
  'use strict';
  var box = document.getElementById('apply-form');
  if (!box) return;
  var role = box.getAttribute('data-role');
  var title = box.getAttribute('data-title');
  var EMAIL = 'contact@statedoku.com';
  var MAX = 4 * 1024 * 1024;

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (text) e.textContent = text;
    return e;
  }

  function fallback(lead) {
    box.textContent = '';
    var p = el('p');
    p.appendChild(document.createTextNode((lead ? lead + ' ' : '') + 'Email your résumé (PDF) and your five lines to '));
    var a = el('a', { href: 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Application: ' + title) }, EMAIL);
    p.appendChild(a);
    p.appendChild(document.createTextNode(' with the subject line "Application: ' + title + '".'));
    box.appendChild(p);
  }

  function field(form, id, label, input) {
    var l = el('label', { for: id }, label);
    input.id = id;
    form.appendChild(l);
    form.appendChild(input);
    return input;
  }

  function draw() {
    var f = el('form', { class: 'apply-form', novalidate: '' });
    var name = field(f, 'ap-name', 'Full name', el('input', { type: 'text', name: 'name', autocomplete: 'name', maxlength: '100', required: '' }));
    var mail = field(f, 'ap-email', 'Email', el('input', { type: 'email', name: 'email', autocomplete: 'email', maxlength: '254', required: '' }));
    var link = field(f, 'ap-link', 'LinkedIn, GitHub or portfolio (optional)', el('input', { type: 'url', name: 'link', maxlength: '300', placeholder: 'https://' }));
    var ans = field(f, 'ap-answer', 'Your five lines', el('textarea', { name: 'answer', maxlength: '1500', required: '' }));
    var cv = field(f, 'ap-cv', 'Résumé (PDF, 4 MB at most)', el('input', { type: 'file', name: 'cv', accept: 'application/pdf,.pdf', required: '' }));
    var keepL = el('label', { class: 'check' });
    var keep = el('input', { type: 'checkbox', name: 'keep' });
    keepL.appendChild(keep);
    keepL.appendChild(document.createTextNode('You may keep my application for a future opening, two years at most.'));
    f.appendChild(keepL);
    // Honeypot: hidden from people and screen readers, filled by bots.
    var hpWrap = el('div', { class: 'hp', 'aria-hidden': 'true' });
    var hp = el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off' });
    hpWrap.appendChild(hp);
    f.appendChild(hpWrap);
    var btn = el('button', { type: 'submit' }, 'Send my application');
    f.appendChild(btn);
    var status = el('p', { class: 'apply-status', role: 'status', 'aria-live': 'polite' });
    f.appendChild(status);

    function say(msg, kind) { status.textContent = msg; status.className = 'apply-status' + (kind ? ' ' + kind : ''); }

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var file = cv.files && cv.files[0];
      if (name.value.trim().length < 2) { say('Please give your full name.', 'err'); name.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) { say('Please check your email address.', 'err'); mail.focus(); return; }
      if (link.value.trim() && !/^https?:\/\/\S{3,}$/i.test(link.value.trim())) { say('The link must start with https://', 'err'); link.focus(); return; }
      if (ans.value.trim().length < 20) { say('Please write your five lines.', 'err'); ans.focus(); return; }
      if (!file) { say('Please attach your résumé as a PDF.', 'err'); cv.focus(); return; }
      if (file.size > MAX) { say('Your résumé is larger than 4 MB. Please send a lighter PDF.', 'err'); cv.focus(); return; }
      if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') { say('Your résumé must be a PDF.', 'err'); cv.focus(); return; }
      btn.disabled = true;
      say('Sending...');
      var rd = new FileReader();
      rd.onerror = function () { btn.disabled = false; say('Your résumé could not be read. Please try another file.', 'err'); };
      rd.onload = function () {
        var data = String(rd.result).replace(/^data:[^,]*,/, '');
        fetch('/api/apply', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            role: role, name: name.value, email: mail.value, link: link.value, answer: ans.value,
            keep: keep.checked, website: hp.value, cv: { name: file.name, data: data }
          })
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; });
        }).then(function (res) {
          if (res.status === 200 && res.body.ok) {
            box.textContent = '';
            box.appendChild(el('p', { class: 'apply-status ok', role: 'status' },
              'Thank you, your application has arrived. A confirmation email is on its way to ' + mail.value.trim() + '.'));
            return;
          }
          btn.disabled = false;
          var e = res.body && res.body.error;
          if (res.status === 429) say('Too many attempts from here. Please try again in an hour.', 'err');
          else if (e === 'too_large' || res.status === 413) say('Your résumé is too large. Please send a PDF under 4 MB.', 'err');
          else if (e === 'cv_type') say('That file is not a PDF. Please attach your résumé as a PDF.', 'err');
          else if (e === 'email') say('Please check your email address.', 'err');
          else if (res.status === 503) fallback('The form is closed at the moment.');
          else fallback('Your application could not be sent.');
        }).catch(function () { btn.disabled = false; fallback('Your application could not be sent.'); });
      };
      rd.readAsDataURL(file);
    });

    box.textContent = '';
    box.appendChild(f);
  }

  fetch('/api/apply', { headers: { accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : { ready: false }; })
    .then(function (j) { if (j && j.ready) draw(); else fallback(); })
    .catch(function () { fallback(); });
})();
