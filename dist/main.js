import { createMatchaField } from './field.js';
import { copy, products } from './content.js';
let language = 'zh';
try { if (localStorage.getItem('ck-matcha-language') === 'en') language = 'en'; } catch {}
let selectedCategory = 'all';
let applicationTab = 'pure';
let currentDialog = null;
let preparedInquiry = false;
const t = key => copy[language][key];
const value = object => object[language];
const plus = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.2"/></svg>';
let field = { stir() {} };
try { field = createMatchaField(document.querySelector('#matcha-field')); }
catch { document.querySelector('.hero-art').classList.add('no-webgl'); }
document.querySelector('#stir-button').addEventListener('click', field.stir);
const menu = document.querySelector('.menu-toggle');
menu.addEventListener('click',()=>{const expanded=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(expanded));menu.setAttribute('aria-label',t(expanded?'menuClose':'menuOpen'));document.querySelector('#mobile-nav').hidden=!expanded;});
document.querySelectorAll('#mobile-nav a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');document.querySelector('#mobile-nav').hidden=true;}));

function renderCollection() {
  const selected = products.filter(p=>selectedCategory==='all'||p.categories.includes(selectedCategory));
  const guitea = selected.filter(p=>p.producer==='guitea');
  const ruisai = selected.filter(p=>p.producer==='ruisai');
  document.querySelector('#product-content').innerHTML = `
    <div class="collection-controls"><div class="collection-filters" role="group" aria-label="${t('applications')}">${['all','ceremony','beverage','culinary','heat'].map(c=>`<button type="button" data-filter="${c}" aria-pressed="${selectedCategory===c}">${t(c)}</button>`).join('')}</div><span class="result-count" aria-live="polite">${selected.length} ${t('showResults')}</span></div>
    <div class="product-grid">${guitea.map(p=>`<button type="button" class="product-card" data-product="${p.id}" aria-label="${value(p.name)} · ${t('viewSeries')}"><div class="product-photo"><img src="/images/${p.image}.webp" alt="${value(p.name)}" loading="lazy" width="998" height="438"/><span class="producer-tag">${t('guitea')}</span><span class="series-code" aria-hidden="true">${p.code}</span></div><div class="product-info"><div><h3>${value(p.name)}</h3><p>${value(p.description)}</p><span class="product-codes">${p.items.map(item=>item.code).join(' / ')}</span></div><span class="product-plus">${plus}</span></div></button>`).join('')}</div>
    ${ruisai.length?`<div class="ruisai-section"><div class="ruisai-heading"><span class="producer-title">${t('ruisai')}</span><p>${t('ruisaiIntro')}</p></div><div class="ruisai-grid">${ruisai.map(p=>`<button type="button" class="ruisai-card" data-product="${p.id}"><span class="ruisai-character" aria-hidden="true">${language==='zh'?p.code:p.enCode}</span><div><h3>${value(p.name)}</h3><p>${value(p.description)}</p></div><span class="product-plus">${plus}</span></button>`).join('')}</div></div>`:''}
    <p class="selection-note">${t('selectionNote')}</p>`;
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    selectedCategory=button.dataset.filter;renderCollection();document.querySelector(`[data-filter="${selectedCategory}"]`).focus({preventScroll:true});
  }));
  document.querySelectorAll('[data-product]').forEach(button=>button.addEventListener('click',()=>openProduct(button.dataset.product)));
}

