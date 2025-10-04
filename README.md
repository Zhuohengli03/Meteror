# Meteor Madness — Java Console App

This repository hosts a Java-only starter for the NASA Space Apps **Meteor Madness** challenge. It demonstrates how to query three relevant NASA/JPL endpoints and display concise tables in the console.

## Endpoints
- **CNEOS Close Approach Data (CAD)**: <https://ssd-api.jpl.nasa.gov/cad.api>
- **CNEOS Fireball API**: <https://ssd-api.jpl.nasa.gov/fireball.api>
- **NeoWs (Near-Earth Object Web Service) Feed**: <https://api.nasa.gov/neo/rest/v1/feed>

## Requirements
- JDK 17 or later
- Maven 3.9+
- (Optional) Set an environment variable `NASA_API_KEY` for the NeoWs feed. If not set, the app falls back to the limited `DEMO_KEY`.

## Build & Run
```bash
mvn -q -DskipTests package
java -jar target/meteor-madness-0.1.0.jar --demo
```

The `--demo` flag triggers three sample queries:
1. Close approaches within ±1 month of today (distance ≤ 0.05 au).
2. Fireball events since 2019-01-01 (top 15 by date).
3. NeoWs daily feed spanning ±2 days around today (first 20 objects printed).

Modify `src/main/java/org/spaceapps/meteormadness/Main.java` to adjust the filters, export formats, or connect the data to downstream visualizations.
