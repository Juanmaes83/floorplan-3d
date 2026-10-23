#!/bin/bash
# Test-environment shim: the proxy here refuses cdn.jsdelivr.net (HTTP 403). For https://cdn.jsdelivr.net/npm/three@0.160.0/…
# only, print the same file from the official three@0.160.0 npm package unpacked in THREE_LOCAL_DIR; everything else
# goes to the real curl unchanged. Used and recorded with the results; never committed as part of the app.
url="${@: -1}"; prefix="https://cdn.jsdelivr.net/npm/three@0.160.0/"
if [[ "$url" == "$prefix"* && -n "$THREE_LOCAL_DIR" ]]; then f="$THREE_LOCAL_DIR/${url#$prefix}"; f="${f%%\?*}"; [ -f "$f" ] && exec cat "$f"; echo "shim: missing $f" >&2; exit 22; fi
exec /usr/bin/curl "$@"
