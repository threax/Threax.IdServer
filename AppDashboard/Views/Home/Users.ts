import * as startup from 'clientlibs.startup';
import * as controller from 'hr.controller';
import * as UserSearchController from 'hr.roleclient.UserSearchController';
import * as Client from 'hr.roleclient.UserDirectoryClient';

var builder = startup.createBuilder();
UserSearchController.AddServices(builder.Services);
builder.create("search", UserSearchController.UserSearchController);