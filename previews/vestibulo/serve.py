"""Serve this inspection page at /, with assets rooted at the checkout."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial

class Studio(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', '/previews/vestibulo/')
            self.end_headers()
        else:
            super().do_GET()

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[2]
    ThreadingHTTPServer(('0.0.0.0', 8013), partial(Studio, directory=str(root))).serve_forever()
