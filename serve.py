#!/usr/bin/env python3
"""
Simple HTTP server for WebKitty / NeoPussy that serves AppCache manifests
with the MIME type required by the PS4 browser: text/cache-manifest.

Python's built-in http.server serves .manifest as application/octet-stream,
which makes the AppCache 'error' event fire and cache.html shows "Cache error".

Usage:
    python serve.py            # http://<your-pc-ip>:8099/
    python serve.py 8080       # custom port
"""

import functools
import http.server
import os
import socket
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))


class WebKittyHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        lowered = path.lower()
        if lowered.endswith((".manifest", ".appcache")):
            return "text/cache-manifest"
        if lowered.endswith(".mjs"):
            return "text/javascript"
        if lowered.endswith(".js"):
            return "text/javascript"
        return super().guess_type(path)

    def end_headers(self):
        # AppCache manifests must be revalidated, never frozen in a browser cache.
        if self.path.lower().split("?")[0].endswith((".manifest", ".appcache")):
            self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()


def local_ips():
    ips = set()
    try:
        for info in socket.gethostbyname_ex(socket.gethostname())[2]:
            if not info.startswith("127."):
                ips.add(info)
    except OSError:
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    return sorted(ips)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
    handler = functools.partial(WebKittyHandler, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", port), handler)
    print("Serving: {}".format(ROOT))
    print("Local:   http://localhost:{}/".format(port))
    for ip in local_ips():
        print("LAN/PS4: http://{}:{}/".format(ip, port))
    print("Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        httpd.server_close()


if __name__ == "__main__":
    main()
