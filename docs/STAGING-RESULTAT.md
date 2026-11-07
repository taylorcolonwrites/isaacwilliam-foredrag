# Resultat av stagingkontroll

**Dato:** 7. november 2026. **Konklusjon:** klar for utrulling til vertens stagingmiljø; ikke ferdig godkjent for offentlig åpning.

## Gjennomført

| Kontroll | Resultat |
| --- | --- |
| Ren kopi av versjonerte kildefiler, uten .env, runtime, kundedata eller node_modules | Bestått |
| Ny installasjon med npm ci --ignore-scripts, Node 24 | Bestått |
| Syntakskontroll | Bestått |
| Automatiserte tester | 12 bestått |
| Produksjonskontroller | 7 bestått |
| Produksjon avviser oppstart uten eierpassord | Bestått |
| Private data krever eierøkt; CSRF og Secure/SameSite/HttpOnly-økt | Bestått |
| Sider, lokale ressurser, no-index og avviste utviklingsruter i produksjon | Bestått |
| Innholdsredigering, bildeopplasting og eksport | Bestått |
| Kontofri testbooking og reservasjon av dato | Bestått |
| Stoppet sikkerhetskopi gjenopprettet innhold, bilde og booking | Bestått |
| Ekte browserinnsending mot ren staging, kvittering kontrollert mot SQLite | Bestått |
| Testhenvendelse fjernet etter kontroll | Utført |
| Faktiske e-poster sendt under kontrollene | Ingen |
| Docker-bygg og disponibel containerstart | Bestått i GitHub Actions, kjøring 42323468095 |

Produksjonskontrollen bruker disponible prosesser og simulerer den kanoniske HTTPS-origin i API-testene. Browserstaging kjørte gjennom den interne HTTP-forhåndsvisningen. Dette bekrefter applikasjonsfunksjon og cookieflagg, **ikke et ekte TLS-sertifikat eller en faktisk reversproxy**. Docker er ikke tilgjengelig i arbeidsmiljøet; containerkontrollen ble derfor kjørt og bestått i GitHub Actions på en Docker-utstyrt runner. Implementasjonscommit 916ab419c8e5fa133213c8bf9beee2638f758222 ble kontrollert, med vellykket bygg og oppstart av produksjonsimaget. Se https://github.com/taylorcolonwrites/isaacwilliam-foredrag/actions/runs/42323468095 .

Den rene stagingkopien hadde bare generert testpassord og fiktive `.invalid`-kontakter. Referansen fra browserkvitteringen samsvarte med nøyaktig én lagret testhenvendelse. E-postkøen var tom. Ingen DNS-poster, opprinnelig Durable-side eller virkelige henvendelser ble endret.

## Før faktisk offentlig åpning

- Test på valgt vert med fungerende HTTPS, vedvarende lokal disk og reell sikkerhetskopiering.
- Autoriser Google Workspace-sending for post@isaacwilliam.no og kontroller varsel, kvittering, Reply-To og innboksmottak. E-post er fortsatt deaktivert. Opplysningen om eierens Google-konto er notert for Workspace-kontotilgang; denne forbindelsen er ikke verifisert som nettstedets sending.
- Fullfør virksomhets-/personverntekst og eierens innholdsgodkjenning.
- Åpne formene og koble endelig domene først etter særskilt eiergodkjenning. Behold Durable som tilbakefall.

Repository: https://github.com/taylorcolonwrites/isaacwilliam-foredrag

Gren: `rebuild/durable-independent` · PR: https://github.com/taylorcolonwrites/isaacwilliam-foredrag/pull/2

Automatiske kontroller: https://github.com/taylorcolonwrites/isaacwilliam-foredrag/actions

Detaljer: SERVER-HANDOVER.md, DRIFT.md, EMAIL.md og KONTROLLPANEL.md.
