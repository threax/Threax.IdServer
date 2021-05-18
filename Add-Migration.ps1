param(
    [Parameter(Position=0,mandatory=$true)]
    [string] $migrationName
)

$scriptPath = Split-Path $script:MyInvocation.MyCommand.Path

function Test-Error([string] $msg, [int] $code = 0){
    if($LastExitCode -ne $code){
        throw $msg;
    }
}

Push-Location "$scriptPath/Threax.IdServer.Db.Sqlite"

dotnet ef migrations add -c ConfigurationDbContext $migrationName; Test-Error "Error updating db context"
dotnet ef migrations add -c OperationDbContext $migrationName; Test-Error "Error updating db context"
dotnet ef migrations add -c AppDbContext $migrationName; Test-Error "Error updating db context"
dotnet ef migrations add -c IdentityUsersDbContext $migrationName; Test-Error "Error updating db context"

Pop-Location


Push-Location "$scriptPath/Threax.IdServer.Db.SqlServer"

dotnet ef migrations add -c ConfigurationDbContext $migrationName; Test-Error "Error updating db context"
dotnet ef migrations add -c OperationDbContext $migrationName; Test-Error "Error updating db context"
dotnet ef migrations add -c AppDbContext $migrationName; Test-Error "Error updating db context"
dotnet ef migrations add -c IdentityUsersDbContext $migrationName; Test-Error "Error updating db context"

Pop-Location