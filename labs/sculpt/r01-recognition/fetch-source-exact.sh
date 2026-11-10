#!/usr/bin/env bash
# SCULPT-R01 · reproduce SOURCE EXACT locally and verify it byte by byte.
#
# The exact snapshot is NOT stored in this public repository: it contains
# tests/fixtures/user-floorplan.png, a screenshot of a real dwelling taken from a
# third-party app, whose rights we cannot verify (see PROVENANCE.md §4).
# This script rebuilds the snapshot OUTSIDE the repository, from the audited
# commit, and checks every file against SOURCE-EXACT.sha256.
#
# It does not run npm, install scripts or any donor code. Git LFS smudge is off.
set -euo pipefail
REPO="https://github.com/zhuzhuyumeng/floorplan-3d.git"
COMMIT="1d235fc0a3c45783e1e1fa129944f8f34d97d297"
HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:-${XDG_CACHE_HOME:-$HOME/.cache}/rubik-sculpt/r01-exact}"
case "$DEST" in "$(git -C "$HERE" rev-parse --show-toplevel)"*) echo "Refusing to write inside the repository: $DEST" >&2; exit 2;; esac
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
GIT_LFS_SKIP_SMUDGE=1 git -c core.hooksPath=/dev/null clone -q --no-checkout "$REPO" "$WORK/src"
git -C "$WORK/src" fetch -q origin "$COMMIT"
test "$(git -C "$WORK/src" rev-parse "$COMMIT^{tree}")" = "3c57e46b840e64706e6125da11b3bfed49add3e9"
rm -rf "$DEST"; mkdir -p "$DEST"
git -C "$WORK/src" archive "$COMMIT" | tar -x -C "$DEST"
(cd "$DEST" && sha256sum --quiet -c "$HERE/SOURCE-EXACT.sha256")
test "$(cd "$DEST" && find . -type f | wc -l)" = "$(wc -l < "$HERE/SOURCE-EXACT.sha256")"
echo "SOURCE EXACT verified at $DEST ($COMMIT)"
