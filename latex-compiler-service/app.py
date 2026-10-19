import hmac
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN = os.environ.get("LATEX_COMPILER_TOKEN", "")
TEX_UID = 10002
TEX_GID = 10002
MAX_BODY = 1_100_000
MAX_FILES = 25
SAFE_NAME = re.compile(r"^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$")

class Handler(BaseHTTPRequestHandler):
    server_version = "FolioLabsLatexCompiler/1.0"

    def send_json(self, status, message):
        body = json.dumps({"error": message}).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            body = b'{"status":"ok"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_json(404, "Not found")

    def do_POST(self):
        if self.path != "/compile":
            return self.send_json(404, "Not found")
        if not TOKEN:
            return self.send_json(503, "Compiler service is missing LATEX_COMPILER_TOKEN.")
        supplied = self.headers.get("Authorization", "")
        if not hmac.compare_digest(supplied, f"Bearer {TOKEN}"):
            return self.send_json(401, "Unauthorized")
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self.send_json(400, "Invalid Content-Length")
        if length <= 0 or length > MAX_BODY:
            return self.send_json(413, "Request body must be smaller than 1.1 MB.")
        try:
            payload = json.loads(self.rfile.read(length))
        except Exception:
            return self.send_json(400, "Invalid JSON")
        files = payload.get("files") if isinstance(payload, dict) else None
        if not isinstance(files, list) or not 1 <= len(files) <= MAX_FILES:
            return self.send_json(400, f"Provide between 1 and {MAX_FILES} files.")
        normalized = {}
        size = 0
        for item in files:
            if not isinstance(item, dict) or not isinstance(item.get("name"), str) or not isinstance(item.get("content"), str):
                return self.send_json(400, "Invalid project file.")
            name, content = item["name"], item["content"]
            if not SAFE_NAME.fullmatch(name) or ".." in name:
                return self.send_json(400, "Only simple file names without folder paths are allowed.")
            if name in normalized:
                return self.send_json(400, "Duplicate file names are not allowed.")
            size += len(content.encode("utf-8"))
            if size > 1_000_000:
                return self.send_json(413, "Total source size must be under 1 MB.")
            normalized[name] = content
        if "main.tex" not in normalized:
            return self.send_json(400, "Your project needs a main.tex file.")

        with tempfile.TemporaryDirectory(prefix="foliolabs-tex-") as tmp:
            root = Path(tmp)
            for name, content in normalized.items():
                (root / name).write_text(content, encoding="utf-8")
            # TeX runs as a different unprivileged UID so it cannot read this service's
            # bearer-token environment or other same-UID process memory.
            for child_path in root.iterdir():
                os.chown(child_path, TEX_UID, TEX_GID)
            os.chown(root, TEX_UID, TEX_GID)
            os.chmod(root, 0o700)

            try:
                command = [
                    "latexmk", "-norc", "-pdf", "-interaction=nonstopmode", "-halt-on-error",
                    "-file-line-error", "-pdflatex=pdflatex -no-shell-escape %O %S", "main.tex"
                ]
                tex_env = {
                    "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                    "HOME": str(root),
                    "TMPDIR": str(root),
                    "TEXMFVAR": str(root / ".texmf-var"),
                    "TEXMFCONFIG": str(root / ".texmf-config"),
                    "BIBINPUTS": str(root) + ":",
                    "openout_any": "p",
                }
                result = subprocess.run(command, cwd=root, capture_output=True, text=True, timeout=45, env=tex_env, user=TEX_UID, group=TEX_GID, extra_groups=())
            except subprocess.TimeoutExpired:
                return self.send_json(408, "Compilation exceeded the 45-second time limit.")
            log = (result.stdout or "") + "\n" + (result.stderr or "")
            pdf_path = root / "main.pdf"
            if result.returncode != 0 or not pdf_path.is_file():
                # Do not leak server paths or environment details to the browser.
                cleaned = "\n".join(line for line in log.splitlines() if "!" in line or "Error" in line or "Warning" in line or line.startswith("l."))
                return self.send_json(422, (cleaned or "LaTeX compilation failed. Check the source and try again.")[-5000:])
            pdf = pdf_path.read_bytes()
            safe_log = " | ".join(line.strip() for line in log.splitlines() if "Output written" in line or "Latexmk:" in line or "All targets" in line)
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Length", str(len(pdf)))
            self.send_header("Content-Disposition", "inline; filename=research-paper.pdf")
            self.send_header("x-compile-log", (safe_log or "Compiled successfully.")[:1200])
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(pdf)

    def log_message(self, fmt, *args):
        print("[compiler] " + fmt % args, flush=True)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
