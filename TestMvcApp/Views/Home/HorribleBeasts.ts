import { HorribleBeastCrudInjector } from 'clientlibs.HorribleBeastCrudInjector';
import * as standardCrudPage from 'hr.widgets.StandardCrudPage';
import * as startup from 'clientlibs.startup';

var injector = HorribleBeastCrudInjector;
var builder = startup.createBuilder();
standardCrudPage.addServices(builder, injector);
standardCrudPage.createControllers(builder, new standardCrudPage.Settings());