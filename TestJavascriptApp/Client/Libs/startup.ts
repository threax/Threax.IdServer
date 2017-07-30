import * as controller from 'hr.controller';
import * as WindowFetch from 'hr.windowfetch';
import * as AccessTokens from 'hr.accesstokens';
import * as fetcher from 'hr.fetcher';
import * as bootstrap from 'hr.bootstrap.all';
import * as client from 'clientlibs.ServiceClient';

export interface ClientConfig {
    ServiceUrl: string,
    AccessTokenPath: string,
}

var builder: controller.InjectedControllerBuilder = null;

export function createBuilder() {
    if (builder === null) {
        builder = new controller.InjectedControllerBuilder();

        //Keep this bootstrap activator line, it will ensure that bootstrap is loaded and configured before continuing.
        bootstrap.activate();

        //Set up the access token fetcher
        var config = <ClientConfig>(<any>window).clientConfig;
        var whitelist = new AccessTokens.AccessWhitelist([config.ServiceUrl]);
        builder.Services.tryAddShared(fetcher.Fetcher, s => new AccessTokens.AccessTokenManager(config.AccessTokenPath, whitelist, new WindowFetch.WindowFetch()));
        builder.Services.tryAddShared(client.EntryPointInjector, s => new client.EntryPointInjector(config.ServiceUrl, s.getRequiredService(fetcher.Fetcher)));
    }
    return builder;
}