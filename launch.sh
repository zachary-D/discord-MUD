#!/bin/bash

node -r ts-node/register Discord-Bot-Core/bot.ts 2>&1 | tee -a bot.log