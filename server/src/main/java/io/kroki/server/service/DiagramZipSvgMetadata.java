package io.kroki.server.service;

import io.kroki.server.decode.DiagramSource;
import io.kroki.server.error.BadRequestException;
import io.kroki.server.error.DecodeException;
import io.kroki.server.format.FileFormat;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonObject;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class DiagramZipSvgMetadata {

  static final String PARAMETER = "dz";
  private static final int MAX_ENCODED_LENGTH = 8192;
  private static final int MAX_DECODED_LENGTH = 16384;
  private static final int MAX_TITLE_LENGTH = 200;
  private static final int MAX_DESCRIPTION_LENGTH = 2000;
  private static final String NUMBER = "[-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][-+]?\\d+)?";
  private static final Pattern VIEW_BOX = Pattern.compile("\\bviewBox\\s*=\\s*\"\\s*(" + NUMBER + ")[,\\s]+(" + NUMBER + ")[,\\s]+(" + NUMBER + ")[,\\s]+(" + NUMBER + ")\\s*\"");
  private static final Pattern STYLE = Pattern.compile("\\bstyle\\s*=\\s*\"([^\"]*)\"");
  private static final Pattern BACKGROUND = Pattern.compile("^#[0-9a-fA-F]{6}$");
  private static final DiagramZipSvgMetadata EMPTY = new DiagramZipSvgMetadata("", "", "", "", 0, false);

  private final String encoded;
  private final String title;
  private final String description;
  private final String background;
  private final int padding;
  private final boolean frame;

  private DiagramZipSvgMetadata(String encoded, String title, String description, String background, int padding, boolean frame) {
    this.encoded = encoded;
    this.title = title;
    this.description = description;
    this.background = background;
    this.padding = padding;
    this.frame = frame;
  }

  static DiagramZipSvgMetadata decode(String encoded) {
    if (encoded == null || encoded.isBlank()) {
      return EMPTY;
    }
    if (encoded.length() > MAX_ENCODED_LENGTH) {
      throw new BadRequestException("Diagram metadata is too large.");
    }
    try {
      String decoded = DiagramSource.decode(encoded, false);
      if (decoded.length() > MAX_DECODED_LENGTH) {
        throw new BadRequestException("Diagram metadata is too large.");
      }
      JsonObject payload = new JsonObject(decoded);
      JsonObject metadata = payload.getJsonObject("meta", new JsonObject());
      JsonObject presentation = payload.getJsonObject("presentation", new JsonObject());
      String title = stringValue(metadata, "title", MAX_TITLE_LENGTH);
      String description = stringValue(metadata, "description", MAX_DESCRIPTION_LENGTH);
      String background = stringValue(presentation, "background", 7);
      if (!background.isEmpty() && !BACKGROUND.matcher(background).matches()) {
        throw new BadRequestException("Diagram presentation is invalid.");
      }
      int padding = integerValue(presentation, "padding", 0, 256);
      boolean frame = booleanValue(presentation, "frame");
      if (title.isEmpty() && description.isEmpty() && background.isEmpty() && padding == 0 && !frame) {
        return EMPTY;
      }
      return new DiagramZipSvgMetadata(encoded, title, description, background, padding, frame);
    } catch (DecodeException | RuntimeException exception) {
      if (exception instanceof BadRequestException) {
        throw (BadRequestException) exception;
      }
      throw new BadRequestException("Diagram metadata could not be decoded.", exception);
    }
  }

  private static int integerValue(JsonObject values, String name, int minimum, int maximum) {
    Object value = values.getValue(name, 0);
    if (!(value instanceof Number)) {
      throw new BadRequestException("Diagram presentation is invalid.");
    }
    Number number = (Number) value;
    int integer = number.intValue();
    if (number.doubleValue() != integer || integer < minimum || integer > maximum) {
      throw new BadRequestException("Diagram presentation is invalid.");
    }
    return integer;
  }

  private static boolean booleanValue(JsonObject values, String name) {
    Object value = values.getValue(name, false);
    if (!(value instanceof Boolean)) {
      throw new BadRequestException("Diagram presentation is invalid.");
    }
    return (Boolean) value;
  }

  private static String stringValue(JsonObject metadata, String name, int maximumLength) {
    Object value = metadata.getValue(name, "");
    if (!(value instanceof String)) {
      throw new BadRequestException("Diagram metadata is invalid.");
    }
    String string = (String) value;
    if (string.length() > maximumLength) {
      throw new BadRequestException("Diagram metadata is too large.");
    }
    return string;
  }

  Buffer apply(FileFormat format, Buffer rendered) {
    if (this == EMPTY || format != FileFormat.SVG) {
      return rendered;
    }
    String svg = rendered.toString();
    int rootStart = svg.indexOf("<svg");
    int rootEnd = rootStart < 0 ? -1 : svg.indexOf('>', rootStart);
    if (rootEnd < 0) {
      return rendered;
    }
    String root = svg.substring(rootStart, rootEnd + 1);
    ViewBox viewBox = ViewBox.from(root);
    if (viewBox != null && padding > 0) {
      viewBox = viewBox.expand(padding);
      root = viewBox.replaceIn(root);
    }
    if (!background.isEmpty()) {
      root = addBackgroundStyle(root, background);
    }

    StringBuilder elements = new StringBuilder();
    if (!title.isEmpty()) {
      elements.append("<title>").append(escapeXml(title)).append("</title>");
    }
    if (!description.isEmpty()) {
      elements.append("<desc>").append(escapeXml(description)).append("</desc>");
    }
    if (!background.isEmpty()) {
      if (viewBox == null) {
        elements.append("<rect data-diagram-zip-canvas=\"\" x=\"0\" y=\"0\" width=\"100%\" height=\"100%\" fill=\"")
          .append(background).append("\"/>");
      } else {
        elements.append(viewBox.rect("data-diagram-zip-canvas=\"\" fill=\"" + background + "\""));
      }
    }
    String decorated = svg.substring(0, rootStart) + root + elements + svg.substring(rootEnd + 1);
    if (frame && viewBox != null) {
      int closingTag = decorated.lastIndexOf("</svg>");
      if (closingTag >= 0) {
        String frameElement = viewBox.inset(0.5).rect("data-diagram-zip-frame=\"\" fill=\"none\" stroke=\"#b8b8b8\" stroke-width=\"1\" vector-effect=\"non-scaling-stroke\"");
        decorated = decorated.substring(0, closingTag) + frameElement + decorated.substring(closingTag);
      }
    }
    return Buffer.buffer(decorated);
  }

  String cacheSuffix() {
    return this == EMPTY ? "" : "\u0000diagram.zip:" + encoded;
  }

  private static String escapeXml(String value) {
    return value
      .replace("&", "&amp;")
      .replace("<", "&lt;")
      .replace(">", "&gt;");
  }

  private static String addBackgroundStyle(String root, String color) {
    Matcher style = STYLE.matcher(root);
    if (style.find()) {
      String declarations = style.group(1);
      if (!declarations.isEmpty() && !declarations.endsWith(";")) {
        declarations += ";";
      }
      return style.replaceFirst(Matcher.quoteReplacement("style=\"" + declarations + "background-color:" + color + ";\""));
    }
    return root.substring(0, root.length() - 1) + " style=\"background-color:" + color + ";\">";
  }

  private static final class ViewBox {
    private final double x;
    private final double y;
    private final double width;
    private final double height;
    private final String original;

    private ViewBox(double x, double y, double width, double height, String original) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.original = original;
    }

    static ViewBox from(String root) {
      Matcher matcher = VIEW_BOX.matcher(root);
      if (!matcher.find()) {
        return null;
      }
      return new ViewBox(
        Double.parseDouble(matcher.group(1)),
        Double.parseDouble(matcher.group(2)),
        Double.parseDouble(matcher.group(3)),
        Double.parseDouble(matcher.group(4)),
        matcher.group()
      );
    }

    ViewBox expand(double amount) {
      return new ViewBox(x - amount, y - amount, width + amount * 2, height + amount * 2, original);
    }

    ViewBox inset(double amount) {
      return new ViewBox(x + amount, y + amount, width - amount * 2, height - amount * 2, original);
    }

    String replaceIn(String root) {
      return root.replace(original, "viewBox=\"" + numbers() + "\"");
    }

    String rect(String attributes) {
      return "<rect " + attributes + " x=\"" + number(x) + "\" y=\"" + number(y) + "\" width=\"" + number(width) + "\" height=\"" + number(height) + "\"/>";
    }

    private String numbers() {
      return number(x) + " " + number(y) + " " + number(width) + " " + number(height);
    }

    private static String number(double value) {
      if (value == Math.rint(value)) {
        return Long.toString((long) value);
      }
      return String.format(Locale.ROOT, "%.4f", value).replaceFirst("0+$", "").replaceFirst("\\.$", "");
    }
  }
}
