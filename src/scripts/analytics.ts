// Only track visits on the public production domain (prevents recording pn dev / localhost / LAN IPs)
if (location.hostname === "michifumi.de" || location.hostname === "www.michifumi.de") {
  const endpoint = "https://api.michifumi.de/v1/ping";
  const payload = JSON.stringify({
    path: window.location.pathname,
    referrer: document.referrer || "",
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "text/plain" });
      const ok = navigator.sendBeacon(endpoint, blob);
      if (!ok) throw new Error("sendBeacon returned false");
    } else {
      throw new Error("sendBeacon not available");
    }
  } catch {
    fetch(endpoint, {
      method: "POST",
      body: payload,
      keepalive: true,
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
    }).catch((err) => console.warn("[analytics] fetch failed", err));
  }
}
