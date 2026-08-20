package io.kroki.server.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.kroki.server.action.RenderCancellation;
import io.kroki.server.format.FileFormat;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonObject;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Objects;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

public class RenderCache {

  private static final long DEFAULT_MAX_BYTES = 64L * 1024 * 1024;
  private static final long DEFAULT_TTL_SECONDS = 30L * 60;

  private final Cache<Key, Buffer> completed;
  private final ConcurrentHashMap<Key, InFlight> inFlight = new ConcurrentHashMap<>();

  public RenderCache(JsonObject config) {
    long maxBytes = config.getLong("KROKI_RENDER_CACHE_MAX_BYTES", DEFAULT_MAX_BYTES);
    long ttlSeconds = config.getLong("KROKI_RENDER_CACHE_TTL_SECONDS", DEFAULT_TTL_SECONDS);
    this.completed = Caffeine.newBuilder()
      .maximumWeight(Math.max(1, maxBytes))
      .weigher((Key key, Buffer value) -> key.weight(value))
      .expireAfterAccess(Duration.ofSeconds(Math.max(1, ttlSeconds)))
      .build();
  }

  public RenderRequest render(String serviceName, FileFormat fileFormat, String source, JsonObject options,
                              Function<RenderCancellation, Future<Buffer>> loader) {
    Key key = new Key(serviceName, fileFormat, source, options);
    Buffer cached = completed.getIfPresent(key);
    if (cached != null) {
      return RenderRequest.completed(cached);
    }

    while (true) {
      InFlight existing = inFlight.get(key);
      if (existing != null) {
        return existing.subscribe(CacheStatus.COALESCED);
      }

      InFlight created = new InFlight(key);
      if (inFlight.putIfAbsent(key, created) == null) {
        RenderRequest request = created.subscribe(CacheStatus.MISS);
        created.start(loader);
        return request;
      }
    }
  }

  public enum CacheStatus {
    HIT,
    MISS,
    COALESCED
  }

  public static class RenderRequest {
    private final Future<Buffer> future;
    private final CacheStatus status;
    private final Runnable release;
    private final AtomicBoolean released = new AtomicBoolean();

    private RenderRequest(Future<Buffer> future, CacheStatus status, Runnable release) {
      this.future = future;
      this.status = status;
      this.release = release;
    }

    private static RenderRequest completed(Buffer buffer) {
      return new RenderRequest(Future.succeededFuture(buffer), CacheStatus.HIT, () -> {});
    }

    public Future<Buffer> future() {
      return future;
    }

    public CacheStatus status() {
      return status;
    }

    public void release() {
      if (released.compareAndSet(false, true)) release.run();
    }
  }

  private class InFlight {
    private final Key key;
    private final Promise<Buffer> promise = Promise.promise();
    private final RenderCancellation cancellation = new RenderCancellation();
    private final AtomicInteger subscribers = new AtomicInteger();

    private InFlight(Key key) {
      this.key = key;
    }

    private RenderRequest subscribe(CacheStatus status) {
      subscribers.incrementAndGet();
      return new RenderRequest(promise.future(), status, () -> {
        if (subscribers.decrementAndGet() == 0 && !promise.future().isComplete()) {
          cancellation.cancel();
        }
      });
    }

    private void start(Function<RenderCancellation, Future<Buffer>> loader) {
      final Future<Buffer> render;
      try {
        render = loader.apply(cancellation);
      } catch (Throwable throwable) {
        finish(Future.failedFuture(throwable));
        return;
      }
      render.onComplete(this::finish);
    }

    private void finish(io.vertx.core.AsyncResult<Buffer> result) {
      inFlight.remove(key, this);
      if (result.succeeded()) {
        completed.put(key, result.result());
        promise.complete(result.result());
      } else {
        promise.fail(result.cause());
      }
    }
  }

  private static class Key {
    private final String serviceName;
    private final FileFormat fileFormat;
    private final String source;
    private final String options;
    private final int byteLength;

    private Key(String serviceName, FileFormat fileFormat, String source, JsonObject options) {
      this.serviceName = serviceName;
      this.fileFormat = fileFormat;
      this.source = source;
      this.options = new JsonObject(new TreeMap<>(options.getMap())).encode();
      this.byteLength = serviceName.getBytes(StandardCharsets.UTF_8).length
        + source.getBytes(StandardCharsets.UTF_8).length
        + this.options.getBytes(StandardCharsets.UTF_8).length;
    }

    private int weight(Buffer value) {
      long weight = (long) byteLength + value.length();
      return (int) Math.min(Integer.MAX_VALUE, Math.max(1, weight));
    }

    @Override
    public boolean equals(Object object) {
      if (this == object) return true;
      if (!(object instanceof Key)) return false;
      Key key = (Key) object;
      return serviceName.equals(key.serviceName)
        && fileFormat == key.fileFormat
        && source.equals(key.source)
        && options.equals(key.options);
    }

    @Override
    public int hashCode() {
      return Objects.hash(serviceName, fileFormat, source, options);
    }
  }
}
