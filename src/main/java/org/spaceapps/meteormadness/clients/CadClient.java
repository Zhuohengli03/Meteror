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
 * Client for the CNEOS Close Approach Data API.
 * Documentation: https://ssd-api.jpl.nasa.gov/doc/cad.html
 */
public class CadClient {

    private static final String BASE = "https://ssd-api.jpl.nasa.gov/cad.api";

    public List<Map<String, String>> fetch(String dateMin, String dateMax, String distMax, String limit)
            throws IOException, InterruptedException {
        Map<String, String> query = new LinkedHashMap<>();
        query.put("date-min", dateMin);
        query.put("date-max", dateMax);
        query.put("dist-max", distMax);
        query.put("limit", limit);
        query.put("fullname", "true");

        String json = HttpUtil.get(BASE, query);
        JsonNode root = JsonUtil.parse(json);

        List<String> fields = new ArrayList<>();
        for (JsonNode field : root.withArray("fields")) {
            fields.add(field.asText());
        }

        List<Map<String, String>> rows = new ArrayList<>();
        for (JsonNode row : root.withArray("data")) {
            Map<String, String> map = new LinkedHashMap<>();
            for (int i = 0; i < fields.size(); i++) {
                JsonNode cell = row.get(i);
                map.put(fields.get(i), cell == null || cell.isNull() ? null : cell.asText());
            }
            rows.add(map);
        }
        return rows;
    }
}
