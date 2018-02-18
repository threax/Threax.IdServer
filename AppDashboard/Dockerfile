FROM microsoft/dotnet:1.1.2-runtime-nanoserver-10.0.14393.1198
WORKDIR /app
COPY bin/Release/PublishOutput/ .
ENV ASPNETCORE_URLS http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "OlsAppDashboard.dll"]
