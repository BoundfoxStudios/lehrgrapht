# Allgemeine Konventionen

Stack-unabhängige Regeln für dieses Projekt. Definiert das Repo an anderer
Stelle (CLAUDE.md, spezifischere Skills) eine abweichende Konvention, geht
die vor.

## Arbeitsweise

- Alignment vor Aktion: Bei nicht-trivialen Aufgaben vor der Umsetzung in
  wenigen Sätzen (1) Verständnis, (2) geplanten Ansatz und (3) Trade-offs
  bzw. Risiken zusammenfassen und die Bestätigung abwarten. Bei Aufgaben über
  3+ Dateien oder mit Architektur-Entscheidungen in den Plan-Modus gehen.
  Ausnahme: Verlangt der Auftrag ausdrücklich autonome Umsetzung oder läuft
  die Session unbeaufsichtigt, Annahmen explizit nennen und weiterarbeiten
  statt zu blockieren.
- Schlägt der User nach einer Implementierung einen anderen Ansatz vor, alt
  und neu mit konkreten Pros und Cons vergleichen, bevor gewechselt wird –
  erhebliche Nachteile klar benennen, damit die Wahl informiert ist.
- Läuft ein Ansatz gegen die Wand (wiederholte Fehlschläge, widerlegte
  Annahmen), anhalten und neu planen statt weiterzudrücken.
- Codebase-Exploration und Recherche an Subagents auslagern – der
  Haupt-Kontext hält Entscheidungen und Ergebnisse, nicht den Suchprozess.
- Jede Programmierarbeit läuft über einen Subagent, nie im Haupt-Kontext –
  auch bei kleinen Änderungen. Der Haupt-Kontext recherchiert, entscheidet
  und schneidet die Aufträge zu; mehrstufige Arbeit wird in eigene
  Subagent-Schritte zerlegt (Implementierung, Tests, Review-Fixes).
- Der Auftrag an einen solchen Subagent ist strikt und abschließend: die zu
  ändernden Dateien mit Pfaden, das gewünschte Zielverhalten, die Ergebnisse
  der Vorab-Recherche (API-Signaturen, bestehende Muster im Repo,
  Doku-Auszüge), die geltenden Konventionen sowie die Akzeptanzkriterien
  samt der Befehle, die sie prüfen. Was nicht im Auftrag steht, wird nicht
  angefasst.
- Diese Subagents forschen nicht mehr – Exploration und Recherche sind
  vorher passiert und stecken im Auftrag. Fehlt etwas oder widerspricht die
  Vorgabe dem Code, meldet der Subagent das zurück, statt selbst zu suchen,
  zu entscheiden oder zu raten.
- Vor Änderungen an nebenläufigem Code identifizieren: geteilter
  veränderlicher Zustand, Ordering-Garantien beim Verschränken von
  Operationen, bestehende Synchronisationsgrenzen; bei async-Code zusätzlich
  Cancellation-Propagation, Backpressure und Atomicity.
- Selbst-Review vor der Fertigmeldung: geänderte Dateien erneut lesen (nicht
  aus dem Gedächtnis), auf unbenutzte Variablen, fehlende Null-Checks,
  inkonsistente Benennung und unbehandelte Edge-Cases prüfen; bauen und die
  betroffenen Tests ausführen.
- Simplicity-Check vor der Fertigmeldung: jede neue Variable, jeder Wrapper,
  jede Zwischen-Collection und jeder Parameter muss sein Gewicht tragen –
  einmal sofort benutzte Werte inlinen; wirkt etwas over-engineered, zuerst
  vereinfachen.

## Code-Stil

- Standard ist null Kommentare. Ein Kommentar wird nur geschrieben, wenn er
  etwas nennt, das der Leser dem Code nicht ansehen kann: einen nicht
  offensichtlichen Algorithmus, einen behandelten Edge-Case, einen Workaround
  oder eine bewusste Entscheidung gegen das Naheliegende – im Zweifel
  weglassen. Dann nur die Essenz, so kurz wie möglich, z.B.
  `// Safari fires pagehide twice; the guard drops the second call`.
- Wirkt Code ohne Kommentar unklar, zuerst Namen verbessern oder eine
  Funktion extrahieren – ein Kommentar ist nur erlaubt, wenn beides die
  Information nicht tragen kann.
