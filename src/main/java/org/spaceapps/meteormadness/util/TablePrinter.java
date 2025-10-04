package org.spaceapps.meteormadness.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Very small helper to print console tables.
 */
public final class TablePrinter {

    private TablePrinter() {
    }

    public static void printTable(List<String> headers, List<List<String>> rows) {
        List<Integer> widths = new ArrayList<>();
        for (String header : headers) {
            widths.add(header.length());
        }
        for (List<String> row : rows) {
            for (int i = 0; i < row.size(); i++) {
                String cell = row.get(i) == null ? "" : row.get(i);
                widths.set(i, Math.max(widths.get(i), cell.length()));
            }
        }

        for (int i = 0; i < headers.size(); i++) {
            System.out.print(pad(headers.get(i), widths.get(i)));
            System.out.print(i == headers.size() - 1 ? "\n" : " | ");
        }

        for (int width : widths) {
            System.out.print("-".repeat(width));
            System.out.print(" ");
        }
        System.out.println();

        for (List<String> row : rows) {
            for (int i = 0; i < row.size(); i++) {
                System.out.print(pad(row.get(i), widths.get(i)));
                System.out.print(i == row.size() - 1 ? "\n" : " | ");
            }
        }
    }

    private static String pad(String value, int width) {
        if (value == null) {
            value = "";
        }
        if (value.length() >= width) {
            return value;
        }
        char[] spaces = new char[width - value.length()];
        Arrays.fill(spaces, ' ');
        return value + new String(spaces);
    }
}
