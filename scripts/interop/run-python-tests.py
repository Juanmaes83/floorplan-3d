"""Test-only Windows adapter for historical subprocess.run(['python3', ...]).
Does not install a command, change PATH, alter product or alter test expectations.
"""
import runpy, subprocess, sys
original = subprocess.run


def run(command, *args, **kwargs):
    if isinstance(command, list) and command and command[0] == "python3":
        command = [sys.executable] + command[1:]
    return original(command, *args, **kwargs)


subprocess.run = run
target = sys.argv[1]
sys.argv = [target]
runpy.run_path(target, run_name="__main__")
