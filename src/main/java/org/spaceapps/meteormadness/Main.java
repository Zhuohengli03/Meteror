package org.spaceapps.meteormadness;

import com.fasterxml.jackson.databind.JsonNode;
import org.spaceapps.meteormadness.service.MeteorDataService;
import org.spaceapps.meteormadness.util.TablePrinter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Entry point for the console demo.
 */
public class Main {

    public static void main(String[] args) throws Exception {
        boolean demoMode = Arrays.asList(args).contains("--demo");
        MeteorDataService service = new MeteorDataService();

        if (demoMode) {
            runCadDemo(service);
            runFireballDemo(service);
            runNeoWsDemo(service);
            return;
        }

        // Default behaviour mirrors demo for now.
        runCadDemo(service);
        runFireballDemo(service);
        runNeoWsDemo(service);
    }

    private static void runCadDemo(MeteorDataService service) throws Exception {
        System.out.println("\n=== Close Approach Data (CAD) Demo ===");
        LocalDate now = LocalDate.now();
        String dateMin = now.minusMonths(1).toString();
        String dateMax = now.plusMonths(1).toString();

        List<Map<String, String>> rows = service.getCloseApproaches(dateMin, dateMax, "0.05", "15");
        List<String> headers = List.of("object", "closest_time", "dist_au", "v_rel_km_s", "h_mag");
        List<List<String>> table = new ArrayList<>();
        for (Map<String, String> row : rows) {
            table.add(List.of(
                    firstNonBlank(row.get("fullname"), row.get("des")),
                    row.get("cd"),
                    row.get("dist"),
                    row.get("v_rel"),
                    row.get("h")
            ));
        }
        TablePrinter.printTable(headers, table);
    }

    private static void runFireballDemo(MeteorDataService service) throws Exception {
        System.out.println("\n=== Fireball (Bolide) Demo ===");
        List<Map<String, String>> rows = service.getFireballs("2019-01-01", "15");
        List<String> headers = List.of("date", "lat", "lon", "energy(J)", "vel(km/s)", "alt(km)");
        List<List<String>> table = new ArrayList<>();
        for (Map<String, String> row : rows) {
            table.add(List.of(
                    row.get("date"),
                    row.get("lat"),
                    row.get("lon"),
                    row.get("energy"),
                    row.get("vel"),
                    row.get("alt")
            ));
        }
        TablePrinter.printTable(headers, table);
    }

    private static void runNeoWsDemo(MeteorDataService service) throws Exception {
        System.out.println("\n=== NeoWs Feed Demo ===");
        LocalDate now = LocalDate.now();
        String start = now.minusDays(2).toString();
        String end = now.plusDays(2).toString();

        JsonNode feed = service.getNeoFeed(start, end);
        JsonNode neosByDate = feed.get("near_earth_objects");
        if (neosByDate == null || neosByDate.isNull()) {
            System.out.println("No NEO feed returned.");
            return;
        }

        List<String> headers = List.of("date", "name", "hazardous?", "est_diam_km_min", "est_diam_km_max");
        List<List<String>> aggregated = new ArrayList<>();

        neosByDate.fields().forEachRemaining(entry -> {
            String date = entry.getKey();
            for (JsonNode obj : entry.getValue()) {
                String name = obj.path("name").asText();
                String hazardous = obj.path("is_potentially_hazardous_asteroid").asBoolean(false) ? "yes" : "no";
                JsonNode diam = obj.path("estimated_diameter").path("kilometers");
                String min = diam.path("estimated_diameter_min").asText();
                String max = diam.path("estimated_diameter_max").asText();
                aggregated.add(List.of(date, name, hazardous, min, max));
            }
        });

        List<List<String>> limited = new ArrayList<>(
                aggregated.subList(0, Math.min(aggregated.size(), 20))
        );
        TablePrinter.printTable(headers, limited);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}
