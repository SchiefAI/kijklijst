#!/bin/bash
PORT=8420
DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill any existing server on this port
lsof -ti:$PORT 2>/dev/null | xargs kill 2>/dev/null

echo "🎬 Mijn Kijklijst starten op http://localhost:$PORT"
echo "   Stop met Ctrl+C"
echo ""

# Open browser after short delay
(sleep 1 && open "http://localhost:$PORT") &

# Start server
cd "$DIR"
python3 server.py $PORT
