import subprocess
from threading import Timer
import os


def run_maskgen(command):
    def _run_with_input(input_text=None):
        proc = subprocess.Popen(
            command.split(" "),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        timer = Timer(5, proc.kill)  # kill if hung
        try:
            timer.start()
            stdout, stderr = proc.communicate(input=input_text)
            if proc.returncode == 0:
                return True, stdout.strip()
            else:
                return False, (stdout + "\n" + stderr).strip()
        except Exception as e:
            return False, str(e)
        finally:
            timer.cancel()

    # First try, no input
    success, output = _run_with_input()
    print(output)
    print(success)

    return success, output


def remove_file(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)


def run_command(command):
    """
    Runs a shell command and returns whether it succeeded and its output.

    Returns:
        (bool, str): (success, output or error message)
    """
    try:
        result = subprocess.run(
            command.split(" "), check=True, capture_output=True, text=True
        )
        return True, result.stdout.strip()
    except subprocess.CalledProcessError as e:
        # Return both stdout and stderr if there's an error
        if e.stdout or e.stderr:
            stdout = e.stdout or ""
            stderr = e.stderr or ""
            error_output = f"{stdout.strip()}\n{stderr.strip()}"
        else:
            error_output = str(e)
        return False, error_output.strip()
