import * as controller from 'htmlrapier/src/controller';
import * as startup from 'Client/Libs/startup';
import * as menu from 'htmlrapier.appmenu/src/AppMenu';
import * as client from 'Client/Libs/IdServerClient';

class AppMenuInjector extends menu.AppMenuInjector<client.EntryPointsResult> {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [client.EntryPointsInjector];
    }

    constructor(private entryPointInjector: client.EntryPointsInjector) {
        super();
    }

    public * createMenu(entry: client.EntryPointsResult): Generator<menu.AppMenuItem> {
        if (entry.canListClients()) {
            yield { text: "Clients", href: "Clients" };
        }

        if (entry.canListApiResource()) {
            yield { text: "Resources", href: "ApiResources" };
        }

        if (entry.canListUsers()) {
            yield { text: "Users", href: "UserRoles" };
        }
    }

    public getEntryPoint(): Promise<client.EntryPointsResult> {
        return this.entryPointInjector.load();
    }
}

const builder = startup.createBuilder();
menu.addServices(builder.Services, AppMenuInjector);
builder.create("appMenu", menu.AppMenu);