/* CoolCalci Phase 1 monetization UX. Payment/auth/entitlements are intentionally not active yet. */
(function(){
  const billingKey='coolcalci_billing_preview_v1';
  const overlay=document.getElementById('pricingOverlay');
  const openers=document.querySelectorAll('[data-open-pricing]');
  const close=document.getElementById('closePricing');
  const billingButtons=document.querySelectorAll('[data-billing]');
  const priceAmount=document.getElementById('monthlyPrice');
  const priceSuffix=document.querySelector('#proCta')?.closest('.price-card')?.querySelector('.price small');
  const annualNote=document.getElementById('annualNote');
  const proCta=document.getElementById('proCta');
  const usageCount=document.getElementById('usageCount');
  const usageBar=document.getElementById('usageBar');
  if(!overlay) return;
  const open=()=>{overlay.classList.add('open');document.body.style.overflow='hidden'};
  const shut=()=>{overlay.classList.remove('open');document.body.style.overflow=''};
  openers.forEach(b=>b.addEventListener('click',open));
  close?.addEventListener('click',shut);
  overlay.addEventListener('click',e=>{if(e.target===overlay)shut()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')shut()});
  let billing=localStorage.getItem(billingKey)||'monthly';
  function renderBilling(){
    billingButtons.forEach(b=>b.classList.toggle('active',b.dataset.billing===billing));
    if(priceAmount) priceAmount.textContent=billing==='annual'?'$50':'$5';
    if(priceSuffix) priceSuffix.textContent=billing==='annual'?'/ year':'/ month';
    if(annualNote) annualNote.textContent=billing==='annual'?'Save $10 vs monthly billing':'Best value · $50/year';
    if(proCta){proCta.dataset.checkout=billing;proCta.textContent=billing==='annual'?'Choose Pro yearly':'Choose Pro monthly'}
  }
  billingButtons.forEach(b=>b.addEventListener('click',()=>{billing=b.dataset.billing;localStorage.setItem(billingKey,billing);renderBilling()}));
  renderBilling();
  document.querySelectorAll('[data-checkout]').forEach(b=>b.addEventListener('click',()=>{
    const t=document.getElementById('toast');if(!t)return;
    t.textContent=(b.dataset.checkout==='annual'?'Annual Pro selected':'Monthly Pro selected')+' · Payments activate in Phase 3';
    t.classList.add('show');clearTimeout(window.__ccToast);window.__ccToast=setTimeout(()=>t.classList.remove('show'),2200);
  }));
  const usage=Number(localStorage.getItem('coolcalci_usage_preview_v1')||'0');
  const cap=3;
  if(usageCount) usageCount.textContent=Math.min(usage,cap)+' / '+cap+' free today';
  if(usageBar) usageBar.style.width=Math.min(100,(usage/cap)*100)+'%';
  window.CoolCalciPhase1={openPricing:open,closePricing:shut,billing:()=>billing,phase:'1'};
})();