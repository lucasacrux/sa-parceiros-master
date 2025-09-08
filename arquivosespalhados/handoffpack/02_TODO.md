# TODO — Frontend & Integração (Sprints)

## Sprint (opcional)  — Trust & Compare
- [ ] Substituir trust bar por uma versão muito premium.
- [ ] Segmentações do Compare do mobile 'vazando' para o lado
- [ ] Atualizar logos reais (SVG), tema dark e animações leves (CSS-only).
- [ ] Grid com logos reais, duo-tone no dark, hover brighten.
- [ ] Mobile com scroll-snap; desktop em mosaico responsivo.
## Sprint 1 - Continuacao do signup
- [ ] Fix do visualizar senha e confirmar senha (o olho não responde)
- [ ] Criar admin para gestão de cadastro de usuários, controle de roles e usuário master para dev e testes
- [ ] Avançar para cadastro de empresa/entidade que o usuário é o administrador (Encontrat sócios administradores ao subir contrato social, fazer aceite dos termos de uso, contratos, etc.)
- [ ] Criar mapa das features fremium e features pagas
- [ ] Fazer front do cadastro da empresa seguir para o front do cadastro da primeira carteira.
## Preparação para Backend
- [ ] Padronizar contratos de resposta (erros/OK) em `signup_post`/`login_post`.
- [ ] Mapear endpoints de: comunicação (SMS/e-mail/WhatsApp), pagamentos (Pix/Boleto/Cartão), dados (SERASA/Big Data), judicial.
- [ ] Criar placeholders visuais (badges/estados) para binding futuro.
## Sprint 3 — A11y & UX polish
- [ ] Revisar aria-atributos (tabs/accordion).
- [ ] Estados de foco e `prefers-reduced-motion`.
- [ ] Minificar CSS/JS (pipeline Django).
- [ ] Auditar Lighthouse e corrigir (≥95).