function openProduct(id, preserveFocus=false) {
  currentDialog=id;
  const product=products.find(p=>p.id===id);
  const opener=document.activeElement;
  const container=document.querySelector('#dialog-container');
  if(container.querySelector('dialog')?.open)container.querySelector('dialog').close();
  container.innerHTML=`<dialog class="product-dialog" aria-labelledby="dialog-title"><div class="dialog-top"><span>${t(product.producer)} ${product.producer==='guitea'?`/ ${product.code} ${t('series')}`:''}</span><button type="button" class="close-dialog" aria-label="${t('close')}"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" stroke-width="1.3"/></svg></button></div>${product.image?`<img class="dialog-photo" src="/images/${product.image}.webp" alt="${value(product.name)}"/>`:''}<div class="dialog-content"><h2 id="dialog-title">${value(product.name)}</h2><p class="dialog-intro">${value(product.description)}</p><div class="variants">${product.items.map(item=>`<article class="variant"><h3>${language==='en'?item.code.split(' / 宋')[0].split(' · 明')[0].split(' / 烘焙')[0]:item.code}</h3><div><p>${value(item.description)}</p><p class="variant-use"><span>${t('applications')}</span>${value(item.application)}</p></div></article>`).join('')}</div>${product.note?`<p class="dialog-note">${t(product.note)}</p>`:''}<button type="button" class="button button-forest inquire-product">${t('askAbout')}</button></div></dialog>`;
  const dialog=container.querySelector('dialog');
  dialog.showModal();
  container.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{if(currentDialog===id)currentDialog=null;if(!preserveFocus&&opener?.isConnected)opener.focus({preventScroll:true});});
  container.querySelector('.inquire-product').addEventListener('click',()=>{dialog.close();document.querySelector('#inquiry-product').value=id;document.querySelector('#inquiry-result').hidden=true;preparedInquiry=false;location.hash='contact';document.querySelector('#inquiry-product').focus({preventScroll:true});});
}

function applicationMarkup() {
  const isPure=applicationTab==='pure',isLatte=applicationTab==='latte';
  const key=isPure?'appPure':isLatte?'appLatte':'appBake';
  const image=isPure?'ceremonial':isLatte?'matcha-liquid':'culinary';
  return `<div class="application-photo"><img src="/images/${image}.webp" alt="${t(key)}" loading="lazy" width="998" height="438"/></div><div class="application-copy"><h3>${t(key+'Title')}</h3><p>${t(key+'Copy')}</p><button class="text-link related-products" type="button">${t('related')}</button></div>`;
}

