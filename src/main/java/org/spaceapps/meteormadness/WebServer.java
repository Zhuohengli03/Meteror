package org.spaceapps.meteormadness;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.spaceapps.meteormadness.service.MeteorDataService;
import org.spaceapps.meteormadness.clients.NeoWsClient;
import org.spaceapps.meteormadness.util.JsonUtil;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.Executors;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

/**
 * Simple HTTP server to serve meteor data via REST API and static web files.
 */
public class WebServer {
    
    private static final int PORT = 8080;
    private static final String WEB_ROOT = "web";
    private final MeteorDataService meteorService;
    private final ObjectMapper objectMapper;
    
    public WebServer() {
        this.meteorService = new MeteorDataService();
        this.objectMapper = new ObjectMapper();
    }
    
    public void start() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        
        // API endpoints
        server.createContext("/api/close-approaches", this::handleCloseApproaches);
        server.createContext("/api/fireballs", this::handleFireballs);
        server.createContext("/api/neo-feed", this::handleNeoFeed);
        server.createContext("/api/natural-events", this::handleNaturalEvents);
        server.createContext("/api/event-categories", this::handleEventCategories);
        server.createContext("/api/test", this::handleTest);
        server.createContext("/api/reset-key", this::handleResetKey);
        
        // Static file serving
        server.createContext("/", this::handleStaticFiles);
        
        // Enable CORS
        server.createContext("/api/", this::handleCors);
        
        server.setExecutor(Executors.newFixedThreadPool(10));
        server.start();
        
