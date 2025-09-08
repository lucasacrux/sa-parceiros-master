# SAIUACORDO • Business — Hand-off & Plano de Continuidade

Este pacote contém:
- **01_CONTEXT.md** — resumo do que foi feito e status atual.
- **02_TODO.md** — próximos passos focados no front e integração futura com as APIs.
- **07_js/home_interactions.additions.js** — opcional (UX extra; não é obrigatório se já usa `home_interactions.js v21`).
- **08_PROMPT.txt** — prompt de abertura para um novo chat com estes arquivos.

> **Como usar**
> 1) Importe estes arquivos no novo chat.
> 2) Na sua base de código, substitua/adicione somente os blocos indicados.
> 3) Mantenha `sa_business.js?v=3` no `base.html` e `home_interactions.js?v=21` na Home.
> 4) Faça hard refresh após trocar (Ctrl/Cmd + Shift + R).

---

## Arquivos que devem estar no contexto do novo chat

- `templates/prototipo_saas_sabusiness/base.html` (com `<script defer src=".../sa_business.js?v=3">` e **Footer Pro**)
- `templates/prototipo_saas_sabusiness/home.html` (hero + trust + compare + automate + faq + final cta + sticky cta)
- `templates/prototipo_saas_sabusiness/signup.html`
- `templates/prototipo_saas_sabusiness/login.html`
- `static/prototipo_saas_sabusiness/css/sa_business.css`
- `static/prototipo_saas_sabusiness/css/home_overrides.css`
- `static/prototipo_saas_sabusiness/js/sa_business.js` (v3)
- `static/prototipo_saas_sabusiness/js/home_interactions.js` (v21)
- (opcional) `prototipo_saas_sabusiness/urls.py`, `prototipo_saas_sabusiness/views.py`

---

## Status atual (resumo)

- Navbar fixa + tema (claro/escuro) + menu mobile → **ok** (JS base no `base.html`).
- Home: hero com copy/CTA, trust (simples), compare híbrido, automate (tabs), FAQ, final CTA, sticky CTA mobile → **ok**.
- Login/Signup: visual coerente, tamanhos refinados (desktop ~60px, mobile ~52px), validações mínimas → **ok**.
- URLs/Views: corrigidas (`login_view` vs `login`), `signup_post`/`login_post` com mensagens → **ok**.

---

> O JS de tabs já está em `home_interactions.js v21`. Nada adicional é necessário.

---

## Observações de integração (APIs do CTO)

- Signup/Login já preparados para POST.
- Compare “Com SA Business” lista **quatro pilares**: Comunicação, Cobrança, Pagamentos, Judicial/CRM & Dados (fácil “data-bind” futuro).
- Trust bar possui slots para logos **SVG** e métricas — trocar os placeholders ao integrar.
