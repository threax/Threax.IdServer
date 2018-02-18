import * as hal from 'hr.halcyon.EndpointClient';

export class RoleAssignmentsResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: RoleAssignments = undefined;
    public get data(): RoleAssignments {
        this.strongData = this.strongData || this.client.GetData<RoleAssignments>();
        return this.strongData;
    }

    public refresh(): Promise<RoleAssignmentsResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new RoleAssignmentsResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public setUser(data: RoleAssignments): Promise<RoleAssignmentsResult> {
        return this.client.LoadLinkWithBody("SetUser", data)
            .then(r => {
                return new RoleAssignmentsResult(r);
            });

    }

    public canSetUser(): boolean {
        return this.client.HasLink("SetUser");
    }

    public getSetUserDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("SetUser")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasSetUserDocs(): boolean {
        return this.client.HasLinkDoc("SetUser");
    }

    public deleteUser(): Promise<void> {
        return this.client.LoadLink("DeleteUser").then(hal.makeVoid);
    }

    public canDeleteUser(): boolean {
        return this.client.HasLink("DeleteUser");
    }
}

export class ApiResourceEditModelResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: ApiResourceEditModel = undefined;
    public get data(): ApiResourceEditModel {
        this.strongData = this.strongData || this.client.GetData<ApiResourceEditModel>();
        return this.strongData;
    }

    public refresh(): Promise<ApiResourceEditModelResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new ApiResourceEditModelResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public getApiResource(): Promise<ApiResourceEditModelResult> {
        return this.client.LoadLink("getApiResource")
            .then(r => {
                return new ApiResourceEditModelResult(r);
            });

    }

    public canGetApiResource(): boolean {
        return this.client.HasLink("getApiResource");
    }

    public getGetApiResourceDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("getApiResource")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasGetApiResourceDocs(): boolean {
        return this.client.HasLinkDoc("getApiResource");
    }

    public update(data: ApiResourceEditModel): Promise<void> {
        return this.client.LoadLinkWithBody("Update", data).then(hal.makeVoid);
    }

    public canUpdate(): boolean {
        return this.client.HasLink("Update");
    }

    public getUpdateDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Update")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasUpdateDocs(): boolean {
        return this.client.HasLinkDoc("Update");
    }

    public delete(): Promise<void> {
        return this.client.LoadLink("Delete").then(hal.makeVoid);
    }

    public canDelete(): boolean {
        return this.client.HasLink("Delete");
    }
}

export class ApiResourceEditModelCollectionResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: ApiResourceEditModelCollection = undefined;
    public get data(): ApiResourceEditModelCollection {
        this.strongData = this.strongData || this.client.GetData<ApiResourceEditModelCollection>();
        return this.strongData;
    }

    private strongItems: ApiResourceEditModelResult[];
    public get items(): ApiResourceEditModelResult[] {
        if (this.strongItems === undefined) {
            var embeds = this.client.GetEmbed("values");
            var clients = embeds.GetAllClients();
            this.strongItems = [];
            for (var i = 0; i < clients.length; ++i) {
                this.strongItems.push(new ApiResourceEditModelResult(clients[i]));
            }
        }
        return this.strongItems;
    }

    public refresh(): Promise<ApiResourceEditModelCollectionResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new ApiResourceEditModelCollectionResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public list(query: PagedCollectionQuery): Promise<ApiResourceEditModelCollectionResult> {
        return this.client.LoadLinkWithQuery("List", query)
            .then(r => {
                return new ApiResourceEditModelCollectionResult(r);
            });

    }

    public canList(): boolean {
        return this.client.HasLink("List");
    }

    public getListDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("List")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListDocs(): boolean {
        return this.client.HasLinkDoc("List");
    }

    public add(data: ApiResourceEditModel): Promise<void> {
        return this.client.LoadLinkWithBody("Add", data).then(hal.makeVoid);
    }

    public canAdd(): boolean {
        return this.client.HasLink("Add");
    }

    public getAddDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Add")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasAddDocs(): boolean {
        return this.client.HasLinkDoc("Add");
    }

    public loadApiResourceFromMetadata(query: MetadataLookup): Promise<ApiResourceMetadataViewResult> {
        return this.client.LoadLinkWithQuery("loadApiResourceFromMetadata", query)
            .then(r => {
                return new ApiResourceMetadataViewResult(r);
            });

    }

    public canLoadApiResourceFromMetadata(): boolean {
        return this.client.HasLink("loadApiResourceFromMetadata");
    }

    public getLoadApiResourceFromMetadataDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("loadApiResourceFromMetadata")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasLoadApiResourceFromMetadataDocs(): boolean {
        return this.client.HasLinkDoc("loadApiResourceFromMetadata");
    }

    public next(): Promise<ApiResourceEditModelCollectionResult> {
        return this.client.LoadLink("next")
            .then(r => {
                return new ApiResourceEditModelCollectionResult(r);
            });

    }

    public canNext(): boolean {
        return this.client.HasLink("next");
    }

    public getNextDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("next")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasNextDocs(): boolean {
        return this.client.HasLinkDoc("next");
    }

    public previous(): Promise<ApiResourceEditModelCollectionResult> {
        return this.client.LoadLink("previous")
            .then(r => {
                return new ApiResourceEditModelCollectionResult(r);
            });

    }

    public canPrevious(): boolean {
        return this.client.HasLink("previous");
    }

    public getPreviousDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("previous")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasPreviousDocs(): boolean {
        return this.client.HasLinkDoc("previous");
    }

    public first(): Promise<ApiResourceEditModelCollectionResult> {
        return this.client.LoadLink("first")
            .then(r => {
                return new ApiResourceEditModelCollectionResult(r);
            });

    }

    public canFirst(): boolean {
        return this.client.HasLink("first");
    }

    public getFirstDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("first")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasFirstDocs(): boolean {
        return this.client.HasLinkDoc("first");
    }

    public last(): Promise<ApiResourceEditModelCollectionResult> {
        return this.client.LoadLink("last")
            .then(r => {
                return new ApiResourceEditModelCollectionResult(r);
            });

    }

    public canLast(): boolean {
        return this.client.HasLink("last");
    }

    public getLastDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("last")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasLastDocs(): boolean {
        return this.client.HasLinkDoc("last");
    }
}

export class ApiResourceMetadataViewResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: ApiResourceMetadataView = undefined;
    public get data(): ApiResourceMetadataView {
        this.strongData = this.strongData || this.client.GetData<ApiResourceMetadataView>();
        return this.strongData;
    }

    public refresh(): Promise<ApiResourceMetadataViewResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new ApiResourceMetadataViewResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }
}

export class ClientEditModelResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: ClientEditModel = undefined;
    public get data(): ClientEditModel {
        this.strongData = this.strongData || this.client.GetData<ClientEditModel>();
        return this.strongData;
    }

    public refresh(): Promise<ClientEditModelResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new ClientEditModelResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public update(data: ClientEditModel): Promise<void> {
        return this.client.LoadLinkWithBody("Update", data).then(hal.makeVoid);
    }

    public canUpdate(): boolean {
        return this.client.HasLink("Update");
    }

    public getUpdateDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Update")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasUpdateDocs(): boolean {
        return this.client.HasLinkDoc("Update");
    }

    public delete(): Promise<void> {
        return this.client.LoadLink("Delete").then(hal.makeVoid);
    }

    public canDelete(): boolean {
        return this.client.HasLink("Delete");
    }

    public addClientSecret(): Promise<CreateSecretResultResult> {
        return this.client.LoadLink("addClientSecret")
            .then(r => {
                return new CreateSecretResultResult(r);
            });

    }

    public canAddClientSecret(): boolean {
        return this.client.HasLink("addClientSecret");
    }

    public getAddClientSecretDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("addClientSecret")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasAddClientSecretDocs(): boolean {
        return this.client.HasLinkDoc("addClientSecret");
    }
}

export class ClientEditModelCollectionViewResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: ClientEditModelCollectionView = undefined;
    public get data(): ClientEditModelCollectionView {
        this.strongData = this.strongData || this.client.GetData<ClientEditModelCollectionView>();
        return this.strongData;
    }

    private strongItems: ClientEditModelResult[];
    public get items(): ClientEditModelResult[] {
        if (this.strongItems === undefined) {
            var embeds = this.client.GetEmbed("values");
            var clients = embeds.GetAllClients();
            this.strongItems = [];
            for (var i = 0; i < clients.length; ++i) {
                this.strongItems.push(new ClientEditModelResult(clients[i]));
            }
        }
        return this.strongItems;
    }

    public refresh(): Promise<ClientEditModelCollectionViewResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new ClientEditModelCollectionViewResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public list(query: PagedCollectionQuery): Promise<ClientEditModelCollectionViewResult> {
        return this.client.LoadLinkWithQuery("List", query)
            .then(r => {
                return new ClientEditModelCollectionViewResult(r);
            });

    }

    public canList(): boolean {
        return this.client.HasLink("List");
    }

    public getListDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("List")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListDocs(): boolean {
        return this.client.HasLinkDoc("List");
    }

    public add(data: ClientEditModel): Promise<void> {
        return this.client.LoadLinkWithBody("Add", data).then(hal.makeVoid);
    }

    public canAdd(): boolean {
        return this.client.HasLink("Add");
    }

    public getAddDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Add")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasAddDocs(): boolean {
        return this.client.HasLinkDoc("Add");
    }

    public loadClientFromMetadata(query: MetadataLookup): Promise<ClientMetadataViewResult> {
        return this.client.LoadLinkWithQuery("loadClientFromMetadata", query)
            .then(r => {
                return new ClientMetadataViewResult(r);
            });

    }

    public canLoadClientFromMetadata(): boolean {
        return this.client.HasLink("loadClientFromMetadata");
    }

    public getLoadClientFromMetadataDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("loadClientFromMetadata")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasLoadClientFromMetadataDocs(): boolean {
        return this.client.HasLinkDoc("loadClientFromMetadata");
    }

    public next(): Promise<ClientEditModelCollectionViewResult> {
        return this.client.LoadLink("next")
            .then(r => {
                return new ClientEditModelCollectionViewResult(r);
            });

    }

    public canNext(): boolean {
        return this.client.HasLink("next");
    }

    public getNextDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("next")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasNextDocs(): boolean {
        return this.client.HasLinkDoc("next");
    }

    public previous(): Promise<ClientEditModelCollectionViewResult> {
        return this.client.LoadLink("previous")
            .then(r => {
                return new ClientEditModelCollectionViewResult(r);
            });

    }

    public canPrevious(): boolean {
        return this.client.HasLink("previous");
    }

    public getPreviousDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("previous")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasPreviousDocs(): boolean {
        return this.client.HasLinkDoc("previous");
    }

    public first(): Promise<ClientEditModelCollectionViewResult> {
        return this.client.LoadLink("first")
            .then(r => {
                return new ClientEditModelCollectionViewResult(r);
            });

    }

    public canFirst(): boolean {
        return this.client.HasLink("first");
    }

    public getFirstDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("first")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasFirstDocs(): boolean {
        return this.client.HasLinkDoc("first");
    }

    public last(): Promise<ClientEditModelCollectionViewResult> {
        return this.client.LoadLink("last")
            .then(r => {
                return new ClientEditModelCollectionViewResult(r);
            });

    }

    public canLast(): boolean {
        return this.client.HasLink("last");
    }

    public getLastDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("last")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasLastDocs(): boolean {
        return this.client.HasLinkDoc("last");
    }
}

export class ClientMetadataViewResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: ClientMetadataView = undefined;
    public get data(): ClientMetadataView {
        this.strongData = this.strongData || this.client.GetData<ClientMetadataView>();
        return this.strongData;
    }

    public refresh(): Promise<ClientMetadataViewResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new ClientMetadataViewResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }
}

export class CreateSecretResultResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: CreateSecretResult = undefined;
    public get data(): CreateSecretResult {
        this.strongData = this.strongData || this.client.GetData<CreateSecretResult>();
        return this.strongData;
    }

    public refresh(): Promise<CreateSecretResultResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new CreateSecretResultResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }
}

export class EntryPointsInjector {
    private url: string;
    private fetcher: hal.Fetcher;
    private instance: EntryPointsResult;

