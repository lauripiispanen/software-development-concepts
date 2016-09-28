#!/bin/sh
command -v dot >/dev/null 2>&1 || { echo >&2 "Sorry, You need 'dot' command to generate images"; exit 1; }
echo "Generating 'concepts.svg'..."
dot -Tsvg concepts.dot -o concepts.svg
echo "done."
