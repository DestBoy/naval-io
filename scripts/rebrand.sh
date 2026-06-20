#!/bin/bash
# Phase 1 rebrand script: OpenFront → naval.io
# Targets: index.html, package.json, server env defaults, visible UI strings

set -e

# 1. package.json: project name
sed -i 's/"name": "openfront-client"/"name": "naval-io"/' package.json

# 2. index.html: title, OG tags, canonical URL, ad page_url
sed -i 's|<title data-i18n="main.title">OpenFront (ALPHA)</title>|<title data-i18n="main.title">naval.io</title>|' index.html
sed -i 's|<link rel="canonical" href="https://openfront.io/" />|<link rel="canonical" href="https://naval.io/" />|' index.html
sed -i 's|content="Conquer the world in this multiplayer battle royale! Expand your nation, eliminate opponents, and dominate the map in this fast-paced IO game."|content="Conquer the seas in this multiplayer naval battle royale! Build your fleet, capture islands, and dominate the ocean in this fast-paced IO game."|g' index.html
sed -i 's|<meta property="og:url" content="https://openfront.io/" />|<meta property="og:url" content="https://naval.io/" />|' index.html
sed -i 's|<meta property="og:title" content="OpenFront - Battle Royale" />|<meta property="og:title" content="naval.io - Naval Battle Royale" />|' index.html
sed -i 's|googletag.pubads().set("page_url", "http://openfront.io ");|googletag.pubads().set("page_url", "https://naval.io");|' index.html

# 3. Remove OpenFront's analytics IDs (user will set their own later)
# Cloudflare beacon
sed -i 's|data-cf-beacon=.*data-cf-beacon.*||' index.html

echo "Rebrand pass 1 complete"
