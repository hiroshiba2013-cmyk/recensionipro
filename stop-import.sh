#!/bin/bash

PID_FILE="import-process.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "❌ Nessun processo in esecuzione (file PID non trovato)"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ps -p $PID > /dev/null; then
    echo "🛑 Fermando il processo (PID: $PID)..."
    kill $PID
    sleep 2

    # Forza la chiusura se ancora attivo
    if ps -p $PID > /dev/null; then
        echo "⚠️ Processo ancora attivo, forzando la chiusura..."
        kill -9 $PID
    fi

    rm "$PID_FILE"
    echo "✅ Processo fermato!"
else
    echo "⚠️ Processo non trovato (probabilmente già terminato)"
    rm "$PID_FILE"
fi