    constructor(url: string, fetcher: hal.Fetcher) {
        this.url = url;
        this.fetcher = fetcher;
    }

    public load(): Promise<EntryPointsResult> {
        if (!this.instance) {
            return EntryPointsResult.Load(this.url, this.fetcher).then((r) => {
                this.instance = r;
                return r;
            });
        }

        return Promise.resolve(this.instance);
    }
}

export class EntryPointsResult {
    private client: hal.HalEndpointClient;

    public static Load(url: string, fetcher: hal.Fetcher): Promise<EntryPointsResult> {
        return hal.HalEndpointClient.Load({
            href: url,
            method: "GET"
        }, fetcher)
            .then(c => {
                return new EntryPointsResult(c);
            });
    }

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: EntryPoints = undefined;
    public get data(): EntryPoints {
        this.strongData = this.strongData || this.client.GetData<EntryPoints>();
        return this.strongData;
    }

    public refresh(): Promise<EntryPointsResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new EntryPointsResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public listClients(query: PagedCollectionQuery): Promise<ClientEditModelCollectionViewResult> {
        return this.client.LoadLinkWithQuery("listClients", query)
            .then(r => {
                return new ClientEditModelCollectionViewResult(r);
            });

    }

    public canListClients(): boolean {
        return this.client.HasLink("listClients");
    }

    public getListClientsDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("listClients")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListClientsDocs(): boolean {
        return this.client.HasLinkDoc("listClients");
    }

    public addClient(data: ClientEditModel): Promise<void> {
        return this.client.LoadLinkWithBody("addClient", data).then(hal.makeVoid);
    }

    public canAddClient(): boolean {
        return this.client.HasLink("addClient");
    }

    public getAddClientDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("addClient")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasAddClientDocs(): boolean {
        return this.client.HasLinkDoc("addClient");
    }

    public updateClient(data: ClientEditModel): Promise<void> {
        return this.client.LoadLinkWithBody("updateClient", data).then(hal.makeVoid);
    }

    public canUpdateClient(): boolean {
        return this.client.HasLink("updateClient");
    }

    public getUpdateClientDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("updateClient")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasUpdateClientDocs(): boolean {
        return this.client.HasLinkDoc("updateClient");
    }

    public deleteClient(): Promise<void> {
        return this.client.LoadLink("deleteClient").then(hal.makeVoid);
    }

    public canDeleteClient(): boolean {
        return this.client.HasLink("deleteClient");
    }

    public loadClientFromMetadata(query: MetadataLookup): Promise<ClientMetadataViewResult> {
        return this.client.LoadLinkWithQuery("loadClientFromMetadata", query)
            .then(r => {
                return new ClientMetadataViewResult(r);
            });

    }

    public canLoadClientFromMetadata(): boolean {
        return this.client.HasLink("loadClientFromMetadata");
    }

    public getLoadClientFromMetadataDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("loadClientFromMetadata")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasLoadClientFromMetadataDocs(): boolean {
        return this.client.HasLinkDoc("loadClientFromMetadata");
    }

    public addClientSecret(): Promise<CreateSecretResultResult> {
        return this.client.LoadLink("addClientSecret")
            .then(r => {
                return new CreateSecretResultResult(r);
            });

    }

    public canAddClientSecret(): boolean {
        return this.client.HasLink("addClientSecret");
    }

    public getAddClientSecretDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("addClientSecret")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasAddClientSecretDocs(): boolean {
        return this.client.HasLinkDoc("addClientSecret");
    }

    public listApiResource(query: PagedCollectionQuery): Promise<ApiResourceEditModelCollectionResult> {
        return this.client.LoadLinkWithQuery("listApiResource", query)
            .then(r => {
                return new ApiResourceEditModelCollectionResult(r);
            });

    }

    public canListApiResource(): boolean {
        return this.client.HasLink("listApiResource");
    }

    public getListApiResourceDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("listApiResource")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListApiResourceDocs(): boolean {
        return this.client.HasLinkDoc("listApiResource");
    }

    public addApiResource(data: ApiResourceEditModel): Promise<void> {
        return this.client.LoadLinkWithBody("addApiResource", data).then(hal.makeVoid);
    }