function renderRemaining(formValues={}) {
  document.querySelector('#remaining-content').innerHTML=`
    <section class="origin-section" id="origin" aria-labelledby="origin-title"><div class="origin-photo"><img src="/images/tea-garden.webp" alt="${t('originCaption')}" loading="lazy" width="998" height="556"/><span class="image-caption">${t('originCaption')}</span></div><div class="origin-copy"><p class="section-kicker">${t('originKicker')}</p><h2 id="origin-title">${t('originTitle')}</h2><p>${t('originCopy')}</p><span class="origin-coordinate" aria-hidden="true">Guizhou, China</span></div></section>
    <section class="craft-section section-space" aria-labelledby="craft-title"><div class="craft-heading"><h2 id="craft-title">${t('originDetailTitle')}</h2><p>${t('originDetail')}</p></div><div class="craft-details">${['garden','milling','documentation'].map((key,i)=>`<article><div class="craft-icon" aria-hidden="true">${i===0?'<svg viewBox="0 0 40 40" fill="none"><path d="M10 30V16l10-8 10 8v14M6 31h28M10 22h20M20 8v22" stroke="currentColor" stroke-width="1.2"/></svg>':i===1?'<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="1.2"/><circle cx="20" cy="20" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M20 3v6m0 22v6M3 20h6m22 0h6" stroke="currentColor" stroke-width="1.2"/></svg>':'<svg viewBox="0 0 40 40" fill="none"><path d="M10 5h15l5 5v25H10V5ZM25 5v6h5M15 18h10M15 23h10M15 28h7" stroke="currentColor" stroke-width="1.2"/></svg>'}</div><h3>${t(key)}</h3><p>${t(key+'Copy')}</p></article>`).join('')}</div></section>
    <section class="application-section section-space" aria-labelledby="application-title"><div class="section-heading"><div><p class="section-kicker">${t('applicationKicker')}</p><h2 id="application-title">${t('applicationTitle')}</h2></div><div class="application-tabs" role="tablist" aria-label="${t('applicationKicker')}">${['pure','latte','bake'].map((id,i)=>`<button type="button" id="tab-${id}" role="tab" aria-selected="${applicationTab===id}" aria-controls="application-panel" tabindex="${applicationTab===id?0:-1}" data-application="${id}">${t(['appPure','appLatte','appBake'][i])}</button>`).join('')}</div></div><div class="application-panel" id="application-panel" role="tabpanel" aria-labelledby="tab-${applicationTab}">${applicationMarkup()}</div></section>
    <section class="approach-section section-space" id="approach" aria-labelledby="approach-title"><div class="approach-intro"><p class="section-kicker">${t('approachKicker')}</p><h2 id="approach-title">${t('approachTitle')}</h2><p>${t('approachCopy')}</p><a class="text-link catalog-link" href="/catalogs/CK-Matcha-Collection-${language}.pdf" target="_blank" rel="noopener">${t('catalog')}<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3v9m-4-4 4 4 4-4M4 13v4h12v-4" stroke="currentColor" stroke-width="1.3"/></svg></a></div><ol class="approach-steps">${[1,2,3].map(i=>`<li><span class="step-number">0${i}</span><div><h3>${t('step'+i)}</h3><p>${t('step'+i+'Copy')}</p></div></li>`).join('')}</ol></section>
    <section class="contact-section section-space" id="contact" aria-labelledby="contact-title"><div class="contact-copy"><p class="section-kicker">${t('contactKicker')}</p><h2 id="contact-title">${t('contactTitle')}</h2><p>${t('contactCopy')}</p><div class="contact-links"><div><span>${t('email')}</span><a href="mailto:c.kcommercegroup@gmail.com">c.kcommercegroup@gmail.com</a></div><div><span>${t('phone')}</span><a href="tel:+13309685845">+1 (330) 968-5845</a></div></div><p class="contact-note">${t('contactNote')}</p></div><form class="inquiry-form" id="inquiry-form"><h3>${t('formTitle')}</h3><div class="form-field"><label for="inquiry-product">${t('productLabel')}</label><select id="inquiry-product" name="product"><option value="">${t('productPlaceholder')}</option>${products.map(p=>`<option value="${p.id}">${t(p.producer)} · ${p.producer==='guitea'?p.code+' / ':''}${value(p.name)}</option>`).join('')}</select></div><div class="form-field"><label for="inquiry-application">${t('applicationLabel')}</label><select id="inquiry-application" name="application" required><option value="">${t('applicationPlaceholder')}</option>${['ceremony','beverage','culinary','heat'].map(key=>`<option value="${key}">${t(key)}</option>`).join('')}</select></div><div class="form-row"><div class="form-field"><label for="inquiry-quantity">${t('quantityLabel')}</label><input id="inquiry-quantity" name="quantity" placeholder="${t('quantityPlaceholder')}" required maxlength="160"/></div><div class="form-field"><label for="inquiry-destination">${t('destinationLabel')}</label><input id="inquiry-destination" name="destination" placeholder="${t('destinationPlaceholder')}" required maxlength="160" autocomplete="off"/></div></div><div class="form-field"><label for="inquiry-note">${t('noteLabel')}</label><textarea id="inquiry-note" name="note" rows="2" placeholder="${t('notePlaceholder')}" maxlength="1500"></textarea></div><button class="button button-light" type="submit">${t('prepareEmail')}</button><p class="form-note">${t('privacyNote')}</p><div class="inquiry-result" id="inquiry-result" hidden aria-live="polite"><p>${t('emailReady')}</p><details><summary>${t('previewEmail')}</summary><pre id="inquiry-preview"></pre></details><a id="inquiry-email" class="button button-light">${t('openEmail')}</a></div></form></section>
    <footer class="site-footer"><div class="footer-top"><a class="brand" href="#"><span class="brand-mark">C&K<span class="brand-dot">.</span></span><span class="brand-name">Commerce<br/>Group</span></a><p>${t('footerTagline')}</p><a href="#" class="back-top">${t('backTop')}<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 17V4m-5 5 5-5 5 5" stroke="currentColor" stroke-width="1.2"/></svg></a></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} C&K Commerce Group</span><div><a href="/catalogs/CK-Matcha-Collection-zh.pdf" target="_blank" rel="noopener">${t('downloadZh')}</a><a href="/catalogs/CK-Matcha-Collection-en.pdf" target="_blank" rel="noopener">${t('downloadEn')}</a></div></div><p class="footer-note">${t('footerNote')}</p></footer>`;
  for(const [name,val] of Object.entries(formValues)){const input=document.querySelector(`[name="${name}"]`);if(input)input.value=val;}
  document.querySelectorAll('[data-application]').forEach(button=>{
    button.addEventListener('click',()=>selectApplication(button.dataset.application));
    button.addEventListener('keydown',e=>{const ids=['pure','latte','bake'];let index=ids.indexOf(applicationTab);if(e.key==='ArrowRight')index=(index+1)%3;else if(e.key==='ArrowLeft')index=(index+2)%3;else if(e.key==='Home')index=0;else if(e.key==='End')index=2;else return;e.preventDefault();selectApplication(ids[index]);document.querySelector('#tab-'+ids[index]).focus();});
  });
  bindRelated();
  document.querySelector('#inquiry-form').addEventListener('submit',e=>{e.preventDefault();prepareInquiry();});
  document.querySelector('#inquiry-form').addEventListener('input',()=>{preparedInquiry=false;document.querySelector('#inquiry-result').hidden=true;});
}

