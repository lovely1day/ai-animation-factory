#Requires -Version 5.1
<#
.SYNOPSIS
    AI Animation Factory - Complete Deployment Script
.DESCRIPTION
    Deploys frontend to Vercel, backend to Railway, and pushes code to GitHub.
.NOTES
    Run from project root:  .\deploy-all.ps1
    Bypass policy if needed: powershell -ExecutionPolicy Bypass -File .\deploy-all.ps1
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# ============================================================
#  CONSTANTS
# ============================================================
$ROOT       = $PSScriptRoot
$API_DIR    = Join-Path $ROOT "apps\api"
$WEB_DIR    = Join-Path $ROOT "apps\web"
$DB_SCHEMA  = Join-Path $ROOT "packages\database\schema.sql"
$ENV_FILE   = Join-Path $ROOT ".env"
$LOG_FILE   = Join-Path $ROOT "deploy-log.txt"
$DEPLOY_MD  = Join-Path $ROOT "DEPLOYMENT.md"

# Deployment result tracking
$script:URLs = @{
    GitHub   = ""
    Vercel   = ""
    Railway  = ""
    Supabase = ""
}

# ============================================================
#  LOGGING
# ============================================================
function Log {
    param([string]$msg)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$ts] $msg" | Out-File -FilePath $LOG_FILE -Append -Encoding UTF8
}

# ============================================================
#  UI HELPERS
# ============================================================
function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  +===============================================================+" -ForegroundColor Cyan
    Write-Host "  |   AI Animation Factory  -  Full Deployment Suite             |" -ForegroundColor Cyan
    Write-Host "  |   GitHub + Vercel + Railway + Supabase                       |" -ForegroundColor Cyan
    Write-Host "  +===============================================================+" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Log: $LOG_FILE" -ForegroundColor DarkGray
    Write-Host "  Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
    Write-Host ""
}

function Write-Section {
    param([string]$Title, [string]$Icon = ">>")
    Write-Host ""
    Write-Host "  ===============================================================" -ForegroundColor DarkCyan
    Write-Host "  $Icon  $Title" -ForegroundColor Cyan
    Write-Host "  ===============================================================" -ForegroundColor DarkCyan
    Write-Host ""
    Log "=== $Title ==="
}

function W-OK   { param($m) Write-Host "  [OK]  $m" -ForegroundColor Green;   Log "[OK] $m" }
function W-FAIL { param($m) Write-Host "  [!!]  $m" -ForegroundColor Red;     Log "[FAIL] $m" }
function W-WARN { param($m) Write-Host "  [~~]  $m" -ForegroundColor Yellow;  Log "[WARN] $m" }
function W-INFO { param($m) Write-Host "  [..]  $m" -ForegroundColor Cyan;    Log "[INFO] $m" }
function W-STEP { param($m) Write-Host "  -->   $m" -ForegroundColor White;   Log "[STEP] $m" }
function Ln     { Write-Host "" }

function Prompt-YN {
    param([string]$Question, [bool]$DefaultYes = $true)
    $hint = if ($DefaultYes) { "[Y/n]" } else { "[y/N]" }
    Write-Host "  $Question $hint : " -ForegroundColor Yellow -NoNewline
    $r = Read-Host
    if ([string]::IsNullOrWhiteSpace($r)) { return $DefaultYes }
    return $r.Trim().ToLower() -eq "y"
}

function Prompt-Input {
    param([string]$Label, [string]$Default = "")
    if ($Default) {
        Write-Host "  $Label [$Default] : " -ForegroundColor Yellow -NoNewline
    } else {
        Write-Host "  $Label : " -ForegroundColor Yellow -NoNewline
    }
    $r = Read-Host
    if ([string]::IsNullOrWhiteSpace($r)) { return $Default }
    return $r.Trim()
}

function Show-Error {
    param([string]$msg, [string]$detail = "")
    Write-Host ""
    Write-Host "  +----------------------------------------------------------+" -ForegroundColor Red
    Write-Host "  |  ERROR                                                   |" -ForegroundColor Red
    Write-Host "  |  $($msg.PadRight(58))|" -ForegroundColor Red
    if ($detail) {
        Write-Host "  |  $($detail.PadRight(58))|" -ForegroundColor Red
    }
    Write-Host "  +----------------------------------------------------------+" -ForegroundColor Red
    Write-Host ""
    Log "[ERROR] $msg $detail"
}

# ============================================================
#  ENV LOADER
# ============================================================
$script:EnvVars = @{}

