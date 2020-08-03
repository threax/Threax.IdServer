import * as hr from 'hr.main';
import * as datetime from 'hr.bootstrap.datetime.main';
import * as bootstrap from 'hr.bootstrap.main';
import * as bootstrap4form from 'hr.form.bootstrap4.main';
import * as controller from 'hr.controller';
import * as WindowFetch from 'hr.windowfetch';
import * as AccessTokens from 'hr.accesstokens';
import * as whitelist from 'hr.whitelist';
import * as fetcher from 'hr.fetcher';
import * as client from 'clientlibs.IdServerClient';
import * as userSearch from 'clientlibs.UserSearchClientEntryPointInjector';
import * as loginPopup from 'hr.relogin.LoginPopup';
import * as deepLink from 'hr.deeplink';
import * as safepost from 'hr.safepostmessage';
import * as pageConfig from 'hr.pageconfig';

//Activate htmlrapier
hr.setup();
datetime.setup();
bootstrap.setup();
bootstrap4form.setup();

export interface Config {
    client: {
        IdentityServerHost: string;
        PageBasePath: string;
        BearerCookieName?: string;
        AccessTokenPath?: string; 
    };
}

let builder: controller.InjectedControllerBuilder = null;

export function createBuilder() {
    if (builder === null) {
        builder = new controller.InjectedControllerBuilder();

        //Set up the access token fetcher
        const config = pageConfig.read<Config>();
        builder.Services.tryAddShared(fetcher.Fetcher, s => createFetcher(config));
        builder.Services.tryAddShared(client.EntryPointsInjector, s => new client.EntryPointsInjector(config.client.IdentityServerHost + "/api", s.getRequiredService(fetcher.Fetcher)));
        builder.Services.tryAddShared(safepost.MessagePoster, s => new safepost.MessagePoster(window.location.href));
        builder.Services.tryAddShared(safepost.PostMessageValidator, s => new safepost.PostMessageValidator(window.location.href));

        userSearch.addServices(builder);

        //Setup Deep Links
        deepLink.setPageUrl(builder.Services, config.client.PageBasePath);

        //Setup relogin
        loginPopup.addServices(builder.Services);
        builder.create("hr-relogin", loginPopup.LoginPopup);
    }
    return builder;
}

function createFetcher(config: Config): fetcher.Fetcher {
    let fetcher = new WindowFetch.WindowFetch();

    if (config.client.AccessTokenPath) {
        const accessFetcher = new AccessTokens.AccessTokenFetcher(
            config.client.AccessTokenPath,
            new whitelist.Whitelist([config.client.IdentityServerHost]),
            fetcher);
        accessFetcher.disableOnNoToken = false;
        accessFetcher.bearerCookieName = config.client.BearerCookieName;
        fetcher = accessFetcher;
    }

    return fetcher;
}