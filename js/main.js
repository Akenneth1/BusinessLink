/* =========================================================================
   BusinessLink — main.js
   En-tête au défilement · menu mobile · apparitions · scrollspy · formulaire
   ========================================================================= */
(function () {
  'use strict';

  /* ---- Adresse de réception du formulaire ----------------------------
     Par défaut, le formulaire ouvre le logiciel de messagerie avec un
     e-mail pré-rempli (fonctionne sans serveur).
     Remplace l'adresse ci-dessous par la vraie adresse de l'association.
     Pour recevoir les messages directement dans la boîte mail sans ouvrir
     le client mail, voir la note en bas de ce fichier.
  --------------------------------------------------------------------- */
  var CONTACT_EMAIL = 'contact@artmodeetculture.com';

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initMobileMenu();
    initReveal();
    initScrollSpy();
    initForm();
    initYear();
  });

  /* ---- 1. En-tête : fond opaque après défilement -------------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- 2. Menu mobile ----------------------------------------------- */
  function initMobileMenu() {
    var toggle = document.querySelector('.nav__toggle');
    var links = document.querySelector('.nav__links');
    if (!toggle || !links) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    var setOpen = function (open) {
      toggle.classList.toggle('is-open', open);
      links.classList.toggle('is-open', open);
      backdrop.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', function () {
      setOpen(!links.classList.contains('is-open'));
    });
    backdrop.addEventListener('click', function () { setOpen(false); });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---- 3. Apparition au défilement ---------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---- 4. Scrollspy : lien actif selon la section ------------------- */
  function initScrollSpy() {
    var navLinks = Array.prototype.slice.call(
      document.querySelectorAll('.nav__link[href^="#"]')
    );
    if (!navLinks.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var sections = [];
    navLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) { map[id] = link; sections.push(sec); }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('is-active'); });
          var active = map[entry.target.id];
          if (active) active.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---- 5. Formulaire de contact : validation + envoi ---------------- */
  function initForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var feedback = form.querySelector('.form__feedback');

    var showError = function (field, message) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.add('has-error');
      var err = wrap.querySelector('.field__error');
      if (err) err.textContent = message;
    };
    var clearError = function (field) {
      var wrap = field.closest('.field');
      if (wrap) wrap.classList.remove('has-error');
    };

    // Nettoyage en temps réel
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () { clearError(el); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (feedback) feedback.classList.remove('is-shown');

      var name = form.elements['name'];
      var email = form.elements['email'];
      var service = form.elements['service'];
      var message = form.elements['message'];
      var valid = true;

      if (!name.value.trim()) { showError(name, 'Merci d’indiquer votre nom.'); valid = false; }

      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim()) {
        showError(email, 'Merci d’indiquer votre e-mail.'); valid = false;
      } else if (!emailRe.test(email.value.trim())) {
        showError(email, 'Cette adresse e-mail ne semble pas valide.'); valid = false;
      }

      if (!service.value) { showError(service, 'Choisissez un service.'); valid = false; }
      if (!message.value.trim()) { showError(message, 'Décrivez votre besoin en quelques mots.'); valid = false; }

      if (!valid) {
        var firstErr = form.querySelector('.has-error input, .has-error select, .has-error textarea');
        if (firstErr) firstErr.focus();
        return;
      }

      // Construction de l'e-mail (fonctionne sans serveur)
      var phone = form.elements['phone'] ? form.elements['phone'].value.trim() : '';
      var subject = 'Demande de devis — ' + service.value + ' — ' + name.value.trim();
      var bodyLines = [
        'Nom : ' + name.value.trim(),
        'E-mail : ' + email.value.trim(),
        'Téléphone : ' + (phone || 'non renseigné'),
        'Service souhaité : ' + service.value,
        '',
        'Message :',
        message.value.trim()
      ];
      var mailto = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));

      window.location.href = mailto;

      if (feedback) {
        feedback.innerHTML = '<b>Merci ' + escapeHtml(name.value.trim()) +
          '.</b> Votre logiciel de messagerie s’est ouvert avec votre demande pré-remplie — ' +
          'il ne reste plus qu’à l’envoyer. Si rien ne s’ouvre, écrivez-nous directement à ' +
          CONTACT_EMAIL + '.';
        feedback.classList.add('is-shown');
        feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---- 6. Année courante dans le pied de page ----------------------- */
  function initYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }
})();

/* =========================================================================
   POUR RECEVOIR LES MESSAGES DIRECTEMENT DANS UNE BOÎTE MAIL
   (sans ouvrir le logiciel de messagerie du visiteur)
   -------------------------------------------------------------------------
   Le formulaire utilise par défaut "mailto" : simple, sans serveur, mais le
   visiteur doit avoir un logiciel de messagerie configuré.
   Pour un envoi automatique vers une boîte mail, deux options gratuites :

   1) Web3Forms (https://web3forms.com) — créez une clé d'accès gratuite, puis
      dans index.html ajoutez à la balise <form> :
         action="https://api.web3forms.com/submit" method="POST"
      et un champ caché :
         <input type="hidden" name="access_key" value="VOTRE_CLE">
      Remplacez ensuite, dans initForm(), la ligne "window.location.href = mailto;"
      par un fetch() POST des données du formulaire vers cette action.

   2) Formspree (https://formspree.io) — créez un formulaire, récupérez l'URL
      d'endpoint et utilisez-la comme "action" du <form> (méthode POST).

   Je peux brancher l'une ou l'autre dès que vous avez créé le compte.
   ========================================================================= */