function Load-Env {
    if (-not (Test-Path $ENV_FILE)) { return }
    Get-Content $ENV_FILE | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim().Trim('"').Trim("'")
            $script:EnvVars[$key] = $val
        }
    }
}

function Get-EnvVal {
    param([string]$Key, [string]$Default = "")
    $v = $script:EnvVars[$Key]
    if ([string]::IsNullOrWhiteSpace($v) -or $v -match "your-|placeholder|<") { return $Default }
    return $v
}

# ============================================================
#  PREFLIGHT — check CLIs
# ============================================================
function Step-PreFlight {
    Write-Section "Pre-Flight Checks" "CHECK"

    $ok = $true

    # Git
    W-STEP "Checking git..."
    try {
        $v = git --version 2>&1
        W-OK "git: $v"
    } catch {
        W-FAIL "git not found. Install from https://git-scm.com"
        $ok = $false
    }

    # GitHub CLI
    W-STEP "Checking gh (GitHub CLI)..."
    try {
        $v = gh --version 2>&1 | Select-Object -First 1
        W-OK "gh: $v"
        # Check auth
        $authStatus = gh auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            W-OK "GitHub: authenticated"
        } else {
            W-WARN "GitHub: not authenticated. Run: gh auth login"
            $ok = $false
        }
    } catch {
        W-FAIL "gh not found. Install: winget install GitHub.cli"
        $ok = $false
    }

    # Vercel CLI
    W-STEP "Checking vercel..."
    try {
        $v = vercel --version 2>&1
        W-OK "vercel: $v"
        # Check auth
        $whoami = vercel whoami 2>&1
        if ($LASTEXITCODE -eq 0) {
            W-OK "Vercel: authenticated as $whoami"
        } else {
            W-WARN "Vercel: not authenticated. Run: vercel login"
            $ok = $false
        }
    } catch {
        W-FAIL "vercel not found. Install: npm i -g vercel"
        $ok = $false
    }

    # Railway CLI
    W-STEP "Checking railway..."
    try {
        $v = railway --version 2>&1
        W-OK "railway: $v"
        # Check auth
        $whoami = railway whoami 2>&1
        if ($LASTEXITCODE -eq 0) {
            W-OK "Railway: authenticated as $whoami"
        } else {
            W-WARN "Railway: not authenticated. Run: railway login"
            $ok = $false
        }
    } catch {
        W-FAIL "railway not found. Install: npm i -g @railway/cli"
        $ok = $false
    }

    Ln
    if (-not $ok) {
        Show-Error "Some CLIs are missing or not authenticated." "Fix the issues above and re-run."
        if (-not (Prompt-YN "Continue anyway? (some steps will fail)" $false)) {
            Write-Host "  Exiting. Fix the issues and re-run." -ForegroundColor Red
            exit 1
        }
    } else {
        W-OK "All CLIs ready"
    }
}

