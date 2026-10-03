#!/bin/bash
# Test script for Telegram bot integration

BOT_TOKEN="8948995671:AAGGBDBS1ezl-OT5QyACMB3WvL_FstWiQpI"
API_URL="https://api.telegram.org/bot$BOT_TOKEN"

echo "Testing CMIFF Bot integration..."
echo ""

# Test 1: Get bot info
echo "1. Testing bot info..."
curl -s "$API_URL/getMe" | jq '.'
echo ""

# Test 2: Get updates (last 100)
echo "2. Testing recent updates..."
curl -s "$API_URL/getUpdates?limit=10&offset=-1" | jq '.result | .[0:3]'
echo ""

# Test 3: Send test message to bot owner (you need to replace with your chat ID)
echo "3. To test sending, run:"
echo "   curl -s -X POST http://localhost:3000/api/telegram/send -H 'Content-Type: application/json' -d '{\"chatId\":\"YOUR_CHAT_ID\",\"text\":\"Test from CMIFF Tracker\"}'"
echo ""
echo "   Get your chat ID by sending /start to @cmiffBot, then check /getUpdates"
