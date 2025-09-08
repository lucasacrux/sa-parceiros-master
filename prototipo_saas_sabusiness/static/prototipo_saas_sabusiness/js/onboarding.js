// static/prototipo_saas_sabusiness/js/onboarding.js
(() => {
    const $  = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);
  
    // ===========================================================================
    // CONFIG
    // ===========================================================================
    const USE_REAL_APIS = false;
    const BACKEND_BASE  = "";
    const CNPJ_PROVIDER = "backend";
  
    function getCookie(name) {
      const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
      return m ? m.pop() : "";
    }
    const CSRF = getCookie("csrftoken");
  
    // ===========================================================================
    // STATE
    // ===========================================================================
    const state = {
      step: 1,
      cnpj: null,
      company: null,
      whatsapp: null,
      sentCode: null,
    };
  
    // ===========================================================================
    // UTILS
    // ===========================================================================
    const onlyDigits = (v) => String(v || "").replace(/\D+/g, "");
    const fmtCNPJ = (v) => {
      const s = onlyDigits(v).padStart(14, "0").slice(-14);
      return s.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    };
    const fmtPhoneBR = (v) => {
      const s = onlyDigits(v).slice(-11);
      if (s.length === 10) return s.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
      if (s.length === 11) return s.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
      return v;
    };
    const isValidCNPJ  = (v) => onlyDigits(v).length === 14;
    const isValidPhone = (v) => { const n = onlyDigits(v); return n.length === 10 || n.length === 11; };
  
    function maskCNPJLive(value) {
      const d = onlyDigits(value).slice(0, 14);
      let out = "";
      if (d.length <= 2) return d;
      out = d.slice(0, 2) + "." + d.slice(2);
      if (d.length > 5)  out = out.slice(0, 6) + "." + out.slice(6);
      if (d.length > 8)  out = out.slice(0, 10) + "/" + out.slice(10);
      if (d.length > 12) out = out.slice(0, 15) + "-" + out.slice(15);
      return out;
    }
    const setText = (el, t) => { if (el) el.textContent = t || ""; };
  
    // ===========================================================================
    // PROGRESS BAR FAILSAFE
    // ===========================================================================
    function ensureProgressBar() {
      const bar  = $(".wizard-progress");
      const fill = $("#wbFill");
      if (!bar || !fill) return;
  
      // se CSS não aplicou (altura 0), injeta estilos básicos
      if (!bar.offsetHeight) {
        bar.style.height = "6px";
        bar.style.background = "var(--border,#e5e7eb)";
        bar.style.borderRadius = "999px";
        bar.style.overflow = "hidden";
        bar.style.margin = "8px auto 14px";
        bar.style.maxWidth = "560px";
      }
      // garante estilo do fill e largura inicial
      if (!fill.style.height) fill.style.height = "100%";
      if (!fill.style.background) {
        fill.style.background = "linear-gradient(90deg,var(--brand,#5b7cfa),var(--brand-2,#22d3ee))";
      }
      if (!fill.style.transition) fill.style.transition = "width .2s ease";
      if (!fill.style.width) fill.style.width = "25%";
    }
  
    // ===========================================================================
    // APIs — MOCK vs REAL
    // ===========================================================================
    async function apiFetchCompany(cnpj) {
      if (!USE_REAL_APIS) {
        const s = onlyDigits(cnpj);
        await new Promise((r) => setTimeout(r, 650));
        const bank = {
          "00000000000191": { razao: "Empresa Exemplo S.A.", tipo: "S.A.",  situacao: "ATIVA"  },
          "11111111111111": { razao: "Demo Indústria Ltda.", tipo: "LTDA", situacao: "ATIVA"  },
          "22222222222222": { razao: "Comércio Fictício ME", tipo: "ME",   situacao: "INAPTA" },
        };
        const d = bank[s] || { razao: "Razão Social Demo Ltda.", tipo: "LTDA", situacao: "ATIVA" };
        return { cnpj: s, ...d };
      }
  
      const digits = onlyDigits(cnpj);
  
      if (CNPJ_PROVIDER === "brasilapi") {
        const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
        if (!resp.ok) throw new Error("Falha ao consultar CNPJ (BrasilAPI)");
        const data = await resp.json();
        const razao    = data.razao_social || data.nome_fantasia || "—";
        const tipo     = data.natureza_juridica || data.tipo || "—";
        const situacao = data.descricao_situacao_cadastral || data.situacao || "—";
        return { cnpj: digits, razao, tipo, situacao };
      }
  
      const resp = await fetch(`${BACKEND_BASE}/api/public/cnpj?${new URLSearchParams({ cnpj: digits })}`, {
        headers: { "Accept": "application/json" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Falha ao consultar CNPJ (backend)");
      const data = await resp.json();
      return {
        cnpj: digits,
        razao:    data.razao || data.razao_social || "—",
        tipo:     data.tipo  || data.natureza_juridica || "—",
        situacao: data.situacao || data.descricao_situacao_cadastral || "—",
      };
    }
  
    async function apiSendOtp(whatsappDigits) {
      if (!USE_REAL_APIS) {
        const code = String(Math.floor(Math.random() * 900000) + 100000);
        await new Promise((r) => setTimeout(r, 500));
        return { ok: true, code };
      }
  
      const resp = await fetch(`${BACKEND_BASE}/api/notify/wa/otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(CSRF ? { "X-CSRFToken": CSRF } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ phone: whatsappDigits }),
      });
      if (!resp.ok) throw new Error("Falha ao enviar OTP");
      return await resp.json();
    }
  
    async function apiVerifyOtp(whatsappDigits, code) {
      if (!USE_REAL_APIS) return { ok: String(code) === String(state.sentCode) };
  
      const resp = await fetch(`${BACKEND_BASE}/api/notify/wa/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(CSRF ? { "X-CSRFToken": CSRF } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ phone: whatsappDigits, code }),
      });
      if (!resp.ok) throw new Error("Falha ao verificar OTP");
      return await resp.json();
    }
  
    async function apiLinkCompanyToTenant({ cnpj, whatsapp }) {
      if (!USE_REAL_APIS) { await new Promise((r) => setTimeout(r, 350)); return { ok: true }; }
      const resp = await fetch(`${BACKEND_BASE}/api/tenant/company/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(CSRF ? { "X-CSRFToken": CSRF } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ cnpj: onlyDigits(cnpj), whatsapp: onlyDigits(whatsapp) }),
      });
      if (!resp.ok) throw new Error("Falha ao vincular empresa");
      return await resp.json();
    }
  
    // ===========================================================================
    // NAV / UI
    // ===========================================================================
    function markSteps() {
      $$("#obSteps .step").forEach((el) => {
        const n = Number(el.dataset.step);
        el.classList.toggle("done", n <= state.step);
        el.classList.toggle("active", n === state.step);
      });
  
      const p = $("#obProgress");
      if (p) p.textContent = `Etapa ${state.step} de 4`;
  
      const fill = $("#wbFill");
      if (fill) {
        const pct = Math.round((state.step / 4) * 100);
        fill.style.width = pct + "%";
        fill.style.setProperty("--pct", pct + "%");
        const bar = fill.parentElement;
        if (bar) bar.setAttribute("aria-valuenow", String(pct));
      }
    }
  
    function go(step) {
      state.step = Math.min(Math.max(step, 1), 4);
      ["#step1","#step2","#step3","#step4"].forEach((id) => { const el = $(id); if (el) el.hidden = true; });
      const panel = $(`#step${state.step}`);
      if (panel) panel.hidden = false;
      markSteps();
      if (USE_REAL_APIS) { const dh = $("#devHint"); if (dh) dh.style.display = "none"; }
    }
  
    // ===========================================================================
    // STEP 1
    // ===========================================================================
    $("#btnLookup")?.addEventListener("click", async (e) => {
      e.preventDefault();
      const cnpj = $("#cnpjInput")?.value || "";
      const msg  = $("#step1Msg");
  
      if (!isValidCNPJ(cnpj)) { setText(msg, "CNPJ inválido. Verifique e tente novamente."); return; }
  
      try {
        setText(msg, "Consultando dados da empresa...");
        const company = await apiFetchCompany(cnpj);
        state.cnpj = company.cnpj;
        state.company = company;
  
        const box = $("#companyBox");
        if (box) {
          box.innerHTML = `
            <div><strong>Razão social</strong><br>${company.razao}</div>
            <div><strong>CNPJ</strong><br><span style="font-family:monospace">${fmtCNPJ(company.cnpj)}</span></div>
            <div><strong>Tipo</strong><br>${company.tipo}</div>
            <div><strong>Situação</strong><br>${company.situacao}</div>
          `;
        }
        setText(msg, "");
        go(2);
      } catch (err) {
        setText(msg, "Não foi possível consultar agora. Tente novamente.");
      }
    });
  
    // ===========================================================================
    // STEP 2
    // ===========================================================================
    $("#btnChangeCnpj")?.addEventListener("click", () => {
      const input = $("#cnpjInput");
      if (input) input.value = "";
      state.cnpj = null;
      state.company = null;
      go(1);
    });
  
    $("#btnSendCode")?.addEventListener("click", async (e) => {
      e.preventDefault();
      const wa  = $("#waInput")?.value || "";
      const msg = $("#step2Msg");
  
      if (!isValidPhone(wa)) { setText(msg, "Número inválido. Informe DDD e número (10 ou 11 dígitos)."); return; }
  
      try {
        setText(msg, "Enviando código por WhatsApp...");
        const digits = onlyDigits(wa);
        const res = await apiSendOtp(digits);
  
        if (res && res.ok) {
          state.whatsapp = digits;
          if (!USE_REAL_APIS) {
            state.sentCode = res.code;
            const dh = $("#devHint"); const dc = $("#devCode");
            if (dh) dh.style.display = "block";
            if (dc) dc.textContent = state.sentCode;
          } else {
            const dh = $("#devHint"); if (dh) dh.style.display = "none";
          }
          setText(msg, `Código enviado para ${fmtPhoneBR(digits)}.`);
          setTimeout(() => go(3), 350);
        } else {
          setText(msg, "Falha ao enviar o código. Tente novamente.");
        }
      } catch (err) {
        setText(msg, "Não foi possível enviar agora. Tente de novo.");
      }
    });
  
    // ===========================================================================
    // STEP 3
    // ===========================================================================
    $("#btnVerify")?.addEventListener("click", async (e) => {
      e.preventDefault();
      const code = onlyDigits($("#codeInput")?.value || "");
      const msg  = $("#step3Msg");
  
      if (code.length !== 6) { setText(msg, "Digite os 6 dígitos do código."); return; }
  
      try {
        setText(msg, "Validando código...");
        const verify = await apiVerifyOtp(state.whatsapp, code);
        if (!verify || !verify.ok) { setText(msg, "Código incorreto ou expirado. Tente novamente."); return; }
  
        try { await apiLinkCompanyToTenant({ cnpj: state.cnpj, whatsapp: state.whatsapp }); } catch (_) {}
        setText(msg, "Código confirmado!");
        setTimeout(() => go(4), 250);
      } catch (err) {
        setText(msg, "Não foi possível validar agora. Tente novamente.");
      }
    });
  
    $("#btnResend")?.addEventListener("click", async (e) => {
      e.preventDefault();
      const msg = $("#step3Msg");
      try {
        setText(msg, "Reenviando código...");
        const res = await apiSendOtp(state.whatsapp);
        if (!res || !res.ok) { setText(msg, "Não foi possível reenviar agora. Tente novamente."); return; }
        if (!USE_REAL_APIS) {
          state.sentCode = res.code;
          const dh = $("#devHint"); const dc = $("#devCode");
          if (dh) dh.style.display = "block";
          if (dc) dc.textContent = state.sentCode;
        }
        setText(msg, "Novo código enviado.");
      } catch (err) {
        setText(msg, "Falha ao reenviar. Tente novamente.");
      }
    });
  
    // ===========================================================================
    // INIT
    // ===========================================================================
    // garante a barra mesmo sem CSS externo
    ensureProgressBar();
  
    const cnpjEl = $("#cnpjInput");
    if (cnpjEl) {
      cnpjEl.setAttribute("maxlength", "18");
      cnpjEl.setAttribute("autocomplete", "off");
      cnpjEl.setAttribute("inputmode", "numeric");
  
      const liveFormat = () => {
        const before = cnpjEl.value;
        const formatted = maskCNPJLive(before);
        cnpjEl.value = formatted;
        const end = cnpjEl.value.length;
        cnpjEl.setSelectionRange(end, end);
      };
      cnpjEl.addEventListener("input", liveFormat);
      cnpjEl.addEventListener("paste", () => setTimeout(liveFormat, 0));
  
      cnpjEl.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const allowed = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"];
        if (allowed.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
        const digits = onlyDigits(cnpjEl.value);
        const hasSelection = cnpjEl.selectionStart !== cnpjEl.selectionEnd;
        if (digits.length >= 14 && !hasSelection) e.preventDefault();
      });
  
      cnpjEl.value = maskCNPJLive(cnpjEl.value);
    }
  
    const initial = Number(document.body.dataset.initialStep || "1");
    go(isNaN(initial) ? 1 : initial);
  })();
  