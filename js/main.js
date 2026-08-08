document.addEventListener("DOMContentLoaded", function () {

  /* Keep fixed header below the dev-notice banner, whatever its height */
  var notice = document.querySelector(".dev-notice");
  var header = document.getElementById("siteHeader");
  function positionHeader() {
    if (notice && header) {
      header.style.top = notice.offsetHeight + "px";
    }
  }
  window.addEventListener("resize", positionHeader);
  positionHeader();
  function updateHeader() {
    if (!header || header.classList.contains("is-solid")) return;
    if (window.scrollY > 40) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  window.addEventListener("scroll", updateHeader);
  updateHeader();

  /* Mobile nav toggle */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navToggle.classList.toggle("active");
      navLinks.classList.toggle("is-open");
    });
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navToggle.classList.remove("active");
        navLinks.classList.remove("is-open");
      });
    });
  }

  /* Si una foto todavia no existe, se quita y queda el placeholder a rayas */
  document.querySelectorAll(".ph-media img").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) {
      img.remove();
      return;
    }
    img.addEventListener("error", function () { img.remove(); });
  });

  /* Marca el enlace del menu segun la seccion visible */
  var spyLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a[href^="#"]:not(.nav-cta)')
  );
  var spySections = spyLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  function updateActiveLink() {
    if (!spySections.length) return;
    var offset = (header ? header.offsetHeight : 0) + 80;
    var currentId = spySections[0].id;
    spySections.forEach(function (sec) {
      if (sec.getBoundingClientRect().top <= offset) currentId = sec.id;
    });
    /* Al final de la pagina, marca siempre la ultima seccion */
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
      currentId = spySections[spySections.length - 1].id;
    }
    spyLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + currentId);
    });
  }
  window.addEventListener("scroll", updateActiveLink);
  window.addEventListener("resize", updateActiveLink);
  updateActiveLink();

  /* Hero slider */
  var slides = document.querySelectorAll(".hero-slide");
  var dots = document.querySelectorAll(".hero-dot");
  var prevBtn = document.getElementById("heroPrev");
  var nextBtn = document.getElementById("heroNext");
  var current = 0;
  var timer;

  function goTo(index) {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      s.classList.toggle("is-active", i === current);
    });
    dots.forEach(function (d, i) {
      d.classList.toggle("is-active", i === current);
    });
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    clearInterval(timer);
    timer = setInterval(next, 6500);
  }

  if (slides.length) {
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); startAutoplay(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); startAutoplay(); });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { goTo(i); startAutoplay(); });
    });
    startAutoplay();
  }

  /* ==========================================================
     ANIMACIONES DE SCROLL
     ========================================================== */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion) {

    /* --- Cascada: numera los hijos de [data-stagger] con --i --- */
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var kids = group.querySelectorAll(":scope > [data-reveal]");
      kids.forEach(function (kid, i) {
        kid.style.setProperty("--i", i);
      });
    });

    /* --- Text reveal: envuelve el contenido para poder enmascararlo --- */
    document.querySelectorAll('[data-reveal="mask"]').forEach(function (el) {
      var inner = document.createElement("span");
      inner.className = "reveal-mask-inner";
      /* innerHTML y no textContent: hay titulos con <span class="accent"> */
      inner.innerHTML = el.innerHTML;
      el.innerHTML = "";
      el.appendChild(inner);
    });

    /* --- Scroll reveal --- */
    var revealables = document.querySelectorAll("[data-reveal]");

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          /* una sola vez: al revelarse deja de observarse */
          io.unobserve(entry.target);
        });
      }, {
        /* se dispara un poco antes de que el elemento toque el borde */
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.12
      });
      revealables.forEach(function (el) { io.observe(el); });
    } else {
      /* Sin soporte, se muestra todo sin animar */
      revealables.forEach(function (el) { el.classList.add("is-revealed"); });
    }

    /* --- Parallax --- */
    var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    var heroSection = document.querySelector(".hero");
    var heroSlides = document.querySelectorAll(".hero-slide");
    var ticking = false;

    function applyParallax() {
      var vh = window.innerHeight;

      parallaxEls.forEach(function (el) {
        var box = el.getBoundingClientRect();
        /* solo se calcula lo que esta a la vista */
        if (box.bottom < -200 || box.top > vh + 200) return;
        var speed = parseFloat(el.dataset.parallax) || 0.12;
        /* -1 arriba de la pantalla, 0 al centro, +1 abajo */
        var progress = (box.top + box.height / 2 - vh / 2) / vh;
        el.style.setProperty("--py", (progress * speed * 100).toFixed(2) + "px");
      });

      /* El fondo del hero se mueve mas lento que el contenido */
      if (heroSection) {
        var y = window.scrollY;
        if (y < vh * 1.2) {
          heroSlides.forEach(function (s) {
            s.style.setProperty("--hero-py", (y * 0.28).toFixed(1) + "px");
          });
        }
      }

      ticking = false;
    }

    function onScrollParallax() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyParallax);
    }

    if (parallaxEls.length || heroSection) {
      window.addEventListener("scroll", onScrollParallax, { passive: true });
      window.addEventListener("resize", onScrollParallax);
      applyParallax();
    }

  } else {
    /* Movimiento reducido: todo visible de entrada */
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-revealed");
    });
  }

  /* Contact form (front-end only placeholder) */
  var contactForm = document.getElementById("contactForm");
  var formNote = document.getElementById("formNote");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (formNote) {
        formNote.textContent = "Formulario de ejemplo: conecta un backend o servicio de email para recibir estos mensajes de verdad.";
      }
      contactForm.reset();
    });
  }

});
