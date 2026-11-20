#!/usr/bin/env bash
# SCULPT-R01 · reproduce SOURCE EXACT locally and verify it byte by byte.
#
# The exact snapshot is NOT stored in this public repository: it contains
# tests/fixtures/user-floorplan.png, a screenshot of a real dwelling taken from a
# third-party app, whose rights we cannot verify (see PROVENANCE.md §4).
#
# Usage:
#   fetch-source-exact.sh [DEST]        build the snapshot in DEST (default: $XDG_CACHE_HOME/rubik-sculpt/r01-exact)
#   fetch-source-exact.sh --verify DIR  only check an existing snapshot; never writes
#
# Safety (audit 10/11/2026): this script NEVER deletes or overwrites anything that already exists.
#  - DEST must not exist yet, or be an empty directory; anything else is refused (exit 3).
#  - DEST must not be inside this repository, nor a symbolic link (exit 2).
#  - The snapshot is built and verified in a private temporary directory and only then moved into place,
#    so a failed download or a hash mismatch leaves DEST untouched.
# It does not run npm, install scripts, git hooks or any donor code. Git LFS smudge is off.
set -euo pipefail
REPO="https://github.com/zhuzhuyumeng/floorplan-3d.git"
COMMIT="1d235fc0a3c45783e1e1fa129944f8f34d97d297"
TREE="3c57e46b840e64706e6125da11b3bfed49add3e9"
HERE="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="$HERE/SOURCE-EXACT.sha256"
TOP="$(git -C "$HERE" rev-parse --show-toplevel 2>/dev/null || echo "$HERE")"
TOP="$(realpath "$TOP")"

verify() { # $1 = directory; exact file set and every hash
  local dir="$1"
  [ -d "$dir" ] || { echo "Not a directory: $dir" >&2; return 4; }
  (cd "$dir" && sha256sum --quiet --strict -c "$MANIFEST") || { echo "Hash mismatch in $dir" >&2; return 5; }
  local want have
  want="$(awk '{print $2}' "$MANIFEST" | sort)"
  have="$(cd "$dir" && find . -type f -printf '%P\n' | sort)"
  [ "$want" = "$have" ] || { echo "File set differs from SOURCE-EXACT.sha256 in $dir" >&2; return 5; }
}

if [ "${1:-}" = "--verify" ]; then
  [ $# -eq 2 ] || { echo "Usage: $0 --verify DIR" >&2; exit 64; }
  verify "$2"; echo "SOURCE EXACT verified at $2 ($COMMIT)"; exit 0
fi
[ $# -le 1 ] || { echo "Usage: $0 [DEST] | --verify DIR" >&2; exit 64; }

DEST="${1:-${XDG_CACHE_HOME:-$HOME/.cache}/rubik-sculpt/r01-exact}"
[ -n "$DEST" ] || { echo "Empty destination" >&2; exit 64; }
[ -L "$DEST" ] && { echo "Refusing a symbolic link as destination: $DEST" >&2; exit 2; }
ABS="$(realpath -m -- "$DEST")"
case "$ABS/" in "$TOP/"*) echo "Refusing to write inside the repository: $ABS" >&2; exit 2;; esac
if [ -e "$ABS" ]; then
  if [ -d "$ABS" ] && [ -z "$(ls -A -- "$ABS")" ]; then :; else
    echo "Refusing: $ABS already exists and is not an empty directory. Nothing was changed." >&2
    echo "Choose a new path, or check it with: $0 --verify $ABS" >&2
    exit 3
  fi
fi

PARENT="$(dirname -- "$ABS")"; mkdir -p -- "$PARENT"
WORK="$(mktemp -d)"; trap 'rm -rf -- "$WORK"' EXIT
GIT_LFS_SKIP_SMUDGE=1 git -c core.hooksPath=/dev/null clone -q --no-checkout "$REPO" "$WORK/src"
git -C "$WORK/src" fetch -q origin "$COMMIT"
[ "$(git -C "$WORK/src" rev-parse "$COMMIT^{tree}")" = "$TREE" ] || { echo "Unexpected tree for $COMMIT" >&2; exit 5; }
mkdir "$WORK/snapshot"
git -C "$WORK/src" archive "$COMMIT" | tar -x -C "$WORK/snapshot"
verify "$WORK/snapshot"
# Move into place only now. An empty pre-existing directory is replaced with rmdir (fails if anything appeared).
[ -d "$ABS" ] && rmdir -- "$ABS"
mv -T -- "$WORK/snapshot" "$ABS"
verify "$ABS"
echo "SOURCE EXACT verified at $ABS ($COMMIT)"
