// SaiuAcordo • home interactions (v21)
(() => {
    console.info("[SA] home_interactions.js v21 loaded");
  
    const byId = (id) => document.getElementById(id);
    const qs   = (sel, el = document) => (el ? el.querySelector(sel) : null);
    const qsa  = (sel, el = document) => (el ? Array.from(el.querySelectorAll(sel)) : []);
  
    // Fallbacks: se o base não bindou tema/menu, bindamos aqui
    const ensureThemeAndMenu = () => {
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
      } catch (e) { console.error("[SA] home fallback theme error:", e); }
  
      try {
        const menuBtn = byId("menuToggle");
        const mobileMenu = byId("mobileMenu");
        const toggleMenu = (open) => {
          if (!mobileMenu) return;
          const willOpen = (typeof open === "boolean") ? open : mobileMenu.hasAttribute("hidden");
          mobileMenu.toggleAttribute("hidden", !willOpen);
          if (menuBtn) menuBtn.setAttribute("aria-expanded", String(willOpen));
          document.body.classList[willOpen ? "add" : "remove"]("menu-open");
        };
        if (menuBtn && !menuBtn.dataset.bound) {
          menuBtn.dataset.bound = "1";
          menuBtn.addEventListener("click", () => toggleMenu());
        }
        if (mobileMenu) qsa("a", mobileMenu).forEach(a => a.addEventListener("click", () => toggleMenu(false)));
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMenu(false); });
      } catch (e) { console.error("[SA] home fallback menu error:", e); }
    };
    ensureThemeAndMenu();
  
    /* ====== COMPARE (tabs – escopado) =================================== */
    try {
      const cmp = document.querySelector(".compare.hybrid") || document.querySelector(".compare");
      if (cmp) {
        const rSem   = qs("#tab-sem", cmp);
        const rCom   = qs("#tab-com", cmp);
        const semCol = qs(".col.sem, #cmp-sem", cmp) || byId("cmp-sem");
        const comCol = qs(".col.com, #cmp-com", cmp) || byId("cmp-com");
  
        const setCompare = () => {
          const showCom = !!(rCom && rCom.checked);
          if (comCol) comCol.toggleAttribute("hidden", !showCom);
          if (semCol) semCol.toggleAttribute("hidden",  showCom);
          cmp.setAttribute("data-state", showCom ? "com" : "sem");
        };
  
        ["click","input","change"].forEach(ev => {
          rSem && rSem.addEventListener(ev, setCompare);
          rCom && rCom.addEventListener(ev, setCompare);
        });
        setCompare(); // 1º paint
      }
    } catch (e) {
      console.error("[SA] compare error:", e);
    }
  
    /* ====== AUTOMATIZE: abas t1/t2/t3 ================================== */
    try {
      const autoPanels = qsa(".auto-panel");
      const radios = ["t1","t2","t3"].map(byId).filter(Boolean);
  
      const setAuto = () => {
        const activeRadio = radios.find(r => r.checked) || radios[0];
        const activeId = activeRadio ? activeRadio.id : null;
        autoPanels.forEach(p => p.toggleAttribute("hidden", p.dataset.id !== activeId));
      };
  
      radios.forEach(r => r.addEventListener("change", setAuto));
      setAuto();
    } catch (e) {
      console.error("[SA] automate tabs error:", e);
    }
  
    /* ====== ACCORDION (FAQ) ============================================ */
    try {
      qsa(".accordion .acc-head").forEach(head => {
        head.addEventListener("click", () => {
          const item = head.closest(".acc-item");
          const body = qs(".acc-body", item);
          const nowOpen = item?.classList.toggle("open");
          body?.toggleAttribute("hidden", !nowOpen);
        });
      });
    } catch (e) {
      console.error("[SA] faq error:", e);
    }
  
    /* ====== HOTFIXS (home) ============================================= */
    try {
      // (1) Copy do herói sempre visível
      qsa(".sa-home .hero-copy").forEach(el => {
        el.style.display = "block";
        el.style.visibility = "visible";
      });
  
      // (2) Sticky CTA mobile: só depois de rolar um pouco
      const hero = qs(".sa-home .hero");
      const mobileCta = qs(".sa-home .mobile-bottom-cta");
      if (mobileCta) {
        const show = (v) => {
          mobileCta.style.opacity = v ? "1" : "0";
          mobileCta.style.pointerEvents = v ? "auto" : "none";
          mobileCta.style.transform = v ? "translateY(0)" : "translateY(8px)";
          mobileCta.style.transition = "opacity .18s ease, transform .18s ease";
        };
  
        if ("IntersectionObserver" in window && hero) {
          const io = new IntersectionObserver((entries) => {
            const r = entries[0]?.intersectionRatio ?? 1;
            show(r < 0.35);
          }, { threshold: [0, .35, 1] });
          io.observe(hero);
        } else {
          const onScroll = () => show((window.scrollY || 0) > 140);
          window.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
        }
      }
    } catch (e) {
      console.error("[SA] hotfix error:", e);
    }
  })();
  