- Verbotene Kommentar-Muster – niemals schreiben, auch nicht in Varianten;
  die Liste ist beispielhaft, nicht abschließend:
  - Paraphrase von Code oder Namen: kein `// enables the cooking mode` an
    `isCookingModeEnabled`, kein `// save the user` über
    `repository.save(user)`.
  - Schritt- und Abschnitts-Erzählung: kein `// Validate input`, `// Setup`,
    `// Main logic`, `// --- Helpers ---`; in Tests kein `// Arrange` /
    `// Act` / `// Assert`.
  - Änderungs-Erzählung: kein `// now uses the new API`,
    `// changed to async`, `// as requested` – die Änderung erzählen Diff
    und Commit-Message, nicht der Code.
  - Signatur-Echo: kein JSDoc/XML-Doc/Docstring, der nur Name, Parameter und
    Rückgabetyp umformuliert. Doc-Comments nur, wo das Projekt oder die
    Aufgabe sie verlangt – und dann ohne Parameter-/Return-Echos, nur mit
    Inhalt jenseits der Signatur (Einheiten, Fehlerverhalten,
    Nebenwirkungen).
- Maschinen-Direktiven (`// eslint-disable-next-line`, `# type: ignore`,
  Pragmas, Lizenz-Header) zählen nicht als Kommentare im Sinne dieser Regel.
- Die Regel gilt für selbst geschriebene Kommentare – bestehende Kommentare
  in fremdem Code bleiben unangetastet.
- Keine Abkürzungen in Bezeichnern – Worte immer ausschreiben: `index` statt
  `i` in Schleifen, `template` statt `tpl`. Ausgeschriebene Namen sind besser
  lesbar.
- Jeder Code ist Produktionscode: sauber, vollständig und wartbar – keine
  Provisorien, keine auskommentierten Reste, keine "TODO später"-Lösungen.
  Ausnahme nur, wenn explizit Prototyp- oder Wegwerfcode angefordert wird.
- Generierte Artefakte nie von Hand editieren – Generator, Template oder
  Quelle ändern und neu generieren. Sind generierte Dateien committet, das
  regenerierte Ergebnis zusammen mit der auslösenden Änderung committen.
  Generator-Fehlschläge sichtbar machen (Fehler-Artefakt oder harter
  Abbruch), nie still verschlucken.
- In zeitabhängiger Logik, deren Verhalten Tests kontrollieren müssen, die
  Systemzeit nicht direkt lesen – eine testbar kontrollierbare Uhr verwenden
  (die injizierte Abstraktion, wo der Stack eine bietet).
- Nutzt das Projekt strukturiertes Logging, loggt dasselbe Konzept immer
  unter demselben Property-Namen, damit Logs zuverlässig abfragbar bleiben.

## Testing

- Tests prüfen ausschließlich eigenes Anwendungsverhalten: Geschäftslogik,
  Edge-Cases, Fehlerpfade. Niemals das zugrunde liegende Framework testen –
  z.B. kein Test, ob eine Variable sauber ans UI gebunden wird, ob ein Getter
  den gesetzten Wert liefert oder ob ein Framework-Feature funktioniert; das
  deckt das Framework selbst ab.
- Leitfrage vor jedem Test: Welches Verhalten der Anwendung bricht, wenn
  dieser Test rot wird? Gibt es keine konkrete Antwort, den Test nicht
  schreiben.
- Kein Test-only-Code in Produktion: keine Member, Konstruktoren oder
  Factories, deren einziger Aufrufer ein Test ist (kein `CreateForTesting`,
  keine Seed-/Reset-Methoden nur für Test-Setups) – solche Helfer gehören
  in den Test-Code (Testprojekt bzw. Test-Verzeichnis).
- Sichtbarkeit nie für Tests erweitern: ein Member wird nicht `public` oder
  `internal` (bzw. das Äquivalent des Stacks), nur um testbar zu sein – über
  die bestehende öffentliche Oberfläche testen oder die Logik in einen
  eigenen Typ extrahieren, dessen Sichtbarkeit produktiv begründet ist.
- Vor jedem Mock oder Fake die echte Implementierung ansehen: den echten Typ
  verwenden, wenn er billig zu konstruieren ist (keine I/O, kein globaler
  Zustand, kein DI-Graph) oder nennenswerte Logik trägt – ein abweichender
  Stub maskiert Bugs oder erfindet Fehler, die produktiv nie auftreten.
  Mocken nur, wenn der echte Typ schwere Abhängigkeiten zieht (Datenbank,
  Netzwerk, externe Services); im Zweifel den User fragen statt einen Stub
  zu erfinden.
