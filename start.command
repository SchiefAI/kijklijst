#!/bin/bash
# Mijn Kijklijst — Open als Chrome App
cd "$(dirname "$0")"

PORT=8420

# Check of de poort al bezet is
if lsof -i :$PORT &>/dev/null; then
    echo "Server draait al op poort $PORT"
else
    echo "Server starten op poort $PORT..."
    python3 server.py $PORT --lan &
    sleep 1
fi

# Open in Chrome
open "http://localhost:$PORT"

LOCAL_IP=$(python3 -c "import socket; s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.connect(('8.8.8.8',80)); print(s.getsockname()[0]); s.close()" 2>/dev/null)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎬 Mijn Kijklijst draait op localhost:$PORT"
echo ""
echo "  📱 Op je telefoon of tablet:"
echo "     Open http://${LOCAL_IP:-<je-ip>}:$PORT"
echo "     (zelfde wifi-netwerk)"
echo ""
echo "  💡 Klik ⊕ in de adresbalk om als app te installeren"
echo "  ⏹  Druk Ctrl+C om te stoppen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

wait
