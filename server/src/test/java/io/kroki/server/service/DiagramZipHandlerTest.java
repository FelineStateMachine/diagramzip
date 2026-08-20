package io.kroki.server.service;

import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpHeaders;
import io.vertx.core.http.HttpServerResponse;
import io.vertx.ext.web.RoutingContext;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatcher;
import org.mockito.Mockito;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DiagramZipHandlerTest {

  @Test
  void shouldReturnTheApplicationShellWithSecurityHeaders() {
    Vertx vertx = Vertx.vertx();
    RoutingContext routingContext = mock(RoutingContext.class);
    HttpServerResponse response = mock(HttpServerResponse.class);
    when(routingContext.response()).thenReturn(response);
    when(response.putHeader(any(CharSequence.class), any(CharSequence.class))).thenReturn(response);

    Handler<RoutingContext> handler = new DiagramZipHandler(vertx).create();
    handler.handle(routingContext);

    Mockito.verify(response).putHeader(HttpHeaders.CONTENT_TYPE, "text/html; charset=utf-8");
    Mockito.verify(response).putHeader(HttpHeaders.CACHE_CONTROL, "no-cache");
    Mockito.verify(response).putHeader(
      eq("Content-Security-Policy"),
      contains("connect-src 'self' https://*.render.diagram.zip")
    );
    Mockito.verify(response).putHeader(
      eq("Content-Security-Policy"),
      contains("frame-src https://*.render.diagram.zip")
    );
    Mockito.verify(response).putHeader(
      eq("Content-Security-Policy"),
      contains("img-src 'self' blob: data:")
    );
    Mockito.verify(response).end(argThat((ArgumentMatcher<String>) page ->
      page.contains("<title>diagram.zip</title>") && page.contains("/diagram.zip/assets/")
    ));
  }
}
