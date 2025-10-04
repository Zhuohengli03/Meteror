package org.spaceapps.meteormadness.clients;

import com.fasterxml.jackson.databind.JsonNode;
import org.spaceapps.meteormadness.util.HttpUtil;
import org.spaceapps.meteormadness.util.JsonUtil;

import java.io.IOException;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Client for the NeoWs (Near Earth Object Web Service) feed.
 * Documentation: https://api.nasa.gov/
 */
public class NeoWsClient {

    private static final String BASE = "https://api.nasa.gov/neo/rest/v1/feed";

    private final String apiKey;
    private final List<String> backupApiKeys;
    private int currentBackupIndex = -1;

    public NeoWsClient() {
        String key = System.getenv("NASA_API_KEY");
        if (key == null || key.isBlank()) {
            key = "DEMO_KEY";
            System.err.println("[WARN] NASA_API_KEY not set. Using DEMO_KEY (rate-limited).");
        }
        this.apiKey = key;
        this.backupApiKeys = Arrays.asList(
            "GYC4tXK4gKMM3nqVKGeFBsKIsb4rwdWf5MiYf5vW",
            "10F7HUB7A6YIQJOH3maRtYLpQ7juI6klyxsqx4Ww"
        );
    }

    public JsonNode fetchFeed(String startDate, String endDate) throws IOException, InterruptedException {
        Map<String, String> query = new LinkedHashMap<>();
        query.put("start_date", startDate);
        query.put("end_date", endDate);
        
        // Use current API key (primary or backup)
        String currentKey = getCurrentApiKey();
        query.put("api_key", currentKey);

        try {
            String json = HttpUtil.get(BASE, query);
            JsonNode result = JsonUtil.parse(json);
            
            // Check if we got a rate limit error
            if (result.has("error") && result.get("error").asText().contains("rate limit")) {
                if (tryNextBackupKey()) {
                    System.out.println("[INFO] API key rate limited, switching to backup key #" + (currentBackupIndex + 1));
                    return fetchFeed(startDate, endDate); // Retry with next backup key
                } else {
                    System.err.println("[ERROR] All API keys have reached rate limits");
                    throw new IOException("Rate limit exceeded for all API keys");
                }
            }
            
            return result;
        } catch (IOException e) {
            // If we get an error and we're not using backup key, try backup
            if (currentBackupIndex == -1 && (e.getMessage().contains("rate limit") || e.getMessage().contains("429"))) {
                if (tryNextBackupKey()) {
                    System.out.println("[INFO] Primary API key failed, switching to backup key #" + (currentBackupIndex + 1));
                    return fetchFeed(startDate, endDate); // Retry with backup key
                }
            }
            throw e;
        }
    }
    
    /**
     * Get the primary API key
     */
    public String getApiKey() {
        return apiKey;
    }
    
    /**
     * Get the currently active API key
     */
    public String getCurrentApiKey() {
        if (currentBackupIndex == -1) {
            return apiKey;
        } else {
            return backupApiKeys.get(currentBackupIndex);
        }
    }
    
    /**
     * Check if currently using backup key
     */
    public boolean isUsingBackupKey() {
        return currentBackupIndex != -1;
    }
    
    /**
     * Try to switch to the next backup key
     * @return true if a backup key is available, false if all are exhausted
     */
    private boolean tryNextBackupKey() {
        currentBackupIndex++;
        return currentBackupIndex < backupApiKeys.size();
    }
    
    /**
     * Get the number of backup keys available
     */
    public int getBackupKeyCount() {
        return backupApiKeys.size();
    }
    
    /**
     * Get the current backup key index (0-based, -1 means using primary)
     */
    public int getCurrentBackupIndex() {
        return currentBackupIndex;
    }
    
    /**
     * Reset to primary API key (useful for testing or after rate limit reset)
     */
    public void resetToPrimaryKey() {
        currentBackupIndex = -1;
        System.out.println("[INFO] Reset to primary API key");
    }
}
