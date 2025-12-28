#!/bin/bash

PID_FILE="import-process.pid"
LOG_FILE="import-by-city-log.txt"

clear

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        MONITORAGGIO IMPORTAZIONE OSM IN TEMPO REALE        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Controlla se il processo è attivo
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null; then
        echo "✅ Processo ATTIVO (PID: $PID)"
    else
        echo "❌ Processo NON ATTIVO (PID trovato ma processo terminato)"
    fi
else
    echo "⚠️ Nessun processo in esecuzione"
fi

echo ""
echo "────────────────────────────────────────────────────────────"
echo ""

# Mostra gli ultimi 30 log in tempo reale
if [ -f "$LOG_FILE" ]; then
    tail -f -n 30 "$LOG_FILE"
else
    echo "❌ File di log non trovato: $LOG_FILE"
fi
