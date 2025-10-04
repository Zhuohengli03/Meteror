package org.spaceapps.meteormadness.clients;

import com.fasterxml.jackson.databind.JsonNode;
import org.spaceapps.meteormadness.util.Config;
import org.spaceapps.meteormadness.util.HttpUtil;
import org.spaceapps.meteormadness.util.JsonUtil;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Client for the NeoWs (Near Earth Object Web Service) feed.
 * Documentation: https://api.nasa.gov/
 */
public class NeoWsClient {

    private static final String BASE = "https://api.nasa.gov/neo/rest/v1/feed";

    private static final String BUNDLED_KEY = sanitize(Config.get("api.nasa.key"));

    private final String apiKey;

    public NeoWsClient() {
        String key = sanitize(System.getenv("NASA_API_KEY"));
        if (key == null) {
            key = sanitize(System.getProperty("NASA_API_KEY"));
        }
        if (key == null) {
            key = BUNDLED_KEY;
            if (key != null) {
                System.err.println("[INFO] Using NASA API key from nasa-api.properties.");
            }
        }
        if (key == null) {
            key = "DEMO_KEY";
            System.err.println("[WARN] NASA_API_KEY not set. Using DEMO_KEY (rate-limited).");
        }
        this.apiKey = key;
    }

    public JsonNode fetchFeed(String startDate, String endDate) throws IOException, InterruptedException {
        Map<String, String> query = new LinkedHashMap<>();
        query.put("start_date", startDate);
        query.put("end_date", endDate);
        query.put("api_key", apiKey);

        String json = HttpUtil.get(BASE, query);
        return JsonUtil.parse(json);
    }

    private static String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
