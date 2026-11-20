<#
.SYNOPSIS
    Creates a CloudCannon site connected to a branch of this repository.

.DESCRIPTION
    Wraps `cloudcannon sites create`, filling in the git remote URL and branch
    so a feature branch can be staged in CloudCannon with one command. Every
    run creates a real site, so check which branch is checked out first, or
    pass -Branch explicitly.

.PARAMETER Branch
    The branch the site builds from. Defaults to the checked-out branch.

.PARAMETER Name
    The CloudCannon site name. Defaults to the branch name.

.PARAMETER Org
    The CloudCannon organization name, ID, or UUID.

.PARAMETER Remote
    The git remote whose URL CloudCannon should connect to.

.EXAMPLE
    ./create_cloudcannon_site.ps1 -WhatIf

    Shows the command that would run for the checked-out branch, without creating anything.

.EXAMPLE
    ./create_cloudcannon_site.ps1 -Branch feature-new-data-explorer

.OUTPUTS
    None. The CloudCannon CLI's own output is passed through.
#>
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'Medium')]
param(
    [string]$Branch,
    [string]$Name,
    [string]$Org = '39854',
    [string]$Remote = 'origin'
)

# Resolve the CLI first: a missing command would otherwise leave
# $LASTEXITCODE untouched and the script would report success.
if (-not (Get-Command cloudcannon -CommandType Application -ErrorAction Ignore)) {
    $PSCmdlet.WriteError([System.Management.Automation.ErrorRecord]::new(
        [System.Management.Automation.CommandNotFoundException]::new('cloudcannon is not on PATH.'),
        'CloudCannonNotFound',
        [System.Management.Automation.ErrorCategory]::ObjectNotFound,
        'cloudcannon'))
    $global:LASTEXITCODE = 2
    return
}

$url = git remote get-url $Remote
if ($LASTEXITCODE -ne 0) {
    $PSCmdlet.ThrowTerminatingError([System.Management.Automation.ErrorRecord]::new(
        [System.InvalidOperationException]::new("No git remote named '$Remote'."),
        'RemoteNotFound',
        [System.Management.Automation.ErrorCategory]::ObjectNotFound,
        $Remote))
}

# --show-current prints nothing on a detached HEAD, which would create a
# site with no branch and no name.
if (-not $Branch) {
    $Branch = git branch --show-current
}
if (-not $Branch) {
    $PSCmdlet.ThrowTerminatingError([System.Management.Automation.ErrorRecord]::new(
        [System.InvalidOperationException]::new('HEAD is detached; pass -Branch.'),
        'NoBranch',
        [System.Management.Automation.ErrorCategory]::InvalidOperation,
        $null))
}

if (-not $Name) {
    $Name = $Branch
}

# CloudCannon takes the branch as a #suffix on the remote URL.
$source = "$url#$Branch"

if ($PSCmdlet.ShouldProcess("$source (org $Org)", "Create CloudCannon site '$Name'")) {
    cloudcannon sites create --name=$Name --org=$Org $source
    exit $LASTEXITCODE
}
