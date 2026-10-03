# CMIFF Activity Tracker - GitHub Push Script
# Run this script to push your code to GitHub

Write-Host "=== CMIFF Activity Tracker - GitHub Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
Write-Host "Checking git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed. Please install Git from https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Check if GitHub CLI is installed
Write-Host ""
Write-Host "Checking GitHub CLI..." -ForegroundColor Yellow
$ghInstalled = $false
try {
    $ghVersion = gh --version
    Write-Host "✓ GitHub CLI is installed: $ghVersion" -ForegroundColor Green
    $ghInstalled = $true
} catch {
    Write-Host "⚠ GitHub CLI not found. You can manually create a repo on github.com" -ForegroundColor Yellow
}

# Check current git remote
Write-Host ""
Write-Host "Checking current remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null
if ($remote) {
    Write-Host "Current remote: $remote" -ForegroundColor Cyan
    $confirm = Read-Host "Do you want to change the remote? (y/n)"
    if ($confirm -eq "y") {
        git remote remove origin
        $remote = $null
    }
}

# If no remote, ask for GitHub repo URL
if (-not $remote) {
    Write-Host ""
    Write-Host "=== GitHub Repository Setup ===" -ForegroundColor Cyan
    
    if ($ghInstalled) {
        # Use GitHub CLI to create repo
        Write-Host "Creating GitHub repository..." -ForegroundColor Yellow
        $repoName = "cmiff-activity-tracker"
        $repoDesc = "CMIFF 2026 Activity Tracker - Real-time festival operations board"
        
        try {
            $createResult = gh repo create $repoName --description $repoDesc --private --push
            if ($createResult) {
                Write-Host "✓ Repository created: https://github.com/$(gh api user --jq .login)/$repoName" -ForegroundColor Green
            }
        } catch {
            Write-Host "✗ Failed to create repo: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please create a repository manually at https://github.com/new" -ForegroundColor Yellow
            $manualUrl = Read-Host "Enter the repository URL (e.g., https://github.com/user/cmiff-activity-tracker)"
            if ($manualUrl) {
                git remote add origin $manualUrl
                Write-Host "✓ Remote added: $manualUrl" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "Please create a repository manually at https://github.com/new" -ForegroundColor Yellow
        $manualUrl = Read-Host "Enter the repository URL (e.g., https://github.com/user/cmiff-activity-tracker)"
        if ($manualUrl) {
            git remote add origin $manualUrl
            Write-Host "✓ Remote added: $manualUrl" -ForegroundColor Green
        }
    }
}

# Get current branch
$currentBranch = git branch --show-current
Write-Host ""
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# Ask for push confirmation
Write-Host ""
Write-Host "Ready to push to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "Repository: $(git remote get-url origin 2>$null)" -ForegroundColor Cyan
Write-Host "Branch: $currentBranch" -ForegroundColor Cyan
Write-Host "Commits: $(git rev-list --count HEAD)" -ForegroundColor Cyan
Write-Host ""

$push = Read-Host "Push to GitHub? (y/n)"
if ($push -eq "y") {
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    
    # Add all changes
    git add .
    
    # Check for uncommitted changes
    $status = git status --porcelain
    if ($status) {
        Write-Host "Committing changes..." -ForegroundColor Yellow
        git commit -m "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    # Push
    try {
        git push -u origin $currentBranch
        Write-Host ""
        Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "Repository URL: $(git remote get-url origin)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Visit your repository on GitHub" -ForegroundColor White
        Write-Host "2. Go to Settings → Pages (for deployment)" -ForegroundColor White
        Write-Host "3. Add your environment variables in Settings → Secrets" -ForegroundColor White
        Write-Host "4. Connect to Vercel/Netlify for automatic deployments" -ForegroundColor White
    } catch {
        Write-Host ""
        Write-Host "✗ Push failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Make sure you're authenticated with GitHub" -ForegroundColor White
        Write-Host "   Run: gh auth login" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "2. Check your remote URL:" -ForegroundColor White
        Write-Host "   Run: git remote -v" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "3. If using HTTPS, you may need a Personal Access Token" -ForegroundColor White
        Write-Host "   Generate at: https://github.com/settings/tokens" -ForegroundColor Cyan
    }
} else {
    Write-Host "Push cancelled." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Script Complete ===" -ForegroundColor Cyan
