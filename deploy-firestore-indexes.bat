@echo off
echo ================================================================
echo FIRESTORE COMPOSITE INDEX DEPLOYMENT
echo ================================================================
echo.
echo Project: restaurant-management-d5c73
echo Indexes: 74 composite indexes
echo.

REM Change to project directory
cd /d %~dp0

REM Step 1: Verify Firebase CLI is installed
echo [STEP 1/5] Checking Firebase CLI...
firebase --version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Firebase CLI not installed
  exit /b 1
)
echo OK: Firebase CLI v15.22.4+
echo.

REM Step 2: Login with correct email
echo [STEP 2/5] Firebase Authentication
echo Please login with your hexerve hrms email when prompted in browser
echo.
firebase login --reauth
if errorlevel 1 (
  echo ERROR: Firebase login failed
  exit /b 1
)
echo OK: Authenticated
echo.

REM Step 3: Set active project
echo [STEP 3/5] Setting active Firebase project...
firebase use restaurant-management-d5c73 --no-browser
if errorlevel 1 (
  echo WARNING: Could not set project, will use .firebaserc
)
echo OK: Project configured
echo.

REM Step 4: Validate indexes.json
echo [STEP 4/5] Validating firestore.indexes.json...
if not exist "firestore.indexes.json" (
  echo ERROR: firestore.indexes.json not found
  exit /b 1
)
echo OK: firestore.indexes.json found
echo.

REM Step 5: Deploy indexes
echo [STEP 5/5] Deploying composite indexes...
echo This may take 1-5 minutes...
echo.
firebase deploy --only firestore:indexes

if errorlevel 1 (
  echo ERROR: Deployment failed
  exit /b 1
)

echo.
echo ================================================================
echo ✓ DEPLOYMENT COMPLETE
echo ================================================================
echo.
echo Next steps:
echo 1. Monitor index build: https://console.firebase.google.com/project/restaurant-management-d5c73/firestore/indexes
echo 2. Wait until all 74 indexes show status: READY
echo 3. Run: npm run dev
echo 4. Test: curl http://localhost:3000/api/notifications
echo.
pause
