import * as hal from 'hr.halcyon.EndpointClient';
import { Fetcher } from 'hr.fetcher';

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

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
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

    public getSetUserDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("SetUser", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasSetUserDocs(): boolean {
        return this.client.HasLinkDoc("SetUser");
    }

    public update(data: RoleAssignments): Promise<RoleAssignmentsResult> {
        return this.client.LoadLinkWithData("Update", data)
               .then(r => {
                    return new RoleAssignmentsResult(r);
                });

    }

    public canUpdate(): boolean {
        return this.client.HasLink("Update");
    }

    public linkForUpdate(): hal.HalLink {
        return this.client.GetLink("Update");
    }

    public getUpdateDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Update", query)
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

export class IdServerUserCollectionResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: IdServerUserCollection = undefined;
    public get data(): IdServerUserCollection {
        this.strongData = this.strongData || this.client.GetData<IdServerUserCollection>();
        return this.strongData;
    }

    private itemsStrong: IdServerUserViewResult[];
    public get items(): IdServerUserViewResult[] {
        if (this.itemsStrong === undefined) {
            var embeds = this.client.GetEmbed("values");
            var clients = embeds.GetAllClients();
            this.itemsStrong = [];
            for (var i = 0; i < clients.length; ++i) {
                this.itemsStrong.push(new IdServerUserViewResult(clients[i]));
            }
        }
        return this.itemsStrong;
    }

    public refresh(): Promise<IdServerUserCollectionResult> {
        return this.client.LoadLink("self")
               .then(r => {
                    return new IdServerUserCollectionResult(r);
                });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
    }

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public getGetDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Get", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasGetDocs(): boolean {
        return this.client.HasLinkDoc("Get");
    }

    public getListDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("List", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListDocs(): boolean {
        return this.client.HasLinkDoc("List");
    }

    public next(): Promise<IdServerUserCollectionResult> {
        return this.client.LoadLink("next")
               .then(r => {
                    return new IdServerUserCollectionResult(r);
                });

    }

    public canNext(): boolean {
        return this.client.HasLink("next");
    }

    public linkForNext(): hal.HalLink {
        return this.client.GetLink("next");
    }

    public getNextDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("next", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasNextDocs(): boolean {
        return this.client.HasLinkDoc("next");
    }

    public previous(): Promise<IdServerUserCollectionResult> {
        return this.client.LoadLink("previous")
               .then(r => {
                    return new IdServerUserCollectionResult(r);
                });

    }

    public canPrevious(): boolean {
        return this.client.HasLink("previous");
    }

    public linkForPrevious(): hal.HalLink {
        return this.client.GetLink("previous");
    }

    public getPreviousDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("previous", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasPreviousDocs(): boolean {
        return this.client.HasLinkDoc("previous");
    }

    public first(): Promise<IdServerUserCollectionResult> {
        return this.client.LoadLink("first")
               .then(r => {
                    return new IdServerUserCollectionResult(r);
                });

    }

    public canFirst(): boolean {
        return this.client.HasLink("first");
    }

    public linkForFirst(): hal.HalLink {
        return this.client.GetLink("first");
    }

    public getFirstDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("first", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasFirstDocs(): boolean {
        return this.client.HasLinkDoc("first");
    }

    public last(): Promise<IdServerUserCollectionResult> {
        return this.client.LoadLink("last")
               .then(r => {
                    return new IdServerUserCollectionResult(r);
                });

    }

    public canLast(): boolean {
        return this.client.HasLink("last");
    }

    public linkForLast(): hal.HalLink {
        return this.client.GetLink("last");
    }

    public getLastDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("last", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasLastDocs(): boolean {
        return this.client.HasLinkDoc("last");
    }
}

export class IdServerUserViewResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: IdServerUserView = undefined;
    public get data(): IdServerUserView {
        this.strongData = this.strongData || this.client.GetData<IdServerUserView>();
        return this.strongData;
    }

    public refresh(): Promise<IdServerUserViewResult> {
        return this.client.LoadLink("self")
               .then(r => {
                    return new IdServerUserViewResult(r);
                });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
    }

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
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

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
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

    public getGetApiResourceDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("getApiResource", query)
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

    public getUpdateDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Update", query)
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

    private itemsStrong: ApiResourceEditModelResult[];
    public get items(): ApiResourceEditModelResult[] {
        if (this.itemsStrong === undefined) {
            var embeds = this.client.GetEmbed("values");
            var clients = embeds.GetAllClients();
            this.itemsStrong = [];
            for (var i = 0; i < clients.length; ++i) {
                this.itemsStrong.push(new ApiResourceEditModelResult(clients[i]));
            }
        }
        return this.itemsStrong;
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

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public list(data: ApiResourceQuery): Promise<ApiResourceEditModelCollectionResult> {
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

    public getListDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("List", query)
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

    public getAddDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Add", query)
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

    public getLoadApiResourceFromMetadataDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("loadApiResourceFromMetadata", query)
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

    public getNextDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("next", query)
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

    public getPreviousDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("previous", query)
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

    public getFirstDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("first", query)
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

    public getLastDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("last", query)
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

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
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

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
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

    public getUpdateDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Update", query)
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

    public getAddClientSecretDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("addClientSecret", query)
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

    private itemsStrong: ClientEditModelResult[];
    public get items(): ClientEditModelResult[] {
        if (this.itemsStrong === undefined) {
            var embeds = this.client.GetEmbed("values");
            var clients = embeds.GetAllClients();
            this.itemsStrong = [];
            for (var i = 0; i < clients.length; ++i) {
                this.itemsStrong.push(new ClientEditModelResult(clients[i]));
            }
        }
        return this.itemsStrong;
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

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public list(data: ClientQuery): Promise<ClientEditModelCollectionViewResult> {
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

    public getListDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("List", query)
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

    public getAddDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Add", query)
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

    public getLoadClientFromMetadataDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("loadClientFromMetadata", query)
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

    public getNextDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("next", query)
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

    public getPreviousDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("previous", query)
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

    public getFirstDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("first", query)
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

    public getLastDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("last", query)
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

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
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

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }
}

export class EntryPointsInjector {
    private instancePromise: Promise<EntryPointsResult>;

    constructor(private url: string, private fetcher: Fetcher, private data?: any) {}

    public load(): Promise<EntryPointsResult> {
        if (!this.instancePromise) {
            if (this.data) {
                this.instancePromise = Promise.resolve(new EntryPointsResult(new hal.HalEndpointClient(this.data, this.fetcher)));
            }
            else {
                this.instancePromise = EntryPointsResult.Load(this.url, this.fetcher);
            }
        }
        return this.instancePromise;
    }
}

export class EntryPointsResult {
    private client: hal.HalEndpointClient;

    public static Load(url: string, fetcher: Fetcher): Promise<EntryPointsResult> {
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

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public listClients(data: ClientQuery): Promise<ClientEditModelCollectionViewResult> {
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

    public getListClientsDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("listClients", query)
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

    public getAddClientDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("addClient", query)
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

    public getUpdateClientDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("updateClient", query)
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

    public getLoadClientFromMetadataDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("loadClientFromMetadata", query)
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

    public getLoadFromClientCredentialsMetadataDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("LoadFromClientCredentialsMetadata", query)
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

    public getAddClientSecretDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("addClientSecret", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasAddClientSecretDocs(): boolean {
        return this.client.HasLinkDoc("addClientSecret");
    }

    public listApiResource(data: ApiResourceQuery): Promise<ApiResourceEditModelCollectionResult> {
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

    public getListApiResourceDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("listApiResource", query)
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

    public getAddApiResourceDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("addApiResource", query)
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

    public getUpdateApiResourceDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("updateApiResource", query)
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

    public getLoadApiResourceFromMetadataDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("loadApiResourceFromMetadata", query)
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

    public getGetUserDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("GetUser", query)
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

    public getListUsersDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("ListUsers", query)
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

    public getSetUserDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("SetUser", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasSetUserDocs(): boolean {
        return this.client.HasLinkDoc("SetUser");
    }

    public listIdServerUsers(data: IdServerUserQuery): Promise<IdServerUserCollectionResult> {
        return this.client.LoadLinkWithData("ListIdServerUsers", data)
               .then(r => {
                    return new IdServerUserCollectionResult(r);
                });

    }

    public canListIdServerUsers(): boolean {
        return this.client.HasLink("ListIdServerUsers");
    }

    public linkForListIdServerUsers(): hal.HalLink {
        return this.client.GetLink("ListIdServerUsers");
    }

    public getListIdServerUsersDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("ListIdServerUsers", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListIdServerUsersDocs(): boolean {
        return this.client.HasLinkDoc("ListIdServerUsers");
    }

    public listAppUsers(data: UserSearchQuery): Promise<UserSearchCollectionResult> {
        return this.client.LoadLinkWithData("ListAppUsers", data)
               .then(r => {
                    return new UserSearchCollectionResult(r);
                });

    }

    public canListAppUsers(): boolean {
        return this.client.HasLink("ListAppUsers");
    }

    public linkForListAppUsers(): hal.HalLink {
        return this.client.GetLink("ListAppUsers");
    }

    public getListAppUsersDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("ListAppUsers", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListAppUsersDocs(): boolean {
        return this.client.HasLinkDoc("ListAppUsers");
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

    private itemsStrong: RoleAssignmentsResult[];
    public get items(): RoleAssignmentsResult[] {
        if (this.itemsStrong === undefined) {
            var embeds = this.client.GetEmbed("values");
            var clients = embeds.GetAllClients();
            this.itemsStrong = [];
            for (var i = 0; i < clients.length; ++i) {
                this.itemsStrong.push(new RoleAssignmentsResult(clients[i]));
            }
        }
        return this.itemsStrong;
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

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public getGetDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Get", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasGetDocs(): boolean {
        return this.client.HasLinkDoc("Get");
    }

    public getListDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("List", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListDocs(): boolean {
        return this.client.HasLinkDoc("List");
    }

    public getUpdateDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Update", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasUpdateDocs(): boolean {
        return this.client.HasLinkDoc("Update");
    }

    public add(data: RoleAssignments): Promise<RoleAssignmentsResult> {
        return this.client.LoadLinkWithData("Add", data)
               .then(r => {
                    return new RoleAssignmentsResult(r);
                });

    }

    public canAdd(): boolean {
        return this.client.HasLink("Add");
    }

    public linkForAdd(): hal.HalLink {
        return this.client.GetLink("Add");
    }

    public getAddDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Add", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasAddDocs(): boolean {
        return this.client.HasLinkDoc("Add");
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

    public getNextDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("next", query)
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

    public getPreviousDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("previous", query)
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

    public getFirstDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("first", query)
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

    public getLastDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("last", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasLastDocs(): boolean {
        return this.client.HasLinkDoc("last");
    }
}

export class UserSearchResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: UserSearch = undefined;
    public get data(): UserSearch {
        this.strongData = this.strongData || this.client.GetData<UserSearch>();
        return this.strongData;
    }

    public refresh(): Promise<UserSearchResult> {
        return this.client.LoadLink("self")
               .then(r => {
                    return new UserSearchResult(r);
                });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
    }

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }
}

export class UserSearchCollectionResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: UserSearchCollection = undefined;
    public get data(): UserSearchCollection {
        this.strongData = this.strongData || this.client.GetData<UserSearchCollection>();
        return this.strongData;
    }

    private itemsStrong: UserSearchResult[];
    public get items(): UserSearchResult[] {
        if (this.itemsStrong === undefined) {
            var embeds = this.client.GetEmbed("values");
            var clients = embeds.GetAllClients();
            this.itemsStrong = [];
            for (var i = 0; i < clients.length; ++i) {
                this.itemsStrong.push(new UserSearchResult(clients[i]));
            }
        }
        return this.itemsStrong;
    }

    public refresh(): Promise<UserSearchCollectionResult> {
        return this.client.LoadLink("self")
               .then(r => {
                    return new UserSearchCollectionResult(r);
                });

    }

    public canRefresh(): boolean {
        return this.client.HasLink("self");
    }

    public linkForRefresh(): hal.HalLink {
        return this.client.GetLink("self");
    }

    public getRefreshDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("self", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasRefreshDocs(): boolean {
        return this.client.HasLinkDoc("self");
    }

    public getGetDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Get", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasGetDocs(): boolean {
        return this.client.HasLinkDoc("Get");
    }

    public getListDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("List", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListDocs(): boolean {
        return this.client.HasLinkDoc("List");
    }

    public next(): Promise<UserSearchCollectionResult> {
        return this.client.LoadLink("next")
               .then(r => {
                    return new UserSearchCollectionResult(r);
                });

    }

    public canNext(): boolean {
        return this.client.HasLink("next");
    }

    public linkForNext(): hal.HalLink {
        return this.client.GetLink("next");
    }

    public getNextDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("next", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasNextDocs(): boolean {
        return this.client.HasLinkDoc("next");
    }

    public previous(): Promise<UserSearchCollectionResult> {
        return this.client.LoadLink("previous")
               .then(r => {
                    return new UserSearchCollectionResult(r);
                });

    }

    public canPrevious(): boolean {
        return this.client.HasLink("previous");
    }

    public linkForPrevious(): hal.HalLink {
        return this.client.GetLink("previous");
    }

    public getPreviousDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("previous", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasPreviousDocs(): boolean {
        return this.client.HasLinkDoc("previous");
    }

    public first(): Promise<UserSearchCollectionResult> {
        return this.client.LoadLink("first")
               .then(r => {
                    return new UserSearchCollectionResult(r);
                });

    }

    public canFirst(): boolean {
        return this.client.HasLink("first");
    }

    public linkForFirst(): hal.HalLink {
        return this.client.GetLink("first");
    }

    public getFirstDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("first", query)
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasFirstDocs(): boolean {
        return this.client.HasLinkDoc("first");
    }

    public last(): Promise<UserSearchCollectionResult> {
        return this.client.LoadLink("last")
               .then(r => {
                    return new UserSearchCollectionResult(r);
                });

    }

    public canLast(): boolean {
        return this.client.HasLink("last");
    }

    public linkForLast(): hal.HalLink {
        return this.client.GetLink("last");
    }

    public getLastDocs(query?: HalEndpointDocQuery): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("last", query)
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
//     Generated using the NSwag toolchain v1.0.0.0 (Newtonsoft.Json v12.0.0.0) (http://NJsonSchema.org)
// </auto-generated>
//----------------------





export interface RoleAssignments {
    editClients?: boolean;
    editApiResources?: boolean;
    viewIdServerUsers?: boolean;
    userId?: string;
    name?: string;
    editRoles?: boolean;
    superAdmin?: boolean;
}

export interface IdServerUserCollection {
    userIds?: string[];
    userId?: string;
    total?: number;
    userName?: string;
    offset?: number;
    limit?: number;
}

export interface IdServerUserQuery {
    userId?: string;
    userIds?: string[];
    userName?: string;
    offset?: number;
    limit?: number;
}

export interface IdServerUserView {
    userId?: string;
    userName?: string;
    displayName?: string;
    givenName?: string;
    surname?: string;
    email?: string;
}

export interface ApiResourceEditModel {
    id?: number;
    scopeName?: string;
    displayName?: string;
}

export interface ApiResourceInput {
    scopeName?: string;
    displayName?: string;
}

export interface ApiResourceEditModelCollection {
    name?: string;
    id?: number;
    total?: number;
    offset?: number;
    limit?: number;
}

export interface ApiResourceQuery {
    id?: number;
    name?: string;
    offset?: number;
    limit?: number;
}

/** A model class for looking up metadata. */
export interface MetadataLookup {
    /** The url to lookup metadata from. */
    targetUrl?: string;
}

export interface ApiResourceMetadataView {
    scopeName?: string;
    displayName?: string;
}

export interface ClientEditModel {
    /** The id of the client. */
    id?: number;
    clientId?: string;
    name?: string;
    logoutUri?: string;
    logoutSessionRequired?: boolean;
    allowedGrantTypes?: string[];
    redirectUris?: string[];
    allowedScopes?: string[];
    enableLocalLogin?: boolean;
    accessTokenLifetime?: number;
    /** This Guid is used to identify the client when it is logging in as an application user.
That is the only time it is used, the integer id is the real id of the item when
editing. */
    applicationGuid?: string;
}

export interface ClientInput {
    clientId?: string;
    name?: string;
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
    clientId?: string;
    id?: number;
    total?: number;
    grantTypes?: string[];
    hasMissingOrDefaultSecret?: boolean;
    offset?: number;
    limit?: number;
}

export interface ClientQuery {
    id?: number;
    clientId?: string;
    grantTypes?: string[];
    hasMissingOrDefaultSecret?: boolean;
    offset?: number;
    limit?: number;
}

export interface ClientMetadataView {
    clientId?: string;
    name?: string;
    logoutUri?: string;
    logoutSessionRequired?: boolean;
    allowedGrantTypes?: string[];
    redirectUris?: string[];
    allowedScopes?: string[];
    enableLocalLogin?: boolean;
    accessTokenLifetime?: number;
}

/** This class returns the entry points to the system using hal links. */
export interface EntryPoints {
}

export interface RolesQuery {
    userId?: string[];
    name?: string;
    editRoles?: boolean;
    superAdmin?: boolean;
    offset?: number;
    limit?: number;
}

export interface UserCollection {
    name?: string;
    userId?: string[];
    total?: number;
    editRoles?: boolean;
    superAdmin?: boolean;
    offset?: number;
    limit?: number;
}

export interface UserSearchQuery {
    userId?: string;
    userName?: string;
    offset?: number;
    limit?: number;
}

export interface UserSearchCollection {
    userName?: string;
    userId?: string;
    total?: number;
    offset?: number;
    limit?: number;
}

export interface UserSearch {
    userId?: string;
    userName?: string;
}

export interface HalEndpointDocQuery {
    includeRequest?: boolean;
    includeResponse?: boolean;
}
