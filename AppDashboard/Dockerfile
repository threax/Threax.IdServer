FROM mcr.microsoft.com/dotnet/core/aspnet:2.2 AS base
WORKDIR /app

FROM threax/build AS build
WORKDIR /src
COPY . .
WORKDIR /src/AppDashboard
RUN npm install
RUN dotnet restore AppDashboard.csproj
RUN dotnet build AppDashboard.csproj -c Release -o /app
RUN npm run clean
RUN npm run build

FROM build AS publish
RUN dotnet publish AppDashboard.csproj -c Release -o /app

FROM base AS final
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "AppDashboard.dll"]
