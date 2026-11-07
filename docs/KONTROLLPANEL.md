# Eierkontrollpanel og klienter

**Eieren:** `/min-side`, med eierpassord. Bare en autentisert eierøkt kan lese henvendelser, redigere innhold og se e-poststatus. Lenken er skjult i offentlige menyer, men sikkerheten håndheves av serveren – ikke av at adressen er skjult. Bokmerk siden.

**Klienten:** sender en uforpliktende forespørsel på den offentlige nettsiden og fortsetter på e-post. Ingen konto, klientdashboard eller privat lenke kreves. Klienter ser aldri eierens dashboard eller andre henvendelser.

## Din arbeidsflyt

1. Åpne **Forespørsler** eller les varselet i Google Workspace når sending er aktivert.
2. Velg **Svar arrangøren på e-post**, eller svar på varselet i postkassen. Reply-To peker til klienten.
3. Avklar innhold, dato, totalpris og vilkår på e-post. Noter avtalen og oppdater status/honorar i kontrollpanelet. En bekreftet booking reserverer datoen.
4. Bruk **Kalender** for sperrede perioder, **Rediger innhold** for tekst/priser/bilder og **E-post** for sendingstilgang og feilede varsler.

Innkommende e-postsvar leses i Google Workspace og importeres ikke automatisk hit. Interne notater og honorarfelt er private. Faktura håndteres utenfor nettsiden.

E-post krever autorisasjon i driftsserverens sikre miljøoppsett. Kontrollpanelets e-postfelt oppretter ingen postkasse og endrer ikke DNS. Se EMAIL.md. Vanlig Google-passord skal ikke legges inn i nettstedets innholdsredigering.

## Gjennomgangskopien

`/kontrollpanel-demo` bruker den samme eiergrensesnittet med fiktive data og en isolert minneadapter. Endringer gjelder bare den åpne siden og forsvinner ved oppdatering. Offentlige skjemaer og ekte sending er stengt. Det er en test av eierverktøyet, ikke en klientkonto.

Varig redigering og mottak krever drift av Node/SQLite-versjonen med HTTPS, vedvarende disk, sikkerhetskopier og ferdig personverninformasjon. E-post må autoriseres og faktisk levering testes før offentlig åpning.

## Tidligere klientportal

Den tidligere funksjonen med private forespørselslenker beholdes som et avslått tilvalg (`CLIENT_PORTAL_ENABLED=false`). Den deles ikke ut ved innsending, og portal-API-et er avvist når tilvalget er av. Den skal ikke aktiveres som et krav for klientene i den nå valgte e-postflyten.
