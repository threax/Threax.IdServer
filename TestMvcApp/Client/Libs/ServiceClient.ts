import * as hal from 'hr.halcyon.EndpointClient';

export class EntryPointInjector {
    private url: string;
    private fetcher: hal.Fetcher;
    private instance: EntryPointResult;

    constructor(url: string, fetcher: hal.Fetcher) {
        this.url = url;
        this.fetcher = fetcher;
    }

    public load(): Promise<EntryPointResult> {
        if (!this.instance) {
            return EntryPointResult.Load(this.url, this.fetcher).then((r) => {
                this.instance = r;
                return r;
            });
        }

        return Promise.resolve(this.instance);
    }
}

export class EntryPointResult {
    private client: hal.HalEndpointClient;

    public static Load(url: string, fetcher: hal.Fetcher): Promise<EntryPointResult> {
        return hal.HalEndpointClient.Load({
            href: url,
            method: "GET"
        }, fetcher)
            .then(c => {
                return new EntryPointResult(c);
            });
    }

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: EntryPoint = undefined;
    public get data(): EntryPoint {
        this.strongData = this.strongData || this.client.GetData<EntryPoint>();
        return this.strongData;
    }

    public refresh(): Promise<EntryPointResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new EntryPointResult(r);
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

    public listValues(query: PagedCollectionQuery): Promise<ValueCollectionResult> {
        return this.client.LoadLinkWithQuery("ListValues", query)
            .then(r => {
                return new ValueCollectionResult(r);
            });

    }

    public canListValues(): boolean {
        return this.client.HasLink("ListValues");
    }

    public getListValuesDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("ListValues")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListValuesDocs(): boolean {
        return this.client.HasLinkDoc("ListValues");
    }

    public addValue(data: ValueInput): Promise<ValueResult> {
        return this.client.LoadLinkWithBody("AddValue", data)
            .then(r => {
                return new ValueResult(r);
            });

    }

    public canAddValue(): boolean {
        return this.client.HasLink("AddValue");
    }

    public getAddValueDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("AddValue")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasAddValueDocs(): boolean {
        return this.client.HasLinkDoc("AddValue");
    }

    public listHorribleBeasts(query: PagedCollectionQuery): Promise<HorribleBeastCollectionResult> {
        return this.client.LoadLinkWithQuery("ListHorribleBeasts", query)
            .then(r => {
                return new HorribleBeastCollectionResult(r);
            });

    }

    public canListHorribleBeasts(): boolean {
        return this.client.HasLink("ListHorribleBeasts");
    }

    public getListHorribleBeastsDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("ListHorribleBeasts")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasListHorribleBeastsDocs(): boolean {
        return this.client.HasLinkDoc("ListHorribleBeasts");
    }

    public addHorribleBeast(data: HorribleBeastInput): Promise<HorribleBeastResult> {
        return this.client.LoadLinkWithBody("AddHorribleBeast", data)
            .then(r => {
                return new HorribleBeastResult(r);
            });

    }

    public canAddHorribleBeast(): boolean {
        return this.client.HasLink("AddHorribleBeast");
    }

    public getAddHorribleBeastDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("AddHorribleBeast")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasAddHorribleBeastDocs(): boolean {
        return this.client.HasLinkDoc("AddHorribleBeast");
    }
}

