# E-post først – Google Workspace

Eieren bekreftet 7. november 2026 at adressen er **post@isaacwilliam.no**, ikke post@isaacwilliamlunde.no. Arbeidet med e-post er gjenopptatt. Google Workspace er eksisterende leverandør. Ingen DNS-endringer er gjort.

## Status

Eier opplyser at eierens Google-konto er knyttet til Workspace-oppsettet. Dette er notert som informasjon for kontotilgang; det er ikke bekreftet som autorisasjon for nettstedets SMTP-avsender post@isaacwilliam.no.

Serverkode for SMTP, vedvarende utboks og leveringsstatus er implementert og testet med en lokal simulert transport. Ingen faktiske meldinger er sendt. Google-autorisasjon, tilkobling fra driftsserveren og faktisk levering til innboks er **ikke verifisert**. Den tilgjengelige Gmail-tilkoblingen i ChatGPT er en separat management-konto, ikke denne Workspace-postkassen; ChatGPTs tilgang autoriserer ikke nettstedet til å sende.

## Flyt for klienten

Klienten sender en forespørsel uten konto eller privat lenke. Nettsiden lagrer henvendelsen, legger varsel til post@isaacwilliam.no og en kort kvittering til klienten i utboksen når e-post er aktivert. Varselet har klientens adresse som Reply-To. Eieren kan dermed svare direkte fra Google Workspace. Kvitteringen har post@isaacwilliam.no som Reply-To.

Videre svar mottas i Google Workspace og importeres ikke automatisk til kontrollpanelet. Kontrollpanelet er eierens interne oversikt og innholdsredigering. Fakturering skjer utenfor nettsiden. `CLIENT_PORTAL_ENABLED=false` er standard; den tidligere private-lenke-funksjonen brukes ikke i denne klientflyten.

## Oppsett på driftsserveren

1. Installer låste avhengigheter med `npm ci --omit=dev --ignore-scripts` eller bygg Docker-imaget. Sett opp vedvarende lagring, HTTPS og eierpassord som beskrevet i DRIFT.md.
2. Autoriser Google-sending på serveren. Velg én av metodene Google tillater for kontoen:
   - Gmail SMTP med et **app-passord**, hvis Google 2-trinnsbekreftelse og Workspace-policy tillater det. Vanlig Google-passord skal ikke brukes. Sett `SMTP_USER=post@isaacwilliam.no`, `SMTP_APP_PASSWORD` og standard `smtp.gmail.com:465`.
   - OAuth2 med `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` og samme SMTP-bruker.
   - Google Workspace SMTP-relay med serverens offentlige IP godkjent av administratoren, TLS og `SMTP_HOST=smtp-relay.gmail.com`, `SMTP_RELAY_IP_AUTH=true`.
3. Hold disse verdiene i serverens hemmelige miljøoppsett. Ingen passord eller tokens i GitHub, skjermbilder, chat eller innholdsredigeringen. Konto- og hemmelighetsoppsett utføres i Googles og vertens sikre grensesnitt.
4. Sett `BOOKING_EMAIL_TO=post@isaacwilliam.no` og `EMAIL_ENABLED=true`. Serveren avviser aktivert, ufullstendig konfigurasjon ved start.
5. Logg inn på `/min-side`, åpne **E-post**, og velg **Kontroller Google-forbindelsen**. Dette tester SMTP-tilgang uten å sende e-post. Det bekrefter ikke MX, innboksmottak eller spamplassering.
6. Før offentlig åpning: send en avtalt testforespørsel fra en adresse eieren kontrollerer. Kontroller varsel, kvittering, Reply-To og faktisk innboksmottak. Avklar personverninformasjon og behold offentlig booking stengt til oppsettet er godkjent.

## Feil og gjenoppretting

En gyldig forespørsel lagres selv om SMTP er nede. Utboksen følger samme SQLite-sikkerhetskopi som henvendelsene. Det gjøres inntil fem forsøk med økende pause. **E-post** viser ventende, sendte og feilede jobber; feilede kan forsøkes på nytt. Bare en eier med gyldig økt og CSRF-token kan hente status, teste sendingstilgang eller be om nye forsøk.

Status «sendt» betyr at SMTP-serveren tok imot meldingen, ikke at klienten leste den eller at den kom i innboksen. Utsending er minst én gang: et brudd etter SMTP-aksept, men før lagret bekreftelse, kan føre til en dublett. Stabil Message-ID brukes ved nye forsøk. Hemmeligheter og rå SMTP-feil lagres ikke i utboksen; bare en begrenset feilkode vises.

Sletting av en forespørsel sletter tilhørende ventende jobber fra aktiv database. Allerede sendte e-poster og sikkerhetskopier må håndteres etter den avklarte lagringsrutinen.

## Dokumentasjon

- Google Workspace: https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app
- Google OAuth2 for SMTP: https://developers.google.com/workspace/gmail/imap/xoauth2-protocol
- Nodemailer: https://nodemailer.com/guides/using-gmail og https://nodemailer.com/smtp
