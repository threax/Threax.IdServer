# syntax = docker/dockerfile:1.0-experimental
FROM mcr.microsoft.com/dotnet/aspnet:5.0 AS base
WORKDIR /app

FROM threax/build-dotnet:5.0 AS build
WORKDIR /src
COPY . .
WORKDIR /src/Threax.IdServer
RUN --mount=type=cache,target=node_modules,id=threax-build-id-idserver npm install
RUN --mount=type=cache,target=/root/.nuget/packages,id=threax-build-dotnet-nuget dotnet restore Threax.IdServer.csproj
RUN --mount=type=cache,target=/root/.nuget/packages,id=threax-build-dotnet-nuget dotnet build Threax.IdServer.csproj -c Release -o /app
RUN --mount=type=cache,target=node_modules,id=threax-build-id-idserver npm run clean
RUN --mount=type=cache,target=node_modules,id=threax-build-id-idserver npm run build

FROM build AS publish
RUN --mount=type=cache,target=/root/.nuget/packages,id=threax-build-dotnet-nuget dotnet publish Threax.IdServer.csproj -c Release -o /app

FROM base AS final
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "Threax.IdServer.dll"]
