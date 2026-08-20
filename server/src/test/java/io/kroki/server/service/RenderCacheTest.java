package io.kroki.server.service;

import io.kroki.server.action.RenderCancellation;
import io.kroki.server.format.FileFormat;
import io.vertx.core.Promise;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class RenderCacheTest {

  @Test
  void should_coalesce_in_flight_renders_and_cache_successes() {
    RenderCache cache = new RenderCache(new JsonObject());
    Promise<Buffer> render = Promise.promise();
    AtomicInteger calls = new AtomicInteger();

    RenderCache.RenderRequest first = cache.render("packetdiag", FileFormat.SVG, "source", new JsonObject(), cancellation -> {
      calls.incrementAndGet();
      return render.future();
    });
    RenderCache.RenderRequest second = cache.render("packetdiag", FileFormat.SVG, "source", new JsonObject(), cancellation -> {
      calls.incrementAndGet();
      return render.future();
    });

    assertThat(first.status()).isEqualTo(RenderCache.CacheStatus.MISS);
    assertThat(second.status()).isEqualTo(RenderCache.CacheStatus.COALESCED);
    assertThat(calls).hasValue(1);

    render.complete(Buffer.buffer("svg"));
    assertThat(first.future().result().toString()).isEqualTo("svg");

    RenderCache.RenderRequest third = cache.render("packetdiag", FileFormat.SVG, "source", new JsonObject(), cancellation -> {
      calls.incrementAndGet();
      return render.future();
    });
    assertThat(third.status()).isEqualTo(RenderCache.CacheStatus.HIT);
    assertThat(third.future().result().toString()).isEqualTo("svg");
    assertThat(calls).hasValue(1);
  }

  @Test
  void should_cancel_when_the_last_subscriber_leaves() {
    RenderCache cache = new RenderCache(new JsonObject());
    Promise<Buffer> render = Promise.promise();
    AtomicReference<RenderCancellation> cancellation = new AtomicReference<>();

    RenderCache.RenderRequest first = cache.render("packetdiag", FileFormat.SVG, "source", new JsonObject(), token -> {
      cancellation.set(token);
      return render.future();
    });
    RenderCache.RenderRequest second = cache.render("packetdiag", FileFormat.SVG, "source", new JsonObject(), token -> render.future());

    first.release();
    assertThat(cancellation.get().isCancelled()).isFalse();
    second.release();
    assertThat(cancellation.get().isCancelled()).isTrue();
  }
}
