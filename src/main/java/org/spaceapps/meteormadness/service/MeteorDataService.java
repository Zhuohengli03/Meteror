package org.spaceapps.meteormadness.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.spaceapps.meteormadness.clients.CadClient;
import org.spaceapps.meteormadness.clients.EonetClient;
import org.spaceapps.meteormadness.clients.FireballClient;
import org.spaceapps.meteormadness.clients.NeoWsClient;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * High-level facade that exposes the three NASA endpoints used in the demo.
 */
public class MeteorDataService {

    private final CadClient cadClient = new CadClient();
    private final FireballClient fireballClient = new FireballClient();
    private final NeoWsClient neoWsClient = new NeoWsClient();
    private final EonetClient eonetClient = new EonetClient();

    public List<Map<String, String>> getCloseApproaches(String dateMin, String dateMax, String distMax, String limit)
            throws IOException, InterruptedException {
        return cadClient.fetch(dateMin, dateMax, distMax, limit);
    }

    public List<Map<String, String>> getFireballs(String sinceDate, String limit)
            throws IOException, InterruptedException {
        return fireballClient.fetch(sinceDate, limit);
    }

    public JsonNode getNeoFeed(String startDate, String endDate) throws IOException, InterruptedException {
        return neoWsClient.fetchFeed(startDate, endDate);
    }

    public List<Map<String, Object>> getNaturalEvents(Integer days, Integer limit, String status) 
            throws IOException, InterruptedException {
        return eonetClient.fetchEvents(days, limit, status);
    }

    public List<Map<String, Object>> getNaturalEventsByCategory(Integer categoryId, Integer days, Integer limit) 
            throws IOException, InterruptedException {
        return eonetClient.fetchEventsByCategory(categoryId, days, limit);
    }

    public List<Map<String, Object>> getEventCategories() 
            throws IOException, InterruptedException {
        return eonetClient.fetchCategories();
    }
}
