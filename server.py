#!/usr/bin/env python3
"""
Mijn Kijklijst — Lokale server
Serveert static files + biedt een POST endpoint om data.js bij te werken.
"""

import argparse
import http.server
import json
import os
import socket
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'js', 'data.js')
STATE_FILE = os.path.join(BASE_DIR, 'state.json')


def format_data_js(data, imdb):
    """Genereer geldig JavaScript voor data.js"""
    lines = ['const DATA = [']

    # Groepeer films en series
    films = [d for d in data if d.get('type') == 'film']
    series = [d for d in data if d.get('type') == 'serie']

    for label, items in [('FILMS', films), ('SERIES', series)]:
        if items:
            lines.append(f'  // ── {label} ──')
            for item in items:
                parts = []
                parts.append(f't:{json.dumps(item["t"], ensure_ascii=False)}')
                if item.get('y'):
                    parts.append(f'y:{json.dumps(item["y"], ensure_ascii=False)}')
                parts.append(f'type:{json.dumps(item["type"], ensure_ascii=False)}')
                if item.get('lang'):
                    parts.append(f'lang:{json.dumps(item["lang"], ensure_ascii=False)}')
                if item.get('d'):
                    parts.append(f'd:{json.dumps(item["d"], ensure_ascii=False)}')
                if item.get('img'):
                    parts.append(f'img:{json.dumps(item["img"], ensure_ascii=False)}')
                if item.get('g'):
                    parts.append(f'g:{json.dumps(item["g"], ensure_ascii=False)}')
                lines.append(f'  {{{",".join(parts)}}},')
            lines.append('')

    lines.append('];')
    lines.append('')

    # IMDB mapping
    lines.append('const IMDB = {')
    for title, imdb_id in sorted(imdb.items()):
        lines.append(f'  {json.dumps(title, ensure_ascii=False)}:{json.dumps(imdb_id)},')
    lines.append('};')
    lines.append('')

    return '\n'.join(lines)


class KijklijstHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path == '/state.json':
            self.send_response(404)
            self.end_headers()
            return

        if self.path == '/api/state':
            data = {}
            if os.path.exists(STATE_FILE):
                with open(STATE_FILE, 'r', encoding='utf-8') as f:
                    raw = json.load(f)
                    # Only expose expected state fields.
                    if isinstance(raw, dict):
                        if isinstance(raw.get('watched'), dict):
                            data['watched'] = raw['watched']
                        if isinstance(raw.get('ratings'), dict):
                            data['ratings'] = raw['ratings']
                        if isinstance(raw.get('order'), list):
                            data['order'] = raw['order']
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/save':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length))

                data = body.get('data', [])
                imdb = body.get('imdb', {})

                # Schrijf naar data.js
                content = format_data_js(data, imdb)
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    f.write(content)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True, 'count': len(data)}).encode())

            except Exception as e:
                print(f'[ERROR] /api/save: {e}')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': 'Server error'}).encode())
        elif self.path == '/api/state':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length))

                if not isinstance(body, dict):
                    body = {}

                # Only persist non-secret shared state.
                state = {}
                if isinstance(body.get('watched'), dict):
                    state['watched'] = body['watched']
                if isinstance(body.get('ratings'), dict):
                    state['ratings'] = body['ratings']
                if isinstance(body.get('order'), list):
                    state['order'] = body['order']

                with open(STATE_FILE, 'w', encoding='utf-8') as f:
                    json.dump(state, f, ensure_ascii=False)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True}).encode())

            except Exception as e:
                print(f'[ERROR] /api/state: {e}')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': 'Server error'}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Stille logging voor static files, verbose voor API
        if '/api/' in (args[0] if args else ''):
            super().log_message(format, *args)


def get_local_ip():
    """Probeer het lokale LAN-adres te achterhalen."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Mijn Kijklijst server')
    parser.add_argument('port', nargs='?', type=int, default=8420,
                        help='Poortnummer (standaard: 8420)')
    parser.add_argument('--lan', action='store_true',
                        help='Luister op alle interfaces (0.0.0.0) zodat andere apparaten op je netwerk de app kunnen gebruiken')
    args = parser.parse_args()

    # Env var als alternatief voor --lan
    lan_mode = args.lan or os.environ.get('KIJKLIJST_LAN', '').lower() in ('1', 'true', 'yes')
    host = '0.0.0.0' if lan_mode else '127.0.0.1'

    server = http.server.HTTPServer((host, args.port), KijklijstHandler)
    print(f'🎬 Kijklijst server draait op http://127.0.0.1:{args.port}')
    if lan_mode:
        local_ip = get_local_ip()
        if local_ip:
            print(f'📱 LAN-modus: ook bereikbaar op http://{local_ip}:{args.port}')
        else:
            print(f'📱 LAN-modus: bereikbaar op 0.0.0.0:{args.port}')
    print(f'   Data sync: js/data.js')
    print(f'   State sync: state.json')
    print(f'   Stop met Ctrl+C')
    print()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n👋 Server gestopt')
        server.server_close()
