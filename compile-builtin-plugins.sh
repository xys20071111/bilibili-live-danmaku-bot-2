#!/bin/bash

root=`pwd`
cd $root/plugins/builtin-gift-response
deno compile --output main --allow-read --allow-net src/main.ts
cd $root