- "Keine Seiteneffekte"-Assertions dürfen nicht konstruktionsbedingt
  tautologisch wahr sein: Kann der Input-Typ die Daten für den Seiteneffekt
  strukturell gar nicht tragen, prüft der Test nichts – weglassen, wenn ein
  echter Kontrast-Test (gemischter Erfolgs- und Fehlerfall) existiert.
- Organisation: zuerst nach einer bestehenden Testdatei bzw. -Suite für
  denselben Member bzw. dasselbe Feature suchen und dort ergänzen; eine neue
  Datei nur bei echtem neuen Schnitt. Gemeinsame Setup-Infrastruktur
  (Basisklasse, Fixture, geteilter Hook) erst, wenn 2+ Stellen Setup
  duplizieren – nie auf Vorrat.
- Gemeinsames Setup in die Setup-Mechanismen des Frameworks (Konstruktor,
  Setup-Hooks, Fixtures, Helper) – der Arrange-Teil eines Tests enthält nur
  szenariospezifische Werte.
- Pro Repo genau eine Assertion- und genau eine Mocking-Bibliothek.
  Legacy-Muster (alte Assertion-Lib, alter Namensstil) bekommen keine neuen
  Verwendungen – auch beim Ergänzen in Legacy-Dateien den kanonischen Stil
  verwenden.
- Testnamen nennen getestetes Verhalten, Szenario und erwartetes Ergebnis
  (z.B. `AddRow_EmptyTable_AddsRow` – sinngemäß je Test-Framework).

## Branches & Commit-Messages

- Branch-Namen beim Anlegen: nur die Prefixe `feature/`, `fix/` und `release/`,
  immer ausgeschrieben (`feature/abc`, nicht `feat/abc`); andere Prefixe nur
  auf explizite Anweisung.
- Gehört der Branch zu einem GitHub-Issue, steht dessen Nummer direkt nach
  dem Prefix vor dem beschreibenden Namen: `feature/123-add-retry-logic`.
  Nummern nie raten – nur verwenden, wenn das Issue in der Aufgabe genannt
  oder vorher nachgeschlagen wurde.
- Commit-Messages bestehen ausschließlich aus dem Titel (eine Zeile) und sind
  immer auf Englisch – einzige Ausnahme ist die Issue-Referenz unten.
- Commit-Messages folgen Conventional Commits – außer das Repo beschreibt eine
  eigene Konvention, dann gilt die. Standard ist `type: beschreibung`; einen
  Scope (`type(scope): beschreibung`) nur verwenden, wenn das Repo Scopes
  definiert.
- Erlaubte Typen – genau diese, keine anderen:
  - `build`: Änderungen am Build-System oder an externen Dependencies
  - `ci`: Änderungen an CI-Konfiguration und -Skripten
  - `docs`: reine Dokumentations-Änderungen
  - `feat`: ein neues Feature
  - `fix`: ein Bugfix
  - `perf`: eine Code-Änderung, die die Performance verbessert
  - `refactor`: eine Code-Änderung, die weder einen Bug behebt noch ein
    Feature hinzufügt
  - `style`: Änderungen ohne Einfluss auf die Bedeutung des Codes
    (Whitespace, Formatierung, fehlende Semikolons, …)
  - `test`: fehlende Tests ergänzen oder bestehende Tests korrigieren
- Niemals einen Commit-Body schreiben – auch keine Footer/Trailer wie
  `Co-Authored-By` oder "Generated with"-Zeilen.
- Ausnahme: Gehört ein Commit zu einem GitHub-Issue, besteht der Body aus genau
  einer Zeile `Refs #123`; mehrere Issues bekommen je eine eigene Zeile. Kein
  Closing-Keyword im Commit – das gehört in die PR-Beschreibung (siehe unten).
  Nummern nie raten: nur referenzieren, wenn das Issue in der Aufgabe genannt
  oder vorher nachgeschlagen wurde.

## GitHub-Issues

- Issues beschreiben Problem bzw. Anforderung rein fachlich: was, für wen,
  warum, erwartetes Verhalten, Akzeptanzkriterien. Kein Lösungsweg und keine
  Implementierungsskizze – außer der Ansatz wurde vorher explizit gemeinsam
  erarbeitet, dann kommt genau dieser abgestimmte Stand hinein.
