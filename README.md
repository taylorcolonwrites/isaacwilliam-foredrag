# Isaac William Lunde – uavhengig foredragsnettsted

En selvstendig rekonstruksjon av den publiserte Durable-nettsiden, med norsk innholdsredigering og bookingadministrasjon. Planlagt domene er **isaacwilliam.no**, og kontaktadressen er **post@isaacwilliam.no**. Ingen DNS-poster er endret, og Durable-nettsiden er ikke endret eller slettet.

## Hva som finnes

- Alle åtte hovedsider: Hjem, Om, Foredragstemaer, Bestill foredrag, Kontakt, Priser & Tjenester, Ofte stilte spørsmål og Tilbakemeldinger.
- Tekst, 21 lokale bildeoriginaler og lokale Inter-/Playfair-skrifter fra det inspiserte designet. Bilder er optimalisert som WebP. Ingen Durable-kode, Durable API-er eller eksternt CMS kreves.
- Sidetekst, navigasjon og metadata leveres direkte fra serveren og kan leses uten JavaScript. Skjemaer krever JavaScript og er sperret før det er aktivert.
- Responsiv navigasjon, fleksible rutenett, tastaturbetjente trekkspill, tydelige skjemaetiketter og en personvernside.
- `/min-side` (og `/admin`): privat kontrollpanel med oversikt, neste steg og norsk redigerer for sidetekster, lenker, bilder, kort, spørsmål og anmeldelser. Bilder kan lastes opp direkte.
- Private booking-/kontaktforespørsler i SQLite; status, interne notater, pristilbud i hele NOK, søk og filtrering.
- Kalender med sperrede perioder og bekreftede bookinger. En bekreftet booking reserverer **hele datoen**, ikke bare klokkeslettet. Dato og klokkeslett gjelder norsk tid.
- Passordbeskyttet administrasjon, HttpOnly-økt, automatisk øktstenging når eierpassordet endres, CSRF-kontroll, servervalidering, begrensning av innsendingsforsøk og personopplysninger utenfor GitHub.
- Innholdseksport og innholdshistorikk på serveren. Ulagrede endringer varsles i redigereren.

## Lokal kjøring / første test

Krever **Node.js 24 eller nyere**. SMTP-sending bruker Nodemailer. Installer de låste avhengighetene med `npm ci --ignore-scripts`.

1. Kopier `.env.example` til `.env` og sett et unikt `ADMIN_PASSWORD` på minst 16 tegn.
2. For en lokal test: sett `NODE_ENV=development` og `PUBLIC_ORIGIN=http://localhost:3000`.
3. Kjør `npm start`, åpne `http://localhost:3000`, og logg inn på `/min-side`.

For å prøve innsending må både `BOOKING_ENABLED=true` i servermiljøet og «Åpne skjemaene» i administrasjonens innstillinger være aktivert. Begge er av som standard. Bruk kun testopplysninger du kontrollerer. `npm test` prøver hele forløpet i en egen midlertidig database uten å påvirke driftsdata.

**E-postsending er klargjort, men fortsatt deaktivert.** Henvendelser lagres i kontrollpanelet. Google Workspace kan sende varsel og kvittering når serveren er autorisert; videre svar leses i postkassen. Ingen reell sending eller innbokslevering er verifisert ennå. Se [E-postoppsett](docs/EMAIL.md).

## Rediger selv

Bokmerk `/min-side`. Denne adressen åpner innloggingen til ditt kontrollpanel. Ingen lenke vises i den offentlige menyen eller bunnteksten; en snarvei vises bare når du er logget inn. Besøkende som gjetter adressen får bare innlogging, aldri forespørsler eller redigering.

Åpne `/min-side` og velg **Rediger innhold**. Velg side, åpne seksjonen, endre tekst eller bilde og trykk **Lagre innhold**. Endringen vises direkte uten Durable eller ny bygging.

Under **Innstillinger** kan navn, kontaktopplysninger og personverninformasjon endres. Innstillingene oppretter ikke e-postkontoer og endrer ikke DNS. Under «Sikkerhetskopi og gjenoppretting» kan du laste ned en innholdseksport og senere gjenopprette den i kontrollpanelet. En kopi kan også oppbevares i GitHub. Eksporten inneholder bare nettsideinnhold, ikke forespørsler eller økter.

`content/site.json` er det versjonerte startinnholdet. Det importeres **bare når databasen opprettes første gang**. Senere Git-pull eller utrulling overskriver ikke redigeringer du har gjort i administrasjonen. Ikke slett databasen for å oppdatere nettsidetekst.

## Drift på egen server

Dette er nå en Node-/SQLite-applikasjon, **ikke en Jekyll-side eller en ren GitHub Pages-side**. GitHub lagrer kildekoden. En server med vedvarende lagring og HTTPS kreves for bookingadministrasjonen.

Se [kort status før utrulling](docs/KLAR-FOR-DRIFT.md) og [driftsveiledningen](docs/DRIFT.md) for Docker, sikkerhetskopiering, test og kontrollert domenebytte. Ikke flytt domenet før erstatningen er gjennomgått og godkjent. Ikke slett Durable-siden ved denne utrullingen.

## Validering og status

- `npm run check`: syntakskontroll av server og klientkode.
- `npm run staging:check`: disponibel produksjonskontroll med backup/gjenoppretting, uten e-post.
- `npm test`: HTTP-integrasjonstester for innhold, autentisering, CSRF, validering, lagring etter omstart, datoer, booking, kalender, personverngrenser og alle lokale bilder.
- GitHub Actions kjører kontrollene ved push og pull requests.
- Cloud Browser-kontroll er gjennomført på desktop og ved visningsbredder 320, 390 og 768 CSS-piksler. Fontvekter, mobiloverflyt, kortoppsett og trekkspillimport er rettet. Se `docs/VISUELL-QA.md`. Privat tilgang og bokføringslogikk er kontrollert med HTTP-tester. Kontrollpanelets utseende er kontrollert med tydelig merkede testdata.
- Ingen produksjonsserver er valgt eller konfigurert i denne endringen. Det er ikke opprettet en offentlig erstatningsadresse.
- Innsending er stengt og søkeindeksering er blokkert som standard.
- Personverninformasjon og faktisk driftsleverandør må ferdigstilles før skjemaene åpnes.

Se [migreringsnotatene](docs/MIGRERING.md) for tekstendringer og avvik fra originalen.

### Eierdashboard og e-post

`/min-side` er bare for eieren og beskyttes av passord og serverkontroll. Klientene trenger ingen konto eller private lenker; videre dialog skjer på e-post. Nye henvendelser lagres i kontrollpanelet og kan sendes til Google Workspace etter autorisasjon. Se [E-postoppsett](docs/EMAIL.md) og [Eierkontrollpanel](docs/KONTROLLPANEL.md). `EMAIL_ENABLED=false` og `CLIENT_PORTAL_ENABLED=false` er standard. Ingen faktisk sending er verifisert ennå.
