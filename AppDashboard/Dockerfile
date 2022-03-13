ARG BUILD_CONSTANTS=HOST_LOCAL
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app

FROM docker.io/threax/build-dotnet:6.0 AS build
ARG BUILD_CONSTANTS
WORKDIR /src
COPY . .
WORKDIR /src/AppDashboard
RUN --mount=type=cache,target=node_modules,id=threax-build-id-appdashboard npm install
RUN --mount=type=cache,target=/root/.nuget/packages,id=threax-build-dotnet-nuget dotnet restore AppDashboard.csproj
RUN --mount=type=cache,target=/root/.nuget/packages,id=threax-build-dotnet-nuget dotnet build AppDashboard.csproj -c Release -o /app /p:DefineConstants=\"$BUILD_CONSTANTS\"
RUN --mount=type=cache,target=node_modules,id=threax-build-id-appdashboard npm run clean
RUN --mount=type=cache,target=node_modules,id=threax-build-id-appdashboard npm run build

FROM build AS publish
ARG BUILD_CONSTANTS
RUN --mount=type=cache,target=/root/.nuget/packages,id=threax-build-dotnet-310-nuget dotnet publish AppDashboard.csproj -c Release -o /app /p:DefineConstants=\"$BUILD_CONSTANTS\"

FROM base AS final
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "AppDashboard.dll"]
