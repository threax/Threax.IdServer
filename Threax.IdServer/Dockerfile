FROM mcr.microsoft.com/dotnet/core/aspnet:3.1 AS base
WORKDIR /app

FROM threax/build-dotnet:3.1.0 AS build
WORKDIR /src
COPY . .
WORKDIR /src/Threax.IdServer
RUN npm install
RUN dotnet restore Threax.IdServer.csproj
RUN dotnet build Threax.IdServer.csproj -c Release -o /app
RUN npm run clean
RUN npm run build

FROM build AS publish
RUN dotnet publish Threax.IdServer.csproj -c Release -o /app

FROM base AS final
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "Threax.IdServer.dll"]
