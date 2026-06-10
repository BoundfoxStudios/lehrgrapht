export interface ChangelogEntry {
  version: string;
  changes: string[];
  date: string;
}

export const changelogData: ChangelogEntry[] = [
  {
    version: '1.7.0',
    changes: [
      'Schnelles Erstellen eines leeren Karopapiers direkt von der Startseite.',
      'Die Bereiche "Grenzen & Achsen" und "Darstellung" sind jetzt zu "Grenzen & Darstellung" zusammengefasst.',
    ],
    date: '2026-06-10',
  },
  {
    version: '1.6.0',
    changes: [
      'Überarbeitung des Designs.',
      'Anzeige einer Funktionslegende mit konfigurierbarem Format (z.B. f(x)= oder y=).',
      'Konfigurierbarer Linienstil (durchgezogen, gestrichelt, eigene Striche) für Linien und Funktionen.',
      'Erstellung von Schrägbildern.',
      'Schraffur oder Umriss für Flächen.',
      'Definition von Punkt- und Spiegelachsen.',
      'Anzeigen/Verstecken von Lösungen zur Erstellung von Arbeits- und Lösungsblättern.',
      'Verbesserte Darstellung mathematischer Ausdrücke.',
      'Fehler behoben, bei dem Beschriftungen nicht korrekt positioniert waren.',
    ],
    date: '2026-05-14',
  },
  {
    version: '1.5.0',
    changes: [
      'Vorschaubilder der Plots in der Plot-Liste.',
      'Schnelleres Laden der Plot-Liste.',
      'Fehler behoben, bei dem ein Plot nicht korrekt ersetzt wurde.',
    ],
    date: '2026-02-07',
  },
  {
    version: '1.4.1',
    changes: [
      'Fehler behoben, bei dem Plots aus Version 1.3.0 nicht korrekt geladen werden konnten.',
    ],
    date: '2026-02-06',
  },
  {
    version: '1.4.0',
    changes: [
      'Eigene Achsenbeschriftungen für X- und Y-Achse.',
      'Konfigurierbare Punktbezeichnung (A, B, C oder P1, P2, P3).',
      'Punktbeschriftungen bei Flächen mit automatischer oder manueller Positionierung.',
      'Interaktiver Modus für Geraden (zwei Punkte wählen).',
      'Warnung bei Überschreitung der A4-Seitengröße.',
    ],
    date: '2026-02-04',
  },
  {
    version: '1.3.0',
    changes: [
      'Allgemeines Update der Benutzeroberfläche.',
      'Einfügen von Flächen und Linien.',
      'Interaktiver Modus zum Hinzufügen von Punkten, Linien und Flächen.',
    ],
    date: '2026-01-13',
  },
  {
    version: '1.2.0',
    changes: [
      'Neue Einstellung: Grenzen automatisch an Wertebereich anpassen oder Grenzen so nutzen, wie von der Benutzer:in eingegeben.',
      'Setzen der allgemeinen Einstellungen für Linienstärken und -farben.',
      'Unterstützung von nicht-quadratischen Plots.',
      'Anzeige von Strichen an der 0-Linie.',
      'Duplizieren von Plots.',
      'Möglichkeit, leere Plots zu erzeugen.',
    ],
    date: '2026-01-04',
  },
  {
    version: '1.1.0',
    changes: [
      'Verbesserte Anzeige, wenn das Task Panel in Word vergrößert wird.',
      'Anzeige der Update-Notizen, wenn ein neues Update installiert wurde.',
    ],
    date: '2026-01-01',
  },
  {
    version: '1.0.0',
    changes: ['Erstes Release von LehrGrapht.'],
    date: '2025-12-14',
  },
];