- Keine Referenzen auf Dateien, Klassen oder andere Code-Stellen: Issues
  entstehen oft lange vor der Umsetzung, der Code bewegt sich weiter und die
  Referenzen veralten. Fachliche Begriffe statt Code-Symbole verwenden.
- Fließtext ohne harte Zeilenumbrüche schreiben – ein Absatz ist eine Zeile,
  GitHub bricht beim Rendern selbst um. Zeilenumbrüche nur, wo Markdown sie
  braucht (Absatzwechsel, Listen, Code-Blöcke).
- Vor dem Anlegen die fachliche Konzeption im Dialog schärfen: Unklarheiten,
  Edge-Cases und offene Entscheidungen aktiv ansprechen und klären – ein
  Issue wird erst angelegt, wenn keine Fragen offen sind.
- Hat ein Eltern-Issue Kinder (Epic mit Teilaufgaben), die Kinder als
  GitHub-Sub-Issues verknüpfen – nicht als Markdown-Liste oder Task-Liste
  mit `#123`-Links im Body: `gh issue create --parent <eltern-nummer>` beim
  Anlegen bzw. `gh issue edit <eltern-nummer> --add-sub-issue <nummer>`
  nachträglich.

## Pull Requests

- PR-Titel sind immer auf Englisch und folgen nicht Conventional Commits –
  kein `feat:`/`fix:`-Prefix, sondern ein normaler beschreibender Titel
  (z.B. "Add retry logic to the sync job" statt "feat: add retry logic to
  the sync job").
- Für PR-Beschreibungen gilt wie bei Issues: Fließtext ohne harte
  Zeilenumbrüche – GitHub bricht beim Rendern selbst um.
- Gehört ein PR zu einem GitHub-Issue, steht das Closing-Keyword in der
  PR-Beschreibung – `Fixes #123` bei Bugs, sonst `Closes #123`; mehrere
  Issues bekommen je eine eigene Zeile.
- Standard ist eine leere PR-Beschreibung. Hinein kommen nur das
  Closing-Keyword (oben) und, soweit Titel, verlinktes Issue und Diff es
  nicht schon sagen, ein bis wenige Sätze zu Was und Warum sowie
  Reviewer-Wissen, das dem Diff nicht anzusehen ist: Breaking Changes,
  Migrations- oder Deploy-Schritte, manuell zu prüfendes Verhalten, bewusste
  Entscheidungen gegen das Naheliegende. Leitfrage vor jedem Satz: Sagt es
  Titel, Issue oder Diff schon? Wenn ja, weglassen – auch wenn die
  Beschreibung dann nur aus dem Closing-Keyword besteht oder leer bleibt.
- Verbotene Muster in PR-Beschreibungen – niemals schreiben, auch nicht in
  Varianten; die Liste ist beispielhaft, nicht abschließend:
  Boilerplate-Überschriften (`## Summary`, `## Changes`, `## Test plan`),
  Nacherzählung der Änderungen als Bullets oder Fließtext, Listen geänderter
  Dateien, Wiederholung von PR-Titel oder Issue-Text, Protokoll des eigenen
  Vorgehens oder Testens, Checklisten, Emojis, "Generated with"-Footer.
- Hängen die referenzierten Issues an einem Milestone, den PR demselben
  Milestone zuordnen (`gh pr edit <nummer> --milestone <titel>`). GitHub
  erlaubt nur einen Milestone pro PR – verteilen sich die Issues auf
  mehrere, nachfragen statt raten.
- Kommen nach dem Erstellen eines PRs weitere Anmerkungen, die thematisch zu
  diesem PR gehören, zuerst prüfen, ob der PR schon im Review ist:
  `gh pr view <nummer> --json reviewRequests,reviews`. Sind beide leer, den
  bestehenden PR aktualisieren (auf denselben Branch pushen) statt einen neuen
  zu eröffnen. Ist ein Reviewer assigned oder ein Review abgegeben, den PR
  nicht mehr anfassen, sondern die Änderung als neuen PR machen.

## Dependencies & Versionen

- Beim Hinzufügen oder Aktualisieren von Dependencies (npm, NuGet, pip, …)
  niemals Versionen aus dem Trainingswissen übernehmen – immer zuerst die
  aktuell neueste Version ermitteln (z.B. `npm view <paket> version`,
  `dotnet package search`, PyPI-/Registry-Abfrage) und diese verwenden.
- Gleiches gilt für GitHub Actions (`uses:`-Referenzen), Basis-Images in
  Dockerfiles und Tool-Versionen in CI-Konfigurationen: vor dem Schreiben die
  neueste Major-Version bzw. das neueste Release nachschlagen (z.B. via
  `gh api repos/<owner>/<repo>/releases/latest`), nicht raten.
- Und für API-Oberflächen: bei Unsicherheit über Signaturen, Parameter oder
  Framework-Verhalten nie raten – aktuelle Doku nachschlagen und bestehende
  Verwendungen im Repo lesen.

## Agent-Dokumentation

Regeln für CLAUDE.md und weitere Agent-Instruktionsdateien im Repo.

- Die Instruktionen sind Teil des Deliverables: Ändert eine Aufgabe
  Architektur, Konventionen, Datenstrukturen oder Verhalten, das dort
  beschrieben ist, den betroffenen Abschnitt im selben Arbeitsgang
  aktualisieren – Doku und Code driften nie auseinander.
- Die Doku beschreibt den Ist-Zustand des Codes, nie das Soll. Entschiedenes,
  aber noch nicht Gebautes explizit als solches markieren – samt der
  Bedingung, wann die Notiz entfällt.
- Kuratierte Landkarte, kein Code-Spiegel: Ein nur im Code sichtbarer Fakt
  kommt nur hinein, wenn mehrere Kriterien zutreffen – wiederkehrend
  gebraucht, querschnittlich oder tragend (Contract/Invariante), nicht
  offensichtlich (Footgun), stabil, teuer herzuleiten. Lokale, leicht
  auffindbare Mechanik bleibt im Code; nie Signaturen auf Vorrat kopieren.
- Netto-Disziplin: Jede Ergänzung hat einen benannten Zielort. Zuerst
  prüfen, ob ein bestehender Eintrag das Wissen schon trägt, und dort
  schärfen statt daneben zu ergänzen; Redundantes oder Veraltetes im selben
  Zug entfernen.
- Nach einer User-Korrektur an einem projektweiten Muster die betroffene
  Stelle als konkrete Regel aktualisieren – nicht als vage Lektion irgendwo
  anhängen.
- Entscheidungen dort dokumentieren, wo ein künftiger Leser sie erneut
  vorschlagen würde: verworfene Alternativen mit Grund, bewusste
  Abweichungen vom Naheliegenden als beabsichtigt markiert, widerlegte
  (Optimierungs-)Hypothesen mit Datum, Messung und dem Vermerk, sie nicht
  erneut zu versuchen.
- Negativ-Wissen festhalten: plausibel klingende, aber nicht (mehr)
  existierende APIs explizit als "X existiert nicht – nutze Y" dokumentieren,
  genau dort, wo ein Agent danach suchen würde.
- Projektmanagement-Inhalte (Termine, Meeting-Notizen, organisatorische
  Fragen) bleiben draußen – die Instruktionen handeln vom Code.
- Wächst die Doku, lohnen eigene Dateien: ein Glossar (eine kurze,
  verlinkbare Definition pro Fachbegriff, am Code-Symbol verankert, beim
  Antreffen unbekannter Begriffe sofort ergänzt) und ein
  Invarianten-Register (tragende Contracts mit Aussage, Begründung,
  Enforcement-Ort – Code oder nur Konvention – und Symptom einer Verletzung;
  nach einem Bugfix, dessen Ursache ein unerzwungener Contract war, kommt
  ein Eintrag dazu).

## Memory

- Maschinenlokales Projekt-Wissen bringt im Team nichts – niemals schreiben,
  du hättest dir etwas gemerkt, wenn es nur lokal gespeichert ist.
- Repo-bezogene Erkenntnisse gehören ins Repo (z.B. in dessen CLAUDE.md)
  und werden committet.
- Globale Erkenntnisse (Arbeitsweise, Vorlieben, Umgebung) stattdessen dem
  User mitteilen, damit er sie in seiner persönlichen Konfiguration
  verankert.

<!-- TODO: Eigene Konventionen ergänzen (projektspezifischer Stil, Review-Regeln, ...) -->
