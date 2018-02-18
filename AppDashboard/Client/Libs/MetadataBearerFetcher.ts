import { Fetcher, RequestInfo, RequestInit, Response} from 'hr.fetcher';

export class MetadataBearerFetcher implements Fetcher {
    private next: Fetcher;

    constructor(next: Fetcher) {
        this.next = next;
    }

    fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        //set the header to null, the access token fetcher will take it from there.
        if (init === undefined)
        {
            init = {};
        }
        
        if(init.headers === undefined)
        {
            init.headers = {};
        }
        
        (<any>init.headers).bearer = null;

        return this.next.fetch(url, init);
    }
}