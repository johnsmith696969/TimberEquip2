'use strict';

/**
 * Generates the self-contained JavaScript for the <fes-dealer-inventory> Web Component.
 * Served by GET /api/public/dealer-widget.js
 *
 * Capabilities:
 *  - 4 card styles: fes-native, grid, list, compact
 *  - Shadow DOM CSS encapsulation
 *  - Lightbox detail view with image carousel
 *  - Inline inquiry form (POSTs to public inquiry endpoint)
 *  - tel: call link
 *  - "Load More" pagination
 *  - Responsive grid via ResizeObserver
 *  - Configurable via data-* attributes or remote widget-config
 */

function renderDealerWidgetScript(appUrl) {
  const API = String(appUrl || '').replace(/\/+$/, '');

  return `(function(){"use strict";
if(customElements.get('fes-dealer-inventory'))return;

var API_BASE=${JSON.stringify(API)};

/* ── Helpers ────────────────────────────────────────────── */
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function fmt(n){return typeof n==='number'?n.toLocaleString('en-US'):String(n||'');}
function fmtPrice(n,c){c=c||'USD';try{return new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:0}).format(n);}catch(e){return '$'+fmt(n);}}
function pmt(price){if(!price||price<=0)return 0;var r=0.06/12,n=60;return Math.round(price*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1));}
function amvPct(price,amv){if(!amv||amv<=0||!price)return null;return((price-amv)/amv*100);}

/* ── CSS ────────────────────────────────────────────────── */
function buildCSS(cfg){
  var accent=cfg.accentColor||'#16A34A';
  var font=cfg.fontFamily||'system-ui,-apple-system,sans-serif';
  var dark=cfg.darkMode;
  var bg=dark?'#0C0A09':'#FFFFFF';
  var surface=dark?'#1C1917':'#F5F5F4';
  var ink=dark?'#FAFAF9':'#1C1917';
  var muted=dark?'#A8A29E':'#78716C';
  var line=dark?'#292524':'#E7E5E4';
  var data='#10B981';

  return \`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:host{display:block;font-family:\${font};color:\${ink};background:\${bg};--accent:\${accent};--bg:\${bg};--surface:\${surface};--ink:\${ink};--muted:\${muted};--line:\${line};--data:\${data};}

/* Grid */
.fes-grid{display:grid;gap:16px;}
.fes-grid.cols-1{grid-template-columns:1fr;}
.fes-grid.cols-2{grid-template-columns:repeat(2,1fr);}
.fes-grid.cols-3{grid-template-columns:repeat(3,1fr);}
.fes-grid.cols-4{grid-template-columns:repeat(4,1fr);}

/* Card base */
.fes-card{background:var(--bg);border:1px solid var(--line);display:flex;flex-direction:column;overflow:hidden;transition:transform .2s,border-color .2s;cursor:pointer;}
.fes-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--accent) 35%,transparent);}

/* Image */
.fes-card-img{position:relative;aspect-ratio:4/3;overflow:hidden;background:var(--surface);}
.fes-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s;}
.fes-card:hover .fes-card-img img{transform:scale(1.08);}
.fes-card-img .badges{position:absolute;top:8px;left:8px;display:flex;flex-direction:column;gap:4px;}
.badge{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;padding:3px 8px;border-radius:2px;color:#fff;line-height:1.3;}
.badge-featured{background:var(--accent);}
.badge-verified{background:var(--data);}
.badge-condition{background:rgba(0,0,0,.65);}

/* AMV indicator */
.amv-bar{position:absolute;bottom:8px;left:8px;right:8px;display:flex;align-items:center;justify-content:space-between;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;padding:6px 10px;border-radius:2px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
.amv-below{background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.4);color:var(--data);}
.amv-above{background:rgba(22,163,74,.15);border:1px solid rgba(22,163,74,.4);color:var(--accent);}
.amv-dot{width:6px;height:6px;border-radius:50%;animation:pulse 2s infinite;}
.amv-below .amv-dot{background:var(--data);}
.amv-above .amv-dot{background:var(--accent);}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}

/* Content */
.fes-card-body{padding:16px;display:flex;flex-direction:column;flex:1;}
.fes-make{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);}
.fes-hours{font-size:10px;font-weight:700;color:var(--muted);}
.fes-title{font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;color:var(--ink);margin:6px 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.fes-est{font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);letter-spacing:0.08em;}
.fes-price-row{display:flex;align-items:flex-end;justify-content:space-between;margin-top:auto;padding-top:12px;}
.fes-price-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);}
.fes-price{font-size:20px;font-weight:900;letter-spacing:-0.02em;color:var(--ink);}
.fes-location{font-size:10px;font-weight:700;color:var(--muted);text-align:right;}

/* Buttons */
.fes-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;}
.fes-btn{display:flex;align-items:center;justify-content:center;gap:4px;padding:10px 8px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer;transition:background .2s,color .2s;text-decoration:none;border-radius:0;}
.fes-btn:hover{background:var(--ink);color:var(--bg);}
.fes-btn-accent{background:var(--accent);color:#fff;border-color:var(--accent);}
.fes-btn-accent:hover{background:color-mix(in srgb,var(--accent) 85%,#000);color:#fff;}
.fes-btn-call{background:transparent;border:1px solid var(--accent);color:var(--accent);}
.fes-btn-call:hover{background:var(--accent);color:#fff;}
.fes-btn-full{grid-column:1/-1;}

/* Footer */
.fes-card-footer{padding:8px 16px;border-top:1px solid var(--line);background:color-mix(in srgb,var(--surface) 50%,transparent);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--muted);display:flex;align-items:center;gap:6px;}
.fes-card-footer svg{flex-shrink:0;}

/* List style */
.style-list .fes-card{flex-direction:row;max-height:200px;}
.style-list .fes-card-img{aspect-ratio:auto;width:260px;min-height:180px;flex-shrink:0;}
.style-list .fes-card-body{padding:14px 18px;}
.style-list .fes-btns{grid-template-columns:auto auto;justify-content:flex-start;}

/* Compact style */
.style-compact .fes-card{flex-direction:row;max-height:80px;align-items:center;padding:0 12px;}
.style-compact .fes-card-img{aspect-ratio:auto;width:60px;height:60px;min-height:auto;flex-shrink:0;border-radius:4px;margin:8px 0;}
.style-compact .fes-card-body{padding:8px 12px;flex-direction:row;align-items:center;gap:16px;}
.style-compact .fes-title{font-size:12px;margin:0;}
.style-compact .fes-price{font-size:14px;}
.style-compact .fes-btns,.style-compact .fes-card-footer,.style-compact .badges,.style-compact .amv-bar,.style-compact .fes-make,.style-compact .fes-hours,.style-compact .fes-est,.style-compact .fes-price-label,.style-compact .fes-location,.style-compact .fes-price-row{display:none;}
.style-compact .fes-card-body .fes-price-inline{font-size:14px;font-weight:900;color:var(--ink);margin-left:auto;white-space:nowrap;}

/* Load more */
.fes-load-more{display:flex;justify-content:center;padding:24px 0;}
.fes-load-more button{padding:12px 32px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer;transition:background .2s;}
.fes-load-more button:hover{background:var(--ink);color:var(--bg);}

/* Loading / empty */
.fes-loading,.fes-empty{padding:40px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:var(--muted);}

/* Powered by */
.fes-powered{text-align:center;padding:16px 0 4px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:var(--muted);}
.fes-powered a{color:var(--accent);text-decoration:none;}
.fes-powered a:hover{text-decoration:underline;}

/* ── Lightbox ───────────────────────────────────────────── */
.fes-lightbox-overlay{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}
.fes-lightbox{background:var(--bg);border:1px solid var(--line);max-width:820px;width:100%;max-height:90vh;overflow-y:auto;position:relative;}
.fes-lb-close{position:absolute;top:12px;right:12px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:var(--surface);border:1px solid var(--line);color:var(--ink);cursor:pointer;font-size:18px;font-weight:900;z-index:2;border-radius:0;}
.fes-lb-close:hover{background:var(--ink);color:var(--bg);}
.fes-lb-carousel{position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--surface);}
.fes-lb-carousel img{width:100%;height:100%;object-fit:cover;}
.fes-lb-arrow{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);color:#fff;border:none;cursor:pointer;font-size:18px;z-index:1;}
.fes-lb-arrow:hover{background:rgba(0,0,0,.75);}
.fes-lb-prev{left:8px;}
.fes-lb-next{right:8px;}
.fes-lb-dots{display:flex;justify-content:center;gap:6px;padding:10px 0;background:var(--surface);}
.fes-lb-dot{width:8px;height:8px;border-radius:50%;background:var(--muted);border:none;cursor:pointer;padding:0;}
.fes-lb-dot.active{background:var(--accent);}
.fes-lb-body{padding:24px;}
.fes-lb-title{font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;color:var(--ink);}
.fes-lb-meta{margin-top:8px;display:flex;flex-wrap:wrap;gap:16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);}
.fes-lb-price{font-size:28px;font-weight:900;color:var(--ink);margin-top:16px;}
.fes-lb-desc{margin-top:16px;font-size:13px;line-height:1.7;color:var(--muted);white-space:pre-wrap;max-height:200px;overflow-y:auto;}
.fes-lb-specs{margin-top:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;}
.fes-lb-spec{display:flex;flex-direction:column;padding:10px;background:var(--surface);border:1px solid var(--line);}
.fes-lb-spec-label{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:var(--muted);}
.fes-lb-spec-value{font-size:14px;font-weight:700;color:var(--ink);margin-top:2px;}
.fes-lb-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--line);}

/* ── Inquiry form ───────────────────────────────────────── */
.fes-inquiry-form{margin-top:16px;padding:16px;border:1px solid var(--line);background:var(--surface);}
.fes-inquiry-form h4{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:var(--ink);margin-bottom:12px;}
.fes-inquiry-form label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);margin-bottom:4px;margin-top:10px;}
.fes-inquiry-form input,.fes-inquiry-form textarea{width:100%;padding:8px 10px;font-size:13px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-family:inherit;outline:none;}
.fes-inquiry-form input:focus,.fes-inquiry-form textarea:focus{border-color:var(--accent);}
.fes-inquiry-form textarea{min-height:80px;resize:vertical;}
.fes-inquiry-form .fes-form-btns{display:flex;gap:8px;margin-top:12px;}
.fes-inquiry-msg{padding:10px;margin-top:8px;font-size:12px;font-weight:700;}
.fes-inquiry-msg.success{background:rgba(16,185,129,.1);color:var(--data);border:1px solid var(--data);}
.fes-inquiry-msg.error{background:rgba(239,68,68,.1);color:#EF4444;border:1px solid #EF4444;}
\`;
}

/* ── SVG icons ──────────────────────────────────────────── */
var ICONS={
  shield:'<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  mappin:'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  clock:'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  phone:'<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  trendDown:'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
  trendUp:'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
};

/* ── Card renderers ─────────────────────────────────────── */
function renderBadges(item){
  var h='';
  if(item.featured)h+='<span class="badge badge-featured">Featured</span>';
  if(item.sellerVerified)h+='<span class="badge badge-verified">Verified Seller</span>';
  var cond=item.condition||'';
  if(cond)h+='<span class="badge badge-condition">'+esc(cond)+'</span>';
  return h?'<div class="badges">'+h+'</div>':'';
}

function renderAmv(item){
  if(!item.marketValueEstimate||item.marketValueEstimate<=0||!item.price)return '';
  var diff=amvPct(item.price,item.marketValueEstimate);
  if(diff===null)return '';
  var below=diff<0;
  var cls=below?'amv-below':'amv-above';
  var icon=below?ICONS.trendDown:ICONS.trendUp;
  var label=Math.abs(diff).toFixed(1)+'% '+(below?'Below':'Above')+' AMV';
  return '<div class="amv-bar '+cls+'"><span>'+icon+' '+label+'</span><span class="amv-dot"></span></div>';
}

function renderNativeCard(item,cfg){
  var img=(item.images&&item.images[0])||'';
  var title=esc((item.year||'')+' '+(item.make||item.manufacturer||'')+' '+(item.model||'')).trim()||'Equipment Listing';
  var monthly=pmt(item.price);
  var h='<div class="fes-card" data-id="'+esc(item.id)+'">';
  h+='<div class="fes-card-img">';
  if(img)h+='<img src="'+esc(img)+'" alt="'+esc(title)+'" loading="lazy">';
  h+=renderBadges(item);
  h+=renderAmv(item);
  h+='</div>';
  h+='<div class="fes-card-body">';
  h+='<div style="display:flex;justify-content:space-between;align-items:flex-start">';
  h+='<span class="fes-make">'+esc(item.make||item.manufacturer||'')+'</span>';
  if(item.hours)h+='<span class="fes-hours">'+ICONS.clock+' '+fmt(item.hours)+' HRS</span>';
  h+='</div>';
  h+='<div class="fes-title">'+title+'</div>';
  if(monthly>0)h+='<div class="fes-est">Est. '+fmtPrice(monthly)+'/mo at 6% for 60 mos</div>';
  h+='<div class="fes-price-row">';
  h+='<div><div class="fes-price-label">Current Price</div><div class="fes-price">'+fmtPrice(item.price||0,item.currency)+'</div></div>';
  h+='<div class="fes-location">'+ICONS.mappin+' '+esc(item.location||'')+'</div>';
  h+='</div>';
  h+='<div class="fes-btns">';
  if(cfg.showDetails)h+='<button class="fes-btn fes-btn-details" data-id="'+esc(item.id)+'">Details</button>';
  if(cfg.showInquiry)h+='<button class="fes-btn fes-btn-accent fes-btn-inquiry" data-id="'+esc(item.id)+'">Inquire</button>';
  if(cfg.showCall&&cfg.dealerPhone)h+='<a href="tel:'+esc(cfg.dealerPhone)+'" class="fes-btn fes-btn-call fes-btn-full">'+ICONS.phone+' Call Dealer</a>';
  h+='</div>';
  h+='</div>';
  h+='<div class="fes-card-footer">'+ICONS.shield+' '+(item.sellerVerified?'Verified Seller':'TimberEquip')+'</div>';
  h+='</div>';
  return h;
}

function renderGridCard(item,cfg){
  var img=(item.images&&item.images[0])||'';
  var title=esc((item.year||'')+' '+(item.make||item.manufacturer||'')+' '+(item.model||'')).trim()||'Equipment Listing';
  var h='<div class="fes-card" data-id="'+esc(item.id)+'">';
  h+='<div class="fes-card-img">';
  if(img)h+='<img src="'+esc(img)+'" alt="'+esc(title)+'" loading="lazy">';
  var cond=item.condition||'';
  if(cond)h+='<div class="badges"><span class="badge badge-condition">'+esc(cond)+'</span></div>';
  h+='</div>';
  h+='<div class="fes-card-body">';
  h+='<div class="fes-title">'+title+'</div>';
  h+='<div class="fes-price-row">';
  h+='<div class="fes-price">'+fmtPrice(item.price||0,item.currency)+'</div>';
  if(item.location)h+='<div class="fes-location">'+esc(item.location)+'</div>';
  h+='</div>';
  h+='<div class="fes-btns">';
  if(cfg.showDetails)h+='<button class="fes-btn fes-btn-details" data-id="'+esc(item.id)+'">Details</button>';
  if(cfg.showInquiry)h+='<button class="fes-btn fes-btn-accent fes-btn-inquiry" data-id="'+esc(item.id)+'">Inquire</button>';
  h+='</div>';
  h+='</div>';
  h+='</div>';
  return h;
}

function renderListCard(item,cfg){
  var img=(item.images&&item.images[0])||'';
  var title=esc((item.year||'')+' '+(item.make||item.manufacturer||'')+' '+(item.model||'')).trim()||'Equipment Listing';
  var h='<div class="fes-card" data-id="'+esc(item.id)+'">';
  h+='<div class="fes-card-img">';
  if(img)h+='<img src="'+esc(img)+'" alt="'+esc(title)+'" loading="lazy">';
  h+='</div>';
  h+='<div class="fes-card-body">';
  h+='<div class="fes-title">'+title+'</div>';
  h+='<div style="display:flex;gap:16px;margin-top:4px;">';
  if(item.hours)h+='<span class="fes-hours">'+fmt(item.hours)+' Hours</span>';
  if(item.location)h+='<span class="fes-location">'+ICONS.mappin+' '+esc(item.location)+'</span>';
  h+='</div>';
  h+='<div class="fes-price" style="margin-top:8px;">'+fmtPrice(item.price||0,item.currency)+'</div>';
  h+='<div class="fes-btns" style="margin-top:8px;">';
  if(cfg.showDetails)h+='<button class="fes-btn fes-btn-details" data-id="'+esc(item.id)+'">Details</button>';
  if(cfg.showInquiry)h+='<button class="fes-btn fes-btn-accent fes-btn-inquiry" data-id="'+esc(item.id)+'">Inquire</button>';
  if(cfg.showCall&&cfg.dealerPhone)h+='<a href="tel:'+esc(cfg.dealerPhone)+'" class="fes-btn fes-btn-call">'+ICONS.phone+' Call</a>';
  h+='</div>';
  h+='</div>';
  h+='</div>';
  return h;
}

function renderCompactCard(item,cfg){
  var img=(item.images&&item.images[0])||'';
  var title=esc((item.year||'')+' '+(item.make||item.manufacturer||'')+' '+(item.model||'')).trim()||'Equipment Listing';
  var h='<div class="fes-card" data-id="'+esc(item.id)+'">';
  h+='<div class="fes-card-img">';
  if(img)h+='<img src="'+esc(img)+'" alt="'+esc(title)+'" loading="lazy">';
  h+='</div>';
  h+='<div class="fes-card-body">';
  h+='<div class="fes-title">'+title+'</div>';
  h+='<div class="fes-price-inline">'+fmtPrice(item.price||0,item.currency)+'</div>';
  h+='</div>';
  h+='</div>';
  return h;
}

/* ── Lightbox ───────────────────────────────────────────── */
function renderLightbox(item,cfg){
  var imgs=item.images||[];
  var title=((item.year||'')+' '+(item.make||item.manufacturer||'')+' '+(item.model||'')).trim()||'Equipment Listing';
  var h='<div class="fes-lightbox-overlay">';
  h+='<div class="fes-lightbox">';
  h+='<button class="fes-lb-close" aria-label="Close">&times;</button>';
  if(imgs.length>0){
    h+='<div class="fes-lb-carousel"><img src="'+esc(imgs[0])+'" alt="'+esc(title)+'" data-idx="0">';
    if(imgs.length>1){
      h+='<button class="fes-lb-arrow fes-lb-prev" aria-label="Previous">&#8249;</button>';
      h+='<button class="fes-lb-arrow fes-lb-next" aria-label="Next">&#8250;</button>';
    }
    h+='</div>';
    if(imgs.length>1){
      h+='<div class="fes-lb-dots">';
      for(var i=0;i<imgs.length;i++)h+='<button class="fes-lb-dot'+(i===0?' active':'')+'" data-idx="'+i+'"></button>';
      h+='</div>';
    }
  }
  h+='<div class="fes-lb-body">';
  h+='<div class="fes-lb-title">'+esc(title)+'</div>';
  h+='<div class="fes-lb-meta">';
  if(item.condition)h+='<span>Condition: '+esc(item.condition)+'</span>';
  if(item.hours)h+='<span>'+fmt(item.hours)+' Hours</span>';
  if(item.location)h+='<span>'+esc(item.location)+'</span>';
  if(item.stockNumber)h+='<span>Stock #'+esc(item.stockNumber)+'</span>';
  if(item.serialNumber)h+='<span>Serial #'+esc(item.serialNumber)+'</span>';
  h+='</div>';
  h+='<div class="fes-lb-price">'+fmtPrice(item.price||0,item.currency)+'</div>';
  if(item.description)h+='<div class="fes-lb-desc">'+esc(item.description)+'</div>';

  var specs=[];
  if(item.make||item.manufacturer)specs.push({l:'Make',v:item.make||item.manufacturer});
  if(item.model)specs.push({l:'Model',v:item.model});
  if(item.year)specs.push({l:'Year',v:String(item.year)});
  if(item.hours)specs.push({l:'Hours',v:fmt(item.hours)});
  if(item.condition)specs.push({l:'Condition',v:item.condition});
  if(item.location)specs.push({l:'Location',v:item.location});
  if(item.category)specs.push({l:'Category',v:item.category});
  if(item.subcategory)specs.push({l:'Subcategory',v:item.subcategory});
  if(specs.length>0){
    h+='<div class="fes-lb-specs">';
    for(var s=0;s<specs.length;s++)h+='<div class="fes-lb-spec"><div class="fes-lb-spec-label">'+esc(specs[s].l)+'</div><div class="fes-lb-spec-value">'+esc(specs[s].v)+'</div></div>';
    h+='</div>';
  }
  h+='<div class="fes-lb-actions">';
  if(cfg.showInquiry)h+='<button class="fes-btn fes-btn-accent fes-btn-inquiry-lb" data-id="'+esc(item.id)+'">Send Inquiry</button>';
  if(cfg.showCall&&cfg.dealerPhone)h+='<a href="tel:'+esc(cfg.dealerPhone)+'" class="fes-btn fes-btn-call">'+ICONS.phone+' Call Dealer</a>';
  if(item.listingUrl)h+='<a href="'+esc(item.listingUrl)+'" target="_blank" rel="noopener noreferrer" class="fes-btn">View on TimberEquip</a>';
  h+='</div>';
  h+='<div class="fes-inquiry-container" data-id="'+esc(item.id)+'"></div>';
  h+='</div>';
  h+='</div>';
  h+='</div>';
  return h;
}

/* ── Inquiry form ───────────────────────────────────────── */
function renderInquiryForm(listingId){
  return '<div class="fes-inquiry-form"><h4>Send Inquiry</h4>'
    +'<label>Name *</label><input type="text" class="fes-inq-name" required>'
    +'<label>Email *</label><input type="email" class="fes-inq-email" required>'
    +'<label>Phone</label><input type="tel" class="fes-inq-phone">'
    +'<label>Message</label><textarea class="fes-inq-message" placeholder="I am interested in this machine..."></textarea>'
    +'<div class="fes-form-btns"><button class="fes-btn fes-btn-accent fes-inq-submit" data-id="'+esc(listingId)+'">Submit Inquiry</button></div>'
    +'<div class="fes-inq-result"></div></div>';
}

/* ── Web Component ──────────────────────────────────────── */
class FESDealerInventory extends HTMLElement{
  constructor(){
    super();
    this._shadow=this.attachShadow({mode:'open'});
    this._listings=[];
    this._page=0;
    this._loading=false;
    this._hasMore=false;
    this._cfg={};
    this._carouselIdx=0;
  }

  connectedCallback(){
    var self=this;
    var d=this.dataset;
    self._cfg={
      dealer:d.dealer||'',
      cardStyle:d.cardStyle||'fes-native',
      accentColor:d.accentColor||'#16A34A',
      fontFamily:d.fontFamily||'system-ui,-apple-system,sans-serif',
      darkMode:d.darkMode==='true',
      showInquiry:d.showInquiry!=='false',
      showCall:d.showCall!=='false',
      showDetails:d.showDetails!=='false',
      pageSize:Math.max(3,Math.min(60,parseInt(d.pageSize,10)||12)),
      dealerPhone:d.dealerPhone||'',
      dealerName:d.dealerName||'',
    };

    if(!self._cfg.dealer){
      self._shadow.innerHTML='<p style="color:red;font-family:sans-serif;">fes-dealer-inventory: data-dealer attribute is required.</p>';
      return;
    }

    /* Try to load remote widget config, then fall back to data-* attrs */
    self._loadConfig().then(function(){
      self._initCSS();
      self._setupObserver();
      self._render();
      self._loadPage();
    });
  }

  async _loadConfig(){
    var self=this;
    try{
      var resp=await fetch(API_BASE+'/api/public/dealers/'+encodeURIComponent(self._cfg.dealer)+'/widget-config');
      if(resp.ok){
        var json=await resp.json();
        var c=json.config||{};
        /* Remote config overrides data-* defaults, but data-* overrides if explicitly set */
        if(c.cardStyle&&!self.dataset.cardStyle)self._cfg.cardStyle=c.cardStyle;
        if(c.accentColor&&!self.dataset.accentColor)self._cfg.accentColor=c.accentColor;
        if(c.fontFamily&&!self.dataset.fontFamily)self._cfg.fontFamily=c.fontFamily;
        if(typeof c.darkMode==='boolean'&&!self.dataset.darkMode)self._cfg.darkMode=c.darkMode;
        if(typeof c.showInquiry==='boolean'&&self.dataset.showInquiry===undefined)self._cfg.showInquiry=c.showInquiry;
        if(typeof c.showCall==='boolean'&&self.dataset.showCall===undefined)self._cfg.showCall=c.showCall;
        if(typeof c.showDetails==='boolean'&&self.dataset.showDetails===undefined)self._cfg.showDetails=c.showDetails;
        if(c.pageSize&&!self.dataset.pageSize)self._cfg.pageSize=c.pageSize;
        if(c.dealerPhone)self._cfg.dealerPhone=self._cfg.dealerPhone||c.dealerPhone;
        if(c.dealerName)self._cfg.dealerName=self._cfg.dealerName||c.dealerName;
      }
    }catch(e){/* config is optional */}
  }

  _initCSS(){
    var style=document.createElement('style');
    style.textContent=buildCSS(this._cfg);
    this._shadow.appendChild(style);
  }

  _setupObserver(){
    var self=this;
    self._gridEl=null;
    if(typeof ResizeObserver!=='undefined'){
      self._ro=new ResizeObserver(function(entries){
        for(var e of entries){
          var w=e.contentRect.width;
          var grid=self._gridEl;
          if(!grid)return;
          grid.classList.remove('cols-1','cols-2','cols-3','cols-4');
          if(self._cfg.cardStyle==='list'||self._cfg.cardStyle==='compact'){grid.classList.add('cols-1');}
          else if(w<500){grid.classList.add('cols-1');}
          else if(w<800){grid.classList.add('cols-2');}
          else if(w<1100){grid.classList.add('cols-3');}
          else{grid.classList.add('cols-4');}
        }
      });
      self._ro.observe(self);
    }
  }

  _render(){
    var wrapper=document.createElement('div');
    wrapper.className='fes-widget style-'+this._cfg.cardStyle;
    wrapper.innerHTML='<div class="fes-loading">Loading inventory...</div>';
    this._shadow.appendChild(wrapper);
    this._wrapper=wrapper;
  }

  async _loadPage(){
    var self=this;
    if(self._loading)return;
    self._loading=true;
    try{
      var url=API_BASE+'/api/public/dealers/'+encodeURIComponent(self._cfg.dealer)+'/feed.json?limit='+self._cfg.pageSize+'&offset='+(self._page*self._cfg.pageSize);
      var resp=await fetch(url);
      if(!resp.ok)throw new Error('Feed request failed');
      var json=await resp.json();
      var items=json.listings||[];
      self._listings=self._listings.concat(items);
      self._hasMore=items.length>=self._cfg.pageSize;
      self._page++;
      if(!self._cfg.dealerPhone&&json.dealer&&json.dealer.phone)self._cfg.dealerPhone=json.dealer.phone;
      if(!self._cfg.dealerName&&json.dealer&&json.dealer.name)self._cfg.dealerName=json.dealer.name;
      self._renderCards();
    }catch(e){
      self._wrapper.innerHTML='<div class="fes-empty">Unable to load inventory. Please try again later.</div>';
    }finally{
      self._loading=false;
    }
  }

  _renderCards(){
    var self=this;
    var style=self._cfg.cardStyle;
    var renderFn=style==='list'?renderListCard:style==='compact'?renderCompactCard:style==='grid'?renderGridCard:renderNativeCard;
    var html='<div class="fes-grid">';
    for(var i=0;i<self._listings.length;i++){
      html+=renderFn(self._listings[i],self._cfg);
    }
    html+='</div>';
    if(self._listings.length===0){
      html='<div class="fes-empty">No inventory available at this time.</div>';
    }
    if(self._hasMore){
      html+='<div class="fes-load-more"><button class="fes-load-more-btn">Load More</button></div>';
    }
    html+='<div class="fes-powered">Powered by <a href="https://timberequip.com" target="_blank" rel="noopener noreferrer">TimberEquip</a></div>';
    self._wrapper.innerHTML=html;
    self._wrapper.className='fes-widget style-'+self._cfg.cardStyle;

    self._gridEl=self._wrapper.querySelector('.fes-grid');
    if(self._ro&&self._gridEl){
      /* trigger initial column calc */
      var w=self.getBoundingClientRect().width;
      var grid=self._gridEl;
      grid.classList.remove('cols-1','cols-2','cols-3','cols-4');
      if(style==='list'||style==='compact'){grid.classList.add('cols-1');}
      else if(w<500){grid.classList.add('cols-1');}
      else if(w<800){grid.classList.add('cols-2');}
      else if(w<1100){grid.classList.add('cols-3');}
      else{grid.classList.add('cols-4');}
    }

    self._bindCardEvents();
  }

  _bindCardEvents(){
    var self=this;
    /* Load more */
    var loadBtn=self._wrapper.querySelector('.fes-load-more-btn');
    if(loadBtn)loadBtn.addEventListener('click',function(){self._loadPage();});

    /* Card clicks -> lightbox or detail */
    var cards=self._wrapper.querySelectorAll('.fes-card');
    cards.forEach(function(card){
      card.addEventListener('click',function(e){
        if(e.target.closest('.fes-btn'))return;
        if(self._cfg.showDetails){
          var id=card.getAttribute('data-id');
          self._openLightbox(id);
        }
      });
    });

    /* Detail buttons */
    self._wrapper.querySelectorAll('.fes-btn-details').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        self._openLightbox(btn.getAttribute('data-id'));
      });
    });

    /* Inquiry buttons on cards */
    self._wrapper.querySelectorAll('.fes-btn-inquiry').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        self._openLightbox(btn.getAttribute('data-id'),'inquiry');
      });
    });
  }

  _findListing(id){
    for(var i=0;i<this._listings.length;i++){if(this._listings[i].id===id)return this._listings[i];}
    return null;
  }

  _openLightbox(id,focus){
    var self=this;
    var item=self._findListing(id);
    if(!item)return;
    self._carouselIdx=0;
    var el=document.createElement('div');
    el.innerHTML=renderLightbox(item,self._cfg);
    var overlay=el.firstElementChild;
    self._shadow.appendChild(overlay);

    /* Close */
    overlay.querySelector('.fes-lb-close').addEventListener('click',function(){overlay.remove();});
    overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});

    /* Carousel */
    var imgs=item.images||[];
    if(imgs.length>1){
      var carouselImg=overlay.querySelector('.fes-lb-carousel img');
      var dots=overlay.querySelectorAll('.fes-lb-dot');
      function goTo(idx){
        self._carouselIdx=((idx%imgs.length)+imgs.length)%imgs.length;
        carouselImg.src=imgs[self._carouselIdx];
        dots.forEach(function(d,i){d.classList.toggle('active',i===self._carouselIdx);});
      }
      var prevBtn=overlay.querySelector('.fes-lb-prev');
      var nextBtn=overlay.querySelector('.fes-lb-next');
      if(prevBtn)prevBtn.addEventListener('click',function(){goTo(self._carouselIdx-1);});
      if(nextBtn)nextBtn.addEventListener('click',function(){goTo(self._carouselIdx+1);});
      dots.forEach(function(d){d.addEventListener('click',function(){goTo(parseInt(d.getAttribute('data-idx'),10));});});
    }

    /* Inquiry button in lightbox */
    var inqBtn=overlay.querySelector('.fes-btn-inquiry-lb');
    if(inqBtn){
      inqBtn.addEventListener('click',function(){
        var container=overlay.querySelector('.fes-inquiry-container[data-id="'+id+'"]');
        if(container&&!container.querySelector('.fes-inquiry-form')){
          container.innerHTML=renderInquiryForm(id);
          self._bindInquiryForm(container,id);
        }
      });
    }

    /* Auto-open inquiry if focus=inquiry */
    if(focus==='inquiry'){
      var container=overlay.querySelector('.fes-inquiry-container[data-id="'+id+'"]');
      if(container){
        container.innerHTML=renderInquiryForm(id);
        self._bindInquiryForm(container,id);
      }
    }
  }

  _bindInquiryForm(container,listingId){
    var self=this;
    var submitBtn=container.querySelector('.fes-inq-submit');
    if(!submitBtn)return;
    submitBtn.addEventListener('click',async function(){
      var name=container.querySelector('.fes-inq-name').value.trim();
      var email=container.querySelector('.fes-inq-email').value.trim();
      var phone=container.querySelector('.fes-inq-phone').value.trim();
      var message=container.querySelector('.fes-inq-message').value.trim();
      var resultEl=container.querySelector('.fes-inq-result');
      if(!name||!email){resultEl.className='fes-inquiry-msg error';resultEl.textContent='Name and email are required.';return;}
      submitBtn.disabled=true;submitBtn.textContent='Sending...';
      try{
        var resp=await fetch(API_BASE+'/api/public/dealers/'+encodeURIComponent(self._cfg.dealer)+'/inquiry',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({listingId:listingId,name:name,email:email,phone:phone,message:message})
        });
        if(!resp.ok)throw new Error('Failed');
        resultEl.className='fes-inquiry-msg success';resultEl.textContent='Inquiry sent successfully! The dealer will be in touch.';
        submitBtn.textContent='Sent';
      }catch(e){
        resultEl.className='fes-inquiry-msg error';resultEl.textContent='Unable to send inquiry. Please try again or contact the dealer directly.';
        submitBtn.disabled=false;submitBtn.textContent='Submit Inquiry';
      }
    });
  }

  disconnectedCallback(){
    if(this._ro)this._ro.disconnect();
  }
}

customElements.define('fes-dealer-inventory',FESDealerInventory);
})();`;
}

module.exports = { renderDealerWidgetScript };
