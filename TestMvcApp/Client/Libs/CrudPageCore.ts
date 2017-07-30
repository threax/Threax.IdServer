import * as controller from 'hr.controller';
import * as startup from 'clientlibs.startup';
import * as hyperCrudPage from 'hr.widgets.HypermediaCrudService';

export type HypermediaPageInjectorConstructor = Function & {
    InjectorArgs: controller.DiFunction<any>[];
    prototype: hyperCrudPage.HypermediaPageInjector
};

export class Settings {
    constructor(public injector: HypermediaPageInjectorConstructor) {

    }

    searchName = "search";
    pageNumbersName = "pageNumbers";
    mainTableName = "mainTable";
    entryEditorName = "entryEditor";
}

/**
 * Run a crud page. This will handle all the services including the page startup services, you need
 * only provide the injector and the names of the controllers, which have defaults.
 * @param builder
 */
export function create(settings: Settings) {
    var builder = startup.createBuilder();
    hyperCrudPage.addServices(builder.Services);
    builder.Services.tryAddShared(hyperCrudPage.HypermediaPageInjector, settings.injector);
    builder.create(settings.searchName, hyperCrudPage.CrudSearch);
    builder.create(settings.pageNumbersName, hyperCrudPage.CrudPageNumbers);
    builder.create(settings.mainTableName, hyperCrudPage.CrudTableController);
    builder.create(settings.entryEditorName, hyperCrudPage.CrudItemEditorController);
}