    public canAddApiResource(): boolean {
        return this.client.HasLink("addApiResource");
    }

    public getAddApiResourceDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("addApiResource")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasAddApiResourceDocs(): boolean {
        return this.client.HasLinkDoc("addApiResource");
    }

    public updateApiResource(data: ApiResourceEditModel): Promise<void> {
        return this.client.LoadLinkWithBody("updateApiResource", data).then(hal.makeVoid);
    }

    public canUpdateApiResource(): boolean {
        return this.client.HasLink("updateApiResource");
    }

    public getUpdateApiResourceDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("updateApiResource")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasUpdateApiResourceDocs(): boolean {
        return this.client.HasLinkDoc("updateApiResource");
    }

    public deleteApiResource(): Promise<void> {
        return this.client.LoadLink("deleteApiResource").then(hal.makeVoid);
    }

    public canDeleteApiResource(): boolean {
        return this.client.HasLink("deleteApiResource");
    }

    public loadApiResourceFromMetadata(query: MetadataLookup): Promise<ApiResourceMetadataViewResult> {
        return this.client.LoadLinkWithQuery("loadApiResourceFromMetadata", query)
            .then(r => {
                return new ApiResourceMetadataViewResult(r);
            });

    }

    public canLoadApiResourceFromMetadata(): boolean {
        return this.client.HasLink("loadApiResourceFromMetadata");
    }

    public getLoadApiResourceFromMetadataDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("loadApiResourceFromMetadata")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasLoadApiResourceFromMetadataDocs(): boolean {
        return this.client.HasLinkDoc("loadApiResourceFromMetadata");
    }

    public beginRegister(): Promise<RegisterEditModelResult> {
        return this.client.LoadLink("BeginRegister")
            .then(r => {
                return new RegisterEditModelResult(r);
            });

    }

    public canBeginRegister(): boolean {
        return this.client.HasLink("BeginRegister");
    }

    public getBeginRegisterDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("BeginRegister")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasBeginRegisterDocs(): boolean {
        return this.client.HasLinkDoc("BeginRegister");
    }

    public getUser(): Promise<RoleAssignmentsResult> {
        return this.client.LoadLink("GetUser")
            .then(r => {
                return new RoleAssignmentsResult(r);
            });

    }

    public canGetUser(): boolean {
        return this.client.HasLink("GetUser");
    }

    public getGetUserDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("GetUser")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasGetUserDocs(): boolean {
        return this.client.HasLinkDoc("GetUser");
    }

    public listUsers(query: RolesQuery): Promise<UserCollectionResult> {
        return this.client.LoadLinkWithQuery("ListUsers", query)
            .then(r => {
                return new UserCollectionResult(r);
            });

    }

    public canListUsers(): boolean {
        return this.client.HasLink("ListUsers");
    }

    public getListUsersDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("ListUsers")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListUsersDocs(): boolean {
        return this.client.HasLinkDoc("ListUsers");
    }

    public setUser(data: RoleAssignments): Promise<RoleAssignmentsResult> {
        return this.client.LoadLinkWithBody("SetUser", data)
            .then(r => {
                return new RoleAssignmentsResult(r);
            });

    }

    public canSetUser(): boolean {
        return this.client.HasLink("SetUser");
    }

    public getSetUserDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("SetUser")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasSetUserDocs(): boolean {
        return this.client.HasLinkDoc("SetUser");
    }
}

export class RegisterEditModelResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: RegisterEditModel = undefined;
    public get data(): RegisterEditModel {
        this.strongData = this.strongData || this.client.GetData<RegisterEditModel>();
        return this.strongData;
    }

    public refresh(): Promise<RegisterEditModelResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new RegisterEditModelResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public save(data: RegisterEditModel): Promise<RegisterEditModelResult> {
        return this.client.LoadLinkWithBody("save", data)
            .then(r => {
                return new RegisterEditModelResult(r);
            });

    }

    public canSave(): boolean {
        return this.client.HasLink("save");
    }

    public getSaveDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("save")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasSaveDocs(): boolean {
        return this.client.HasLinkDoc("save");
    }
}