# ============================================================
#  STEP 1 — GITHUB
# ============================================================
function Step-GitHub {
    Write-Section "Step 1: GitHub Repository" "GITHUB"

    if (-not (Prompt-YN "Deploy to GitHub?")) {
        W-INFO "Skipping GitHub"
        return
    }

    Set-Location $ROOT

    # Init git if needed
    if (-not (Test-Path (Join-Path $ROOT ".git"))) {
        W-STEP "Initializing git repository..."
        git init
        git checkout -b main 2>$null
        W-OK "Git initialized"
    } else {
        W-OK "Git already initialized"
    }

    # Create/update .gitignore
    $gitignorePath = Join-Path $ROOT ".gitignore"
    if (-not (Test-Path $gitignorePath)) {
        W-STEP "Creating .gitignore..."
        @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment
.env
.env.local
.env.*.local

# Build output
.next/
dist/
build/
out/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
setup-test-log.txt
deploy-log.txt

# Runtime
.turbo/
*.tsbuildinfo

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/settings.json
.idea/

# Test
coverage/
"@ | Out-File -FilePath $gitignorePath -Encoding UTF8
        W-OK ".gitignore created"
    } else {
        W-OK ".gitignore already exists"
    }

    # Get repo name
    $repoName = Prompt-Input "GitHub repo name" "ai-animation-factory"
    $repoVisibility = if (Prompt-YN "Make repo public?") { "--public" } else { "--private" }

    # Check if remote already set
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        W-WARN "Remote 'origin' already set: $existingRemote"
        $script:URLs.GitHub = $existingRemote -replace "\.git$",""
    } else {
        W-STEP "Creating GitHub repository '$repoName'..."
        $createOutput = gh repo create $repoName $repoVisibility --source=. --remote=origin --push 2>&1
        if ($LASTEXITCODE -ne 0) {
            # Repo might already exist — try to just add remote
            W-WARN "Create failed. Trying to link existing repo..."
            $ghUser = gh api user --jq ".login" 2>&1
            $remoteUrl = "https://github.com/$ghUser/$repoName.git"
            git remote add origin $remoteUrl 2>$null
            W-OK "Remote linked: $remoteUrl"
            $script:URLs.GitHub = "https://github.com/$ghUser/$repoName"
        } else {
            $ghUser = gh api user --jq ".login" 2>&1
            $script:URLs.GitHub = "https://github.com/$ghUser/$repoName"
            W-OK "Repo created: $($script:URLs.GitHub)"
        }
    }

    # Stage and commit
    W-STEP "Staging all files..."
    git add .
    $status = git status --short
    if (-not $status) {
        W-INFO "Nothing to commit — working tree clean"
    } else {
        $commitMsg = "Initial deployment - AI Animation Factory"
        W-STEP "Committing: '$commitMsg'..."
        git commit -m $commitMsg 2>&1 | Out-Null
        W-OK "Committed"
    }

    # Push
    W-STEP "Pushing to GitHub (main)..."
    $pushOut = git push -u origin main 2>&1
    if ($LASTEXITCODE -ne 0) {
        W-WARN "Push failed. Trying force push..."
        $forceOk = Prompt-YN "Force push to main? (overwrites remote)" $false
        if ($forceOk) {
            git push -u origin main --force 2>&1 | Out-Null
        } else {
            W-WARN "Push skipped."
        }
    } else {
        W-OK "Pushed to GitHub"
    }

    W-OK "GitHub URL: $($script:URLs.GitHub)"
    Log "GitHub URL: $($script:URLs.GitHub)"
}

# ============================================================
#  STEP 2 — VERCEL (Frontend)
# ============================================================
function Step-Vercel {
    Write-Section "Step 2: Vercel (Frontend)" "VERCEL"

    if (-not (Prompt-YN "Deploy frontend to Vercel?")) {
        W-INFO "Skipping Vercel"
        return
    }

    Load-Env

    # Collect env vars
    Ln
    Write-Host "  Configure frontend environment variables:" -ForegroundColor White
    Ln

    $supabaseUrl  = Get-EnvVal "SUPABASE_URL"
    $supabaseAnon = Get-EnvVal "SUPABASE_ANON_KEY"

    if (-not $supabaseUrl) {
        $supabaseUrl = Prompt-Input "NEXT_PUBLIC_SUPABASE_URL"
    } else {
        W-INFO "SUPABASE_URL from .env: $supabaseUrl"
    }
    if (-not $supabaseAnon) {
        $supabaseAnon = Prompt-Input "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    } else {
        W-INFO "SUPABASE_ANON_KEY from .env (first 20 chars): $($supabaseAnon.Substring(0, [Math]::Min(20,$supabaseAnon.Length)))..."
    }

    $apiUrl = Prompt-Input "NEXT_PUBLIC_API_URL (Railway URL — leave blank to set later)" "http://localhost:3001"

    # Write vercel.json for the web app if missing
    $vercelJson = Join-Path $WEB_DIR "vercel.json"
    if (-not (Test-Path $vercelJson)) {
        W-STEP "Creating vercel.json..."
        @"
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "outputDirectory": ".next"
}
"@ | Out-File -FilePath $vercelJson -Encoding UTF8
        W-OK "vercel.json created"
    }

    Set-Location $WEB_DIR

    # Deploy
    W-STEP "Deploying to Vercel (this may take 2-4 minutes)..."
    Ln

    # Build env var flags
    $envFlags = @(
        "--env", "NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl",
        "--env", "NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnon",
        "--env", "NEXT_PUBLIC_API_URL=$apiUrl",
        "--yes"
    )

    $deployOut = vercel --prod @envFlags 2>&1
    $deployLines = $deployOut -split "`n"
    $deployOut | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }

    if ($LASTEXITCODE -eq 0) {
        # Extract URL from output
        $urlLine = $deployLines | Where-Object { $_ -match "https://.*\.vercel\.app" } | Select-Object -Last 1
        if ($urlLine -match "(https://[^\s]+)") {
            $script:URLs.Vercel = $Matches[1].Trim()
        }
        W-OK "Vercel deployment successful!"
        W-OK "Frontend URL: $($script:URLs.Vercel)"
        Log "Vercel URL: $($script:URLs.Vercel)"
    } else {
        Show-Error "Vercel deployment failed" "Check output above"
        W-WARN "You can retry manually: cd apps/web && vercel --prod"
    }

    Set-Location $ROOT
}

