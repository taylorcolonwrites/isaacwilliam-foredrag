# Visuell kontroll – 6. november 2026

Kontrollen ble gjentatt i Cloud Browser etter at nettleseren fungerte igjen.

## Gjennomført

- De åtte offentlige sidene ble åpnet og inspisert på desktop (1363 CSS-piksler).
- Hjem, Om, Temaer, Booking, Kontakt, Priser, FAQ, Tilbakemeldinger og inngangen til kontrollpanelet ble kontrollert i 320, 390 og 768 CSS-pikslers rammer. Samme sjekk ble gjort for kontrollpanelets oversiktslayout med eksplisitt merkede testdata. Alle 30 kombinasjoner var uten horisontal dokumentoverflyt etter retting.
- Mobilmenyen ble åpnet, og en lenke i menyen ble brukt til å navigere. Tematrekkspill ble åpnet og innholdet kontrollert.
- Alle offentlige desktop-sider hadde én hovedoverskrift og ingen feil i ferdiglastede bilder ved kontrollen.
- Kontrollpanelets innloggingsside viser ingen private opplysninger. Oversiktens prioriteringer og beregninger er enhetstestet. Autoriserte og uautoriserte kall er kontrollert i HTTP-integrasjonstestene.
- Alle fire automatiserte tester og syntakskontrollen passerer.

## Rettet ved kontrollen

- Skriftfilene var statiske svarte vekter, feilaktig deklarert som variable. De er erstattet med ekte variable Inter- og Playfair-filer med normal standardvekt.
- Dupliserte numre i trekkspilloverskrifter er fjernet.
- Importøren hadde koblet flere trekkspill til feil tekst. Alle 16 tematiske erfarings-/temaelementer er koblet til de opprinnelige, distinkte svarene fra nettleserinspeksjonen. Regresjonstest dekker dette.
- Seksjonsklasser kolliderte med kort-, sitat- og statistikkrutenettene. Seksjonene har nå egne klassenavn.
- Lange norske ord, flexelementer og skjemafelt fikk enkelte smale visninger til å flyte over. Innhold kan nå brytes og krympes innenfor riktig kolonne.
- Skjulte kontroller følger nå `hidden` også når de har knappestil.
- Det siste originale FAQ-svaret er hentet fra Durable og lagt inn.

## Omfang og begrensninger

Telefon-/nettbrettkontrollene brukte ekte separate visningsrammer i nettleseren, ikke fysiske telefoner eller Safari. En avsluttende kontroll på eierens egne enheter anbefales før offentlig godkjenning. Kontrollpanelets visuelle skjermbilde bruker fiktive testdata; det er ikke et bilde av private kundehenvendelser. Endepunktene `/__qa/*` er bare tilgjengelige når `VISUAL_QA=true` og miljøet ikke er produksjon. Ingen slik tilgang gis i produksjon.

Skjermbilder: `screenshots/dashboard-testdata.jpg` og `screenshots/mobile-booking.jpg`.

Ingen DNS-poster eller innhold hos Durable er endret. Produksjonshosting, e-postkonto og endelig personverntekst er fortsatt separate oppsettspunkter.

## Avsluttende funksjonskontroll

Etter servergjengivelsen ble alle 30 bredde-/sidekombinasjoner kontrollert på nytt uten horisontal overflyt. Et fiktivt skjema ble fylt ut og sendt fra Cloud Browser, mottakskvitteringen ble kontrollert mot databaseposten, og den eksakte testposten ble slettet. Testmiljøets skjemaer ble deretter stengt igjen. Det ble ikke sendt e-post eller opprettet en virkelig booking.

HTTP-testene kontrollerer også at sidetekst og riktige sidetitler finnes uten JavaScript, at innhold ikke kan bryte ut av HTML/JSON, og at passordendring ugyldiggjør gamle innlogginger. Skjermbildet `screenshots/home-ready.jpg` viser den ferdige forsiden i testmiljøet.

## Gjennomgang før eierens vurdering – 6. november 2026

- Booking har frivillig markering for tidligere kunder og sammenfoldede fakturaopplysninger. Ingen kundekonto eller betaling på nettsiden.
- Faktura-e-post, ni-sifret organisasjonsnummer og referanse valideres på serveren og vises bare i kontrollpanelet. Tester kontrollerer lagring og at offentlig innhold ikke røper opplysningene.
- Generelle kontaktmeldinger krever ikke organisasjon. Påkrevde og valgfrie felt forklares, ugyldige påkrevde felt markeres for hjelpemidler.
- Skriftstørrelser er relative, navigasjonslenker og kontroller har større treffområder, og kontrastmoduser har egne stiler. Dette er ikke en full WCAG-sertifisering.
- Cloud Browser: fakturafelt utvidet på desktop og i 320 CSS-pikslers iframe. Ingen horisontal overløp (305 px innholdsbredde etter scrollbar). Skjemaene forblir stengt før driftsoppsettet er klart.
- Hjemmesiden er kortere. Udokumenterte resultatstatistikker på Om-siden er erstattet med konkrete forventninger til oppdraget.
- Veiledende priser er justert til 2 000 / 3 500 / 5 000 / 7 500 kr; panelsamtale fortsatt 1 000 kr. Dette er eierens redigerbare prisforslag, ikke en bransjesats. Reise, eventuell avgift, totalpris og betalingsvilkår avtales skriftlig.
- Ingen endringer i DNS, opprinnelig Durable-side eller Google Workspace.

