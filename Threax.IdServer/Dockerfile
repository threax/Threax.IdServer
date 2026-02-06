ARG BUILD_CONSTANTS=HOST_LOCAL;DB_SQLITE
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app

FROM docker.io/threax/build-dotnet:10.0 AS build
ARG BUILD_CONSTANTS
WORKDIR /src
COPY . .
WORKDIR /src/Threax.IdServer
RUN --mount=type=cache,target=node_modules,id=threax-build-id-idserver npm install
RUN --mount=type=cache,target=/root/.nuget/packages,id=threax-build-dotnet-nuget dotnet restore Threax.IdServer.csproj
RUN --mount=type=cache,target=/root/.nuget/packages,id=threax-build-dotnet-nuget dotnet build Threax.IdServer.csproj -c Release -o /app /p:DefineConstants=\"$BUILD_CONSTANTS\"
RUN --mount=type=cache,target=node_modules,id=threax-build-id-idserver npm run clean
RUN --mount=type=cache,target=node_modules,id=threax-build-id-idserver npm run build

FROM build AS publish
ARG BUILD_CONSTANTS
RUN --mount=type=cache,target=/root/.nuget/packages,id=threax-build-dotnet-nuget dotnet publish Threax.IdServer.csproj -c Release -o /app /p:DefineConstants=\"$BUILD_CONSTANTS\"

FROM base AS final
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "Threax.IdServer.dll"]
