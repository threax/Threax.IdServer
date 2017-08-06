import { ValueCrudInjector } from 'clientlibs.ValueCrudInjector';
import * as crudPageCore from 'hr.widgets.CrudPageCore';
import * as startup from 'clientlibs.startup';

var injector = ValueCrudInjector;
var builder = startup.createBuilder();
crudPageCore.addServices(builder, injector);
crudPageCore.createControllers(builder, new crudPageCore.Settings());