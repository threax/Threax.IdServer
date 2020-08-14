# Threax.IdServer
This is an implementation of the [IdentityServer4](https://identityserver4.readthedocs.io/en/latest/) library to use with the [Threax Hypermedia Framework](https://www.threax.com/HypermediaDocs). It can be used as is or modified to suit your environment.

Please see the [Installing Id Server](https://www.threax.com/HypermediaDocs/installing-id-server) page for more info.

## Setup
1. Select Threax.IdServer.
1. Choose the startup mode to be SetupDb then run it.
1. Next choose SetupAppDashboard and run it.
1. Change back to IIS Express and run the app.
1. Visit https://localhost:44390/Account/Manage and create an account. Copy the guid from the manage page.
1. Stop the program and run the command `dotnet run tools "addadmin GUID"` where GUID is the guid from above.
1. Now choose multiple startup projects and run both AppDashboard and Threax.IdServer. You should be able to log into the app dashboard.

## Adding Other Apps
Use the addfrommetadata command
```
dotnet run tools "addfrommetadata https://localhost:44354/"
```
Substitute the target app url for the url in the example.

## Building Dockerfile
To build this image you will need to use the experimental buildkit. This applies to any projects built with this template.

First set your environment variable to enable buildkit (powershell)
```
$env:DOCKER_BUILDKIT=1
```

Then invoke the build like this.
```
docker build . -f .\Threax.IdServer\Dockerfile -t id --progress=plain
docker build . -f .\AppDashboard\Dockerfile -t appdashboard --progress=plain
```

## Icon Attribution
Icon used from [Font Awesome](https://fontawesome.com/) under the [Creative Commons](https://en.wikipedia.org/wiki/en:Creative_Commons) [Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/deed.en) license. Modifications were made to the original image.