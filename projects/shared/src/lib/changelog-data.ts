export interface ChangelogEntry {
  version: string;
  changes: string[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: '1.4.0',
    changes: [
      'Eigene Achsenbeschriftungen für X- und Y-Achse.',
      'Konfigurierbare Punktbezeichnung (A, B, C oder P1, P2, P3).',
      'Punktbeschriftungen bei Flächen mit automatischer oder manueller Positionierung.',
      'Interaktiver Modus für Geraden (zwei Punkte wählen).',
      'Warnung bei Überschreitung der A4-Seitengröße.',
    ],
  },
  {
    version: '1.3.0',
    changes: [
      'Allgemeines Update der Benutzeroberfläche.',
      'Einfügen von Flächen und Linien.',
      'Interaktiver Modus zum Hinzufügen von Punkten, Linien und Flächen.',
    ],
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
  },
  {
    version: '1.1.0',
    changes: [
      'Verbesserte Anzeige, wenn das Task Panel in Word vergrößert wird.',
      'Anzeige der Update-Notizen, wenn ein neues Update installiert wurde.',
    ],
  },
  {
    version: '1.0.0',
    changes: ['Erstes Release von LehrGrapht.'],
  },
];
