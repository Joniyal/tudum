@echo off
echo ====================================
echo Tudum - Database Setup
echo ====================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env and update your DATABASE_URL
    echo Press any key after you've updated the .env file...
    pause >nul
)

echo.
echo Generating Prisma Client...
call npx prisma generate

echo.
echo Pushing schema to database...
call npx prisma db push

echo.
echo ====================================
echo Database setup complete!
echo ====================================
echo.
echo You can now run: npm run dev
echo.
pause
