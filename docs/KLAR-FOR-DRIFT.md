# Klar til serverstaging – ikke offentlig lansert

Status vurdert 7. november 2026.

## Ferdig og kontrollert

- Alle åtte offentlige sider, originale bilder, korte temaintroduksjoner med 30 valgfrie undertemaer, konsekvent førsteperson og 13 genuine anonymiserte anmeldelser.
- Eget passordbeskyttet eierkontrollpanel for innhold, priser, bilder, forespørsler, kalender, interne notater og e-poststatus. Klienter trenger ingen konto eller private lenker.
- Google SMTP-utboks med kø, nye forsøk og Reply-To er implementert. E-post er avslått til autorisasjon og faktisk levering er kontrollert. Betaling skjer med ekstern faktura.
- Ren kildekodekopi uten miljøfiler, kundedata eller installerte avhengigheter: `npm ci --ignore-scripts`, kodesjekk, 12 tester og sju produksjonskontroller passerer.
- Produksjonskontrollen prøver manglende eierpassord, private API-grenser, Secure-økt, CSRF, sider/bilder, innholdsredigering, opplasting, eksport, kontofri booking, opptatt dato, omstart og gjenoppretting fra stoppet sikkerhetskopi.
- GitHub Actions har bygget produksjonsimaget og startet en disponibel Docker-container med vellykket helsesjekk og beskyttede eierdata (kjøring 42323468095).
- Ekte nettleserinnsending mot den rene staging-serveren ga kvittering som samsvarte med databasen. Bare fiktive `.invalid`-opplysninger ble brukt. Ingen e-post ble sendt, og testhenvendelsen ble fjernet.

## Det som gjenstår på den faktiske serveren

1. Node 24 eller Docker, HTTPS-reversproxy, vedvarende lokal disk, hemmelig eierpassord og kontrollert sikkerhetskopiering.
2. Autoriser Google Workspace som avsender for post@isaacwilliam.no. Eier opplyser at Workspace er knyttet til eierens Google-konto; den kontoen er ikke verifisert her som serverautorisasjon. Se EMAIL.md. Test både varsel, kvittering, Reply-To og faktisk innboksmottak.
3. Fullfør virksomhets- og personvernopplysninger med den valgte driftsleverandøren, lagringstid og rutiner. Kontroller egne kontaktopplysninger og samtykker til publiserte anmeldelser.
4. Test innlogging, skjema, redigering og sikkerhetskopiering på serverens staging-adresse. Eier må godkjenne dette før endelig åpning.
5. Først etter godkjenning: koble endelig domene og åpne skjemaer. Ikke slett eller endre originalen på Durable som del av serveroppsettet.

## Gren og gjennomgang

Full kildekode ligger i `rebuild/durable-independent`, PR #2. `main` er ikke oppdatert eller slått sammen automatisk. Bruk riktig gren ved serverstaging. Gjennomgangskopien på https://isaacwilliam-review.publickey1.chatgpt.site er statisk med stengte skjemaer og eierdemo med fiktive data; den er ikke en driftsserver.

Se SERVER-HANDOVER.md for kort serveroverlevering og STAGING-RESULTAT.md for testbevis og avgrensninger.
