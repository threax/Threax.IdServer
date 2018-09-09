import * as injectors from 'clientlibs.ServiceClientInjectors';
import * as crudPageCore from 'hr.widgets.StandardCrudPage';
import * as client from 'clientlibs.IdServerClient';
import * as crudPage from 'hr.widgets.CrudPage';
import * as controller from 'hr.controller';
import * as promptWidget from 'hr.widgets.prompt';
import { IConfirm } from 'hr.widgets.confirm';
import { IAlert } from 'hr.widgets.alert';
import * as secrets from 'clientlibs.SecretDisplayController';
import * as startup from 'clientlibs.startup';

class RowWithSecretController extends crudPage.CrudTableRowControllerExtensions {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [secrets.SecretDisplayController, IConfirm];
    }

    private data: client.ClientEditModelResult;

    constructor(private secretDisplay: secrets.SecretDisplayController, private confirm: IConfirm) {
        super();
    }

    public rowConstructed(row: crudPage.CrudTableRowController, bindings: controller.BindingCollection, data: client.ClientEditModelResult): void {
        this.data = data;
        bindings.setListener(this);
    }

    public async createSecret(evt: Event): Promise<void> {
        evt.preventDefault();
        if (await this.confirm.confirm("Continuing will override the secret already in the database, you will need to update any connected apps. Do you want to continue?")) {
            this.secretDisplay.showLoading();
            var secretResult = await this.data.addClientSecret();
            this.secretDisplay.showSecret(this.data.data.name, secretResult.data.secret);
        }
    }
}

export abstract class AddFromMetadataControllerBase {
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
            var result = await this.prompt.prompt("Enter the target client's base url.", "");
            if (result.isAccepted()) {
                var entry = await this.entryPointInjector.load();
                var resource = await this.loadMetadata(entry, result.getData());
                this.crudService.add(resource.data);
            }
        }
        catch (err) {
            alert('Error loading metadata');
        }
    }

    protected abstract loadMetadata(entry: client.EntryPointsResult, targetUrl: string): Promise<client.ClientMetadataViewResult>;
}

export class AddFromMetadataController extends AddFromMetadataControllerBase {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return AddFromMetadataControllerBase.InjectorArgs;
    }

    constructor(bindings: controller.BindingCollection, crudService: crudPage.ICrudService, prompt: promptWidget.IPrompt, entryPointInjector: client.EntryPointsInjector) {
        super(bindings, crudService, prompt, entryPointInjector);
    }

    protected loadMetadata(entry: client.EntryPointsResult, targetUrl: string): Promise<client.ClientMetadataViewResult> {
        return entry.loadClientFromMetadata({ targetUrl: targetUrl });
    }
}

export class AddFromClientCredentialsMetadataController extends AddFromMetadataControllerBase {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return AddFromMetadataControllerBase.InjectorArgs;
    }

    constructor(bindings: controller.BindingCollection, crudService: crudPage.ICrudService, prompt: promptWidget.IPrompt, entryPointInjector: client.EntryPointsInjector) {
        super(bindings, crudService, prompt, entryPointInjector);
    }

    protected loadMetadata(entry: client.EntryPointsResult, targetUrl: string): Promise<client.ClientMetadataViewResult> {
        return entry.loadFromClientCredentialsMetadata({ targetUrl: targetUrl });
    }
}

var injector = injectors.ClientResourceInjector;
var builder = startup.createBuilder();

crudPageCore.addServices(builder, injector);
secrets.addServices(builder.Services);
builder.Services.addTransient(crudPage.CrudTableRowControllerExtensions, RowWithSecretController);
builder.Services.tryAddTransient(AddFromMetadataController, AddFromMetadataController);
builder.Services.tryAddTransient(AddFromClientCredentialsMetadataController, AddFromClientCredentialsMetadataController);
builder.Services.tryAddShared(promptWidget.IPrompt, s => new promptWidget.BrowserPrompt());

crudPageCore.createControllers(builder, new crudPageCore.Settings());
builder.create("secretDisplay", secrets.SecretDisplayController);
builder.create("addFromMetadata", AddFromMetadataController);
builder.create("addFromClientCredentialsMetadata", AddFromClientCredentialsMetadataController);