## Redaksjonell og visuell gjennomgang – 6. november, kveld

Alle åtte sider er gjennomgått for kortere tekster, tydeligere formål og enklere vei til forespørsel. Hjem og Om bruker et originalt foto av foredragsholderen. Gjentakelser og lange salgsavsnitt er fjernet. Personlig bakgrunn er fortsatt tilgjengelig i en lukket seksjon. Priser og fakturering er uendret.

Temasiden har fem korte hovedintroduksjoner, målgruppe og en lukket «Se eksempler på undertemaer»-seksjon per tema. Alle 30 undertemaer er beholdt, med kortere titler og forklaringer. Eksemplene beskrives som mulige vinkler, ikke et fast program. Tema følger med til bookingskjemaet.

Cloud Browser: alle åtte sider kontrollert ved 320 og 768 CSS-piksler, uten horisontal overløp og med én hovedoverskrift. Desktopkontroll fant ingen ødelagte bilder eller overløp. Utvidelse med klikk og lukking med Enter er testet; åpen mobilseksjon er også kontrollert. Lenke fra autisme-temaet fylte inn riktig tema i bookingskjemaet. De fire tidligere testsuitene og en ny kontroll for de fem lukkede temagruppene passerer.

Dette er fortsatt en gjennomgangskopi med stengte skjemaer. Ingen DNS-, e-post- eller Durable-endringer.

## Mer personlig presentasjon – 7. november

Hjem og Om viser flere originale bilder fra foredrag og scenesamtale. Bildetekstene beskriver bare det som vises; det er ikke lagt til påstander om kunder, presseomtale eller arrangementstitler. Introduksjon og bookingtekst er mer direkte og personlig. De genuine anmeldelsene og deres anonymiserte rolleetiketter er uendret. Abstrakte bannere er fjernet på booking, kontakt og priser. Browserkontroll bekreftet to korrekt viste galleribilder og ingen horisontal overløp på desktop; skjermbilde er lagret. Kodesjekk og fem tester passerer.

## Biografi og eksterne kilder – 7. november

Om-siden bruker Isaac William Tufte Lunde og bygger igjen hovedsakelig på eierens Durable-biografi: oppvekst, 14 års mobbeerfaring, autistisk perspektiv, psykiske utfordringer, hjelpetelefon, førstehjelp ved selvmordsfare og over sju års formidlingsrelatert erfaring. Den opprinnelige lengre personlige biografien er tilgjengelig i en lukket seksjon. Dette er eieropplysninger fra originalnettstedet, ikke nye påstander fra nettsøk.

Verifiserte eksterne lenker er lagt til under Omtale og arrangementer:
- Blikk, intervju 9. april 2025: https://www.blikk.no/idrett-likestilling-sport/isaac-william-vil-holde-pa-med-idretten-han-elsker-men-transmannen-finner-ikke-plass/267172
- Blikk, oppfølging 24. juli 2025: https://www.blikk.no/askim-idrett-indre-ostfold/isaac-william-fikk-endelig-henvendelsen-han-hapet-pa-na-kan-jeg-drive-med-det-jeg-elsker/275663
- FRI, program med Isaac i panelet Fellesskap, Sølvberget 31. mars 2023: https://www.friosloviken.no/events/transsynlighetsdage-2023-stavanger/

Kun kort oppsummering og lenker, ingen kopierte pressebilder. Eksisterende egne bilder er beholdt. Artiklene er merket som mulige abonnementssaker. Politisk rolleinformasjon og katalogoppføringer er ikke tatt inn som foredragsreferanser.

Browserkontroll: fullt navn, lenker og ny meny vises uten horisontal overløp på desktop. Tilbakemeldinger er synlig i hovedmenyen og har alle 13 anmeldelser; bookingknappen åpner egen side med ett skjema. Kodesjekk og fem tester passerer.

## Eierdashboard og dialog uten e-post – 7. november

