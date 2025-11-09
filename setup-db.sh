#!/bin/bash

echo "===================================="
echo "Tudum - Database Setup"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit .env and update your DATABASE_URL"
    echo "Press Enter after you've updated the .env file..."
    read
fi

echo ""
echo "Generating Prisma Client..."
npx prisma generate

echo ""
echo "Pushing schema to database..."
npx prisma db push

echo ""
echo "===================================="
echo "Database setup complete!"
echo "===================================="
echo ""
echo "You can now run: npm run dev"
echo ""
