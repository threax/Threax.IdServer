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

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
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
        return this.client.LoadLinkWithData("SetUser", data)
               .then(r => {
                    return new RoleAssignmentsResult(r);
                });

    }

    public canSetUser(): boolean {
        return this.client.HasLink("SetUser");
    }

    public linkForSetUser(): hal.HalLink {
        return this.client.GetLink("SetUser");
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

    public linkForDeleteUser(): hal.HalLink {
        return this.client.GetLink("DeleteUser");
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

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
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

    public linkForGetApiResource(): hal.HalLink {
        return this.client.GetLink("getApiResource");
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

    public update(data: ApiResourceInput): Promise<void> {
        return this.client.LoadLinkWithData("Update", data).then(hal.makeVoid);
    }

    public canUpdate(): boolean {
        return this.client.HasLink("Update");
    }

    public linkForUpdate(): hal.HalLink {
        return this.client.GetLink("Update");
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

    public linkForDelete(): hal.HalLink {
        return this.client.GetLink("Delete");
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

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
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

    public list(data: PagedCollectionQuery): Promise<ApiResourceEditModelCollectionResult> {
        return this.client.LoadLinkWithData("List", data)
               .then(r => {
                    return new ApiResourceEditModelCollectionResult(r);
                });

    }

    public canList(): boolean {
        return this.client.HasLink("List");
    }

    public linkForList(): hal.HalLink {
        return this.client.GetLink("List");
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

    public add(data: ApiResourceInput): Promise<void> {
        return this.client.LoadLinkWithData("Add", data).then(hal.makeVoid);
    }

    public canAdd(): boolean {
        return this.client.HasLink("Add");
    }

    public linkForAdd(): hal.HalLink {
        return this.client.GetLink("Add");
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

    public loadApiResourceFromMetadata(data: MetadataLookup): Promise<ApiResourceMetadataViewResult> {
        return this.client.LoadLinkWithData("loadApiResourceFromMetadata", data)
               .then(r => {
                    return new ApiResourceMetadataViewResult(r);
                });

    }

    public canLoadApiResourceFromMetadata(): boolean {
        return this.client.HasLink("loadApiResourceFromMetadata");
    }

    public linkForLoadApiResourceFromMetadata(): hal.HalLink {
        return this.client.GetLink("loadApiResourceFromMetadata");
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

    public linkForNext(): hal.HalLink {
        return this.client.GetLink("next");
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

    public linkForPrevious(): hal.HalLink {
        return this.client.GetLink("previous");
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

    public linkForFirst(): hal.HalLink {
        return this.client.GetLink("first");
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

    public linkForLast(): hal.HalLink {
        return this.client.GetLink("last");
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

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
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

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
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

    public update(data: ClientInput): Promise<void> {
        return this.client.LoadLinkWithData("Update", data).then(hal.makeVoid);
    }

    public canUpdate(): boolean {
        return this.client.HasLink("Update");
    }

    public linkForUpdate(): hal.HalLink {
        return this.client.GetLink("Update");
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

    public linkForDelete(): hal.HalLink {
        return this.client.GetLink("Delete");
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

    public linkForAddClientSecret(): hal.HalLink {
        return this.client.GetLink("addClientSecret");
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

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
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

    public list(data: PagedCollectionQuery): Promise<ClientEditModelCollectionViewResult> {
        return this.client.LoadLinkWithData("List", data)
               .then(r => {
                    return new ClientEditModelCollectionViewResult(r);
                });

    }

    public canList(): boolean {
        return this.client.HasLink("List");
    }

    public linkForList(): hal.HalLink {
        return this.client.GetLink("List");
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

    public add(data: ClientInput): Promise<void> {
        return this.client.LoadLinkWithData("Add", data).then(hal.makeVoid);
    }

    public canAdd(): boolean {
        return this.client.HasLink("Add");
    }

    public linkForAdd(): hal.HalLink {
        return this.client.GetLink("Add");
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

    public loadClientFromMetadata(data: MetadataLookup): Promise<ClientMetadataViewResult> {
        return this.client.LoadLinkWithData("loadClientFromMetadata", data)
               .then(r => {
                    return new ClientMetadataViewResult(r);
                });

    }

    public canLoadClientFromMetadata(): boolean {
        return this.client.HasLink("loadClientFromMetadata");
    }

    public linkForLoadClientFromMetadata(): hal.HalLink {
        return this.client.GetLink("loadClientFromMetadata");
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

    public linkForNext(): hal.HalLink {
        return this.client.GetLink("next");
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

    public linkForPrevious(): hal.HalLink {
        return this.client.GetLink("previous");
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

    public linkForFirst(): hal.HalLink {
        return this.client.GetLink("first");
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

    public linkForLast(): hal.HalLink {
        return this.client.GetLink("last");
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

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
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

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
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

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
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

    public listClients(data: PagedCollectionQuery): Promise<ClientEditModelCollectionViewResult> {
        return this.client.LoadLinkWithData("listClients", data)
               .then(r => {
                    return new ClientEditModelCollectionViewResult(r);
                });

    }

    public canListClients(): boolean {
        return this.client.HasLink("listClients");
    }

    public linkForListClients(): hal.HalLink {
        return this.client.GetLink("listClients");
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

    public addClient(data: ClientInput): Promise<void> {
        return this.client.LoadLinkWithData("addClient", data).then(hal.makeVoid);
    }

    public canAddClient(): boolean {
        return this.client.HasLink("addClient");
    }

    public linkForAddClient(): hal.HalLink {
        return this.client.GetLink("addClient");
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

    public updateClient(data: ClientInput): Promise<void> {
        return this.client.LoadLinkWithData("updateClient", data).then(hal.makeVoid);
    }

    public canUpdateClient(): boolean {
        return this.client.HasLink("updateClient");
    }

    public linkForUpdateClient(): hal.HalLink {
        return this.client.GetLink("updateClient");
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

    public linkForDeleteClient(): hal.HalLink {
        return this.client.GetLink("deleteClient");
    }

    public loadClientFromMetadata(data: MetadataLookup): Promise<ClientMetadataViewResult> {
        return this.client.LoadLinkWithData("loadClientFromMetadata", data)
               .then(r => {
                    return new ClientMetadataViewResult(r);
                });

    }

    public canLoadClientFromMetadata(): boolean {
        return this.client.HasLink("loadClientFromMetadata");
    }

    public linkForLoadClientFromMetadata(): hal.HalLink {
        return this.client.GetLink("loadClientFromMetadata");
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

    public loadFromClientCredentialsMetadata(data: MetadataLookup): Promise<ClientMetadataViewResult> {
        return this.client.LoadLinkWithData("LoadFromClientCredentialsMetadata", data)
               .then(r => {
                    return new ClientMetadataViewResult(r);
                });

    }

    public canLoadFromClientCredentialsMetadata(): boolean {
        return this.client.HasLink("LoadFromClientCredentialsMetadata");
    }

    public linkForLoadFromClientCredentialsMetadata(): hal.HalLink {
        return this.client.GetLink("LoadFromClientCredentialsMetadata");
    }

    public getLoadFromClientCredentialsMetadataDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("LoadFromClientCredentialsMetadata")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasLoadFromClientCredentialsMetadataDocs(): boolean {
        return this.client.HasLinkDoc("LoadFromClientCredentialsMetadata");
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

    public linkForAddClientSecret(): hal.HalLink {
        return this.client.GetLink("addClientSecret");
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

    public listApiResource(data: PagedCollectionQuery): Promise<ApiResourceEditModelCollectionResult> {
        return this.client.LoadLinkWithData("listApiResource", data)
               .then(r => {
                    return new ApiResourceEditModelCollectionResult(r);
                });

    }

    public canListApiResource(): boolean {
        return this.client.HasLink("listApiResource");
    }

    public linkForListApiResource(): hal.HalLink {
        return this.client.GetLink("listApiResource");
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

    public addApiResource(data: ApiResourceInput): Promise<void> {
        return this.client.LoadLinkWithData("addApiResource", data).then(hal.makeVoid);
    }

    public canAddApiResource(): boolean {
        return this.client.HasLink("addApiResource");
    }

    public linkForAddApiResource(): hal.HalLink {
        return this.client.GetLink("addApiResource");
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

    public updateApiResource(data: ApiResourceInput): Promise<void> {
        return this.client.LoadLinkWithData("updateApiResource", data).then(hal.makeVoid);
    }

    public canUpdateApiResource(): boolean {
        return this.client.HasLink("updateApiResource");
    }

    public linkForUpdateApiResource(): hal.HalLink {
        return this.client.GetLink("updateApiResource");
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

    public linkForDeleteApiResource(): hal.HalLink {
        return this.client.GetLink("deleteApiResource");
    }

    public loadApiResourceFromMetadata(data: MetadataLookup): Promise<ApiResourceMetadataViewResult> {
        return this.client.LoadLinkWithData("loadApiResourceFromMetadata", data)
               .then(r => {
                    return new ApiResourceMetadataViewResult(r);
                });

    }

    public canLoadApiResourceFromMetadata(): boolean {
        return this.client.HasLink("loadApiResourceFromMetadata");
    }

    public linkForLoadApiResourceFromMetadata(): hal.HalLink {
        return this.client.GetLink("loadApiResourceFromMetadata");
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

    public getUser(): Promise<RoleAssignmentsResult> {
        return this.client.LoadLink("GetUser")
               .then(r => {
                    return new RoleAssignmentsResult(r);
                });

    }

    public canGetUser(): boolean {
        return this.client.HasLink("GetUser");
    }

    public linkForGetUser(): hal.HalLink {
        return this.client.GetLink("GetUser");
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

    public listUsers(data: RolesQuery): Promise<UserCollectionResult> {
        return this.client.LoadLinkWithData("ListUsers", data)
               .then(r => {
                    return new UserCollectionResult(r);
                });

    }

    public canListUsers(): boolean {
        return this.client.HasLink("ListUsers");
    }

    public linkForListUsers(): hal.HalLink {
        return this.client.GetLink("ListUsers");
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
        return this.client.LoadLinkWithData("SetUser", data)
               .then(r => {
                    return new RoleAssignmentsResult(r);
                });

    }

    public canSetUser(): boolean {
        return this.client.HasLink("SetUser");
    }

    public linkForSetUser(): hal.HalLink {
        return this.client.GetLink("SetUser");
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

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
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

    public linkForNext(): hal.HalLink {
        return this.client.GetLink("next");
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

    public linkForPrevious(): hal.HalLink {
        return this.client.GetLink("previous");
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

    public linkForFirst(): hal.HalLink {
        return this.client.GetLink("first");
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

    public linkForLast(): hal.HalLink {
        return this.client.GetLink("last");
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
//     Generated using the NSwag toolchain v9.10.49.0 (Newtonsoft.Json v11.0.0.0) (http://NJsonSchema.org)
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

export interface ApiResourceInput {
    scopeName: string;
    displayName: string;
}

export interface ApiResourceEditModelCollection {
    offset?: number;
    limit?: number;
    total?: number;
}

/** Default implementation of ICollectionQuery. */
export interface PagedCollectionQuery {
    /** The number of pages (item number = Offset * Limit) into the collection to query. */
    offset?: number;
    /** The limit of the number of items to return. */
    limit?: number;
}

export interface MetadataLookup {
    targetUrl?: string;
}

export interface ApiResourceMetadataView {
    scopeName: string;
    displayName: string;
}

export interface ClientEditModel {
    id?: number;
    clientId: string;
    name: string;
    logoutUri?: string;
    logoutSessionRequired?: boolean;
    allowedGrantTypes?: string[];
    redirectUris?: string[];
    allowedScopes?: string[];
    enableLocalLogin?: boolean;
    accessTokenLifetime?: number;
    applicationGuid?: string;
}

export interface ClientInput {
    clientId: string;
    name: string;
    logoutUri?: string;
    logoutSessionRequired?: boolean;
    allowedGrantTypes?: string[];
    redirectUris?: string[];
    allowedScopes?: string[];
    enableLocalLogin?: boolean;
    accessTokenLifetime?: number;
}

export interface CreateSecretResult {
    secret?: string;
}

export interface ClientEditModelCollectionView {
    offset?: number;
    limit?: number;
    total?: number;
}

export interface ClientMetadataView {
    clientId: string;
    name: string;
    logoutUri?: string;
    logoutSessionRequired?: boolean;
    allowedGrantTypes?: string[];
    redirectUris?: string[];
    allowedScopes?: string[];
    enableLocalLogin?: boolean;
    accessTokenLifetime?: number;
}

export interface EntryPoints {
}

export interface RolesQuery {
    /** The guid for the user, this is used to look up the user. */
    userId?: string[];
    /** A name for the user. Used only as a reference, will be added to the result if the user is not found. */
    name?: string;
    /** The number of pages (item number = Offset * Limit) into the collection to query. */
    offset?: number;
    /** The limit of the number of items to return. */
    limit?: number;
}

export interface UserCollection {
    offset?: number;
    limit?: number;
    total?: number;
}