- Fortellerstemmen på Om og øvrige egne tekster er konsekvent første person. Sitater fra deltakere beholder sin egen stemme. Lenker til de ikke-foredragsrelaterte Blikk-/FRI-sakene er fjernet fra nettstedets innhold. Ingen konstruerte bookingtall, knapphetsmeldinger eller påstander om popularitet er lagt til.
- Klienten får en unik privat forespørselslenke i kvitteringen, uten kundekonto. Dialog lagres i serverens SQLite-database; eieren leser og svarer i kontrollpanelet. Nye klientmeldinger telles i oversikten og kan markeres som lest. Notater og honorarfelt er interne; tilbud deles eksplisitt i samtalen. Betaling er fortsatt ekstern faktura.
- 256-bits tilfeldig tilgang, kun hashet lagring, 180 dagers gyldighet, no-store og no-referrer på siden. Serveren håndhever tilgang, Origin, CSRF for eiermutasjoner, meldingsgrenser og ratebegrensning. Eier kan tilbakekalle gammel lenke ved å lage en ny etter direkte identitetsavklaring. Dette er ikke en ekstern sikkerhetsrevisjon.
- Automatiserte tester verifiserer avvisning uten/med feil token, isolasjon mellom to forespørsler, at interne notater/pris og faktura-e-post ikke deles, avvisning av feil Origin/CSRF, tom melding, lesemarkering, lenkerotasjon, utløp, hashet lagring, vedvarende meldinger etter restart og bortfall av tilgang ved sletting. Sju tester og kodesjekk passerer.
- Gjennomgangskopien har nå en interaktiv dashboarddemo som bruker samme administrasjonsvisning med fiktive data og en isolert minneadapter. Browserkontroll testet faner, svar og lagring av innhold. Separat klientdemo testet sending av melding og at HTML-lignende tekst gjengis som tekst. Begge sider ble sjekket ved 320 CSS-piksler, også åpen forespørsel, uten horisontal overløp.
- Demoene er tydelig merket, bruker bare fiktive oppdragsdata og er ikke koblet sammen. Endringer tilbakestilles ved oppdatering. Ekte mottak og varig redigering krever serverdrift av Node/SQLite-versjonen. Offentlige innsendinger er stengt i den statiske kopien. E-post, DNS og Durable er uendret.

Se KONTROLLPANEL.md for driftsflyt og begrensninger.

## E-post som klientflyt – 7. november

Eieren bekreftet post@isaacwilliam.no. Klienter skal sende forespørsel uten konto eller private lenker og følges opp på e-post. Eierkontrollpanelet er fortsatt passordbeskyttet og administrerer innhold, kalender og opprinnelige henvendelser. Offentlige sider forklarer denne flyten. Klientportalen er avslått som standard og deler verken token eller tilgang ved innsending. Innkommende e-postsvar leses i Google Workspace, ikke automatisk i dashboardet.

SMTP-kode for eksisterende Google Workspace er klargjort med Nodemailer, en vedvarende SQLite-utboks, separat varsel/kvittering, Reply-To, nye forsøk, begrensede feilkoder og en privat E-post-fane for status, tilkoblingskontroll uten sending og nytt forsøk på feilede jobber. Avhengigheten er låst; Docker og CI installerer med npm ci. Det er ikke laget eller brukt ekte Google-hemmeligheter. SMTP og faktisk innboksmottak er ikke verifisert. Den tilkoblede Gmail-kontoen er management-kontoen, ikke postkassen. Sending forblir avslått.

Tolv tester passerer: de tidligere portaltestene kjøres med eksplisitt aktivert tilvalg; en ny test bekrefter e-poststandard uten konto/token, avvisning av klientportal, eierkrav for data og e-poststatus, CSRF og deaktivert sending. Simulert SMTP tester korrekt Reply-To, fast kvittering uten reflektert klientmelding eller lenke, ingen dobbel kølegging, feil/redaksjon av hemmeligheter, ny sending med stabil Message-ID, gjenoppretting etter omstart og sletting av køjobber med forespørselen. Ingen virkelige e-poster ble sendt.

Cloud Browser bekreftet den nye E-post-fanen, at klientmeldingsskjemaet er borte fra forespørselsvisningen, at bookingteksten ikke krever konto/lenke og at e-postfanen fungerer ved 320 CSS-piksler uten horisontal overløp. Demoens kundeportal-lenke og separate klientdemo er fjernet. Ingen DNS- eller Durable-endringer er gjort.

## Ren produksjonsstaging – 7. november

En separat kildekodekopi ble opprettet uten miljøfiler, runtime og node_modules. Ny npm ci, kodesjekk, 12 tester og sju produksjonskontroller passerte. Produksjonskopien ble deretter kjørt gjennom Cloud Browser med fiktiv kontakt staging-browser@example.invalid og avslått e-post. Browserkvitteringen med referanse af1f0da1 samsvarte med én lagret forespørsel; e-postutboksen var tom. Testforespørselen ble slettet. Skjermbildet clean-staging-receipt.jpg viser kvitteringen. Serveren er stoppet, og den vanlige statiske gjennomgangskopien er gjenopprettet som intern forhåndsvisning.

Se STAGING-RESULTAT.md for testavgrensninger og SERVER-HANDOVER.md for vertens videre oppgaver. Docker-bygg og containerstart er lagt som obligatoriske steg i GitHub Actions; Docker finnes ikke lokalt i arbeidsmiljøet.

GitHub Actions-kjøring 42323468095 passerte også Docker-bygg og Smoke-test production image for commit 916ab419c8e5fa133213c8bf9beee2638f758222. Dermed er containeroppsettet testet i tillegg til den rene Node-stagingkopien.
