package io.kroki.server.action;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

public class RenderCancellation {

  private final AtomicBoolean cancelled = new AtomicBoolean();
  private final Set<Process> processes = ConcurrentHashMap.newKeySet();
  private final CopyOnWriteArrayList<Runnable> listeners = new CopyOnWriteArrayList<>();

  public boolean isCancelled() {
    return cancelled.get();
  }

  public void register(Process process) {
    if (cancelled.get()) {
      terminate(process);
      return;
    }
    processes.add(process);
    if (cancelled.get() && processes.remove(process)) {
      terminate(process);
    }
  }

  public void unregister(Process process) {
    processes.remove(process);
  }

  public void onCancel(Runnable listener) {
    if (cancelled.get()) {
      listener.run();
      return;
    }
    listeners.add(listener);
    if (cancelled.get() && listeners.remove(listener)) {
      listener.run();
    }
  }

  public void cancel() {
    if (!cancelled.compareAndSet(false, true)) {
      return;
    }
    processes.forEach(RenderCancellation::terminate);
    processes.clear();
    listeners.forEach(Runnable::run);
    listeners.clear();
  }

  private static void terminate(Process process) {
    process.descendants().forEach(child -> {
      if (child.isAlive()) child.destroyForcibly();
    });
    if (process.isAlive()) process.destroyForcibly();
  }
}
