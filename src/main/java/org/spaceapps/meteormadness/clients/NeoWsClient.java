package org.spaceapps.meteormadness.clients;

import com.fasterxml.jackson.databind.JsonNode;
import org.spaceapps.meteormadness.util.HttpUtil;
import org.spaceapps.meteormadness.util.JsonUtil;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;

/**
 * Client for the NeoWs (Near Earth Object Web Service) feed.
 * Documentation: https://api.nasa.gov/
 */
public class NeoWsClient {

    private static final String BASE = "https://api.nasa.gov/neo/rest/v1/feed";

    private static final String CONFIG_FILE = "nasa-api.properties";

    private final String apiKey;

    public NeoWsClient() {
        String key = System.getenv("NASA_API_KEY");
        if (key == null || key.isBlank()) {
            key = loadFromConfig();
        }
        if (key == null || key.isBlank()) {
            key = "DEMO_KEY";
            System.err.println("[WARN] NASA_API_KEY not set. Using DEMO_KEY (rate-limited).");
        }
        this.apiKey = key;
    }

    private String loadFromConfig() {
        try (InputStream in = NeoWsClient.class.getClassLoader().getResourceAsStream(CONFIG_FILE)) {
            if (in == null) {
                return null;
            }
            Properties props = new Properties();
            props.load(in);
            String key = props.getProperty("api.nasa.key");
            if (key == null || key.isBlank()) {
                System.err.println("[WARN] api.nasa.key missing or blank in " + CONFIG_FILE + ".");
            }
            return key;
        } catch (IOException ex) {
            System.err.println("[WARN] Failed to read " + CONFIG_FILE + ": " + ex.getMessage());
            return null;
        }
    }

    public JsonNode fetchFeed(String startDate, String endDate) throws IOException, InterruptedException {
        Map<String, String> query = new LinkedHashMap<>();
        query.put("start_date", startDate);
        query.put("end_date", endDate);
        query.put("api_key", apiKey);

        String json = HttpUtil.get(BASE, query);
        return JsonUtil.parse(json);
    }
}