export class UserCollectionResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: UserCollection = undefined;
    public get data(): UserCollection {
        this.strongData = this.strongData || this.client.GetData<UserCollection>();
        return this.strongData;
    }

    private strongItems: RoleAssignmentsResult[];
    public get items(): RoleAssignmentsResult[] {
        if (this.strongItems === undefined) {
            var embeds = this.client.GetEmbed("values");
            var clients = embeds.GetAllClients();
            this.strongItems = [];
            for (var i = 0; i < clients.length; ++i) {
                this.strongItems.push(new RoleAssignmentsResult(clients[i]));
            }
        }
        return this.strongItems;
    }

    public refresh(): Promise<UserCollectionResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new UserCollectionResult(r);
            });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public getRefreshDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public next(): Promise<UserCollectionResult> {
        return this.client.LoadLink("next")
            .then(r => {
                return new UserCollectionResult(r);
            });

    }

    public canNext(): boolean {
        return this.client.HasLink("next");
    }

    public getNextDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("next")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasNextDocs(): boolean {
        return this.client.HasLinkDoc("next");
    }

    public previous(): Promise<UserCollectionResult> {
        return this.client.LoadLink("previous")
            .then(r => {
                return new UserCollectionResult(r);
            });

    }

    public canPrevious(): boolean {
        return this.client.HasLink("previous");
    }

    public getPreviousDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("previous")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasPreviousDocs(): boolean {
        return this.client.HasLinkDoc("previous");
    }

    public first(): Promise<UserCollectionResult> {
        return this.client.LoadLink("first")
            .then(r => {
                return new UserCollectionResult(r);
            });

    }

    public canFirst(): boolean {
        return this.client.HasLink("first");
    }

    public getFirstDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("first")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasFirstDocs(): boolean {
        return this.client.HasLinkDoc("first");
    }

    public last(): Promise<UserCollectionResult> {
        return this.client.LoadLink("last")
            .then(r => {
                return new UserCollectionResult(r);
            });

    }

    public canLast(): boolean {
        return this.client.HasLink("last");
    }

    public getLastDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("last")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasLastDocs(): boolean {
        return this.client.HasLinkDoc("last");
    }
}
//----------------------
// <auto-generated>
//     Generated using the NSwag toolchain v9.1.0.0 (http://NJsonSchema.org)
// </auto-generated>
//----------------------





export interface RoleAssignments {
    editClients?: boolean;
    editApiResources?: boolean;
    userId?: string;
    name?: string;
    editRoles?: boolean;
    superAdmin?: boolean;
}

export interface ApiResourceEditModel {
    id?: number;
    scopeName: string;
    displayName: string;
}

/** View model for collections of clients. */
export interface ApiResourceEditModelCollection {
    offset?: number;
    limit?: number;
    total?: number;
}

export interface PagedCollectionQuery {
    offset?: number;
    limit?: number;
}

/** A model class for looking up metadata. */
export interface MetadataLookup {
    /** The url to lookup metadata from. */
    targetUrl?: string;
}

export interface ApiResourceMetadataView {
    scopeName: string;
    displayName: string;
}

export interface ClientEditModel {
    /** The id of the client. */
    id?: number;
    clientId: string;
    name: string;
    logoutUri: string;
    logoutSessionRequired?: boolean;
    allowedGrantTypes: string[];
    redirectUris?: string[];
    allowedScopes?: string[];
    enableLocalLogin?: boolean;
    accessTokenLifetime?: number;
}

export interface CreateSecretResult {
    secret?: string;
}

/** View model for collections of clients. */
export interface ClientEditModelCollectionView {
    offset?: number;
    limit?: number;
    total?: number;
}

export interface ClientMetadataView {
    clientId: string;
    name: string;
    logoutUri: string;
    logoutSessionRequired?: boolean;
    allowedGrantTypes: string[];
    redirectUris?: string[];
    allowedScopes?: string[];
    enableLocalLogin?: boolean;
    accessTokenLifetime?: number;
}

/** This class returns the entry points to the system using hal links. */
export interface EntryPoints {
}

export interface RegisterEditModel {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

export interface RolesQuery {
    userId?: string[];
    name?: string;
    offset?: number;
    limit?: number;
}

export interface UserCollection {
    offset?: number;
    limit?: number;
    total?: number;
}

