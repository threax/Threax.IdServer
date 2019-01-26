FROM microsoft/dotnet:2.2.1-aspnetcore-runtime AS base
WORKDIR /app

FROM threax/build AS build
WORKDIR /src
COPY . .
WORKDIR /src/Threax.IdServer
RUN yarn run yarn-install
RUN dotnet restore Threax.IdServer.csproj
RUN dotnet build Threax.IdServer.csproj -c Release -o /app
RUN yarn run clean
RUN yarn run build

FROM build AS publish
RUN dotnet publish Threax.IdServer.csproj -c Release -o /app

FROM base AS final
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "Threax.IdServer.dll"]
