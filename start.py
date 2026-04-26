import os
import subprocess

port = os.environ.get("PORT", "8000")

subprocess.run([
    "gunicorn",
    "main:app",
    "-k", "uvicorn.workers.UvicornWorker",
    "--bind", f"0.0.0.0:{port}",
    "--workers", "2",
    "--timeout", "120"
])