# ============================================================
#  STEP 3 — RAILWAY (Backend)
# ============================================================
function Step-Railway {
    Write-Section "Step 3: Railway (Backend API)" "RAILWAY"

    if (-not (Prompt-YN "Deploy backend API to Railway?")) {
        W-INFO "Skipping Railway"
        return
    }

    Load-Env

    Set-Location $API_DIR

    # Init Railway project
    W-STEP "Initializing Railway project..."
    $projectName = Prompt-Input "Railway project name" "ai-animation-factory-api"

    # Create railway.json in api dir
    $railwayJson = Join-Path $API_DIR "railway.json"
    if (-not (Test-Path $railwayJson)) {
        W-STEP "Creating railway.json..."
        @"
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
"@ | Out-File -FilePath $railwayJson -Encoding UTF8
        W-OK "railway.json created"
    }

    # Init and link
    $initOut = railway init --name $projectName 2>&1
    Write-Host "    $initOut" -ForegroundColor DarkGray

    # Add Redis service
    W-STEP "Adding Redis plugin to Railway project..."
    $redisOut = railway add --plugin redis 2>&1
    Write-Host "    $redisOut" -ForegroundColor DarkGray
    W-OK "Redis plugin added (REDIS_URL will be auto-set)"

    # Set environment variables from .env
    W-STEP "Setting environment variables on Railway..."
    $envVarsToSet = @{}

    Get-Content $ENV_FILE | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim().Trim('"').Trim("'")
            # Skip NEXT_PUBLIC_ vars (frontend only) and placeholders
            if (-not $key.StartsWith("NEXT_PUBLIC_") -and
                $val -notmatch "your-|placeholder|<" -and
                -not [string]::IsNullOrWhiteSpace($val)) {
                $envVarsToSet[$key] = $val
            }
        }
    }

    if ($envVarsToSet.Count -gt 0) {
        $envVarsToSet.GetEnumerator() | ForEach-Object {
            $setOut = railway variables set "$($_.Key)=$($_.Value)" 2>&1
            W-INFO "Set $($_.Key)"
        }
        W-OK "$($envVarsToSet.Count) variables set"
    } else {
        W-WARN "No non-placeholder vars found in .env to set — set manually in Railway dashboard"
    }

    # Set NODE_ENV and PORT
    railway variables set "NODE_ENV=production" 2>&1 | Out-Null
    railway variables set "PORT=3001" 2>&1 | Out-Null
    W-OK "NODE_ENV=production, PORT=3001 set"

    # Deploy
    W-STEP "Deploying to Railway (this may take 3-5 minutes)..."
    Ln
    $deployOut = railway up 2>&1
    $deployOut | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }

    if ($LASTEXITCODE -eq 0) {
        # Get the service URL
        $urlOut = railway open 2>&1
        $domainOut = railway domain 2>&1
        if ($domainOut -match "(https://[^\s]+)") {
            $script:URLs.Railway = $Matches[1].Trim()
        } elseif ($urlOut -match "(https://[^\s]+railway\.app[^\s]*)") {
            $script:URLs.Railway = $Matches[1].Trim()
        }

        if (-not $script:URLs.Railway) {
            $script:URLs.Railway = Prompt-Input "Enter the Railway API URL (from Railway dashboard)" ""
        }

        W-OK "Railway deployment successful!"
        W-OK "API URL: $($script:URLs.Railway)"
        Log "Railway URL: $($script:URLs.Railway)"
    } else {
        Show-Error "Railway deployment failed" "Check output above"
        W-WARN "You can retry manually: cd apps/api && railway up"
    }

    Set-Location $ROOT
}

