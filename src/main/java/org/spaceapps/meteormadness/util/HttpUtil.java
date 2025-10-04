package org.spaceapps.meteormadness.util;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.Map;
import java.util.StringJoiner;

/**
 * Minimal HTTP helper built on Java 11+ HttpClient.
 */
public final class HttpUtil {

    private static final HttpClient CLIENT = createHttpClient();

    private HttpUtil() {
    }

    private static HttpClient createHttpClient() {
        try {
            // Create a trust manager that accepts all certificates
            TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {
                        // Accept all client certificates
                    }
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {
                        // Accept all server certificates
                    }
                }
            };

            // Create SSL context with the trust manager
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustAllCerts, new java.security.SecureRandom());

            return HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .sslContext(sslContext)
                    .build();
        } catch (Exception e) {
            // If SSL configuration fails, fall back to default client
            return HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();
        }
    }

    public static String get(String baseUrl, Map<String, String> query)
            throws IOException, InterruptedException {
        String url = buildUrl(baseUrl, query);
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) {
            throw new IOException("HTTP " + res.statusCode() + " for " + url + " body=" + res.body());
        }
        return res.body();
    }

    public static String buildUrl(String baseUrl, Map<String, String> query) {
        if (query == null || query.isEmpty()) {
            return baseUrl;
        }
        StringJoiner joiner = new StringJoiner("&");
        for (Map.Entry<String, String> entry : query.entrySet()) {
            if (entry.getValue() == null) {
                continue;
            }
            joiner.add(encode(entry.getKey()) + "=" + encode(entry.getValue()));
        }
        return baseUrl + (baseUrl.contains("?") ? "&" : "?") + joiner;
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
