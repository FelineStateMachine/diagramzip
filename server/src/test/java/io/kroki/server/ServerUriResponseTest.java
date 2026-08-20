package io.kroki.server;

import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.client.HttpResponse;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.codec.BodyCodec;
import io.vertx.junit5.VertxExtension;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.io.IOException;
import java.net.ServerSocket;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static io.kroki.server.ServerTest.randomAlphaString;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(VertxExtension.class)
public class ServerUriResponseTest {

  private int port;

  @BeforeEach
  void deploy_verticle(Vertx vertx) throws IOException, TimeoutException {
    ServerSocket socket = new ServerSocket(0);
    port = socket.getLocalPort();
    socket.close();
    DeploymentOptions options = new DeploymentOptions().setConfig(new JsonObject().put("KROKI_PORT", port).put("KROKI_MAX_URI_LENGTH", 8192));
    vertx.deployVerticle(new Server(), options).await(5, TimeUnit.SECONDS);
  }

  @Test
  void http_server_long_uri_not_414(Vertx vertx) throws TimeoutException {
    WebClient client = WebClient.create(vertx);
    HttpResponse<String> response = client.get(port, "localhost", "/" + randomAlphaString(6000))
      .as(BodyCodec.string())
      .send()
      .await(5, TimeUnit.SECONDS);
    assertThat(response.statusCode()).isNotEqualTo(414);
  }

  @Test
  void http_server_long_uri_414(Vertx vertx) throws TimeoutException {
    WebClient client = WebClient.create(vertx);
    HttpResponse<String> response = client.get(port, "localhost", "/" + randomAlphaString(9000))
      .as(BodyCodec.string())
      .send()
      .await(5, TimeUnit.SECONDS);
    assertThat(response.statusCode()).isEqualTo(414);
    assertThat(response.statusMessage()).isEqualTo("Request-URI Too Long");
    assertThat(response.body()).isEqualTo("Error 414: This image link is too large to open. Use a shorter diagram or share the editable diagram.zip link instead.");
  }
}
