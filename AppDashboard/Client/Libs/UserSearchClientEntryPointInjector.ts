import * as controller from 'hr.controller';
import * as client from 'clientlibs.IdServerClient';
import * as userDirectoryClient from 'hr.roleclient.UserDirectoryClient';
import * as roleClient from 'hr.roleclient.RoleClient';

export class UserSearchClientEntryPointInjector extends userDirectoryClient.UserSearchEntryPointInjector {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [client.EntryPointsInjector];
    }

    private instance: Promise<userDirectoryClient.EntryPointResult>;

    constructor(private injector: client.EntryPointsInjector) {
        super();
    }

    public load(): Promise<userDirectoryClient.EntryPointResult> {
        if (!this.instance) {
            this.instance = this.injector.load();
        }

        return this.instance;
    }
}


export function addServices(builder: controller.InjectedControllerBuilder) {
    //Map the role entry point to the service entry point and add the user directory
    builder.Services.addShared(roleClient.IRoleEntryInjector, s => s.getRequiredService(client.EntryPointsInjector));
    builder.Services.addShared(userDirectoryClient.UserSearchEntryPointInjector, UserSearchClientEntryPointInjector);
}