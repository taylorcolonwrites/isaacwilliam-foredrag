// Pure view model: no customer data is embedded in public JavaScript.
export function overview(records, site, day = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Oslo'}).format(new Date())) {
  const enquiries = records.enquiries || [];
  const fresh = enquiries.filter(r => r.status === 'Ny');
  const waiting = enquiries.filter(r => ['Under behandling', 'Tilbud sendt'].includes(r.status));
  const upcoming = enquiries.filter(r => r.status === 'Bekreftet' && r.payload.date >= day).sort((a,b) => a.payload.date.localeCompare(b.payload.date));
  const unread=enquiries.reduce((sum,r)=>sum+(r.messages||[]).filter(m=>m.author==='arrangor'&&!m.seen).length,0);
  const quoteTotal = enquiries.filter(r => ['Bekreftet','Gjennomført'].includes(r.status)).reduce((sum,r) => sum + (r.quote || 0), 0);
  const steps = [];
  if (unread&&site.clientPortalAvailable) steps.push({tab:'enquiries',title:`Les ${unread} ${unread===1?'ny klientmelding':'nye klientmeldinger'}`,text:'Svar på forespørselssiden og marker meldingene som lest. Ingen e-post er nødvendig.'});
  if (fresh.length) steps.push({tab:'enquiries',title:`Svar på ${fresh.length} ${fresh.length === 1 ? 'ny forespørsel' : 'nye forespørsler'}`,text:'Åpne forespørslene, vurder dato og behov, og skriv et svar til arrangøren.'});
  if (waiting.length) steps.push({tab:'enquiries',title:`Følg opp ${waiting.length} pågående ${waiting.length === 1 ? 'henvendelse' : 'henvendelser'}`,text:'Se gjennom henvendelser som behandles og tilbud som venter på svar.'});
  if (!site.bookingAvailable) steps.push({tab:'settings',title:'Skjemaene er stengt',text:'Fullfør oppsett og personvern, og test mottak før du åpner for nye henvendelser.'});
  if (upcoming.length) steps.push({tab:'calendar',title:'Forbered neste foredrag',text:`Neste oppdrag er ${upcoming[0].payload.date}. Kontroller tidspunkt, sted og avtaler.`});
  if (!steps.length) steps.push({tab:'calendar',title:'Du er ajour',text:'Se gjennom kalenderen og sperr datoer du ikke er tilgjengelig.'});
  return {fresh:fresh.length,waiting:waiting.length,upcoming,quoteTotal,unread,clientPortal:site.clientPortalAvailable===true,steps};
}
export function overviewMarkup(data, escape) {
  const e=escape;
  return `<div class="dashboard-welcome"><div class="eyebrow">Bare for deg</div><h2>Din oversikt</h2><p>Ditt private arbeidsrom for forespørsler, kalender, priser og nettsideinnhold. Klientene bruker nettsiden og e-post – de ser ikke dette kontrollpanelet.</p></div>
  <div class="dashboard-metrics">
  <div><span>Nye forespørsler</span><strong>${data.fresh}</strong></div>
  ${data.clientPortal?`<div><span>Nye klientmeldinger</span><strong>${data.unread||0}</strong></div>`:''}
  <div><span>Til oppfølging</span><strong>${data.waiting}</strong></div>
  <div><span>Kommende foredrag</span><strong>${data.upcoming.length}</strong></div>
  <div><span>Avtalte honorarer</span><strong>${e(new Intl.NumberFormat('nb-NO',{style:'currency',currency:'NOK',maximumFractionDigits:0}).format(data.quoteTotal))}</strong><small>Bekreftede og gjennomførte oppdrag, ikke registrerte innbetalinger.</small></div></div>
  <div class="dashboard-columns"><section class="panel"><h3>Hva gjør jeg nå?</h3><ol class="next-steps">${data.steps.map(step=>`<li><strong>${e(step.title)}</strong><p>${e(step.text)}</p><button class="button secondary mini" data-go="${e(step.tab)}">Åpne ${step.tab==='settings'?'innstillinger':step.tab==='calendar'?'kalender':'forespørsler'}</button></li>`).join('')}</ol></section>
  <section class="panel"><h3>Neste foredrag</h3>${data.upcoming.length?data.upcoming.slice(0,3).map(r=>`<article class="upcoming-job"><span class="badge">${e(r.payload.date)}${r.payload.time?' · '+e(r.payload.time):''}</span><h4>${e(r.payload.organisation)}</h4><p>${e(r.payload.topic)}<br>${e(r.payload.location)}</p></article>`).join(''):'<p>Ingen kommende foredrag er bekreftet ennå.</p>'}<button class="button secondary mini" data-go="calendar">Se hele kalenderen</button></section></div>
  <div class="dashboard-shortcuts"><button class="button secondary" id="refresh-dashboard">Oppdater oversikten</button><button class="button secondary" data-go="email">Se e-poststatus</button><button class="button" data-go="content">Rediger nettsiden</button><button class="button secondary" data-go="enquiries">Se alle forespørsler</button><a class="button secondary" href="/" target="_blank" rel="noopener">Åpne nettsiden ↗</a></div>
  <p class="small">Bokmerk denne siden som «Mitt kontrollpanel». Adressen er /min-side. Snarveien på nettsiden vises bare mens du er logget inn.</p>`;
}
