package io.kroki.server.service;

import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpHeaders;
import io.vertx.core.http.HttpServerResponse;
import io.vertx.ext.web.RoutingContext;

public class DiagramZipHandler {

  private static final String CONTENT_SECURITY_POLICY = String.join("; ",
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "connect-src 'self'",
    "font-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'"
  );

  private final String page;

  public DiagramZipHandler(Vertx vertx) {
    this.page = vertx.fileSystem().readFileBlocking("web/diagramzip/index.html").toString();
  }

  public Handler<RoutingContext> create() {
    return routingContext -> {
      HttpServerResponse response = routingContext.response();
      response.putHeader(HttpHeaders.CONTENT_TYPE, "text/html; charset=utf-8");
      response.putHeader(HttpHeaders.CACHE_CONTROL, "no-cache");
      response.putHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
      response.putHeader("Referrer-Policy", "no-referrer");
      response.putHeader("X-Content-Type-Options", "nosniff");
      response.end(page);
    };
  }
}
