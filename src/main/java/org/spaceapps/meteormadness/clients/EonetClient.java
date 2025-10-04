package org.spaceapps.meteormadness.clients;

import com.fasterxml.jackson.databind.JsonNode;
import org.spaceapps.meteormadness.util.HttpUtil;
import org.spaceapps.meteormadness.util.JsonUtil;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Client for the EONET (Earth Observatory Natural Event Tracker) API.
 * Documentation: https://eonet.gsfc.nasa.gov/docs/v3.0
 */
public class EonetClient {

    private static final String BASE = "https://eonet.gsfc.nasa.gov/api/v3";
    private static final String EVENTS_ENDPOINT = BASE + "/events";
    private static final String CATEGORIES_ENDPOINT = BASE + "/categories";

    /**
     * Fetch natural events from EONET
     * @param days Number of days to look back (default 30)
     * @param limit Maximum number of events to return (default 50)
     * @param status Event status (open, closed, all)
     * @return List of event data
     */
    public List<Map<String, Object>> fetchEvents(Integer days, Integer limit, String status) 
            throws IOException, InterruptedException {
        
        Map<String, String> query = new LinkedHashMap<>();
        if (days != null) query.put("days", days.toString());
        if (limit != null) query.put("limit", limit.toString());
        if (status != null && !status.isEmpty()) query.put("status", status);

        String json = HttpUtil.get(EVENTS_ENDPOINT, query);
        JsonNode root = JsonUtil.parse(json);

        List<Map<String, Object>> events = new ArrayList<>();
        JsonNode eventsArray = root.get("events");
        
        if (eventsArray != null && eventsArray.isArray()) {
            for (JsonNode event : eventsArray) {
                Map<String, Object> eventData = new LinkedHashMap<>();
                
                // Basic event info
                eventData.put("id", event.path("id").asText());
                eventData.put("title", event.path("title").asText());
                eventData.put("description", event.path("description").asText());
                eventData.put("link", event.path("link").asText());
                eventData.put("status", event.path("closed").asBoolean(false) ? "closed" : "open");
                
                // Categories
                List<String> categories = new ArrayList<>();
                JsonNode categoriesArray = event.get("categories");
                if (categoriesArray != null && categoriesArray.isArray()) {
                    for (JsonNode category : categoriesArray) {
                        categories.add(category.path("title").asText());
                    }
                }
                eventData.put("categories", categories);
                
                // Geometry (coordinates)
                JsonNode geometries = event.get("geometries");
                if (geometries != null && geometries.isArray() && geometries.size() > 0) {
                    JsonNode firstGeometry = geometries.get(0);
                    JsonNode coordinates = firstGeometry.get("coordinates");
                    if (coordinates != null && coordinates.isArray() && coordinates.size() >= 2) {
                        // EONET uses [longitude, latitude] format
                        eventData.put("longitude", coordinates.get(0).asDouble());
                        eventData.put("latitude", coordinates.get(1).asDouble());
                        eventData.put("date", firstGeometry.path("date").asText());
                    }
                }
                
                // GIBS layers for visualization
                List<String> gibsLayers = new ArrayList<>();
                JsonNode sources = event.get("sources");
                if (sources != null && sources.isArray()) {
                    for (JsonNode source : sources) {
                        JsonNode sourceLayers = source.get("layers");
                        if (sourceLayers != null && sourceLayers.isArray()) {
                            for (JsonNode layer : sourceLayers) {
                                gibsLayers.add(layer.asText());
                            }
                        }
                    }
                }
                eventData.put("gibsLayers", gibsLayers);
                
                events.add(eventData);
            }
        }
        
        return events;
    }

    /**
     * Fetch available categories from EONET
     * @return List of category data
     */
    public List<Map<String, Object>> fetchCategories() 
            throws IOException, InterruptedException {
        
        String json = HttpUtil.get(CATEGORIES_ENDPOINT, new LinkedHashMap<>());
        JsonNode root = JsonUtil.parse(json);

        List<Map<String, Object>> categories = new ArrayList<>();
        JsonNode categoriesArray = root.get("categories");
        
        if (categoriesArray != null && categoriesArray.isArray()) {
            for (JsonNode category : categoriesArray) {
                Map<String, Object> categoryData = new LinkedHashMap<>();
                categoryData.put("id", category.path("id").asInt());
                categoryData.put("title", category.path("title").asText());
                categoryData.put("description", category.path("description").asText());
                categoryData.put("link", category.path("link").asText());
                categories.add(categoryData);
            }
        }
        
        return categories;
    }

    /**
     * Fetch events by category
     * @param categoryId Category ID to filter by
     * @param days Number of days to look back
     * @param limit Maximum number of events
     * @return List of events for the specified category
     */
    public List<Map<String, Object>> fetchEventsByCategory(Integer categoryId, Integer days, Integer limit) 
            throws IOException, InterruptedException {
        
        Map<String, String> query = new LinkedHashMap<>();
        if (categoryId != null) query.put("category", categoryId.toString());
        if (days != null) query.put("days", days.toString());
        if (limit != null) query.put("limit", limit.toString());

        String json = HttpUtil.get(EVENTS_ENDPOINT, query);
        JsonNode root = JsonUtil.parse(json);

        List<Map<String, Object>> events = new ArrayList<>();
        JsonNode eventsArray = root.get("events");
        
        if (eventsArray != null && eventsArray.isArray()) {
            for (JsonNode event : eventsArray) {
                Map<String, Object> eventData = new LinkedHashMap<>();
                
                eventData.put("id", event.path("id").asText());
                eventData.put("title", event.path("title").asText());
                eventData.put("description", event.path("description").asText());
                eventData.put("link", event.path("link").asText());
                eventData.put("status", event.path("closed").asBoolean(false) ? "closed" : "open");
                
                // Categories
                List<String> categories = new ArrayList<>();
                JsonNode categoriesArray = event.get("categories");
                if (categoriesArray != null && categoriesArray.isArray()) {
                    for (JsonNode category : categoriesArray) {
                        categories.add(category.path("title").asText());
                    }
                }
                eventData.put("categories", categories);
                
                // Geometry
                JsonNode geometries = event.get("geometries");
                if (geometries != null && geometries.isArray() && geometries.size() > 0) {
                    JsonNode firstGeometry = geometries.get(0);
                    JsonNode coordinates = firstGeometry.get("coordinates");
                    if (coordinates != null && coordinates.isArray() && coordinates.size() >= 2) {
                        eventData.put("longitude", coordinates.get(0).asDouble());
                        eventData.put("latitude", coordinates.get(1).asDouble());
                        eventData.put("date", firstGeometry.path("date").asText());
                    }
                }
                
                // GIBS layers
                List<String> gibsLayers = new ArrayList<>();
                JsonNode sources = event.get("sources");
                if (sources != null && sources.isArray()) {
                    for (JsonNode source : sources) {
                        JsonNode sourceLayers = source.get("layers");
                        if (sourceLayers != null && sourceLayers.isArray()) {
                            for (JsonNode layer : sourceLayers) {
                                gibsLayers.add(layer.asText());
                            }
                        }
                    }
                }
                eventData.put("gibsLayers", gibsLayers);
                
                events.add(eventData);
            }
        }
        
        return events;
    }
}
