import * as client from 'clientlibs.ServiceClient';
import * as hyperCrud from 'hr.widgets.HypermediaCrudService';
import * as di from 'hr.di';

export class HorribleBeastCrudInjector extends hyperCrud.AbstractHypermediaPageInjector {
    public static get InjectorArgs(): di.DiFunction<any>[] {
        return [client.EntryPointInjector];
    }

    constructor(private injector: client.EntryPointInjector) {
        super();
    }

    async list(query: any): Promise<hyperCrud.HypermediaCrudCollection> {
        var entry = await this.injector.load();
        return entry.listHorribleBeasts(query);
    }

    async canList(): Promise<boolean> {
        var entry = await this.injector.load();
        return entry.canListHorribleBeasts();
    }

    public getDeletePrompt(item: client.HorribleBeastResult): string {
        return "Are you sure you want to delete the horribleBeast?";
    }
}