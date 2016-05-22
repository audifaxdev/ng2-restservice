import {Observable} from 'rxjs/Rx';
import {Observer} from "rxjs/Rx";
import 'rxjs/add/operator/map';

import {Injectable} from "@angular/core";
import {Http, RequestOptions, Request, RequestMethod, Response} from "@angular/http";


class CacheItem {
  data: any;
  age: number;
}

@Injectable()
export class RestService {
  urlBase: string;
  authHeader: string;

  //Data cache
  cacheMap: Object;
  cacheMaxAge: number;

  public constructor(private httpMan:Http)
  {
    this.urlBase = "/api/";
    this.cacheMaxAge = 60;
    this.cacheMap = {};
  }

  protected call(method:string, path:string, params:any = null) : Observable<any>
  {
    let options = new RequestOptions({method: null, url: this.urlBase + path});

    switch (method) {
      case "get":
        options.method = RequestMethod.Get;
        break;
      case "post":
        options.method = RequestMethod.Post;
        options.body = JSON.stringify(params);
        break;
      case "put":
        options.method = RequestMethod.Put;
        options.body = JSON.stringify(params);
        break;
      case "delete":
        options.method = RequestMethod.Delete;
        break;
      case "patch":
        options.method = RequestMethod.Patch;
        options.body = JSON.stringify(params);
        break;
      case "head":
        options.method = RequestMethod.Head;
        break;
    }

    return this.httpMan.request(new Request(options));
  }

  protected needsUpdate(key: string) : boolean
  {
    let now = new Date().getTime();

    //If data's still fresh don't update
    if (this.cacheMap[key] && ((now - this.cacheMap[key].age) < this.cacheMaxAge * 1000)) {
      console.log("needsUpdate? " + key + " false");
      return false;
    }
    console.log("needsUpdate? " + key + " true");
    return true;
  }

  protected storeData(key: string, data: any)
  {
    this.cacheMap[key] = {age : new Date().getTime(), data: data};
  }

  //Get and cache
  protected getResource(url: string) : Observable<any>
  {
    return new Observable<any>(
      (observer: Observer<any>) => {
        if (!this.needsUpdate(url)) {
          observer.next(this.cacheMap[url].data);
          observer.complete();
        }
        this.call("get", url).subscribe(
          res => {
            this.storeData(url, res.json());
            observer.next(this.cacheMap[url].data);
            observer.complete();
          }
        );
      }
    );
  }

  protected callAndMapResult(method:string, path:string, params:any = null)
  {
    return this.call(method, path, params).map((res) => {return res.json()});
  }

  //Public methods
  public getProducts() : Observable<any>
  {
    return this.getResource("products?filter[include]=vendor");
  }

  public getProduct(id:string) : Observable<any>
  {
    return this.getResource("products/" + id + "?filter[include]=vendor");
  }

  public getProductReviews(id:string) : Observable<any>
  {
    return this.getResource("products/" + id + "/reviews?filter[include]=user");
  }

  public createReview(params) : Observable<any>
  {
    return this.callAndMapResult("post", "reviews", params);
  }
}

