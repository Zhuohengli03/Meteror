package org.spaceapps.meteormadness.util;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Loads optional configuration from {@code nasa-api.properties} on the classpath.
 */
public final class Config {

    private static final String CONFIG_FILE = "nasa-api.properties";

    private static final Properties PROPERTIES = load();

    private Config() {
    }

    public static String get(String key) {
        return PROPERTIES.getProperty(key);
    }

    private static Properties load() {
        Properties props = new Properties();
        try (InputStream in = Config.class.getClassLoader().getResourceAsStream(CONFIG_FILE)) {
            if (in == null) {
                return props;
            }
            props.load(in);
        } catch (IOException ex) {
            System.err.println("[WARN] Failed to load " + CONFIG_FILE + ": " + ex.getMessage());
        }
        return props;
    }
}
