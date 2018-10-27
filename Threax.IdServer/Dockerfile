FROM microsoft/dotnet:2.1.5-aspnetcore-runtime AS base
WORKDIR /app
EXPOSE 80

FROM threax/build AS build
WORKDIR /src
COPY Threax.IdServer/Threax.IdServer.csproj Threax.IdServer/
RUN dotnet restore Threax.IdServer/Threax.IdServer.csproj
COPY . .
WORKDIR /src/Threax.IdServer
RUN yarn run yarn-install
RUN yarn run clean
RUN yarn run build
RUN dotnet build Threax.IdServer.csproj -c Release -o /app

FROM build AS publish
RUN dotnet publish Threax.IdServer.csproj -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "Threax.IdServer.dll"]
