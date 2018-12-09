using Threax.AspNetCore.Halcyon.Client;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Net.Http;
using System.Linq;

namespace Threax.IdServer.Client {

public class RoleAssignmentsResult 
{
    private HalEndpointClient client;

    public RoleAssignmentsResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private RoleAssignments strongData = default(RoleAssignments);
    public RoleAssignments Data 
    {
        get
        {
            if(this.strongData == default(RoleAssignments))
            {
                this.strongData = this.client.GetData<RoleAssignments>();  
            }
            return this.strongData;
        }
    }

    public async Task<RoleAssignmentsResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new RoleAssignmentsResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }

    public async Task<RoleAssignmentsResult> SetUser(RoleAssignments data) 
    {
        var result = await this.client.LoadLinkWithData("SetUser", data);
        return new RoleAssignmentsResult(result);

    }

    public bool CanSetUser 
    {
        get 
        {
            return this.client.HasLink("SetUser");
        }
    }

    public HalLink LinkForSetUser 
    {
        get 
        {
            return this.client.GetLink("SetUser");
        }
    }

    public async Task<HalEndpointDoc> GetSetUserDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("SetUser", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasSetUserDocs() {
        return this.client.HasLinkDoc("SetUser");
    }

    public async Task<RoleAssignmentsResult> Update(RoleAssignments data) 
    {
        var result = await this.client.LoadLinkWithData("Update", data);
        return new RoleAssignmentsResult(result);

    }

    public bool CanUpdate 
    {
        get 
        {
            return this.client.HasLink("Update");
        }
    }

    public HalLink LinkForUpdate 
    {
        get 
        {
            return this.client.GetLink("Update");
        }
    }

    public async Task<HalEndpointDoc> GetUpdateDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("Update", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasUpdateDocs() {
        return this.client.HasLinkDoc("Update");
    }

    public async Task Delete() 
    {
        var result = await this.client.LoadLink("Delete");
    }

    public bool CanDelete 
    {
        get 
        {
            return this.client.HasLink("Delete");
        }
    }

    public HalLink LinkForDelete 
    {
        get 
        {
            return this.client.GetLink("Delete");
        }
    }
}

public class IdServerUserCollectionResult 
{
    private HalEndpointClient client;

    public IdServerUserCollectionResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private IdServerUserCollection strongData = default(IdServerUserCollection);
    public IdServerUserCollection Data 
    {
        get
        {
            if(this.strongData == default(IdServerUserCollection))
            {
                this.strongData = this.client.GetData<IdServerUserCollection>();  
            }
            return this.strongData;
        }
    }

    private List<IdServerUserViewResult> strongItems = null;
    public List<IdServerUserViewResult> Items
    {
        get
        {
            if (this.strongItems == null) 
            {
                var embeds = this.client.GetEmbed("values");
                var clients = embeds.GetAllClients();
                this.strongItems = new List<IdServerUserViewResult>(clients.Select(i => new IdServerUserViewResult(i)));
            }
            return this.strongItems;
        }
    }

    public async Task<IdServerUserCollectionResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new IdServerUserCollectionResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }

    public async Task<HalEndpointDoc> GetGetDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("Get", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasGetDocs() {
        return this.client.HasLinkDoc("Get");
    }

    public async Task<HalEndpointDoc> GetListDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("List", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasListDocs() {
        return this.client.HasLinkDoc("List");
    }

    public async Task<IdServerUserCollectionResult> Next() 
    {
        var result = await this.client.LoadLink("next");
        return new IdServerUserCollectionResult(result);

    }

    public bool CanNext 
    {
        get 
        {
            return this.client.HasLink("next");
        }
    }

    public HalLink LinkForNext 
    {
        get 
        {
            return this.client.GetLink("next");
        }
    }

    public async Task<HalEndpointDoc> GetNextDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("next", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasNextDocs() {
        return this.client.HasLinkDoc("next");
    }

    public async Task<IdServerUserCollectionResult> Previous() 
    {
        var result = await this.client.LoadLink("previous");
        return new IdServerUserCollectionResult(result);

    }

    public bool CanPrevious 
    {
        get 
        {
            return this.client.HasLink("previous");
        }
    }

    public HalLink LinkForPrevious 
    {
        get 
        {
            return this.client.GetLink("previous");
        }
    }

    public async Task<HalEndpointDoc> GetPreviousDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("previous", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasPreviousDocs() {
        return this.client.HasLinkDoc("previous");
    }

    public async Task<IdServerUserCollectionResult> First() 
    {
        var result = await this.client.LoadLink("first");
        return new IdServerUserCollectionResult(result);

    }

    public bool CanFirst 
    {
        get 
        {
            return this.client.HasLink("first");
        }
    }

    public HalLink LinkForFirst 
    {
        get 
        {
            return this.client.GetLink("first");
        }
    }

    public async Task<HalEndpointDoc> GetFirstDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("first", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasFirstDocs() {
        return this.client.HasLinkDoc("first");
    }

    public async Task<IdServerUserCollectionResult> Last() 
    {
        var result = await this.client.LoadLink("last");
        return new IdServerUserCollectionResult(result);

    }

    public bool CanLast 
    {
        get 
        {
            return this.client.HasLink("last");
        }
    }

    public HalLink LinkForLast 
    {
        get 
        {
            return this.client.GetLink("last");
        }
    }

    public async Task<HalEndpointDoc> GetLastDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("last", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasLastDocs() {
        return this.client.HasLinkDoc("last");
    }
}

public class IdServerUserViewResult 
{
    private HalEndpointClient client;

    public IdServerUserViewResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private IdServerUserView strongData = default(IdServerUserView);
    public IdServerUserView Data 
    {
        get
        {
            if(this.strongData == default(IdServerUserView))
            {
                this.strongData = this.client.GetData<IdServerUserView>();  
            }
            return this.strongData;
        }
    }

    public async Task<IdServerUserViewResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new IdServerUserViewResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }
}

public class ApiResourceEditModelResult 
{
    private HalEndpointClient client;

    public ApiResourceEditModelResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private ApiResourceEditModel strongData = default(ApiResourceEditModel);
    public ApiResourceEditModel Data 
    {
        get
        {
            if(this.strongData == default(ApiResourceEditModel))
            {
                this.strongData = this.client.GetData<ApiResourceEditModel>();  
            }
            return this.strongData;
        }
    }

    public async Task<ApiResourceEditModelResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new ApiResourceEditModelResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }

    public async Task<ApiResourceEditModelResult> GetApiResource() 
    {
        var result = await this.client.LoadLink("getApiResource");
        return new ApiResourceEditModelResult(result);

    }

    public bool CanGetApiResource 
    {
        get 
        {
            return this.client.HasLink("getApiResource");
        }
    }

    public HalLink LinkForGetApiResource 
    {
        get 
        {
            return this.client.GetLink("getApiResource");
        }
    }

    public async Task<HalEndpointDoc> GetGetApiResourceDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("getApiResource", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasGetApiResourceDocs() {
        return this.client.HasLinkDoc("getApiResource");
    }

    public async Task Update(ApiResourceInput data) 
    {
        var result = await this.client.LoadLinkWithData("Update", data);
    }

    public bool CanUpdate 
    {
        get 
        {
            return this.client.HasLink("Update");
        }
    }

    public HalLink LinkForUpdate 
    {
        get 
        {
            return this.client.GetLink("Update");
        }
    }

    public async Task<HalEndpointDoc> GetUpdateDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("Update", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasUpdateDocs() {
        return this.client.HasLinkDoc("Update");
    }

    public async Task Delete() 
    {
        var result = await this.client.LoadLink("Delete");
    }

    public bool CanDelete 
    {
        get 
        {
            return this.client.HasLink("Delete");
        }
    }

    public HalLink LinkForDelete 
    {
        get 
        {
            return this.client.GetLink("Delete");
        }
    }
}

public class ApiResourceEditModelCollectionResult 
{
    private HalEndpointClient client;

    public ApiResourceEditModelCollectionResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private ApiResourceEditModelCollection strongData = default(ApiResourceEditModelCollection);
    public ApiResourceEditModelCollection Data 
    {
        get
        {
            if(this.strongData == default(ApiResourceEditModelCollection))
            {
                this.strongData = this.client.GetData<ApiResourceEditModelCollection>();  
            }
            return this.strongData;
        }
    }

    private List<ApiResourceEditModelResult> strongItems = null;
    public List<ApiResourceEditModelResult> Items
    {
        get
        {
            if (this.strongItems == null) 
            {
                var embeds = this.client.GetEmbed("values");
                var clients = embeds.GetAllClients();
                this.strongItems = new List<ApiResourceEditModelResult>(clients.Select(i => new ApiResourceEditModelResult(i)));
            }
            return this.strongItems;
        }
    }

    public async Task<ApiResourceEditModelCollectionResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new ApiResourceEditModelCollectionResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }

    public async Task<ApiResourceEditModelCollectionResult> List(PagedCollectionQuery data) 
    {
        var result = await this.client.LoadLinkWithData("List", data);
        return new ApiResourceEditModelCollectionResult(result);

    }

    public bool CanList 
    {
        get 
        {
            return this.client.HasLink("List");
        }
    }

    public HalLink LinkForList 
    {
        get 
        {
            return this.client.GetLink("List");
        }
    }

    public async Task<HalEndpointDoc> GetListDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("List", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasListDocs() {
        return this.client.HasLinkDoc("List");
    }

    public async Task Add(ApiResourceInput data) 
    {
        var result = await this.client.LoadLinkWithData("Add", data);
    }

    public bool CanAdd 
    {
        get 
        {
            return this.client.HasLink("Add");
        }
    }

    public HalLink LinkForAdd 
    {
        get 
        {
            return this.client.GetLink("Add");
        }
    }

    public async Task<HalEndpointDoc> GetAddDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("Add", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasAddDocs() {
        return this.client.HasLinkDoc("Add");
    }

    public async Task<ApiResourceMetadataViewResult> LoadApiResourceFromMetadata(MetadataLookup data) 
    {
        var result = await this.client.LoadLinkWithData("loadApiResourceFromMetadata", data);
        return new ApiResourceMetadataViewResult(result);

    }

    public bool CanLoadApiResourceFromMetadata 
    {
        get 
        {
            return this.client.HasLink("loadApiResourceFromMetadata");
        }
    }

    public HalLink LinkForLoadApiResourceFromMetadata 
    {
        get 
        {
            return this.client.GetLink("loadApiResourceFromMetadata");
        }
    }

    public async Task<HalEndpointDoc> GetLoadApiResourceFromMetadataDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("loadApiResourceFromMetadata", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasLoadApiResourceFromMetadataDocs() {
        return this.client.HasLinkDoc("loadApiResourceFromMetadata");
    }

    public async Task<ApiResourceEditModelCollectionResult> Next() 
    {
        var result = await this.client.LoadLink("next");
        return new ApiResourceEditModelCollectionResult(result);

    }

    public bool CanNext 
    {
        get 
        {
            return this.client.HasLink("next");
        }
    }

    public HalLink LinkForNext 
    {
        get 
        {
            return this.client.GetLink("next");
        }
    }

    public async Task<HalEndpointDoc> GetNextDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("next", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasNextDocs() {
        return this.client.HasLinkDoc("next");
    }

    public async Task<ApiResourceEditModelCollectionResult> Previous() 
    {
        var result = await this.client.LoadLink("previous");
        return new ApiResourceEditModelCollectionResult(result);

    }

    public bool CanPrevious 
    {
        get 
        {
            return this.client.HasLink("previous");
        }
    }

    public HalLink LinkForPrevious 
    {
        get 
        {
            return this.client.GetLink("previous");
        }
    }

    public async Task<HalEndpointDoc> GetPreviousDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("previous", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasPreviousDocs() {
        return this.client.HasLinkDoc("previous");
    }

    public async Task<ApiResourceEditModelCollectionResult> First() 
    {
        var result = await this.client.LoadLink("first");
        return new ApiResourceEditModelCollectionResult(result);

    }

    public bool CanFirst 
    {
        get 
        {
            return this.client.HasLink("first");
        }
    }

    public HalLink LinkForFirst 
    {
        get 
        {
            return this.client.GetLink("first");
        }
    }

    public async Task<HalEndpointDoc> GetFirstDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("first", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasFirstDocs() {
        return this.client.HasLinkDoc("first");
    }

    public async Task<ApiResourceEditModelCollectionResult> Last() 
    {
        var result = await this.client.LoadLink("last");
        return new ApiResourceEditModelCollectionResult(result);

    }

    public bool CanLast 
    {
        get 
        {
            return this.client.HasLink("last");
        }
    }

    public HalLink LinkForLast 
    {
        get 
        {
            return this.client.GetLink("last");
        }
    }

    public async Task<HalEndpointDoc> GetLastDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("last", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasLastDocs() {
        return this.client.HasLinkDoc("last");
    }
}

public class ApiResourceMetadataViewResult 
{
    private HalEndpointClient client;

    public ApiResourceMetadataViewResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private ApiResourceMetadataView strongData = default(ApiResourceMetadataView);
    public ApiResourceMetadataView Data 
    {
        get
        {
            if(this.strongData == default(ApiResourceMetadataView))
            {
                this.strongData = this.client.GetData<ApiResourceMetadataView>();  
            }
            return this.strongData;
        }
    }

    public async Task<ApiResourceMetadataViewResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new ApiResourceMetadataViewResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }
}

public class ClientEditModelResult 
{
    private HalEndpointClient client;

    public ClientEditModelResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private ClientEditModel strongData = default(ClientEditModel);
    public ClientEditModel Data 
    {
        get
        {
            if(this.strongData == default(ClientEditModel))
            {
                this.strongData = this.client.GetData<ClientEditModel>();  
            }
            return this.strongData;
        }
    }

    public async Task<ClientEditModelResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new ClientEditModelResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }

    public async Task Update(ClientInput data) 
    {
        var result = await this.client.LoadLinkWithData("Update", data);
    }

    public bool CanUpdate 
    {
        get 
        {
            return this.client.HasLink("Update");
        }
    }

    public HalLink LinkForUpdate 
    {
        get 
        {
            return this.client.GetLink("Update");
        }
    }

    public async Task<HalEndpointDoc> GetUpdateDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("Update", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasUpdateDocs() {
        return this.client.HasLinkDoc("Update");
    }

    public async Task Delete() 
    {
        var result = await this.client.LoadLink("Delete");
    }

    public bool CanDelete 
    {
        get 
        {
            return this.client.HasLink("Delete");
        }
    }

    public HalLink LinkForDelete 
    {
        get 
        {
            return this.client.GetLink("Delete");
        }
    }

    public async Task<CreateSecretResultResult> AddClientSecret() 
    {
        var result = await this.client.LoadLink("addClientSecret");
        return new CreateSecretResultResult(result);

    }

    public bool CanAddClientSecret 
    {
        get 
        {
            return this.client.HasLink("addClientSecret");
        }
    }

    public HalLink LinkForAddClientSecret 
    {
        get 
        {
            return this.client.GetLink("addClientSecret");
        }
    }

    public async Task<HalEndpointDoc> GetAddClientSecretDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("addClientSecret", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasAddClientSecretDocs() {
        return this.client.HasLinkDoc("addClientSecret");
    }
}

public class ClientEditModelCollectionViewResult 
{
    private HalEndpointClient client;

    public ClientEditModelCollectionViewResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private ClientEditModelCollectionView strongData = default(ClientEditModelCollectionView);
    public ClientEditModelCollectionView Data 
    {
        get
        {
            if(this.strongData == default(ClientEditModelCollectionView))
            {
                this.strongData = this.client.GetData<ClientEditModelCollectionView>();  
            }
            return this.strongData;
        }
    }

    private List<ClientEditModelResult> strongItems = null;
    public List<ClientEditModelResult> Items
    {
        get
        {
            if (this.strongItems == null) 
            {
                var embeds = this.client.GetEmbed("values");
                var clients = embeds.GetAllClients();
                this.strongItems = new List<ClientEditModelResult>(clients.Select(i => new ClientEditModelResult(i)));
            }
            return this.strongItems;
        }
    }

    public async Task<ClientEditModelCollectionViewResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new ClientEditModelCollectionViewResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }

    public async Task<ClientEditModelCollectionViewResult> List(PagedCollectionQuery data) 
    {
        var result = await this.client.LoadLinkWithData("List", data);
        return new ClientEditModelCollectionViewResult(result);

    }

    public bool CanList 
    {
        get 
        {
            return this.client.HasLink("List");
        }
    }

    public HalLink LinkForList 
    {
        get 
        {
            return this.client.GetLink("List");
        }
    }

    public async Task<HalEndpointDoc> GetListDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("List", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasListDocs() {
        return this.client.HasLinkDoc("List");
    }

    public async Task Add(ClientInput data) 
    {
        var result = await this.client.LoadLinkWithData("Add", data);
    }

    public bool CanAdd 
    {
        get 
        {
            return this.client.HasLink("Add");
        }
    }

    public HalLink LinkForAdd 
    {
        get 
        {
            return this.client.GetLink("Add");
        }
    }

    public async Task<HalEndpointDoc> GetAddDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("Add", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasAddDocs() {
        return this.client.HasLinkDoc("Add");
    }

    public async Task<ClientMetadataViewResult> LoadClientFromMetadata(MetadataLookup data) 
    {
        var result = await this.client.LoadLinkWithData("loadClientFromMetadata", data);
        return new ClientMetadataViewResult(result);

    }

    public bool CanLoadClientFromMetadata 
    {
        get 
        {
            return this.client.HasLink("loadClientFromMetadata");
        }
    }

    public HalLink LinkForLoadClientFromMetadata 
    {
        get 
        {
            return this.client.GetLink("loadClientFromMetadata");
        }
    }

    public async Task<HalEndpointDoc> GetLoadClientFromMetadataDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("loadClientFromMetadata", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasLoadClientFromMetadataDocs() {
        return this.client.HasLinkDoc("loadClientFromMetadata");
    }

    public async Task<ClientEditModelCollectionViewResult> Next() 
    {
        var result = await this.client.LoadLink("next");
        return new ClientEditModelCollectionViewResult(result);

    }

    public bool CanNext 
    {
        get 
        {
            return this.client.HasLink("next");
        }
    }

    public HalLink LinkForNext 
    {
        get 
        {
            return this.client.GetLink("next");
        }
    }

    public async Task<HalEndpointDoc> GetNextDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("next", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasNextDocs() {
        return this.client.HasLinkDoc("next");
    }

    public async Task<ClientEditModelCollectionViewResult> Previous() 
    {
        var result = await this.client.LoadLink("previous");
        return new ClientEditModelCollectionViewResult(result);

    }

    public bool CanPrevious 
    {
        get 
        {
            return this.client.HasLink("previous");
        }
    }

    public HalLink LinkForPrevious 
    {
        get 
        {
            return this.client.GetLink("previous");
        }
    }

    public async Task<HalEndpointDoc> GetPreviousDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("previous", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasPreviousDocs() {
        return this.client.HasLinkDoc("previous");
    }

    public async Task<ClientEditModelCollectionViewResult> First() 
    {
        var result = await this.client.LoadLink("first");
        return new ClientEditModelCollectionViewResult(result);

    }

    public bool CanFirst 
    {
        get 
        {
            return this.client.HasLink("first");
        }
    }

    public HalLink LinkForFirst 
    {
        get 
        {
            return this.client.GetLink("first");
        }
    }

    public async Task<HalEndpointDoc> GetFirstDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("first", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasFirstDocs() {
        return this.client.HasLinkDoc("first");
    }

    public async Task<ClientEditModelCollectionViewResult> Last() 
    {
        var result = await this.client.LoadLink("last");
        return new ClientEditModelCollectionViewResult(result);

    }

    public bool CanLast 
    {
        get 
        {
            return this.client.HasLink("last");
        }
    }

    public HalLink LinkForLast 
    {
        get 
        {
            return this.client.GetLink("last");
        }
    }

    public async Task<HalEndpointDoc> GetLastDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("last", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasLastDocs() {
        return this.client.HasLinkDoc("last");
    }
}

public class ClientMetadataViewResult 
{
    private HalEndpointClient client;

    public ClientMetadataViewResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private ClientMetadataView strongData = default(ClientMetadataView);
    public ClientMetadataView Data 
    {
        get
        {
            if(this.strongData == default(ClientMetadataView))
            {
                this.strongData = this.client.GetData<ClientMetadataView>();  
            }
            return this.strongData;
        }
    }

    public async Task<ClientMetadataViewResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new ClientMetadataViewResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }
}

public class CreateSecretResultResult 
{
    private HalEndpointClient client;

    public CreateSecretResultResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private CreateSecretResult strongData = default(CreateSecretResult);
    public CreateSecretResult Data 
    {
        get
        {
            if(this.strongData == default(CreateSecretResult))
            {
                this.strongData = this.client.GetData<CreateSecretResult>();  
            }
            return this.strongData;
        }
    }

    public async Task<CreateSecretResultResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new CreateSecretResultResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }
}

public class EntryPointsInjector 
{
    private string url;
    private IHttpClientFactory fetcher;
    private Task<EntryPointsResult> instanceTask = default(Task<EntryPointsResult>);

    public EntryPointsInjector(string url, IHttpClientFactory fetcher)
    {
        this.url = url;
        this.fetcher = fetcher;
    }

    public Task<EntryPointsResult> Load()
    {
        if (this.instanceTask == default(Task<EntryPointsResult>))
        {
            this.instanceTask = EntryPointsResult.Load(this.url, this.fetcher);
        }
        return this.instanceTask;
    }
}

public class EntryPointsResult 
{
    private HalEndpointClient client;

    public static async Task<EntryPointsResult> Load(string url, IHttpClientFactory fetcher)
    {
        var result = await HalEndpointClient.Load(new HalLink(url, "GET"), fetcher);
        return new EntryPointsResult(result);
    }

    public EntryPointsResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private EntryPoints strongData = default(EntryPoints);
    public EntryPoints Data 
    {
        get
        {
            if(this.strongData == default(EntryPoints))
            {
                this.strongData = this.client.GetData<EntryPoints>();  
            }
            return this.strongData;
        }
    }

    public async Task<EntryPointsResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new EntryPointsResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }

    public async Task<ClientEditModelCollectionViewResult> ListClients(PagedCollectionQuery data) 
    {
        var result = await this.client.LoadLinkWithData("listClients", data);
        return new ClientEditModelCollectionViewResult(result);

    }

    public bool CanListClients 
    {
        get 
        {
            return this.client.HasLink("listClients");
        }
    }

    public HalLink LinkForListClients 
    {
        get 
        {
            return this.client.GetLink("listClients");
        }
    }

    public async Task<HalEndpointDoc> GetListClientsDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("listClients", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasListClientsDocs() {
        return this.client.HasLinkDoc("listClients");
    }

    public async Task AddClient(ClientInput data) 
    {
        var result = await this.client.LoadLinkWithData("addClient", data);
    }

    public bool CanAddClient 
    {
        get 
        {
            return this.client.HasLink("addClient");
        }
    }

    public HalLink LinkForAddClient 
    {
        get 
        {
            return this.client.GetLink("addClient");
        }
    }

    public async Task<HalEndpointDoc> GetAddClientDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("addClient", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasAddClientDocs() {
        return this.client.HasLinkDoc("addClient");
    }

    public async Task UpdateClient(ClientInput data) 
    {
        var result = await this.client.LoadLinkWithData("updateClient", data);
    }

    public bool CanUpdateClient 
    {
        get 
        {
            return this.client.HasLink("updateClient");
        }
    }

    public HalLink LinkForUpdateClient 
    {
        get 
        {
            return this.client.GetLink("updateClient");
        }
    }

    public async Task<HalEndpointDoc> GetUpdateClientDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("updateClient", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasUpdateClientDocs() {
        return this.client.HasLinkDoc("updateClient");
    }

    public async Task DeleteClient() 
    {
        var result = await this.client.LoadLink("deleteClient");
    }

    public bool CanDeleteClient 
    {
        get 
        {
            return this.client.HasLink("deleteClient");
        }
    }

    public HalLink LinkForDeleteClient 
    {
        get 
        {
            return this.client.GetLink("deleteClient");
        }
    }

    public async Task<ClientMetadataViewResult> LoadClientFromMetadata(MetadataLookup data) 
    {
        var result = await this.client.LoadLinkWithData("loadClientFromMetadata", data);
        return new ClientMetadataViewResult(result);

    }

    public bool CanLoadClientFromMetadata 
    {
        get 
        {
            return this.client.HasLink("loadClientFromMetadata");
        }
    }

    public HalLink LinkForLoadClientFromMetadata 
    {
        get 
        {
            return this.client.GetLink("loadClientFromMetadata");
        }
    }

    public async Task<HalEndpointDoc> GetLoadClientFromMetadataDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("loadClientFromMetadata", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasLoadClientFromMetadataDocs() {
        return this.client.HasLinkDoc("loadClientFromMetadata");
    }

    public async Task<ClientMetadataViewResult> LoadFromClientCredentialsMetadata(MetadataLookup data) 
    {
        var result = await this.client.LoadLinkWithData("LoadFromClientCredentialsMetadata", data);
        return new ClientMetadataViewResult(result);

    }

    public bool CanLoadFromClientCredentialsMetadata 
    {
        get 
        {
            return this.client.HasLink("LoadFromClientCredentialsMetadata");
        }
    }

    public HalLink LinkForLoadFromClientCredentialsMetadata 
    {
        get 
        {
            return this.client.GetLink("LoadFromClientCredentialsMetadata");
        }
    }

    public async Task<HalEndpointDoc> GetLoadFromClientCredentialsMetadataDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("LoadFromClientCredentialsMetadata", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasLoadFromClientCredentialsMetadataDocs() {
        return this.client.HasLinkDoc("LoadFromClientCredentialsMetadata");
    }

    public async Task<CreateSecretResultResult> AddClientSecret() 
    {
        var result = await this.client.LoadLink("addClientSecret");
        return new CreateSecretResultResult(result);

    }

    public bool CanAddClientSecret 
    {
        get 
        {
            return this.client.HasLink("addClientSecret");
        }
    }

    public HalLink LinkForAddClientSecret 
    {
        get 
        {
            return this.client.GetLink("addClientSecret");
        }
    }

    public async Task<HalEndpointDoc> GetAddClientSecretDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("addClientSecret", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasAddClientSecretDocs() {
        return this.client.HasLinkDoc("addClientSecret");
    }

    public async Task<ApiResourceEditModelCollectionResult> ListApiResource(PagedCollectionQuery data) 
    {
        var result = await this.client.LoadLinkWithData("listApiResource", data);
        return new ApiResourceEditModelCollectionResult(result);

    }

    public bool CanListApiResource 
    {
        get 
        {
            return this.client.HasLink("listApiResource");
        }
    }

    public HalLink LinkForListApiResource 
    {
        get 
        {
            return this.client.GetLink("listApiResource");
        }
    }

    public async Task<HalEndpointDoc> GetListApiResourceDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("listApiResource", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasListApiResourceDocs() {
        return this.client.HasLinkDoc("listApiResource");
    }

    public async Task AddApiResource(ApiResourceInput data) 
    {
        var result = await this.client.LoadLinkWithData("addApiResource", data);
    }

    public bool CanAddApiResource 
    {
        get 
        {
            return this.client.HasLink("addApiResource");
        }
    }

    public HalLink LinkForAddApiResource 
    {
        get 
        {
            return this.client.GetLink("addApiResource");
        }
    }

    public async Task<HalEndpointDoc> GetAddApiResourceDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("addApiResource", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasAddApiResourceDocs() {
        return this.client.HasLinkDoc("addApiResource");
    }

    public async Task UpdateApiResource(ApiResourceInput data) 
    {
        var result = await this.client.LoadLinkWithData("updateApiResource", data);
    }

    public bool CanUpdateApiResource 
    {
        get 
        {
            return this.client.HasLink("updateApiResource");
        }
    }

    public HalLink LinkForUpdateApiResource 
    {
        get 
        {
            return this.client.GetLink("updateApiResource");
        }
    }

    public async Task<HalEndpointDoc> GetUpdateApiResourceDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("updateApiResource", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasUpdateApiResourceDocs() {
        return this.client.HasLinkDoc("updateApiResource");
    }

    public async Task DeleteApiResource() 
    {
        var result = await this.client.LoadLink("deleteApiResource");
    }

    public bool CanDeleteApiResource 
    {
        get 
        {
            return this.client.HasLink("deleteApiResource");
        }
    }

    public HalLink LinkForDeleteApiResource 
    {
        get 
        {
            return this.client.GetLink("deleteApiResource");
        }
    }

    public async Task<ApiResourceMetadataViewResult> LoadApiResourceFromMetadata(MetadataLookup data) 
    {
        var result = await this.client.LoadLinkWithData("loadApiResourceFromMetadata", data);
        return new ApiResourceMetadataViewResult(result);

    }

    public bool CanLoadApiResourceFromMetadata 
    {
        get 
        {
            return this.client.HasLink("loadApiResourceFromMetadata");
        }
    }

    public HalLink LinkForLoadApiResourceFromMetadata 
    {
        get 
        {
            return this.client.GetLink("loadApiResourceFromMetadata");
        }
    }

    public async Task<HalEndpointDoc> GetLoadApiResourceFromMetadataDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("loadApiResourceFromMetadata", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasLoadApiResourceFromMetadataDocs() {
        return this.client.HasLinkDoc("loadApiResourceFromMetadata");
    }

    public async Task<RoleAssignmentsResult> GetUser() 
    {
        var result = await this.client.LoadLink("GetUser");
        return new RoleAssignmentsResult(result);

    }

    public bool CanGetUser 
    {
        get 
        {
            return this.client.HasLink("GetUser");
        }
    }

    public HalLink LinkForGetUser 
    {
        get 
        {
            return this.client.GetLink("GetUser");
        }
    }

    public async Task<HalEndpointDoc> GetGetUserDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("GetUser", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasGetUserDocs() {
        return this.client.HasLinkDoc("GetUser");
    }

    public async Task<UserCollectionResult> ListUsers(RolesQuery data) 
    {
        var result = await this.client.LoadLinkWithData("ListUsers", data);
        return new UserCollectionResult(result);

    }

    public bool CanListUsers 
    {
        get 
        {
            return this.client.HasLink("ListUsers");
        }
    }

    public HalLink LinkForListUsers 
    {
        get 
        {
            return this.client.GetLink("ListUsers");
        }
    }

    public async Task<HalEndpointDoc> GetListUsersDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("ListUsers", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasListUsersDocs() {
        return this.client.HasLinkDoc("ListUsers");
    }

    public async Task<RoleAssignmentsResult> SetUser(RoleAssignments data) 
    {
        var result = await this.client.LoadLinkWithData("SetUser", data);
        return new RoleAssignmentsResult(result);

    }

    public bool CanSetUser 
    {
        get 
        {
            return this.client.HasLink("SetUser");
        }
    }

    public HalLink LinkForSetUser 
    {
        get 
        {
            return this.client.GetLink("SetUser");
        }
    }

    public async Task<HalEndpointDoc> GetSetUserDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("SetUser", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasSetUserDocs() {
        return this.client.HasLinkDoc("SetUser");
    }

    public async Task<IdServerUserCollectionResult> ListIdServerUsers(IdServerUserQuery data) 
    {
        var result = await this.client.LoadLinkWithData("ListIdServerUsers", data);
        return new IdServerUserCollectionResult(result);

    }

    public bool CanListIdServerUsers 
    {
        get 
        {
            return this.client.HasLink("ListIdServerUsers");
        }
    }

    public HalLink LinkForListIdServerUsers 
    {
        get 
        {
            return this.client.GetLink("ListIdServerUsers");
        }
    }

    public async Task<HalEndpointDoc> GetListIdServerUsersDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("ListIdServerUsers", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasListIdServerUsersDocs() {
        return this.client.HasLinkDoc("ListIdServerUsers");
    }

    public async Task<UserSearchCollectionResult> ListAppUsers(UserSearchQuery data) 
    {
        var result = await this.client.LoadLinkWithData("ListAppUsers", data);
        return new UserSearchCollectionResult(result);

    }

    public bool CanListAppUsers 
    {
        get 
        {
            return this.client.HasLink("ListAppUsers");
        }
    }

    public HalLink LinkForListAppUsers 
    {
        get 
        {
            return this.client.GetLink("ListAppUsers");
        }
    }

    public async Task<HalEndpointDoc> GetListAppUsersDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("ListAppUsers", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasListAppUsersDocs() {
        return this.client.HasLinkDoc("ListAppUsers");
    }
}

public class UserCollectionResult 
{
    private HalEndpointClient client;

    public UserCollectionResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private UserCollection strongData = default(UserCollection);
    public UserCollection Data 
    {
        get
        {
            if(this.strongData == default(UserCollection))
            {
                this.strongData = this.client.GetData<UserCollection>();  
            }
            return this.strongData;
        }
    }

    private List<RoleAssignmentsResult> strongItems = null;
    public List<RoleAssignmentsResult> Items
    {
        get
        {
            if (this.strongItems == null) 
            {
                var embeds = this.client.GetEmbed("values");
                var clients = embeds.GetAllClients();
                this.strongItems = new List<RoleAssignmentsResult>(clients.Select(i => new RoleAssignmentsResult(i)));
            }
            return this.strongItems;
        }
    }

    public async Task<UserCollectionResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new UserCollectionResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }

    public async Task<HalEndpointDoc> GetGetDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("Get", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasGetDocs() {
        return this.client.HasLinkDoc("Get");
    }

    public async Task<HalEndpointDoc> GetListDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("List", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasListDocs() {
        return this.client.HasLinkDoc("List");
    }

    public async Task<HalEndpointDoc> GetUpdateDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("Update", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasUpdateDocs() {
        return this.client.HasLinkDoc("Update");
    }

    public async Task<RoleAssignmentsResult> Add(RoleAssignments data) 
    {
        var result = await this.client.LoadLinkWithData("Add", data);
        return new RoleAssignmentsResult(result);

    }

    public bool CanAdd 
    {
        get 
        {
            return this.client.HasLink("Add");
        }
    }

    public HalLink LinkForAdd 
    {
        get 
        {
            return this.client.GetLink("Add");
        }
    }

    public async Task<HalEndpointDoc> GetAddDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("Add", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasAddDocs() {
        return this.client.HasLinkDoc("Add");
    }

    public async Task<UserCollectionResult> Next() 
    {
        var result = await this.client.LoadLink("next");
        return new UserCollectionResult(result);

    }

    public bool CanNext 
    {
        get 
        {
            return this.client.HasLink("next");
        }
    }

    public HalLink LinkForNext 
    {
        get 
        {
            return this.client.GetLink("next");
        }
    }

    public async Task<HalEndpointDoc> GetNextDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("next", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasNextDocs() {
        return this.client.HasLinkDoc("next");
    }

    public async Task<UserCollectionResult> Previous() 
    {
        var result = await this.client.LoadLink("previous");
        return new UserCollectionResult(result);

    }

    public bool CanPrevious 
    {
        get 
        {
            return this.client.HasLink("previous");
        }
    }

    public HalLink LinkForPrevious 
    {
        get 
        {
            return this.client.GetLink("previous");
        }
    }

    public async Task<HalEndpointDoc> GetPreviousDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("previous", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasPreviousDocs() {
        return this.client.HasLinkDoc("previous");
    }

    public async Task<UserCollectionResult> First() 
    {
        var result = await this.client.LoadLink("first");
        return new UserCollectionResult(result);

    }

    public bool CanFirst 
    {
        get 
        {
            return this.client.HasLink("first");
        }
    }

    public HalLink LinkForFirst 
    {
        get 
        {
            return this.client.GetLink("first");
        }
    }

    public async Task<HalEndpointDoc> GetFirstDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("first", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasFirstDocs() {
        return this.client.HasLinkDoc("first");
    }

    public async Task<UserCollectionResult> Last() 
    {
        var result = await this.client.LoadLink("last");
        return new UserCollectionResult(result);

    }

    public bool CanLast 
    {
        get 
        {
            return this.client.HasLink("last");
        }
    }

    public HalLink LinkForLast 
    {
        get 
        {
            return this.client.GetLink("last");
        }
    }

    public async Task<HalEndpointDoc> GetLastDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("last", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasLastDocs() {
        return this.client.HasLinkDoc("last");
    }
}

public class UserSearchResult 
{
    private HalEndpointClient client;

    public UserSearchResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private UserSearch strongData = default(UserSearch);
    public UserSearch Data 
    {
        get
        {
            if(this.strongData == default(UserSearch))
            {
                this.strongData = this.client.GetData<UserSearch>();  
            }
            return this.strongData;
        }
    }

    public async Task<UserSearchResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new UserSearchResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }
}

public class UserSearchCollectionResult 
{
    private HalEndpointClient client;

    public UserSearchCollectionResult(HalEndpointClient client) 
    {
        this.client = client;
    }

    private UserSearchCollection strongData = default(UserSearchCollection);
    public UserSearchCollection Data 
    {
        get
        {
            if(this.strongData == default(UserSearchCollection))
            {
                this.strongData = this.client.GetData<UserSearchCollection>();  
            }
            return this.strongData;
        }
    }

    private List<UserSearchResult> strongItems = null;
    public List<UserSearchResult> Items
    {
        get
        {
            if (this.strongItems == null) 
            {
                var embeds = this.client.GetEmbed("values");
                var clients = embeds.GetAllClients();
                this.strongItems = new List<UserSearchResult>(clients.Select(i => new UserSearchResult(i)));
            }
            return this.strongItems;
        }
    }

    public async Task<UserSearchCollectionResult> Refresh() 
    {
        var result = await this.client.LoadLink("self");
        return new UserSearchCollectionResult(result);

    }

    public bool CanRefresh 
    {
        get 
        {
            return this.client.HasLink("self");
        }
    }

    public HalLink LinkForRefresh 
    {
        get 
        {
            return this.client.GetLink("self");
        }
    }

    public async Task<HalEndpointDoc> GetRefreshDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("self", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasRefreshDocs() {
        return this.client.HasLinkDoc("self");
    }

    public async Task<HalEndpointDoc> GetGetDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("Get", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasGetDocs() {
        return this.client.HasLinkDoc("Get");
    }

    public async Task<HalEndpointDoc> GetListDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("List", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasListDocs() {
        return this.client.HasLinkDoc("List");
    }

    public async Task<UserSearchCollectionResult> Next() 
    {
        var result = await this.client.LoadLink("next");
        return new UserSearchCollectionResult(result);

    }

    public bool CanNext 
    {
        get 
        {
            return this.client.HasLink("next");
        }
    }

    public HalLink LinkForNext 
    {
        get 
        {
            return this.client.GetLink("next");
        }
    }

    public async Task<HalEndpointDoc> GetNextDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("next", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasNextDocs() {
        return this.client.HasLinkDoc("next");
    }

    public async Task<UserSearchCollectionResult> Previous() 
    {
        var result = await this.client.LoadLink("previous");
        return new UserSearchCollectionResult(result);

    }

    public bool CanPrevious 
    {
        get 
        {
            return this.client.HasLink("previous");
        }
    }

    public HalLink LinkForPrevious 
    {
        get 
        {
            return this.client.GetLink("previous");
        }
    }

    public async Task<HalEndpointDoc> GetPreviousDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("previous", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasPreviousDocs() {
        return this.client.HasLinkDoc("previous");
    }

    public async Task<UserSearchCollectionResult> First() 
    {
        var result = await this.client.LoadLink("first");
        return new UserSearchCollectionResult(result);

    }

    public bool CanFirst 
    {
        get 
        {
            return this.client.HasLink("first");
        }
    }

    public HalLink LinkForFirst 
    {
        get 
        {
            return this.client.GetLink("first");
        }
    }

    public async Task<HalEndpointDoc> GetFirstDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("first", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasFirstDocs() {
        return this.client.HasLinkDoc("first");
    }

    public async Task<UserSearchCollectionResult> Last() 
    {
        var result = await this.client.LoadLink("last");
        return new UserSearchCollectionResult(result);

    }

    public bool CanLast 
    {
        get 
        {
            return this.client.HasLink("last");
        }
    }

    public HalLink LinkForLast 
    {
        get 
        {
            return this.client.GetLink("last");
        }
    }

    public async Task<HalEndpointDoc> GetLastDocs(HalEndpointDocQuery query = null) 
    {
        var result = await this.client.LoadLinkDoc("last", query);
        return result.GetData<HalEndpointDoc>();
    }

    public bool HasLastDocs() {
        return this.client.HasLinkDoc("last");
    }
}
}
//----------------------
// <auto-generated>
//     Generated using the NJsonSchema v9.10.49.0 (Newtonsoft.Json v11.0.0.0) (http://NJsonSchema.org)
// </auto-generated>
//----------------------

namespace Threax.IdServer.Client
{
    #pragma warning disable // Disable all warnings

    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class RoleAssignments 
    {
        [Newtonsoft.Json.JsonProperty("editClients", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool EditClients { get; set; }
    
        [Newtonsoft.Json.JsonProperty("editApiResources", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool EditApiResources { get; set; }
    
        [Newtonsoft.Json.JsonProperty("viewIdServerUsers", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool ViewIdServerUsers { get; set; }
    
        [Newtonsoft.Json.JsonProperty("userId", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public System.Guid UserId { get; set; }
    
        [Newtonsoft.Json.JsonProperty("name", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string Name { get; set; }
    
        [Newtonsoft.Json.JsonProperty("editRoles", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool EditRoles { get; set; }
    
        [Newtonsoft.Json.JsonProperty("superAdmin", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool SuperAdmin { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static RoleAssignments FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<RoleAssignments>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class IdServerUserCollection 
    {
        [Newtonsoft.Json.JsonProperty("userIds", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<System.Guid> UserIds { get; set; }
    
        [Newtonsoft.Json.JsonProperty("userId", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public System.Guid? UserId { get; set; }
    
        [Newtonsoft.Json.JsonProperty("total", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Total { get; set; }
    
        [Newtonsoft.Json.JsonProperty("userName", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string UserName { get; set; }
    
        /// <summary>The number of pages (item number = Offset * Limit) into the collection to query.</summary>
        [Newtonsoft.Json.JsonProperty("offset", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Offset { get; set; }
    
        /// <summary>The limit of the number of items to return.</summary>
        [Newtonsoft.Json.JsonProperty("limit", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Limit { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static IdServerUserCollection FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<IdServerUserCollection>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class IdServerUserQuery 
    {
        [Newtonsoft.Json.JsonProperty("userId", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public System.Guid? UserId { get; set; }
    
        [Newtonsoft.Json.JsonProperty("userIds", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<System.Guid> UserIds { get; set; }
    
        [Newtonsoft.Json.JsonProperty("userName", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string UserName { get; set; }
    
        /// <summary>The number of pages (item number = Offset * Limit) into the collection to query.</summary>
        [Newtonsoft.Json.JsonProperty("offset", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Offset { get; set; }
    
        /// <summary>The limit of the number of items to return.</summary>
        [Newtonsoft.Json.JsonProperty("limit", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Limit { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static IdServerUserQuery FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<IdServerUserQuery>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class IdServerUserView 
    {
        [Newtonsoft.Json.JsonProperty("userId", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public System.Guid UserId { get; set; }
    
        [Newtonsoft.Json.JsonProperty("userName", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string UserName { get; set; }
    
        [Newtonsoft.Json.JsonProperty("displayName", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string DisplayName { get; set; }
    
        [Newtonsoft.Json.JsonProperty("givenName", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string GivenName { get; set; }
    
        [Newtonsoft.Json.JsonProperty("surname", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string Surname { get; set; }
    
        [Newtonsoft.Json.JsonProperty("email", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string Email { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static IdServerUserView FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<IdServerUserView>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class ApiResourceEditModel 
    {
        [Newtonsoft.Json.JsonProperty("id", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Id { get; set; }
    
        [Newtonsoft.Json.JsonProperty("scopeName", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string ScopeName { get; set; }
    
        [Newtonsoft.Json.JsonProperty("displayName", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string DisplayName { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static ApiResourceEditModel FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<ApiResourceEditModel>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class ApiResourceInput 
    {
        [Newtonsoft.Json.JsonProperty("scopeName", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string ScopeName { get; set; }
    
        [Newtonsoft.Json.JsonProperty("displayName", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string DisplayName { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static ApiResourceInput FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<ApiResourceInput>(data);
        }
    
    }
    
    /// <summary>View model for collections of clients.</summary>
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class ApiResourceEditModelCollection 
    {
        [Newtonsoft.Json.JsonProperty("offset", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Offset { get; set; }
    
        [Newtonsoft.Json.JsonProperty("limit", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Limit { get; set; }
    
        [Newtonsoft.Json.JsonProperty("total", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Total { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static ApiResourceEditModelCollection FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<ApiResourceEditModelCollection>(data);
        }
    
    }
    
    /// <summary>Default implementation of ICollectionQuery.</summary>
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class PagedCollectionQuery 
    {
        /// <summary>The number of pages (item number = Offset * Limit) into the collection to query.</summary>
        [Newtonsoft.Json.JsonProperty("offset", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Offset { get; set; }
    
        /// <summary>The limit of the number of items to return.</summary>
        [Newtonsoft.Json.JsonProperty("limit", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Limit { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static PagedCollectionQuery FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<PagedCollectionQuery>(data);
        }
    
    }
    
    /// <summary>A model class for looking up metadata.</summary>
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class MetadataLookup 
    {
        /// <summary>The url to lookup metadata from.</summary>
        [Newtonsoft.Json.JsonProperty("targetUrl", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string TargetUrl { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static MetadataLookup FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<MetadataLookup>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class ApiResourceMetadataView 
    {
        [Newtonsoft.Json.JsonProperty("scopeName", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string ScopeName { get; set; }
    
        [Newtonsoft.Json.JsonProperty("displayName", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string DisplayName { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static ApiResourceMetadataView FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<ApiResourceMetadataView>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class ClientEditModel 
    {
        /// <summary>The id of the client.</summary>
        [Newtonsoft.Json.JsonProperty("id", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Id { get; set; }
    
        [Newtonsoft.Json.JsonProperty("clientId", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string ClientId { get; set; }
    
        [Newtonsoft.Json.JsonProperty("name", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string Name { get; set; }
    
        [Newtonsoft.Json.JsonProperty("logoutUri", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string LogoutUri { get; set; }
    
        [Newtonsoft.Json.JsonProperty("logoutSessionRequired", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool LogoutSessionRequired { get; set; }
    
        [Newtonsoft.Json.JsonProperty("allowedGrantTypes", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<string> AllowedGrantTypes { get; set; }
    
        [Newtonsoft.Json.JsonProperty("redirectUris", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<string> RedirectUris { get; set; }
    
        [Newtonsoft.Json.JsonProperty("allowedScopes", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<string> AllowedScopes { get; set; }
    
        [Newtonsoft.Json.JsonProperty("enableLocalLogin", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool EnableLocalLogin { get; set; }
    
        [Newtonsoft.Json.JsonProperty("accessTokenLifetime", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int AccessTokenLifetime { get; set; }
    
        /// <summary>This Guid is used to identify the client when it is logging in as an application user.
        /// That is the only time it is used, the integer id is the real id of the item when
        /// editing.</summary>
        [Newtonsoft.Json.JsonProperty("applicationGuid", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public System.Guid ApplicationGuid { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static ClientEditModel FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<ClientEditModel>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class ClientInput 
    {
        [Newtonsoft.Json.JsonProperty("clientId", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string ClientId { get; set; }
    
        [Newtonsoft.Json.JsonProperty("name", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string Name { get; set; }
    
        [Newtonsoft.Json.JsonProperty("logoutUri", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string LogoutUri { get; set; }
    
        [Newtonsoft.Json.JsonProperty("logoutSessionRequired", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool LogoutSessionRequired { get; set; }
    
        [Newtonsoft.Json.JsonProperty("allowedGrantTypes", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<string> AllowedGrantTypes { get; set; }
    
        [Newtonsoft.Json.JsonProperty("redirectUris", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<string> RedirectUris { get; set; }
    
        [Newtonsoft.Json.JsonProperty("allowedScopes", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<string> AllowedScopes { get; set; }
    
        [Newtonsoft.Json.JsonProperty("enableLocalLogin", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool EnableLocalLogin { get; set; }
    
        [Newtonsoft.Json.JsonProperty("accessTokenLifetime", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int AccessTokenLifetime { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static ClientInput FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<ClientInput>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class CreateSecretResult 
    {
        [Newtonsoft.Json.JsonProperty("secret", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string Secret { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static CreateSecretResult FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<CreateSecretResult>(data);
        }
    
    }
    
    /// <summary>View model for collections of clients.</summary>
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class ClientEditModelCollectionView 
    {
        [Newtonsoft.Json.JsonProperty("offset", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Offset { get; set; }
    
        [Newtonsoft.Json.JsonProperty("limit", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Limit { get; set; }
    
        [Newtonsoft.Json.JsonProperty("total", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Total { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static ClientEditModelCollectionView FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<ClientEditModelCollectionView>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class ClientMetadataView 
    {
        [Newtonsoft.Json.JsonProperty("clientId", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string ClientId { get; set; }
    
        [Newtonsoft.Json.JsonProperty("name", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string Name { get; set; }
    
        [Newtonsoft.Json.JsonProperty("logoutUri", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string LogoutUri { get; set; }
    
        [Newtonsoft.Json.JsonProperty("logoutSessionRequired", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool LogoutSessionRequired { get; set; }
    
        [Newtonsoft.Json.JsonProperty("allowedGrantTypes", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<string> AllowedGrantTypes { get; set; }
    
        [Newtonsoft.Json.JsonProperty("redirectUris", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<string> RedirectUris { get; set; }
    
        [Newtonsoft.Json.JsonProperty("allowedScopes", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<string> AllowedScopes { get; set; }
    
        [Newtonsoft.Json.JsonProperty("enableLocalLogin", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public bool EnableLocalLogin { get; set; }
    
        [Newtonsoft.Json.JsonProperty("accessTokenLifetime", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int AccessTokenLifetime { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static ClientMetadataView FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<ClientMetadataView>(data);
        }
    
    }
    
    /// <summary>This class returns the entry points to the system using hal links.</summary>
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class EntryPoints 
    {
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static EntryPoints FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<EntryPoints>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class RolesQuery 
    {
        /// <summary>The guid for the user, this is used to look up the user.</summary>
        [Newtonsoft.Json.JsonProperty("userId", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public List<System.Guid> UserId { get; set; }
    
        /// <summary>A name for the user. Used only as a reference, will be added to the result if the user is not found.</summary>
        [Newtonsoft.Json.JsonProperty("name", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string Name { get; set; }
    
        /// <summary>The number of pages (item number = Offset * Limit) into the collection to query.</summary>
        [Newtonsoft.Json.JsonProperty("offset", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Offset { get; set; }
    
        /// <summary>The limit of the number of items to return.</summary>
        [Newtonsoft.Json.JsonProperty("limit", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Limit { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static RolesQuery FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<RolesQuery>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class UserCollection 
    {
        [Newtonsoft.Json.JsonProperty("offset", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Offset { get; set; }
    
        [Newtonsoft.Json.JsonProperty("limit", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Limit { get; set; }
    
        [Newtonsoft.Json.JsonProperty("total", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Total { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static UserCollection FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<UserCollection>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class UserSearchQuery 
    {
        [Newtonsoft.Json.JsonProperty("userId", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public System.Guid? UserId { get; set; }
    
        [Newtonsoft.Json.JsonProperty("userName", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string UserName { get; set; }
    
        /// <summary>The number of pages (item number = Offset * Limit) into the collection to query.</summary>
        [Newtonsoft.Json.JsonProperty("offset", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Offset { get; set; }
    
        /// <summary>The limit of the number of items to return.</summary>
        [Newtonsoft.Json.JsonProperty("limit", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Limit { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static UserSearchQuery FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<UserSearchQuery>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class UserSearchCollection 
    {
        [Newtonsoft.Json.JsonProperty("userName", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string UserName { get; set; }
    
        [Newtonsoft.Json.JsonProperty("userId", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public System.Guid? UserId { get; set; }
    
        [Newtonsoft.Json.JsonProperty("total", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Total { get; set; }
    
        /// <summary>The number of pages (item number = Offset * Limit) into the collection to query.</summary>
        [Newtonsoft.Json.JsonProperty("offset", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Offset { get; set; }
    
        /// <summary>The limit of the number of items to return.</summary>
        [Newtonsoft.Json.JsonProperty("limit", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public int Limit { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static UserSearchCollection FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<UserSearchCollection>(data);
        }
    
    }
    
    [System.CodeDom.Compiler.GeneratedCode("NJsonSchema", "9.10.49.0 (Newtonsoft.Json v11.0.0.0)")]
    public partial class UserSearch 
    {
        [Newtonsoft.Json.JsonProperty("userId", Required = Newtonsoft.Json.Required.DisallowNull, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public System.Guid UserId { get; set; }
    
        [Newtonsoft.Json.JsonProperty("userName", Required = Newtonsoft.Json.Required.Default, NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore)]
        public string UserName { get; set; }
    
        public string ToJson() 
        {
            return Newtonsoft.Json.JsonConvert.SerializeObject(this);
        }
        
        public static UserSearch FromJson(string data)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<UserSearch>(data);
        }
    
    }
}
