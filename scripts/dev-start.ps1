# Dev helper: Start mongod (local) and open backend dev server window
# Usage:
# 1. Open Windows PowerShell as Administrator
# 2. From the repository root run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
# 3. Run this script: `.
#    scripts\dev-start.ps1` (adjust path if moved)
#
# This script will:
#  - create C:\data\db if missing
#  - attempt to locate `mongod` on PATH or in common install locations
#  - start `mongod` in a new process
#  - open a new PowerShell window and run `npm run dev` in the `backend` folder

param()

function Write-ErrAndExit($msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

$dbPath = 'C:\data\db'
if (-not (Test-Path $dbPath)) {
    Write-Host "Creating MongoDB data directory at $dbPath"
    New-Item -ItemType Directory -Force -Path $dbPath | Out-Null
}

Write-Host "Looking for mongod executable..."
$mongodCmd = Get-Command mongod -ErrorAction SilentlyContinue
if ($mongodCmd) {
    $mongodPath = $mongodCmd.Source
    Write-Host "Found mongod on PATH: $mongodPath"
} else {
    $mongodPath = $null

    # Check common MongoDB install locations for any supported version
    $knownPaths = @( 
        'C:\Program Files\MongoDB\Server',
        'C:\Program Files (x86)\MongoDB\Server'
    )
    foreach ($base in $knownPaths) {
        if (Test-Path $base) {
            $versions = Get-ChildItem -Path $base -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
            foreach ($version in $versions) {
                $candidate = Join-Path $version.FullName 'bin\mongod.exe'
                if (Test-Path $candidate) {
                    $mongodPath = $candidate
                    break
                }
            }
            if ($mongodPath) { break }
        }
    }

    if (-not $mongodPath) {
        $candidates = @( 
            'C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe',
            'C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe',
            'C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe',
            'C:\Program Files (x86)\MongoDB\Server\7.0\bin\mongod.exe',
            'C:\Program Files (x86)\MongoDB\Server\6.0\bin\mongod.exe',
            'C:\Program Files (x86)\MongoDB\Server\5.0\bin\mongod.exe'
        )
        foreach ($p in $candidates) {
            if (Test-Path $p) { $mongodPath = $p; break }
        }
    }

    if (-not $mongodPath) {
        Write-ErrAndExit "Could not find 'mongod'. Please install MongoDB, add it to PATH, or set MONGO_URI in backend/.env to use MongoDB Atlas."
    }
    Write-Host "Found mongod at: $mongodPath"
}

Write-Host "Starting mongod with dbpath=$dbPath"
Start-Process -FilePath $mongodPath -ArgumentList "--dbpath `"$dbPath`"" -WindowStyle Normal

# Give mongod a moment to come up
Start-Sleep -Seconds 2

# Open a new PowerShell window and start the backend dev server
$scriptDir = if ($PSCommandPath) { Split-Path -Parent $PSCommandPath } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$repoRoot = Split-Path -Parent $scriptDir
$backendPath = Join-Path $repoRoot 'backend'
if (-not (Test-Path $backendPath)) { Write-ErrAndExit "Backend folder not found at expected path: $backendPath" }

Write-Host "Opening new PowerShell to start backend dev server (npm run dev)"
$psArgs = "-NoExit","-Command","Set-Location -Path `"$backendPath`"; npm run dev"
Start-Process -FilePath 'powershell' -ArgumentList $psArgs -WindowStyle Normal

Write-Host 'Done. A mongod process and backend dev window should be running. Start frontend separately in a new terminal: cd frontend; npm run dev'