export class HorribleBeastResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: HorribleBeast = undefined;
    public get data(): HorribleBeast {
        this.strongData = this.strongData || this.client.GetData<HorribleBeast>();
        return this.strongData;
    }

    public refresh(): Promise<ValueResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new ValueResult(r);
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

    public update(data: ValueInput): Promise<ValueResult> {
        return this.client.LoadLinkWithBody("Update", data)
            .then(r => {
                return new ValueResult(r);
            });

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

export class HorribleBeastCollectionResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: HorribleBeastCollection = undefined;
    public get data(): HorribleBeastCollection {
        this.strongData = this.strongData || this.client.GetData<HorribleBeastCollection>();
        return this.strongData;
    }

    private strongItems: HorribleBeastResult[];
    public get items(): HorribleBeastResult[] {
        if (this.strongItems === undefined) {
            var embeds = this.client.GetEmbed("values");
            var clients = embeds.GetAllClients();
            this.strongItems = [];
            for (var i = 0; i < clients.length; ++i) {
                this.strongItems.push(new HorribleBeastResult(clients[i]));
            }
        }
        return this.strongItems;
    }

    public refresh(): Promise<HorribleBeastCollectionResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new HorribleBeastCollectionResult(r);
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

    public getGetDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Get")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasGetDocs(): boolean {
        return this.client.HasLinkDoc("Get");
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

    public add(data: HorribleBeastInput): Promise<HorribleBeastResult> {
        return this.client.LoadLinkWithBody("Add", data)
            .then(r => {
                return new HorribleBeastResult(r);
            });

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

    public next(): Promise<HorribleBeastCollectionResult> {
        return this.client.LoadLink("next")
            .then(r => {
                return new HorribleBeastCollectionResult(r);
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

    public previous(): Promise<HorribleBeastCollectionResult> {
        return this.client.LoadLink("previous")
            .then(r => {
                return new HorribleBeastCollectionResult(r);
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

    public first(): Promise<HorribleBeastCollectionResult> {
        return this.client.LoadLink("first")
            .then(r => {
                return new HorribleBeastCollectionResult(r);
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

    public last(): Promise<HorribleBeastCollectionResult> {
        return this.client.LoadLink("last")
            .then(r => {
                return new HorribleBeastCollectionResult(r);
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

export class ValueResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: Value = undefined;
    public get data(): Value {
        this.strongData = this.strongData || this.client.GetData<Value>();
        return this.strongData;
    }

    public refresh(): Promise<ValueResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new ValueResult(r);
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

    public update(data: ValueInput): Promise<ValueResult> {
        return this.client.LoadLinkWithBody("Update", data)
            .then(r => {
                return new ValueResult(r);
            });

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

export class ValueCollectionResult {
    private client: hal.HalEndpointClient;

    constructor(client: hal.HalEndpointClient) {
        this.client = client;
    }

    private strongData: ValueCollection = undefined;
    public get data(): ValueCollection {
        this.strongData = this.strongData || this.client.GetData<ValueCollection>();
        return this.strongData;
    }

    private strongItems: ValueResult[];
    public get items(): ValueResult[] {
        if (this.strongItems === undefined) {
            var embeds = this.client.GetEmbed("values");
            var clients = embeds.GetAllClients();
            this.strongItems = [];
            for (var i = 0; i < clients.length; ++i) {
                this.strongItems.push(new ValueResult(clients[i]));
            }
        }
        return this.strongItems;
    }

    public refresh(): Promise<ValueCollectionResult> {
        return this.client.LoadLink("self")
            .then(r => {
                return new ValueCollectionResult(r);
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

    public getGetDocs(): Promise<hal.HalEndpointDoc> {
        return this.client.LoadLinkDoc("Get")
            .then(r => {
                return r.GetData<hal.HalEndpointDoc>();
            });
    }

    public hasGetDocs(): boolean {
        return this.client.HasLinkDoc("Get");
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

    public add(data: ValueInput): Promise<ValueResult> {
        return this.client.LoadLinkWithBody("Add", data)
            .then(r => {
                return new ValueResult(r);
            });

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

    public next(): Promise<ValueCollectionResult> {
        return this.client.LoadLink("next")
            .then(r => {
                return new ValueCollectionResult(r);
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

    public previous(): Promise<ValueCollectionResult> {
        return this.client.LoadLink("previous")
            .then(r => {
                return new ValueCollectionResult(r);
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

    public first(): Promise<ValueCollectionResult> {
        return this.client.LoadLink("first")
            .then(r => {
                return new ValueCollectionResult(r);
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

    public last(): Promise<ValueCollectionResult> {
        return this.client.LoadLink("last")
            .then(r => {
                return new ValueCollectionResult(r);
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
//     Generated using the NSwag toolchain v9.4.3.0 (http://NJsonSchema.org)
// </auto-generated>
//----------------------





export interface EntryPoint {
}

/** Default implementation of ICollectionQuery. */
export interface PagedCollectionQuery {
    /** The number of pages (item number = Offset * Limit) into the collection to query. */
    offset?: number;
    /** The limit of the number of items to return. */
    limit?: number;
}

export interface ValueCollection {
    offset?: number;
    limit?: number;
    total?: number;
}

export interface ValueInput {
    name: string;
}

export interface Value {
    valueId?: string;
    name?: string;
}

export interface HorribleBeastCollection {
    offset?: number;
    limit?: number;
    total?: number;
}

export interface HorribleBeastInput {
    name: string;
    numLegs?: number;
    numEyes?: number;
}

export interface HorribleBeast {
    horribleBeastId?: string;
    name?: string;
    numLegs?: number;
    numEyes?: number;
}

