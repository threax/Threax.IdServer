import * as hr from 'hr.main';
import * as datetime from 'hr.bootstrap.datetime.main';
import * as bootstrap from 'hr.bootstrap.main';
import * as bootstrap4form from 'hr.form.bootstrap4.main';
import * as controller from 'hr.controller';
import * as WindowFetch from 'hr.windowfetch';
import * as tokenmanager from 'hr.accesstoken.manager';
import * as tokenfetcher from 'hr.accesstoken.fetcher';
import * as whitelist from 'hr.whitelist';
import * as fetcher from 'hr.fetcher';
import * as client from 'clientlibs.IdServerClient';
import * as userSearch from 'clientlibs.UserSearchClientEntryPointInjector';
import * as loginPopup from 'hr.relogin.LoginPopup';
import * as deepLink from 'hr.deeplink';
import * as safepost from 'hr.safepostmessage';
import * as pageConfig from 'hr.pageconfig';
import * as di from 'hr.di';

export interface Config {
    client: {
        ServiceUrl: string;
        PageBasePath: string;
        BearerCookieName?: string;
        AccessTokenPath?: string; 
    };
}

let builder: controller.InjectedControllerBuilder = null;

export function createBuilder() {
    if (builder === null) {
        //Activate htmlrapier
        hr.setup();
        datetime.setup();
        bootstrap.setup();
        bootstrap4form.setup();

        builder = new controller.InjectedControllerBuilder();

        //Set up the fetcher and entry point
        const config = pageConfig.read<Config>();
        builder.Services.tryAddShared(fetcher.Fetcher, s => createFetcher(s, config));
        builder.Services.tryAddShared(client.EntryPointsInjector, s => new client.EntryPointsInjector(config.client.ServiceUrl, s.getRequiredService(fetcher.Fetcher)));
        builder.Services.tryAddShared(safepost.MessagePoster, s => new safepost.MessagePoster(window.location.href));
        builder.Services.tryAddShared(safepost.PostMessageValidator, s => new safepost.PostMessageValidator(window.location.href));
        tokenmanager.addServices(builder.Services, config.client.AccessTokenPath, config.client.BearerCookieName);

        userSearch.addServices(builder);

        //Setup Deep Links
        deepLink.setPageUrl(builder.Services, config.client.PageBasePath);

        //Setup relogin
        loginPopup.addServices(builder.Services);
        builder.create("hr-relogin", loginPopup.LoginPopup);
    }
    return builder;
}

function createFetcher(scope: di.Scope, config: Config): fetcher.Fetcher {
    let fetcher = new WindowFetch.WindowFetch();

    if (config.client.AccessTokenPath) {
        const accessFetcher = new tokenfetcher.AccessTokenFetcher(
            scope.getRequiredService(tokenmanager.TokenManager),
            new whitelist.Whitelist([config.client.ServiceUrl]),
            fetcher);
        fetcher = accessFetcher;
    }

    return fetcher;
}