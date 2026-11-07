# Drift og kontrollert lansering

## 1. Sett opp testmiljø uten å endre domenet

Kjør én Node.js-prosess med et vedvarende `DATA_DIR`, enten direkte med Node 24 eller med den medfølgende Docker-konfigurasjonen. Applikasjonen bruker synkron SQLite med WAL og skal ikke kjøres på flyktig eller delt nettverkslagring. Databasen må ligge på en lokal, vedvarende disk.

For Docker:

```sh
cp .env.example .env
# Rediger .env: sett et langt, unikt ADMIN_PASSWORD og korrekt PUBLIC_ORIGIN.
docker compose up -d --build
```

Porten er bare bundet til `127.0.0.1:3000`. Sett en HTTPS-reversproxy foran. Bruk en egen testadresse som du allerede kontrollerer, eller en lokal nettleser for første test. `PUBLIC_ORIGIN` må være den nøyaktige origin-adressen i nettleseren, med protokoll og eventuell port, men uten avsluttende `/`. Ikke stol på videresendte klient-IP-headere uten egen proxykonfigurasjon: dagens forsøkssperre bruker tilkoblingens IP, slik at besøkende bak samme proxy deler innsending-/innloggingsgrensen.

I produksjon må `NODE_ENV=production` brukes, slik at innloggingskapselen krever HTTPS. Appen bruker ingen tredjepartstjeneste for innsending. Driftsleverandøren får tilgang til serverlagrede data som del av driftsoppdraget.

## 2. Fullfør og test før lansering

- Kontroller alle åtte sider, alle bilder, trekkspill og lenker på mobil, nettbrett og desktop. Kontroller at ingen tekst blir overlappet eller klippet.
- Kontroller kontaktopplysninger, priser, kvalifikasjoner og biografitekst. Originalens påstander er bevart; de må vurderes av eieren.
- Bekreft oversettelser og anonymisering av de 13 unike tilbakemeldingene. Oppbevar samtykkene privat, utenfor repositoryet.
- Fullfør personverninformasjonen med virksomhet/behandlingsansvarlig, valgt driftsleverandør, behandlingsgrunnlag, konkret lagringstid, sletting og håndtering av rettighetsforespørsler.
- Google Workspace-sending er klargjort, men ikke autorisert eller verifisert mot en ekte postkasse. Se `EMAIL.md` for sikker serverautorisasjon og test. Nettsiden oppretter ikke en postkasse eller endrer DNS. Behold sending av til kontotilgang og faktisk levering er verifisert.
- Sett `BOOKING_ENABLED=true` og aktiver skjemaene i admin **i et testmiljø**. Send en testbooking og en kontaktmelding, kontroller mottak og personvern, endre status og pris, bekreft dato, sjekk at datoen blir opptatt, og slett testopplysningene.
- Test opplasting av bilde, innholdslagring og innholdseksport. Test omstart med bevart database og bilder.
- Test gjenoppretting fra sikkerhetskopi. Opprett en rutine for å lese nye forespørsler og leveringsfeil. E-postutboksen varsler først etter at serverens autorisasjon og sending er aktivert.

## 3. Sikkerhetskopiering og gjenoppretting

Sikkerhetskopier hele `DATA_DIR`: databasen, eventuelle `-wal`/`-shm`-filer og `uploads/`. En konsistent, enkel metode er å stoppe appen kort, kopiere hele datamappen sikkert og starte appen igjen. Ikke kopier bare SQLite-hovedfilen mens serveren skriver.

Krypter sikkerhetskopier, begrens tilgang og oppbevar dem utenfor webrot og GitHub. Avtal en slettetid også for sikkerhetskopier. Gjenopprett til en stoppet app med samme datamappeoppsett og korrekte filtillatelser; start så og verifiser innhold og forespørsler. En innholdseksport fra admin er nyttig, men erstatter ikke database- og bildebackup.

Administratorpassordet leveres som en hemmelig miljøvariabel. Ikke commit `.env`. Ved mistenkt kontotilgang: stopp appen, bytt hemmeligheten, slett rader i `sessions` i privat database, og start igjen. Eksisterende økter varer maksimalt åtte timer. Endring av eierpassordet i miljøet og omstart ugyldiggjør tidligere økter automatisk.

## 4. Domenebytte krever eierens godkjenning

Etter vellykket test og uttrykkelig godkjenning kan domenet kobles til erstatningen. Les gjeldende DNS-oppsett først. Ikke overskriv e-postrelaterte MX-, SPF-, DKIM- og DMARC-poster. Bekreft HTTPS og at `PUBLIC_ORIGIN=https://isaacwilliam.no` samsvarer med den faktiske adressen. Avklar eventuell `www`-videresending.

Først etter godkjenning settes `ALLOW_INDEXING=true`, og innsendingsskjemaene åpnes. Den opprinnelige Durable-nettsiden beholdes til overgangen er verifisert og eieren har godkjent eventuell nedstenging. Dette repositoryet utfører ikke DNS-endringer.
