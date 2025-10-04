# Meteor Madness — Java Console App

This repository hosts a Java-only starter for the NASA Space Apps **Meteor Madness** challenge. It demonstrates how to query three relevant NASA/JPL endpoints and display concise tables in the console.

## Endpoints
- **CNEOS Close Approach Data (CAD)**: <https://ssd-api.jpl.nasa.gov/cad.api>
- **CNEOS Fireball API**: <https://ssd-api.jpl.nasa.gov/fireball.api>
- **NeoWs (Near-Earth Object Web Service) Feed**: <https://api.nasa.gov/neo/rest/v1/feed>

## Requirements
- JDK 17 or later
- Maven 3.9+
- Set an environment variable `NASA_API_KEY` for the NeoWs feed **or** edit `src/main/resources/nasa-api.properties`. The repository ships with a ready-to-use key for quick testing.

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

## Troubleshooting

### SSLHandshakeException or certificate path errors

Some macOS and corporate environments ship custom trust stores that may not include the NASA/JPL certificate chain, resulting in an error similar to `PKIX path building failed`. There are two ways to proceed:

1. **Recommended:** import the missing CA into your Java trust store (see the [Java documentation](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/keytool.html) for using `keytool -importcert`).
2. **Temporary hackathon fallback:** set the environment variable `NASA_HTTP_INSECURE=true` **or** change `http.insecure=true` inside `src/main/resources/nasa-api.properties`. This disables certificate and hostname validation for all outbound NASA API calls. Use this only if you trust your network because it downgrades HTTPS security.