# ============================================================
#  STEP 4 — SUPABASE SCHEMA
# ============================================================
function Step-Supabase {
    Write-Section "Step 4: Supabase Database Schema" "SUPABASE"

    if (-not (Prompt-YN "Apply Supabase schema?")) {
        W-INFO "Skipping Supabase schema"
        return
    }

    Load-Env
    $supabaseUrl = Get-EnvVal "SUPABASE_URL"

    Write-Host ""
    Write-Host "  +----------------------------------------------------------+" -ForegroundColor Yellow
    Write-Host "  |  MANUAL STEP REQUIRED                                    |" -ForegroundColor Yellow
    Write-Host "  |                                                          |" -ForegroundColor Yellow
    Write-Host "  |  1. Open your Supabase project dashboard                 |" -ForegroundColor Yellow
    Write-Host "  |  2. Go to: SQL Editor                                    |" -ForegroundColor Yellow
    Write-Host "  |  3. Click '+ New query'                                  |" -ForegroundColor Yellow
    Write-Host "  |  4. Paste the schema from:                               |" -ForegroundColor Yellow
    Write-Host "  |     packages/database/schema.sql                         |" -ForegroundColor Yellow
    Write-Host "  |  5. Click 'Run' (RLS policies are included)              |" -ForegroundColor Yellow
    Write-Host "  +----------------------------------------------------------+" -ForegroundColor Yellow
    Write-Host ""

    if ($supabaseUrl -and $supabaseUrl -notmatch "your-") {
        # Extract project ref from URL
        if ($supabaseUrl -match "https://([^.]+)\.supabase\.co") {
            $projectRef = $Matches[1]
            $dashboardUrl = "https://app.supabase.com/project/$projectRef/sql/new"
            $script:URLs.Supabase = "https://app.supabase.com/project/$projectRef"
            W-INFO "Direct link to SQL Editor:"
            Write-Host "    $dashboardUrl" -ForegroundColor Cyan
        }
    }

    W-STEP "Opening schema file location..."
    if (Test-Path $DB_SCHEMA) {
        # Copy schema to clipboard for easy pasting
        Get-Content $DB_SCHEMA -Raw | Set-Clipboard
        W-OK "Schema copied to clipboard! Paste it in the SQL editor."
    } else {
        W-WARN "Schema file not found at: $DB_SCHEMA"
    }

    Ln
    if (-not (Prompt-YN "Confirm: schema has been applied in Supabase?")) {
        W-WARN "Schema not confirmed. The API will fail until schema is applied."
    } else {
        W-OK "Supabase schema confirmed"
    }

    Log "Supabase URL: $($script:URLs.Supabase)"
}

# ============================================================
#  STEP 5 — FINAL CONFIGURATION
# ============================================================
function Step-FinalConfig {
    Write-Section "Step 5: Final Configuration" "CONFIG"

    # If we have Railway URL, update Vercel's NEXT_PUBLIC_API_URL
    if ($script:URLs.Railway -and $script:URLs.Vercel) {
        Ln
        W-INFO "Railway API URL: $($script:URLs.Railway)"
        W-INFO "Updating Vercel frontend to point to Railway API..."

        if (Prompt-YN "Update Vercel NEXT_PUBLIC_API_URL to Railway URL and redeploy?") {
            Set-Location $WEB_DIR

            W-STEP "Setting NEXT_PUBLIC_API_URL on Vercel..."
            vercel env add NEXT_PUBLIC_API_URL production 2>&1 | Out-Null
            # Note: vercel env add is interactive; set via --env on redeploy instead

            W-STEP "Redeploying frontend with updated API URL..."
            $redeployOut = vercel --prod --env "NEXT_PUBLIC_API_URL=$($script:URLs.Railway)" --yes 2>&1
            $redeployOut | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }

            if ($LASTEXITCODE -eq 0) {
                $urlLine = ($redeployOut -split "`n") | Where-Object { $_ -match "https://.*\.vercel\.app" } | Select-Object -Last 1
                if ($urlLine -match "(https://[^\s]+)") {
                    $script:URLs.Vercel = $Matches[1].Trim()
                }
                W-OK "Frontend redeployed: $($script:URLs.Vercel)"
            } else {
                W-WARN "Redeploy failed — update NEXT_PUBLIC_API_URL manually in Vercel dashboard"
            }

            Set-Location $ROOT
        }
    } elseif (-not $script:URLs.Railway) {
        W-WARN "No Railway URL detected — update NEXT_PUBLIC_API_URL manually in Vercel dashboard once Railway is deployed"
    }
}

