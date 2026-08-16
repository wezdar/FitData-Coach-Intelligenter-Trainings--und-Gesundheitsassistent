# Recruiter-Bericht — FitData Coach

[Projekt-README](../README_DE.md) · [English version](RECRUITER_REPORT.md) · [Recruiter-Leitfaden](RECRUITER_GUIDE_DE.md)

- **Bewertungsdatum:** 16. August 2026
- **Projekttyp:** Eigenständige Portfolio-Anwendung
- **Primäres Profil:** Data-/Full-Stack-Engineer mit Produkt- und Analytics-Fokus

## Zusammenfassung

FitData Coach liefert ein starkes Portfolio-Signal, weil drei häufig getrennt präsentierte Bereiche verbunden werden: eine ausgearbeitete Produktoberfläche, ein validiertes Backend und eine beobachtbare analytische Datenpipeline. Das unterscheidende Merkmal ist nicht nur Fitness-Tracking, sondern die Behandlung von Lineage, Annahmen und Datenqualität als sichtbare Produktfunktionen.

Das Repository ist besonders relevant für Junior- bis Mid-Level-Positionen in Data Engineering, Analytics Engineering, Python-Backend oder Full Stack. Die stärksten Nachweise sind die Breite der implementierten Verträge und die konsistente Produktgeschichte. Die wichtigste Einschränkung ist die Integrationsvollständigkeit: Teile des Frontends demonstrieren derzeit das vorgesehene API-Verhalten, ohne es durchgängig zu persistieren.

## Nachweisübersicht

| Dimension | Nachweis | Bewertung |
|---|---|---|
| Produktumfang | 13 responsive Oberflächen für Fitness und Datenbetrieb | Große Breite und konsistentes visuelles System |
| Datenarchitektur | Raw-, Staging-, Analytics- und Serving-Schichten | Klare Aufgabentrennung |
| Datenvertrauen | Validierung, Quarantäne, Prüfsummen, dbt-Tests, Frische und Lineage | Starkes Unterscheidungsmerkmal für ein Portfolio-Projekt |
| Backend | FastAPI, Pydantic, SQLAlchemy, Authentifizierung und Domain-Services | Gute modulare Grundlage |
| Frontend | React 19, TypeScript und spezialisierte Visualisierungsbibliotheken | Starkes Informationsdesign für komplexe Daten |
| Tests | Frontend-, Berechnungs-, API-, Authentifizierungs-, Import-, Trainings- und Pipeline-Tests | Gute Testvielfalt über mehrere Grenzen hinweg |
| Betrieb | Docker Compose und GitHub Actions | Glaubwürdige Reproduzierbarkeit |
| Dokumentation | Zweisprachiges README, API-/Lineage-Dokumente und Recruiter-Tour | Prüferfreundlich und transparent |

## Technische Stärken

### 1. Geschichtete Datenarchitektur

Der Ingestion-Pfad bewahrt Originaldateien vor der Validierung auf. Das unterstützt Auditierbarkeit und ermöglicht eine erneute Verarbeitung nach Änderungen der Validierungsregeln. Typisiertes Staging, explizite Quarantäne und dbt-Analytics-Modelle zeigen Verständnis des Datenlebenszyklus statt eines einfachen CRUD-Ansatzes.

### 2. Erklärbarkeit als Entwurfsprinzip

Kennzahlenantworten enthalten Formel, Einheit, Annahmen, Grenzen und Datenherkunft. Trainingsempfehlungen sind deterministisch. Diese Entscheidungen verbessern Testbarkeit und sichere Kommunikation in einer gesundheitsnahen Domäne.

### 3. Produktisierte Beobachtbarkeit

Pipeline-Zustand und Datenqualität besitzen eigene Oberflächen. Das ist eine sinnvolle Produktentscheidung: Vertrauensindikatoren werden für Nutzer und Prüfer sichtbar, statt nur in Logs zu existieren.

### 4. Konsistenz über den Stack

Entsprechende Berechnungslogik existiert in Python und TypeScript mit Referenztests. API-Router, Service-Module, Datenmodelle und Feature-Seiten sind ausreichend klar getrennt, um die Anwendung weiterzuentwickeln.

### 5. Ehrliche Kommunikation des Lieferstands

Die Projektdokumentation benennt die teilweise UI-/API-Anbindung und weitere Roadmap-Arbeit. Dadurch wird Produktionsreife nicht übertrieben, und Interviewer erhalten konkrete Diskussionspunkte.

## Risiken und Entwicklungsprioritäten

| Priorität | Lücke | Empfohlener nächster Schritt |
|---|---|---|
| Hoch | Frontend-Formulare und Mutationen werden nicht vollständig über authentifizierte APIs persistiert | Onboarding, Einstellungen, Planerzeugung und Import mit Lade-, Optimistic- und Fehlerzuständen verbinden |
| Hoch | Der vollständige serviceübergreifende Pfad benötigt reproduzierbare Compose-Verifikation | Integrationsjob ergänzen, der den Stack startet, Daten seeded und einen End-to-End-Ablauf prüft |
| Mittel | Datenbankschemaänderungen werden nicht migrationsbasiert verwaltet | Alembic einführen und Vorwärts-/Rückwärtsmigrationen testen |
| Mittel | Raw-Objekt-Löschung ist nicht vollständig | Aufbewahrungs- und Kontolösch-Orchestrierung für MinIO-Objekte implementieren |
| Mittel | Browser-Barrierefreiheit ist nur begrenzt abgedeckt | Tastatur-, Screenreader- und automatisierte Accessibility-Prüfungen ergänzen |
| Niedrig | Keine Synchronisierung externer Anbieter | Erst nach Datenschutz-, Einwilligungs- und OAuth-Bedrohungsanalyse hinzufügen |

## Empfohlener Interviewfokus

Ein Interview zu diesem Projekt sollte Entscheidungen untersuchen und nicht nur die visuelle Ausarbeitung:

- Raw-Objektspeicher gegenüber direkter Datenbank-Ingestion;
- Idempotenz, Deduplizierung und Wiederholungsverhalten;
- transaktionale Grenzen zwischen Airflow, dbt und Serving Layer;
- deterministische Empfehlungen gegenüber gelernten Modellen;
- Umgang mit Unsicherheit und Sicherheit bei Fitnessberechnungen;
- Priorisierung der verbleibenden Frontend-/API-Integrationen;
- notwendige Beobachtbarkeitssignale für den Produktionsbetrieb.

## Einstellungssignal

Das Projekt unterstützt ein positives Signal im technischen Screening für Kandidaten, die Datenprodukte über Systemgrenzen hinweg entwickeln sollen. Es ist besonders wertvoll, wenn die Position Verantwortung von Ingestion und Modellierung bis zu API und User Experience verlangt. Die Produktionsreife sollte nach Diskussion der genannten Integrationslücken und der dazugehörigen technischen Entscheidungen bewertet werden.

Dieser Bericht ist eine repositorybezogene Portfolio-Bewertung und keine unabhängige Zertifizierung oder Produktions-Sicherheitsprüfung.
