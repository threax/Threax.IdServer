import * as startup from 'clientlibs.startup';
import * as crudPage from 'hr.widgets.CrudPage';
import * as controller from 'hr.controller';
import * as crudService from 'hr.roleclient.UserCrudService';
import * as UserSearchController from 'hr.roleclient.UserSearchController';
import * as Client from 'hr.roleclient.UserDirectoryClient';

//Main page

var builder = startup.createBuilder();

crudPage.addServices(builder.Services);
crudService.addServices(builder.Services);
UserSearchController.AddServices(builder.Services);

builder.create("userSearch", UserSearchController.UserSearchController);

builder.create("search", crudPage.CrudSearch);
builder.create("pageNumbers", crudPage.CrudPageNumbers);
builder.create("mainTable", crudPage.CrudTableController);
builder.create("entryEditor", crudPage.CrudItemEditorController);