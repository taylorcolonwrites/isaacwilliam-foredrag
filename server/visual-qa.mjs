import {overview,overviewMarkup} from '../public/assets/overview.js';
const escape=(value='')=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function visualPage(url) {
  const width=Number(url.searchParams.get('w')||390);
  const path=url.searchParams.get('page')||'/';
  const allowed=['/','/about','/topics','/booking','/contact','/pricing-and-services','/faq','/testimonials','/min-side','/__qa/dashboard','/kontrollpanel-demo','/foresporsel-demo'];
  if(url.pathname==='/__qa/mobile' && [320,390,768,1024].includes(width) && allowed.includes(path))return `<!doctype html><html lang="nb"><meta charset="utf-8"><title>Responsiv kontroll – ${width} px</title><link rel="stylesheet" href="/assets/qa.css"><h1>Visuell test: ${width} px</h1><p>Nettstedet nedenfor har en egen visningsbredde på ${width} CSS-piksler.</p><iframe title="Mobilvisning" width="${width}" height="900" src="${escape(path)}"></iframe></html>`;
  if(url.pathname==='/__qa/dashboard'){
    const records={enquiries:[{status:'Ny',payload:{}},{status:'Under behandling',payload:{}},{status:'Bekreftet',quote:2500,payload:{date:'2099-05-20',time:'12:30',organisation:'Testarrangør',topic:'Autisme og nevrodiversitet',location:'Digitalt – testdata'}}]};
    const markup=overviewMarkup(overview(records,{bookingAvailable:false}),escape);
    return `<!doctype html><html lang="nb"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Visuell kontroll av kontrollpanel – testdata</title><link rel="stylesheet" href="/assets/style.css?v=20261106b"><main class="admin"><p class="notice">VISUELL TEST MED FIKTIVE TESTDATA. Ingen private forespørsler vises her.</p><div class="admin-header"><h1>Mitt kontrollpanel</h1></div><div class="tabs"><button class="button mini">Oversikt</button><button class="button secondary mini">Forespørsler</button><button class="button secondary mini">Kalender</button><button class="button secondary mini">Rediger innhold</button></div>${markup}</main></html>`;
  }
  return null;
}
