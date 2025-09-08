// SaiuAcordo • base UI script (v3)
(() => {
  console.info("[SA] sa_business.js v3 loaded");

  const byId = (id) => document.getElementById(id);
  const qs   = (sel, el = document) => (el ? el.querySelector(sel) : null);
  const qsa  = (sel, el = document) => (el ? Array.from(el.querySelectorAll(sel)) : []);

  const toggleClass = (el, cls, force) => {
    if (!el) return;
    if (typeof force === "boolean") {
      force ? el.classList.add(cls) : el.classList.remove(cls);
    } else {
      el.classList.toggle(cls);
    }
  };

  /* ===== THEME TOGGLE (todas as páginas) ============================== */
  try {
    const themeBtn = byId("themeToggle");
    const docEl = document.documentElement;
    const getTheme = () => docEl.getAttribute("data-theme") || "light";
    const setTheme = (t) => {
      docEl.setAttribute("data-theme", t);
      try { localStorage.setItem("ui.theme", t); } catch(e){}
    };

    if (themeBtn && !themeBtn.dataset.bound) {
      themeBtn.dataset.bound = "1";
      themeBtn.addEventListener("click", () => {
        setTheme(getTheme() === "dark" ? "light" : "dark");
      });
    }
  } catch (e) {
    console.error("[SA] theme error:", e);
  }

  /* ===== MOBILE MENU =================================================== */
  try {
    const menuBtn = byId("menuToggle");
    const mobileMenu = byId("mobileMenu");

    const toggleMenu = (open) => {
      if (!mobileMenu) return;
      const willOpen = (typeof open === "boolean") ? open : mobileMenu.hasAttribute("hidden");
      mobileMenu.toggleAttribute("hidden", !willOpen);
      if (menuBtn) menuBtn.setAttribute("aria-expanded", String(willOpen));
      toggleClass(document.body, "menu-open", willOpen);
    };

    if (menuBtn && !menuBtn.dataset.bound) {
      menuBtn.dataset.bound = "1";
      menuBtn.addEventListener("click", () => toggleMenu());
    }

    if (mobileMenu) {
      qsa("a", mobileMenu).forEach(a => a.addEventListener("click", () => toggleMenu(false)));
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") toggleMenu(false);
    });

    // Reset ao ir para desktop
    const mq = window.matchMedia("(min-width: 961px)");
    const onMQ = () => {
      if (mq.matches) {
        if (mobileMenu && !mobileMenu.hasAttribute("hidden")) mobileMenu.setAttribute("hidden", "");
        toggleClass(document.body, "menu-open", false);
        if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
      }
    };
    if (mq.addEventListener) mq.addEventListener("change", onMQ);
    else if (mq.addListener) mq.addListener(onMQ); // fallback
    onMQ();
  } catch (e) {
    console.error("[SA] menu error:", e);
  }

  /* ===== Sombra suave no header ao rolar (opcional) ==================== */
  try {
    const navbar = byId("navbar");
    if (navbar) {
      const onScroll = () => {
        const y = window.scrollY || 0;
        navbar.style.boxShadow = y > 6 ? "0 4px 16px rgba(0,0,0,.06)" : "none";
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  } catch {}
})();
