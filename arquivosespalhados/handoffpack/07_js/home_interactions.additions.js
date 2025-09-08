// Opcional: micro-UX para o compare híbrido (sombras/anim ao trocar estado)
(() => {
  const cmp = document.querySelector('.compare.hybrid');
  if (!cmp) return;
  const rSem = cmp.querySelector('#tab-sem');
  const rCom = cmp.querySelector('#tab-com');
  const setState = () => cmp.setAttribute('data-state', rCom && rCom.checked ? 'com' : 'sem');
  ['change','input','click'].forEach(ev => {
    rSem && rSem.addEventListener(ev, setState);
    rCom && rCom.addEventListener(ev, setState);
  });
  setState();
})();
