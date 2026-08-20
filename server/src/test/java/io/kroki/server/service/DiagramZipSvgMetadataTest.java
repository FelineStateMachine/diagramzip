package io.kroki.server.service;

import io.kroki.server.decode.DiagramSource;
import io.kroki.server.error.BadRequestException;
import io.kroki.server.format.FileFormat;
import io.vertx.core.buffer.Buffer;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DiagramZipSvgMetadataTest {

  @Test
  void should_add_accessible_metadata_to_svg() {
    String payload = "{\"meta\":{\"title\":\"A & B\",\"description\":\"One < two\"}}";
    String encoded = new String(DiagramSource.encode(payload), StandardCharsets.UTF_8);

    Buffer result = DiagramZipSvgMetadata.decode(encoded)
      .apply(FileFormat.SVG, Buffer.buffer("<?xml version=\"1.0\"?><svg viewBox=\"0 0 10 10\"><path/></svg>"));

    assertThat(result.toString()).contains("<svg viewBox=\"0 0 10 10\"><title>A &amp; B</title><desc>One &lt; two</desc><path/>");
  }

  @Test
  void should_not_change_non_svg_output() {
    String payload = "{\"meta\":{\"title\":\"A title\"}}";
    String encoded = new String(DiagramSource.encode(payload), StandardCharsets.UTF_8);
    Buffer rendered = Buffer.buffer("png");

    assertThat(DiagramZipSvgMetadata.decode(encoded).apply(FileFormat.PNG, rendered)).isSameAs(rendered);
  }

  @Test
  void should_apply_background_padding_and_frame_to_svg() {
    String payload = "{\"presentation\":{\"background\":\"#f4f4f4\",\"padding\":24,\"frame\":true}}";
    String encoded = new String(DiagramSource.encode(payload), StandardCharsets.UTF_8);

    String result = DiagramZipSvgMetadata.decode(encoded)
      .apply(FileFormat.SVG, Buffer.buffer("<svg width=\"100\" height=\"50\" viewBox=\"0 0 100 50\"><path/></svg>"))
      .toString();

    assertThat(result)
      .contains("viewBox=\"-24 -24 148 98\"")
      .contains("style=\"background-color:#f4f4f4;\"")
      .contains("data-diagram-zip-canvas=\"\" fill=\"#f4f4f4\" x=\"-24\" y=\"-24\" width=\"148\" height=\"98\"")
      .contains("data-diagram-zip-frame=\"\"")
      .contains("x=\"-23.5\" y=\"-23.5\" width=\"147\" height=\"97\"");
  }

  @Test
  void should_reject_invalid_metadata() {
    assertThatThrownBy(() -> DiagramZipSvgMetadata.decode("not-valid"))
      .isInstanceOf(BadRequestException.class);
  }

  @Test
  void should_reject_invalid_presentation() {
    String payload = "{\"presentation\":{\"background\":\"red\",\"padding\":300}}";
    String encoded = new String(DiagramSource.encode(payload), StandardCharsets.UTF_8);

    assertThatThrownBy(() -> DiagramZipSvgMetadata.decode(encoded))
      .isInstanceOf(BadRequestException.class);
  }
}