function selectApplication(id) {
  applicationTab=id;
  document.querySelectorAll('[data-application]').forEach(button=>{const active=button.dataset.application===id;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
  const panel=document.querySelector('#application-panel');panel.setAttribute('aria-labelledby','tab-'+id);panel.innerHTML=applicationMarkup();bindRelated();
}
function bindRelated(){document.querySelector('.related-products').addEventListener('click',()=>{selectedCategory=applicationTab==='pure'?'ceremony':applicationTab==='latte'?'beverage':'culinary';renderCollection();location.hash='collection';});}

function prepareInquiry() {
  const data=Object.fromEntries(new FormData(document.querySelector('#inquiry-form')));
  const product=products.find(p=>p.id===data.product);
  const body=[t('inquiryGreeting'),' ',`${t('inquiryProduct')}: ${product?t(product.producer)+' / '+(product.producer==='guitea'?product.code+' / ':'')+value(product.name):t('productPlaceholder')}`,`${t('inquiryApplication')}: ${t(data.application)}`,`${t('inquiryQuantity')}: ${data.quantity}`,`${t('inquiryDestination')}: ${data.destination}`,data.note?`${t('inquiryNote')}: ${data.note}`:'',' ',t('inquiryEnd')].filter(Boolean).join('\n');
  document.querySelector('#inquiry-preview').textContent=body;
  document.querySelector('#inquiry-email').href=`mailto:c.kcommercegroup@gmail.com?subject=${encodeURIComponent(t('inquirySubject'))}&body=${encodeURIComponent(body)}`;
  document.querySelector('#inquiry-result').hidden=false;preparedInquiry=true;
}

function applyLanguage() {
  const form=document.querySelector('#inquiry-form');const formValues=form?Object.fromEntries(new FormData(form)):{};const wasPrepared=preparedInquiry;const dialogId=currentDialog;
  document.documentElement.lang=language==='zh'?'zh-CN':'en';document.documentElement.dataset.language=language;
  document.title=language==='zh'?'C&K Commerce Group · 抹茶产品系列':'C&K Commerce Group · Matcha Collection';
  document.querySelector('meta[name="description"]').content=language==='zh'?'C&K Commerce Group 精选贵州抹茶，为茶道品鉴、茶饮开发与烘焙提供专业采购对接。':'Selected matcha from Guizhou, China. Discover Guitea and Ruisai collections for pure tea, beverages and culinary applications.';
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-html]').forEach(el=>{el.innerHTML=t(el.dataset.i18nHtml);});
  document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  document.querySelector('.brand').setAttribute('aria-label',language==='zh'?'C&K Commerce Group 首页':'C&K Commerce Group home');
  document.querySelector('.desktop-nav').setAttribute('aria-label',language==='zh'?'主导航':'Main navigation');
  document.querySelector('#mobile-nav').setAttribute('aria-label',language==='zh'?'移动导航':'Mobile navigation');
  menu.setAttribute('aria-label',t(menu.getAttribute('aria-expanded')==='true'?'menuClose':'menuOpen'));
  document.querySelector('#matcha-field').setAttribute('aria-label',t('canvasLabel'));
  document.querySelectorAll('.catalog-link').forEach(a=>a.href=`/catalogs/CK-Matcha-Collection-${language}.pdf`);
  renderCollection();renderRemaining(formValues);
  if(wasPrepared)prepareInquiry();
  if(dialogId)openProduct(dialogId,true);
  try{localStorage.setItem('ck-matcha-language',language);}catch{}
}
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{if(language===button.dataset.language)return;language=button.dataset.language;applyLanguage();}));
applyLanguage();