# ============================================================
#  STEP 6 — WRITE DEPLOYMENT.md + SUMMARY
# ============================================================
function Step-Summary {
    Write-Section "Deployment Complete" "DONE"

    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    # Write DEPLOYMENT.md
    $md = @"
# AI Animation Factory — Deployment Summary

Generated: $ts

## URLs

| Service    | URL |
|------------|-----|
| GitHub     | $($script:URLs.GitHub) |
| Frontend   | $($script:URLs.Vercel) |
| Backend API| $($script:URLs.Railway) |
| Supabase   | $($script:URLs.Supabase) |

## Environment Variables

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=$($script:URLs.Railway)
NEXT_PUBLIC_SUPABASE_URL=<from .env>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from .env>
```

### Backend (Railway)
All variables from root `.env` (excluding `NEXT_PUBLIC_*`)

## Post-Deployment Checklist

- [ ] Supabase schema applied (packages/database/schema.sql)
- [ ] Test API health: $($script:URLs.Railway)/health
- [ ] Test frontend: $($script:URLs.Vercel)
- [ ] Test AI pipeline (create a test episode)
- [ ] Set up Supabase Auth (if using user accounts)
- [ ] Configure Cloudflare R2 bucket CORS policy

## Local Development

```powershell
# Start all services locally
pnpm dev

# API: http://localhost:3001
# Web: http://localhost:3000
```
"@

    $md | Out-File -FilePath $DEPLOY_MD -Encoding UTF8
    W-OK "DEPLOYMENT.md written"

    # Print summary card
    Ln
    Write-Host "  +===============================================================+" -ForegroundColor Green
    Write-Host "  |                  DEPLOYMENT COMPLETE                         |" -ForegroundColor Green
    Write-Host "  +===============================================================+" -ForegroundColor Green
    Ln

    $pad = { param($s, $n) $s.PadRight($n) }
    $lines = @(
        @{ label = "GitHub Repo  "; url = $script:URLs.GitHub },
        @{ label = "Frontend     "; url = $script:URLs.Vercel },
        @{ label = "Backend API  "; url = $script:URLs.Railway },
        @{ label = "Supabase     "; url = $script:URLs.Supabase }
    )

    foreach ($line in $lines) {
        $u = if ($line.url) { $line.url } else { "(not deployed)" }
        Write-Host "    $($line.label): " -ForegroundColor White -NoNewline
        Write-Host $u -ForegroundColor Cyan
    }

    Ln
    Write-Host "  Log file  : $LOG_FILE" -ForegroundColor DarkGray
    Write-Host "  Deploy doc: $DEPLOY_MD" -ForegroundColor DarkGray
    Ln

    # Post-deploy checklist
    Write-Host "  Next steps:" -ForegroundColor Yellow
    Write-Host "    1. Test API health: $($script:URLs.Railway)/health" -ForegroundColor White
    Write-Host "    2. Test frontend  : $($script:URLs.Vercel)" -ForegroundColor White
    Write-Host "    3. Apply Supabase schema if not done (schema copied to clipboard)" -ForegroundColor White
    Write-Host "    4. Fill in remaining API keys in Railway dashboard" -ForegroundColor White
    Ln

    Log "Deployment complete. GitHub=$($script:URLs.GitHub) Vercel=$($script:URLs.Vercel) Railway=$($script:URLs.Railway)"
}

# ============================================================
#  ROLLBACK HELPER
# ============================================================
function Invoke-Rollback {
    param([string]$Phase)
    W-WARN "Rolling back from failed phase: $Phase"
    Log "ROLLBACK triggered at phase: $Phase"

    switch ($Phase) {
        "vercel" {
            W-STEP "Rolling back last Vercel deployment..."
            Set-Location $WEB_DIR
            vercel rollback 2>&1 | Out-Null
            Set-Location $ROOT
            W-OK "Vercel rolled back"
        }
        "railway" {
            W-STEP "Rolling back last Railway deployment..."
            Set-Location $API_DIR
            railway rollback 2>&1 | Out-Null
            Set-Location $ROOT
            W-OK "Railway rolled back"
        }
    }
}

# ============================================================
#  MAIN
# ============================================================
"" | Out-File -FilePath $LOG_FILE -Encoding UTF8  # reset log
Log "Deploy started"

Show-Banner

try {
    Step-PreFlight
    Step-GitHub
    Step-Vercel
    Step-Railway
    Step-Supabase
    Step-FinalConfig
    Step-Summary
}
catch {
    Show-Error "Unexpected error: $($_.Exception.Message)" $_.ScriptStackTrace
    Log "FATAL: $($_.Exception.Message)"
    Write-Host "  Full error saved to: $LOG_FILE" -ForegroundColor Red
    exit 1
}
finally {
    Set-Location $ROOT
}
