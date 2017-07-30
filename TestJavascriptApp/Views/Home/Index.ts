import * as injectors from 'clientlibs.ServiceClientInjectors';
import * as crudPageCore from 'clientlibs.CrudPageCore';

var injector = injectors.ValueCrudInjector;
crudPageCore.create(new crudPageCore.Settings(injector));