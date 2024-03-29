﻿import * as injectors from 'Client/Libs/ServiceClientInjectors';
import * as crudPageCore from 'htmlrapier.widgets/src/StandardCrudPage';
import * as client from 'Client/Libs/IdServerClient';
import * as crudPage from 'htmlrapier.widgets/src/CrudPage';
import * as controller from 'htmlrapier/src/controller';
import * as promptWidget from 'htmlrapier.widgets/src/prompt';
import * as startup from 'Client/Libs/startup';
import * as deepLink from 'htmlrapier/src/deeplink';

export class AddFromMetadataController {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, crudPage.ICrudService, promptWidget.IPrompt, client.EntryPointsInjector];
    }

    private crudService: crudPage.ICrudService;
    private prompt: promptWidget.IPrompt;
    private entryPointInjector: client.EntryPointsInjector;

    constructor(bindings: controller.BindingCollection, crudService: crudPage.ICrudService, prompt: promptWidget.IPrompt, entryPointInjector: client.EntryPointsInjector) {
        this.crudService = crudService;
        this.prompt = prompt;
        this.entryPointInjector = entryPointInjector;
    }

    public async addFromMetadata(evt: Event) {
        evt.preventDefault();
        try {
            var result = await this.prompt.prompt("Enter the target resource's base url.", "");
            if (result.isAccepted()) {
                var entry = await this.entryPointInjector.load();
                var resource = await entry.loadApiResourceFromMetadata({ targetUrl: result.getData() });
                this.crudService.add(resource.data);
            }
        }
        catch (err) {
            alert('Error loading metadata');
        }
    }
}

var injector = injectors.ApiResourceInjector;

var builder = startup.createBuilder();
deepLink.addServices(builder.Services);
crudPageCore.addServices(builder, injector);
builder.Services.tryAddTransient(AddFromMetadataController, AddFromMetadataController);
builder.Services.tryAddShared(promptWidget.IPrompt, s => new promptWidget.BrowserPrompt());

crudPageCore.createControllers(builder, new crudPageCore.Settings());
builder.create("addFromMetadata", AddFromMetadataController);