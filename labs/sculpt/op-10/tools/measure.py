"""OP-10 · Mide un proceso hijo: tiempo de pared y memoria residente máxima (RSS pico de los hijos).

python3 measure.py REPORT.json -- COMANDO ARG...   (no sobrescribe REPORT; devuelve el código del hijo)
"""
import json, resource, subprocess, sys, time
from pathlib import Path

def main():
    report, cmd = Path(sys.argv[1]), sys.argv[sys.argv.index("--") + 1:]
    if report.exists():
        raise SystemExit("Refusing to overwrite " + str(report))
    t0 = time.monotonic()
    proc = subprocess.run(cmd)
    wall = time.monotonic() - t0
    peak_kib = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss  # Linux: KiB
    report.write_text(json.dumps({"command": [Path(cmd[0]).name] + cmd[1:2], "exitCode": proc.returncode,
                                  "wallSeconds": round(wall, 3), "peakRssBytes": peak_kib * 1024}, indent=1) + "\n")
    sys.exit(proc.returncode)

if __name__ == "__main__":
    main()
