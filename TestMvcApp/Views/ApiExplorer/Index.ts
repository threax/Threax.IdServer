import * as explorer from 'hr.halcyon-explorer.HalcyonBrowserController';
import * as controller from 'hr.controller';
import * as startup from 'clientlibs.startup';

var builder = startup.createBuilder();
explorer.addServices(builder.Services);
builder.create("halcyonbrowser", explorer.HalcyonBrowserController);