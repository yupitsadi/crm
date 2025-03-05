#!/bin/bash

# Load environment variables from .env.local
export $(cat .env.local | xargs)

# Run the seed script
node src/scripts/seedUsers.js 