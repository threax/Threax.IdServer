pushd "%~dp0"

mkdir "GitPublish\AppDashboard"
pushd "GitPublish\AppDashboard"
git pull
powershell -Command "Get-ChildItem .\* -exclude .git | Remove-Item -Recurse"
popd

mkdir "GitPublish\Threax.IdServer"
pushd "GitPublish\Threax.IdServer"
git pull
powershell -Command "Get-ChildItem .\* -exclude .git | Remove-Item -Recurse"
popd

pushd "AppDashboard"
call npm run yarn-install
call npm run clean
call npm run build
popd

pushd "Threax.IdServer"
call npm run yarn-install
call npm run clean
call npm run build
popd

REM Correct way to setup msbuild on command line, but wrong way to find the file, this will eventually break
call "%programfiles(x86)%\Microsoft Visual Studio\2017\Community\Common7\Tools\VsMSBuildCmd.bat"
msbuild AppDashboard\AppDashboard.csproj /p:Configuration=Release /p:DeployOnBuild=true /p:PublishProfile=FolderProfile
msbuild Threax.IdServer\Threax.IdServer.csproj /p:Configuration=Release /p:DeployOnBuild=true /p:PublishProfile=FolderProfile
popd