        System.out.println("Meteor Madness Web Server started on http://localhost:" + PORT);
        System.out.println("Open your browser and navigate to the URL above to view the dashboard!");
    }
    
    private void handleCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(200, 0);
            exchange.getResponseBody().close();
            return;
        }
        
        // Route to appropriate handler
        String path = exchange.getRequestURI().getPath();
        if (path.equals("/api/close-approaches")) {
            handleCloseApproaches(exchange);
        } else if (path.equals("/api/fireballs")) {
            handleFireballs(exchange);
        } else if (path.equals("/api/neo-feed")) {
            handleNeoFeed(exchange);
        } else if (path.equals("/api/natural-events")) {
            handleNaturalEvents(exchange);
        } else if (path.equals("/api/event-categories")) {
            handleEventCategories(exchange);
        } else if (path.equals("/api/test")) {
            handleTest(exchange);
        } else if (path.equals("/api/reset-key")) {
            handleResetKey(exchange);
        }
    }
    
    private void handleCloseApproaches(HttpExchange exchange) throws IOException {
        try {
            Map<String, String> params = parseQueryParams(exchange.getRequestURI().getQuery());
            
            String dateMin = params.getOrDefault("dateMin", LocalDate.now().minusMonths(1).toString());
            String dateMax = params.getOrDefault("dateMax", LocalDate.now().plusMonths(1).toString());
            String distMax = params.getOrDefault("distMax", "0.05");
            String limit = params.getOrDefault("limit", "15");
            
            List<Map<String, String>> data = meteorService.getCloseApproaches(dateMin, dateMax, distMax, limit);
            
            sendJsonResponse(exchange, data);
        } catch (Exception e) {
            sendErrorResponse(exchange, "Error fetching close approaches: " + e.getMessage());
        }
    }
    
    private void handleFireballs(HttpExchange exchange) throws IOException {
        try {
            Map<String, String> params = parseQueryParams(exchange.getRequestURI().getQuery());
            
            String sinceDate = params.getOrDefault("sinceDate", "2019-01-01");
            String limit = params.getOrDefault("limit", "15");
            
            List<Map<String, String>> data = meteorService.getFireballs(sinceDate, limit);
            
            sendJsonResponse(exchange, data);
        } catch (Exception e) {
            sendErrorResponse(exchange, "Error fetching fireballs: " + e.getMessage());
        }
    }
    
    private void handleNeoFeed(HttpExchange exchange) throws IOException {
        try {
            Map<String, String> params = parseQueryParams(exchange.getRequestURI().getQuery());
            
            String startDate = params.getOrDefault("startDate", LocalDate.now().minusDays(2).toString());
            String endDate = params.getOrDefault("endDate", LocalDate.now().plusDays(2).toString());
            
            JsonNode feed = meteorService.getNeoFeed(startDate, endDate);
            JsonNode neosByDate = feed.get("near_earth_objects");
            
            List<Map<String, String>> data = new ArrayList<>();
            if (neosByDate != null && !neosByDate.isNull()) {
                neosByDate.fields().forEachRemaining(entry -> {
                    String date = entry.getKey();
                    for (JsonNode obj : entry.getValue()) {
                        Map<String, String> item = new LinkedHashMap<>();
                        item.put("date", date);
                        item.put("name", obj.path("name").asText());
                        item.put("hazardous", obj.path("is_potentially_hazardous_asteroid").asBoolean(false) ? "yes" : "no");
                        JsonNode diam = obj.path("estimated_diameter").path("kilometers");
                        item.put("min", diam.path("estimated_diameter_min").asText());
                        item.put("max", diam.path("estimated_diameter_max").asText());
                        data.add(item);
                    }
                });
            }
            
            sendJsonResponse(exchange, data);
        } catch (Exception e) {
            sendErrorResponse(exchange, "Error fetching NEO feed: " + e.getMessage());
        }
    }
    
    private void handleNaturalEvents(HttpExchange exchange) throws IOException {
        try {
            Map<String, String> params = parseQueryParams(exchange.getRequestURI().getQuery());
            
            Integer days = params.containsKey("days") ? Integer.parseInt(params.get("days")) : 30;
            Integer limit = params.containsKey("limit") ? Integer.parseInt(params.get("limit")) : 50;
            String status = params.getOrDefault("status", "all");
            Integer categoryId = params.containsKey("category") ? Integer.parseInt(params.get("category")) : null;
            
            List<Map<String, Object>> data;
            if (categoryId != null) {
                data = meteorService.getNaturalEventsByCategory(categoryId, days, limit);
            } else {
                data = meteorService.getNaturalEvents(days, limit, status);
            }
            
            sendJsonResponse(exchange, data);
        } catch (Exception e) {
            sendErrorResponse(exchange, "Error fetching natural events: " + e.getMessage());
        }
    }
    
    private void handleEventCategories(HttpExchange exchange) throws IOException {
        try {
            List<Map<String, Object>> data = meteorService.getEventCategories();
            sendJsonResponse(exchange, data);
        } catch (Exception e) {
            sendErrorResponse(exchange, "Error fetching event categories: " + e.getMessage());
        }
    }
    
    private void handleTest(HttpExchange exchange) throws IOException {
        Map<String, Object> testData = new HashMap<>();
        testData.put("status", "success");
        testData.put("message", "API is working");
        testData.put("timestamp", System.currentTimeMillis());
        testData.put("demo_approaches", List.of(
            Map.of("object", "Test Object 1", "dist", "0.02", "v_rel", "15.5"),
            Map.of("object", "Test Object 2", "dist", "0.03", "v_rel", "12.3")
        ));
        testData.put("demo_fireballs", List.of(
            Map.of("date", "2024-01-10", "energy", "1.2e12", "vel", "15.2"),
            Map.of("date", "2024-01-11", "energy", "8.5e11", "vel", "12.8")
        ));
        testData.put("demo_neos", List.of(
            Map.of("name", "Test NEO 1", "hazardous", "yes", "min", "0.1", "max", "0.3"),
            Map.of("name", "Test NEO 2", "hazardous", "no", "min", "0.05", "max", "0.15")
        ));
        
        // Add API key status information
        NeoWsClient neoWsClient = meteorService.getNeoWsClient();
        String currentKey = neoWsClient.getCurrentApiKey();
        String keyStatus;
        if (neoWsClient.isUsingBackupKey()) {
            int backupIndex = neoWsClient.getCurrentBackupIndex();
            keyStatus = String.format("Using backup key #%d of %d", 
                backupIndex + 1, neoWsClient.getBackupKeyCount());
        } else {
            keyStatus = "Using primary key";
        }
        
        testData.put("api_key_status", Map.of(
            "status", keyStatus,
            "using_backup", neoWsClient.isUsingBackupKey(),
            "current_key", currentKey.substring(0, Math.min(8, currentKey.length())) + "...",
            "primary_key", neoWsClient.getApiKey().substring(0, Math.min(8, neoWsClient.getApiKey().length())) + "...",
            "backup_keys_available", neoWsClient.getBackupKeyCount(),
            "current_backup_index", neoWsClient.getCurrentBackupIndex()
        ));
        
        sendJsonResponse(exchange, testData);
    }
    
    private void handleResetKey(HttpExchange exchange) throws IOException {
        try {
            meteorService.getNeoWsClient().resetToPrimaryKey();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Reset to primary API key");
            response.put("using_backup", meteorService.getNeoWsClient().isUsingBackupKey());
            response.put("current_key", meteorService.getNeoWsClient().getCurrentApiKey().substring(0, 8) + "...");
            
            sendJsonResponse(exchange, response);
        } catch (Exception e) {
            sendErrorResponse(exchange, "Error resetting API key: " + e.getMessage());
        }
    }
    
    private void handleStaticFiles(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        if (path.equals("/")) {
            path = "/index.html";
        }
        
        Path filePath = Paths.get(WEB_ROOT + path);
        
        if (!Files.exists(filePath) || Files.isDirectory(filePath)) {
            send404Response(exchange);
            return;
        }
        
        String contentType = getContentType(path);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, Files.size(filePath));
        
        try (OutputStream os = exchange.getResponseBody();
             InputStream is = Files.newInputStream(filePath)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
        }
    }
    
    private Map<String, String> parseQueryParams(String query) {
        Map<String, String> params = new HashMap<>();
        if (query != null && !query.isEmpty()) {
            for (String param : query.split("&")) {
                String[] keyValue = param.split("=", 2);
                if (keyValue.length == 2) {
                    params.put(keyValue[0], keyValue[1]);
                }
            }
        }
        return params;
    }
    
    private void sendJsonResponse(HttpExchange exchange, Object data) throws IOException {
        String json = objectMapper.writeValueAsString(data);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(200, json.getBytes().length);
        
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json.getBytes());
        }
    }
    
    private void sendErrorResponse(HttpExchange exchange, String message) throws IOException {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        String json = objectMapper.writeValueAsString(error);
        
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(500, json.getBytes().length);
        
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json.getBytes());
        }
    }
    
    private void send404Response(HttpExchange exchange) throws IOException {
        String response = "404 Not Found";
        exchange.sendResponseHeaders(404, response.getBytes().length);
        
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }
    
    private String getContentType(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".js")) return "application/javascript";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".gif")) return "image/gif";
        if (path.endsWith(".svg")) return "image/svg+xml";
        return "text/plain";
    }
    
    public static void main(String[] args) {
        try {
            WebServer server = new WebServer();
            server.start();
        } catch (IOException e) {
            System.err.println("Failed to start web server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
