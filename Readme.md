# Threax.IdServer
This is an implementation of the [IdentityServer4](https://identityserver4.readthedocs.io/en/latest/) library to use with the [Threax Hypermedia Framework](https://www.threax.com/HypermediaDocs). It can be used as is or modified to suit your environment.

Please see the [Installing Id Server](https://www.threax.com/HypermediaDocs/installing-id-server) page for more info.

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