import * as client from 'clientlibs.IdServerClient';
import * as hyperCrud from 'hr.widgets.HypermediaCrudService';
import * as di from 'hr.di';

export class ApiResourceInjector extends hyperCrud.AbstractHypermediaPageInjector {
    public static get InjectorArgs(): di.DiFunction<any>[] {
        return [client.EntryPointsInjector];
    }

    constructor(private injector: client.EntryPointsInjector) {
        super();
    }

    async list(query: any): Promise<hyperCrud.HypermediaCrudCollection> {
        var entry = await this.injector.load();
        return entry.listApiResource(query);
    }

    async canList(): Promise<boolean> {
        var entry = await this.injector.load();
        return entry.canListApiResource();
    }

    public getDeletePrompt(item: client.ApiResourceEditModelResult): string {
        return "Are you sure you want to delete the resource " + item.data.displayName + "?";
    }
}

export class ClientResourceInjector extends hyperCrud.AbstractHypermediaPageInjector {
    public static get InjectorArgs(): di.DiFunction<any>[] {
        return [client.EntryPointsInjector];
    }

    constructor(private injector: client.EntryPointsInjector) {
        super();
    }

    async list(query: any): Promise<hyperCrud.HypermediaCrudCollection> {
        var entry = await this.injector.load();
        return entry.listClients(query);
    }

    async canList(): Promise<boolean> {
        var entry = await this.injector.load();
        return entry.canListClients();
    }

    public getDeletePrompt(item: client.ClientEditModelResult): string {
        return "Are you sure you want to delete the client " + item.data.name + "?";
    }
}