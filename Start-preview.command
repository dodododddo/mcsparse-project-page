#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  print 'Node.js is required to run the local preview.'
  read -r '?Press Enter to close.'
  exit 1
fi
print 'Open http://localhost:4173 in your browser. Press Control-C here to stop.'
node server.mjs
