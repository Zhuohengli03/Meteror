package org.spaceapps.meteormadness.util;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.Map;
import java.util.StringJoiner;

/**
 * Minimal HTTP helper built on Java 11+ HttpClient with optional insecure mode
 * for environments that lack the necessary CA certificates.
 */
public final class HttpUtil {

    private static final boolean INSECURE_HTTP = detectInsecureMode();

    private static final HttpClient CLIENT = buildClient();

    private HttpUtil() {
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

    private static HttpClient buildClient() {
        HttpClient.Builder builder = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15));

        if (INSECURE_HTTP) {
            try {
                SSLContext context = trustAllContext();
                builder.sslContext(context);
                SSLParameters params = new SSLParameters();
                params.setEndpointIdentificationAlgorithm(null);
                builder.sslParameters(params);
                System.err.println("[WARN] Insecure HTTPS mode enabled. Certificates and hostnames will NOT be validated.");
            } catch (GeneralSecurityException ex) {
                throw new IllegalStateException("Failed to initialize insecure SSL context", ex);
            }
        }

        return builder.build();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static boolean detectInsecureMode() {
        String envFlag = System.getenv("NASA_HTTP_INSECURE");
        if (envFlag != null && envFlag.equalsIgnoreCase("true")) {
            return true;
        }
        String configFlag = Config.get("http.insecure");
        return configFlag != null && configFlag.equalsIgnoreCase("true");
    }

    private static SSLContext trustAllContext() throws GeneralSecurityException {
        TrustManager[] trustAll = new TrustManager[]{
                new X509TrustManager() {
                    @Override
                    public void checkClientTrusted(X509Certificate[] chain, String authType) {
                    }

                    @Override
                    public void checkServerTrusted(X509Certificate[] chain, String authType) {
                    }

                    @Override
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }
                }
        };
        SSLContext context = SSLContext.getInstance("TLS");
        context.init(null, trustAll, new SecureRandom());
        return context;
    }
}
