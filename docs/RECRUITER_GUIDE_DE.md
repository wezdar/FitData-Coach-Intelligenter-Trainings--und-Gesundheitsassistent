# Recruiter-Leitfaden — FitData Coach

[Projekt-README](../README_DE.md) · [English version](RECRUITER_GUIDE.md) · [Recruiter-Bericht](RECRUITER_REPORT_DE.md)

Dieser Leitfaden unterstützt Recruiter und Hiring Manager dabei, FitData Coach zu bewerten, ohne jedes Implementierungsdetail lesen zu müssen.

## Prüfung in 60 Sekunden

1. Die [Produkt-Tour im README](../README_DE.md#produkt-tour) öffnen.
2. Den [Screenshot der Pipeline-Lineage](../screenshots/10-pipeline-lineage.jpg) ansehen.
3. Den [Implementierungsstand](../README_DE.md#implementierungsstand) lesen; dort werden fertige Funktionen und Roadmap klar getrennt.
4. Die automatisierten Tests in [`tests/`](../tests) und [`backend/tests/`](../backend/tests) überfliegen.

Das Projekt zeigt einen produktorientierten Entwickler, der eine ausgearbeitete User Experience mit Backend-Verträgen, Datenqualität und operativer Transparenz verbindet.

## Prüfung in fünf Minuten

| Zeit | Prüfen | Aussage |
|---|---|---|
| 0–1 Min. | Dashboard und Produktgalerie | Visuelle Hierarchie, responsives Produktdesign und komplexe Datenpräsentation |
| 1–2 Min. | `backend/app/` | API-Design, Validierung, Authentifizierung und Service-Trennung |
| 2–3 Min. | `pipeline/`, `airflow/` und `dbt/` | Geschichtete Ingestion, Validierung, Orchestrierung und analytische Modellierung |
| 3–4 Min. | Kennzahlen-Lineage und Pipeline-Oberflächen | Erklärbarkeit, Beobachtbarkeit und Datenvertrauen als Produktfunktion |
| 4–5 Min. | Tests, CI und Status-Tabelle | Engineering-Disziplin und ehrliche Kommunikation des Lieferstands |

## Kompetenzsignale nach Rolle

### Data Engineer

- Raw-, Staging-, Analytics- und Serving-Schichten haben getrennte Aufgaben.
- MinIO bewahrt unveränderliche Quelldateien und Prüfsummen auf.
- Pandera validiert und normalisiert; abgelehnte Zeilen behalten ihre Begründung.
- Airflow orchestriert den ETL-Ablauf.
- dbt-Modelle und Tests dokumentieren Grain, Wertebereiche, erlaubte Werte und Frische.
- Pipeline- und Datenqualitätsstatus werden im Produkt sichtbar statt als rein operative Details verborgen.

### Backend-/Python-Entwickler

- FastAPI-Router sind nach Domänen getrennt.
- Pydantic-Schemata begrenzen und validieren Eingaben.
- Die Authentifizierung nutzt Argon2-Hashes und JWT-Zugriffstoken.
- Die Trainingsgenerierung ist deterministisch und testbar.
- Berechnete Kennzahlen liefern Formel, Einheit, Annahmen, Grenzen und Lineage.

### Frontend-/Full-Stack-Entwickler

- React 19 und TypeScript bilden 13 responsive Produktoberflächen.
- Gemeinsame Shells und Feature-Komponenten vermeiden Duplikation auf Seitenebene.
- Recharts, FullCalendar und XYFlow passen die Visualisierung an die zugrunde liegende Beziehung an.
- Deutsche und englische Inhaltsgrenzen sind in der Lokalisierungsschicht vorbereitet.
- Reduzierte Bewegung und semantische Interaktionsmuster werden berücksichtigt.

### Produktorientierter Entwickler

- Die Oberfläche erklärt Kennzahlen, statt unerklärte Scores zu präsentieren.
- Synthetische Demo-Daten und medizinische Grenzen sind sichtbar.
- Datenqualität, Quarantäne und Lineage sind Teil der User Experience.
- Das Repository unterscheidet ausgearbeitete Prototypen ausdrücklich von abgeschlossenen Integrationen.

## Empfohlener Live-Demo-Ablauf

Nach dem Start des Frontends:

1. **Übersicht:** Wochenziel, KPI-Karten und Aktivitätstrend erklären.
2. **Trainingsplan:** Ziel, Erfahrung, Tage und Ausstattung verändern; deterministische Generierung erläutern.
3. **Datenanalyse:** Kennzahlenerklärung mit Formel und Lineage öffnen.
4. **Datenimport:** Raw-Upload-Vertrag und synthetische Fixtures erklären.
5. **Pipeline & Lineage:** Einen Datensatz vom Raw Layer bis zum Dashboard verfolgen.
6. **Datenqualität:** Zeigen, warum ungültige Zeilen sichtbar bleiben und nicht stillschweigend verschwinden.

## Sinnvolle Interviewfragen

- Warum wird unveränderlicher Objektspeicher vor relationalem Staging eingesetzt?
- Welche Validierung gehört in den Upload und welche in die ETL-Pipeline?
- Wie sollte der Serving Layer nach einem erfolgreichen dbt-Lauf transaktional aktualisiert werden?
- Wie sollten gesundheitsbezogene Schätzwerte Unsicherheit kommunizieren?
- Was wäre vor der Anbindung eines realen Fitnessanbieters erforderlich?
- Welche Demo-Interaktionen sollten zuerst vollständig mit der API verbunden werden?

## Ehrlicher Umfang und aktuelle Lücken

- Die Produktgalerie verwendet ausschließlich synthetische Daten.
- Mehrere Frontend-Interaktionen demonstrieren stabile Verträge, werden aber noch nicht über die API persistiert.
- Die Compose-Architektur ist konfiguriert; die vollständige serviceübergreifende Integration benötigt eine lokale Docker-Ausführung.
- Datenbankmigrationen, Raw-Objekt-Löschjobs und containerisierte Browser-E2E-Tests stehen auf der Roadmap.
- Es sind keine medizinischen Aussagen, realen Gesundheitsdaten oder externen Anbieterzugänge enthalten.

Diese Grenzen sind dokumentiert, weil die klare Kommunikation von Unsicherheit und offener Integrationsarbeit zur Produktionsentwicklung gehört.

## Lokal starten

Frontend-Prüfung:

```bash
npm ci
npm run dev
```

Vollständiger Stack:

```bash
cp .env.example .env
docker compose up --build
```

Demo-Konto:

```text
demo@fitdata-coach.de
FitData-Demo-2026!
```
