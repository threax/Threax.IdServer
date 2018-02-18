var jsnsOptions = jsnsOptions || {};
var jsnsDefine = jsnsDefine ||
    (function (options) {
        var JsModuleInstance = /** @class */ (function () {
            function JsModuleInstance(definition, loader) {
                this.definition = definition;
                this.loader = loader;
                this.exports = {};
            }
            return JsModuleInstance;
        }());
        var JsModuleDefinition = /** @class */ (function () {
            function JsModuleDefinition(name, depNames, factory, loader, source, isRunner, moduleCodeFinder) {
                this.source = source;
                this.isRunner = isRunner;
                this.moduleCodeFinder = moduleCodeFinder;
                this.dependencies = [];
                this.name = name;
                this.factory = factory;
                if (depNames) {
                    for (var i = 0; i < depNames.length; ++i) {
                        var depName = depNames[i];
                        this.dependencies.push({
                            name: depName,
                            loaded: loader.isModuleLoaded(depName)
                        });
                    }
                }
            }
            JsModuleDefinition.prototype.getModuleCode = function (ignoredSources) {
                if (ignoredSources.indexOf(this.source) !== -1) {
                    return '';
                }
                if (this.isRunner) {
                    return 'jsns.run("' + this.dependencies[0].name + '");\n';
                }
                if (this.moduleCodeFinder !== undefined) {
                    return this.moduleCodeFinder(this);
                }
                else {
                    return 'jsns.define("' + this.name + '", ' + this.getDependenciesArg() + ', ' + this.factory + ');\n';
                }
            };
            JsModuleDefinition.prototype.getDependenciesArg = function (preDependencies) {
                var deps = '[';
                var sep = '';
                if (preDependencies) {
                    for (var i = 0; i < preDependencies.length; ++i) {
                        deps += sep + '"' + preDependencies[i] + '"';
                        sep = ',';
                    }
                }
                for (var i = 0; i < this.dependencies.length; ++i) {
                    deps += sep + '"' + this.dependencies[i].name + '"';
                    sep = ',';
                }
                deps += ']';
                return deps;
            };
            return JsModuleDefinition;
        }());
        var ModuleManager = /** @class */ (function () {
            function ModuleManager(options) {
                this.loaded = {};
                this.loadedOrder = [];
                this.unloaded = {};
                this.runners = [];
                this.fromModuleRunners = null; //When calling run from a module you can't add the runner to the runner's list, this will accumulate the runners during that time.
                if (options === undefined) {
                    options = {};
                }
                this.options = options;
            }
            /**
             * Add a runner to the module manager. This will add the runner in such a way that more runners can be defined during
             * module execution. If such a run is invoked it will be deferred until the current module stops executing.
             * Because of this management, loadRunners will be called automaticly by the addRunner funciton. There is no reason
             * for a client class to call that function for runners, and in fact that can create errors.
             */
            ModuleManager.prototype.addRunner = function (name, source) {
                var runnerModule = new JsModuleDefinition(name + "Runner", [name], this.runnerFunc, this, source, true);
                if (this.fromModuleRunners !== null) {
                    this.fromModuleRunners.push(runnerModule);
                }
                else {
                    this.runners.push(runnerModule);
                    this.loadRunners();
                }
            };
            /**
             * Add a module to the module manager. Due to the variety of ways that a module could be added the user is responsible for
             * calling loadRunners() when they are ready to try to load modules.
             */
            ModuleManager.prototype.addModule = function (name, dependencies, factory, moduleWriter) {
                this.unloaded[name] = new JsModuleDefinition(name, dependencies, factory, this, undefined, false, moduleWriter);
            };
            ModuleManager.prototype.isModuleLoaded = function (name) {
                return this.loaded[name] !== undefined;
            };
            ModuleManager.prototype.isModuleLoadable = function (name) {
                return this.unloaded[name] !== undefined;
            };
            ModuleManager.prototype.isModuleDefined = function (name) {
                return this.isModuleLoaded(name) || this.isModuleLoadable(name);
            };
            ModuleManager.prototype.loadModule = function (name) {
                var loaded = this.checkModule(this.unloaded[name]);
                if (loaded) {
                    delete this.unloaded[name];
                }
                return loaded;
            };
            ModuleManager.prototype.setModuleLoaded = function (name, module) {
                if (this.loaded[name] === undefined) {
                    this.loaded[name] = module;
                    this.loadedOrder.push(name);
                }
            };
            ModuleManager.prototype.checkModule = function (check) {
                var dependencies = check.dependencies;
                var fullyLoaded = true;
                var module = undefined;
                //Check to see if depenedencies are loaded and if they aren't and can be, load them
                for (var i = 0; i < dependencies.length; ++i) {
                    var dep = dependencies[i];
                    dep.loaded = this.isModuleLoaded(dep.name);
                    if (!dep.loaded && this.isModuleLoadable(dep.name)) {
                        dep.loaded = this.loadModule(dep.name);
                    }
                    fullyLoaded = fullyLoaded && dep.loaded;
                }
                //If all dependencies are loaded, load this library
                if (fullyLoaded) {
                    module = new JsModuleInstance(check, this);
                    if (!this.options.simulateModuleLoading) {
                        var args = [module.exports, module];
                        //Inject dependency arguments
                        for (var i = 0; i < dependencies.length; ++i) {
                            var dep = dependencies[i];
                            args.push(this.loaded[dep.name].exports);
                        }
                        check.factory.apply(module, args);
                    }
                    this.setModuleLoaded(check.name, module);
                }
                return fullyLoaded;
            };
            ModuleManager.prototype.loadRunners = function () {
                this.fromModuleRunners = [];
                for (var i = 0; i < this.runners.length; ++i) {
                    var runner = this.runners[i];
                    if (this.checkModule(runner)) {
                        this.runners.splice(i--, 1);
                    }
                }
                var moreRunners = this.fromModuleRunners.length > 0;
                if (moreRunners) {
                    this.runners = this.runners.concat(this.fromModuleRunners);
                }
                this.fromModuleRunners = null;
                if (moreRunners) {
                    this.loadRunners();
                }
            };
            ModuleManager.prototype.debug = function () {
                if (this.runners.length > 0) {
                    for (var i = 0; i < this.runners.length; ++i) {
                        var runner = this.runners[i];
                        console.log("Runner waiting " + runner.name);
                        for (var j = 0; j < runner.dependencies.length; ++j) {
                            var dependency = runner.dependencies[j];
                            if (!this.isModuleLoaded(dependency.name)) {
                                this.recursiveWaitingDebug(dependency.name, 1);
                            }
                        }
                    }
                }
                else {
                    console.log("No runners remaining.");
                }
            };
            ModuleManager.prototype.printLoaded = function () {
                console.log("Loaded Modules:");
                for (var p in this.loaded) {
                    if (this.loaded.hasOwnProperty(p)) {
                        console.log(p);
                    }
                }
            };
            ModuleManager.prototype.printUnloaded = function () {
                console.log("Unloaded Modules:");
                for (var p in this.unloaded) {
                    if (this.unloaded.hasOwnProperty(p)) {
                        console.log(p);
                    }
                }
            };
            ModuleManager.prototype.createFileFromLoaded = function (ignoredSources) {
                if (ignoredSources === undefined) {
                    ignoredSources = [];
                }
                var modules = "var jsnsOptions = jsnsOptions || {};\nvar jsnsDefine =" + jsnsDefine + "\nvar jsns = jsns || jsnsDefine(jsnsOptions);\nvar define = define || " + define + '\n';
                for (var i = 0; i < this.loadedOrder.length; ++i) {
                    var p = this.loadedOrder[i];
                    if (this.loaded.hasOwnProperty(p)) {
                        var mod = this.loaded[p];
                        modules += mod.definition.getModuleCode(ignoredSources);
                    }
                }
                return modules;
            };
            ModuleManager.prototype.recursiveWaitingDebug = function (name, indent) {
                var indentStr = '';
                for (var i = 0; i < indent; ++i) {
                    indentStr += ' ';
                }
                var module = this.unloaded[name];
                if (module !== undefined) {
                    console.log(indentStr + module.name);
                    for (var j = 0; j < module.dependencies.length; ++j) {
                        var dependency = module.dependencies[j];
                        if (!this.isModuleLoaded(dependency.name)) {
                            this.recursiveWaitingDebug(dependency.name, indent + 4);
                        }
                    }
                }
                else {
                    console.log(indentStr + name + ' module not yet loaded.');
                }
            };
            ModuleManager.prototype.runnerFunc = function () { };
            return ModuleManager;
        }());
        var Loader = /** @class */ (function () {
            function Loader(moduleManager) {
                if (moduleManager === undefined) {
                    moduleManager = new ModuleManager();
                }
                this.moduleManager = moduleManager;
            }
            Loader.prototype.define = function (name, dependencies, factory) {
                if (!this.moduleManager.isModuleDefined(name)) {
                    this.moduleManager.addModule(name, dependencies, factory);
                    this.moduleManager.loadRunners();
                }
            };
            Loader.prototype.amd = function (name, discoverFunc) {
                var _this = this;
                if (!this.moduleManager.isModuleDefined(name)) {
                    this.discoverAmd(discoverFunc, function (dependencies, factory, amdFactory) {
                        _this.moduleManager.addModule(name, dependencies, factory, function (def) { return _this.writeAmdFactory(amdFactory, def); });
                    });
                    this.moduleManager.loadRunners();
                }
            };
            /**
             * Run a module, will execute the code in the module, the module must actually
             * run some code not just export function for this to have any effect.
             *
             * Can optionally provide a source, which can be used to filter out running modules at build time
             * for tree shaking.
             */
            Loader.prototype.run = function (name, source) {
                this.moduleManager.addRunner(name, source);
            };
            Loader.prototype.debug = function () {
                this.moduleManager.debug();
            };
            Loader.prototype.printLoaded = function () {
                this.moduleManager.printLoaded();
            };
            Loader.prototype.printUnloaded = function () {
                this.moduleManager.printUnloaded();
            };
            Loader.prototype.createFileFromLoaded = function (ignoredSources) {
                return this.moduleManager.createFileFromLoaded(ignoredSources);
            };
            Loader.prototype.writeAmdFactory = function (amdFactory, def) {
                return 'define("' + def.name + '", ' + def.getDependenciesArg(["require", "exports"]) + ', ' + amdFactory + ');\n';
            };
            Loader.prototype.require = function () {
            };
            Loader.prototype.discoverAmd = function (discoverFunc, callback) {
                var dependencies;
                var factory;
                discoverFunc(function (dep, fac) {
                    dependencies = dep;
                    factory = fac;
                });
                //Remove crap that gets added by tsc (require and exports)
                dependencies.splice(0, 2);
                //Fix up paths, remove leading ./ that tsc likes to add / need
                for (var i = 0; i < dependencies.length; ++i) {
                    var dep = dependencies[i];
                    if (dep[0] === '.' && dep[1] === '/') {
                        dependencies[i] = dep.substring(2);
                    }
                }
                callback(dependencies, function (exports, module) {
                    var args = [];
                    for (var _i = 2; _i < arguments.length; _i++) {
                        args[_i - 2] = arguments[_i];
                    }
                    args.unshift(exports);
                    args.unshift(this.require);
                    factory.apply(this, args); //This is a bit weird here, it will be the module instance from the loader, since it sets that before calling this function.
                }, factory);
            };
            return Loader;
        }());
        //Return the instance
        return new Loader(new ModuleManager(options));
    });
var jsns = jsns || jsnsDefine(jsnsOptions);
var define = define || function (name, deps, factory) {
    jsns.amd(name, function (cbDefine) {
        cbDefine(deps, factory);
    });
};
jsns.define("jdorn.json-editor", [], function (exports, module) {
    ; /*jshint loopfunc: true */
    /* Simple JavaScript Inheritance
     * By John Resig http://ejohn.org/
     * MIT Licensed.
     */
    // Inspired by base2 and Prototype
    var Class;
    (function () {
        var initializing = false, fnTest = /xyz/.test(function () { window.postMessage("xyz"); }) ? /\b_super\b/ : /.*/;
        // The base Class implementation (does nothing)
        Class = function () { };
        // Create a new Class that inherits from this class
        Class.extend = function extend(prop) {
            var _super = this.prototype;
            // Instantiate a base class (but only create the instance,
            // don't run the init constructor)
            initializing = true;
            var prototype = new this();
            initializing = false;
            // Copy the properties over onto the new prototype
            for (var name in prop) {
                // Check if we're overwriting an existing function
                prototype[name] = typeof prop[name] == "function" &&
                    typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                    (function (name, fn) {
                        return function () {
                            var tmp = this._super;
                            // Add a new ._super() method that is the same method
                            // but on the super-class
                            this._super = _super[name];
                            // The method only need to be bound temporarily, so we
                            // remove it when we're done executing
                            var ret = fn.apply(this, arguments);
                            this._super = tmp;
                            return ret;
                        };
                    })(name, prop[name]) :
                    prop[name];
            }
            // The dummy class constructor
            function Class() {
                // All construction is actually done in the init method
                if (!initializing && this.init)
                    this.init.apply(this, arguments);
            }
            // Populate our constructed prototype object
            Class.prototype = prototype;
            // Enforce the constructor to be what we expect
            Class.prototype.constructor = Class;
            // And make this class extendable
            Class.extend = extend;
            return Class;
        };
        return Class;
    })();
    ; // CustomEvent constructor polyfill
    // From MDN
    (function () {
        function CustomEvent(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
    })();
    // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
    // MIT license
    (function () {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
                window[vendors[x] + 'CancelRequestAnimationFrame'];
        }
        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function (callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
    }());
    // Array.isArray polyfill
    // From MDN
    (function () {
        if (!Array.isArray) {
            Array.isArray = function (arg) {
                return Object.prototype.toString.call(arg) === '[object Array]';
            };
        }
    }());
    ; /**
     * Taken from jQuery 2.1.3
     *
     * @param obj
     * @returns {boolean}
     */
    var $isplainobject = function (obj) {
        // Not plain objects:
        // - Any object or value whose internal [[Class]] property is not "[object Object]"
        // - DOM nodes
        // - window
        if (typeof obj !== "object" || obj.nodeType || (obj !== null && obj === obj.window)) {
            return false;
        }
        if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
            return false;
        }
        // If the function hasn't returned already, we're confident that
        // |obj| is a plain object, created by {} or constructed with new Object
        return true;
    };
    var $extend = function (destination) {
        var source, i, property;
        for (i = 1; i < arguments.length; i++) {
            source = arguments[i];
            for (property in source) {
                if (!source.hasOwnProperty(property))
                    continue;
                if (source[property] && $isplainobject(source[property])) {
                    if (!destination.hasOwnProperty(property))
                        destination[property] = {};
                    $extend(destination[property], source[property]);
                }
                else {
                    destination[property] = source[property];
                }
            }
        }
        return destination;
    };
    var $each = function (obj, callback) {
        if (!obj || typeof obj !== "object")
            return;
        var i;
        if (Array.isArray(obj) || (typeof obj.length === 'number' && obj.length > 0 && (obj.length - 1) in obj)) {
            for (i = 0; i < obj.length; i++) {
                if (callback(i, obj[i]) === false)
                    return;
            }
        }
        else {
            if (Object.keys) {
                var keys = Object.keys(obj);
                for (i = 0; i < keys.length; i++) {
                    if (callback(keys[i], obj[keys[i]]) === false)
                        return;
                }
            }
            else {
                for (i in obj) {
                    if (!obj.hasOwnProperty(i))
                        continue;
                    if (callback(i, obj[i]) === false)
                        return;
                }
            }
        }
    };
    var $trigger = function (el, event) {
        var e = document.createEvent('HTMLEvents');
        e.initEvent(event, true, true);
        el.dispatchEvent(e);
    };
    var $triggerc = function (el, event) {
        var e = new CustomEvent(event, {
            bubbles: true,
            cancelable: true
        });
        el.dispatchEvent(e);
    };
    ;
    var JSONEditor = function (element, options) {
        if (!(element instanceof Element)) {
            throw new Error('element should be an instance of Element');
        }
        options = $extend({}, JSONEditor.defaults.options, options || {});
        this.element = element;
        this.options = options;
        this.init();
    };
    JSONEditor.prototype = {
        // necessary since we remove the ctor property by doing a literal assignment. Without this
        // the $isplainobject function will think that this is a plain object.
        constructor: JSONEditor,
        init: function () {
            var self = this;
            this.ready = false;
            var theme_class = JSONEditor.defaults.themes[this.options.theme || JSONEditor.defaults.theme];
            if (!theme_class)
                throw "Unknown theme " + (this.options.theme || JSONEditor.defaults.theme);
            this.schema = this.options.schema;
            this.theme = new theme_class();
            this.template = this.options.template;
            this.refs = this.options.refs || {};
            this.uuid = 0;
            this.__data = {};
            var icon_class = JSONEditor.defaults.iconlibs[this.options.iconlib || JSONEditor.defaults.iconlib];
            if (icon_class)
                this.iconlib = new icon_class();
            this.root_container = this.theme.getContainer();
            this.element.appendChild(this.root_container);
            this.translate = this.options.translate || JSONEditor.defaults.translate;
            // Fetch all external refs via ajax
            this._loadExternalRefs(this.schema, function () {
                self._getDefinitions(self.schema);
                // Validator options
                var validator_options = {};
                if (self.options.custom_validators) {
                    validator_options.custom_validators = self.options.custom_validators;
                }
                self.validator = new JSONEditor.Validator(self, null, validator_options);
                // Create the root editor
                var editor_class = self.getEditorClass(self.schema);
                self.root = self.createEditor(editor_class, {
                    jsoneditor: self,
                    schema: self.schema,
                    required: true,
                    container: self.root_container
                });
                self.root.preBuild();
                self.root.build();
                self.root.postBuild();
                // Starting data
                if (self.options.startval)
                    self.root.setValue(self.options.startval);
                self.validation_results = self.validator.validate(self.root.getValue());
                self.root.showValidationErrors(self.validation_results);
                self.ready = true;
                // Fire ready event asynchronously
                window.requestAnimationFrame(function () {
                    if (!self.ready)
                        return;
                    self.validation_results = self.validator.validate(self.root.getValue());
                    self.root.showValidationErrors(self.validation_results);
                    self.trigger('ready');
                    self.trigger('change');
                });
            });
        },
        getValue: function () {
            if (!this.ready)
                throw "JSON Editor not ready yet.  Listen for 'ready' event before getting the value";
            return this.root.getValue();
        },
        setValue: function (value) {
            if (!this.ready)
                throw "JSON Editor not ready yet.  Listen for 'ready' event before setting the value";
            this.root.setValue(value);
            return this;
        },
        validate: function (value) {
            if (!this.ready)
                throw "JSON Editor not ready yet.  Listen for 'ready' event before validating";
            // Custom value
            if (arguments.length === 1) {
                return this.validator.validate(value);
            }
            else {
                return this.validation_results;
            }
        },
        destroy: function () {
            if (this.destroyed)
                return;
            if (!this.ready)
                return;
            this.schema = null;
            this.options = null;
            this.root.destroy();
            this.root = null;
            this.root_container = null;
            this.validator = null;
            this.validation_results = null;
            this.theme = null;
            this.iconlib = null;
            this.template = null;
            this.__data = null;
            this.ready = false;
            this.element.innerHTML = '';
            this.destroyed = true;
        },
        on: function (event, callback) {
            this.callbacks = this.callbacks || {};
            this.callbacks[event] = this.callbacks[event] || [];
            this.callbacks[event].push(callback);
            return this;
        },
        off: function (event, callback) {
            // Specific callback
            if (event && callback) {
                this.callbacks = this.callbacks || {};
                this.callbacks[event] = this.callbacks[event] || [];
                var newcallbacks = [];
                for (var i = 0; i < this.callbacks[event].length; i++) {
                    if (this.callbacks[event][i] === callback)
                        continue;
                    newcallbacks.push(this.callbacks[event][i]);
                }
                this.callbacks[event] = newcallbacks;
            }
            else if (event) {
                this.callbacks = this.callbacks || {};
                this.callbacks[event] = [];
            }
            else {
                this.callbacks = {};
            }
            return this;
        },
        trigger: function (event) {
            if (this.callbacks && this.callbacks[event] && this.callbacks[event].length) {
                for (var i = 0; i < this.callbacks[event].length; i++) {
                    this.callbacks[event][i]();
                }
            }
            return this;
        },
        setOption: function (option, value) {
            if (option === "show_errors") {
                this.options.show_errors = value;
                this.onChange();
            }
            else {
                throw "Option " + option + " must be set during instantiation and cannot be changed later";
            }
            return this;
        },
        getEditorClass: function (schema) {
            var classname;
            schema = this.expandSchema(schema);
            $each(JSONEditor.defaults.resolvers, function (i, resolver) {
                var tmp = resolver(schema);
                if (tmp) {
                    if (JSONEditor.defaults.editors[tmp]) {
                        classname = tmp;
                        return false;
                    }
                }
            });
            if (!classname)
                throw "Unknown editor for schema " + JSON.stringify(schema);
            if (!JSONEditor.defaults.editors[classname])
                throw "Unknown editor " + classname;
            return JSONEditor.defaults.editors[classname];
        },
        createEditor: function (editor_class, options) {
            options = $extend({}, editor_class.options || {}, options);
            return new editor_class(options);
        },
        onChange: function () {
            if (!this.ready)
                return;
            if (this.firing_change)
                return;
            this.firing_change = true;
            var self = this;
            window.requestAnimationFrame(function () {
                self.firing_change = false;
                if (!self.ready)
                    return;
                // Validate and cache results
                self.validation_results = self.validator.validate(self.root.getValue());
                if (self.options.show_errors !== "never") {
                    self.root.showValidationErrors(self.validation_results);
                }
                else {
                    self.root.showValidationErrors([]);
                }
                // Fire change event
                self.trigger('change');
            });
            return this;
        },
        compileTemplate: function (template, name) {
            name = name || JSONEditor.defaults.template;
            var engine;
            // Specifying a preset engine
            if (typeof name === 'string') {
                if (!JSONEditor.defaults.templates[name])
                    throw "Unknown template engine " + name;
                engine = JSONEditor.defaults.templates[name]();
                if (!engine)
                    throw "Template engine " + name + " missing required library.";
            }
            else {
                engine = name;
            }
            if (!engine)
                throw "No template engine set";
            if (!engine.compile)
                throw "Invalid template engine set";
            return engine.compile(template);
        },
        _data: function (el, key, value) {
            // Setting data
            if (arguments.length === 3) {
                var uuid;
                if (el.hasAttribute('data-jsoneditor-' + key)) {
                    uuid = el.getAttribute('data-jsoneditor-' + key);
                }
                else {
                    uuid = this.uuid++;
                    el.setAttribute('data-jsoneditor-' + key, uuid);
                }
                this.__data[uuid] = value;
            }
            else {
                // No data stored
                if (!el.hasAttribute('data-jsoneditor-' + key))
                    return null;
                return this.__data[el.getAttribute('data-jsoneditor-' + key)];
            }
        },
        registerEditor: function (editor) {
            this.editors = this.editors || {};
            this.editors[editor.path] = editor;
            return this;
        },
        unregisterEditor: function (editor) {
            this.editors = this.editors || {};
            this.editors[editor.path] = null;
            return this;
        },
        getEditor: function (path) {
            if (!this.editors)
                return;
            return this.editors[path];
        },
        watch: function (path, callback) {
            this.watchlist = this.watchlist || {};
            this.watchlist[path] = this.watchlist[path] || [];
            this.watchlist[path].push(callback);
            return this;
        },
        unwatch: function (path, callback) {
            if (!this.watchlist || !this.watchlist[path])
                return this;
            // If removing all callbacks for a path
            if (!callback) {
                this.watchlist[path] = null;
                return this;
            }
            var newlist = [];
            for (var i = 0; i < this.watchlist[path].length; i++) {
                if (this.watchlist[path][i] === callback)
                    continue;
                else
                    newlist.push(this.watchlist[path][i]);
            }
            this.watchlist[path] = newlist.length ? newlist : null;
            return this;
        },
        notifyWatchers: function (path) {
            if (!this.watchlist || !this.watchlist[path])
                return this;
            for (var i = 0; i < this.watchlist[path].length; i++) {
                this.watchlist[path][i]();
            }
        },
        isEnabled: function () {
            return !this.root || this.root.isEnabled();
        },
        enable: function () {
            this.root.enable();
        },
        disable: function () {
            this.root.disable();
        },
        _getDefinitions: function (schema, path) {
            path = path || '#/definitions/';
            if (schema.definitions) {
                for (var i in schema.definitions) {
                    if (!schema.definitions.hasOwnProperty(i))
                        continue;
                    this.refs[path + i] = schema.definitions[i];
                    if (schema.definitions[i].definitions) {
                        this._getDefinitions(schema.definitions[i], path + i + '/definitions/');
                    }
                }
            }
        },
        _getExternalRefs: function (schema) {
            var refs = {};
            var merge_refs = function (newrefs) {
                for (var i in newrefs) {
                    if (newrefs.hasOwnProperty(i)) {
                        refs[i] = true;
                    }
                }
            };
            if (schema.$ref && typeof schema.$ref !== "object" && schema.$ref.substr(0, 1) !== "#" && !this.refs[schema.$ref]) {
                refs[schema.$ref] = true;
            }
            for (var i in schema) {
                if (!schema.hasOwnProperty(i))
                    continue;
                if (schema[i] && typeof schema[i] === "object" && Array.isArray(schema[i])) {
                    for (var j = 0; j < schema[i].length; j++) {
                        if (typeof schema[i][j] === "object") {
                            merge_refs(this._getExternalRefs(schema[i][j]));
                        }
                    }
                }
                else if (schema[i] && typeof schema[i] === "object") {
                    merge_refs(this._getExternalRefs(schema[i]));
                }
            }
            return refs;
        },
        _loadExternalRefs: function (schema, callback) {
            var self = this;
            var refs = this._getExternalRefs(schema);
            var done = 0, waiting = 0, callback_fired = false;
            $each(refs, function (url) {
                if (self.refs[url])
                    return;
                if (!self.options.ajax)
                    throw "Must set ajax option to true to load external ref " + url;
                self.refs[url] = 'loading';
                waiting++;
                var r = new XMLHttpRequest();
                r.open("GET", url, true);
                r.onreadystatechange = function () {
                    if (r.readyState != 4)
                        return;
                    // Request succeeded
                    if (r.status === 200) {
                        var response;
                        try {
                            response = JSON.parse(r.responseText);
                        }
                        catch (e) {
                            window.console.log(e);
                            throw "Failed to parse external ref " + url;
                        }
                        if (!response || typeof response !== "object")
                            throw "External ref does not contain a valid schema - " + url;
                        self.refs[url] = response;
                        self._loadExternalRefs(response, function () {
                            done++;
                            if (done >= waiting && !callback_fired) {
                                callback_fired = true;
                                callback();
                            }
                        });
                    }
                    else {
                        window.console.log(r);
                        throw "Failed to fetch ref via ajax- " + url;
                    }
                };
                r.send();
            });
            if (!waiting) {
                callback();
            }
        },
        expandRefs: function (schema) {
            schema = $extend({}, schema);
            while (schema.$ref) {
                var ref = schema.$ref;
                delete schema.$ref;
                if (!this.refs[ref])
                    ref = decodeURIComponent(ref);
                schema = this.extendSchemas(schema, this.refs[ref]);
            }
            return schema;
        },
        expandSchema: function (schema) {
            var self = this;
            var extended = $extend({}, schema);
            var i;
            // Version 3 `type`
            if (typeof schema.type === 'object') {
                // Array of types
                if (Array.isArray(schema.type)) {
                    $each(schema.type, function (key, value) {
                        // Schema
                        if (typeof value === 'object') {
                            schema.type[key] = self.expandSchema(value);
                        }
                    });
                }
                else {
                    schema.type = self.expandSchema(schema.type);
                }
            }
            // Version 3 `disallow`
            if (typeof schema.disallow === 'object') {
                // Array of types
                if (Array.isArray(schema.disallow)) {
                    $each(schema.disallow, function (key, value) {
                        // Schema
                        if (typeof value === 'object') {
                            schema.disallow[key] = self.expandSchema(value);
                        }
                    });
                }
                else {
                    schema.disallow = self.expandSchema(schema.disallow);
                }
            }
            // Version 4 `anyOf`
            if (schema.anyOf) {
                $each(schema.anyOf, function (key, value) {
                    schema.anyOf[key] = self.expandSchema(value);
                });
            }
            // Version 4 `dependencies` (schema dependencies)
            if (schema.dependencies) {
                $each(schema.dependencies, function (key, value) {
                    if (typeof value === "object" && !(Array.isArray(value))) {
                        schema.dependencies[key] = self.expandSchema(value);
                    }
                });
            }
            // Version 4 `not`
            if (schema.not) {
                schema.not = this.expandSchema(schema.not);
            }
            // allOf schemas should be merged into the parent
            if (schema.allOf) {
                for (i = 0; i < schema.allOf.length; i++) {
                    extended = this.extendSchemas(extended, this.expandSchema(schema.allOf[i]));
                }
                delete extended.allOf;
            }
            // extends schemas should be merged into parent
            if (schema["extends"]) {
                // If extends is a schema
                if (!(Array.isArray(schema["extends"]))) {
                    extended = this.extendSchemas(extended, this.expandSchema(schema["extends"]));
                }
                else {
                    for (i = 0; i < schema["extends"].length; i++) {
                        extended = this.extendSchemas(extended, this.expandSchema(schema["extends"][i]));
                    }
                }
                delete extended["extends"];
            }
            // parent should be merged into oneOf schemas
            if (schema.oneOf) {
                var tmp = $extend({}, extended);
                delete tmp.oneOf;
                for (i = 0; i < schema.oneOf.length; i++) {
                    extended.oneOf[i] = this.extendSchemas(this.expandSchema(schema.oneOf[i]), tmp);
                }
            }
            return this.expandRefs(extended);
        },
        extendSchemas: function (obj1, obj2) {
            obj1 = $extend({}, obj1);
            obj2 = $extend({}, obj2);
            var self = this;
            var extended = {};
            $each(obj1, function (prop, val) {
                // If this key is also defined in obj2, merge them
                if (typeof obj2[prop] !== "undefined") {
                    // Required and defaultProperties arrays should be unioned together
                    if ((prop === 'required' || prop === 'defaultProperties') && typeof val === "object" && Array.isArray(val)) {
                        // Union arrays and unique
                        extended[prop] = val.concat(obj2[prop]).reduce(function (p, c) {
                            if (p.indexOf(c) < 0)
                                p.push(c);
                            return p;
                        }, []);
                    }
                    else if (prop === 'type' && (typeof val === "string" || Array.isArray(val))) {
                        // Make sure we're dealing with arrays
                        if (typeof val === "string")
                            val = [val];
                        if (typeof obj2.type === "string")
                            obj2.type = [obj2.type];
                        // If type is only defined in the first schema, keep it
                        if (!obj2.type || !obj2.type.length) {
                            extended.type = val;
                        }
                        else {
                            extended.type = val.filter(function (n) {
                                return obj2.type.indexOf(n) !== -1;
                            });
                        }
                        // If there's only 1 type and it's a primitive, use a string instead of array
                        if (extended.type.length === 1 && typeof extended.type[0] === "string") {
                            extended.type = extended.type[0];
                        }
                        else if (extended.type.length === 0) {
                            delete extended.type;
                        }
                    }
                    else if (typeof val === "object" && Array.isArray(val)) {
                        extended[prop] = val.filter(function (n) {
                            return obj2[prop].indexOf(n) !== -1;
                        });
                    }
                    else if (typeof val === "object" && val !== null) {
                        extended[prop] = self.extendSchemas(val, obj2[prop]);
                    }
                    else {
                        extended[prop] = val;
                    }
                }
                else {
                    extended[prop] = val;
                }
            });
            // Properties in obj2 that aren't in obj1
            $each(obj2, function (prop, val) {
                if (typeof obj1[prop] === "undefined") {
                    extended[prop] = val;
                }
            });
            return extended;
        }
    };
    JSONEditor.defaults = {
        themes: {},
        templates: {},
        iconlibs: {},
        editors: {},
        languages: {},
        resolvers: [],
        custom_validators: []
    };
    ;
    JSONEditor.Validator = Class.extend({
        init: function (jsoneditor, schema, options) {
            this.jsoneditor = jsoneditor;
            this.schema = schema || this.jsoneditor.schema;
            this.options = options || {};
            this.translate = this.jsoneditor.translate || JSONEditor.defaults.translate;
        },
        validate: function (value) {
            return this._validateSchema(this.schema, value);
        },
        _validateSchema: function (schema, value, path) {
            var self = this;
            var errors = [];
            var valid, i, j;
            var stringified = JSON.stringify(value);
            path = path || 'root';
            // Work on a copy of the schema
            schema = $extend({}, this.jsoneditor.expandRefs(schema));
            /*
             * Type Agnostic Validation
             */
            // Version 3 `required`
            if (schema.required && schema.required === true) {
                if (typeof value === "undefined") {
                    errors.push({
                        path: path,
                        property: 'required',
                        message: this.translate("error_notset")
                    });
                    // Can't do any more validation at this point
                    return errors;
                }
            }
            else if (typeof value === "undefined") {
                // If required_by_default is set, all fields are required
                if (this.jsoneditor.options.required_by_default) {
                    errors.push({
                        path: path,
                        property: 'required',
                        message: this.translate("error_notset")
                    });
                }
                else {
                    return errors;
                }
            }
            // `enum`
            if (schema["enum"]) {
                valid = false;
                for (i = 0; i < schema["enum"].length; i++) {
                    if (stringified === JSON.stringify(schema["enum"][i]))
                        valid = true;
                }
                if (!valid) {
                    errors.push({
                        path: path,
                        property: 'enum',
                        message: this.translate("error_enum")
                    });
                }
            }
            // `extends` (version 3)
            if (schema["extends"]) {
                for (i = 0; i < schema["extends"].length; i++) {
                    errors = errors.concat(this._validateSchema(schema["extends"][i], value, path));
                }
            }
            // `allOf`
            if (schema.allOf) {
                for (i = 0; i < schema.allOf.length; i++) {
                    errors = errors.concat(this._validateSchema(schema.allOf[i], value, path));
                }
            }
            // `anyOf`
            if (schema.anyOf) {
                valid = false;
                for (i = 0; i < schema.anyOf.length; i++) {
                    if (!this._validateSchema(schema.anyOf[i], value, path).length) {
                        valid = true;
                        break;
                    }
                }
                if (!valid) {
                    errors.push({
                        path: path,
                        property: 'anyOf',
                        message: this.translate('error_anyOf')
                    });
                }
            }
            // `oneOf`
            if (schema.oneOf) {
                valid = 0;
                var oneof_errors = [];
                for (i = 0; i < schema.oneOf.length; i++) {
                    // Set the error paths to be path.oneOf[i].rest.of.path
                    var tmp = this._validateSchema(schema.oneOf[i], value, path);
                    if (!tmp.length) {
                        valid++;
                    }
                    for (j = 0; j < tmp.length; j++) {
                        tmp[j].path = path + '.oneOf[' + i + ']' + tmp[j].path.substr(path.length);
                    }
                    oneof_errors = oneof_errors.concat(tmp);
                }
                if (valid !== 1) {
                    errors.push({
                        path: path,
                        property: 'oneOf',
                        message: this.translate('error_oneOf', [valid])
                    });
                    errors = errors.concat(oneof_errors);
                }
            }
            // `not`
            if (schema.not) {
                if (!this._validateSchema(schema.not, value, path).length) {
                    errors.push({
                        path: path,
                        property: 'not',
                        message: this.translate('error_not')
                    });
                }
            }
            // `type` (both Version 3 and Version 4 support)
            if (schema.type) {
                // Union type
                if (Array.isArray(schema.type)) {
                    valid = false;
                    for (i = 0; i < schema.type.length; i++) {
                        if (this._checkType(schema.type[i], value)) {
                            valid = true;
                            break;
                        }
                    }
                    if (!valid) {
                        errors.push({
                            path: path,
                            property: 'type',
                            message: this.translate('error_type_union')
                        });
                    }
                }
                else {
                    if (!this._checkType(schema.type, value)) {
                        errors.push({
                            path: path,
                            property: 'type',
                            message: this.translate('error_type', [schema.type])
                        });
                    }
                }
            }
            // `disallow` (version 3)
            if (schema.disallow) {
                // Union type
                if (Array.isArray(schema.disallow)) {
                    valid = true;
                    for (i = 0; i < schema.disallow.length; i++) {
                        if (this._checkType(schema.disallow[i], value)) {
                            valid = false;
                            break;
                        }
                    }
                    if (!valid) {
                        errors.push({
                            path: path,
                            property: 'disallow',
                            message: this.translate('error_disallow_union')
                        });
                    }
                }
                else {
                    if (this._checkType(schema.disallow, value)) {
                        errors.push({
                            path: path,
                            property: 'disallow',
                            message: this.translate('error_disallow', [schema.disallow])
                        });
                    }
                }
            }
            /*
             * Type Specific Validation
             */
            // Number Specific Validation
            if (typeof value === "number") {
                // `multipleOf` and `divisibleBy`
                if (schema.multipleOf || schema.divisibleBy) {
                    var divisor = schema.multipleOf || schema.divisibleBy;
                    // Vanilla JS, prone to floating point rounding errors (e.g. 1.14 / .01 == 113.99999)
                    valid = (value / divisor === Math.floor(value / divisor));
                    // Use math.js is available
                    if (window.math) {
                        valid = window.math.mod(window.math.bignumber(value), window.math.bignumber(divisor)).equals(0);
                    }
                    else if (window.Decimal) {
                        valid = (new window.Decimal(value)).mod(new window.Decimal(divisor)).equals(0);
                    }
                    if (!valid) {
                        errors.push({
                            path: path,
                            property: schema.multipleOf ? 'multipleOf' : 'divisibleBy',
                            message: this.translate('error_multipleOf', [divisor])
                        });
                    }
                }
                // `maximum`
                if (schema.hasOwnProperty('maximum')) {
                    // Vanilla JS, prone to floating point rounding errors (e.g. .999999999999999 == 1)
                    valid = schema.exclusiveMaximum ? (value < schema.maximum) : (value <= schema.maximum);
                    // Use math.js is available
                    if (window.math) {
                        valid = window.math[schema.exclusiveMaximum ? 'smaller' : 'smallerEq'](window.math.bignumber(value), window.math.bignumber(schema.maximum));
                    }
                    else if (window.Decimal) {
                        valid = (new window.Decimal(value))[schema.exclusiveMaximum ? 'lt' : 'lte'](new window.Decimal(schema.maximum));
                    }
                    if (!valid) {
                        errors.push({
                            path: path,
                            property: 'maximum',
                            message: this.translate((schema.exclusiveMaximum ? 'error_maximum_excl' : 'error_maximum_incl'), [schema.maximum])
                        });
                    }
                }
                // `minimum`
                if (schema.hasOwnProperty('minimum')) {
                    // Vanilla JS, prone to floating point rounding errors (e.g. .999999999999999 == 1)
                    valid = schema.exclusiveMinimum ? (value > schema.minimum) : (value >= schema.minimum);
                    // Use math.js is available
                    if (window.math) {
                        valid = window.math[schema.exclusiveMinimum ? 'larger' : 'largerEq'](window.math.bignumber(value), window.math.bignumber(schema.minimum));
                    }
                    else if (window.Decimal) {
                        valid = (new window.Decimal(value))[schema.exclusiveMinimum ? 'gt' : 'gte'](new window.Decimal(schema.minimum));
                    }
                    if (!valid) {
                        errors.push({
                            path: path,
                            property: 'minimum',
                            message: this.translate((schema.exclusiveMinimum ? 'error_minimum_excl' : 'error_minimum_incl'), [schema.minimum])
                        });
                    }
                }
            }
            else if (typeof value === "string") {
                // `maxLength`
                if (schema.maxLength) {
                    if ((value + "").length > schema.maxLength) {
                        errors.push({
                            path: path,
                            property: 'maxLength',
                            message: this.translate('error_maxLength', [schema.maxLength])
                        });
                    }
                }
                // `minLength`
                if (schema.minLength) {
                    if ((value + "").length < schema.minLength) {
                        errors.push({
                            path: path,
                            property: 'minLength',
                            message: this.translate((schema.minLength === 1 ? 'error_notempty' : 'error_minLength'), [schema.minLength])
                        });
                    }
                }
                // `pattern`
                if (schema.pattern) {
                    if (!(new RegExp(schema.pattern)).test(value)) {
                        errors.push({
                            path: path,
                            property: 'pattern',
                            message: this.translate('error_pattern', [schema.pattern])
                        });
                    }
                }
            }
            else if (typeof value === "object" && value !== null && Array.isArray(value)) {
                // `items` and `additionalItems`
                if (schema.items) {
                    // `items` is an array
                    if (Array.isArray(schema.items)) {
                        for (i = 0; i < value.length; i++) {
                            // If this item has a specific schema tied to it
                            // Validate against it
                            if (schema.items[i]) {
                                errors = errors.concat(this._validateSchema(schema.items[i], value[i], path + '.' + i));
                            }
                            else if (schema.additionalItems === true) {
                                break;
                            }
                            else if (schema.additionalItems) {
                                errors = errors.concat(this._validateSchema(schema.additionalItems, value[i], path + '.' + i));
                            }
                            else if (schema.additionalItems === false) {
                                errors.push({
                                    path: path,
                                    property: 'additionalItems',
                                    message: this.translate('error_additionalItems')
                                });
                                break;
                            }
                            else {
                                break;
                            }
                        }
                    }
                    else {
                        // Each item in the array must validate against the schema
                        for (i = 0; i < value.length; i++) {
                            errors = errors.concat(this._validateSchema(schema.items, value[i], path + '.' + i));
                        }
                    }
                }
                // `maxItems`
                if (schema.maxItems) {
                    if (value.length > schema.maxItems) {
                        errors.push({
                            path: path,
                            property: 'maxItems',
                            message: this.translate('error_maxItems', [schema.maxItems])
                        });
                    }
                }
                // `minItems`
                if (schema.minItems) {
                    if (value.length < schema.minItems) {
                        errors.push({
                            path: path,
                            property: 'minItems',
                            message: this.translate('error_minItems', [schema.minItems])
                        });
                    }
                }
                // `uniqueItems`
                if (schema.uniqueItems) {
                    var seen = {};
                    for (i = 0; i < value.length; i++) {
                        valid = JSON.stringify(value[i]);
                        if (seen[valid]) {
                            errors.push({
                                path: path,
                                property: 'uniqueItems',
                                message: this.translate('error_uniqueItems')
                            });
                            break;
                        }
                        seen[valid] = true;
                    }
                }
            }
            else if (typeof value === "object" && value !== null) {
                // `maxProperties`
                if (schema.maxProperties) {
                    valid = 0;
                    for (i in value) {
                        if (!value.hasOwnProperty(i))
                            continue;
                        valid++;
                    }
                    if (valid > schema.maxProperties) {
                        errors.push({
                            path: path,
                            property: 'maxProperties',
                            message: this.translate('error_maxProperties', [schema.maxProperties])
                        });
                    }
                }
                // `minProperties`
                if (schema.minProperties) {
                    valid = 0;
                    for (i in value) {
                        if (!value.hasOwnProperty(i))
                            continue;
                        valid++;
                    }
                    if (valid < schema.minProperties) {
                        errors.push({
                            path: path,
                            property: 'minProperties',
                            message: this.translate('error_minProperties', [schema.minProperties])
                        });
                    }
                }
                // Version 4 `required`
                if (schema.required && Array.isArray(schema.required)) {
                    for (i = 0; i < schema.required.length; i++) {
                        if (typeof value[schema.required[i]] === "undefined") {
                            errors.push({
                                path: path,
                                property: 'required',
                                message: this.translate('error_required', [schema.required[i]])
                            });
                        }
                    }
                }
                // `properties`
                var validated_properties = {};
                if (schema.properties) {
                    for (i in schema.properties) {
                        if (!schema.properties.hasOwnProperty(i))
                            continue;
                        validated_properties[i] = true;
                        errors = errors.concat(this._validateSchema(schema.properties[i], value[i], path + '.' + i));
                    }
                }
                // `patternProperties`
                if (schema.patternProperties) {
                    for (i in schema.patternProperties) {
                        if (!schema.patternProperties.hasOwnProperty(i))
                            continue;
                        var regex = new RegExp(i);
                        // Check which properties match
                        for (j in value) {
                            if (!value.hasOwnProperty(j))
                                continue;
                            if (regex.test(j)) {
                                validated_properties[j] = true;
                                errors = errors.concat(this._validateSchema(schema.patternProperties[i], value[j], path + '.' + j));
                            }
                        }
                    }
                }
                // The no_additional_properties option currently doesn't work with extended schemas that use oneOf or anyOf
                if (typeof schema.additionalProperties === "undefined" && this.jsoneditor.options.no_additional_properties && !schema.oneOf && !schema.anyOf) {
                    schema.additionalProperties = false;
                }
                // `additionalProperties`
                if (typeof schema.additionalProperties !== "undefined") {
                    for (i in value) {
                        if (!value.hasOwnProperty(i))
                            continue;
                        if (!validated_properties[i]) {
                            // No extra properties allowed
                            if (!schema.additionalProperties) {
                                errors.push({
                                    path: path,
                                    property: 'additionalProperties',
                                    message: this.translate('error_additional_properties', [i])
                                });
                                break;
                            }
                            else if (schema.additionalProperties === true) {
                                break;
                            }
                            else {
                                errors = errors.concat(this._validateSchema(schema.additionalProperties, value[i], path + '.' + i));
                            }
                        }
                    }
                }
                // `dependencies`
                if (schema.dependencies) {
                    for (i in schema.dependencies) {
                        if (!schema.dependencies.hasOwnProperty(i))
                            continue;
                        // Doesn't need to meet the dependency
                        if (typeof value[i] === "undefined")
                            continue;
                        // Property dependency
                        if (Array.isArray(schema.dependencies[i])) {
                            for (j = 0; j < schema.dependencies[i].length; j++) {
                                if (typeof value[schema.dependencies[i][j]] === "undefined") {
                                    errors.push({
                                        path: path,
                                        property: 'dependencies',
                                        message: this.translate('error_dependency', [schema.dependencies[i][j]])
                                    });
                                }
                            }
                        }
                        else {
                            errors = errors.concat(this._validateSchema(schema.dependencies[i], value, path));
                        }
                    }
                }
            }
            // Custom type validation (global)
            $each(JSONEditor.defaults.custom_validators, function (i, validator) {
                errors = errors.concat(validator.call(self, schema, value, path));
            });
            // Custom type validation (instance specific)
            if (this.options.custom_validators) {
                $each(this.options.custom_validators, function (i, validator) {
                    errors = errors.concat(validator.call(self, schema, value, path));
                });
            }
            return errors;
        },
        _checkType: function (type, value) {
            // Simple types
            if (typeof type === "string") {
                if (type === "string")
                    return typeof value === "string";
                else if (type === "number")
                    return typeof value === "number";
                else if (type === "integer")
                    return typeof value === "number" && value === Math.floor(value);
                else if (type === "boolean")
                    return typeof value === "boolean";
                else if (type === "array")
                    return Array.isArray(value);
                else if (type === "object")
                    return value !== null && !(Array.isArray(value)) && typeof value === "object";
                else if (type === "null")
                    return value === null;
                else
                    return true;
            }
            else {
                return !this._validateSchema(type, value).length;
            }
        }
    });
    ; /**
     * All editors should extend from this class
     */
    JSONEditor.AbstractEditor = Class.extend({
        onChildEditorChange: function (editor) {
            this.onChange(true);
        },
        notify: function () {
            this.jsoneditor.notifyWatchers(this.path);
        },
        change: function () {
            if (this.parent)
                this.parent.onChildEditorChange(this);
            else
                this.jsoneditor.onChange();
        },
        onChange: function (bubble) {
            this.notify();
            if (this.watch_listener)
                this.watch_listener();
            if (bubble)
                this.change();
        },
        register: function () {
            this.jsoneditor.registerEditor(this);
            this.onChange();
        },
        unregister: function () {
            if (!this.jsoneditor)
                return;
            this.jsoneditor.unregisterEditor(this);
        },
        getNumColumns: function () {
            return 12;
        },
        init: function (options) {
            this.jsoneditor = options.jsoneditor;
            this.theme = this.jsoneditor.theme;
            this.template_engine = this.jsoneditor.template;
            this.iconlib = this.jsoneditor.iconlib;
            this.translate = this.jsoneditor.translate || JSONEditor.defaults.translate;
            this.original_schema = options.schema;
            this.schema = this.jsoneditor.expandSchema(this.original_schema);
            this.options = $extend({}, (this.options || {}), (options.schema.options || {}), options);
            if (!options.path && !this.schema.id)
                this.schema.id = 'root';
            this.path = options.path || 'root';
            this.formname = options.formname || this.path.replace(/\.([^.]+)/g, '[$1]');
            if (this.jsoneditor.options.form_name_root)
                this.formname = this.formname.replace(/^root\[/, this.jsoneditor.options.form_name_root + '[');
            this.key = this.path.split('.').pop();
            this.parent = options.parent;
            this.link_watchers = [];
            if (options.container)
                this.setContainer(options.container);
        },
        setContainer: function (container) {
            this.container = container;
            if (this.schema.id)
                this.container.setAttribute('data-schemaid', this.schema.id);
            if (this.schema.type && typeof this.schema.type === "string")
                this.container.setAttribute('data-schematype', this.schema.type);
            this.container.setAttribute('data-schemapath', this.path);
        },
        preBuild: function () {
        },
        build: function () {
        },
        postBuild: function () {
            this.setupWatchListeners();
            this.addLinks();
            this.setValue(this.getDefault(), true);
            this.updateHeaderText();
            this.register();
            this.onWatchedFieldChange();
        },
        setupWatchListeners: function () {
            var self = this;
            // Watched fields
            this.watched = {};
            if (this.schema.vars)
                this.schema.watch = this.schema.vars;
            this.watched_values = {};
            this.watch_listener = function () {
                if (self.refreshWatchedFieldValues()) {
                    self.onWatchedFieldChange();
                }
            };
            this.register();
            if (this.schema.hasOwnProperty('watch')) {
                var path, path_parts, first, root, adjusted_path;
                for (var name in this.schema.watch) {
                    if (!this.schema.watch.hasOwnProperty(name))
                        continue;
                    path = this.schema.watch[name];
                    if (Array.isArray(path)) {
                        if (path.length < 2)
                            continue;
                        path_parts = [path[0]].concat(path[1].split('.'));
                    }
                    else {
                        path_parts = path.split('.');
                        if (!self.theme.closest(self.container, '[data-schemaid="' + path_parts[0] + '"]'))
                            path_parts.unshift('#');
                    }
                    first = path_parts.shift();
                    if (first === '#')
                        first = self.jsoneditor.schema.id || 'root';
                    // Find the root node for this template variable
                    root = self.theme.closest(self.container, '[data-schemaid="' + first + '"]');
                    if (!root)
                        throw "Could not find ancestor node with id " + first;
                    // Keep track of the root node and path for use when rendering the template
                    adjusted_path = root.getAttribute('data-schemapath') + '.' + path_parts.join('.');
                    self.jsoneditor.watch(adjusted_path, self.watch_listener);
                    self.watched[name] = adjusted_path;
                }
            }
            // Dynamic header
            if (this.schema.headerTemplate) {
                this.header_template = this.jsoneditor.compileTemplate(this.schema.headerTemplate, this.template_engine);
            }
        },
        addLinks: function () {
            // Add links
            if (!this.no_link_holder) {
                this.link_holder = this.theme.getLinksHolder();
                this.container.appendChild(this.link_holder);
                if (this.schema.links) {
                    for (var i = 0; i < this.schema.links.length; i++) {
                        this.addLink(this.getLink(this.schema.links[i]));
                    }
                }
            }
        },
        getButton: function (text, icon, title) {
            var btnClass = 'json-editor-btn-' + icon;
            if (!this.iconlib)
                icon = null;
            else
                icon = this.iconlib.getIcon(icon);
            if (!icon && title) {
                text = title;
                title = null;
            }
            var btn = this.theme.getButton(text, icon, title);
            btn.className += ' ' + btnClass + ' ';
            return btn;
        },
        setButtonText: function (button, text, icon, title) {
            if (!this.iconlib)
                icon = null;
            else
                icon = this.iconlib.getIcon(icon);
            if (!icon && title) {
                text = title;
                title = null;
            }
            return this.theme.setButtonText(button, text, icon, title);
        },
        addLink: function (link) {
            if (this.link_holder)
                this.link_holder.appendChild(link);
        },
        getLink: function (data) {
            var holder, link;
            // Get mime type of the link
            var mime = data.mediaType || 'application/javascript';
            var type = mime.split('/')[0];
            // Template to generate the link href
            var href = this.jsoneditor.compileTemplate(data.href, this.template_engine);
            // Template to generate the link's download attribute
            var download = null;
            if (data.download)
                download = data.download;
            if (download && download !== true) {
                download = this.jsoneditor.compileTemplate(download, this.template_engine);
            }
            // Image links
            if (type === 'image') {
                holder = this.theme.getBlockLinkHolder();
                link = document.createElement('a');
                link.setAttribute('target', '_blank');
                var image = document.createElement('img');
                this.theme.createImageLink(holder, link, image);
                // When a watched field changes, update the url  
                this.link_watchers.push(function (vars) {
                    var url = href(vars);
                    link.setAttribute('href', url);
                    link.setAttribute('title', data.rel || url);
                    image.setAttribute('src', url);
                });
            }
            else if (['audio', 'video'].indexOf(type) >= 0) {
                holder = this.theme.getBlockLinkHolder();
                link = this.theme.getBlockLink();
                link.setAttribute('target', '_blank');
                var media = document.createElement(type);
                media.setAttribute('controls', 'controls');
                this.theme.createMediaLink(holder, link, media);
                // When a watched field changes, update the url  
                this.link_watchers.push(function (vars) {
                    var url = href(vars);
                    link.setAttribute('href', url);
                    link.textContent = data.rel || url;
                    media.setAttribute('src', url);
                });
            }
            else {
                link = holder = this.theme.getBlockLink();
                holder.setAttribute('target', '_blank');
                holder.textContent = data.rel;
                // When a watched field changes, update the url
                this.link_watchers.push(function (vars) {
                    var url = href(vars);
                    holder.setAttribute('href', url);
                    holder.textContent = data.rel || url;
                });
            }
            if (download && link) {
                if (download === true) {
                    link.setAttribute('download', '');
                }
                else {
                    this.link_watchers.push(function (vars) {
                        link.setAttribute('download', download(vars));
                    });
                }
            }
            if (data.class)
                link.className = link.className + ' ' + data.class;
            return holder;
        },
        refreshWatchedFieldValues: function () {
            if (!this.watched_values)
                return;
            var watched = {};
            var changed = false;
            var self = this;
            if (this.watched) {
                var val, editor;
                for (var name in this.watched) {
                    if (!this.watched.hasOwnProperty(name))
                        continue;
                    editor = self.jsoneditor.getEditor(this.watched[name]);
                    val = editor ? editor.getValue() : null;
                    if (self.watched_values[name] !== val)
                        changed = true;
                    watched[name] = val;
                }
            }
            watched.self = this.getValue();
            if (this.watched_values.self !== watched.self)
                changed = true;
            this.watched_values = watched;
            return changed;
        },
        getWatchedFieldValues: function () {
            return this.watched_values;
        },
        updateHeaderText: function () {
            if (this.header) {
                // If the header has children, only update the text node's value
                if (this.header.children.length) {
                    for (var i = 0; i < this.header.childNodes.length; i++) {
                        if (this.header.childNodes[i].nodeType === 3) {
                            this.header.childNodes[i].nodeValue = this.getHeaderText();
                            break;
                        }
                    }
                }
                else {
                    this.header.textContent = this.getHeaderText();
                }
            }
        },
        getHeaderText: function (title_only) {
            if (this.header_text)
                return this.header_text;
            else if (title_only)
                return this.schema.title;
            else
                return this.getTitle();
        },
        onWatchedFieldChange: function () {
            var vars;
            if (this.header_template) {
                vars = $extend(this.getWatchedFieldValues(), {
                    key: this.key,
                    i: this.key,
                    i0: (this.key * 1),
                    i1: (this.key * 1 + 1),
                    title: this.getTitle()
                });
                var header_text = this.header_template(vars);
                if (header_text !== this.header_text) {
                    this.header_text = header_text;
                    this.updateHeaderText();
                    this.notify();
                    //this.fireChangeHeaderEvent();
                }
            }
            if (this.link_watchers.length) {
                vars = this.getWatchedFieldValues();
                for (var i = 0; i < this.link_watchers.length; i++) {
                    this.link_watchers[i](vars);
                }
            }
        },
        setValue: function (value) {
            this.value = value;
        },
        getValue: function () {
            return this.value;
        },
        refreshValue: function () {
        },
        getChildEditors: function () {
            return false;
        },
        destroy: function () {
            var self = this;
            this.unregister(this);
            $each(this.watched, function (name, adjusted_path) {
                self.jsoneditor.unwatch(adjusted_path, self.watch_listener);
            });
            this.watched = null;
            this.watched_values = null;
            this.watch_listener = null;
            this.header_text = null;
            this.header_template = null;
            this.value = null;
            if (this.container && this.container.parentNode)
                this.container.parentNode.removeChild(this.container);
            this.container = null;
            this.jsoneditor = null;
            this.schema = null;
            this.path = null;
            this.key = null;
            this.parent = null;
        },
        getDefault: function () {
            if (this.schema["default"])
                return this.schema["default"];
            if (this.schema["enum"])
                return this.schema["enum"][0];
            var type = this.schema.type || this.schema.oneOf;
            if (type && Array.isArray(type))
                type = type[0];
            if (type && typeof type === "object")
                type = type.type;
            if (type && Array.isArray(type))
                type = type[0];
            if (typeof type === "string") {
                if (type === "number")
                    return 0.0;
                if (type === "boolean")
                    return false;
                if (type === "integer")
                    return 0;
                if (type === "string")
                    return "";
                if (type === "object")
                    return {};
                if (type === "array")
                    return [];
            }
            return null;
        },
        getTitle: function () {
            return this.schema.title || this.key;
        },
        enable: function () {
            this.disabled = false;
        },
        disable: function () {
            this.disabled = true;
        },
        isEnabled: function () {
            return !this.disabled;
        },
        isRequired: function () {
            if (typeof this.schema.required === "boolean")
                return this.schema.required;
            else if (this.parent && this.parent.schema && Array.isArray(this.parent.schema.required))
                return this.parent.schema.required.indexOf(this.key) > -1;
            else if (this.jsoneditor.options.required_by_default)
                return true;
            else
                return false;
        },
        getDisplayText: function (arr) {
            var disp = [];
            var used = {};
            // Determine how many times each attribute name is used.
            // This helps us pick the most distinct display text for the schemas.
            $each(arr, function (i, el) {
                if (el.title) {
                    used[el.title] = used[el.title] || 0;
                    used[el.title]++;
                }
                if (el.description) {
                    used[el.description] = used[el.description] || 0;
                    used[el.description]++;
                }
                if (el.format) {
                    used[el.format] = used[el.format] || 0;
                    used[el.format]++;
                }
                if (el.type) {
                    used[el.type] = used[el.type] || 0;
                    used[el.type]++;
                }
            });
            // Determine display text for each element of the array
            $each(arr, function (i, el) {
                var name;
                // If it's a simple string
                if (typeof el === "string")
                    name = el;
                else if (el.title && used[el.title] <= 1)
                    name = el.title;
                else if (el.format && used[el.format] <= 1)
                    name = el.format;
                else if (el.type && used[el.type] <= 1)
                    name = el.type;
                else if (el.description && used[el.description] <= 1)
                    name = el.descripton;
                else if (el.title)
                    name = el.title;
                else if (el.format)
                    name = el.format;
                else if (el.type)
                    name = el.type;
                else if (el.description)
                    name = el.description;
                else if (JSON.stringify(el).length < 50)
                    name = JSON.stringify(el);
                else
                    name = "type";
                disp.push(name);
            });
            // Replace identical display text with "text 1", "text 2", etc.
            var inc = {};
            $each(disp, function (i, name) {
                inc[name] = inc[name] || 0;
                inc[name]++;
                if (used[name] > 1)
                    disp[i] = name + " " + inc[name];
            });
            return disp;
        },
        getOption: function (key) {
            try {
                throw "getOption is deprecated";
            }
            catch (e) {
                window.console.error(e);
            }
            return this.options[key];
        },
        showValidationErrors: function (errors) {
        }
    });
    ;
    JSONEditor.defaults.editors["null"] = JSONEditor.AbstractEditor.extend({
        getValue: function () {
            return null;
        },
        setValue: function () {
            this.onChange();
        },
        getNumColumns: function () {
            return 2;
        }
    });
    ;
    JSONEditor.defaults.editors.string = JSONEditor.AbstractEditor.extend({
        register: function () {
            this._super();
            if (!this.input)
                return;
            this.input.setAttribute('name', this.formname);
        },
        unregister: function () {
            this._super();
            if (!this.input)
                return;
            this.input.removeAttribute('name');
        },
        setValue: function (value, initial, from_template) {
            var self = this;
            if (this.template && !from_template) {
                return;
            }
            if (value === null || typeof value === 'undefined')
                value = "";
            else if (typeof value === "object")
                value = JSON.stringify(value);
            else if (typeof value !== "string")
                value = "" + value;
            if (value === this.serialized)
                return;
            // Sanitize value before setting it
            var sanitized = this.sanitize(value);
            if (this.input.value === sanitized) {
                return;
            }
            this.input.value = sanitized;
            // If using SCEditor, update the WYSIWYG
            if (this.sceditor_instance) {
                this.sceditor_instance.val(sanitized);
            }
            else if (this.epiceditor) {
                this.epiceditor.importFile(null, sanitized);
            }
            else if (this.ace_editor) {
                this.ace_editor.setValue(sanitized);
            }
            var changed = from_template || this.getValue() !== value;
            this.refreshValue();
            if (initial)
                this.is_dirty = false;
            else if (this.jsoneditor.options.show_errors === "change")
                this.is_dirty = true;
            if (this.adjust_height)
                this.adjust_height(this.input);
            // Bubble this setValue to parents if the value changed
            this.onChange(changed);
        },
        getNumColumns: function () {
            var min = Math.ceil(Math.max(this.getTitle().length, this.schema.maxLength || 0, this.schema.minLength || 0) / 5);
            var num;
            if (this.input_type === 'textarea')
                num = 6;
            else if (['text', 'email'].indexOf(this.input_type) >= 0)
                num = 4;
            else
                num = 2;
            return Math.min(12, Math.max(min, num));
        },
        build: function () {
            var self = this, i;
            if (!this.options.compact)
                this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
            if (this.schema.description)
                this.description = this.theme.getFormInputDescription(this.schema.description);
            this.format = this.schema.format;
            if (!this.format && this.schema.media && this.schema.media.type) {
                this.format = this.schema.media.type.replace(/(^(application|text)\/(x-)?(script\.)?)|(-source$)/g, '');
            }
            if (!this.format && this.options.default_format) {
                this.format = this.options.default_format;
            }
            if (this.options.format) {
                this.format = this.options.format;
            }
            // Specific format
            if (this.format) {
                // Text Area
                if (this.format === 'textarea') {
                    this.input_type = 'textarea';
                    this.input = this.theme.getTextareaInput();
                }
                else if (this.format === 'range') {
                    this.input_type = 'range';
                    var min = this.schema.minimum || 0;
                    var max = this.schema.maximum || Math.max(100, min + 1);
                    var step = 1;
                    if (this.schema.multipleOf) {
                        if (min % this.schema.multipleOf)
                            min = Math.ceil(min / this.schema.multipleOf) * this.schema.multipleOf;
                        if (max % this.schema.multipleOf)
                            max = Math.floor(max / this.schema.multipleOf) * this.schema.multipleOf;
                        step = this.schema.multipleOf;
                    }
                    this.input = this.theme.getRangeInput(min, max, step);
                }
                else if ([
                    'actionscript',
                    'batchfile',
                    'bbcode',
                    'c',
                    'c++',
                    'cpp',
                    'coffee',
                    'csharp',
                    'css',
                    'dart',
                    'django',
                    'ejs',
                    'erlang',
                    'golang',
                    'groovy',
                    'handlebars',
                    'haskell',
                    'haxe',
                    'html',
                    'ini',
                    'jade',
                    'java',
                    'javascript',
                    'json',
                    'less',
                    'lisp',
                    'lua',
                    'makefile',
                    'markdown',
                    'matlab',
                    'mysql',
                    'objectivec',
                    'pascal',
                    'perl',
                    'pgsql',
                    'php',
                    'python',
                    'r',
                    'ruby',
                    'sass',
                    'scala',
                    'scss',
                    'smarty',
                    'sql',
                    'stylus',
                    'svg',
                    'twig',
                    'vbscript',
                    'xml',
                    'yaml'
                ].indexOf(this.format) >= 0) {
                    this.input_type = this.format;
                    this.source_code = true;
                    this.input = this.theme.getTextareaInput();
                }
                else {
                    this.input_type = this.format;
                    this.input = this.theme.getFormInputField(this.input_type);
                }
            }
            else {
                this.input_type = 'text';
                this.input = this.theme.getFormInputField(this.input_type);
            }
            // minLength, maxLength, and pattern
            if (typeof this.schema.maxLength !== "undefined")
                this.input.setAttribute('maxlength', this.schema.maxLength);
            if (typeof this.schema.pattern !== "undefined")
                this.input.setAttribute('pattern', this.schema.pattern);
            else if (typeof this.schema.minLength !== "undefined")
                this.input.setAttribute('pattern', '.{' + this.schema.minLength + ',}');
            if (this.options.compact) {
                this.container.className += ' compact';
            }
            else {
                if (this.options.input_width)
                    this.input.style.width = this.options.input_width;
            }
            if (this.schema.readOnly || this.schema.readonly || this.schema.template) {
                this.always_disabled = true;
                this.input.disabled = true;
            }
            this.input
                .addEventListener('change', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Don't allow changing if this field is a template
                if (self.schema.template) {
                    this.value = self.value;
                    return;
                }
                var val = this.value;
                // sanitize value
                var sanitized = self.sanitize(val);
                if (val !== sanitized) {
                    this.value = sanitized;
                }
                self.is_dirty = true;
                self.refreshValue();
                self.onChange(true);
            });
            if (this.options.input_height)
                this.input.style.height = this.options.input_height;
            if (this.options.expand_height) {
                this.adjust_height = function (el) {
                    if (!el)
                        return;
                    var i, ch = el.offsetHeight;
                    // Input too short
                    if (el.offsetHeight < el.scrollHeight) {
                        i = 0;
                        while (el.offsetHeight < el.scrollHeight + 3) {
                            if (i > 100)
                                break;
                            i++;
                            ch++;
                            el.style.height = ch + 'px';
                        }
                    }
                    else {
                        i = 0;
                        while (el.offsetHeight >= el.scrollHeight + 3) {
                            if (i > 100)
                                break;
                            i++;
                            ch--;
                            el.style.height = ch + 'px';
                        }
                        el.style.height = (ch + 1) + 'px';
                    }
                };
                this.input.addEventListener('keyup', function (e) {
                    self.adjust_height(this);
                });
                this.input.addEventListener('change', function (e) {
                    self.adjust_height(this);
                });
                this.adjust_height();
            }
            if (this.format)
                this.input.setAttribute('data-schemaformat', this.format);
            this.control = this.theme.getFormControl(this.label, this.input, this.description);
            this.container.appendChild(this.control);
            // Any special formatting that needs to happen after the input is added to the dom
            window.requestAnimationFrame(function () {
                // Skip in case the input is only a temporary editor,
                // otherwise, in the case of an ace_editor creation,
                // it will generate an error trying to append it to the missing parentNode
                if (self.input.parentNode)
                    self.afterInputReady();
                if (self.adjust_height)
                    self.adjust_height(self.input);
            });
            // Compile and store the template
            if (this.schema.template) {
                this.template = this.jsoneditor.compileTemplate(this.schema.template, this.template_engine);
                this.refreshValue();
            }
            else {
                this.refreshValue();
            }
        },
        enable: function () {
            if (!this.always_disabled) {
                this.input.disabled = false;
                // TODO: WYSIWYG and Markdown editors
            }
            this._super();
        },
        disable: function () {
            this.input.disabled = true;
            // TODO: WYSIWYG and Markdown editors
            this._super();
        },
        afterInputReady: function () {
            var self = this, options;
            // Code editor
            if (this.source_code) {
                // WYSIWYG html and bbcode editor
                if (this.options.wysiwyg &&
                    ['html', 'bbcode'].indexOf(this.input_type) >= 0 &&
                    window.jQuery && window.jQuery.fn && window.jQuery.fn.sceditor) {
                    options = $extend({}, {
                        plugins: self.input_type === 'html' ? 'xhtml' : 'bbcode',
                        emoticonsEnabled: false,
                        width: '100%',
                        height: 300
                    }, JSONEditor.plugins.sceditor, self.options.sceditor_options || {});
                    window.jQuery(self.input).sceditor(options);
                    self.sceditor_instance = window.jQuery(self.input).sceditor('instance');
                    self.sceditor_instance.blur(function () {
                        // Get editor's value
                        var val = window.jQuery("<div>" + self.sceditor_instance.val() + "</div>");
                        // Remove sceditor spans/divs
                        window.jQuery('#sceditor-start-marker,#sceditor-end-marker,.sceditor-nlf', val).remove();
                        // Set the value and update
                        self.input.value = val.html();
                        self.value = self.input.value;
                        self.is_dirty = true;
                        self.onChange(true);
                    });
                }
                else if (this.input_type === 'markdown' && window.EpicEditor) {
                    this.epiceditor_container = document.createElement('div');
                    this.input.parentNode.insertBefore(this.epiceditor_container, this.input);
                    this.input.style.display = 'none';
                    options = $extend({}, JSONEditor.plugins.epiceditor, {
                        container: this.epiceditor_container,
                        clientSideStorage: false
                    });
                    this.epiceditor = new window.EpicEditor(options).load();
                    this.epiceditor.importFile(null, this.getValue());
                    this.epiceditor.on('update', function () {
                        var val = self.epiceditor.exportFile();
                        self.input.value = val;
                        self.value = val;
                        self.is_dirty = true;
                        self.onChange(true);
                    });
                }
                else if (window.ace) {
                    var mode = this.input_type;
                    // aliases for c/cpp
                    if (mode === 'cpp' || mode === 'c++' || mode === 'c') {
                        mode = 'c_cpp';
                    }
                    this.ace_container = document.createElement('div');
                    this.ace_container.style.width = '100%';
                    this.ace_container.style.position = 'relative';
                    this.ace_container.style.height = '400px';
                    this.input.parentNode.insertBefore(this.ace_container, this.input);
                    this.input.style.display = 'none';
                    this.ace_editor = window.ace.edit(this.ace_container);
                    this.ace_editor.setValue(this.getValue());
                    // The theme
                    if (JSONEditor.plugins.ace.theme)
                        this.ace_editor.setTheme('ace/theme/' + JSONEditor.plugins.ace.theme);
                    // The mode
                    mode = window.ace.require("ace/mode/" + mode);
                    if (mode)
                        this.ace_editor.getSession().setMode(new mode.Mode());
                    // Listen for changes
                    this.ace_editor.on('change', function () {
                        var val = self.ace_editor.getValue();
                        self.input.value = val;
                        self.refreshValue();
                        self.is_dirty = true;
                        self.onChange(true);
                    });
                }
            }
            self.theme.afterInputReady(self.input);
        },
        refreshValue: function () {
            this.value = this.input.value;
            if (typeof this.value !== "string")
                this.value = '';
            this.serialized = this.value;
        },
        destroy: function () {
            // If using SCEditor, destroy the editor instance
            if (this.sceditor_instance) {
                this.sceditor_instance.destroy();
            }
            else if (this.epiceditor) {
                this.epiceditor.unload();
            }
            else if (this.ace_editor) {
                this.ace_editor.destroy();
            }
            this.template = null;
            if (this.input && this.input.parentNode)
                this.input.parentNode.removeChild(this.input);
            if (this.label && this.label.parentNode)
                this.label.parentNode.removeChild(this.label);
            if (this.description && this.description.parentNode)
                this.description.parentNode.removeChild(this.description);
            this._super();
        },
        /**
         * This is overridden in derivative editors
         */
        sanitize: function (value) {
            return value;
        },
        /**
         * Re-calculates the value if needed
         */
        onWatchedFieldChange: function () {
            var self = this, vars, j;
            // If this editor needs to be rendered by a macro template
            if (this.template) {
                vars = this.getWatchedFieldValues();
                this.setValue(this.template(vars), false, true);
            }
            this._super();
        },
        showValidationErrors: function (errors) {
            var self = this;
            if (this.jsoneditor.options.show_errors === "always") { }
            else if (!this.is_dirty && this.previous_error_setting === this.jsoneditor.options.show_errors)
                return;
            this.previous_error_setting = this.jsoneditor.options.show_errors;
            var messages = [];
            $each(errors, function (i, error) {
                if (error.path === self.path) {
                    messages.push(error.message);
                }
            });
            if (messages.length) {
                this.theme.addInputError(this.input, messages.join('. ') + '.');
            }
            else {
                this.theme.removeInputError(this.input);
            }
        }
    });
    ;
    JSONEditor.defaults.editors.number = JSONEditor.defaults.editors.string.extend({
        sanitize: function (value) {
            return (value + "").replace(/[^0-9\.\-eE]/g, '');
        },
        getNumColumns: function () {
            return 2;
        },
        getValue: function () {
            return this.value * 1;
        }
    });
    ;
    JSONEditor.defaults.editors.integer = JSONEditor.defaults.editors.number.extend({
        sanitize: function (value) {
            value = value + "";
            return value.replace(/[^0-9\-]/g, '');
        },
        getNumColumns: function () {
            return 2;
        }
    });
    ;
    JSONEditor.defaults.editors.object = JSONEditor.AbstractEditor.extend({
        getDefault: function () {
            return $extend({}, this.schema["default"] || {});
        },
        getChildEditors: function () {
            return this.editors;
        },
        register: function () {
            this._super();
            if (this.editors) {
                for (var i in this.editors) {
                    if (!this.editors.hasOwnProperty(i))
                        continue;
                    this.editors[i].register();
                }
            }
        },
        unregister: function () {
            this._super();
            if (this.editors) {
                for (var i in this.editors) {
                    if (!this.editors.hasOwnProperty(i))
                        continue;
                    this.editors[i].unregister();
                }
            }
        },
        getNumColumns: function () {
            return Math.max(Math.min(12, this.maxwidth), 3);
        },
        enable: function () {
            if (this.editjson_button)
                this.editjson_button.disabled = false;
            if (this.addproperty_button)
                this.addproperty_button.disabled = false;
            this._super();
            if (this.editors) {
                for (var i in this.editors) {
                    if (!this.editors.hasOwnProperty(i))
                        continue;
                    this.editors[i].enable();
                }
            }
        },
        disable: function () {
            if (this.editjson_button)
                this.editjson_button.disabled = true;
            if (this.addproperty_button)
                this.addproperty_button.disabled = true;
            this.hideEditJSON();
            this._super();
            if (this.editors) {
                for (var i in this.editors) {
                    if (!this.editors.hasOwnProperty(i))
                        continue;
                    this.editors[i].disable();
                }
            }
        },
        layoutEditors: function () {
            var self = this, i, j;
            if (!this.row_container)
                return;
            // Sort editors by propertyOrder
            this.property_order = Object.keys(this.editors);
            this.property_order = this.property_order.sort(function (a, b) {
                var ordera = self.editors[a].schema.propertyOrder;
                var orderb = self.editors[b].schema.propertyOrder;
                if (typeof ordera !== "number")
                    ordera = 1000;
                if (typeof orderb !== "number")
                    orderb = 1000;
                return ordera - orderb;
            });
            var container;
            if (this.format === 'grid') {
                var rows = [];
                $each(this.property_order, function (j, key) {
                    var editor = self.editors[key];
                    if (editor.property_removed)
                        return;
                    var found = false;
                    var width = editor.options.hidden ? 0 : (editor.options.grid_columns || editor.getNumColumns());
                    var height = editor.options.hidden ? 0 : editor.container.offsetHeight;
                    // See if the editor will fit in any of the existing rows first
                    for (var i = 0; i < rows.length; i++) {
                        // If the editor will fit in the row horizontally
                        if (rows[i].width + width <= 12) {
                            // If the editor is close to the other elements in height
                            // i.e. Don't put a really tall editor in an otherwise short row or vice versa
                            if (!height || (rows[i].minh * 0.5 < height && rows[i].maxh * 2 > height)) {
                                found = i;
                            }
                        }
                    }
                    // If there isn't a spot in any of the existing rows, start a new row
                    if (found === false) {
                        rows.push({
                            width: 0,
                            minh: 999999,
                            maxh: 0,
                            editors: []
                        });
                        found = rows.length - 1;
                    }
                    rows[found].editors.push({
                        key: key,
                        //editor: editor,
                        width: width,
                        height: height
                    });
                    rows[found].width += width;
                    rows[found].minh = Math.min(rows[found].minh, height);
                    rows[found].maxh = Math.max(rows[found].maxh, height);
                });
                // Make almost full rows width 12
                // Do this by increasing all editors' sizes proprotionately
                // Any left over space goes to the biggest editor
                // Don't touch rows with a width of 6 or less
                for (i = 0; i < rows.length; i++) {
                    if (rows[i].width < 12) {
                        var biggest = false;
                        var new_width = 0;
                        for (j = 0; j < rows[i].editors.length; j++) {
                            if (biggest === false)
                                biggest = j;
                            else if (rows[i].editors[j].width > rows[i].editors[biggest].width)
                                biggest = j;
                            rows[i].editors[j].width *= 12 / rows[i].width;
                            rows[i].editors[j].width = Math.floor(rows[i].editors[j].width);
                            new_width += rows[i].editors[j].width;
                        }
                        if (new_width < 12)
                            rows[i].editors[biggest].width += 12 - new_width;
                        rows[i].width = 12;
                    }
                }
                // layout hasn't changed
                if (this.layout === JSON.stringify(rows))
                    return false;
                this.layout = JSON.stringify(rows);
                // Layout the form
                container = document.createElement('div');
                for (i = 0; i < rows.length; i++) {
                    var row = this.theme.getGridRow();
                    container.appendChild(row);
                    for (j = 0; j < rows[i].editors.length; j++) {
                        var key = rows[i].editors[j].key;
                        var editor = this.editors[key];
                        if (editor.options.hidden)
                            editor.container.style.display = 'none';
                        else
                            this.theme.setGridColumnSize(editor.container, rows[i].editors[j].width);
                        row.appendChild(editor.container);
                    }
                }
            }
            else {
                container = document.createElement('div');
                $each(this.property_order, function (i, key) {
                    var editor = self.editors[key];
                    if (editor.property_removed)
                        return;
                    var row = self.theme.getGridRow();
                    container.appendChild(row);
                    if (editor.options.hidden)
                        editor.container.style.display = 'none';
                    else
                        self.theme.setGridColumnSize(editor.container, 12);
                    row.appendChild(editor.container);
                });
            }
            this.row_container.innerHTML = '';
            this.row_container.appendChild(container);
        },
        getPropertySchema: function (key) {
            // Schema declared directly in properties
            var schema = this.schema.properties[key] || {};
            schema = $extend({}, schema);
            var matched = this.schema.properties[key] ? true : false;
            // Any matching patternProperties should be merged in
            if (this.schema.patternProperties) {
                for (var i in this.schema.patternProperties) {
                    if (!this.schema.patternProperties.hasOwnProperty(i))
                        continue;
                    var regex = new RegExp(i);
                    if (regex.test(key)) {
                        schema.allOf = schema.allOf || [];
                        schema.allOf.push(this.schema.patternProperties[i]);
                        matched = true;
                    }
                }
            }
            // Hasn't matched other rules, use additionalProperties schema
            if (!matched && this.schema.additionalProperties && typeof this.schema.additionalProperties === "object") {
                schema = $extend({}, this.schema.additionalProperties);
            }
            return schema;
        },
        preBuild: function () {
            this._super();
            this.editors = {};
            this.cached_editors = {};
            var self = this;
            this.format = this.options.layout || this.options.object_layout || this.schema.format || this.jsoneditor.options.object_layout || 'normal';
            this.schema.properties = this.schema.properties || {};
            this.minwidth = 0;
            this.maxwidth = 0;
            // If the object should be rendered as a table row
            if (this.options.table_row) {
                $each(this.schema.properties, function (key, schema) {
                    var editor = self.jsoneditor.getEditorClass(schema);
                    self.editors[key] = self.jsoneditor.createEditor(editor, {
                        jsoneditor: self.jsoneditor,
                        schema: schema,
                        path: self.path + '.' + key,
                        parent: self,
                        compact: true,
                        required: true
                    });
                    self.editors[key].preBuild();
                    var width = self.editors[key].options.hidden ? 0 : (self.editors[key].options.grid_columns || self.editors[key].getNumColumns());
                    self.minwidth += width;
                    self.maxwidth += width;
                });
                this.no_link_holder = true;
            }
            else if (this.options.table) {
                // TODO: table display format
                throw "Not supported yet";
            }
            else {
                if (!this.schema.defaultProperties) {
                    if (this.jsoneditor.options.display_required_only || this.options.display_required_only) {
                        this.schema.defaultProperties = [];
                        $each(this.schema.properties, function (k, s) {
                            if (self.isRequired({ key: k, schema: s })) {
                                self.schema.defaultProperties.push(k);
                            }
                        });
                    }
                    else {
                        self.schema.defaultProperties = Object.keys(self.schema.properties);
                    }
                }
                // Increase the grid width to account for padding
                self.maxwidth += 1;
                $each(this.schema.defaultProperties, function (i, key) {
                    self.addObjectProperty(key, true);
                    if (self.editors[key]) {
                        self.minwidth = Math.max(self.minwidth, (self.editors[key].options.grid_columns || self.editors[key].getNumColumns()));
                        self.maxwidth += (self.editors[key].options.grid_columns || self.editors[key].getNumColumns());
                    }
                });
            }
            // Sort editors by propertyOrder
            this.property_order = Object.keys(this.editors);
            this.property_order = this.property_order.sort(function (a, b) {
                var ordera = self.editors[a].schema.propertyOrder;
                var orderb = self.editors[b].schema.propertyOrder;
                if (typeof ordera !== "number")
                    ordera = 1000;
                if (typeof orderb !== "number")
                    orderb = 1000;
                return ordera - orderb;
            });
        },
        build: function () {
            var self = this;
            // If the object should be rendered as a table row
            if (this.options.table_row) {
                this.editor_holder = this.container;
                $each(this.editors, function (key, editor) {
                    var holder = self.theme.getTableCell();
                    self.editor_holder.appendChild(holder);
                    editor.setContainer(holder);
                    editor.build();
                    editor.postBuild();
                    if (self.editors[key].options.hidden) {
                        holder.style.display = 'none';
                    }
                    if (self.editors[key].options.input_width) {
                        holder.style.width = self.editors[key].options.input_width;
                    }
                });
            }
            else if (this.options.table) {
                // TODO: table display format
                throw "Not supported yet";
            }
            else {
                this.header = document.createElement('span');
                this.header.textContent = this.getTitle();
                this.title = this.theme.getHeader(this.header);
                this.container.appendChild(this.title);
                this.container.style.position = 'relative';
                // Edit JSON modal
                this.editjson_holder = this.theme.getModal();
                this.editjson_textarea = this.theme.getTextareaInput();
                this.editjson_textarea.style.height = '170px';
                this.editjson_textarea.style.width = '300px';
                this.editjson_textarea.style.display = 'block';
                this.editjson_save = this.getButton('Save', 'save', 'Save');
                this.editjson_save.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.saveJSON();
                });
                this.editjson_cancel = this.getButton('Cancel', 'cancel', 'Cancel');
                this.editjson_cancel.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.hideEditJSON();
                });
                this.editjson_holder.appendChild(this.editjson_textarea);
                this.editjson_holder.appendChild(this.editjson_save);
                this.editjson_holder.appendChild(this.editjson_cancel);
                // Manage Properties modal
                this.addproperty_holder = this.theme.getModal();
                this.addproperty_list = document.createElement('div');
                this.addproperty_list.style.width = '295px';
                this.addproperty_list.style.maxHeight = '160px';
                this.addproperty_list.style.padding = '5px 0';
                this.addproperty_list.style.overflowY = 'auto';
                this.addproperty_list.style.overflowX = 'hidden';
                this.addproperty_list.style.paddingLeft = '5px';
                this.addproperty_list.setAttribute('class', 'property-selector');
                this.addproperty_add = this.getButton('add', 'add', 'add');
                this.addproperty_input = this.theme.getFormInputField('text');
                this.addproperty_input.setAttribute('placeholder', 'Property name...');
                this.addproperty_input.style.width = '220px';
                this.addproperty_input.style.marginBottom = '0';
                this.addproperty_input.style.display = 'inline-block';
                this.addproperty_add.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (self.addproperty_input.value) {
                        if (self.editors[self.addproperty_input.value]) {
                            window.alert('there is already a property with that name');
                            return;
                        }
                        self.addObjectProperty(self.addproperty_input.value);
                        if (self.editors[self.addproperty_input.value]) {
                            self.editors[self.addproperty_input.value].disable();
                        }
                        self.onChange(true);
                    }
                });
                this.addproperty_holder.appendChild(this.addproperty_list);
                this.addproperty_holder.appendChild(this.addproperty_input);
                this.addproperty_holder.appendChild(this.addproperty_add);
                var spacer = document.createElement('div');
                spacer.style.clear = 'both';
                this.addproperty_holder.appendChild(spacer);
                // Description
                if (this.schema.description) {
                    this.description = this.theme.getDescription(this.schema.description);
                    this.container.appendChild(this.description);
                }
                // Validation error placeholder area
                this.error_holder = document.createElement('div');
                this.container.appendChild(this.error_holder);
                // Container for child editor area
                this.editor_holder = this.theme.getIndentedPanel();
                this.container.appendChild(this.editor_holder);
                // Container for rows of child editors
                this.row_container = this.theme.getGridContainer();
                this.editor_holder.appendChild(this.row_container);
                $each(this.editors, function (key, editor) {
                    var holder = self.theme.getGridColumn();
                    self.row_container.appendChild(holder);
                    editor.setContainer(holder);
                    editor.build();
                    editor.postBuild();
                });
                // Control buttons
                this.title_controls = this.theme.getHeaderButtonHolder();
                this.editjson_controls = this.theme.getHeaderButtonHolder();
                this.addproperty_controls = this.theme.getHeaderButtonHolder();
                this.title.appendChild(this.title_controls);
                this.title.appendChild(this.editjson_controls);
                this.title.appendChild(this.addproperty_controls);
                // Show/Hide button
                this.collapsed = false;
                this.toggle_button = this.getButton('', 'collapse', this.translate('button_collapse'));
                this.title_controls.appendChild(this.toggle_button);
                this.toggle_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (self.collapsed) {
                        self.editor_holder.style.display = '';
                        self.collapsed = false;
                        self.setButtonText(self.toggle_button, '', 'collapse', self.translate('button_collapse'));
                    }
                    else {
                        self.editor_holder.style.display = 'none';
                        self.collapsed = true;
                        self.setButtonText(self.toggle_button, '', 'expand', self.translate('button_expand'));
                    }
                });
                // If it should start collapsed
                if (this.options.collapsed) {
                    $trigger(this.toggle_button, 'click');
                }
                // Collapse button disabled
                if (this.schema.options && typeof this.schema.options.disable_collapse !== "undefined") {
                    if (this.schema.options.disable_collapse)
                        this.toggle_button.style.display = 'none';
                }
                else if (this.jsoneditor.options.disable_collapse) {
                    this.toggle_button.style.display = 'none';
                }
                // Edit JSON Button
                this.editjson_button = this.getButton('JSON', 'edit', 'Edit JSON');
                this.editjson_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.toggleEditJSON();
                });
                this.editjson_controls.appendChild(this.editjson_button);
                this.editjson_controls.appendChild(this.editjson_holder);
                // Edit JSON Buttton disabled
                if (this.schema.options && typeof this.schema.options.disable_edit_json !== "undefined") {
                    if (this.schema.options.disable_edit_json)
                        this.editjson_button.style.display = 'none';
                }
                else if (this.jsoneditor.options.disable_edit_json) {
                    this.editjson_button.style.display = 'none';
                }
                // Object Properties Button
                this.addproperty_button = this.getButton('Properties', 'edit', 'Object Properties');
                this.addproperty_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.toggleAddProperty();
                });
                this.addproperty_controls.appendChild(this.addproperty_button);
                this.addproperty_controls.appendChild(this.addproperty_holder);
                this.refreshAddProperties();
            }
            // Fix table cell ordering
            if (this.options.table_row) {
                this.editor_holder = this.container;
                $each(this.property_order, function (i, key) {
                    self.editor_holder.appendChild(self.editors[key].container);
                });
            }
            else {
                // Initial layout
                this.layoutEditors();
                // Do it again now that we know the approximate heights of elements
                this.layoutEditors();
            }
        },
        showEditJSON: function () {
            if (!this.editjson_holder)
                return;
            this.hideAddProperty();
            // Position the form directly beneath the button
            // TODO: edge detection
            this.editjson_holder.style.left = this.editjson_button.offsetLeft + "px";
            this.editjson_holder.style.top = this.editjson_button.offsetTop + this.editjson_button.offsetHeight + "px";
            // Start the textarea with the current value
            this.editjson_textarea.value = JSON.stringify(this.getValue(), null, 2);
            // Disable the rest of the form while editing JSON
            this.disable();
            this.editjson_holder.style.display = '';
            this.editjson_button.disabled = false;
            this.editing_json = true;
        },
        hideEditJSON: function () {
            if (!this.editjson_holder)
                return;
            if (!this.editing_json)
                return;
            this.editjson_holder.style.display = 'none';
            this.enable();
            this.editing_json = false;
        },
        saveJSON: function () {
            if (!this.editjson_holder)
                return;
            try {
                var json = JSON.parse(this.editjson_textarea.value);
                this.setValue(json);
                this.hideEditJSON();
            }
            catch (e) {
                window.alert('invalid JSON');
                throw e;
            }
        },
        toggleEditJSON: function () {
            if (this.editing_json)
                this.hideEditJSON();
            else
                this.showEditJSON();
        },
        insertPropertyControlUsingPropertyOrder: function (property, control, container) {
            var propertyOrder;
            if (this.schema.properties[property])
                propertyOrder = this.schema.properties[property].propertyOrder;
            if (typeof propertyOrder !== "number")
                propertyOrder = 1000;
            control.propertyOrder = propertyOrder;
            for (var i = 0; i < container.childNodes.length; i++) {
                var child = container.childNodes[i];
                if (control.propertyOrder < child.propertyOrder) {
                    this.addproperty_list.insertBefore(control, child);
                    control = null;
                    break;
                }
            }
            if (control) {
                this.addproperty_list.appendChild(control);
            }
        },
        addPropertyCheckbox: function (key) {
            var self = this;
            var checkbox, label, labelText, control;
            checkbox = self.theme.getCheckbox();
            checkbox.style.width = 'auto';
            if (this.schema.properties[key] && this.schema.properties[key].title)
                labelText = this.schema.properties[key].title;
            else
                labelText = key;
            label = self.theme.getCheckboxLabel(labelText);
            control = self.theme.getFormControl(label, checkbox);
            control.style.paddingBottom = control.style.marginBottom = control.style.paddingTop = control.style.marginTop = 0;
            control.style.height = 'auto';
            //control.style.overflowY = 'hidden';
            this.insertPropertyControlUsingPropertyOrder(key, control, this.addproperty_list);
            checkbox.checked = key in this.editors;
            checkbox.addEventListener('change', function () {
                if (checkbox.checked) {
                    self.addObjectProperty(key);
                }
                else {
                    self.removeObjectProperty(key);
                }
                self.onChange(true);
            });
            self.addproperty_checkboxes[key] = checkbox;
            return checkbox;
        },
        showAddProperty: function () {
            if (!this.addproperty_holder)
                return;
            this.hideEditJSON();
            // Position the form directly beneath the button
            // TODO: edge detection
            this.addproperty_holder.style.left = this.addproperty_button.offsetLeft + "px";
            this.addproperty_holder.style.top = this.addproperty_button.offsetTop + this.addproperty_button.offsetHeight + "px";
            // Disable the rest of the form while editing JSON
            this.disable();
            this.adding_property = true;
            this.addproperty_button.disabled = false;
            this.addproperty_holder.style.display = '';
            this.refreshAddProperties();
        },
        hideAddProperty: function () {
            if (!this.addproperty_holder)
                return;
            if (!this.adding_property)
                return;
            this.addproperty_holder.style.display = 'none';
            this.enable();
            this.adding_property = false;
        },
        toggleAddProperty: function () {
            if (this.adding_property)
                this.hideAddProperty();
            else
                this.showAddProperty();
        },
        removeObjectProperty: function (property) {
            if (this.editors[property]) {
                this.editors[property].unregister();
                delete this.editors[property];
                this.refreshValue();
                this.layoutEditors();
            }
        },
        addObjectProperty: function (name, prebuild_only) {
            var self = this;
            // Property is already added
            if (this.editors[name])
                return;
            // Property was added before and is cached
            if (this.cached_editors[name]) {
                this.editors[name] = this.cached_editors[name];
                if (prebuild_only)
                    return;
                this.editors[name].register();
            }
            else {
                if (!this.canHaveAdditionalProperties() && (!this.schema.properties || !this.schema.properties[name])) {
                    return;
                }
                var schema = self.getPropertySchema(name);
                // Add the property
                var editor = self.jsoneditor.getEditorClass(schema);
                self.editors[name] = self.jsoneditor.createEditor(editor, {
                    jsoneditor: self.jsoneditor,
                    schema: schema,
                    path: self.path + '.' + name,
                    parent: self
                });
                self.editors[name].preBuild();
                if (!prebuild_only) {
                    var holder = self.theme.getChildEditorHolder();
                    self.editor_holder.appendChild(holder);
                    self.editors[name].setContainer(holder);
                    self.editors[name].build();
                    self.editors[name].postBuild();
                }
                self.cached_editors[name] = self.editors[name];
            }
            // If we're only prebuilding the editors, don't refresh values
            if (!prebuild_only) {
                self.refreshValue();
                self.layoutEditors();
            }
        },
        onChildEditorChange: function (editor) {
            this.refreshValue();
            this._super(editor);
        },
        canHaveAdditionalProperties: function () {
            if (typeof this.schema.additionalProperties === "boolean") {
                return this.schema.additionalProperties;
            }
            return !this.jsoneditor.options.no_additional_properties;
        },
        destroy: function () {
            $each(this.cached_editors, function (i, el) {
                el.destroy();
            });
            if (this.editor_holder)
                this.editor_holder.innerHTML = '';
            if (this.title && this.title.parentNode)
                this.title.parentNode.removeChild(this.title);
            if (this.error_holder && this.error_holder.parentNode)
                this.error_holder.parentNode.removeChild(this.error_holder);
            this.editors = null;
            this.cached_editors = null;
            if (this.editor_holder && this.editor_holder.parentNode)
                this.editor_holder.parentNode.removeChild(this.editor_holder);
            this.editor_holder = null;
            this._super();
        },
        getValue: function () {
            var result = this._super();
            if (this.jsoneditor.options.remove_empty_properties || this.options.remove_empty_properties) {
                for (var i in result) {
                    if (result.hasOwnProperty(i)) {
                        if (!result[i])
                            delete result[i];
                    }
                }
            }
            return result;
        },
        refreshValue: function () {
            this.value = {};
            var self = this;
            for (var i in this.editors) {
                if (!this.editors.hasOwnProperty(i))
                    continue;
                this.value[i] = this.editors[i].getValue();
            }
            if (this.adding_property)
                this.refreshAddProperties();
        },
        refreshAddProperties: function () {
            if (this.options.disable_properties || (this.options.disable_properties !== false && this.jsoneditor.options.disable_properties)) {
                this.addproperty_controls.style.display = 'none';
                return;
            }
            var can_add = false, can_remove = false, num_props = 0, i, show_modal = false;
            // Get number of editors
            for (i in this.editors) {
                if (!this.editors.hasOwnProperty(i))
                    continue;
                num_props++;
            }
            // Determine if we can add back removed properties
            can_add = this.canHaveAdditionalProperties() && !(typeof this.schema.maxProperties !== "undefined" && num_props >= this.schema.maxProperties);
            if (this.addproperty_checkboxes) {
                this.addproperty_list.innerHTML = '';
            }
            this.addproperty_checkboxes = {};
            // Check for which editors can't be removed or added back
            for (i in this.cached_editors) {
                if (!this.cached_editors.hasOwnProperty(i))
                    continue;
                this.addPropertyCheckbox(i);
                if (this.isRequired(this.cached_editors[i]) && i in this.editors) {
                    this.addproperty_checkboxes[i].disabled = true;
                }
                if (typeof this.schema.minProperties !== "undefined" && num_props <= this.schema.minProperties) {
                    this.addproperty_checkboxes[i].disabled = this.addproperty_checkboxes[i].checked;
                    if (!this.addproperty_checkboxes[i].checked)
                        show_modal = true;
                }
                else if (!(i in this.editors)) {
                    if (!can_add && !this.schema.properties.hasOwnProperty(i)) {
                        this.addproperty_checkboxes[i].disabled = true;
                    }
                    else {
                        this.addproperty_checkboxes[i].disabled = false;
                        show_modal = true;
                    }
                }
                else {
                    show_modal = true;
                    can_remove = true;
                }
            }
            if (this.canHaveAdditionalProperties()) {
                show_modal = true;
            }
            // Additional addproperty checkboxes not tied to a current editor
            for (i in this.schema.properties) {
                if (!this.schema.properties.hasOwnProperty(i))
                    continue;
                if (this.cached_editors[i])
                    continue;
                show_modal = true;
                this.addPropertyCheckbox(i);
            }
            // If no editors can be added or removed, hide the modal button
            if (!show_modal) {
                this.hideAddProperty();
                this.addproperty_controls.style.display = 'none';
            }
            else if (!this.canHaveAdditionalProperties()) {
                this.addproperty_add.style.display = 'none';
                this.addproperty_input.style.display = 'none';
            }
            else if (!can_add) {
                this.addproperty_add.disabled = true;
            }
            else {
                this.addproperty_add.disabled = false;
            }
        },
        isRequired: function (editor) {
            if (typeof editor.schema.required === "boolean")
                return editor.schema.required;
            else if (Array.isArray(this.schema.required))
                return this.schema.required.indexOf(editor.key) > -1;
            else if (this.jsoneditor.options.required_by_default)
                return true;
            else
                return false;
        },
        setValue: function (value, initial) {
            var self = this;
            value = value || {};
            if (typeof value !== "object" || Array.isArray(value))
                value = {};
            // First, set the values for all of the defined properties
            $each(this.cached_editors, function (i, editor) {
                // Value explicitly set
                if (typeof value[i] !== "undefined") {
                    self.addObjectProperty(i);
                    editor.setValue(value[i], initial);
                }
                else if (!initial && !self.isRequired(editor)) {
                    self.removeObjectProperty(i);
                }
                else {
                    editor.setValue(editor.getDefault(), initial);
                }
            });
            $each(value, function (i, val) {
                if (!self.cached_editors[i]) {
                    self.addObjectProperty(i);
                    if (self.editors[i])
                        self.editors[i].setValue(val, initial);
                }
            });
            this.refreshValue();
            this.layoutEditors();
            this.onChange();
        },
        showValidationErrors: function (errors) {
            var self = this;
            // Get all the errors that pertain to this editor
            var my_errors = [];
            var other_errors = [];
            $each(errors, function (i, error) {
                if (error.path === self.path) {
                    my_errors.push(error);
                }
                else {
                    other_errors.push(error);
                }
            });
            // Show errors for this editor
            if (this.error_holder) {
                if (my_errors.length) {
                    var message = [];
                    this.error_holder.innerHTML = '';
                    this.error_holder.style.display = '';
                    $each(my_errors, function (i, error) {
                        self.error_holder.appendChild(self.theme.getErrorMessage(error.message));
                    });
                }
                else {
                    this.error_holder.style.display = 'none';
                }
            }
            // Show error for the table row if this is inside a table
            if (this.options.table_row) {
                if (my_errors.length) {
                    this.theme.addTableRowError(this.container);
                }
                else {
                    this.theme.removeTableRowError(this.container);
                }
            }
            // Show errors for child editors
            $each(this.editors, function (i, editor) {
                editor.showValidationErrors(other_errors);
            });
        }
    });
    ;
    JSONEditor.defaults.editors.array = JSONEditor.AbstractEditor.extend({
        getDefault: function () {
            return this.schema["default"] || [];
        },
        register: function () {
            this._super();
            if (this.rows) {
                for (var i = 0; i < this.rows.length; i++) {
                    this.rows[i].register();
                }
            }
        },
        unregister: function () {
            this._super();
            if (this.rows) {
                for (var i = 0; i < this.rows.length; i++) {
                    this.rows[i].unregister();
                }
            }
        },
        getNumColumns: function () {
            var info = this.getItemInfo(0);
            // Tabs require extra horizontal space
            if (this.tabs_holder) {
                return Math.max(Math.min(12, info.width + 2), 4);
            }
            else {
                return info.width;
            }
        },
        enable: function () {
            if (this.add_row_button)
                this.add_row_button.disabled = false;
            if (this.remove_all_rows_button)
                this.remove_all_rows_button.disabled = false;
            if (this.delete_last_row_button)
                this.delete_last_row_button.disabled = false;
            if (this.rows) {
                for (var i = 0; i < this.rows.length; i++) {
                    this.rows[i].enable();
                    if (this.rows[i].moveup_button)
                        this.rows[i].moveup_button.disabled = false;
                    if (this.rows[i].movedown_button)
                        this.rows[i].movedown_button.disabled = false;
                    if (this.rows[i].delete_button)
                        this.rows[i].delete_button.disabled = false;
                }
            }
            this._super();
        },
        disable: function () {
            if (this.add_row_button)
                this.add_row_button.disabled = true;
            if (this.remove_all_rows_button)
                this.remove_all_rows_button.disabled = true;
            if (this.delete_last_row_button)
                this.delete_last_row_button.disabled = true;
            if (this.rows) {
                for (var i = 0; i < this.rows.length; i++) {
                    this.rows[i].disable();
                    if (this.rows[i].moveup_button)
                        this.rows[i].moveup_button.disabled = true;
                    if (this.rows[i].movedown_button)
                        this.rows[i].movedown_button.disabled = true;
                    if (this.rows[i].delete_button)
                        this.rows[i].delete_button.disabled = true;
                }
            }
            this._super();
        },
        preBuild: function () {
            this._super();
            this.rows = [];
            this.row_cache = [];
            this.hide_delete_buttons = this.options.disable_array_delete || this.jsoneditor.options.disable_array_delete;
            this.hide_delete_all_rows_buttons = this.hide_delete_buttons || this.options.disable_array_delete_all_rows || this.jsoneditor.options.disable_array_delete_all_rows;
            this.hide_delete_last_row_buttons = this.hide_delete_buttons || this.options.disable_array_delete_last_row || this.jsoneditor.options.disable_array_delete_last_row;
            this.hide_move_buttons = this.options.disable_array_reorder || this.jsoneditor.options.disable_array_reorder;
            this.hide_add_button = this.options.disable_array_add || this.jsoneditor.options.disable_array_add;
        },
        build: function () {
            var self = this;
            if (!this.options.compact) {
                this.header = document.createElement('span');
                this.header.textContent = this.getTitle();
                this.title = this.theme.getHeader(this.header);
                this.container.appendChild(this.title);
                this.title_controls = this.theme.getHeaderButtonHolder();
                this.title.appendChild(this.title_controls);
                if (this.schema.description) {
                    this.description = this.theme.getDescription(this.schema.description);
                    this.container.appendChild(this.description);
                }
                this.error_holder = document.createElement('div');
                this.container.appendChild(this.error_holder);
                if (this.schema.format === 'tabs') {
                    this.controls = this.theme.getHeaderButtonHolder();
                    this.title.appendChild(this.controls);
                    this.tabs_holder = this.theme.getTabHolder();
                    this.container.appendChild(this.tabs_holder);
                    this.row_holder = this.theme.getTabContentHolder(this.tabs_holder);
                    this.active_tab = null;
                }
                else {
                    this.panel = this.theme.getIndentedPanel();
                    this.container.appendChild(this.panel);
                    this.row_holder = document.createElement('div');
                    this.panel.appendChild(this.row_holder);
                    this.controls = this.theme.getButtonHolder();
                    this.panel.appendChild(this.controls);
                }
            }
            else {
                this.panel = this.theme.getIndentedPanel();
                this.container.appendChild(this.panel);
                this.controls = this.theme.getButtonHolder();
                this.panel.appendChild(this.controls);
                this.row_holder = document.createElement('div');
                this.panel.appendChild(this.row_holder);
            }
            // Add controls
            this.addControls();
        },
        onChildEditorChange: function (editor) {
            this.refreshValue();
            this.refreshTabs(true);
            this._super(editor);
        },
        getItemTitle: function () {
            if (!this.item_title) {
                if (this.schema.items && !Array.isArray(this.schema.items)) {
                    var tmp = this.jsoneditor.expandRefs(this.schema.items);
                    this.item_title = tmp.title || 'item';
                }
                else {
                    this.item_title = 'item';
                }
            }
            return this.item_title;
        },
        getItemSchema: function (i) {
            if (Array.isArray(this.schema.items)) {
                if (i >= this.schema.items.length) {
                    if (this.schema.additionalItems === true) {
                        return {};
                    }
                    else if (this.schema.additionalItems) {
                        return $extend({}, this.schema.additionalItems);
                    }
                }
                else {
                    return $extend({}, this.schema.items[i]);
                }
            }
            else if (this.schema.items) {
                return $extend({}, this.schema.items);
            }
            else {
                return {};
            }
        },
        getItemInfo: function (i) {
            var schema = this.getItemSchema(i);
            // Check if it's cached
            this.item_info = this.item_info || {};
            var stringified = JSON.stringify(schema);
            if (typeof this.item_info[stringified] !== "undefined")
                return this.item_info[stringified];
            // Get the schema for this item
            schema = this.jsoneditor.expandRefs(schema);
            this.item_info[stringified] = {
                title: schema.title || "item",
                'default': schema["default"],
                width: 12,
                child_editors: schema.properties || schema.items
            };
            return this.item_info[stringified];
        },
        getElementEditor: function (i) {
            var item_info = this.getItemInfo(i);
            var schema = this.getItemSchema(i);
            schema = this.jsoneditor.expandRefs(schema);
            schema.title = item_info.title + ' ' + (i + 1);
            var editor = this.jsoneditor.getEditorClass(schema);
            var holder;
            if (this.tabs_holder) {
                holder = this.theme.getTabContent();
            }
            else if (item_info.child_editors) {
                holder = this.theme.getChildEditorHolder();
            }
            else {
                holder = this.theme.getIndentedPanel();
            }
            this.row_holder.appendChild(holder);
            var ret = this.jsoneditor.createEditor(editor, {
                jsoneditor: this.jsoneditor,
                schema: schema,
                container: holder,
                path: this.path + '.' + i,
                parent: this,
                required: true
            });
            ret.preBuild();
            ret.build();
            ret.postBuild();
            if (!ret.title_controls) {
                ret.array_controls = this.theme.getButtonHolder();
                holder.appendChild(ret.array_controls);
            }
            return ret;
        },
        destroy: function () {
            this.empty(true);
            if (this.title && this.title.parentNode)
                this.title.parentNode.removeChild(this.title);
            if (this.description && this.description.parentNode)
                this.description.parentNode.removeChild(this.description);
            if (this.row_holder && this.row_holder.parentNode)
                this.row_holder.parentNode.removeChild(this.row_holder);
            if (this.controls && this.controls.parentNode)
                this.controls.parentNode.removeChild(this.controls);
            if (this.panel && this.panel.parentNode)
                this.panel.parentNode.removeChild(this.panel);
            this.rows = this.row_cache = this.title = this.description = this.row_holder = this.panel = this.controls = null;
            this._super();
        },
        empty: function (hard) {
            if (!this.rows)
                return;
            var self = this;
            $each(this.rows, function (i, row) {
                if (hard) {
                    if (row.tab && row.tab.parentNode)
                        row.tab.parentNode.removeChild(row.tab);
                    self.destroyRow(row, true);
                    self.row_cache[i] = null;
                }
                self.rows[i] = null;
            });
            self.rows = [];
            if (hard)
                self.row_cache = [];
        },
        destroyRow: function (row, hard) {
            var holder = row.container;
            if (hard) {
                row.destroy();
                if (holder.parentNode)
                    holder.parentNode.removeChild(holder);
                if (row.tab && row.tab.parentNode)
                    row.tab.parentNode.removeChild(row.tab);
            }
            else {
                if (row.tab)
                    row.tab.style.display = 'none';
                holder.style.display = 'none';
                row.unregister();
            }
        },
        getMax: function () {
            if ((Array.isArray(this.schema.items)) && this.schema.additionalItems === false) {
                return Math.min(this.schema.items.length, this.schema.maxItems || Infinity);
            }
            else {
                return this.schema.maxItems || Infinity;
            }
        },
        refreshTabs: function (refresh_headers) {
            var self = this;
            $each(this.rows, function (i, row) {
                if (!row.tab)
                    return;
                if (refresh_headers) {
                    row.tab_text.textContent = row.getHeaderText();
                }
                else {
                    if (row.tab === self.active_tab) {
                        self.theme.markTabActive(row.tab);
                        row.container.style.display = '';
                    }
                    else {
                        self.theme.markTabInactive(row.tab);
                        row.container.style.display = 'none';
                    }
                }
            });
        },
        setValue: function (value, initial) {
            // Update the array's value, adding/removing rows when necessary
            value = value || [];
            if (!(Array.isArray(value)))
                value = [value];
            var serialized = JSON.stringify(value);
            if (serialized === this.serialized)
                return;
            // Make sure value has between minItems and maxItems items in it
            if (this.schema.minItems) {
                while (value.length < this.schema.minItems) {
                    value.push(this.getItemInfo(value.length)["default"]);
                }
            }
            if (this.getMax() && value.length > this.getMax()) {
                value = value.slice(0, this.getMax());
            }
            var self = this;
            $each(value, function (i, val) {
                if (self.rows[i]) {
                    // TODO: don't set the row's value if it hasn't changed
                    self.rows[i].setValue(val, initial);
                }
                else if (self.row_cache[i]) {
                    self.rows[i] = self.row_cache[i];
                    self.rows[i].setValue(val, initial);
                    self.rows[i].container.style.display = '';
                    if (self.rows[i].tab)
                        self.rows[i].tab.style.display = '';
                    self.rows[i].register();
                }
                else {
                    self.addRow(val, initial);
                }
            });
            for (var j = value.length; j < self.rows.length; j++) {
                self.destroyRow(self.rows[j]);
                self.rows[j] = null;
            }
            self.rows = self.rows.slice(0, value.length);
            // Set the active tab
            var new_active_tab = null;
            $each(self.rows, function (i, row) {
                if (row.tab === self.active_tab) {
                    new_active_tab = row.tab;
                    return false;
                }
            });
            if (!new_active_tab && self.rows.length)
                new_active_tab = self.rows[0].tab;
            self.active_tab = new_active_tab;
            self.refreshValue(initial);
            self.refreshTabs(true);
            self.refreshTabs();
            self.onChange();
            // TODO: sortable
        },
        refreshValue: function (force) {
            var self = this;
            var oldi = this.value ? this.value.length : 0;
            this.value = [];
            $each(this.rows, function (i, editor) {
                // Get the value for this editor
                self.value[i] = editor.getValue();
            });
            if (oldi !== this.value.length || force) {
                // If we currently have minItems items in the array
                var minItems = this.schema.minItems && this.schema.minItems >= this.rows.length;
                $each(this.rows, function (i, editor) {
                    // Hide the move down button for the last row
                    if (editor.movedown_button) {
                        if (i === self.rows.length - 1) {
                            editor.movedown_button.style.display = 'none';
                        }
                        else {
                            editor.movedown_button.style.display = '';
                        }
                    }
                    // Hide the delete button if we have minItems items
                    if (editor.delete_button) {
                        if (minItems) {
                            editor.delete_button.style.display = 'none';
                        }
                        else {
                            editor.delete_button.style.display = '';
                        }
                    }
                    // Get the value for this editor
                    self.value[i] = editor.getValue();
                });
                var controls_needed = false;
                if (!this.value.length) {
                    this.delete_last_row_button.style.display = 'none';
                    this.remove_all_rows_button.style.display = 'none';
                }
                else if (this.value.length === 1) {
                    this.remove_all_rows_button.style.display = 'none';
                    // If there are minItems items in the array, or configured to hide the delete_last_row button, hide the delete button beneath the rows
                    if (minItems || this.hide_delete_last_row_buttons) {
                        this.delete_last_row_button.style.display = 'none';
                    }
                    else {
                        this.delete_last_row_button.style.display = '';
                        controls_needed = true;
                    }
                }
                else {
                    if (minItems || this.hide_delete_last_row_buttons) {
                        this.delete_last_row_button.style.display = 'none';
                    }
                    else {
                        this.delete_last_row_button.style.display = '';
                        controls_needed = true;
                    }
                    if (minItems || this.hide_delete_all_rows_buttons) {
                        this.remove_all_rows_button.style.display = 'none';
                    }
                    else {
                        this.remove_all_rows_button.style.display = '';
                        controls_needed = true;
                    }
                }
                // If there are maxItems in the array, hide the add button beneath the rows
                if ((this.getMax() && this.getMax() <= this.rows.length) || this.hide_add_button) {
                    this.add_row_button.style.display = 'none';
                }
                else {
                    this.add_row_button.style.display = '';
                    controls_needed = true;
                }
                if (!this.collapsed && controls_needed) {
                    this.controls.style.display = 'inline-block';
                }
                else {
                    this.controls.style.display = 'none';
                }
            }
        },
        addRow: function (value, initial) {
            var self = this;
            var i = this.rows.length;
            self.rows[i] = this.getElementEditor(i);
            self.row_cache[i] = self.rows[i];
            if (self.tabs_holder) {
                self.rows[i].tab_text = document.createElement('span');
                self.rows[i].tab_text.textContent = self.rows[i].getHeaderText();
                self.rows[i].tab = self.theme.getTab(self.rows[i].tab_text);
                self.rows[i].tab.addEventListener('click', function (e) {
                    self.active_tab = self.rows[i].tab;
                    self.refreshTabs();
                    e.preventDefault();
                    e.stopPropagation();
                });
                self.theme.addTab(self.tabs_holder, self.rows[i].tab);
            }
            var controls_holder = self.rows[i].title_controls || self.rows[i].array_controls;
            // Buttons to delete row, move row up, and move row down
            if (!self.hide_delete_buttons) {
                self.rows[i].delete_button = this.getButton(self.getItemTitle(), 'delete', this.translate('button_delete_row_title', [self.getItemTitle()]));
                self.rows[i].delete_button.className += ' delete';
                self.rows[i].delete_button.setAttribute('data-i', i);
                self.rows[i].delete_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var i = this.getAttribute('data-i') * 1;
                    var value = self.getValue();
                    var newval = [];
                    var new_active_tab = null;
                    $each(value, function (j, row) {
                        if (j === i) {
                            // If the one we're deleting is the active tab
                            if (self.rows[j].tab === self.active_tab) {
                                // Make the next tab active if there is one
                                // Note: the next tab is going to be the current tab after deletion
                                if (self.rows[j + 1])
                                    new_active_tab = self.rows[j].tab;
                                else if (j)
                                    new_active_tab = self.rows[j - 1].tab;
                            }
                            return; // If this is the one we're deleting
                        }
                        newval.push(row);
                    });
                    self.setValue(newval);
                    if (new_active_tab) {
                        self.active_tab = new_active_tab;
                        self.refreshTabs();
                    }
                    self.onChange(true);
                });
                if (controls_holder) {
                    controls_holder.appendChild(self.rows[i].delete_button);
                }
            }
            if (i && !self.hide_move_buttons) {
                self.rows[i].moveup_button = this.getButton('', 'moveup', this.translate('button_move_up_title'));
                self.rows[i].moveup_button.className += ' moveup';
                self.rows[i].moveup_button.setAttribute('data-i', i);
                self.rows[i].moveup_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var i = this.getAttribute('data-i') * 1;
                    if (i <= 0)
                        return;
                    var rows = self.getValue();
                    var tmp = rows[i - 1];
                    rows[i - 1] = rows[i];
                    rows[i] = tmp;
                    self.setValue(rows);
                    self.active_tab = self.rows[i - 1].tab;
                    self.refreshTabs();
                    self.onChange(true);
                });
                if (controls_holder) {
                    controls_holder.appendChild(self.rows[i].moveup_button);
                }
            }
            if (!self.hide_move_buttons) {
                self.rows[i].movedown_button = this.getButton('', 'movedown', this.translate('button_move_down_title'));
                self.rows[i].movedown_button.className += ' movedown';
                self.rows[i].movedown_button.setAttribute('data-i', i);
                self.rows[i].movedown_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var i = this.getAttribute('data-i') * 1;
                    var rows = self.getValue();
                    if (i >= rows.length - 1)
                        return;
                    var tmp = rows[i + 1];
                    rows[i + 1] = rows[i];
                    rows[i] = tmp;
                    self.setValue(rows);
                    self.active_tab = self.rows[i + 1].tab;
                    self.refreshTabs();
                    self.onChange(true);
                });
                if (controls_holder) {
                    controls_holder.appendChild(self.rows[i].movedown_button);
                }
            }
            if (value)
                self.rows[i].setValue(value, initial);
            self.refreshTabs();
        },
        addControls: function () {
            var self = this;
            this.collapsed = false;
            this.toggle_button = this.getButton('', 'collapse', this.translate('button_collapse'));
            this.title_controls.appendChild(this.toggle_button);
            var row_holder_display = self.row_holder.style.display;
            var controls_display = self.controls.style.display;
            this.toggle_button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (self.collapsed) {
                    self.collapsed = false;
                    if (self.panel)
                        self.panel.style.display = '';
                    self.row_holder.style.display = row_holder_display;
                    if (self.tabs_holder)
                        self.tabs_holder.style.display = '';
                    self.controls.style.display = controls_display;
                    self.setButtonText(this, '', 'collapse', self.translate('button_collapse'));
                }
                else {
                    self.collapsed = true;
                    self.row_holder.style.display = 'none';
                    if (self.tabs_holder)
                        self.tabs_holder.style.display = 'none';
                    self.controls.style.display = 'none';
                    if (self.panel)
                        self.panel.style.display = 'none';
                    self.setButtonText(this, '', 'expand', self.translate('button_expand'));
                }
            });
            // If it should start collapsed
            if (this.options.collapsed) {
                $trigger(this.toggle_button, 'click');
            }
            // Collapse button disabled
            if (this.schema.options && typeof this.schema.options.disable_collapse !== "undefined") {
                if (this.schema.options.disable_collapse)
                    this.toggle_button.style.display = 'none';
            }
            else if (this.jsoneditor.options.disable_collapse) {
                this.toggle_button.style.display = 'none';
            }
            // Add "new row" and "delete last" buttons below editor
            this.add_row_button = this.getButton(this.getItemTitle(), 'add', this.translate('button_add_row_title', [this.getItemTitle()]));
            this.add_row_button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var i = self.rows.length;
                if (self.row_cache[i]) {
                    self.rows[i] = self.row_cache[i];
                    self.rows[i].setValue(self.rows[i].getDefault(), true);
                    self.rows[i].container.style.display = '';
                    if (self.rows[i].tab)
                        self.rows[i].tab.style.display = '';
                    self.rows[i].register();
                }
                else {
                    self.addRow();
                }
                self.active_tab = self.rows[i].tab;
                self.refreshTabs();
                self.refreshValue();
                self.onChange(true);
            });
            self.controls.appendChild(this.add_row_button);
            this.delete_last_row_button = this.getButton(this.translate('button_delete_last', [this.getItemTitle()]), 'delete', this.translate('button_delete_last_title', [this.getItemTitle()]));
            this.delete_last_row_button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var rows = self.getValue();
                var new_active_tab = null;
                if (self.rows.length > 1 && self.rows[self.rows.length - 1].tab === self.active_tab)
                    new_active_tab = self.rows[self.rows.length - 2].tab;
                rows.pop();
                self.setValue(rows);
                if (new_active_tab) {
                    self.active_tab = new_active_tab;
                    self.refreshTabs();
                }
                self.onChange(true);
            });
            self.controls.appendChild(this.delete_last_row_button);
            this.remove_all_rows_button = this.getButton(this.translate('button_delete_all'), 'delete', this.translate('button_delete_all_title'));
            this.remove_all_rows_button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.setValue([]);
                self.onChange(true);
            });
            self.controls.appendChild(this.remove_all_rows_button);
            if (self.tabs) {
                this.add_row_button.style.width = '100%';
                this.add_row_button.style.textAlign = 'left';
                this.add_row_button.style.marginBottom = '3px';
                this.delete_last_row_button.style.width = '100%';
                this.delete_last_row_button.style.textAlign = 'left';
                this.delete_last_row_button.style.marginBottom = '3px';
                this.remove_all_rows_button.style.width = '100%';
                this.remove_all_rows_button.style.textAlign = 'left';
                this.remove_all_rows_button.style.marginBottom = '3px';
            }
        },
        showValidationErrors: function (errors) {
            var self = this;
            // Get all the errors that pertain to this editor
            var my_errors = [];
            var other_errors = [];
            $each(errors, function (i, error) {
                if (error.path === self.path) {
                    my_errors.push(error);
                }
                else {
                    other_errors.push(error);
                }
            });
            // Show errors for this editor
            if (this.error_holder) {
                if (my_errors.length) {
                    var message = [];
                    this.error_holder.innerHTML = '';
                    this.error_holder.style.display = '';
                    $each(my_errors, function (i, error) {
                        self.error_holder.appendChild(self.theme.getErrorMessage(error.message));
                    });
                }
                else {
                    this.error_holder.style.display = 'none';
                }
            }
            // Show errors for child editors
            $each(this.rows, function (i, row) {
                row.showValidationErrors(other_errors);
            });
        }
    });
    ;
    JSONEditor.defaults.editors.table = JSONEditor.defaults.editors.array.extend({
        register: function () {
            this._super();
            if (this.rows) {
                for (var i = 0; i < this.rows.length; i++) {
                    this.rows[i].register();
                }
            }
        },
        unregister: function () {
            this._super();
            if (this.rows) {
                for (var i = 0; i < this.rows.length; i++) {
                    this.rows[i].unregister();
                }
            }
        },
        getNumColumns: function () {
            return Math.max(Math.min(12, this.width), 3);
        },
        preBuild: function () {
            var item_schema = this.jsoneditor.expandRefs(this.schema.items || {});
            this.item_title = item_schema.title || 'row';
            this.item_default = item_schema["default"] || null;
            this.item_has_child_editors = item_schema.properties || item_schema.items;
            this.width = 12;
            this._super();
        },
        build: function () {
            var self = this;
            this.table = this.theme.getTable();
            this.container.appendChild(this.table);
            this.thead = this.theme.getTableHead();
            this.table.appendChild(this.thead);
            this.header_row = this.theme.getTableRow();
            this.thead.appendChild(this.header_row);
            this.row_holder = this.theme.getTableBody();
            this.table.appendChild(this.row_holder);
            // Determine the default value of array element
            var tmp = this.getElementEditor(0, true);
            this.item_default = tmp.getDefault();
            this.width = tmp.getNumColumns() + 2;
            if (!this.options.compact) {
                this.title = this.theme.getHeader(this.getTitle());
                this.container.appendChild(this.title);
                this.title_controls = this.theme.getHeaderButtonHolder();
                this.title.appendChild(this.title_controls);
                if (this.schema.description) {
                    this.description = this.theme.getDescription(this.schema.description);
                    this.container.appendChild(this.description);
                }
                this.panel = this.theme.getIndentedPanel();
                this.container.appendChild(this.panel);
                this.error_holder = document.createElement('div');
                this.panel.appendChild(this.error_holder);
            }
            else {
                this.panel = document.createElement('div');
                this.container.appendChild(this.panel);
            }
            this.panel.appendChild(this.table);
            this.controls = this.theme.getButtonHolder();
            this.panel.appendChild(this.controls);
            if (this.item_has_child_editors) {
                var ce = tmp.getChildEditors();
                var order = tmp.property_order || Object.keys(ce);
                for (var i = 0; i < order.length; i++) {
                    var th = self.theme.getTableHeaderCell(ce[order[i]].getTitle());
                    if (ce[order[i]].options.hidden)
                        th.style.display = 'none';
                    self.header_row.appendChild(th);
                }
            }
            else {
                self.header_row.appendChild(self.theme.getTableHeaderCell(this.item_title));
            }
            tmp.destroy();
            this.row_holder.innerHTML = '';
            // Row Controls column
            this.controls_header_cell = self.theme.getTableHeaderCell(" ");
            self.header_row.appendChild(this.controls_header_cell);
            // Add controls
            this.addControls();
        },
        onChildEditorChange: function (editor) {
            this.refreshValue();
            this._super();
        },
        getItemDefault: function () {
            return $extend({}, { "default": this.item_default })["default"];
        },
        getItemTitle: function () {
            return this.item_title;
        },
        getElementEditor: function (i, ignore) {
            var schema_copy = $extend({}, this.schema.items);
            var editor = this.jsoneditor.getEditorClass(schema_copy, this.jsoneditor);
            var row = this.row_holder.appendChild(this.theme.getTableRow());
            var holder = row;
            if (!this.item_has_child_editors) {
                holder = this.theme.getTableCell();
                row.appendChild(holder);
            }
            var ret = this.jsoneditor.createEditor(editor, {
                jsoneditor: this.jsoneditor,
                schema: schema_copy,
                container: holder,
                path: this.path + '.' + i,
                parent: this,
                compact: true,
                table_row: true
            });
            ret.preBuild();
            if (!ignore) {
                ret.build();
                ret.postBuild();
                ret.controls_cell = row.appendChild(this.theme.getTableCell());
                ret.row = row;
                ret.table_controls = this.theme.getButtonHolder();
                ret.controls_cell.appendChild(ret.table_controls);
                ret.table_controls.style.margin = 0;
                ret.table_controls.style.padding = 0;
            }
            return ret;
        },
        destroy: function () {
            this.innerHTML = '';
            if (this.title && this.title.parentNode)
                this.title.parentNode.removeChild(this.title);
            if (this.description && this.description.parentNode)
                this.description.parentNode.removeChild(this.description);
            if (this.row_holder && this.row_holder.parentNode)
                this.row_holder.parentNode.removeChild(this.row_holder);
            if (this.table && this.table.parentNode)
                this.table.parentNode.removeChild(this.table);
            if (this.panel && this.panel.parentNode)
                this.panel.parentNode.removeChild(this.panel);
            this.rows = this.title = this.description = this.row_holder = this.table = this.panel = null;
            this._super();
        },
        setValue: function (value, initial) {
            // Update the array's value, adding/removing rows when necessary
            value = value || [];
            // Make sure value has between minItems and maxItems items in it
            if (this.schema.minItems) {
                while (value.length < this.schema.minItems) {
                    value.push(this.getItemDefault());
                }
            }
            if (this.schema.maxItems && value.length > this.schema.maxItems) {
                value = value.slice(0, this.schema.maxItems);
            }
            var serialized = JSON.stringify(value);
            if (serialized === this.serialized)
                return;
            var numrows_changed = false;
            var self = this;
            $each(value, function (i, val) {
                if (self.rows[i]) {
                    // TODO: don't set the row's value if it hasn't changed
                    self.rows[i].setValue(val);
                }
                else {
                    self.addRow(val);
                    numrows_changed = true;
                }
            });
            for (var j = value.length; j < self.rows.length; j++) {
                var holder = self.rows[j].container;
                if (!self.item_has_child_editors) {
                    self.rows[j].row.parentNode.removeChild(self.rows[j].row);
                }
                self.rows[j].destroy();
                if (holder.parentNode)
                    holder.parentNode.removeChild(holder);
                self.rows[j] = null;
                numrows_changed = true;
            }
            self.rows = self.rows.slice(0, value.length);
            self.refreshValue();
            if (numrows_changed || initial)
                self.refreshRowButtons();
            self.onChange();
            // TODO: sortable
        },
        refreshRowButtons: function () {
            var self = this;
            // If we currently have minItems items in the array
            var minItems = this.schema.minItems && this.schema.minItems >= this.rows.length;
            var need_row_buttons = false;
            $each(this.rows, function (i, editor) {
                // Hide the move down button for the last row
                if (editor.movedown_button) {
                    if (i === self.rows.length - 1) {
                        editor.movedown_button.style.display = 'none';
                    }
                    else {
                        need_row_buttons = true;
                        editor.movedown_button.style.display = '';
                    }
                }
                // Hide the delete button if we have minItems items
                if (editor.delete_button) {
                    if (minItems) {
                        editor.delete_button.style.display = 'none';
                    }
                    else {
                        need_row_buttons = true;
                        editor.delete_button.style.display = '';
                    }
                }
                if (editor.moveup_button) {
                    need_row_buttons = true;
                }
            });
            // Show/hide controls column in table
            $each(this.rows, function (i, editor) {
                if (need_row_buttons) {
                    editor.controls_cell.style.display = '';
                }
                else {
                    editor.controls_cell.style.display = 'none';
                }
            });
            if (need_row_buttons) {
                this.controls_header_cell.style.display = '';
            }
            else {
                this.controls_header_cell.style.display = 'none';
            }
            var controls_needed = false;
            if (!this.value.length) {
                this.delete_last_row_button.style.display = 'none';
                this.remove_all_rows_button.style.display = 'none';
                this.table.style.display = 'none';
            }
            else if (this.value.length === 1) {
                this.table.style.display = '';
                this.remove_all_rows_button.style.display = 'none';
                // If there are minItems items in the array, or configured to hide the delete_last_row button, hide the delete button beneath the rows
                if (minItems || this.hide_delete_last_row_buttons) {
                    this.delete_last_row_button.style.display = 'none';
                }
                else {
                    this.delete_last_row_button.style.display = '';
                    controls_needed = true;
                }
            }
            else {
                this.table.style.display = '';
                if (minItems || this.hide_delete_last_row_buttons) {
                    this.delete_last_row_button.style.display = 'none';
                }
                else {
                    this.delete_last_row_button.style.display = '';
                    controls_needed = true;
                }
                if (minItems || this.hide_delete_all_rows_buttons) {
                    this.remove_all_rows_button.style.display = 'none';
                }
                else {
                    this.remove_all_rows_button.style.display = '';
                    controls_needed = true;
                }
            }
            // If there are maxItems in the array, hide the add button beneath the rows
            if ((this.schema.maxItems && this.schema.maxItems <= this.rows.length) || this.hide_add_button) {
                this.add_row_button.style.display = 'none';
            }
            else {
                this.add_row_button.style.display = '';
                controls_needed = true;
            }
            if (!controls_needed) {
                this.controls.style.display = 'none';
            }
            else {
                this.controls.style.display = '';
            }
        },
        refreshValue: function () {
            var self = this;
            this.value = [];
            $each(this.rows, function (i, editor) {
                // Get the value for this editor
                self.value[i] = editor.getValue();
            });
            this.serialized = JSON.stringify(this.value);
        },
        addRow: function (value) {
            var self = this;
            var i = this.rows.length;
            self.rows[i] = this.getElementEditor(i);
            var controls_holder = self.rows[i].table_controls;
            // Buttons to delete row, move row up, and move row down
            if (!this.hide_delete_buttons) {
                self.rows[i].delete_button = this.getButton('', 'delete', this.translate('button_delete_row_title_short'));
                self.rows[i].delete_button.className += ' delete';
                self.rows[i].delete_button.setAttribute('data-i', i);
                self.rows[i].delete_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var i = this.getAttribute('data-i') * 1;
                    var value = self.getValue();
                    var newval = [];
                    $each(value, function (j, row) {
                        if (j === i)
                            return; // If this is the one we're deleting
                        newval.push(row);
                    });
                    self.setValue(newval);
                    self.onChange(true);
                });
                controls_holder.appendChild(self.rows[i].delete_button);
            }
            if (i && !this.hide_move_buttons) {
                self.rows[i].moveup_button = this.getButton('', 'moveup', this.translate('button_move_up_title'));
                self.rows[i].moveup_button.className += ' moveup';
                self.rows[i].moveup_button.setAttribute('data-i', i);
                self.rows[i].moveup_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var i = this.getAttribute('data-i') * 1;
                    if (i <= 0)
                        return;
                    var rows = self.getValue();
                    var tmp = rows[i - 1];
                    rows[i - 1] = rows[i];
                    rows[i] = tmp;
                    self.setValue(rows);
                    self.onChange(true);
                });
                controls_holder.appendChild(self.rows[i].moveup_button);
            }
            if (!this.hide_move_buttons) {
                self.rows[i].movedown_button = this.getButton('', 'movedown', this.translate('button_move_down_title'));
                self.rows[i].movedown_button.className += ' movedown';
                self.rows[i].movedown_button.setAttribute('data-i', i);
                self.rows[i].movedown_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var i = this.getAttribute('data-i') * 1;
                    var rows = self.getValue();
                    if (i >= rows.length - 1)
                        return;
                    var tmp = rows[i + 1];
                    rows[i + 1] = rows[i];
                    rows[i] = tmp;
                    self.setValue(rows);
                    self.onChange(true);
                });
                controls_holder.appendChild(self.rows[i].movedown_button);
            }
            if (value)
                self.rows[i].setValue(value);
        },
        addControls: function () {
            var self = this;
            this.collapsed = false;
            this.toggle_button = this.getButton('', 'collapse', this.translate('button_collapse'));
            if (this.title_controls) {
                this.title_controls.appendChild(this.toggle_button);
                this.toggle_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (self.collapsed) {
                        self.collapsed = false;
                        self.panel.style.display = '';
                        self.setButtonText(this, '', 'collapse', self.translate('button_collapse'));
                    }
                    else {
                        self.collapsed = true;
                        self.panel.style.display = 'none';
                        self.setButtonText(this, '', 'expand', self.translate('button_expand'));
                    }
                });
                // If it should start collapsed
                if (this.options.collapsed) {
                    $trigger(this.toggle_button, 'click');
                }
                // Collapse button disabled
                if (this.schema.options && typeof this.schema.options.disable_collapse !== "undefined") {
                    if (this.schema.options.disable_collapse)
                        this.toggle_button.style.display = 'none';
                }
                else if (this.jsoneditor.options.disable_collapse) {
                    this.toggle_button.style.display = 'none';
                }
            }
            // Add "new row" and "delete last" buttons below editor
            this.add_row_button = this.getButton(this.getItemTitle(), 'add', this.translate('button_add_row_title', [this.getItemTitle()]));
            this.add_row_button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.addRow();
                self.refreshValue();
                self.refreshRowButtons();
                self.onChange(true);
            });
            self.controls.appendChild(this.add_row_button);
            this.delete_last_row_button = this.getButton(this.translate('button_delete_last', [this.getItemTitle()]), 'delete', this.translate('button_delete_last_title', [this.getItemTitle()]));
            this.delete_last_row_button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var rows = self.getValue();
                rows.pop();
                self.setValue(rows);
                self.onChange(true);
            });
            self.controls.appendChild(this.delete_last_row_button);
            this.remove_all_rows_button = this.getButton(this.translate('button_delete_all'), 'delete', this.translate('button_delete_all_title'));
            this.remove_all_rows_button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.setValue([]);
                self.onChange(true);
            });
            self.controls.appendChild(this.remove_all_rows_button);
        }
    });
    ; // Multiple Editor (for when `type` is an array)
    JSONEditor.defaults.editors.multiple = JSONEditor.AbstractEditor.extend({
        register: function () {
            if (this.editors) {
                for (var i = 0; i < this.editors.length; i++) {
                    if (!this.editors[i])
                        continue;
                    this.editors[i].unregister();
                }
                if (this.editors[this.type])
                    this.editors[this.type].register();
            }
            this._super();
        },
        unregister: function () {
            this._super();
            if (this.editors) {
                for (var i = 0; i < this.editors.length; i++) {
                    if (!this.editors[i])
                        continue;
                    this.editors[i].unregister();
                }
            }
        },
        getNumColumns: function () {
            if (!this.editors[this.type])
                return 4;
            return Math.max(this.editors[this.type].getNumColumns(), 4);
        },
        enable: function () {
            if (this.editors) {
                for (var i = 0; i < this.editors.length; i++) {
                    if (!this.editors[i])
                        continue;
                    this.editors[i].enable();
                }
            }
            this.switcher.disabled = false;
            this._super();
        },
        disable: function () {
            if (this.editors) {
                for (var i = 0; i < this.editors.length; i++) {
                    if (!this.editors[i])
                        continue;
                    this.editors[i].disable();
                }
            }
            this.switcher.disabled = true;
            this._super();
        },
        switchEditor: function (i) {
            var self = this;
            if (!this.editors[i]) {
                this.buildChildEditor(i);
            }
            var current_value = self.getValue();
            self.type = i;
            self.register();
            $each(self.editors, function (type, editor) {
                if (!editor)
                    return;
                if (self.type === type) {
                    if (self.keep_values)
                        editor.setValue(current_value, true);
                    editor.container.style.display = '';
                }
                else
                    editor.container.style.display = 'none';
            });
            self.refreshValue();
            self.refreshHeaderText();
        },
        buildChildEditor: function (i) {
            var self = this;
            var type = this.types[i];
            var holder = self.theme.getChildEditorHolder();
            self.editor_holder.appendChild(holder);
            var schema;
            if (typeof type === "string") {
                schema = $extend({}, self.schema);
                schema.type = type;
            }
            else {
                schema = $extend({}, self.schema, type);
                schema = self.jsoneditor.expandRefs(schema);
                // If we need to merge `required` arrays
                if (type.required && Array.isArray(type.required) && self.schema.required && Array.isArray(self.schema.required)) {
                    schema.required = self.schema.required.concat(type.required);
                }
            }
            var editor = self.jsoneditor.getEditorClass(schema);
            self.editors[i] = self.jsoneditor.createEditor(editor, {
                jsoneditor: self.jsoneditor,
                schema: schema,
                container: holder,
                path: self.path,
                parent: self,
                required: true
            });
            self.editors[i].preBuild();
            self.editors[i].build();
            self.editors[i].postBuild();
            if (self.editors[i].header)
                self.editors[i].header.style.display = 'none';
            self.editors[i].option = self.switcher_options[i];
            holder.addEventListener('change_header_text', function () {
                self.refreshHeaderText();
            });
            if (i !== self.type)
                holder.style.display = 'none';
        },
        preBuild: function () {
            var self = this;
            this.types = [];
            this.type = 0;
            this.editors = [];
            this.validators = [];
            this.keep_values = true;
            if (typeof this.jsoneditor.options.keep_oneof_values !== "undefined")
                this.keep_values = this.jsoneditor.options.keep_oneof_values;
            if (typeof this.options.keep_oneof_values !== "undefined")
                this.keep_values = this.options.keep_oneof_values;
            if (this.schema.oneOf) {
                this.oneOf = true;
                this.types = this.schema.oneOf;
                delete this.schema.oneOf;
            }
            else if (this.schema.anyOf) {
                this.anyOf = true;
                this.types = this.schema.anyOf;
                delete this.schema.anyOf;
            }
            else {
                if (!this.schema.type || this.schema.type === "any") {
                    this.types = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'];
                    // If any of these primitive types are disallowed
                    if (this.schema.disallow) {
                        var disallow = this.schema.disallow;
                        if (typeof disallow !== 'object' || !(Array.isArray(disallow))) {
                            disallow = [disallow];
                        }
                        var allowed_types = [];
                        $each(this.types, function (i, type) {
                            if (disallow.indexOf(type) === -1)
                                allowed_types.push(type);
                        });
                        this.types = allowed_types;
                    }
                }
                else if (Array.isArray(this.schema.type)) {
                    this.types = this.schema.type;
                }
                else {
                    this.types = [this.schema.type];
                }
                delete this.schema.type;
            }
            this.display_text = this.getDisplayText(this.types);
        },
        build: function () {
            var self = this;
            var container = this.container;
            this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
            this.container.appendChild(this.header);
            this.switcher = this.theme.getSwitcher(this.display_text);
            container.appendChild(this.switcher);
            this.switcher.addEventListener('change', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.switchEditor(self.display_text.indexOf(this.value));
                self.onChange(true);
            });
            this.editor_holder = document.createElement('div');
            container.appendChild(this.editor_holder);
            var validator_options = {};
            if (self.jsoneditor.options.custom_validators) {
                validator_options.custom_validators = self.jsoneditor.options.custom_validators;
            }
            this.switcher_options = this.theme.getSwitcherOptions(this.switcher);
            $each(this.types, function (i, type) {
                self.editors[i] = false;
                var schema;
                if (typeof type === "string") {
                    schema = $extend({}, self.schema);
                    schema.type = type;
                }
                else {
                    schema = $extend({}, self.schema, type);
                    // If we need to merge `required` arrays
                    if (type.required && Array.isArray(type.required) && self.schema.required && Array.isArray(self.schema.required)) {
                        schema.required = self.schema.required.concat(type.required);
                    }
                }
                self.validators[i] = new JSONEditor.Validator(self.jsoneditor, schema, validator_options);
            });
            this.switchEditor(0);
        },
        onChildEditorChange: function (editor) {
            if (this.editors[this.type]) {
                this.refreshValue();
                this.refreshHeaderText();
            }
            this._super();
        },
        refreshHeaderText: function () {
            var display_text = this.getDisplayText(this.types);
            $each(this.switcher_options, function (i, option) {
                option.textContent = display_text[i];
            });
        },
        refreshValue: function () {
            this.value = this.editors[this.type].getValue();
        },
        setValue: function (val, initial) {
            // Determine type by getting the first one that validates
            var self = this;
            $each(this.validators, function (i, validator) {
                if (!validator.validate(val).length) {
                    self.type = i;
                    self.switcher.value = self.display_text[i];
                    return false;
                }
            });
            this.switchEditor(this.type);
            this.editors[this.type].setValue(val, initial);
            this.refreshValue();
            self.onChange();
        },
        destroy: function () {
            $each(this.editors, function (type, editor) {
                if (editor)
                    editor.destroy();
            });
            if (this.editor_holder && this.editor_holder.parentNode)
                this.editor_holder.parentNode.removeChild(this.editor_holder);
            if (this.switcher && this.switcher.parentNode)
                this.switcher.parentNode.removeChild(this.switcher);
            this._super();
        },
        showValidationErrors: function (errors) {
            var self = this;
            // oneOf and anyOf error paths need to remove the oneOf[i] part before passing to child editors
            if (this.oneOf || this.anyOf) {
                var check_part = this.oneOf ? 'oneOf' : 'anyOf';
                $each(this.editors, function (i, editor) {
                    if (!editor)
                        return;
                    var check = self.path + '.' + check_part + '[' + i + ']';
                    var new_errors = [];
                    $each(errors, function (j, error) {
                        if (error.path.substr(0, check.length) === check) {
                            var new_error = $extend({}, error);
                            new_error.path = self.path + new_error.path.substr(check.length);
                            new_errors.push(new_error);
                        }
                    });
                    editor.showValidationErrors(new_errors);
                });
            }
            else {
                $each(this.editors, function (type, editor) {
                    if (!editor)
                        return;
                    editor.showValidationErrors(errors);
                });
            }
        }
    });
    ; // Enum Editor (used for objects and arrays with enumerated values)
    JSONEditor.defaults.editors["enum"] = JSONEditor.AbstractEditor.extend({
        getNumColumns: function () {
            return 4;
        },
        build: function () {
            var container = this.container;
            this.title = this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
            this.container.appendChild(this.title);
            this.options.enum_titles = this.options.enum_titles || [];
            this["enum"] = this.schema["enum"];
            this.selected = 0;
            this.select_options = [];
            this.html_values = [];
            var self = this;
            for (var i = 0; i < this["enum"].length; i++) {
                this.select_options[i] = this.options.enum_titles[i] || "Value " + (i + 1);
                this.html_values[i] = this.getHTML(this["enum"][i]);
            }
            // Switcher
            this.switcher = this.theme.getSwitcher(this.select_options);
            this.container.appendChild(this.switcher);
            // Display area
            this.display_area = this.theme.getIndentedPanel();
            this.container.appendChild(this.display_area);
            if (this.options.hide_display)
                this.display_area.style.display = "none";
            this.switcher.addEventListener('change', function () {
                self.selected = self.select_options.indexOf(this.value);
                self.value = self["enum"][self.selected];
                self.refreshValue();
                self.onChange(true);
            });
            this.value = this["enum"][0];
            this.refreshValue();
            if (this["enum"].length === 1)
                this.switcher.style.display = 'none';
        },
        refreshValue: function () {
            var self = this;
            self.selected = -1;
            var stringified = JSON.stringify(this.value);
            $each(this["enum"], function (i, el) {
                if (stringified === JSON.stringify(el)) {
                    self.selected = i;
                    return false;
                }
            });
            if (self.selected < 0) {
                self.setValue(self["enum"][0]);
                return;
            }
            this.switcher.value = this.select_options[this.selected];
            this.display_area.innerHTML = this.html_values[this.selected];
        },
        enable: function () {
            if (!this.always_disabled)
                this.switcher.disabled = false;
            this._super();
        },
        disable: function () {
            this.switcher.disabled = true;
            this._super();
        },
        getHTML: function (el) {
            var self = this;
            if (el === null) {
                return '<em>null</em>';
            }
            else if (typeof el === "object") {
                // TODO: use theme
                var ret = '';
                $each(el, function (i, child) {
                    var html = self.getHTML(child);
                    // Add the keys to object children
                    if (!(Array.isArray(el))) {
                        // TODO: use theme
                        html = '<div><em>' + i + '</em>: ' + html + '</div>';
                    }
                    // TODO: use theme
                    ret += '<li>' + html + '</li>';
                });
                if (Array.isArray(el))
                    ret = '<ol>' + ret + '</ol>';
                else
                    ret = "<ul style='margin-top:0;margin-bottom:0;padding-top:0;padding-bottom:0;'>" + ret + '</ul>';
                return ret;
            }
            else if (typeof el === "boolean") {
                return el ? 'true' : 'false';
            }
            else if (typeof el === "string") {
                return el.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
            else {
                return el;
            }
        },
        setValue: function (val) {
            if (this.value !== val) {
                this.value = val;
                this.refreshValue();
                this.onChange();
            }
        },
        destroy: function () {
            if (this.display_area && this.display_area.parentNode)
                this.display_area.parentNode.removeChild(this.display_area);
            if (this.title && this.title.parentNode)
                this.title.parentNode.removeChild(this.title);
            if (this.switcher && this.switcher.parentNode)
                this.switcher.parentNode.removeChild(this.switcher);
            this._super();
        }
    });
    ;
    JSONEditor.defaults.editors.select = JSONEditor.AbstractEditor.extend({
        setValue: function (value, initial) {
            value = this.typecast(value || '');
            // Sanitize value before setting it
            var sanitized = value;
            if (this.enum_values.indexOf(sanitized) < 0) {
                sanitized = this.enum_values[0];
            }
            if (this.value === sanitized) {
                return;
            }
            this.input.value = this.enum_options[this.enum_values.indexOf(sanitized)];
            if (this.select2)
                this.select2.select2('val', this.input.value);
            this.value = sanitized;
            this.onChange();
        },
        register: function () {
            this._super();
            if (!this.input)
                return;
            this.input.setAttribute('name', this.formname);
        },
        unregister: function () {
            this._super();
            if (!this.input)
                return;
            this.input.removeAttribute('name');
        },
        getNumColumns: function () {
            if (!this.enum_options)
                return 3;
            var longest_text = this.getTitle().length;
            for (var i = 0; i < this.enum_options.length; i++) {
                longest_text = Math.max(longest_text, this.enum_options[i].length + 4);
            }
            return Math.min(12, Math.max(longest_text / 7, 2));
        },
        typecast: function (value) {
            if (this.schema.type === "boolean") {
                return !!value;
            }
            else if (this.schema.type === "number") {
                return 1 * value;
            }
            else if (this.schema.type === "integer") {
                return Math.floor(value * 1);
            }
            else {
                return "" + value;
            }
        },
        getValue: function () {
            return this.value;
        },
        preBuild: function () {
            var self = this;
            this.input_type = 'select';
            this.enum_options = [];
            this.enum_values = [];
            this.enum_display = [];
            var i;
            // Enum options enumerated
            if (this.schema["enum"]) {
                var display = this.schema.options && this.schema.options.enum_titles || [];
                $each(this.schema["enum"], function (i, option) {
                    self.enum_options[i] = "" + option;
                    self.enum_display[i] = "" + (display[i] || option);
                    self.enum_values[i] = self.typecast(option);
                });
                if (!this.isRequired()) {
                    self.enum_display.unshift(' ');
                    self.enum_options.unshift('undefined');
                    self.enum_values.unshift(undefined);
                }
            }
            else if (this.schema.type === "boolean") {
                self.enum_display = this.schema.options && this.schema.options.enum_titles || ['true', 'false'];
                self.enum_options = ['1', ''];
                self.enum_values = [true, false];
                if (!this.isRequired()) {
                    self.enum_display.unshift(' ');
                    self.enum_options.unshift('undefined');
                    self.enum_values.unshift(undefined);
                }
            }
            else if (this.schema.enumSource) {
                this.enumSource = [];
                this.enum_display = [];
                this.enum_options = [];
                this.enum_values = [];
                // Shortcut declaration for using a single array
                if (!(Array.isArray(this.schema.enumSource))) {
                    if (this.schema.enumValue) {
                        this.enumSource = [
                            {
                                source: this.schema.enumSource,
                                value: this.schema.enumValue
                            }
                        ];
                    }
                    else {
                        this.enumSource = [
                            {
                                source: this.schema.enumSource
                            }
                        ];
                    }
                }
                else {
                    for (i = 0; i < this.schema.enumSource.length; i++) {
                        // Shorthand for watched variable
                        if (typeof this.schema.enumSource[i] === "string") {
                            this.enumSource[i] = {
                                source: this.schema.enumSource[i]
                            };
                        }
                        else if (!(Array.isArray(this.schema.enumSource[i]))) {
                            this.enumSource[i] = $extend({}, this.schema.enumSource[i]);
                        }
                        else {
                            this.enumSource[i] = this.schema.enumSource[i];
                        }
                    }
                }
                // Now, enumSource is an array of sources
                // Walk through this array and fix up the values
                for (i = 0; i < this.enumSource.length; i++) {
                    if (this.enumSource[i].value) {
                        this.enumSource[i].value = this.jsoneditor.compileTemplate(this.enumSource[i].value, this.template_engine);
                    }
                    if (this.enumSource[i].title) {
                        this.enumSource[i].title = this.jsoneditor.compileTemplate(this.enumSource[i].title, this.template_engine);
                    }
                    if (this.enumSource[i].filter) {
                        this.enumSource[i].filter = this.jsoneditor.compileTemplate(this.enumSource[i].filter, this.template_engine);
                    }
                }
            }
            else {
                throw "'select' editor requires the enum property to be set.";
            }
        },
        build: function () {
            var self = this;
            if (!this.options.compact)
                this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
            if (this.schema.description)
                this.description = this.theme.getFormInputDescription(this.schema.description);
            if (this.options.compact)
                this.container.className += ' compact';
            this.input = this.theme.getSelectInput(this.enum_options);
            this.theme.setSelectOptions(this.input, this.enum_options, this.enum_display);
            if (this.schema.readOnly || this.schema.readonly) {
                this.always_disabled = true;
                this.input.disabled = true;
            }
            this.input.addEventListener('change', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.onInputChange();
            });
            this.control = this.theme.getFormControl(this.label, this.input, this.description);
            this.container.appendChild(this.control);
            this.value = this.enum_values[0];
        },
        onInputChange: function () {
            var val = this.input.value;
            var new_val;
            // Invalid option, use first option instead
            if (this.enum_options.indexOf(val) === -1) {
                new_val = this.enum_values[0];
            }
            else {
                new_val = this.enum_values[this.enum_options.indexOf(val)];
            }
            // If valid hasn't changed
            if (new_val === this.value)
                return;
            // Store new value and propogate change event
            this.value = new_val;
            this.onChange(true);
        },
        setupSelect2: function () {
            // If the Select2 library is loaded use it when we have lots of items
            if (window.jQuery && window.jQuery.fn && window.jQuery.fn.select2 && (this.enum_options.length > 2 || (this.enum_options.length && this.enumSource))) {
                var options = $extend({}, JSONEditor.plugins.select2);
                if (this.schema.options && this.schema.options.select2_options)
                    options = $extend(options, this.schema.options.select2_options);
                this.select2 = window.jQuery(this.input).select2(options);
                var self = this;
                this.select2.on('select2-blur', function () {
                    self.input.value = self.select2.select2('val');
                    self.onInputChange();
                });
                this.select2.on('change', function () {
                    self.input.value = self.select2.select2('val');
                    self.onInputChange();
                });
            }
            else {
                this.select2 = null;
            }
        },
        postBuild: function () {
            this._super();
            this.theme.afterInputReady(this.input);
            this.setupSelect2();
        },
        onWatchedFieldChange: function () {
            var self = this, vars, j;
            // If this editor uses a dynamic select box
            if (this.enumSource) {
                vars = this.getWatchedFieldValues();
                var select_options = [];
                var select_titles = [];
                for (var i = 0; i < this.enumSource.length; i++) {
                    // Constant values
                    if (Array.isArray(this.enumSource[i])) {
                        select_options = select_options.concat(this.enumSource[i]);
                        select_titles = select_titles.concat(this.enumSource[i]);
                    }
                    else {
                        var items = [];
                        // Static list of items
                        if (Array.isArray(this.enumSource[i].source)) {
                            items = this.enumSource[i].source;
                            // A watched field
                        }
                        else {
                            items = vars[this.enumSource[i].source];
                        }
                        if (items) {
                            // Only use a predefined part of the array
                            if (this.enumSource[i].slice) {
                                items = Array.prototype.slice.apply(items, this.enumSource[i].slice);
                            }
                            // Filter the items
                            if (this.enumSource[i].filter) {
                                var new_items = [];
                                for (j = 0; j < items.length; j++) {
                                    if (this.enumSource[i].filter({ i: j, item: items[j], watched: vars }))
                                        new_items.push(items[j]);
                                }
                                items = new_items;
                            }
                            var item_titles = [];
                            var item_values = [];
                            for (j = 0; j < items.length; j++) {
                                var item = items[j];
                                // Rendered value
                                if (this.enumSource[i].value) {
                                    item_values[j] = this.enumSource[i].value({
                                        i: j,
                                        item: item
                                    });
                                }
                                else {
                                    item_values[j] = items[j];
                                }
                                // Rendered title
                                if (this.enumSource[i].title) {
                                    item_titles[j] = this.enumSource[i].title({
                                        i: j,
                                        item: item
                                    });
                                }
                                else {
                                    item_titles[j] = item_values[j];
                                }
                            }
                            // TODO: sort
                            select_options = select_options.concat(item_values);
                            select_titles = select_titles.concat(item_titles);
                        }
                    }
                }
                var prev_value = this.value;
                this.theme.setSelectOptions(this.input, select_options, select_titles);
                this.enum_options = select_options;
                this.enum_display = select_titles;
                this.enum_values = select_options;
                if (this.select2) {
                    this.select2.select2('destroy');
                }
                // If the previous value is still in the new select options, stick with it
                if (select_options.indexOf(prev_value) !== -1) {
                    this.input.value = prev_value;
                    this.value = prev_value;
                }
                else {
                    this.input.value = select_options[0];
                    this.value = select_options[0] || "";
                    if (this.parent)
                        this.parent.onChildEditorChange(this);
                    else
                        this.jsoneditor.onChange();
                    this.jsoneditor.notifyWatchers(this.path);
                }
                this.setupSelect2();
            }
            this._super();
        },
        enable: function () {
            if (!this.always_disabled) {
                this.input.disabled = false;
                if (this.select2)
                    this.select2.select2("enable", true);
            }
            this._super();
        },
        disable: function () {
            this.input.disabled = true;
            if (this.select2)
                this.select2.select2("enable", false);
            this._super();
        },
        destroy: function () {
            if (this.label && this.label.parentNode)
                this.label.parentNode.removeChild(this.label);
            if (this.description && this.description.parentNode)
                this.description.parentNode.removeChild(this.description);
            if (this.input && this.input.parentNode)
                this.input.parentNode.removeChild(this.input);
            if (this.select2) {
                this.select2.select2('destroy');
                this.select2 = null;
            }
            this._super();
        }
    });
    ;
    JSONEditor.defaults.editors.selectize = JSONEditor.AbstractEditor.extend({
        setValue: function (value, initial) {
            value = this.typecast(value || '');
            // Sanitize value before setting it
            var sanitized = value;
            if (this.enum_values.indexOf(sanitized) < 0) {
                sanitized = this.enum_values[0];
            }
            if (this.value === sanitized) {
                return;
            }
            this.input.value = this.enum_options[this.enum_values.indexOf(sanitized)];
            if (this.selectize) {
                this.selectize[0].selectize.addItem(sanitized);
            }
            this.value = sanitized;
            this.onChange();
        },
        register: function () {
            this._super();
            if (!this.input)
                return;
            this.input.setAttribute('name', this.formname);
        },
        unregister: function () {
            this._super();
            if (!this.input)
                return;
            this.input.removeAttribute('name');
        },
        getNumColumns: function () {
            if (!this.enum_options)
                return 3;
            var longest_text = this.getTitle().length;
            for (var i = 0; i < this.enum_options.length; i++) {
                longest_text = Math.max(longest_text, this.enum_options[i].length + 4);
            }
            return Math.min(12, Math.max(longest_text / 7, 2));
        },
        typecast: function (value) {
            if (this.schema.type === "boolean") {
                return !!value;
            }
            else if (this.schema.type === "number") {
                return 1 * value;
            }
            else if (this.schema.type === "integer") {
                return Math.floor(value * 1);
            }
            else {
                return "" + value;
            }
        },
        getValue: function () {
            return this.value;
        },
        preBuild: function () {
            var self = this;
            this.input_type = 'select';
            this.enum_options = [];
            this.enum_values = [];
            this.enum_display = [];
            var i;
            // Enum options enumerated
            if (this.schema.enum) {
                var display = this.schema.options && this.schema.options.enum_titles || [];
                $each(this.schema.enum, function (i, option) {
                    self.enum_options[i] = "" + option;
                    self.enum_display[i] = "" + (display[i] || option);
                    self.enum_values[i] = self.typecast(option);
                });
            }
            else if (this.schema.type === "boolean") {
                self.enum_display = this.schema.options && this.schema.options.enum_titles || ['true', 'false'];
                self.enum_options = ['1', '0'];
                self.enum_values = [true, false];
            }
            else if (this.schema.enumSource) {
                this.enumSource = [];
                this.enum_display = [];
                this.enum_options = [];
                this.enum_values = [];
                // Shortcut declaration for using a single array
                if (!(Array.isArray(this.schema.enumSource))) {
                    if (this.schema.enumValue) {
                        this.enumSource = [
                            {
                                source: this.schema.enumSource,
                                value: this.schema.enumValue
                            }
                        ];
                    }
                    else {
                        this.enumSource = [
                            {
                                source: this.schema.enumSource
                            }
                        ];
                    }
                }
                else {
                    for (i = 0; i < this.schema.enumSource.length; i++) {
                        // Shorthand for watched variable
                        if (typeof this.schema.enumSource[i] === "string") {
                            this.enumSource[i] = {
                                source: this.schema.enumSource[i]
                            };
                        }
                        else if (!(Array.isArray(this.schema.enumSource[i]))) {
                            this.enumSource[i] = $extend({}, this.schema.enumSource[i]);
                        }
                        else {
                            this.enumSource[i] = this.schema.enumSource[i];
                        }
                    }
                }
                // Now, enumSource is an array of sources
                // Walk through this array and fix up the values
                for (i = 0; i < this.enumSource.length; i++) {
                    if (this.enumSource[i].value) {
                        this.enumSource[i].value = this.jsoneditor.compileTemplate(this.enumSource[i].value, this.template_engine);
                    }
                    if (this.enumSource[i].title) {
                        this.enumSource[i].title = this.jsoneditor.compileTemplate(this.enumSource[i].title, this.template_engine);
                    }
                    if (this.enumSource[i].filter) {
                        this.enumSource[i].filter = this.jsoneditor.compileTemplate(this.enumSource[i].filter, this.template_engine);
                    }
                }
            }
            else {
                throw "'select' editor requires the enum property to be set.";
            }
        },
        build: function () {
            var self = this;
            if (!this.options.compact)
                this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
            if (this.schema.description)
                this.description = this.theme.getFormInputDescription(this.schema.description);
            if (this.options.compact)
                this.container.className += ' compact';
            this.input = this.theme.getSelectInput(this.enum_options);
            this.theme.setSelectOptions(this.input, this.enum_options, this.enum_display);
            if (this.schema.readOnly || this.schema.readonly) {
                this.always_disabled = true;
                this.input.disabled = true;
            }
            this.input.addEventListener('change', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.onInputChange();
            });
            this.control = this.theme.getFormControl(this.label, this.input, this.description);
            this.container.appendChild(this.control);
            this.value = this.enum_values[0];
        },
        onInputChange: function () {
            var val = this.input.value;
            var sanitized = val;
            if (this.enum_options.indexOf(val) === -1) {
                sanitized = this.enum_options[0];
            }
            this.value = this.enum_values[this.enum_options.indexOf(val)];
            this.onChange(true);
        },
        setupSelectize: function () {
            // If the Selectize library is loaded use it when we have lots of items
            var self = this;
            if (window.jQuery && window.jQuery.fn && window.jQuery.fn.selectize && (this.enum_options.length >= 2 || (this.enum_options.length && this.enumSource))) {
                var options = $extend({}, JSONEditor.plugins.selectize);
                if (this.schema.options && this.schema.options.selectize_options)
                    options = $extend(options, this.schema.options.selectize_options);
                this.selectize = window.jQuery(this.input).selectize($extend(options, {
                    create: true,
                    onChange: function () {
                        self.onInputChange();
                    }
                }));
            }
            else {
                this.selectize = null;
            }
        },
        postBuild: function () {
            this._super();
            this.theme.afterInputReady(this.input);
            this.setupSelectize();
        },
        onWatchedFieldChange: function () {
            var self = this, vars, j;
            // If this editor uses a dynamic select box
            if (this.enumSource) {
                vars = this.getWatchedFieldValues();
                var select_options = [];
                var select_titles = [];
                for (var i = 0; i < this.enumSource.length; i++) {
                    // Constant values
                    if (Array.isArray(this.enumSource[i])) {
                        select_options = select_options.concat(this.enumSource[i]);
                        select_titles = select_titles.concat(this.enumSource[i]);
                    }
                    else if (vars[this.enumSource[i].source]) {
                        var items = vars[this.enumSource[i].source];
                        // Only use a predefined part of the array
                        if (this.enumSource[i].slice) {
                            items = Array.prototype.slice.apply(items, this.enumSource[i].slice);
                        }
                        // Filter the items
                        if (this.enumSource[i].filter) {
                            var new_items = [];
                            for (j = 0; j < items.length; j++) {
                                if (this.enumSource[i].filter({ i: j, item: items[j] }))
                                    new_items.push(items[j]);
                            }
                            items = new_items;
                        }
                        var item_titles = [];
                        var item_values = [];
                        for (j = 0; j < items.length; j++) {
                            var item = items[j];
                            // Rendered value
                            if (this.enumSource[i].value) {
                                item_values[j] = this.enumSource[i].value({
                                    i: j,
                                    item: item
                                });
                            }
                            else {
                                item_values[j] = items[j];
                            }
                            // Rendered title
                            if (this.enumSource[i].title) {
                                item_titles[j] = this.enumSource[i].title({
                                    i: j,
                                    item: item
                                });
                            }
                            else {
                                item_titles[j] = item_values[j];
                            }
                        }
                        // TODO: sort
                        select_options = select_options.concat(item_values);
                        select_titles = select_titles.concat(item_titles);
                    }
                }
                var prev_value = this.value;
                this.theme.setSelectOptions(this.input, select_options, select_titles);
                this.enum_options = select_options;
                this.enum_display = select_titles;
                this.enum_values = select_options;
                // If the previous value is still in the new select options, stick with it
                if (select_options.indexOf(prev_value) !== -1) {
                    this.input.value = prev_value;
                    this.value = prev_value;
                }
                else {
                    this.input.value = select_options[0];
                    this.value = select_options[0] || "";
                    if (this.parent)
                        this.parent.onChildEditorChange(this);
                    else
                        this.jsoneditor.onChange();
                    this.jsoneditor.notifyWatchers(this.path);
                }
                if (this.selectize) {
                    // Update the Selectize options
                    this.updateSelectizeOptions(select_options);
                }
                else {
                    this.setupSelectize();
                }
                this._super();
            }
        },
        updateSelectizeOptions: function (select_options) {
            var selectized = this.selectize[0].selectize, self = this;
            selectized.off();
            selectized.clearOptions();
            for (var n in select_options) {
                selectized.addOption({ value: select_options[n], text: select_options[n] });
            }
            selectized.addItem(this.value);
            selectized.on('change', function () {
                self.onInputChange();
            });
        },
        enable: function () {
            if (!this.always_disabled) {
                this.input.disabled = false;
                if (this.selectize) {
                    this.selectize[0].selectize.unlock();
                }
            }
            this._super();
        },
        disable: function () {
            this.input.disabled = true;
            if (this.selectize) {
                this.selectize[0].selectize.lock();
            }
            this._super();
        },
        destroy: function () {
            if (this.label && this.label.parentNode)
                this.label.parentNode.removeChild(this.label);
            if (this.description && this.description.parentNode)
                this.description.parentNode.removeChild(this.description);
            if (this.input && this.input.parentNode)
                this.input.parentNode.removeChild(this.input);
            if (this.selectize) {
                this.selectize[0].selectize.destroy();
                this.selectize = null;
            }
            this._super();
        }
    });
    ;
    JSONEditor.defaults.editors.multiselect = JSONEditor.AbstractEditor.extend({
        preBuild: function () {
            this._super();
            var i;
            this.select_options = {};
            this.select_values = {};
            var items_schema = this.jsoneditor.expandRefs(this.schema.items || {});
            var e = items_schema["enum"] || [];
            var t = items_schema.options ? items_schema.options.enum_titles || [] : [];
            this.option_keys = [];
            this.option_titles = [];
            for (i = 0; i < e.length; i++) {
                // If the sanitized value is different from the enum value, don't include it
                if (this.sanitize(e[i]) !== e[i])
                    continue;
                this.option_keys.push(e[i] + "");
                this.option_titles.push((t[i] || e[i]) + "");
                this.select_values[e[i] + ""] = e[i];
            }
        },
        build: function () {
            var self = this, i;
            if (!this.options.compact)
                this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
            if (this.schema.description)
                this.description = this.theme.getFormInputDescription(this.schema.description);
            if ((!this.schema.format && this.option_keys.length < 8) || this.schema.format === "checkbox") {
                this.input_type = 'checkboxes';
                this.inputs = {};
                this.controls = {};
                for (i = 0; i < this.option_keys.length; i++) {
                    this.inputs[this.option_keys[i]] = this.theme.getCheckbox();
                    this.select_options[this.option_keys[i]] = this.inputs[this.option_keys[i]];
                    var label = this.theme.getCheckboxLabel(this.option_titles[i]);
                    this.controls[this.option_keys[i]] = this.theme.getFormControl(label, this.inputs[this.option_keys[i]]);
                }
                this.control = this.theme.getMultiCheckboxHolder(this.controls, this.label, this.description);
            }
            else {
                this.input_type = 'select';
                this.input = this.theme.getSelectInput(this.option_keys);
                this.theme.setSelectOptions(this.input, this.option_keys, this.option_titles);
                this.input.multiple = true;
                this.input.size = Math.min(10, this.option_keys.length);
                for (i = 0; i < this.option_keys.length; i++) {
                    this.select_options[this.option_keys[i]] = this.input.children[i];
                }
                if (this.schema.readOnly || this.schema.readonly) {
                    this.always_disabled = true;
                    this.input.disabled = true;
                }
                this.control = this.theme.getFormControl(this.label, this.input, this.description);
            }
            this.container.appendChild(this.control);
            this.control.addEventListener('change', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var new_value = [];
                for (i = 0; i < self.option_keys.length; i++) {
                    if (self.select_options[self.option_keys[i]].selected || self.select_options[self.option_keys[i]].checked)
                        new_value.push(self.select_values[self.option_keys[i]]);
                }
                self.updateValue(new_value);
                self.onChange(true);
            });
        },
        setValue: function (value, initial) {
            var i;
            value = value || [];
            if (typeof value !== "object")
                value = [value];
            else if (!(Array.isArray(value)))
                value = [];
            // Make sure we are dealing with an array of strings so we can check for strict equality
            for (i = 0; i < value.length; i++) {
                if (typeof value[i] !== "string")
                    value[i] += "";
            }
            // Update selected status of options
            for (i in this.select_options) {
                if (!this.select_options.hasOwnProperty(i))
                    continue;
                this.select_options[i][this.input_type === "select" ? "selected" : "checked"] = (value.indexOf(i) !== -1);
            }
            this.updateValue(value);
            this.onChange();
        },
        setupSelect2: function () {
            if (window.jQuery && window.jQuery.fn && window.jQuery.fn.select2) {
                var options = window.jQuery.extend({}, JSONEditor.plugins.select2);
                if (this.schema.options && this.schema.options.select2_options)
                    options = $extend(options, this.schema.options.select2_options);
                this.select2 = window.jQuery(this.input).select2(options);
                var self = this;
                this.select2.on('select2-blur', function () {
                    var val = self.select2.select2('val');
                    self.value = val;
                    self.onChange(true);
                });
            }
            else {
                this.select2 = null;
            }
        },
        onInputChange: function () {
            this.value = this.input.value;
            this.onChange(true);
        },
        postBuild: function () {
            this._super();
            this.setupSelect2();
        },
        register: function () {
            this._super();
            if (!this.input)
                return;
            this.input.setAttribute('name', this.formname);
        },
        unregister: function () {
            this._super();
            if (!this.input)
                return;
            this.input.removeAttribute('name');
        },
        getNumColumns: function () {
            var longest_text = this.getTitle().length;
            for (var i in this.select_values) {
                if (!this.select_values.hasOwnProperty(i))
                    continue;
                longest_text = Math.max(longest_text, (this.select_values[i] + "").length + 4);
            }
            return Math.min(12, Math.max(longest_text / 7, 2));
        },
        updateValue: function (value) {
            var changed = false;
            var new_value = [];
            for (var i = 0; i < value.length; i++) {
                if (!this.select_options[value[i] + ""]) {
                    changed = true;
                    continue;
                }
                var sanitized = this.sanitize(this.select_values[value[i]]);
                new_value.push(sanitized);
                if (sanitized !== value[i])
                    changed = true;
            }
            this.value = new_value;
            if (this.select2)
                this.select2.select2('val', this.value);
            return changed;
        },
        sanitize: function (value) {
            if (this.schema.items.type === "number") {
                return 1 * value;
            }
            else if (this.schema.items.type === "integer") {
                return Math.floor(value * 1);
            }
            else {
                return "" + value;
            }
        },
        enable: function () {
            if (!this.always_disabled) {
                if (this.input) {
                    this.input.disabled = false;
                }
                else if (this.inputs) {
                    for (var i in this.inputs) {
                        if (!this.inputs.hasOwnProperty(i))
                            continue;
                        this.inputs[i].disabled = false;
                    }
                }
                if (this.select2)
                    this.select2.select2("enable", true);
            }
            this._super();
        },
        disable: function () {
            if (this.input) {
                this.input.disabled = true;
            }
            else if (this.inputs) {
                for (var i in this.inputs) {
                    if (!this.inputs.hasOwnProperty(i))
                        continue;
                    this.inputs[i].disabled = true;
                }
            }
            if (this.select2)
                this.select2.select2("enable", false);
            this._super();
        },
        destroy: function () {
            if (this.select2) {
                this.select2.select2('destroy');
                this.select2 = null;
            }
            this._super();
        }
    });
    ;
    JSONEditor.defaults.editors.base64 = JSONEditor.AbstractEditor.extend({
        getNumColumns: function () {
            return 4;
        },
        build: function () {
            var self = this;
            this.title = this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
            // Input that holds the base64 string
            this.input = this.theme.getFormInputField('hidden');
            this.container.appendChild(this.input);
            // Don't show uploader if this is readonly
            if (!this.schema.readOnly && !this.schema.readonly) {
                if (!window.FileReader)
                    throw "FileReader required for base64 editor";
                // File uploader
                this.uploader = this.theme.getFormInputField('file');
                this.uploader.addEventListener('change', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.files && this.files.length) {
                        var fr = new FileReader();
                        fr.onload = function (evt) {
                            self.value = evt.target.result;
                            self.refreshPreview();
                            self.onChange(true);
                            fr = null;
                        };
                        fr.readAsDataURL(this.files[0]);
                    }
                });
            }
            this.preview = this.theme.getFormInputDescription(this.schema.description);
            this.container.appendChild(this.preview);
            this.control = this.theme.getFormControl(this.label, this.uploader || this.input, this.preview);
            this.container.appendChild(this.control);
        },
        refreshPreview: function () {
            if (this.last_preview === this.value)
                return;
            this.last_preview = this.value;
            this.preview.innerHTML = '';
            if (!this.value)
                return;
            var mime = this.value.match(/^data:([^;,]+)[;,]/);
            if (mime)
                mime = mime[1];
            if (!mime) {
                this.preview.innerHTML = '<em>Invalid data URI</em>';
            }
            else {
                this.preview.innerHTML = '<strong>Type:</strong> ' + mime + ', <strong>Size:</strong> ' + Math.floor((this.value.length - this.value.split(',')[0].length - 1) / 1.33333) + ' bytes';
                if (mime.substr(0, 5) === "image") {
                    this.preview.innerHTML += '<br>';
                    var img = document.createElement('img');
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100px';
                    img.src = this.value;
                    this.preview.appendChild(img);
                }
            }
        },
        enable: function () {
            if (this.uploader)
                this.uploader.disabled = false;
            this._super();
        },
        disable: function () {
            if (this.uploader)
                this.uploader.disabled = true;
            this._super();
        },
        setValue: function (val) {
            if (this.value !== val) {
                this.value = val;
                this.input.value = this.value;
                this.refreshPreview();
                this.onChange();
            }
        },
        destroy: function () {
            if (this.preview && this.preview.parentNode)
                this.preview.parentNode.removeChild(this.preview);
            if (this.title && this.title.parentNode)
                this.title.parentNode.removeChild(this.title);
            if (this.input && this.input.parentNode)
                this.input.parentNode.removeChild(this.input);
            if (this.uploader && this.uploader.parentNode)
                this.uploader.parentNode.removeChild(this.uploader);
            this._super();
        }
    });
    ;
    JSONEditor.defaults.editors.upload = JSONEditor.AbstractEditor.extend({
        getNumColumns: function () {
            return 4;
        },
        build: function () {
            var self = this;
            this.title = this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
            // Input that holds the base64 string
            this.input = this.theme.getFormInputField('hidden');
            this.container.appendChild(this.input);
            // Don't show uploader if this is readonly
            if (!this.schema.readOnly && !this.schema.readonly) {
                if (!this.jsoneditor.options.upload)
                    throw "Upload handler required for upload editor";
                // File uploader
                this.uploader = this.theme.getFormInputField('file');
                this.uploader.addEventListener('change', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.files && this.files.length) {
                        var fr = new FileReader();
                        fr.onload = function (evt) {
                            self.preview_value = evt.target.result;
                            self.refreshPreview();
                            self.onChange(true);
                            fr = null;
                        };
                        fr.readAsDataURL(this.files[0]);
                    }
                });
            }
            var description = this.schema.description;
            if (!description)
                description = '';
            this.preview = this.theme.getFormInputDescription(description);
            this.container.appendChild(this.preview);
            this.control = this.theme.getFormControl(this.label, this.uploader || this.input, this.preview);
            this.container.appendChild(this.control);
        },
        refreshPreview: function () {
            if (this.last_preview === this.preview_value)
                return;
            this.last_preview = this.preview_value;
            this.preview.innerHTML = '';
            if (!this.preview_value)
                return;
            var self = this;
            var mime = this.preview_value.match(/^data:([^;,]+)[;,]/);
            if (mime)
                mime = mime[1];
            if (!mime)
                mime = 'unknown';
            var file = this.uploader.files[0];
            this.preview.innerHTML = '<strong>Type:</strong> ' + mime + ', <strong>Size:</strong> ' + file.size + ' bytes';
            if (mime.substr(0, 5) === "image") {
                this.preview.innerHTML += '<br>';
                var img = document.createElement('img');
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100px';
                img.src = this.preview_value;
                this.preview.appendChild(img);
            }
            this.preview.innerHTML += '<br>';
            var uploadButton = this.getButton('Upload', 'upload', 'Upload');
            this.preview.appendChild(uploadButton);
            uploadButton.addEventListener('click', function (event) {
                event.preventDefault();
                uploadButton.setAttribute("disabled", "disabled");
                self.theme.removeInputError(self.uploader);
                if (self.theme.getProgressBar) {
                    self.progressBar = self.theme.getProgressBar();
                    self.preview.appendChild(self.progressBar);
                }
                self.jsoneditor.options.upload(self.path, file, {
                    success: function (url) {
                        self.setValue(url);
                        if (self.parent)
                            self.parent.onChildEditorChange(self);
                        else
                            self.jsoneditor.onChange();
                        if (self.progressBar)
                            self.preview.removeChild(self.progressBar);
                        uploadButton.removeAttribute("disabled");
                    },
                    failure: function (error) {
                        self.theme.addInputError(self.uploader, error);
                        if (self.progressBar)
                            self.preview.removeChild(self.progressBar);
                        uploadButton.removeAttribute("disabled");
                    },
                    updateProgress: function (progress) {
                        if (self.progressBar) {
                            if (progress)
                                self.theme.updateProgressBar(self.progressBar, progress);
                            else
                                self.theme.updateProgressBarUnknown(self.progressBar);
                        }
                    }
                });
            });
        },
        enable: function () {
            if (this.uploader)
                this.uploader.disabled = false;
            this._super();
        },
        disable: function () {
            if (this.uploader)
                this.uploader.disabled = true;
            this._super();
        },
        setValue: function (val) {
            if (this.value !== val) {
                this.value = val;
                this.input.value = this.value;
                this.onChange();
            }
        },
        destroy: function () {
            if (this.preview && this.preview.parentNode)
                this.preview.parentNode.removeChild(this.preview);
            if (this.title && this.title.parentNode)
                this.title.parentNode.removeChild(this.title);
            if (this.input && this.input.parentNode)
                this.input.parentNode.removeChild(this.input);
            if (this.uploader && this.uploader.parentNode)
                this.uploader.parentNode.removeChild(this.uploader);
            this._super();
        }
    });
    ;
    JSONEditor.defaults.editors.checkbox = JSONEditor.AbstractEditor.extend({
        setValue: function (value, initial) {
            this.value = !!value;
            this.input.checked = this.value;
            this.onChange();
        },
        register: function () {
            this._super();
            if (!this.input)
                return;
            this.input.setAttribute('name', this.formname);
        },
        unregister: function () {
            this._super();
            if (!this.input)
                return;
            this.input.removeAttribute('name');
        },
        getNumColumns: function () {
            return Math.min(12, Math.max(this.getTitle().length / 7, 2));
        },
        build: function () {
            var self = this;
            if (!this.options.compact) {
                this.label = this.header = this.theme.getCheckboxLabel(this.getTitle());
            }
            if (this.schema.description)
                this.description = this.theme.getFormInputDescription(this.schema.description);
            if (this.options.compact)
                this.container.className += ' compact';
            this.input = this.theme.getCheckbox();
            this.control = this.theme.getFormControl(this.label, this.input, this.description);
            if (this.schema.readOnly || this.schema.readonly) {
                this.always_disabled = true;
                this.input.disabled = true;
            }
            this.input.addEventListener('change', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.value = this.checked;
                self.onChange(true);
            });
            this.container.appendChild(this.control);
        },
        enable: function () {
            if (!this.always_disabled) {
                this.input.disabled = false;
            }
            this._super();
        },
        disable: function () {
            this.input.disabled = true;
            this._super();
        },
        destroy: function () {
            if (this.label && this.label.parentNode)
                this.label.parentNode.removeChild(this.label);
            if (this.description && this.description.parentNode)
                this.description.parentNode.removeChild(this.description);
            if (this.input && this.input.parentNode)
                this.input.parentNode.removeChild(this.input);
            this._super();
        }
    });
    ;
    JSONEditor.defaults.editors.arraySelectize = JSONEditor.AbstractEditor.extend({
        build: function () {
            this.title = this.theme.getFormInputLabel(this.getTitle());
            this.title_controls = this.theme.getHeaderButtonHolder();
            this.title.appendChild(this.title_controls);
            this.error_holder = document.createElement('div');
            if (this.schema.description) {
                this.description = this.theme.getDescription(this.schema.description);
            }
            this.input = document.createElement('select');
            this.input.setAttribute('multiple', 'multiple');
            var group = this.theme.getFormControl(this.title, this.input, this.description);
            this.container.appendChild(group);
            this.container.appendChild(this.error_holder);
            window.jQuery(this.input).selectize({
                delimiter: false,
                createOnBlur: true,
                create: true
            });
        },
        postBuild: function () {
            var self = this;
            this.input.selectize.on('change', function (event) {
                self.refreshValue();
                self.onChange(true);
            });
        },
        destroy: function () {
            this.empty(true);
            if (this.title && this.title.parentNode)
                this.title.parentNode.removeChild(this.title);
            if (this.description && this.description.parentNode)
                this.description.parentNode.removeChild(this.description);
            if (this.input && this.input.parentNode)
                this.input.parentNode.removeChild(this.input);
            this._super();
        },
        empty: function (hard) { },
        setValue: function (value, initial) {
            var self = this;
            // Update the array's value, adding/removing rows when necessary
            value = value || [];
            if (!(Array.isArray(value)))
                value = [value];
            this.input.selectize.clearOptions();
            this.input.selectize.clear(true);
            value.forEach(function (item) {
                self.input.selectize.addOption({ text: item, value: item });
            });
            this.input.selectize.setValue(value);
            this.refreshValue(initial);
        },
        refreshValue: function (force) {
            this.value = this.input.selectize.getValue();
        },
        showValidationErrors: function (errors) {
            var self = this;
            // Get all the errors that pertain to this editor
            var my_errors = [];
            var other_errors = [];
            $each(errors, function (i, error) {
                if (error.path === self.path) {
                    my_errors.push(error);
                }
                else {
                    other_errors.push(error);
                }
            });
            // Show errors for this editor
            if (this.error_holder) {
                if (my_errors.length) {
                    var message = [];
                    this.error_holder.innerHTML = '';
                    this.error_holder.style.display = '';
                    $each(my_errors, function (i, error) {
                        self.error_holder.appendChild(self.theme.getErrorMessage(error.message));
                    });
                }
                else {
                    this.error_holder.style.display = 'none';
                }
            }
        }
    });
    ;
    var matchKey = (function () {
        var elem = document.documentElement;
        if (elem.matches)
            return 'matches';
        else if (elem.webkitMatchesSelector)
            return 'webkitMatchesSelector';
        else if (elem.mozMatchesSelector)
            return 'mozMatchesSelector';
        else if (elem.msMatchesSelector)
            return 'msMatchesSelector';
        else if (elem.oMatchesSelector)
            return 'oMatchesSelector';
    })();
    JSONEditor.AbstractTheme = Class.extend({
        getContainer: function () {
            return document.createElement('div');
        },
        getFloatRightLinkHolder: function () {
            var el = document.createElement('div');
            el.style = el.style || {};
            el.style.cssFloat = 'right';
            el.style.marginLeft = '10px';
            return el;
        },
        getModal: function () {
            var el = document.createElement('div');
            el.style.backgroundColor = 'white';
            el.style.border = '1px solid black';
            el.style.boxShadow = '3px 3px black';
            el.style.position = 'absolute';
            el.style.zIndex = '10';
            el.style.display = 'none';
            return el;
        },
        getGridContainer: function () {
            var el = document.createElement('div');
            return el;
        },
        getGridRow: function () {
            var el = document.createElement('div');
            el.className = 'row';
            return el;
        },
        getGridColumn: function () {
            var el = document.createElement('div');
            return el;
        },
        setGridColumnSize: function (el, size) {
        },
        getLink: function (text) {
            var el = document.createElement('a');
            el.setAttribute('href', '#');
            el.appendChild(document.createTextNode(text));
            return el;
        },
        disableHeader: function (header) {
            header.style.color = '#ccc';
        },
        disableLabel: function (label) {
            label.style.color = '#ccc';
        },
        enableHeader: function (header) {
            header.style.color = '';
        },
        enableLabel: function (label) {
            label.style.color = '';
        },
        getFormInputLabel: function (text) {
            var el = document.createElement('label');
            el.appendChild(document.createTextNode(text));
            return el;
        },
        getCheckboxLabel: function (text) {
            var el = this.getFormInputLabel(text);
            el.style.fontWeight = 'normal';
            return el;
        },
        getHeader: function (text) {
            var el = document.createElement('h3');
            if (typeof text === "string") {
                el.textContent = text;
            }
            else {
                el.appendChild(text);
            }
            return el;
        },
        getCheckbox: function () {
            var el = this.getFormInputField('checkbox');
            el.style.display = 'inline-block';
            el.style.width = 'auto';
            return el;
        },
        getMultiCheckboxHolder: function (controls, label, description) {
            var el = document.createElement('div');
            if (label) {
                label.style.display = 'block';
                el.appendChild(label);
            }
            for (var i in controls) {
                if (!controls.hasOwnProperty(i))
                    continue;
                controls[i].style.display = 'inline-block';
                controls[i].style.marginRight = '20px';
                el.appendChild(controls[i]);
            }
            if (description)
                el.appendChild(description);
            return el;
        },
        getSelectInput: function (options) {
            var select = document.createElement('select');
            if (options)
                this.setSelectOptions(select, options);
            return select;
        },
        getSwitcher: function (options) {
            var switcher = this.getSelectInput(options);
            switcher.style.backgroundColor = 'transparent';
            switcher.style.display = 'inline-block';
            switcher.style.fontStyle = 'italic';
            switcher.style.fontWeight = 'normal';
            switcher.style.height = 'auto';
            switcher.style.marginBottom = 0;
            switcher.style.marginLeft = '5px';
            switcher.style.padding = '0 0 0 3px';
            switcher.style.width = 'auto';
            return switcher;
        },
        getSwitcherOptions: function (switcher) {
            return switcher.getElementsByTagName('option');
        },
        setSwitcherOptions: function (switcher, options, titles) {
            this.setSelectOptions(switcher, options, titles);
        },
        setSelectOptions: function (select, options, titles) {
            titles = titles || [];
            select.innerHTML = '';
            for (var i = 0; i < options.length; i++) {
                var option = document.createElement('option');
                option.setAttribute('value', options[i]);
                option.textContent = titles[i] || options[i];
                select.appendChild(option);
            }
        },
        getTextareaInput: function () {
            var el = document.createElement('textarea');
            el.style = el.style || {};
            el.style.width = '100%';
            el.style.height = '300px';
            el.style.boxSizing = 'border-box';
            return el;
        },
        getRangeInput: function (min, max, step) {
            var el = this.getFormInputField('range');
            el.setAttribute('min', min);
            el.setAttribute('max', max);
            el.setAttribute('step', step);
            return el;
        },
        getFormInputField: function (type) {
            var el = document.createElement('input');
            el.setAttribute('type', type);
            return el;
        },
        afterInputReady: function (input) {
        },
        getFormControl: function (label, input, description) {
            var el = document.createElement('div');
            el.className = 'form-control';
            if (label)
                el.appendChild(label);
            if (input.type === 'checkbox') {
                label.insertBefore(input, label.firstChild);
            }
            else {
                el.appendChild(input);
            }
            if (description)
                el.appendChild(description);
            return el;
        },
        getIndentedPanel: function () {
            var el = document.createElement('div');
            el.style = el.style || {};
            el.style.paddingLeft = '10px';
            el.style.marginLeft = '10px';
            el.style.borderLeft = '1px solid #ccc';
            return el;
        },
        getChildEditorHolder: function () {
            return document.createElement('div');
        },
        getDescription: function (text) {
            var el = document.createElement('p');
            el.innerHTML = text;
            return el;
        },
        getCheckboxDescription: function (text) {
            return this.getDescription(text);
        },
        getFormInputDescription: function (text) {
            return this.getDescription(text);
        },
        getHeaderButtonHolder: function () {
            return this.getButtonHolder();
        },
        getButtonHolder: function () {
            return document.createElement('div');
        },
        getButton: function (text, icon, title) {
            var el = document.createElement('button');
            el.type = 'button';
            this.setButtonText(el, text, icon, title);
            return el;
        },
        setButtonText: function (button, text, icon, title) {
            button.innerHTML = '';
            if (icon) {
                button.appendChild(icon);
                button.innerHTML += ' ';
            }
            button.appendChild(document.createTextNode(text));
            if (title)
                button.setAttribute('title', title);
        },
        getTable: function () {
            return document.createElement('table');
        },
        getTableRow: function () {
            return document.createElement('tr');
        },
        getTableHead: function () {
            return document.createElement('thead');
        },
        getTableBody: function () {
            return document.createElement('tbody');
        },
        getTableHeaderCell: function (text) {
            var el = document.createElement('th');
            el.textContent = text;
            return el;
        },
        getTableCell: function () {
            var el = document.createElement('td');
            return el;
        },
        getErrorMessage: function (text) {
            var el = document.createElement('p');
            el.style = el.style || {};
            el.style.color = 'red';
            el.appendChild(document.createTextNode(text));
            return el;
        },
        addInputError: function (input, text) {
        },
        removeInputError: function (input) {
        },
        addTableRowError: function (row) {
        },
        removeTableRowError: function (row) {
        },
        getTabHolder: function () {
            var el = document.createElement('div');
            el.innerHTML = "<div style='float: left; width: 130px;' class='tabs'></div><div class='content' style='margin-left: 130px;'></div><div style='clear:both;'></div>";
            return el;
        },
        applyStyles: function (el, styles) {
            el.style = el.style || {};
            for (var i in styles) {
                if (!styles.hasOwnProperty(i))
                    continue;
                el.style[i] = styles[i];
            }
        },
        closest: function (elem, selector) {
            while (elem && elem !== document) {
                if (elem[matchKey]) {
                    if (elem[matchKey](selector)) {
                        return elem;
                    }
                    else {
                        elem = elem.parentNode;
                    }
                }
                else {
                    return false;
                }
            }
            return false;
        },
        getTab: function (span) {
            var el = document.createElement('div');
            el.appendChild(span);
            el.style = el.style || {};
            this.applyStyles(el, {
                border: '1px solid #ccc',
                borderWidth: '1px 0 1px 1px',
                textAlign: 'center',
                lineHeight: '30px',
                borderRadius: '5px',
                borderBottomRightRadius: 0,
                borderTopRightRadius: 0,
                fontWeight: 'bold',
                cursor: 'pointer'
            });
            return el;
        },
        getTabContentHolder: function (tab_holder) {
            return tab_holder.children[1];
        },
        getTabContent: function () {
            return this.getIndentedPanel();
        },
        markTabActive: function (tab) {
            this.applyStyles(tab, {
                opacity: 1,
                background: 'white'
            });
        },
        markTabInactive: function (tab) {
            this.applyStyles(tab, {
                opacity: 0.5,
                background: ''
            });
        },
        addTab: function (holder, tab) {
            holder.children[0].appendChild(tab);
        },
        getBlockLink: function () {
            var link = document.createElement('a');
            link.style.display = 'block';
            return link;
        },
        getBlockLinkHolder: function () {
            var el = document.createElement('div');
            return el;
        },
        getLinksHolder: function () {
            var el = document.createElement('div');
            return el;
        },
        createMediaLink: function (holder, link, media) {
            holder.appendChild(link);
            media.style.width = '100%';
            holder.appendChild(media);
        },
        createImageLink: function (holder, link, image) {
            holder.appendChild(link);
            link.appendChild(image);
        }
    });
    ;
    JSONEditor.AbstractIconLib = Class.extend({
        mapping: {
            collapse: '',
            expand: '',
            "delete": '',
            edit: '',
            add: '',
            cancel: '',
            save: '',
            moveup: '',
            movedown: ''
        },
        icon_prefix: '',
        getIconClass: function (key) {
            if (this.mapping[key])
                return this.icon_prefix + this.mapping[key];
            else
                return null;
        },
        getIcon: function (key) {
            var iconclass = this.getIconClass(key);
            if (!iconclass)
                return null;
            var i = document.createElement('i');
            i.className = iconclass;
            return i;
        }
    });
    ;
    JSONEditor.defaults.iconlibs.bootstrap3 = JSONEditor.AbstractIconLib.extend({
        mapping: {
            collapse: 'chevron-down',
            expand: 'chevron-right',
            "delete": 'remove',
            edit: 'pencil',
            add: 'plus',
            cancel: 'floppy-remove',
            save: 'floppy-saved',
            moveup: 'arrow-up',
            movedown: 'arrow-down'
        },
        icon_prefix: 'glyphicon glyphicon-'
    });
    ;
    JSONEditor.defaults.templates["default"] = function () {
        return {
            compile: function (template) {
                var matches = template.match(/{{\s*([a-zA-Z0-9\-_ \.]+)\s*}}/g);
                var l = matches && matches.length;
                // Shortcut if the template contains no variables
                if (!l)
                    return function () { return template; };
                // Pre-compute the search/replace functions
                // This drastically speeds up template execution
                var replacements = [];
                var get_replacement = function (i) {
                    var p = matches[i].replace(/[{}]+/g, '').trim().split('.');
                    var n = p.length;
                    var func;
                    if (n > 1) {
                        var cur;
                        func = function (vars) {
                            cur = vars;
                            for (i = 0; i < n; i++) {
                                cur = cur[p[i]];
                                if (!cur)
                                    break;
                            }
                            return cur;
                        };
                    }
                    else {
                        p = p[0];
                        func = function (vars) {
                            return vars[p];
                        };
                    }
                    replacements.push({
                        s: matches[i],
                        r: func
                    });
                };
                for (var i = 0; i < l; i++) {
                    get_replacement(i);
                }
                // The compiled function
                return function (vars) {
                    var ret = template + "";
                    var r;
                    for (i = 0; i < l; i++) {
                        r = replacements[i];
                        ret = ret.replace(r.s, r.r(vars));
                    }
                    return ret;
                };
            }
        };
    };
    ; // Set the default theme
    JSONEditor.defaults.theme = 'html';
    // Set the default template engine
    JSONEditor.defaults.template = 'default';
    // Default options when initializing JSON Editor
    JSONEditor.defaults.options = {};
    // String translate function
    JSONEditor.defaults.translate = function (key, variables) {
        var lang = JSONEditor.defaults.languages[JSONEditor.defaults.language];
        if (!lang)
            throw "Unknown language " + JSONEditor.defaults.language;
        var string = lang[key] || JSONEditor.defaults.languages[JSONEditor.defaults.default_language][key];
        if (typeof string === "undefined")
            throw "Unknown translate string " + key;
        if (variables) {
            for (var i = 0; i < variables.length; i++) {
                string = string.replace(new RegExp('\\{\\{' + i + '}}', 'g'), variables[i]);
            }
        }
        return string;
    };
    // Translation strings and default languages
    JSONEditor.defaults.default_language = 'en';
    JSONEditor.defaults.language = JSONEditor.defaults.default_language;
    JSONEditor.defaults.languages.en = {
        /**
         * When a property is not set
         */
        error_notset: "Property must be set",
        /**
         * When a string must not be empty
         */
        error_notempty: "Value required",
        /**
         * When a value is not one of the enumerated values
         */
        error_enum: "Value must be one of the enumerated values",
        /**
         * When a value doesn't validate any schema of a 'anyOf' combination
         */
        error_anyOf: "Value must validate against at least one of the provided schemas",
        /**
         * When a value doesn't validate
         * @variables This key takes one variable: The number of schemas the value does not validate
         */
        error_oneOf: 'Value must validate against exactly one of the provided schemas. It currently validates against {{0}} of the schemas.',
        /**
         * When a value does not validate a 'not' schema
         */
        error_not: "Value must not validate against the provided schema",
        /**
         * When a value does not match any of the provided types
         */
        error_type_union: "Value must be one of the provided types",
        /**
         * When a value does not match the given type
         * @variables This key takes one variable: The type the value should be of
         */
        error_type: "Value must be of type {{0}}",
        /**
         *  When the value validates one of the disallowed types
         */
        error_disallow_union: "Value must not be one of the provided disallowed types",
        /**
         *  When the value validates a disallowed type
         * @variables This key takes one variable: The type the value should not be of
         */
        error_disallow: "Value must not be of type {{0}}",
        /**
         * When a value is not a multiple of or divisible by a given number
         * @variables This key takes one variable: The number mentioned above
         */
        error_multipleOf: "Value must be a multiple of {{0}}",
        /**
         * When a value is greater than it's supposed to be (exclusive)
         * @variables This key takes one variable: The maximum
         */
        error_maximum_excl: "Value must be less than {{0}}",
        /**
         * When a value is greater than it's supposed to be (inclusive
         * @variables This key takes one variable: The maximum
         */
        error_maximum_incl: "Value must be at most {{0}}",
        /**
         * When a value is lesser than it's supposed to be (exclusive)
         * @variables This key takes one variable: The minimum
         */
        error_minimum_excl: "Value must be greater than {{0}}",
        /**
         * When a value is lesser than it's supposed to be (inclusive)
         * @variables This key takes one variable: The minimum
         */
        error_minimum_incl: "Value must be at least {{0}}",
        /**
         * When a value have too many characters
         * @variables This key takes one variable: The maximum character count
         */
        error_maxLength: "Value must be at most {{0}} characters long",
        /**
         * When a value does not have enough characters
         * @variables This key takes one variable: The minimum character count
         */
        error_minLength: "Value must be at least {{0}} characters long",
        /**
         * When a value does not match a given pattern
         */
        error_pattern: "Value must match the pattern {{0}}",
        /**
         * When an array has additional items whereas it is not supposed to
         */
        error_additionalItems: "No additional items allowed in this array",
        /**
         * When there are to many items in an array
         * @variables This key takes one variable: The maximum item count
         */
        error_maxItems: "Value must have at most {{0}} items",
        /**
         * When there are not enough items in an array
         * @variables This key takes one variable: The minimum item count
         */
        error_minItems: "Value must have at least {{0}} items",
        /**
         * When an array is supposed to have unique items but has duplicates
         */
        error_uniqueItems: "Array must have unique items",
        /**
         * When there are too many properties in an object
         * @variables This key takes one variable: The maximum property count
         */
        error_maxProperties: "Object must have at most {{0}} properties",
        /**
         * When there are not enough properties in an object
         * @variables This key takes one variable: The minimum property count
         */
        error_minProperties: "Object must have at least {{0}} properties",
        /**
         * When a required property is not defined
         * @variables This key takes one variable: The name of the missing property
         */
        error_required: "Object is missing the required property '{{0}}'",
        /**
         * When there is an additional property is set whereas there should be none
         * @variables This key takes one variable: The name of the additional property
         */
        error_additional_properties: "No additional properties allowed, but property {{0}} is set",
        /**
         * When a dependency is not resolved
         * @variables This key takes one variable: The name of the missing property for the dependency
         */
        error_dependency: "Must have property {{0}}",
        /**
         * Text on Delete All buttons
         */
        button_delete_all: "All",
        /**
         * Title on Delete All buttons
         */
        button_delete_all_title: "Delete All",
        /**
          * Text on Delete Last buttons
          * @variable This key takes one variable: The title of object to delete
          */
        button_delete_last: "Last {{0}}",
        /**
          * Title on Delete Last buttons
          * @variable This key takes one variable: The title of object to delete
          */
        button_delete_last_title: "Delete Last {{0}}",
        /**
          * Title on Add Row buttons
          * @variable This key takes one variable: The title of object to add
          */
        button_add_row_title: "Add {{0}}",
        /**
          * Title on Move Down buttons
          */
        button_move_down_title: "Move down",
        /**
          * Title on Move Up buttons
          */
        button_move_up_title: "Move up",
        /**
          * Title on Delete Row buttons
          * @variable This key takes one variable: The title of object to delete
          */
        button_delete_row_title: "Delete {{0}}",
        /**
          * Title on Delete Row buttons, short version (no parameter with the object title)
          */
        button_delete_row_title_short: "Delete",
        /**
          * Title on Collapse buttons
          */
        button_collapse: "Collapse",
        /**
          * Title on Expand buttons
          */
        button_expand: "Expand"
    };
    // Miscellaneous Plugin Settings
    JSONEditor.plugins = {
        ace: {
            theme: ''
        },
        epiceditor: {},
        sceditor: {},
        select2: {},
        selectize: {}
    };
    // Default per-editor options
    $each(JSONEditor.defaults.editors, function (i, editor) {
        JSONEditor.defaults.editors[i].options = editor.options || {};
    });
    // Set the default resolvers
    // Use "multiple" as a fall back for everything
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        if (typeof schema.type !== "string")
            return "multiple";
    });
    // If the type is not set but properties are defined, we can infer the type is actually object
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        // If the schema is a simple type
        if (!schema.type && schema.properties)
            return "object";
    });
    // If the type is set and it's a basic type, use the primitive editor
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        // If the schema is a simple type
        if (typeof schema.type === "string")
            return schema.type;
    });
    // Boolean editors
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        if (schema.type === 'boolean') {
            // If explicitly set to 'checkbox', use that
            if (schema.format === "checkbox" || (schema.options && schema.options.checkbox)) {
                return "checkbox";
            }
            // Otherwise, default to select menu
            return (JSONEditor.plugins.selectize.enable) ? 'selectize' : 'select';
        }
    });
    // Use the multiple editor for schemas where the `type` is set to "any"
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        // If the schema can be of any type
        if (schema.type === "any")
            return "multiple";
    });
    // Editor for base64 encoded files
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        // If the schema can be of any type
        if (schema.type === "string" && schema.media && schema.media.binaryEncoding === "base64") {
            return "base64";
        }
    });
    // Editor for uploading files
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        if (schema.type === "string" && schema.format === "url" && schema.options && schema.options.upload === true) {
            if (window.FileReader)
                return "upload";
        }
    });
    // Use the table editor for arrays with the format set to `table`
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        // Type `array` with format set to `table`
        if (schema.type == "array" && schema.format == "table") {
            return "table";
        }
    });
    // Use the `select` editor for dynamic enumSource enums
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        if (schema.enumSource)
            return (JSONEditor.plugins.selectize.enable) ? 'selectize' : 'select';
    });
    // Use the `enum` or `select` editors for schemas with enumerated properties
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        if (schema["enum"]) {
            if (schema.type === "array" || schema.type === "object") {
                return "enum";
            }
            else if (schema.type === "number" || schema.type === "integer" || schema.type === "string") {
                return (JSONEditor.plugins.selectize.enable) ? 'selectize' : 'select';
            }
        }
    });
    // Specialized editors for arrays of strings
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        if (schema.type === "array" && schema.items && !(Array.isArray(schema.items)) && schema.uniqueItems && ['string', 'number', 'integer'].indexOf(schema.items.type) >= 0) {
            // For enumerated strings, number, or integers
            if (schema.items.enum) {
                return 'multiselect';
            }
            else if (JSONEditor.plugins.selectize.enable && schema.items.type === "string") {
                return 'arraySelectize';
            }
        }
    });
    // Use the multiple editor for schemas with `oneOf` set
    JSONEditor.defaults.resolvers.unshift(function (schema) {
        // If this schema uses `oneOf` or `anyOf`
        if (schema.oneOf || schema.anyOf)
            return "multiple";
    });
    ;
    JSONEditor.defaults.themes.bootstrap3custom = JSONEditor.AbstractTheme.extend({
        getContainer: function () {
            var el = document.createElement('div');
            el.setAttribute('class', 'hr-json-editor');
            return el;
        },
        getHeader: function (text) {
            var el = document.createElement('h3');
            el.setAttribute('class', 'title');
            if (typeof text === "string") {
                el.textContent = text;
            }
            else {
                el.appendChild(text);
            }
            return el;
        },
        getSelectInput: function (options) {
            var el = this._super(options);
            el.className += 'form-control';
            //el.style.width = 'auto';
            return el;
        },
        setGridColumnSize: function (el, size) {
            el.className = 'col-md-' + size;
        },
        afterInputReady: function (input) {
            if (input.controlgroup)
                return;
            input.controlgroup = this.closest(input, '.form-group');
            if (this.closest(input, '.compact')) {
                input.controlgroup.style.marginBottom = 0;
            }
            // TODO: use bootstrap slider
        },
        getTextareaInput: function () {
            var el = document.createElement('textarea');
            el.className = 'form-control';
            return el;
        },
        getRangeInput: function (min, max, step) {
            // TODO: use better slider
            return this._super(min, max, step);
        },
        getFormInputField: function (type) {
            var el = this._super(type);
            if (type !== 'checkbox') {
                el.className += 'form-control';
            }
            return el;
        },
        getFormControl: function (label, input, description) {
            var group = document.createElement('div');
            if (label && input.type === 'checkbox') {
                group.className += ' checkbox';
                label.appendChild(input);
                label.style.fontSize = '14px';
                group.style.marginTop = '0';
                group.appendChild(label);
                input.style.position = 'relative';
                input.style.cssFloat = 'left';
            }
            else {
                group.className += ' form-group';
                if (label) {
                    label.className += ' control-label';
                    group.appendChild(label);
                }
                group.appendChild(input);
            }
            if (description)
                group.appendChild(description);
            return group;
        },
        getIndentedPanel: function () {
            var el = document.createElement('div');
            el.className = 'indentedPanel';
            return el;
        },
        getFormInputDescription: function (text) {
            var el = document.createElement('p');
            el.className = 'help-block';
            el.innerHTML = text;
            return el;
        },
        getHeaderButtonHolder: function () {
            var el = this.getButtonHolder();
            el.style.marginLeft = '10px';
            return el;
        },
        getButtonHolder: function () {
            var el = document.createElement('div');
            el.className = 'btn-group';
            return el;
        },
        getButton: function (text, icon, title) {
            var el = this._super(text, icon, title);
            el.className += 'btn btn-default';
            return el;
        },
        getTable: function () {
            var el = document.createElement('table');
            el.className = 'table table-bordered';
            el.style.width = 'auto';
            el.style.maxWidth = 'none';
            return el;
        },
        addInputError: function (input, text) {
            if (!input.controlgroup)
                return;
            input.controlgroup.className += ' has-error';
            if (!input.errmsg) {
                input.errmsg = document.createElement('p');
                input.errmsg.className = 'help-block errormsg';
                input.controlgroup.appendChild(input.errmsg);
            }
            else {
                input.errmsg.style.display = '';
            }
            input.errmsg.textContent = text;
        },
        removeInputError: function (input) {
            if (!input.errmsg)
                return;
            input.errmsg.style.display = 'none';
            input.controlgroup.className = input.controlgroup.className.replace(/\s?has-error/g, '');
        },
        getTabHolder: function () {
            var el = document.createElement('div');
            el.innerHTML = "<div class='tabs list-group col-md-2'></div><div class='col-md-10'></div>";
            el.className = 'rows';
            return el;
        },
        getTab: function (text) {
            var el = document.createElement('a');
            el.className = 'list-group-item';
            el.setAttribute('href', '#');
            el.appendChild(text);
            return el;
        },
        markTabActive: function (tab) {
            tab.className += ' active';
        },
        markTabInactive: function (tab) {
            tab.className = tab.className.replace(/\s?active/g, '');
        },
        getProgressBar: function () {
            var min = 0, max = 100, start = 0;
            var container = document.createElement('div');
            container.className = 'progress';
            var bar = document.createElement('div');
            bar.className = 'progress-bar';
            bar.setAttribute('role', 'progressbar');
            bar.setAttribute('aria-valuenow', start);
            bar.setAttribute('aria-valuemin', min);
            bar.setAttribute('aria-valuenax', max);
            bar.innerHTML = start + "%";
            container.appendChild(bar);
            return container;
        },
        updateProgressBar: function (progressBar, progress) {
            if (!progressBar)
                return;
            var bar = progressBar.firstChild;
            var percentage = progress + "%";
            bar.setAttribute('aria-valuenow', progress);
            bar.style.width = percentage;
            bar.innerHTML = percentage;
        },
        updateProgressBarUnknown: function (progressBar) {
            if (!progressBar)
                return;
            var bar = progressBar.firstChild;
            progressBar.className = 'progress progress-striped active';
            bar.removeAttribute('aria-valuenow');
            bar.style.width = '100%';
            bar.innerHTML = '';
        },
        getErrorMessage: function (text) {
            var el = document.createElement('p');
            el.className = 'alert alert-danger';
            el.appendChild(document.createTextNode(text));
            return el;
        },
    });
    ;
    exports.JSONEditor = JSONEditor;
});
///<amd-module name="hr.fetcher"/>
define("hr.fetcher", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Type definitions for Fetch API
    // Altered to fit htmlrapier by Andrew Piper
    // Based on:
    // Project: https://github.com/github/fetch
    // Definitions by: Ryan Graham <https://github.com/ryan-codingintrigue>, Kagami Sascha Rosylight <https://github.com/saschanaz>
    // Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
    function fetch(url, init) {
        return window.fetch(url, init);
    }
    exports.fetch = fetch;
    var Fetcher = /** @class */ (function () {
        function Fetcher() {
        }
        return Fetcher;
    }());
    exports.Fetcher = Fetcher;
});
///<amd-module name="hr.error"/>
define("hr.error", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    function isValidationError(test) {
        return test.getValidationError !== undefined
            && test.getValidationErrors !== undefined
            && test.hasValidationError !== undefined
            && test.hasValidationErrors !== undefined;
    }
    exports.isValidationError = isValidationError;
    function isFormErrors(test) {
        return isValidationError(test)
            && test.addKey !== undefined
            && test.addIndex !== undefined;
    }
    exports.isFormErrors = isFormErrors;
});
///<amd-module name="hr.escape"/>
define("hr.escape", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Escape text to prevent html characters from being output. Helps prevent xss, called automatically
     * by formatText, if it is configured to escape. If you manually write user data consider using this
     * function to escape it, but it is not needed using other HtmlRapier functions like repeat, createComponent
     * or formatText. This escape function should be good enough to write html including attributes with ", ', ` or no quotes
     * but probably not good enough for css or javascript. Since separating these is the major goal of this library writing
     * out javascript or html with this method will not be supported and could be unsafe.
     *
     * TL, DR: Only for HTML, not javascript or css, escapes &, <, >, ", ', `, , !, @, $, %, (, ), =, +, {, }, [, and ]
     * @param {string} text - the text to escape.
     * @returns {type} - The escaped version of text.
     */
    function escape(text) {
        text = String(text);
        var status = {
            textStart: 0,
            bracketStart: 0,
            output: ""
        };
        for (var i = 0; i < text.length; ++i) {
            switch (text[i]) {
                case '&':
                    outputEncoded(i, text, status, '&amp;');
                    break;
                case '<':
                    outputEncoded(i, text, status, '&lt;');
                    break;
                case '>':
                    outputEncoded(i, text, status, '&gt;');
                    break;
                case '"':
                    outputEncoded(i, text, status, '&quot;');
                    break;
                case '\'':
                    outputEncoded(i, text, status, '&#39;');
                    break;
                case '`':
                    outputEncoded(i, text, status, '&#96;');
                    break;
                case ' ':
                    outputEncoded(i, text, status, '&#32;');
                    break;
                case '!':
                    outputEncoded(i, text, status, '&#33;');
                    break;
                case '@':
                    outputEncoded(i, text, status, '&#64;');
                    break;
                case '$':
                    outputEncoded(i, text, status, '&#36;');
                    break;
                case '%':
                    outputEncoded(i, text, status, '&#37;');
                    break;
                case '(':
                    outputEncoded(i, text, status, '&#40;');
                    break;
                case ')':
                    outputEncoded(i, text, status, '&#41;');
                    break;
                case '=':
                    outputEncoded(i, text, status, '&#61;');
                    break;
                case '+':
                    outputEncoded(i, text, status, '&#43;');
                    break;
                case '{':
                    outputEncoded(i, text, status, '&#123;');
                    break;
                case '}':
                    outputEncoded(i, text, status, '&#125;');
                    break;
                case '[':
                    outputEncoded(i, text, status, '&#91;');
                    break;
                case ']':
                    outputEncoded(i, text, status, '&#93;');
                    break;
                default:
                    break;
            }
        }
        if (status.textStart < text.length) {
            status.output += text.substring(status.textStart, text.length);
        }
        return status.output;
    }
    exports.escape = escape;
    //Helper function for escaping
    function outputEncoded(i, text, status, replacement) {
        status.bracketStart = i;
        status.output += text.substring(status.textStart, status.bracketStart) + replacement;
        status.textStart = i + 1;
    }
});
///<amd-module name="hr.uri"/>
define("hr.uri", ["require", "exports", "hr.escape"], function (require, exports, hr_escape_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // based on parseUri 1.2.2
    // (c) Steven Levithan <stevenlevithan.com>
    // MIT License
    // http://blog.stevenlevithan.com/archives/parseuri
    var parseUriOptions = {
        strictMode: false,
        key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
        q: {
            name: "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    };
    var Uri = /** @class */ (function () {
        /**
         * Constructor. Optionally takes the url to parse, otherwise uses current
         * page url.
         * @param {string} url? The url to parse, if this is not passed it will use the window's url, if null is passed no parsing will take place.
         */
        function Uri(url) {
            if (url === undefined && window !== undefined) {
                url = window.location.href;
            }
            if (url !== null) {
                var o = parseUriOptions;
                var m = o.parser[o.strictMode ? "strict" : "loose"].exec(url);
                var uri = this;
                var i = 14;
                while (i--)
                    uri[o.key[i]] = m[i] || "";
                uri[o.q.name] = {};
                uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
                    if ($1)
                        uri[o.q.name][$1] = $2;
                });
                this.path = this.path.replace('\\', '/'); //Normalize slashes
            }
        }
        /**
         * Get the section of the path specified by the index i.
         * @param {number} i The index of the section of the path to get use negative numbers to start at the end.
         * @returns
         */
        Uri.prototype.getPathPart = function (i) {
            if (this.splitPath === undefined) {
                this.splitPath = this.path.split('/');
            }
            //Negative index, start from back
            var part = null;
            if (i < 0) {
                if (-i < this.splitPath.length) {
                    part = this.splitPath[this.splitPath.length + i];
                }
            }
            else if (i < this.splitPath.length) {
                part = this.splitPath[i];
            }
            if (part !== null) {
                part = hr_escape_1.escape(part);
            }
            return part;
        };
        /**
         * Set the query portion of the url to the given object's keys and values.
         * The keys will not be altered, the values will be uri encoded. If a value
         * in the object is null or undefined it will not be included in the query string.
         * If data is null or undefined, the query will be cleared.
         * @param {type} data The object to make into a query.
         */
        Uri.prototype.setQueryFromObject = function (data) {
            var queryString = "";
            if (data === undefined || data === null) {
                data = {};
            }
            for (var key in data) {
                if (data[key] !== undefined && data[key] !== null) {
                    if (Array.isArray(data[key])) {
                        var arr = data[key];
                        for (var i = 0; i < arr.length; ++i) {
                            queryString += key + '=' + encodeURIComponent(arr[i]) + '&';
                        }
                    }
                    else if (data[key] instanceof Date) {
                        var parsedDate = data[key].toISOString();
                        queryString += queryString += key + '=' + encodeURIComponent(parsedDate) + '&';
                    }
                    else {
                        queryString += key + '=' + encodeURIComponent(data[key]) + '&';
                    }
                }
            }
            if (queryString.length > 0) {
                queryString = queryString.substr(0, queryString.length - 1);
            }
            this.query = queryString;
        };
        /**
         * Create an object from the uri's query string. These values
         * will be sent through the escape function to help prevent xss before
         * you get the values back. All query string names will be set to lower case
         * to make looking them back up possible no matter the url case.
         * @returns An object version of the query string.
         */
        Uri.prototype.getQueryObject = function () {
            var cleanQuery = this.query;
            if (cleanQuery.charAt(0) === '?') {
                cleanQuery = cleanQuery.substr(1);
            }
            var qs = cleanQuery.split('&');
            var val = {};
            for (var i = 0; i < qs.length; ++i) {
                var pair = qs[i].split('=', 2);
                if (pair.length > 0) {
                    var name = pair[0].toLowerCase();
                    var pairValue = "";
                    if (pair.length > 1) {
                        pairValue = hr_escape_1.escape(decodeURIComponent(pair[1].replace(/\+/g, ' ')));
                    }
                    if (val[name] === undefined) {
                        //Undefined, set value directly
                        val[name] = pairValue;
                    }
                    else if (Array.isArray(val[name])) {
                        //Already an array, add the value
                        val[name].push(pairValue);
                    }
                    else {
                        //One value set, add 2nd into array
                        val[name] = [val[name], pairValue];
                    }
                }
            }
            return val;
        };
        /**
         * Build the complete url from the current settings.
         * This will do the following concatentaion:
         * protocol + '://' + authority + directory + file + '?' + query
         * @returns
         */
        Uri.prototype.build = function () {
            var query = this.query;
            if (query && query.charAt(0) !== '?') {
                query = '?' + query;
            }
            return this.protocol + '://' + this.authority + this.directory + this.file + query;
        };
        return Uri;
    }());
    exports.Uri = Uri;
    /**
     * Get an object with the values from the query string. These values
     * will be sent through the escape function to help prevent xss before
     * you get the values back. All query string names will be set to lower case
     * to make looking them back up possible no matter the url case.
     * @returns {type} The window's query as an object.
     */
    function getQueryObject() {
        var url = new Uri(null);
        url.query = window.location.search;
        return url.getQueryObject();
    }
    exports.getQueryObject = getQueryObject;
    /**
     * Parse a uri and return a new uri object.
     * @param {type} str The url to parse
     * @deprecated Use the Uri class directly.
     * @returns
     */
    function parseUri(str) {
        return new Uri(str);
    }
    exports.parseUri = parseUri;
    ;
});
define("node_modules/htmlrapier.halcyon/src/EndpointClient", ["require", "exports", "hr.fetcher", "hr.uri"], function (require, exports, hr_fetcher_1, hr_uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Fetcher = hr_fetcher_1.Fetcher;
    exports.Response = hr_fetcher_1.Response;
    var Embed = /** @class */ (function () {
        function Embed(name, embeds, fetcher) {
            this.name = name;
            this.embeds = embeds;
            this.fetcher = fetcher;
        }
        Embed.prototype.GetAllClients = function () {
            //No generators, create array
            var embeddedClients = [];
            for (var i = 0; i < this.embeds.length; ++i) {
                var embed = new HalEndpointClient(this.embeds[i], this.fetcher);
                embeddedClients.push(embed);
            }
            return embeddedClients;
        };
        return Embed;
    }());
    exports.Embed = Embed;
    var HalError = /** @class */ (function () {
        function HalError(errorData, statusCode) {
            this.errorData = errorData;
            this.statusCode = statusCode;
            this.message = errorData.message;
        }
        /**
         * Get a specific validation error. If it does not exist undefined will be retruned.
         * @param {type} name
         * @returns
         */
        HalError.prototype.getValidationError = function (name) {
            if (this.hasValidationErrors()) {
                return this.errorData.errors[name];
            }
        };
        HalError.prototype.hasValidationError = function (name) {
            if (this.hasValidationErrors()) {
                return this.errorData.errors[name] !== undefined;
            }
            return false;
        };
        HalError.prototype.getValidationErrors = function () {
            return this.errorData.errors;
        };
        HalError.prototype.hasValidationErrors = function () {
            return this.errorData.errors !== undefined;
        };
        HalError.prototype.getStatusCode = function () {
            return this.statusCode;
        };
        HalError.prototype.addKey = function (baseName, key) {
            if (baseName !== "") {
                //Make key 1st letter uppercase to match error from server
                return baseName + "." + key[0].toUpperCase() + key.substr(1);
            }
            return key;
        };
        HalError.prototype.addIndex = function (baseName, key, index) {
            return baseName + key + '[' + index + ']';
            ;
        };
        return HalError;
    }());
    exports.HalError = HalError;
    /**
     * This is a helper function that will make calling it in a then block
     * change the promise type to void and hides the original promise's retur
     * value. Since this is only a single instance, sharing it is slightly more
     * efficient if you are using the hal library already.
     * You can call this function if you want, it does nothing.
     */
    function makeVoid() {
    }
    exports.makeVoid = makeVoid;
    /**
     * This class represents a single visit to a hal api endpoint. It will contain the data
     * that was requested and the links from that data. The hal properties are removed
     * from the data, so if you get it it won't contain that info.
     */
    var HalEndpointClient = /** @class */ (function () {
        /**
         * Constructor.
         * @param {HalData} data - The raw hal data object.
         */
        function HalEndpointClient(data, fetcher) {
            this.embeds = data._embedded;
            delete data._embedded;
            this.links = data._links;
            delete data._links;
            this.data = data; //HalData is the actual data, trick compiler
            this.fetcher = fetcher;
        }
        /**
         * Load a hal link from an endpoint.
         * @param link - The link to load
         * @param fetcher - The fetcher to use to load the link
         * @param options - Additional request options
         * @returns A HalEndpointClient for the link.
         */
        HalEndpointClient.Load = function (link, fetcher, options) {
            options = options || {};
            return HalEndpointClient.LoadRaw(link, fetcher, options)
                .then(function (r) { return HalEndpointClient.processResult(r, fetcher); });
        };
        HalEndpointClient.LoadRaw = function (link, fetcher, options) {
            options = options || {};
            var headers = {
                "Accept": HalEndpointClient.halcyonJsonMimeType,
                "bearer": null //temp to get the bearer token added automatically
            };
            if (options.contentType !== undefined) {
                headers["Content-Type"] = options.contentType;
            }
            return fetcher.fetch(link.href, {
                method: link.method,
                body: options.reqBody,
                headers: headers
            });
        };
        HalEndpointClient.processResult = function (response, fetcher) {
            return response.text().then(function (data) {
                var parsedData = HalEndpointClient.parseResult(response, data);
                if (response.ok) {
                    return new HalEndpointClient(parsedData, fetcher);
                }
                else {
                    //Does the error look like one of our custom server errors?
                    if (parsedData.message !== undefined) {
                        throw new HalError(parsedData, response.status);
                    }
                    throw new Error("Generic server error with status " + response.status + " " + response.statusText + " returned.");
                }
            });
        };
        HalEndpointClient.parseResult = function (response, data, jsonParseReviver) {
            var result;
            var contentHeader = response.headers.get('content-type');
            if (contentHeader) {
                if ((contentHeader.length >= HalEndpointClient.halcyonJsonMimeType.length
                    && contentHeader.substring(0, HalEndpointClient.halcyonJsonMimeType.length) === HalEndpointClient.halcyonJsonMimeType)
                    ||
                        (contentHeader.length >= HalEndpointClient.jsonMimeType.length
                            && contentHeader.substring(0, HalEndpointClient.jsonMimeType.length) === HalEndpointClient.jsonMimeType
                            && !response.ok)) {
                    result = data === "" ? null : JSON.parse(data, jsonParseReviver);
                }
                else {
                    throw new Error("Unsupported response type " + contentHeader + ".");
                }
            }
            else {
                result = {
                    _links: undefined,
                    _embedded: undefined
                };
            }
            return result;
        };
        /**
         * Get the data portion of this client.
         * @returns The data.
         */
        HalEndpointClient.prototype.GetData = function () {
            return this.data;
        };
        /**
         * Get an embed.
         * @param {string} name - The name of the embed.
         * @returns - The embed specified by name or undefined.
         */
        HalEndpointClient.prototype.GetEmbed = function (name) {
            return new Embed(name, this.embeds[name], this.fetcher);
        };
        /**
         * See if this client has an embed.
         * @param {string} name - The name of the embed
         * @returns True if found, false otherwise.
         */
        HalEndpointClient.prototype.HasEmbed = function (name) {
            return this.embeds !== undefined && this.embeds[name] !== undefined;
        };
        /**
         * Get all the embeds in this client. If they are all the same type specify
         * T, otherwise use any to get generic objects.
         * @returns
         */
        HalEndpointClient.prototype.GetAllEmbeds = function () {
            //No generators, create array
            var embeds = [];
            for (var key in this.embeds) {
                var embed = new Embed(key, this.embeds[key], this.fetcher);
                embeds.push(embed);
            }
            return embeds;
        };
        //Hal Type Links
        /**
         * Load a new link, this will return a new HalEndpointClient for the results
         * of that request. You can keep using the client that you called this function
         * on to keep making requests if needed. The ref must exist before you can call
         * this function. Use HasLink to see if it is possible.
         * @param {string} ref - The link reference to visit.
         * @returns
         */
        HalEndpointClient.prototype.LoadLink = function (ref) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.Load(this.GetLink(ref), this.fetcher);
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        /**
         * Load a link that uses a template query. The template args are provided by the query argument.
         * @param {string} ref The ref for the link
         * @param {type} query The object with the template values inside.
         * @returns
         */
        HalEndpointClient.prototype.LoadLinkWithQuery = function (ref, query) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.Load(this.GetQueryLink(this.GetLink(ref), query), this.fetcher);
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        /**
         * Load a new link, this will return a new HalEndpointClient for the results
         * of that request. You can keep using the client that you called this function
         * on to keep making requests if needed. The ref must exist before you can call
         * this function. Use HasLink to see if it is possible.
         * @param {string} ref - The link reference to visit.
         * @param {type} data - The data to send as the body of the request
         * @returns
         */
        HalEndpointClient.prototype.LoadLinkWithBody = function (ref, data) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.Load(this.GetLink(ref), this.fetcher, {
                    reqBody: JSON.stringify(data),
                    contentType: HalEndpointClient.jsonMimeType
                });
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        /**
         * Load a link that uses a templated query and has body data. The template args are provided by the query argument.
         * @param {string} ref The ref for the link
         * @param {type} query The object with the template values inside.
         * @param {type} data - The data to send as the body of the request
         * @returns
         */
        HalEndpointClient.prototype.LoadLinkWithQueryAndBody = function (ref, query, data) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.Load(this.GetQueryLink(this.GetLink(ref), query), this.fetcher, {
                    reqBody: JSON.stringify(data),
                    contentType: HalEndpointClient.jsonMimeType
                });
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        /**
         * Load a new link with files to upload.
         * @param ref - The link reference to visit.
         * @param file - The file to upload, either a single file or an array of multiple files.
         * @returns
         */
        HalEndpointClient.prototype.LoadLinkWithForm = function (ref, data) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.Load(this.GetLink(ref), this.fetcher, {
                    reqBody: this.jsonToFormData(data)
                });
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        /**
         * Load a new link with files to upload and a query string.
         * @param ref - The link reference to visit.
         * @param file - The file to upload, either a single file or an array of multiple files.
         * @param query - The query object.
         * @returns
         */
        HalEndpointClient.prototype.LoadLinkWithQueryAndForm = function (ref, query, data) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.Load(this.GetQueryLink(this.GetLink(ref), query), this.fetcher, {
                    reqBody: this.jsonToFormData(data)
                });
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        //Raw Links
        /**
         * Load a new link, this will return a new HalEndpointClient for the results
         * of that request. You can keep using the client that you called this function
         * on to keep making requests if needed. The ref must exist before you can call
         * this function. Use HasLink to see if it is possible.
         * @param {string} ref - The link reference to visit.
         * @returns
         */
        HalEndpointClient.prototype.LoadRawLink = function (ref) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.LoadRaw(this.GetLink(ref), this.fetcher);
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        /**
         * Load a link that uses a template query. The template args are provided by the query argument.
         * @param {string} ref The ref for the link
         * @param {type} query The object with the template values inside.
         * @returns
         */
        HalEndpointClient.prototype.LoadRawLinkWithQuery = function (ref, query) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.LoadRaw(this.GetQueryLink(this.GetLink(ref), query), this.fetcher);
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        /**
         * Load a new link, this will return a new HalEndpointClient for the results
         * of that request. You can keep using the client that you called this function
         * on to keep making requests if needed. The ref must exist before you can call
         * this function. Use HasLink to see if it is possible.
         * @param {string} ref - The link reference to visit.
         * @param {type} data - The data to send as the body of the request
         * @returns
         */
        HalEndpointClient.prototype.LoadRawLinkWithBody = function (ref, data) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.LoadRaw(this.GetLink(ref), this.fetcher, {
                    reqBody: JSON.stringify(data),
                    contentType: HalEndpointClient.jsonMimeType
                });
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        /**
         * Load a link that uses a templated query and has body data. The template args are provided by the query argument.
         * @param {string} ref The ref for the link
         * @param {type} query The object with the template values inside.
         * @param {type} data - The data to send as the body of the request
         * @returns
         */
        HalEndpointClient.prototype.LoadRawLinkWithQueryAndBody = function (ref, query, data) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.LoadRaw(this.GetQueryLink(this.GetLink(ref), query), this.fetcher, {
                    reqBody: JSON.stringify(data),
                    contentType: HalEndpointClient.jsonMimeType
                });
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        /**
         * Load a new link with files to upload.
         * @param ref - The link reference to visit.
         * @param file - The file to upload, either a single file or an array of multiple files.
         * @returns
         */
        HalEndpointClient.prototype.LoadRawLinkWithForm = function (ref, data) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.LoadRaw(this.GetLink(ref), this.fetcher, {
                    reqBody: this.jsonToFormData(data)
                });
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        /**
         * Load a new link with files to upload and a query string.
         * @param ref - The link reference to visit.
         * @param file - The file to upload, either a single file or an array of multiple files.
         * @param query - The query object.
         * @returns
         */
        HalEndpointClient.prototype.LoadRawLinkWithQueryAndForm = function (ref, query, data) {
            if (this.HasLink(ref)) {
                return HalEndpointClient.LoadRaw(this.GetQueryLink(this.GetLink(ref), query), this.fetcher, {
                    reqBody: this.jsonToFormData(data)
                });
            }
            else {
                throw new Error('Cannot find ref "' + ref + '".');
            }
        };
        //Thanks Raj Pawan Gumdal at
        //https://stackoverflow.com/questions/22783108/convert-js-object-to-form-data
        //Removed the test json bit
        HalEndpointClient.prototype.jsonToFormData = function (inJSON, inFormData, parentKey) {
            // http://stackoverflow.com/a/22783314/260665
            // Raj: Converts any nested JSON to formData.
            var form_data = inFormData || new FormData();
            for (var key in inJSON) {
                // 1. If it is a recursion, then key has to be constructed like "parent.child" where parent JSON contains a child JSON
                // 2. Perform append data only if the value for key is not a JSON, recurse otherwise!
                var constructedKey = key;
                if (parentKey) {
                    constructedKey = parentKey + "." + key;
                }
                var value = inJSON[key];
                if (value && value.constructor === {}.constructor) {
                    // This is a JSON, we now need to recurse!
                    this.jsonToFormData(value, form_data, constructedKey);
                }
                else if (value && value.constructor === Blob && value.fileName) {
                    //With ie you have to use blobs for files, this allows us to detect that a fileName property was added to a blob and makes us use that as the third argument to append
                    form_data.append(constructedKey, value, value.fileName);
                }
                else {
                    form_data.append(constructedKey, value);
                }
            }
            return form_data;
        };
        /**
         * Load the documentation for a link.
         */
        HalEndpointClient.prototype.LoadLinkDoc = function (ref) {
            return this.LoadLink(ref + ".Docs");
        };
        /**
         * Load a new link, this will return a new HalEndpointClient for the results
         * of that request. You can keep using the client that you called this function
         * on to keep making requests if needed. The ref must exist before you can call
         * this function. Use HasLink to see if it is possible.
         * @param {string} ref - The link reference to visit.
         * @returns
         */
        HalEndpointClient.prototype.HasLinkDoc = function (ref) {
            return this.HasLink(ref + ".Docs");
        };
        /**
         * Get a single named link.
         * @param {string} ref - The name of the link to recover.
         * @returns The link or undefined if the link does not exist.
         */
        HalEndpointClient.prototype.GetLink = function (ref) {
            return this.links[ref];
        };
        /**
         * Check to see if a link exists in this collection.
         * @param {string} ref - The name of the link (the ref).
         * @returns - True if the link exists, false otherwise
         */
        HalEndpointClient.prototype.HasLink = function (ref) {
            return this.links !== undefined && this.links[ref] !== undefined;
        };
        /**
         * Get all links in this collection. Will transform them to a HalLinkInfo, these are copies of the original links with ref added.
         * @returns
         */
        HalEndpointClient.prototype.GetAllLinks = function () {
            //If only we had generators, have to load entire collection
            var linkInfos = [];
            for (var key in this.links) {
                var link = this.links[key];
                linkInfos.push({
                    href: link.href,
                    method: link.method,
                    rel: key
                });
            }
            return linkInfos;
        };
        /**
         * Helper function to get the expanded version of a query link.
         * @param {type} link
         * @param {type} query
         * @returns
         */
        HalEndpointClient.prototype.GetQueryLink = function (link, query) {
            if (query !== undefined && query !== null) {
                var uri = new hr_uri_1.Uri(link.href);
                uri.setQueryFromObject(query);
                return {
                    href: uri.build(),
                    method: link.method
                };
            }
            else {
                return link; //No query, just return original link.
            }
        };
        HalEndpointClient.halcyonJsonMimeType = "application/json+halcyon";
        HalEndpointClient.jsonMimeType = "application/json";
        return HalEndpointClient;
    }());
    exports.HalEndpointClient = HalEndpointClient;
});
define("Client/Libs/IdServerClient", ["require", "exports", "node_modules/htmlrapier.halcyon/src/EndpointClient"], function (require, exports, hal) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RoleAssignmentsResult = /** @class */ (function () {
        function RoleAssignmentsResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        Object.defineProperty(RoleAssignmentsResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        RoleAssignmentsResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new RoleAssignmentsResult(r);
            });
        };
        RoleAssignmentsResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        RoleAssignmentsResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        RoleAssignmentsResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        RoleAssignmentsResult.prototype.setUser = function (data) {
            return this.client.LoadLinkWithBody("SetUser", data)
                .then(function (r) {
                return new RoleAssignmentsResult(r);
            });
        };
        RoleAssignmentsResult.prototype.canSetUser = function () {
            return this.client.HasLink("SetUser");
        };
        RoleAssignmentsResult.prototype.getSetUserDocs = function () {
            return this.client.LoadLinkDoc("SetUser")
                .then(function (r) {
                return r.GetData();
            });
        };
        RoleAssignmentsResult.prototype.hasSetUserDocs = function () {
            return this.client.HasLinkDoc("SetUser");
        };
        RoleAssignmentsResult.prototype.deleteUser = function () {
            return this.client.LoadLink("DeleteUser").then(hal.makeVoid);
        };
        RoleAssignmentsResult.prototype.canDeleteUser = function () {
            return this.client.HasLink("DeleteUser");
        };
        return RoleAssignmentsResult;
    }());
    exports.RoleAssignmentsResult = RoleAssignmentsResult;
    var ApiResourceEditModelResult = /** @class */ (function () {
        function ApiResourceEditModelResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        Object.defineProperty(ApiResourceEditModelResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        ApiResourceEditModelResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new ApiResourceEditModelResult(r);
            });
        };
        ApiResourceEditModelResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        ApiResourceEditModelResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        ApiResourceEditModelResult.prototype.getApiResource = function () {
            return this.client.LoadLink("getApiResource")
                .then(function (r) {
                return new ApiResourceEditModelResult(r);
            });
        };
        ApiResourceEditModelResult.prototype.canGetApiResource = function () {
            return this.client.HasLink("getApiResource");
        };
        ApiResourceEditModelResult.prototype.getGetApiResourceDocs = function () {
            return this.client.LoadLinkDoc("getApiResource")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelResult.prototype.hasGetApiResourceDocs = function () {
            return this.client.HasLinkDoc("getApiResource");
        };
        ApiResourceEditModelResult.prototype.update = function (data) {
            return this.client.LoadLinkWithBody("Update", data).then(hal.makeVoid);
        };
        ApiResourceEditModelResult.prototype.canUpdate = function () {
            return this.client.HasLink("Update");
        };
        ApiResourceEditModelResult.prototype.getUpdateDocs = function () {
            return this.client.LoadLinkDoc("Update")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelResult.prototype.hasUpdateDocs = function () {
            return this.client.HasLinkDoc("Update");
        };
        ApiResourceEditModelResult.prototype.delete = function () {
            return this.client.LoadLink("Delete").then(hal.makeVoid);
        };
        ApiResourceEditModelResult.prototype.canDelete = function () {
            return this.client.HasLink("Delete");
        };
        return ApiResourceEditModelResult;
    }());
    exports.ApiResourceEditModelResult = ApiResourceEditModelResult;
    var ApiResourceEditModelCollectionResult = /** @class */ (function () {
        function ApiResourceEditModelCollectionResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        Object.defineProperty(ApiResourceEditModelCollectionResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ApiResourceEditModelCollectionResult.prototype, "items", {
            get: function () {
                if (this.strongItems === undefined) {
                    var embeds = this.client.GetEmbed("values");
                    var clients = embeds.GetAllClients();
                    this.strongItems = [];
                    for (var i = 0; i < clients.length; ++i) {
                        this.strongItems.push(new ApiResourceEditModelResult(clients[i]));
                    }
                }
                return this.strongItems;
            },
            enumerable: true,
            configurable: true
        });
        ApiResourceEditModelCollectionResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new ApiResourceEditModelCollectionResult(r);
            });
        };
        ApiResourceEditModelCollectionResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        ApiResourceEditModelCollectionResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelCollectionResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        ApiResourceEditModelCollectionResult.prototype.list = function (query) {
            return this.client.LoadLinkWithQuery("List", query)
                .then(function (r) {
                return new ApiResourceEditModelCollectionResult(r);
            });
        };
        ApiResourceEditModelCollectionResult.prototype.canList = function () {
            return this.client.HasLink("List");
        };
        ApiResourceEditModelCollectionResult.prototype.getListDocs = function () {
            return this.client.LoadLinkDoc("List")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelCollectionResult.prototype.hasListDocs = function () {
            return this.client.HasLinkDoc("List");
        };
        ApiResourceEditModelCollectionResult.prototype.add = function (data) {
            return this.client.LoadLinkWithBody("Add", data).then(hal.makeVoid);
        };
        ApiResourceEditModelCollectionResult.prototype.canAdd = function () {
            return this.client.HasLink("Add");
        };
        ApiResourceEditModelCollectionResult.prototype.getAddDocs = function () {
            return this.client.LoadLinkDoc("Add")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelCollectionResult.prototype.hasAddDocs = function () {
            return this.client.HasLinkDoc("Add");
        };
        ApiResourceEditModelCollectionResult.prototype.loadApiResourceFromMetadata = function (query) {
            return this.client.LoadLinkWithQuery("loadApiResourceFromMetadata", query)
                .then(function (r) {
                return new ApiResourceMetadataViewResult(r);
            });
        };
        ApiResourceEditModelCollectionResult.prototype.canLoadApiResourceFromMetadata = function () {
            return this.client.HasLink("loadApiResourceFromMetadata");
        };
        ApiResourceEditModelCollectionResult.prototype.getLoadApiResourceFromMetadataDocs = function () {
            return this.client.LoadLinkDoc("loadApiResourceFromMetadata")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelCollectionResult.prototype.hasLoadApiResourceFromMetadataDocs = function () {
            return this.client.HasLinkDoc("loadApiResourceFromMetadata");
        };
        ApiResourceEditModelCollectionResult.prototype.next = function () {
            return this.client.LoadLink("next")
                .then(function (r) {
                return new ApiResourceEditModelCollectionResult(r);
            });
        };
        ApiResourceEditModelCollectionResult.prototype.canNext = function () {
            return this.client.HasLink("next");
        };
        ApiResourceEditModelCollectionResult.prototype.getNextDocs = function () {
            return this.client.LoadLinkDoc("next")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelCollectionResult.prototype.hasNextDocs = function () {
            return this.client.HasLinkDoc("next");
        };
        ApiResourceEditModelCollectionResult.prototype.previous = function () {
            return this.client.LoadLink("previous")
                .then(function (r) {
                return new ApiResourceEditModelCollectionResult(r);
            });
        };
        ApiResourceEditModelCollectionResult.prototype.canPrevious = function () {
            return this.client.HasLink("previous");
        };
        ApiResourceEditModelCollectionResult.prototype.getPreviousDocs = function () {
            return this.client.LoadLinkDoc("previous")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelCollectionResult.prototype.hasPreviousDocs = function () {
            return this.client.HasLinkDoc("previous");
        };
        ApiResourceEditModelCollectionResult.prototype.first = function () {
            return this.client.LoadLink("first")
                .then(function (r) {
                return new ApiResourceEditModelCollectionResult(r);
            });
        };
        ApiResourceEditModelCollectionResult.prototype.canFirst = function () {
            return this.client.HasLink("first");
        };
        ApiResourceEditModelCollectionResult.prototype.getFirstDocs = function () {
            return this.client.LoadLinkDoc("first")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelCollectionResult.prototype.hasFirstDocs = function () {
            return this.client.HasLinkDoc("first");
        };
        ApiResourceEditModelCollectionResult.prototype.last = function () {
            return this.client.LoadLink("last")
                .then(function (r) {
                return new ApiResourceEditModelCollectionResult(r);
            });
        };
        ApiResourceEditModelCollectionResult.prototype.canLast = function () {
            return this.client.HasLink("last");
        };
        ApiResourceEditModelCollectionResult.prototype.getLastDocs = function () {
            return this.client.LoadLinkDoc("last")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceEditModelCollectionResult.prototype.hasLastDocs = function () {
            return this.client.HasLinkDoc("last");
        };
        return ApiResourceEditModelCollectionResult;
    }());
    exports.ApiResourceEditModelCollectionResult = ApiResourceEditModelCollectionResult;
    var ApiResourceMetadataViewResult = /** @class */ (function () {
        function ApiResourceMetadataViewResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        Object.defineProperty(ApiResourceMetadataViewResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        ApiResourceMetadataViewResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new ApiResourceMetadataViewResult(r);
            });
        };
        ApiResourceMetadataViewResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        ApiResourceMetadataViewResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        ApiResourceMetadataViewResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        return ApiResourceMetadataViewResult;
    }());
    exports.ApiResourceMetadataViewResult = ApiResourceMetadataViewResult;
    var ClientEditModelResult = /** @class */ (function () {
        function ClientEditModelResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        Object.defineProperty(ClientEditModelResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        ClientEditModelResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new ClientEditModelResult(r);
            });
        };
        ClientEditModelResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        ClientEditModelResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        ClientEditModelResult.prototype.update = function (data) {
            return this.client.LoadLinkWithBody("Update", data).then(hal.makeVoid);
        };
        ClientEditModelResult.prototype.canUpdate = function () {
            return this.client.HasLink("Update");
        };
        ClientEditModelResult.prototype.getUpdateDocs = function () {
            return this.client.LoadLinkDoc("Update")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelResult.prototype.hasUpdateDocs = function () {
            return this.client.HasLinkDoc("Update");
        };
        ClientEditModelResult.prototype.delete = function () {
            return this.client.LoadLink("Delete").then(hal.makeVoid);
        };
        ClientEditModelResult.prototype.canDelete = function () {
            return this.client.HasLink("Delete");
        };
        ClientEditModelResult.prototype.addClientSecret = function () {
            return this.client.LoadLink("addClientSecret")
                .then(function (r) {
                return new CreateSecretResultResult(r);
            });
        };
        ClientEditModelResult.prototype.canAddClientSecret = function () {
            return this.client.HasLink("addClientSecret");
        };
        ClientEditModelResult.prototype.getAddClientSecretDocs = function () {
            return this.client.LoadLinkDoc("addClientSecret")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelResult.prototype.hasAddClientSecretDocs = function () {
            return this.client.HasLinkDoc("addClientSecret");
        };
        return ClientEditModelResult;
    }());
    exports.ClientEditModelResult = ClientEditModelResult;
    var ClientEditModelCollectionViewResult = /** @class */ (function () {
        function ClientEditModelCollectionViewResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        Object.defineProperty(ClientEditModelCollectionViewResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClientEditModelCollectionViewResult.prototype, "items", {
            get: function () {
                if (this.strongItems === undefined) {
                    var embeds = this.client.GetEmbed("values");
                    var clients = embeds.GetAllClients();
                    this.strongItems = [];
                    for (var i = 0; i < clients.length; ++i) {
                        this.strongItems.push(new ClientEditModelResult(clients[i]));
                    }
                }
                return this.strongItems;
            },
            enumerable: true,
            configurable: true
        });
        ClientEditModelCollectionViewResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new ClientEditModelCollectionViewResult(r);
            });
        };
        ClientEditModelCollectionViewResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        ClientEditModelCollectionViewResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelCollectionViewResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        ClientEditModelCollectionViewResult.prototype.list = function (query) {
            return this.client.LoadLinkWithQuery("List", query)
                .then(function (r) {
                return new ClientEditModelCollectionViewResult(r);
            });
        };
        ClientEditModelCollectionViewResult.prototype.canList = function () {
            return this.client.HasLink("List");
        };
        ClientEditModelCollectionViewResult.prototype.getListDocs = function () {
            return this.client.LoadLinkDoc("List")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelCollectionViewResult.prototype.hasListDocs = function () {
            return this.client.HasLinkDoc("List");
        };
        ClientEditModelCollectionViewResult.prototype.add = function (data) {
            return this.client.LoadLinkWithBody("Add", data).then(hal.makeVoid);
        };
        ClientEditModelCollectionViewResult.prototype.canAdd = function () {
            return this.client.HasLink("Add");
        };
        ClientEditModelCollectionViewResult.prototype.getAddDocs = function () {
            return this.client.LoadLinkDoc("Add")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelCollectionViewResult.prototype.hasAddDocs = function () {
            return this.client.HasLinkDoc("Add");
        };
        ClientEditModelCollectionViewResult.prototype.loadClientFromMetadata = function (query) {
            return this.client.LoadLinkWithQuery("loadClientFromMetadata", query)
                .then(function (r) {
                return new ClientMetadataViewResult(r);
            });
        };
        ClientEditModelCollectionViewResult.prototype.canLoadClientFromMetadata = function () {
            return this.client.HasLink("loadClientFromMetadata");
        };
        ClientEditModelCollectionViewResult.prototype.getLoadClientFromMetadataDocs = function () {
            return this.client.LoadLinkDoc("loadClientFromMetadata")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelCollectionViewResult.prototype.hasLoadClientFromMetadataDocs = function () {
            return this.client.HasLinkDoc("loadClientFromMetadata");
        };
        ClientEditModelCollectionViewResult.prototype.next = function () {
            return this.client.LoadLink("next")
                .then(function (r) {
                return new ClientEditModelCollectionViewResult(r);
            });
        };
        ClientEditModelCollectionViewResult.prototype.canNext = function () {
            return this.client.HasLink("next");
        };
        ClientEditModelCollectionViewResult.prototype.getNextDocs = function () {
            return this.client.LoadLinkDoc("next")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelCollectionViewResult.prototype.hasNextDocs = function () {
            return this.client.HasLinkDoc("next");
        };
        ClientEditModelCollectionViewResult.prototype.previous = function () {
            return this.client.LoadLink("previous")
                .then(function (r) {
                return new ClientEditModelCollectionViewResult(r);
            });
        };
        ClientEditModelCollectionViewResult.prototype.canPrevious = function () {
            return this.client.HasLink("previous");
        };
        ClientEditModelCollectionViewResult.prototype.getPreviousDocs = function () {
            return this.client.LoadLinkDoc("previous")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelCollectionViewResult.prototype.hasPreviousDocs = function () {
            return this.client.HasLinkDoc("previous");
        };
        ClientEditModelCollectionViewResult.prototype.first = function () {
            return this.client.LoadLink("first")
                .then(function (r) {
                return new ClientEditModelCollectionViewResult(r);
            });
        };
        ClientEditModelCollectionViewResult.prototype.canFirst = function () {
            return this.client.HasLink("first");
        };
        ClientEditModelCollectionViewResult.prototype.getFirstDocs = function () {
            return this.client.LoadLinkDoc("first")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelCollectionViewResult.prototype.hasFirstDocs = function () {
            return this.client.HasLinkDoc("first");
        };
        ClientEditModelCollectionViewResult.prototype.last = function () {
            return this.client.LoadLink("last")
                .then(function (r) {
                return new ClientEditModelCollectionViewResult(r);
            });
        };
        ClientEditModelCollectionViewResult.prototype.canLast = function () {
            return this.client.HasLink("last");
        };
        ClientEditModelCollectionViewResult.prototype.getLastDocs = function () {
            return this.client.LoadLinkDoc("last")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientEditModelCollectionViewResult.prototype.hasLastDocs = function () {
            return this.client.HasLinkDoc("last");
        };
        return ClientEditModelCollectionViewResult;
    }());
    exports.ClientEditModelCollectionViewResult = ClientEditModelCollectionViewResult;
    var ClientMetadataViewResult = /** @class */ (function () {
        function ClientMetadataViewResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        Object.defineProperty(ClientMetadataViewResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        ClientMetadataViewResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new ClientMetadataViewResult(r);
            });
        };
        ClientMetadataViewResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        ClientMetadataViewResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        ClientMetadataViewResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        return ClientMetadataViewResult;
    }());
    exports.ClientMetadataViewResult = ClientMetadataViewResult;
    var CreateSecretResultResult = /** @class */ (function () {
        function CreateSecretResultResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        Object.defineProperty(CreateSecretResultResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        CreateSecretResultResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new CreateSecretResultResult(r);
            });
        };
        CreateSecretResultResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        CreateSecretResultResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        CreateSecretResultResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        return CreateSecretResultResult;
    }());
    exports.CreateSecretResultResult = CreateSecretResultResult;
    var EntryPointsInjector = /** @class */ (function () {
        function EntryPointsInjector(url, fetcher) {
            this.url = url;
            this.fetcher = fetcher;
        }
        EntryPointsInjector.prototype.load = function () {
            var _this = this;
            if (!this.instance) {
                return EntryPointsResult.Load(this.url, this.fetcher).then(function (r) {
                    _this.instance = r;
                    return r;
                });
            }
            return Promise.resolve(this.instance);
        };
        return EntryPointsInjector;
    }());
    exports.EntryPointsInjector = EntryPointsInjector;
    var EntryPointsResult = /** @class */ (function () {
        function EntryPointsResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        EntryPointsResult.Load = function (url, fetcher) {
            return hal.HalEndpointClient.Load({
                href: url,
                method: "GET"
            }, fetcher)
                .then(function (c) {
                return new EntryPointsResult(c);
            });
        };
        Object.defineProperty(EntryPointsResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        EntryPointsResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new EntryPointsResult(r);
            });
        };
        EntryPointsResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        EntryPointsResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        EntryPointsResult.prototype.listClients = function (query) {
            return this.client.LoadLinkWithQuery("listClients", query)
                .then(function (r) {
                return new ClientEditModelCollectionViewResult(r);
            });
        };
        EntryPointsResult.prototype.canListClients = function () {
            return this.client.HasLink("listClients");
        };
        EntryPointsResult.prototype.getListClientsDocs = function () {
            return this.client.LoadLinkDoc("listClients")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasListClientsDocs = function () {
            return this.client.HasLinkDoc("listClients");
        };
        EntryPointsResult.prototype.addClient = function (data) {
            return this.client.LoadLinkWithBody("addClient", data).then(hal.makeVoid);
        };
        EntryPointsResult.prototype.canAddClient = function () {
            return this.client.HasLink("addClient");
        };
        EntryPointsResult.prototype.getAddClientDocs = function () {
            return this.client.LoadLinkDoc("addClient")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasAddClientDocs = function () {
            return this.client.HasLinkDoc("addClient");
        };
        EntryPointsResult.prototype.updateClient = function (data) {
            return this.client.LoadLinkWithBody("updateClient", data).then(hal.makeVoid);
        };
        EntryPointsResult.prototype.canUpdateClient = function () {
            return this.client.HasLink("updateClient");
        };
        EntryPointsResult.prototype.getUpdateClientDocs = function () {
            return this.client.LoadLinkDoc("updateClient")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasUpdateClientDocs = function () {
            return this.client.HasLinkDoc("updateClient");
        };
        EntryPointsResult.prototype.deleteClient = function () {
            return this.client.LoadLink("deleteClient").then(hal.makeVoid);
        };
        EntryPointsResult.prototype.canDeleteClient = function () {
            return this.client.HasLink("deleteClient");
        };
        EntryPointsResult.prototype.loadClientFromMetadata = function (query) {
            return this.client.LoadLinkWithQuery("loadClientFromMetadata", query)
                .then(function (r) {
                return new ClientMetadataViewResult(r);
            });
        };
        EntryPointsResult.prototype.canLoadClientFromMetadata = function () {
            return this.client.HasLink("loadClientFromMetadata");
        };
        EntryPointsResult.prototype.getLoadClientFromMetadataDocs = function () {
            return this.client.LoadLinkDoc("loadClientFromMetadata")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasLoadClientFromMetadataDocs = function () {
            return this.client.HasLinkDoc("loadClientFromMetadata");
        };
        EntryPointsResult.prototype.addClientSecret = function () {
            return this.client.LoadLink("addClientSecret")
                .then(function (r) {
                return new CreateSecretResultResult(r);
            });
        };
        EntryPointsResult.prototype.canAddClientSecret = function () {
            return this.client.HasLink("addClientSecret");
        };
        EntryPointsResult.prototype.getAddClientSecretDocs = function () {
            return this.client.LoadLinkDoc("addClientSecret")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasAddClientSecretDocs = function () {
            return this.client.HasLinkDoc("addClientSecret");
        };
        EntryPointsResult.prototype.listApiResource = function (query) {
            return this.client.LoadLinkWithQuery("listApiResource", query)
                .then(function (r) {
                return new ApiResourceEditModelCollectionResult(r);
            });
        };
        EntryPointsResult.prototype.canListApiResource = function () {
            return this.client.HasLink("listApiResource");
        };
        EntryPointsResult.prototype.getListApiResourceDocs = function () {
            return this.client.LoadLinkDoc("listApiResource")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasListApiResourceDocs = function () {
            return this.client.HasLinkDoc("listApiResource");
        };
        EntryPointsResult.prototype.addApiResource = function (data) {
            return this.client.LoadLinkWithBody("addApiResource", data).then(hal.makeVoid);
        };
        EntryPointsResult.prototype.canAddApiResource = function () {
            return this.client.HasLink("addApiResource");
        };
        EntryPointsResult.prototype.getAddApiResourceDocs = function () {
            return this.client.LoadLinkDoc("addApiResource")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasAddApiResourceDocs = function () {
            return this.client.HasLinkDoc("addApiResource");
        };
        EntryPointsResult.prototype.updateApiResource = function (data) {
            return this.client.LoadLinkWithBody("updateApiResource", data).then(hal.makeVoid);
        };
        EntryPointsResult.prototype.canUpdateApiResource = function () {
            return this.client.HasLink("updateApiResource");
        };
        EntryPointsResult.prototype.getUpdateApiResourceDocs = function () {
            return this.client.LoadLinkDoc("updateApiResource")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasUpdateApiResourceDocs = function () {
            return this.client.HasLinkDoc("updateApiResource");
        };
        EntryPointsResult.prototype.deleteApiResource = function () {
            return this.client.LoadLink("deleteApiResource").then(hal.makeVoid);
        };
        EntryPointsResult.prototype.canDeleteApiResource = function () {
            return this.client.HasLink("deleteApiResource");
        };
        EntryPointsResult.prototype.loadApiResourceFromMetadata = function (query) {
            return this.client.LoadLinkWithQuery("loadApiResourceFromMetadata", query)
                .then(function (r) {
                return new ApiResourceMetadataViewResult(r);
            });
        };
        EntryPointsResult.prototype.canLoadApiResourceFromMetadata = function () {
            return this.client.HasLink("loadApiResourceFromMetadata");
        };
        EntryPointsResult.prototype.getLoadApiResourceFromMetadataDocs = function () {
            return this.client.LoadLinkDoc("loadApiResourceFromMetadata")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasLoadApiResourceFromMetadataDocs = function () {
            return this.client.HasLinkDoc("loadApiResourceFromMetadata");
        };
        EntryPointsResult.prototype.beginRegister = function () {
            return this.client.LoadLink("BeginRegister")
                .then(function (r) {
                return new RegisterEditModelResult(r);
            });
        };
        EntryPointsResult.prototype.canBeginRegister = function () {
            return this.client.HasLink("BeginRegister");
        };
        EntryPointsResult.prototype.getBeginRegisterDocs = function () {
            return this.client.LoadLinkDoc("BeginRegister")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasBeginRegisterDocs = function () {
            return this.client.HasLinkDoc("BeginRegister");
        };
        EntryPointsResult.prototype.getUser = function () {
            return this.client.LoadLink("GetUser")
                .then(function (r) {
                return new RoleAssignmentsResult(r);
            });
        };
        EntryPointsResult.prototype.canGetUser = function () {
            return this.client.HasLink("GetUser");
        };
        EntryPointsResult.prototype.getGetUserDocs = function () {
            return this.client.LoadLinkDoc("GetUser")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasGetUserDocs = function () {
            return this.client.HasLinkDoc("GetUser");
        };
        EntryPointsResult.prototype.listUsers = function (query) {
            return this.client.LoadLinkWithQuery("ListUsers", query)
                .then(function (r) {
                return new UserCollectionResult(r);
            });
        };
        EntryPointsResult.prototype.canListUsers = function () {
            return this.client.HasLink("ListUsers");
        };
        EntryPointsResult.prototype.getListUsersDocs = function () {
            return this.client.LoadLinkDoc("ListUsers")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasListUsersDocs = function () {
            return this.client.HasLinkDoc("ListUsers");
        };
        EntryPointsResult.prototype.setUser = function (data) {
            return this.client.LoadLinkWithBody("SetUser", data)
                .then(function (r) {
                return new RoleAssignmentsResult(r);
            });
        };
        EntryPointsResult.prototype.canSetUser = function () {
            return this.client.HasLink("SetUser");
        };
        EntryPointsResult.prototype.getSetUserDocs = function () {
            return this.client.LoadLinkDoc("SetUser")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointsResult.prototype.hasSetUserDocs = function () {
            return this.client.HasLinkDoc("SetUser");
        };
        return EntryPointsResult;
    }());
    exports.EntryPointsResult = EntryPointsResult;
    var RegisterEditModelResult = /** @class */ (function () {
        function RegisterEditModelResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        Object.defineProperty(RegisterEditModelResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        RegisterEditModelResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new RegisterEditModelResult(r);
            });
        };
        RegisterEditModelResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        RegisterEditModelResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        RegisterEditModelResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        RegisterEditModelResult.prototype.save = function (data) {
            return this.client.LoadLinkWithBody("save", data)
                .then(function (r) {
                return new RegisterEditModelResult(r);
            });
        };
        RegisterEditModelResult.prototype.canSave = function () {
            return this.client.HasLink("save");
        };
        RegisterEditModelResult.prototype.getSaveDocs = function () {
            return this.client.LoadLinkDoc("save")
                .then(function (r) {
                return r.GetData();
            });
        };
        RegisterEditModelResult.prototype.hasSaveDocs = function () {
            return this.client.HasLinkDoc("save");
        };
        return RegisterEditModelResult;
    }());
    exports.RegisterEditModelResult = RegisterEditModelResult;
    var UserCollectionResult = /** @class */ (function () {
        function UserCollectionResult(client) {
            this.strongData = undefined;
            this.client = client;
        }
        Object.defineProperty(UserCollectionResult.prototype, "data", {
            get: function () {
                this.strongData = this.strongData || this.client.GetData();
                return this.strongData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(UserCollectionResult.prototype, "items", {
            get: function () {
                if (this.strongItems === undefined) {
                    var embeds = this.client.GetEmbed("values");
                    var clients = embeds.GetAllClients();
                    this.strongItems = [];
                    for (var i = 0; i < clients.length; ++i) {
                        this.strongItems.push(new RoleAssignmentsResult(clients[i]));
                    }
                }
                return this.strongItems;
            },
            enumerable: true,
            configurable: true
        });
        UserCollectionResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new UserCollectionResult(r);
            });
        };
        UserCollectionResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        UserCollectionResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        UserCollectionResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        UserCollectionResult.prototype.next = function () {
            return this.client.LoadLink("next")
                .then(function (r) {
                return new UserCollectionResult(r);
            });
        };
        UserCollectionResult.prototype.canNext = function () {
            return this.client.HasLink("next");
        };
        UserCollectionResult.prototype.getNextDocs = function () {
            return this.client.LoadLinkDoc("next")
                .then(function (r) {
                return r.GetData();
            });
        };
        UserCollectionResult.prototype.hasNextDocs = function () {
            return this.client.HasLinkDoc("next");
        };
        UserCollectionResult.prototype.previous = function () {
            return this.client.LoadLink("previous")
                .then(function (r) {
                return new UserCollectionResult(r);
            });
        };
        UserCollectionResult.prototype.canPrevious = function () {
            return this.client.HasLink("previous");
        };
        UserCollectionResult.prototype.getPreviousDocs = function () {
            return this.client.LoadLinkDoc("previous")
                .then(function (r) {
                return r.GetData();
            });
        };
        UserCollectionResult.prototype.hasPreviousDocs = function () {
            return this.client.HasLinkDoc("previous");
        };
        UserCollectionResult.prototype.first = function () {
            return this.client.LoadLink("first")
                .then(function (r) {
                return new UserCollectionResult(r);
            });
        };
        UserCollectionResult.prototype.canFirst = function () {
            return this.client.HasLink("first");
        };
        UserCollectionResult.prototype.getFirstDocs = function () {
            return this.client.LoadLinkDoc("first")
                .then(function (r) {
                return r.GetData();
            });
        };
        UserCollectionResult.prototype.hasFirstDocs = function () {
            return this.client.HasLinkDoc("first");
        };
        UserCollectionResult.prototype.last = function () {
            return this.client.LoadLink("last")
                .then(function (r) {
                return new UserCollectionResult(r);
            });
        };
        UserCollectionResult.prototype.canLast = function () {
            return this.client.HasLink("last");
        };
        UserCollectionResult.prototype.getLastDocs = function () {
            return this.client.LoadLinkDoc("last")
                .then(function (r) {
                return r.GetData();
            });
        };
        UserCollectionResult.prototype.hasLastDocs = function () {
            return this.client.HasLinkDoc("last");
        };
        return UserCollectionResult;
    }());
    exports.UserCollectionResult = UserCollectionResult;
});
///<amd-module name="hr.typeidentifiers"/>
define("hr.typeidentifiers", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Determine if a variable is an array.
     * @param test - The object to test
     * @returns {boolean} - True if the object is an array
     */
    function isArray(test) {
        return Array.isArray(test);
    }
    exports.isArray = isArray;
    /**
     * Determine if a variable is a string.
     * @param test - The object to test
     * @returns {boolean} - True if a string, false if not
     */
    function isString(test) {
        return typeof (test) === 'string';
    }
    exports.isString = isString;
    /**
     * Determine if a variable is a function.
     * @param test - The object to test
     * @returns {boolean} - True if a function, false if not
     */
    function isFunction(test) {
        return typeof (test) === 'function';
    }
    exports.isFunction = isFunction;
    /**
     * Determine if a variable is an object.
     * @param test - The object to test
     * @returns {boolean} - True if an object, false if not
     */
    function isObject(test) {
        return typeof test === 'object';
    }
    exports.isObject = isObject;
    ;
    function isForEachable(test) {
        return test && isFunction(test['forEach']);
    }
    exports.isForEachable = isForEachable;
});
///<amd-module name="hr.domquery"/>
define("hr.domquery", ["require", "exports", "hr.typeidentifiers"], function (require, exports, typeId) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Derive the plain javascript element from a passed element
     * @param {string|Node} element - the element to detect
     * @returns {Node} - The located html element.
     */
    function first(element, context) {
        if (typeof element === 'string') {
            if (context !== undefined) {
                if (matches(context, element)) {
                    return context;
                }
                else {
                    return context.querySelector(element);
                }
            }
            else {
                return document.querySelector(element);
            }
        }
        if (element instanceof Node) {
            return element;
        }
    }
    exports.first = first;
    ;
    /**
     * Query all passed javascript elements
     * @param {string|HTMLElement} element - the element to detect
     * @param {HTMLElement} element - the context to search
     * @returns {array[HTMLElement]} - The results array to append to.
     * @returns {array[HTMLElement]} - The located html element. Will be the results array if one is passed otherwise a new one.
     */
    function all(element, context, results) {
        if (typeof element === 'string') {
            if (results === undefined) {
                results = [];
            }
            if (context !== undefined) {
                //Be sure to include the main element if it matches the selector.
                if (matches(context, element)) {
                    results.push(context);
                }
                //This will add all child elements that match the selector.
                nodesToArray(context.querySelectorAll(element), results);
            }
            else {
                nodesToArray(document.querySelectorAll(element), results);
            }
        }
        else if (element instanceof HTMLElement) {
            if (results === undefined) {
                results = [element];
            }
            else {
                results.push(element);
            }
        }
        else {
            if (results === undefined) {
                results = element;
            }
            else {
                for (var i = 0; i < element.length; ++i) {
                    results.push(element[i]);
                }
            }
        }
        return results;
    }
    exports.all = all;
    ;
    /**
     * Query all passed javascript elements
     * @param {string|HTMLElement} element - the element to detect
     * @param {HTMLElement} element - the context to search
     * @param cb - Called with each htmlelement that is found
     */
    function iterate(element, context, cb) {
        if (typeId.isString(element)) {
            if (context) {
                if (matches(context, element)) {
                    cb(context);
                }
                else {
                    iterateQuery(context.querySelectorAll(element), cb);
                }
            }
            else {
                iterateQuery(document.querySelectorAll(element), cb);
            }
        }
        else if (element instanceof HTMLElement) {
            cb(element);
        }
        else if (Array.isArray(element)) {
            for (var i = 0; i < element.length; ++i) {
                cb(element[i]);
            }
        }
    }
    exports.iterate = iterate;
    ;
    function alwaysTrue(node) {
        return true;
    }
    /**
     * Iterate a node collection using createNodeIterator. There is no query for this version
     * as it iterates everything and allows you to extract what is needed.
     * @param  element - The root element
     * @param {NodeFilter} whatToShow - see createNodeIterator, defaults to SHOW_ALL
     * @param  cb - The function called for each item iterated
     */
    function iterateNodes(node, whatToShow, cb) {
        var iter = document.createNodeIterator(node, whatToShow, alwaysTrue, false);
        var resultNode;
        while (resultNode = iter.nextNode()) {
            cb(resultNode);
        }
    }
    exports.iterateNodes = iterateNodes;
    /**
     * Determine if an element matches the given selector.
     * @param {type} element
     * @param {type} selector
     * @returns {type}
     */
    function matches(element, selector) {
        return element.matches(selector);
    }
    exports.matches = matches;
    function nodesToArray(nodes, arr) {
        for (var i = 0; i < nodes.length; ++i) {
            arr.push(nodes[i]);
        }
    }
    function iterateQuery(nodes, cb) {
        for (var i = 0; i < nodes.length; ++i) {
            cb(nodes[i]);
        }
    }
});
///<amd-module name="hr.textstream"/>
define("hr.textstream", ["require", "exports", "hr.escape", "hr.typeidentifiers"], function (require, exports, hr_escape_2, typeId) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TextNode = /** @class */ (function () {
        function TextNode(str) {
            this.str = str;
        }
        TextNode.prototype.writeObject = function (data) {
            return this.str;
        };
        TextNode.prototype.writeFunction = function (data) {
            return this.writeObject(data);
        };
        return TextNode;
    }());
    var VariableNode = /** @class */ (function () {
        function VariableNode(variable) {
            this.variable = variable;
        }
        VariableNode.prototype.writeObject = function (data) {
            return data[this.variable];
        };
        VariableNode.prototype.writeFunction = function (data) {
            return data(this.variable);
        };
        return VariableNode;
    }());
    var ThisVariableNode = /** @class */ (function () {
        function ThisVariableNode() {
        }
        ThisVariableNode.prototype.writeObject = function (data) {
            return data;
        };
        ThisVariableNode.prototype.writeFunction = function (data) {
            return data('this');
        };
        return ThisVariableNode;
    }());
    var EscapeVariableNode = /** @class */ (function () {
        function EscapeVariableNode(wrapped) {
            this.wrapped = wrapped;
        }
        EscapeVariableNode.prototype.writeObject = function (data) {
            return hr_escape_2.escape(this.wrapped.writeObject(data));
        };
        EscapeVariableNode.prototype.writeFunction = function (data) {
            return hr_escape_2.escape(this.wrapped.writeFunction(data));
        };
        return EscapeVariableNode;
    }());
    function format(data, streamNodes) {
        if (data === null || data === undefined) {
            data = {};
        }
        var text = "";
        if (typeId.isFunction(data)) {
            for (var i = 0; i < streamNodes.length; ++i) {
                text += streamNodes[i].writeFunction(data);
            }
        }
        else {
            for (var i = 0; i < streamNodes.length; ++i) {
                text += streamNodes[i].writeObject(data);
            }
        }
        return text;
    }
    /**
     * Create a text stream that when called with data will output
     * the original string with new data filled out. If the text contains
     * no variables no stream will be created.
     * @param {type} text
     * @returns {type}
     */
    var TextStream = /** @class */ (function () {
        function TextStream(text, options) {
            this.streamNodes = [];
            this.variablesFound = false;
            if (options === undefined) {
                options = {};
            }
            var open = options.open;
            var close = options.close;
            var escape = options.escape;
            //Escape by default.
            if (escape === undefined) {
                escape = true;
            }
            if (open === undefined) {
                open = '{';
            }
            if (close === undefined) {
                close = '}';
            }
            var textStart = 0;
            var bracketStart = 0;
            var bracketEnd = 0;
            var bracketCount = 0;
            var bracketCheck = 0;
            var leadingText;
            var variable;
            var bracketVariable;
            //This holds text we have not created a TextNode for as we parse, this way we can combine output variables with surrounding text for the stream itself
            var skippedTextBuffer = "";
            for (var i = 0; i < text.length; ++i) {
                if (text[i] == open) {
                    //Count up opening brackets
                    bracketStart = i;
                    bracketCount = 1;
                    while (++i < text.length && text[i] == open) {
                        ++bracketCount;
                    }
                    //Find closing bracket chain, ignore if mismatched or whitespace
                    bracketCheck = bracketCount;
                    while (++i < text.length) {
                        if ((text[i] == close && --bracketCheck == 0) || /\s/.test(text[i])) {
                            break;
                        }
                    }
                    //If the check got back to 0 we found a variable
                    if (bracketCheck == 0) {
                        leadingText = text.substring(textStart, bracketStart);
                        bracketEnd = i;
                        bracketVariable = text.substring(bracketStart, bracketEnd + 1);
                        switch (bracketCount) {
                            case 1:
                                //1 bracket, add to buffer
                                skippedTextBuffer += leadingText + bracketVariable;
                                break;
                            case 2:
                                this.streamNodes.push(new TextNode(skippedTextBuffer + leadingText));
                                skippedTextBuffer = ""; //This is reset every time we actually output something
                                variable = bracketVariable.substring(2, bracketVariable.length - 2);
                                var variableNode;
                                if (variable === "this") {
                                    variableNode = new ThisVariableNode();
                                }
                                else {
                                    variableNode = new VariableNode(variable);
                                }
                                if (escape) {
                                    variableNode = new EscapeVariableNode(variableNode);
                                }
                                this.streamNodes.push(variableNode);
                                break;
                            default:
                                //Multiple brackets, escape by removing one and add to buffer
                                skippedTextBuffer += leadingText + bracketVariable.substring(1, bracketVariable.length - 1);
                                break;
                        }
                        textStart = i + 1;
                        this.variablesFound = true;
                    }
                }
            }
            if (textStart < text.length) {
                this.streamNodes.push(new TextNode(skippedTextBuffer + text.substring(textStart, text.length)));
            }
        }
        TextStream.prototype.format = function (data) {
            return format(data, this.streamNodes);
        };
        TextStream.prototype.foundVariable = function () {
            return this.variablesFound;
        };
        return TextStream;
    }());
    exports.TextStream = TextStream;
});
///<amd-module name="hr.eventdispatcher"/>
define("hr.eventdispatcher", ["require", "exports", "hr.typeidentifiers"], function (require, exports, typeId) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This event dispatcher does not handle event listeners returning values.
     */
    var ActionEventDispatcher = /** @class */ (function () {
        function ActionEventDispatcher() {
            this.listeners = [];
        }
        ActionEventDispatcher.prototype.add = function (listener) {
            if (!typeId.isFunction(listener)) {
                throw new Error("Listener must be a function, instead got " + typeof (listener));
            }
            this.listeners.push(listener);
        };
        ActionEventDispatcher.prototype.remove = function (listener) {
            for (var i = 0; i < this.listeners.length; ++i) {
                if (this.listeners[i] === listener) {
                    this.listeners.splice(i--, 1);
                }
            }
        };
        Object.defineProperty(ActionEventDispatcher.prototype, "modifier", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        ActionEventDispatcher.prototype.fire = function (arg) {
            for (var i = 0; i < this.listeners.length; ++i) {
                this.listeners[i](arg);
            }
        };
        return ActionEventDispatcher;
    }());
    exports.ActionEventDispatcher = ActionEventDispatcher;
    /**
     * This is class is for events that return a value.
     */
    var FuncEventDispatcher = /** @class */ (function () {
        function FuncEventDispatcher() {
            this.listeners = [];
        }
        FuncEventDispatcher.prototype.add = function (listener) {
            if (!typeId.isFunction(listener)) {
                throw new Error("Listener must be a function, instead got " + typeof (listener));
            }
            this.listeners.push(listener);
        };
        FuncEventDispatcher.prototype.remove = function (listener) {
            for (var i = 0; i < this.listeners.length; ++i) {
                if (this.listeners[i] === listener) {
                    this.listeners.splice(i--, 1);
                }
            }
        };
        Object.defineProperty(FuncEventDispatcher.prototype, "modifier", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        FuncEventDispatcher.prototype.fire = function (arg) {
            var result = undefined;
            var nextResult;
            for (var i = 0; i < this.listeners.length; ++i) {
                var listener = this.listeners[i];
                nextResult = listener(arg);
                if (nextResult !== undefined) {
                    if (result === undefined) {
                        result = [];
                    }
                    result.push(nextResult);
                }
            }
            return result;
        };
        return FuncEventDispatcher;
    }());
    exports.FuncEventDispatcher = FuncEventDispatcher;
    /**
     * This event dispatcher will return a promise that will resolve when all events
     * are finished running. Allows async work to stay in the event flow.
     */
    var PromiseEventDispatcher = /** @class */ (function () {
        function PromiseEventDispatcher() {
            this.listeners = [];
        }
        PromiseEventDispatcher.prototype.add = function (listener) {
            if (!typeId.isFunction(listener)) {
                throw new Error("Listener must be a function, instead got " + typeof (listener));
            }
            this.listeners.push(listener);
        };
        PromiseEventDispatcher.prototype.remove = function (listener) {
            for (var i = 0; i < this.listeners.length; ++i) {
                if (this.listeners[i] === listener) {
                    this.listeners.splice(i--, 1);
                }
            }
        };
        Object.defineProperty(PromiseEventDispatcher.prototype, "modifier", {
            get: function () {
                return this;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Fire the event. The listeners can return values, if they do the values will be added
         * to an array that is returned by the promise returned by this function.
         * @returns {Promise} a promise that will resolve when all fired events resolve.
         */
        PromiseEventDispatcher.prototype.fire = function (arg) {
            var result;
            var promises = [];
            for (var i = 0; i < this.listeners.length; ++i) {
                var listener = this.listeners[i];
                promises.push(new Promise(function (resovle, reject) {
                    resovle(listener(arg));
                })
                    .then(function (data) {
                    if (data !== undefined) {
                        if (result === undefined) {
                            result = [];
                        }
                        result.push(data);
                    }
                }));
            }
            return Promise.all(promises)
                .then(function (data) {
                return result;
            });
        };
        return PromiseEventDispatcher;
    }());
    exports.PromiseEventDispatcher = PromiseEventDispatcher;
});
///<amd-module name="hr.toggles"/>
define("hr.toggles", ["require", "exports", "hr.typeidentifiers", "hr.eventdispatcher"], function (require, exports, typeId, evts) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var defaultStates = ['on', 'off']; //Reusuable states, so we don't end up creating tons of these arrays
    var togglePlugins = [];
    /**
     * Interface for typed toggles, provides a way to get the states as a string,
     * you should provide the names of all your functions here.
     */
    var TypedToggle = /** @class */ (function () {
        function TypedToggle() {
            this.events = {};
        }
        /**
         * Get the states this toggle can activate.
         */
        TypedToggle.prototype.getPossibleStates = function () {
            return [];
        };
        /**
         * Set the toggle states used by this strong toggle, should not be called outside of
         * the toggle build function.
         */
        TypedToggle.prototype.setStates = function (states) {
            this.states = states;
            this.states.setToggle(this);
        };
        TypedToggle.prototype.applyState = function (name) {
            if (this._currentState !== name) {
                this._currentState = name;
                if (this.states.applyState(name)) {
                    this.fireStateChange(name);
                }
            }
        };
        TypedToggle.prototype.isUsable = function () {
            return !(typeId.isObject(this.states) && this.states.constructor.prototype == NullStates.prototype);
        };
        Object.defineProperty(TypedToggle.prototype, "currentState", {
            get: function () {
                return this._currentState;
            },
            enumerable: true,
            configurable: true
        });
        TypedToggle.prototype.fireStateChange = function (name) {
            this._currentState = name; //This only should happen as the result of an applystate call or the state being changed externally to the library
            //The event will only fire on the current state, so it is safe to set the current state here.
            if (this.events[name] !== undefined) {
                this.events[name].fire(this);
            }
        };
        TypedToggle.prototype.getStateEvent = function (name) {
            if (this.events[name] === undefined) {
                this.events[name] = new evts.ActionEventDispatcher();
            }
            return this.events[name];
        };
        return TypedToggle;
    }());
    exports.TypedToggle = TypedToggle;
    /**
     * A toggle that is on and off.
     */
    var OnOffToggle = /** @class */ (function (_super) {
        __extends(OnOffToggle, _super);
        function OnOffToggle() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        OnOffToggle.prototype.on = function () {
            this.applyState("on");
        };
        OnOffToggle.prototype.off = function () {
            this.applyState("off");
        };
        Object.defineProperty(OnOffToggle.prototype, "onEvent", {
            get: function () {
                return this.getStateEvent('on').modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OnOffToggle.prototype, "offEvent", {
            get: function () {
                return this.getStateEvent('off').modifier;
            },
            enumerable: true,
            configurable: true
        });
        OnOffToggle.prototype.getPossibleStates = function () {
            return OnOffToggle.states;
        };
        OnOffToggle.prototype.toggle = function () {
            if (this.mode) {
                this.off();
            }
            else {
                this.on();
            }
        };
        Object.defineProperty(OnOffToggle.prototype, "mode", {
            get: function () {
                return this.currentState === "on";
            },
            set: function (value) {
                var currentOn = this.mode;
                if (currentOn && !value) {
                    this.off();
                }
                else if (!currentOn && value) {
                    this.on();
                }
            },
            enumerable: true,
            configurable: true
        });
        OnOffToggle.states = ['on', 'off'];
        return OnOffToggle;
    }(TypedToggle));
    exports.OnOffToggle = OnOffToggle;
    /**
     * The Group defines a collection of toggles that can be manipulated together.
     */
    var Group = /** @class */ (function () {
        function Group() {
            var toggles = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                toggles[_i] = arguments[_i];
            }
            this.toggles = toggles;
        }
        /**
         * Add a toggle to the group.
         * @param toggle - The toggle to add.
         */
        Group.prototype.add = function (toggle) {
            this.toggles.push(toggle);
        };
        /**
         * This function will set all toggles in the group (including the passed one if its in the group)
         * to the hideState and then will set the passed toggle to showState.
         * @param toggle - The toggle to set.
         * @param {string} [showState] - The state to set the passed toggle to.
         * @param {string} [hideState] - The state to set all other toggles to.
         */
        Group.prototype.activate = function (toggle, showState, hideState) {
            if (showState === undefined) {
                showState = 'on';
            }
            if (hideState === undefined) {
                hideState = 'off';
            }
            for (var i = 0; i < this.toggles.length; ++i) {
                this.toggles[i].applyState(hideState);
            }
            toggle.applyState(showState);
        };
        return Group;
    }());
    exports.Group = Group;
    /**
     * Add a toggle plugin that can create additional items on the toggle chain.
     * @param {type} plugin
     */
    function addTogglePlugin(plugin) {
        togglePlugins.push(plugin);
    }
    exports.addTogglePlugin = addTogglePlugin;
    /**
     * Base class for toggle state collections. Implemented as a chain.
     * @param {ToggleStates} next
     */
    var ToggleStates = /** @class */ (function () {
        function ToggleStates(next) {
            this.states = {};
            this.next = next;
        }
        ToggleStates.prototype.addState = function (name, value) {
            this.states[name] = value;
        };
        ToggleStates.prototype.applyState = function (name) {
            var state = this.states[name];
            var fireEvent = this.activateState(state);
            if (this.next) {
                fireEvent = this.next.applyState(name) || fireEvent;
            }
            return fireEvent;
        };
        ToggleStates.prototype.setToggle = function (toggle) {
            this.toggle = toggle;
        };
        ToggleStates.prototype.fireStateChange = function (name) {
            if (this.toggle) {
                this.toggle.fireStateChange(name);
            }
        };
        return ToggleStates;
    }());
    exports.ToggleStates = ToggleStates;
    /**
     * This class holds multiple toggle states as a group. This handles multiple toggles
     * with the same name by bunding them up turning them on and off together.
     * @param {ToggleStates} next
     */
    var MultiToggleStates = /** @class */ (function () {
        function MultiToggleStates(childStates) {
            this.childStates = childStates;
        }
        MultiToggleStates.prototype.addState = function (name, value) {
            for (var i = 0; i < this.childStates.length; ++i) {
                this.childStates[i].addState(name, value);
            }
        };
        MultiToggleStates.prototype.applyState = function (name) {
            var fireEvent = true;
            for (var i = 0; i < this.childStates.length; ++i) {
                fireEvent = this.childStates[i].applyState(name) || fireEvent; //Fire event first so we always fire all the items in the chain
            }
            return fireEvent;
        };
        MultiToggleStates.prototype.setToggle = function (toggle) {
            for (var i = 0; i < this.childStates.length; ++i) {
                this.childStates[i].setToggle(toggle);
            }
        };
        return MultiToggleStates;
    }());
    exports.MultiToggleStates = MultiToggleStates;
    var DisabledToggleStates = /** @class */ (function (_super) {
        __extends(DisabledToggleStates, _super);
        function DisabledToggleStates(element, next) {
            var _this = _super.call(this, next) || this;
            _this.element = element;
            return _this;
        }
        DisabledToggleStates.prototype.activateState = function (style) {
            if (Boolean(style)) {
                this.element.setAttribute('disabled', 'disabled');
            }
            else {
                this.element.removeAttribute('disabled');
            }
            return true;
        };
        return DisabledToggleStates;
    }(ToggleStates));
    exports.DisabledToggleStates = DisabledToggleStates;
    var ReadonlyToggleStates = /** @class */ (function (_super) {
        __extends(ReadonlyToggleStates, _super);
        function ReadonlyToggleStates(element, next) {
            var _this = _super.call(this, next) || this;
            _this.element = element;
            return _this;
        }
        ReadonlyToggleStates.prototype.activateState = function (style) {
            if (Boolean(style)) {
                this.element.setAttribute('readonly', 'readonly');
            }
            else {
                this.element.removeAttribute('readonly');
            }
            return true;
        };
        return ReadonlyToggleStates;
    }(ToggleStates));
    exports.ReadonlyToggleStates = ReadonlyToggleStates;
    /**
     * A simple toggle state that does nothing. Used to shim correctly if no toggles are defined for a toggle element.
     */
    var NullStates = /** @class */ (function (_super) {
        __extends(NullStates, _super);
        function NullStates(next) {
            return _super.call(this, next) || this;
        }
        NullStates.prototype.activateState = function (value) {
            return true;
        };
        return NullStates;
    }(ToggleStates));
    /**
     * A toggler that toggles style for an element
     */
    var StyleStates = /** @class */ (function (_super) {
        __extends(StyleStates, _super);
        function StyleStates(element, next) {
            var _this = _super.call(this, next) || this;
            _this.element = element;
            _this.originalStyles = element.style.cssText || "";
            return _this;
        }
        StyleStates.prototype.activateState = function (style) {
            if (style) {
                this.element.style.cssText = this.originalStyles + style;
            }
            else {
                this.element.style.cssText = this.originalStyles;
            }
            return true;
        };
        return StyleStates;
    }(ToggleStates));
    /**
    * A toggler that toggles classes for an element. Supports animations using an
    * idle attribute (data-hr-class-idle) that if present will have its classes
    * applied to the element when any animations have completed.
    */
    var ClassStates = /** @class */ (function (_super) {
        __extends(ClassStates, _super);
        function ClassStates(element, next) {
            var _this = _super.call(this, next) || this;
            _this.element = element;
            _this.originalClasses = element.getAttribute("class") || "";
            _this.idleClass = element.getAttribute('data-hr-class-idle');
            _this.stopAnimationCb = function () { _this.stopAnimation(); };
            return _this;
        }
        ClassStates.prototype.activateState = function (classes) {
            if (classes) {
                this.element.setAttribute("class", this.originalClasses + ' ' + classes);
            }
            else {
                this.element.setAttribute("class", this.originalClasses);
            }
            this.startAnimation();
            return true;
        };
        ClassStates.prototype.startAnimation = function () {
            if (this.idleClass) {
                this.element.classList.remove(this.idleClass);
                this.element.removeEventListener('transitionend', this.stopAnimationCb);
                this.element.removeEventListener('animationend', this.stopAnimationCb);
                this.element.addEventListener('transitionend', this.stopAnimationCb);
                this.element.addEventListener('animationend', this.stopAnimationCb);
            }
        };
        ClassStates.prototype.stopAnimation = function () {
            this.element.removeEventListener('transitionend', this.stopAnimationCb);
            this.element.removeEventListener('animationend', this.stopAnimationCb);
            this.element.classList.add(this.idleClass);
        };
        return ClassStates;
    }(ToggleStates));
    /**
     * Extract all the states from a given element to build a single toggle in the chain.
     * You pass in the prefix and states you want to extract as well as the constructor
     * to use to create new states.
     * @param {type} element - The element to extract toggles from
     * @param {type} states - The states to look for
     * @param {type} attrPrefix - The prefix for the attribute that defines the state. Will be concated with each state to form the lookup attribute.
     * @param {type} toggleConstructor - The constructor to use if a toggle is created.
     * @param {type} nextToggle - The next toggle to use in the chain
     * @returns {type} The toggle that should be the next element in the chain, will be the new toggle if one was created or nextToggle if nothing was created.
     */
    function extractStates(element, states, attrPrefix, toggleConstructor, nextToggle) {
        var toggleStates = null;
        for (var i = 0; i < states.length; ++i) {
            var name = states[i];
            var attr = attrPrefix + name;
            if (element.hasAttribute(attr)) {
                var value = element.getAttribute(attr);
                if (toggleStates === null) {
                    toggleStates = new toggleConstructor(element, nextToggle);
                }
                toggleStates.addState(name, value);
            }
        }
        if (toggleStates) {
            return toggleStates;
        }
        return nextToggle;
    }
    function getStartState(element) {
        var attr = "data-hr-state";
        if (element.hasAttribute(attr)) {
            var value = element.getAttribute(attr);
            return value;
        }
        return null;
    }
    exports.getStartState = getStartState;
    /**
     * Build a toggle chain from the given element
     * @param {string} element - The element to build toggles for
     * @param {string[]} [stateNames] - The states the toggle needs, will create functions on
     * the toggle for each one. If this is undefined will default to "on" and "off".
     * @returns A new ToggleChain with the defined states as functions
     */
    function build(element, stateNames) {
        if (stateNames === undefined) {
            stateNames = defaultStates;
        }
        var toggle = null;
        if (element !== null) {
            toggle = extractStates(element, stateNames, 'data-hr-style-', StyleStates, toggle);
            toggle = extractStates(element, stateNames, 'data-hr-class-', ClassStates, toggle);
            toggle = extractStates(element, stateNames, 'data-hr-disabled-', DisabledToggleStates, toggle);
            toggle = extractStates(element, stateNames, 'data-hr-readonly-', ReadonlyToggleStates, toggle);
            //Now toggle plugin chain
            for (var i = 0; i < togglePlugins.length; ++i) {
                toggle = togglePlugins[i](element, stateNames, toggle);
            }
        }
        //If we get all the way here with no toggle, use the null toggle.
        if (toggle === null) {
            toggle = new NullStates(toggle);
        }
        return toggle;
    }
    exports.build = build;
});
///<amd-module name="hr.expressiontree"/>
define("hr.expressiontree", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var OperationType;
    (function (OperationType) {
        OperationType[OperationType["And"] = "And"] = "And";
        OperationType[OperationType["Or"] = "Or"] = "Or";
        OperationType[OperationType["Not"] = "Not"] = "Not";
        OperationType[OperationType["Equal"] = "Equal"] = "Equal";
        OperationType[OperationType["NotEqual"] = "NotEqual"] = "NotEqual";
        OperationType[OperationType["GreaterThan"] = "GreaterThan"] = "GreaterThan";
        OperationType[OperationType["LessThan"] = "LessThan"] = "LessThan";
        OperationType[OperationType["GreaterThanOrEqual"] = "GreaterThanOrEqual"] = "GreaterThanOrEqual";
        OperationType[OperationType["LessThanOrEqual"] = "LessThanOrEqual"] = "LessThanOrEqual";
    })(OperationType = exports.OperationType || (exports.OperationType = {}));
    var ObjectValueSource = /** @class */ (function () {
        function ObjectValueSource(source) {
            this.source = source;
        }
        ObjectValueSource.prototype.getValue = function (name) {
            return this.source[name];
        };
        return ObjectValueSource;
    }());
    exports.ObjectValueSource = ObjectValueSource;
    var ExpressionTree = /** @class */ (function () {
        function ExpressionTree(root) {
            this.root = root;
        }
        ExpressionTree.prototype.isTrue = function (test) {
            return this.evaluate(this.root, test);
        };
        ExpressionTree.prototype.evaluate = function (node, test) {
            switch (node.operation) {
                case OperationType.And:
                    return this.evaluate(node.left, test) && this.evaluate(node.right, test);
                case OperationType.Or:
                    return this.evaluate(node.left, test) || this.evaluate(node.right, test);
                case OperationType.Equal:
                    var testKey = Object.keys(node.test)[0];
                    return this.equals(test.getValue(testKey), node.test[testKey]);
                case OperationType.NotEqual:
                    var testKey = Object.keys(node.test)[0];
                    return !this.equals(test.getValue(testKey), node.test[testKey]);
                case OperationType.Not:
                    return !this.evaluate(node.left, test);
                case OperationType.GreaterThan:
                case OperationType.GreaterThanOrEqual:
                case OperationType.LessThan:
                case OperationType.LessThanOrEqual:
                    var testKey = Object.keys(node.test)[0];
                    return this.compare(test.getValue(testKey), node.test[testKey], node.operation);
            }
            return false;
        };
        ExpressionTree.prototype.equals = function (current, test) {
            switch (typeof (test)) {
                case "boolean":
                    return Boolean(current) === test;
                case "number":
                    return Number(current) === test;
                case "object":
                    if (current === undefined || current === null || current === "") {
                        return test === null; //Current is undefined, null or empty string and test is null, consider equivalent
                    }
                case "string":
                    return String(current) === test;
            }
            return false; //No match, or type could not be determined
        };
        ExpressionTree.prototype.compare = function (current, test, operation) {
            switch (typeof (test)) {
                case "number":
                    var currentAsNum = Number(current);
                    console.log(currentAsNum);
                    if (!isNaN(currentAsNum)) {
                        switch (operation) {
                            case OperationType.GreaterThan:
                                return currentAsNum > test;
                            case OperationType.GreaterThanOrEqual:
                                return currentAsNum >= test;
                            case OperationType.LessThan:
                                return currentAsNum < test;
                            case OperationType.LessThanOrEqual:
                                return currentAsNum <= test;
                        }
                    }
            }
            return false;
        };
        return ExpressionTree;
    }());
    exports.ExpressionTree = ExpressionTree;
});
///<amd-module name="hr.schema"/>
define("hr.schema", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Find the ref and return it for node if it exists.
     * @param node The node to expand
     */
    function resolveRef(node, schema) {
        if (node.$ref !== undefined) {
            var walker = schema;
            var refs = node.$ref.split('/');
            for (var i = 1; i < refs.length; ++i) {
                walker = walker[refs[i]];
                if (walker === undefined) {
                    throw new Error("Cannot find ref '" + node.$ref + "' in schema.");
                }
            }
            return walker;
        }
        return node;
    }
    exports.resolveRef = resolveRef;
});
///<amd-module name="hr.formhelper"/>
define("hr.formhelper", ["require", "exports", "hr.domquery", "hr.typeidentifiers"], function (require, exports, domQuery, typeIds) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function IsFormElement(element) {
        return element && (element.nodeName === 'FORM' || element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA');
    }
    exports.IsFormElement = IsFormElement;
    /**
     * This function will return true if the value should be added to an output object, and false if it should not.
     * @param value
     */
    function shouldAddValue(value) {
        return value !== undefined && value !== ""; //Prevents empty strings and undefined from being added to the output object
    }
    exports.shouldAddValue = shouldAddValue;
    function addValue(q, name, value, level) {
        if (!shouldAddValue(value)) {
            return;
        }
        name = extractLevelName(level, name);
        if (q[name] === undefined) {
            q[name] = value;
        }
        else if (!typeIds.isArray(q[name])) {
            var tmp = q[name];
            q[name] = [tmp, value];
        }
        else {
            q[name].push(value);
        }
    }
    function allowWrite(element, level) {
        return level === undefined || element.getAttribute('data-hr-form-level') === level;
    }
    /**
     * Serialze a form to a javascript object
     * @param form - A selector or form element for the form to serialize.
     * @returns - The object that represents the form contents as an object.
     */
    function serialize(form, proto, level) {
        //This is from https://code.google.com/archive/p/form-serialize/downloads
        //Modified to return an object instead of a query string
        var formElements;
        if (IsFormElement(form)) {
            formElements = form.elements;
        }
        else {
            formElements = domQuery.all("[name]", form); //All elements with a name, they will be filtered by what is supported below
        }
        var i, j, q = Object.create(proto || null);
        var elementsLength = formElements.length;
        for (i = 0; i < elementsLength; ++i) {
            var element = formElements[i];
            if (element.name === "" || !allowWrite(element, level)) {
                continue;
            }
            var value = readValue(element);
            if (value !== undefined) {
                addValue(q, element.name, value, level);
            }
        }
        return q;
    }
    exports.serialize = serialize;
    /**
     * Read the value out of an HTMLFormElement. Will return undefined if there is no value.
     * @param element The HTMLFormElement to read.
     */
    function readValue(element) {
        switch (element.nodeName) {
            case 'INPUT':
                switch (element.type) {
                    case 'file':
                        var file = element.files;
                        if (!element.hasAttribute("multiple") && file.length > 0) {
                            file = file[0];
                        }
                        return file;
                    case 'checkbox':
                    case 'radio':
                        if (element.checked) {
                            return element.value;
                        }
                        break;
                    default:
                        return element.value;
                }
                break;
            case 'TEXTAREA':
                return element.value;
            case 'SELECT':
                switch (element.type) {
                    case 'select-one':
                        return element.value;
                    case 'select-multiple':
                        var selected = [];
                        for (var j = element.options.length - 1; j >= 0; j = j - 1) {
                            var option = element.options[j];
                            if (option.selected && option.value !== "") {
                                selected.push(element.options[j].value);
                            }
                        }
                        if (selected.length > 0) {
                            return selected;
                        }
                        break;
                }
                break;
            case 'BUTTON':
                switch (element.type) {
                    case 'reset':
                    case 'submit':
                    case 'button':
                        return element.value;
                }
                break;
        }
        return undefined;
    }
    exports.readValue = readValue;
    var DataType;
    (function (DataType) {
        DataType[DataType["Object"] = 0] = "Object";
        DataType[DataType["Function"] = 1] = "Function";
    })(DataType = exports.DataType || (exports.DataType = {}));
    function containsCoerced(items, search) {
        for (var i = 0; i < items.length; ++i) {
            if (items[i] == search) {
                return true;
            }
        }
        return false;
    }
    function extractLevelName(level, name) {
        if (level !== undefined && level !== null && level.length > 0) {
            name = name.substring(level.length + 1); //Account for delimiter, but we don't care what it is
        }
        return name;
    }
    function getDataType(data) {
        if (typeIds.isObject(data)) {
            return DataType.Object;
        }
        else if (typeIds.isFunction(data)) {
            return DataType.Function;
        }
    }
    exports.getDataType = getDataType;
    /**
     * Populate a form with data.
     * @param form - The form to populate or a query string for the form.
     * @param data - The data to bind to the form, form name attributes will be mapped to the keys in the object.
     */
    function populate(form, data, level) {
        var formElement = domQuery.first(form);
        var nameAttrs = domQuery.all('[name]', formElement);
        var dataType = getDataType(data);
        for (var i = 0; i < nameAttrs.length; ++i) {
            var element = nameAttrs[i];
            if (allowWrite(element, level)) {
                var itemData;
                var dataName = extractLevelName(level, element.getAttribute('name'));
                switch (dataType) {
                    case DataType.Object:
                        itemData = data[dataName];
                        break;
                    case DataType.Function:
                        itemData = data(dataName);
                        break;
                }
                setValue(element, itemData);
            }
        }
    }
    exports.populate = populate;
    function setValue(element, itemData) {
        if (itemData === undefined) {
            itemData = "";
        }
        switch (element.type) {
            case 'checkbox':
                element.checked = itemData;
                break;
            case 'select-multiple':
                var options = element.options;
                if (Array.isArray(itemData)) {
                    for (var j = options.length - 1; j >= 0; j = j - 1) {
                        options[j].selected = containsCoerced(itemData, options[j].value);
                    }
                }
                break;
            case 'select-one':
                var options = element.options;
                var valueToSet = "";
                if (options.length > 0) {
                    valueToSet = options[0].value;
                }
                if (itemData !== null && itemData !== undefined) {
                    var itemDataString = String(itemData);
                    //Scan options to find the value that is attempting to be set, if it does not exist, this will default back to the first value
                    for (var j = options.length - 1; j >= 0; j = j - 1) {
                        if (options[j].value === itemDataString) {
                            valueToSet = itemDataString;
                        }
                    }
                }
                element.value = valueToSet;
                break;
            default:
                element.value = itemData;
                break;
        }
    }
    exports.setValue = setValue;
    var buildFormCb;
    function setBuildFormFunc(buildForm) {
        buildFormCb = buildForm;
    }
    exports.setBuildFormFunc = setBuildFormFunc;
    function buildForm(componentName, schema, parentElement) {
        return buildFormCb(componentName, schema, parentElement);
    }
    exports.buildForm = buildForm;
    var ClearingValidator = /** @class */ (function () {
        function ClearingValidator() {
            this.message = "";
        }
        /**
         * Get the validation error named name.
         */
        ClearingValidator.prototype.getValidationError = function (name) {
            return undefined;
        };
        /**
         * Check to see if a named validation error exists.
         */
        ClearingValidator.prototype.hasValidationError = function (name) {
            return false;
        };
        /**
         * Get all validation errors.
         */
        ClearingValidator.prototype.getValidationErrors = function () {
            return {};
        };
        /**
         * Determine if there are any validation errors.
         */
        ClearingValidator.prototype.hasValidationErrors = function () {
            return true;
        };
        ClearingValidator.prototype.addKey = function (baseName, key) {
            return "";
        };
        ClearingValidator.prototype.addIndex = function (baseName, key, index) {
            return "";
        };
        return ClearingValidator;
    }());
    var sharedClearingValidator = new ClearingValidator();
    /**
     * Get a shared instance of a validator that will clear all data passed in.
     */
    function getSharedClearingValidator() {
        return sharedClearingValidator;
    }
    exports.getSharedClearingValidator = getSharedClearingValidator;
});
///<amd-module name="hr.form"/>
define("hr.form", ["require", "exports", "hr.formhelper", "hr.eventdispatcher"], function (require, exports, formHelper, events) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This form decorator will ensure that a schema is loaded before any data is added to the
     * form. You can call setData and setSchema in any order you want, but the data will not
     * be set until the schema is loaded. Just wrap your real IForm in this decorator to get this
     * feature.
     */
    var NeedsSchemaForm = /** @class */ (function () {
        function NeedsSchemaForm(wrapped) {
            this.wrapped = wrapped;
            this.loadedSchema = false;
        }
        NeedsSchemaForm.prototype.setError = function (err) {
            this.wrapped.setError(err);
        };
        NeedsSchemaForm.prototype.clearError = function () {
            this.wrapped.clearError();
        };
        /**
          * Set the data on the form.
          * @param data The data to set.
          */
        NeedsSchemaForm.prototype.setData = function (data) {
            if (this.loadedSchema) {
                this.wrapped.setData(data);
            }
            else {
                this.waitingData = data;
            }
        };
        /**
         * Remove all data from the form.
         */
        NeedsSchemaForm.prototype.clear = function () {
            this.wrapped.clear();
        };
        /**
         * Get the data on the form. If you set a prototype
         * it will be used as the prototype of the returned
         * object.
         */
        NeedsSchemaForm.prototype.getData = function () {
            return this.wrapped.getData();
        };
        NeedsSchemaForm.prototype.getValue = function (name) {
            return this.wrapped.getValue(name);
        };
        /**
         * Set the prototype object to use when getting the
         * form data with getData.
         * @param proto The prototype object.
         */
        NeedsSchemaForm.prototype.setPrototype = function (proto) {
            this.wrapped.setPrototype(proto);
        };
        /**
         * Set the schema for this form. This will add any properties found in the
         * schema that you did not already define on the form. It will match the form
         * property names to the name attribute on the elements. If you had a blank form
         * this would generate the whole thing for you from the schema.
         */
        NeedsSchemaForm.prototype.setSchema = function (schema, componentName) {
            this.wrapped.setSchema(schema, componentName);
            if (this.waitingData !== undefined) {
                this.wrapped.setData(this.waitingData);
                this.waitingData = undefined;
            }
            this.loadedSchema = true;
        };
        Object.defineProperty(NeedsSchemaForm.prototype, "onBeforeSetData", {
            get: function () {
                return this.wrapped.onBeforeSetData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NeedsSchemaForm.prototype, "onAfterSetData", {
            get: function () {
                return this.wrapped.onAfterSetData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NeedsSchemaForm.prototype, "onBeforeGetData", {
            get: function () {
                return this.wrapped.onBeforeGetData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NeedsSchemaForm.prototype, "onAfterGetData", {
            get: function () {
                return this.wrapped.onAfterGetData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NeedsSchemaForm.prototype, "onChanged", {
            get: function () {
                return this.wrapped.onChanged;
            },
            enumerable: true,
            configurable: true
        });
        return NeedsSchemaForm;
    }());
    exports.NeedsSchemaForm = NeedsSchemaForm;
    var Form = /** @class */ (function () {
        function Form(form) {
            this.form = form;
            this.baseLevel = undefined;
            this.beforeSetDataEvent = new events.ActionEventDispatcher();
            this.afterSetDataEvent = new events.ActionEventDispatcher();
            this.beforeGetDataEvent = new events.ActionEventDispatcher();
            this.afterGetDataEvent = new events.ActionEventDispatcher();
            this.onChangedEvent = new events.ActionEventDispatcher();
        }
        Form.prototype.setError = function (err) {
            if (this.formValues) {
                this.formValues.setError(err);
            }
        };
        Form.prototype.clearError = function () {
            if (this.formValues) {
                this.formValues.setError(formHelper.getSharedClearingValidator());
            }
        };
        Form.prototype.setData = function (data) {
            this.beforeSetDataEvent.fire({
                data: data,
                source: this
            });
            if (this.formValues) {
                this.formValues.setData(data);
                this.formValues.fireDataChanged();
            }
            else {
                formHelper.populate(this.form, data, this.baseLevel);
            }
            this.afterSetDataEvent.fire({
                data: data,
                source: this
            });
            this.clearError();
        };
        Form.prototype.clear = function () {
            this.clearError();
            if (this.formValues) {
                this.formValues.setData(sharedClearer);
                this.formValues.fireDataChanged();
            }
            else {
                formHelper.populate(this.form, sharedClearer);
            }
        };
        Form.prototype.getData = function () {
            this.beforeGetDataEvent.fire({
                source: this
            });
            var data;
            if (this.formValues) {
                data = this.formValues.recoverData(this.proto);
            }
            else {
                data = formHelper.serialize(this.form, this.proto, this.baseLevel);
            }
            this.afterGetDataEvent.fire({
                data: data,
                source: this
            });
            for (var key in data) {
                return data;
            }
            return null; //Return null if the data returned has no keys in it, which means it is empty.
        };
        Form.prototype.getValue = function (name) {
            if (this.formValues) {
                var formValue = this.formValues.getFormValue(name);
                if (formValue) {
                    return formValue.getData();
                }
            }
            else {
                //Since there is no formvalues, we must serialize the entire form and return the result.
                var data = formHelper.serialize(this.form, this.proto, this.baseLevel);
                return data[name];
            }
            return undefined;
        };
        Form.prototype.setPrototype = function (proto) {
            this.proto = proto;
        };
        Form.prototype.setSchema = function (schema, componentName) {
            var _this = this;
            if (componentName === undefined) {
                componentName = this.form.getAttribute("data-hr-form-component");
                if (componentName === null) {
                    componentName = "hr.forms.default";
                }
            }
            this.clear();
            if (this.formValues) {
                this.formValues.changeSchema(componentName, schema, this.form);
            }
            else {
                this.formValues = formHelper.buildForm(componentName, schema, this.form);
                this.baseLevel = "";
                this.formValues.onChanged.add(function (a) {
                    return _this.onChangedEvent.fire({ source: _this });
                });
            }
            this.formValues.fireDataChanged();
        };
        Object.defineProperty(Form.prototype, "onBeforeSetData", {
            get: function () {
                return this.beforeSetDataEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Form.prototype, "onAfterSetData", {
            get: function () {
                return this.afterSetDataEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Form.prototype, "onBeforeGetData", {
            get: function () {
                return this.beforeGetDataEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Form.prototype, "onAfterGetData", {
            get: function () {
                return this.afterGetDataEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Form.prototype, "onChanged", {
            get: function () {
                return this.onChangedEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        return Form;
    }());
    var NullForm = /** @class */ (function () {
        function NullForm() {
            this.beforeSetDataEvent = new events.ActionEventDispatcher();
            this.afterSetDataEvent = new events.ActionEventDispatcher();
            this.beforeGetDataEvent = new events.ActionEventDispatcher();
            this.afterGetDataEvent = new events.ActionEventDispatcher();
            this.onChangedEvent = new events.ActionEventDispatcher();
        }
        NullForm.prototype.setError = function (err) {
        };
        NullForm.prototype.clearError = function () {
        };
        NullForm.prototype.setData = function (data) {
        };
        NullForm.prototype.getValue = function (name) {
            return undefined;
        };
        NullForm.prototype.clear = function () {
        };
        NullForm.prototype.getData = function () {
            return null;
        };
        NullForm.prototype.setPrototype = function (proto) {
        };
        NullForm.prototype.setSchema = function (schema, componentName) {
        };
        Object.defineProperty(NullForm.prototype, "onBeforeSetData", {
            get: function () {
                return this.beforeSetDataEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NullForm.prototype, "onAfterSetData", {
            get: function () {
                return this.afterSetDataEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NullForm.prototype, "onBeforeGetData", {
            get: function () {
                return this.beforeGetDataEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NullForm.prototype, "onAfterGetData", {
            get: function () {
                return this.afterGetDataEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NullForm.prototype, "onChanged", {
            get: function () {
                return this.onChangedEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        return NullForm;
    }());
    /**
     * Create a new form element.
     * @param element
     */
    function build(element) {
        if (formHelper.IsFormElement(element)) {
            return new Form(element);
        }
        return new NullForm();
    }
    exports.build = build;
    function sharedClearer(i) {
        return "";
    }
});
///<amd-module name="hr.componentbuilder"/>
define("hr.componentbuilder", ["require", "exports", "hr.bindingcollection", "hr.textstream"], function (require, exports, hr_bindingcollection_1, hr_textstream_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var VariantBuilder = /** @class */ (function () {
        function VariantBuilder(componentString) {
            this.componentString = componentString;
            this.currentBuildFunc = this.tokenize;
        }
        VariantBuilder.prototype.tokenize = function (data, parentComponent, insertBeforeSibling) {
            this.tokenizedString = new hr_textstream_1.TextStream(this.componentString);
            this.currentBuildFunc = this.build;
            return this.build(data, parentComponent, insertBeforeSibling);
        };
        VariantBuilder.prototype.build = function (data, parentComponent, insertBeforeSibling) {
            return createItem(data, this.tokenizedString, parentComponent, insertBeforeSibling);
        };
        VariantBuilder.prototype.create = function (data, parentComponent, insertBeforeSibling) {
            return this.currentBuildFunc(data, parentComponent, insertBeforeSibling);
        };
        return VariantBuilder;
    }());
    exports.VariantBuilder = VariantBuilder;
    var ComponentBuilder = /** @class */ (function () {
        function ComponentBuilder(componentString) {
            this.componentString = componentString;
            this.variants = {};
            this.currentBuildFunc = this.tokenize;
        }
        ComponentBuilder.prototype.tokenize = function (data, parentComponent, insertBeforeSibling) {
            this.tokenizedString = new hr_textstream_1.TextStream(this.componentString);
            this.currentBuildFunc = this.build;
            return this.build(data, parentComponent, insertBeforeSibling);
        };
        ComponentBuilder.prototype.build = function (data, parentComponent, insertBeforeSibling) {
            return createItem(data, this.tokenizedString, parentComponent, insertBeforeSibling);
        };
        ComponentBuilder.prototype.create = function (data, parentComponent, insertBeforeSibling, variant) {
            if (variant !== null && this.variants.hasOwnProperty(variant)) {
                return this.variants[variant].create(data, parentComponent, insertBeforeSibling);
            }
            return this.currentBuildFunc(data, parentComponent, insertBeforeSibling);
        };
        ComponentBuilder.prototype.addVariant = function (name, variantBuilder) {
            this.variants[name] = variantBuilder;
        };
        return ComponentBuilder;
    }());
    exports.ComponentBuilder = ComponentBuilder;
    //Component creation function
    function createItem(data, componentStringStream, parentComponent, insertBeforeSibling) {
        var itemMarkup = componentStringStream.format(data);
        var newItems = str2DOMElement(itemMarkup);
        var arrayedItems = [];
        for (var i = 0; i < newItems.length; ++i) {
            var newItem = newItems[i];
            parentComponent.insertBefore(newItem, insertBeforeSibling);
            arrayedItems.push(newItem);
        }
        return new hr_bindingcollection_1.BindingCollection(arrayedItems);
    }
    //Actual creation function
    function str2DOMElement(html) {
        //From j Query and the discussion on http://krasimirtsonev.com/blog/article/Revealing-the-magic-how-to-properly-convert-HTML-string-to-a-DOM-element
        //Modified, does not support body tags and returns collections of children
        var wrapMap = {
            option: [1, "<select multiple='multiple'>", "</select>"],
            legend: [1, "<fieldset>", "</fieldset>"],
            area: [1, "<map>", "</map>"],
            param: [1, "<object>", "</object>"],
            thead: [1, "<table>", "</table>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
            td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
            body: [0, "", ""],
            _default: [1, "<div>", "</div>"]
        };
        wrapMap.optgroup = wrapMap.option;
        wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
        wrapMap.th = wrapMap.td;
        var match = /<\s*\w.*?>/g.exec(html);
        var element = document.createElement('div');
        if (match != null) {
            var tag = match[0].replace(/</g, '').replace(/>/g, '').split(' ')[0];
            var map = wrapMap[tag] || wrapMap._default, element;
            html = map[1] + html + map[2];
            element.innerHTML = html;
            // Descend through wrappers to the right content
            var j = map[0];
            while (j--) {
                element = element.lastChild;
            }
        }
        else {
            element.innerHTML = html;
        }
        return element.childNodes;
    }
});
///<amd-module name="hr.components"/>
define("hr.components", ["require", "exports", "hr.typeidentifiers", "hr.domquery"], function (require, exports, typeId, domquery) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var factory = {};
    /**
     * Register a function with the component system.
     * @param name - The name of the component
     * @param createFunc - The function that creates the new component.
     */
    function register(name, builder) {
        factory[name] = builder;
    }
    exports.register = register;
    function isDefined(name) {
        return factory[name] !== undefined;
    }
    exports.isDefined = isDefined;
    function getComponent(name) {
        return factory[name];
    }
    exports.getComponent = getComponent;
    /**
     * Get the default vaule if variant is undefined.
     * @returns variant default value (null)
     */
    function getDefaultVariant(item) {
        return null;
    }
    /**
     * Create a single component.
     */
    function one(name, data, parentComponent, insertBeforeSibling, createdCallback, variantFinder) {
        var variant;
        if (variantFinder === undefined) {
            variantFinder = getDefaultVariant(data);
        }
        else if (typeId.isFunction(variantFinder)) {
            variant = variantFinder(data);
        }
        return doCreateComponent(name, data, parentComponent, insertBeforeSibling, variant, createdCallback);
    }
    exports.one = one;
    /**
     * Create a component for each element in data using that element as the data for the component.
     * @param {string} name - The name of the component to create.
     * @param {HTMLElement} parentComponent - The html element to attach the component to.
     * @param {array|object} data - The data to repeat and bind, must be an array or object with a forEach method to be iterated.
     * If it is a function return the data and then return null to stop iteration.
     * @param {exports.createComponent~callback} createdCallback
     */
    function many(name, data, parentComponent, insertBeforeSibling, createdCallback, variantFinder) {
        if (variantFinder === undefined) {
            variantFinder = getDefaultVariant;
        }
        //Look for an insertion point
        var insertBefore = parentComponent.firstElementChild;
        var variant;
        while (insertBefore != null && !insertBefore.hasAttribute('data-hr-insert')) {
            insertBefore = insertBefore.nextElementSibling;
        }
        var fragmentParent = document.createDocumentFragment();
        //Output
        if (typeId.isArray(data)) {
            //An array, read it as fast as possible
            var arrData = data;
            for (var i = 0; i < arrData.length; ++i) {
                variant = variantFinder(arrData[i]);
                doCreateComponent(name, arrData[i], fragmentParent, null, variant, createdCallback);
            }
        }
        else if (typeId.isForEachable(data)) {
            //Data supports a 'foreach' method, use this to iterate it
            data.forEach(function (item) {
                variant = variantFinder(item);
                doCreateComponent(name, item, fragmentParent, null, variant, createdCallback);
            });
        }
        parentComponent.insertBefore(fragmentParent, insertBefore);
    }
    exports.many = many;
    /**
     * Remove all children from an html element
     */
    function empty(parentComponent) {
        var parent = domquery.first(parentComponent);
        var currentNode = parent.firstChild;
        var nextNode = null;
        //Walk the nodes and remove any non keepers
        while (currentNode != null) {
            nextNode = currentNode.nextSibling;
            if (currentNode.nodeType !== 1 || !(currentNode instanceof HTMLElement && currentNode.hasAttribute('data-hr-keep'))) {
                parent.removeChild(currentNode);
            }
            currentNode = nextNode;
        }
    }
    exports.empty = empty;
    function doCreateComponent(name, data, parentComponent, insertBeforeSibling, variant, createdCallback) {
        parentComponent = domquery.first(parentComponent);
        if (factory.hasOwnProperty(name)) {
            var created = factory[name].create(data, parentComponent, insertBeforeSibling, variant);
            if (createdCallback !== undefined && createdCallback !== null) {
                createdCallback(created, data);
            }
            return created;
        }
        else {
            console.log("Failed to create component '" + name + "', cannot find factory, did you forget to define it on the page?");
        }
    }
});
///<amd-module name="hr.iterable"/>
define("hr.iterable", ["require", "exports", "hr.typeidentifiers"], function (require, exports, typeId) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Query = /** @class */ (function () {
        function Query() {
            this.chain = [];
        }
        /**
         * Push an item, queries are derived backward (lifo).
         */
        Query.prototype.push = function (c) {
            this.chain.push(c);
        };
        /**
         * Derive the query lifo order from how they were pushed.
         */
        Query.prototype.derive = function (item) {
            var result = item;
            for (var i = this.chain.length - 1; i >= 0 && result !== undefined; --i) {
                result = this.chain[i](result);
            }
            return result;
        };
        return Query;
    }());
    var defaultQuery = new Query(); //Empty query to use as default
    var IterateResult = /** @class */ (function () {
        function IterateResult(done, value) {
            this.done = done;
            this.value = value;
        }
        return IterateResult;
    }());
    function _iterate(items, query) {
        var i;
        if (typeId.isArray(items)) {
            i = 0;
            return {
                next: function () {
                    var result = undefined;
                    while (result === undefined && i < items.length) {
                        var item = items[i++];
                        result = query.derive(item);
                    }
                    if (result === undefined) {
                        return new IterateResult(true);
                    }
                    else {
                        return new IterateResult(false, result);
                    }
                }
            };
        }
        else if (typeId.isFunction(items)) {
            return {
                next: function () {
                    var result = undefined;
                    while (result === undefined) {
                        var item = items();
                        if (item !== undefined) {
                            result = query.derive(item);
                        }
                        else {
                            break;
                        }
                    }
                    if (result === undefined) {
                        return new IterateResult(true);
                    }
                    else {
                        return new IterateResult(false, result);
                    }
                }
            };
        }
    }
    function _forEach(items, query, cb) {
        var i;
        if (typeId.isArray(items)) {
            for (i = 0; i < items.length; ++i) {
                var item = items[i];
                var transformed = query.derive(item);
                if (transformed !== undefined) {
                    cb(transformed);
                }
            }
        }
        else if (typeId.isFunction(items)) {
            var item = items();
            while (item !== undefined) {
                item = query.derive(item);
                cb(item);
                item = items();
            }
        }
    }
    var IteratorBase = /** @class */ (function () {
        function IteratorBase() {
        }
        IteratorBase.prototype.select = function (s) {
            return new Selector(s, this);
        };
        IteratorBase.prototype.where = function (w) {
            return new Conditional(w, this);
        };
        IteratorBase.prototype.forEach = function (cb) {
            this.build(new Query()).forEach(cb);
        };
        IteratorBase.prototype.iterator = function () {
            return this.build(new Query()).iterator();
        };
        return IteratorBase;
    }());
    var Selector = /** @class */ (function (_super) {
        __extends(Selector, _super);
        function Selector(selectCb, previous) {
            var _this = _super.call(this) || this;
            _this.selectCb = selectCb;
            _this.previous = previous;
            return _this;
        }
        Selector.prototype.build = function (query) {
            var _this = this;
            query.push(function (i) { return _this.selectCb(i); });
            return this.previous.build(query);
        };
        return Selector;
    }(IteratorBase));
    var Conditional = /** @class */ (function (_super) {
        __extends(Conditional, _super);
        function Conditional(whereCb, previous) {
            var _this = _super.call(this) || this;
            _this.whereCb = whereCb;
            _this.previous = previous;
            return _this;
        }
        Conditional.prototype.build = function (query) {
            var _this = this;
            query.push(function (i) { return _this.get(i); });
            return this.previous.build(query);
        };
        Conditional.prototype.get = function (item) {
            if (this.whereCb(item)) {
                return item;
            }
        };
        return Conditional;
    }(IteratorBase));
    var Iterable = /** @class */ (function (_super) {
        __extends(Iterable, _super);
        function Iterable(items) {
            var _this = _super.call(this) || this;
            _this.items = items;
            return _this;
        }
        Iterable.prototype.build = function (query) {
            return new BuiltQuery(this.items, query);
        };
        return Iterable;
    }(IteratorBase));
    exports.Iterable = Iterable;
    var BuiltQuery = /** @class */ (function () {
        function BuiltQuery(items, query) {
            this.items = items;
            this.query = query;
        }
        BuiltQuery.prototype.forEach = function (cb) {
            _forEach(this.items, this.query, cb);
        };
        BuiltQuery.prototype.iterator = function () {
            return _iterate(this.items, this.query);
        };
        return BuiltQuery;
    }());
});
///<amd-module name="hr.view"/>
define("hr.view", ["require", "exports", "hr.textstream", "hr.components", "hr.typeidentifiers", "hr.domquery", "hr.iterable"], function (require, exports, hr_textstream_2, components, typeId, domQuery, iter) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    var SchemaViewDataFormatter = /** @class */ (function () {
        function SchemaViewDataFormatter(schema) {
            this.schema = schema;
        }
        SchemaViewDataFormatter.prototype.convert = function (data) {
            var _this = this;
            var extractor = function (name) {
                return _this.extract(name, data);
            };
            extractor.original = data;
            return extractor;
        };
        SchemaViewDataFormatter.prototype.extract = function (name, data) {
            var prop = this.schema.properties[name];
            var rawData = data[name];
            if (prop) {
                var values = prop['x-values'];
                if (values !== undefined && Array.isArray(values)) {
                    for (var i = 0; i < values.length; ++i) {
                        if (values[i].value == rawData) {
                            return values[i].label;
                        }
                    }
                }
                var format = prop['x-ui-type'];
                if (format === undefined) {
                    format = prop.format;
                }
                //Check for dates, come in a couple ways
                switch (format) {
                    case 'date':
                        var date = new Date(rawData);
                        return date.toLocaleDateString();
                    case 'date-time':
                        var date = new Date(rawData);
                        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                }
            }
            //Handle undefined and null the same way
            if (rawData === undefined || rawData === null) {
                return (prop !== undefined && prop['x-null-value']) || "";
            }
            //Handle true values
            if (rawData === true) {
                return (prop !== undefined && prop['x-value']) || "Yes";
            }
            //Handle false values
            if (rawData === false) {
                return (prop !== undefined && prop['x-false-value']) || "No";
            }
            return rawData;
        };
        return SchemaViewDataFormatter;
    }());
    exports.SchemaViewDataFormatter = SchemaViewDataFormatter;
    var ComponentView = /** @class */ (function () {
        function ComponentView(element, component) {
            this.element = element;
            this.component = component;
        }
        ComponentView.prototype.setData = function (data, createdCallback, variantFinderCallback) {
            components.empty(this.element);
            this.insertData(data, null, createdCallback, variantFinderCallback);
        };
        ComponentView.prototype.appendData = function (data, createdCallback, variantFinderCallback) {
            this.insertData(data, null, createdCallback, variantFinderCallback);
        };
        ComponentView.prototype.insertData = function (data, insertBeforeSibling, createdCallback, variantFinderCallback) {
            var _this = this;
            if (Array.isArray(data) || typeId.isForEachable(data)) {
                if (this.formatter !== undefined) {
                    var dataExtractors = new iter.Iterable(data).select(function (i) {
                        return _this.formatter.convert(i);
                    });
                    components.many(this.component, dataExtractors, this.element, insertBeforeSibling, createdCallback === undefined ? undefined : function (b, e) {
                        return createdCallback(b, e.original);
                    }, variantFinderCallback === undefined ? undefined : function (i) {
                        return variantFinderCallback(i.original);
                    });
                }
                else {
                    components.many(this.component, data, this.element, insertBeforeSibling, createdCallback, variantFinderCallback);
                }
            }
            else if (data !== undefined && data !== null) {
                if (this.formatter !== undefined) {
                    components.one(this.component, this.formatter.convert(data), this.element, insertBeforeSibling, createdCallback === undefined ? undefined : function (b, e) {
                        return createdCallback(b, e.original);
                    }, variantFinderCallback === undefined ? undefined : function (i) {
                        return variantFinderCallback(i.original);
                    });
                }
                else {
                    components.one(this.component, data, this.element, insertBeforeSibling, createdCallback, variantFinderCallback);
                }
            }
        };
        ComponentView.prototype.clear = function () {
            components.empty(this.element);
        };
        ComponentView.prototype.setFormatter = function (formatter) {
            this.formatter = formatter;
        };
        return ComponentView;
    }());
    var TextNodeView = /** @class */ (function () {
        function TextNodeView(element) {
            this.element = element;
            this.dataTextElements = undefined;
        }
        TextNodeView.prototype.setData = function (data) {
            this.insertData(data);
        };
        TextNodeView.prototype.appendData = function (data) {
            this.insertData(data);
        };
        TextNodeView.prototype.insertData = function (data) {
            if (this.formatter !== undefined) {
                var extractor = this.formatter.convert(data);
                this.dataTextElements = bindData(extractor, this.element, this.dataTextElements);
            }
            else {
                this.dataTextElements = bindData(data, this.element, this.dataTextElements);
            }
        };
        TextNodeView.prototype.clear = function () {
            this.dataTextElements = bindData(sharedClearer, this.element, this.dataTextElements);
        };
        TextNodeView.prototype.setFormatter = function (formatter) {
            this.formatter = formatter;
        };
        return TextNodeView;
    }());
    var NullView = /** @class */ (function () {
        function NullView() {
        }
        NullView.prototype.setData = function () {
        };
        NullView.prototype.appendData = function () {
        };
        NullView.prototype.insertData = function () {
        };
        NullView.prototype.clear = function () {
        };
        NullView.prototype.setFormatter = function (formatter) {
        };
        return NullView;
    }());
    function IsHTMLElement(element) {
        //Just check a couple functions, no need to go overboard, only comparing to node anyway
        return element && element.nodeType == 1;
    }
    function build(element) {
        if (IsHTMLElement(element)) {
            var component;
            if (element.hasAttribute('data-hr-view-component')) {
                component = element.getAttribute('data-hr-view-component');
            }
            else if (element.hasAttribute('data-hr-model-component')) {
                component = element.getAttribute('data-hr-model-component');
            }
            if (component) {
                return new ComponentView(element, component);
            }
            else {
                return new TextNodeView(element);
            }
        }
        return new NullView();
    }
    exports.build = build;
    function bindData(data, element, dataTextElements) {
        //No found elements, iterate everything.
        if (dataTextElements === undefined) {
            dataTextElements = [];
            domQuery.iterateNodes(element, NodeFilter.SHOW_TEXT, function (node) {
                var textStream = new hr_textstream_2.TextStream(node.textContent, { escape: false }); //Since we are using textContent, there is no need to escape the input
                if (textStream.foundVariable()) {
                    node.textContent = textStream.format(data);
                    dataTextElements.push({
                        node: node,
                        stream: textStream
                    });
                }
            });
        }
        else {
            for (var i = 0; i < dataTextElements.length; ++i) {
                var node = dataTextElements[i];
                node.node.textContent = node.stream.format(data);
            }
        }
        return dataTextElements;
    }
    function sharedClearer(i) {
        return "";
    }
});
///<amd-module name="hr.models"/>
define("hr.models", ["require", "exports", "hr.form", "hr.view"], function (require, exports, forms, views) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function build(element) {
        var src = element.getAttribute('data-hr-model-src');
        if (element.nodeName === 'FORM' || element.nodeName == 'INPUT' || element.nodeName == 'TEXTAREA') {
            var shim = forms.build(element);
            shim.appendData = function (data) {
                shim.setData(data);
            };
            shim.getSrc = function () {
                return src;
            };
            return shim;
        }
        else {
            var shim2 = views.build(element);
            shim2.getData = function () {
                return {};
            };
            shim2.getSrc = function () {
                return src;
            };
            return shim2;
        }
    }
    exports.build = build;
    var NullModel = /** @class */ (function () {
        function NullModel() {
        }
        NullModel.prototype.setData = function (data) {
        };
        NullModel.prototype.appendData = function (data) {
        };
        NullModel.prototype.clear = function () {
        };
        NullModel.prototype.getData = function () {
            return {};
        };
        NullModel.prototype.getSrc = function () {
            return "";
        };
        NullModel.prototype.setPrototype = function (proto) { };
        return NullModel;
    }());
    exports.NullModel = NullModel;
    /**
     * This class is a model that enforces its type.
     */
    var StrongTypedModel = /** @class */ (function () {
        function StrongTypedModel(childModel, strongConstructor) {
            this.childModel = childModel;
            this.strongConstructor = strongConstructor;
        }
        StrongTypedModel.prototype.setData = function (data) {
            this.childModel.setData(data);
        };
        StrongTypedModel.prototype.appendData = function (data) {
            this.childModel.appendData(data);
        };
        StrongTypedModel.prototype.clear = function () {
            this.childModel.clear();
        };
        StrongTypedModel.prototype.getData = function () {
            return new this.strongConstructor(this.childModel.getData());
        };
        StrongTypedModel.prototype.getSrc = function () {
            return this.childModel.getSrc();
        };
        StrongTypedModel.prototype.setPrototype = function (proto) {
            this.childModel.setPrototype(proto);
        };
        return StrongTypedModel;
    }());
    exports.StrongTypedModel = StrongTypedModel;
});
///<amd-module name="hr.bindingcollection"/>
define("hr.bindingcollection", ["require", "exports", "hr.domquery", "hr.toggles", "hr.models", "hr.form", "hr.view"], function (require, exports, domQuery, toggles, models, form, view) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function EventRunner(name, listener) {
        this.execute = function (evt) {
            var cb = listener[name];
            if (cb) {
                cb.call(listener, evt);
            }
        };
    }
    function bindEvents(elements, listener) {
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            domQuery.iterateNodes(element, NodeFilter.SHOW_ELEMENT, function (node) {
                //Look for attribute
                for (var i = 0; i < node.attributes.length; i++) {
                    var attribute = node.attributes[i];
                    if (attribute.name.startsWith('data-hr-on-')) {
                        var eventFunc = attribute.value;
                        if (listener[eventFunc]) {
                            var runner = new EventRunner(eventFunc, listener);
                            node.addEventListener(attribute.name.substr(11), runner.execute);
                        }
                    }
                }
            });
        }
    }
    function getToggle(name, elements, typedToggle) {
        var states = typedToggle.getPossibleStates();
        var toggleArray = [];
        var query = '[data-hr-toggle=' + name + ']';
        var startState = null;
        //Find all the toggles in the collection with the given name
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            var toggleElements = domQuery.all(query, element);
            for (var i = 0; i < toggleElements.length; ++i) {
                toggleArray.push(toggles.build(toggleElements[i], states));
                startState = startState ? startState : toggles.getStartState(toggleElements[i]);
            }
        }
        if (toggleArray.length === 0) {
            //Nothing, null toggle
            typedToggle.setStates(toggles.build(null, states));
        }
        else if (toggleArray.length === 1) {
            //One thing, use toggle state directly
            typedToggle.setStates(toggleArray[0]);
        }
        else {
            //Multiple things, create a multi state and use that
            typedToggle.setStates(new toggles.MultiToggleStates(toggleArray));
        }
        if (startState != null) {
            typedToggle.applyState(startState);
        }
    }
    function getModel(name, elements) {
        var model;
        var query = '[data-hr-model=' + name + ']';
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            var targetElement = domQuery.first(query, element);
            if (targetElement) {
                model = models.build(targetElement);
                return model; //Found it, need to break element loop, done here if found
            }
            else {
                model = null;
            }
        }
        if (model === null) {
            model = (new models.NullModel());
        }
        return model;
    }
    function getHandle(name, elements) {
        var model;
        var query = '[data-hr-handle=' + name + ']';
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            var targetElement = domQuery.first(query, element);
            if (targetElement && targetElement instanceof HTMLElement) {
                return targetElement;
            }
        }
        return null;
    }
    function getConfig(elements) {
        var data = {};
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            domQuery.iterateNodes(element, NodeFilter.SHOW_ELEMENT, function (node) {
                //Look for attribute
                for (var i = 0; i < node.attributes.length; i++) {
                    var attribute = node.attributes[i];
                    if (attribute.name.startsWith('data-hr-config-')) {
                        data[attribute.name.substr(15)] = attribute.value;
                    }
                }
            });
        }
        return data;
    }
    function iterateControllers(name, elements, cb) {
        for (var eIx = 0; eIx < elements.length; ++eIx) {
            var element = elements[eIx];
            domQuery.iterate('[data-hr-controller="' + name + '"]', element, cb);
        }
    }
    var PooledBindings = /** @class */ (function () {
        function PooledBindings(docFrag, parent) {
            this.docFrag = docFrag;
            this.parent = parent;
        }
        PooledBindings.prototype.restore = function (insertBefore) {
            this.parent.insertBefore(this.docFrag, insertBefore);
        };
        return PooledBindings;
    }());
    exports.PooledBindings = PooledBindings;
    /**
     * The BindingCollection class allows you to get access to the HtmlElements defined on your
     * page with objects that help manipulate them. You won't get the elements directly and you
     * should not need to, using the interfaces should be enough.
     */
    var BindingCollection = /** @class */ (function () {
        function BindingCollection(elements) {
            this.elements = domQuery.all(elements);
        }
        /**
         * Set the listener for this binding collection. This listener will have its functions
         * fired when a matching event is fired.
         * @param {type} listener
         */
        BindingCollection.prototype.setListener = function (listener) {
            bindEvents(this.elements, listener);
        };
        /**
         * Get a named toggle, this will always be an on off toggle.
         */
        BindingCollection.prototype.getToggle = function (name) {
            var toggle = new toggles.OnOffToggle();
            getToggle(name, this.elements, toggle);
            return toggle;
        };
        /**
         * Get a named toggle, this will use the passed in custom toggle instance. Using this you can define
         * states other than on and off.
         */
        BindingCollection.prototype.getCustomToggle = function (name, toggle) {
            getToggle(name, this.elements, toggle);
            return toggle;
        };
        /**
         * @deprecated
         * THIS IS DEPRECATED use getForm and getView instead.
         * Get a named model. Can also provide a StrongTypeConstructor that will be called with new to create
         * the instance of the data pulled from the model. If you don't provide this the objects will be plain
         * javascript objects.
         */
        BindingCollection.prototype.getModel = function (name, strongConstructor) {
            var model = getModel(name, this.elements);
            if (strongConstructor !== undefined) {
                model = new models.StrongTypedModel(model, strongConstructor);
            }
            return model;
        };
        /**
         * Get the config for this binding collection.
         */
        BindingCollection.prototype.getConfig = function () {
            return getConfig(this.elements);
        };
        /**
         * Get a handle element. These are direct references to html elements for passing to third party libraries
         * that need them. Don't use these directly if you can help it.
         */
        BindingCollection.prototype.getHandle = function (name) {
            return getHandle(name, this.elements);
        };
        /**
         * Iterate over all the controllers in the BindingCollection.
         */
        BindingCollection.prototype.iterateControllers = function (name, cb) {
            iterateControllers(name, this.elements, cb);
        };
        /**
         * Get a named form, will return a valid IForm object no matter what, but that object
         * might not actually be a rea form on the document if name does not exist.
         * @param name The name of the form to lookup.
         */
        BindingCollection.prototype.getForm = function (name) {
            var query = '[data-hr-form=' + name + ']';
            var targetElement = this.findElement(query);
            //Backward compatibility with model
            if (targetElement === null) {
                query = '[data-hr-model=' + name + ']';
                targetElement = this.findElement(query);
            }
            return form.build(targetElement);
        };
        /**
         * Get a named view, will return a valid IView object no matter what, but that object
         * might not actually be a real view on the document if name does not exist.
         * @param name The name of the view to lookup
         */
        BindingCollection.prototype.getView = function (name) {
            var query = '[data-hr-view=' + name + ']';
            var targetElement = this.findElement(query);
            //Backward compatibility with model
            if (targetElement === null) {
                query = '[data-hr-model=' + name + ']';
                targetElement = this.findElement(query);
            }
            return view.build(targetElement);
        };
        BindingCollection.prototype.findElement = function (query) {
            for (var eIx = 0; eIx < this.elements.length; ++eIx) {
                var element = this.elements[eIx];
                var targetElement = domQuery.first(query, element);
                if (targetElement) {
                    //Found it, return now
                    return targetElement;
                }
            }
            return null; //Not found, return null
        };
        Object.defineProperty(BindingCollection.prototype, "rootElement", {
            /**
             * Return the "root" html element for this binding collection. If there is more
             * than one element, the first one will be returned and null will be returned if
             * there is no root element. Ideally you would not use this directly, but it is
             * useful to insert nodes before a set of bound elements.
             */
            get: function () {
                return this.elements.length > 0 ? this.elements[0] : null;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Remove all contained elements from the document. Be sure to use this to
         * remove the collection so all elements are properly removed.
         */
        BindingCollection.prototype.remove = function () {
            for (var eIx = 0; eIx < this.elements.length; ++eIx) {
                this.elements[eIx].remove();
            }
        };
        /**
         * Pool the elements into a document fragment. Will return a pooled bindings
         * class that can be used to restore the pooled elements to the document.
         */
        BindingCollection.prototype.pool = function () {
            var parent = this.elements[0].parentElement;
            var docFrag = document.createDocumentFragment();
            for (var eIx = 0; eIx < this.elements.length; ++eIx) {
                docFrag.appendChild(this.elements[eIx]);
            }
            return new PooledBindings(docFrag, parent);
        };
        return BindingCollection;
    }());
    exports.BindingCollection = BindingCollection;
    ;
});
///<amd-module name="hr.ignored"/>
define("hr.ignored", ["require", "exports", "hr.domquery"], function (require, exports, domQuery) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //This module defines html nodes that are ignored and a way to check to see if a node is ignored or the
    //child of an ignored node. Ignored nodes are defined with the data-hr-ignored attribute.
    var ignoredNodes = domQuery.all('[data-hr-ignored]');
    function isIgnored(node) {
        for (var i = 0; i < ignoredNodes.length; ++i) {
            if (ignoredNodes[i].contains(node)) {
                return true;
            }
        }
        return false;
    }
    exports.isIgnored = isIgnored;
});
///<amd-module name="hr.di"/>
define("hr.di", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function IsDiFuncitonId(test) {
        return test && test.id !== undefined && test.arg !== undefined;
    }
    function IsInjectableConstructor(test) {
        return test["InjectorArgs"] !== undefined;
    }
    var DiIdProperty = "__diId";
    var Scopes;
    (function (Scopes) {
        Scopes[Scopes["Shared"] = 0] = "Shared";
        Scopes[Scopes["Transient"] = 1] = "Transient";
    })(Scopes || (Scopes = {}));
    var InjectedProperties = /** @class */ (function () {
        function InjectedProperties() {
            this.resolvers = [];
        }
        /**
         * Add a resolver.
         * @param resolver The resolver to add
         */
        InjectedProperties.prototype.addResolver = function (resolver) {
            this.resolvers.push(resolver);
        };
        /**
         * Resolve a service for a given id, which can be undefined. If no service is found, undefined is returned.
         */
        InjectedProperties.prototype.resolve = function (id, scope) {
            for (var i = this.resolvers.length - 1; i >= 0; --i) {
                var resolver = this.resolvers[i];
                if (resolver.id === id) {
                    return {
                        instance: resolver.resolver(scope),
                        scope: resolver.scope
                    };
                }
            }
        };
        /**
         * Determine if there is a resolver for a given id.
         * @param id The id to lookup
         */
        InjectedProperties.prototype.hasResolverForId = function (id) {
            for (var i = this.resolvers.length - 1; i >= 0; --i) {
                var resolver = this.resolvers[i];
                if (resolver.id === id) {
                    return true;
                }
            }
            return false;
        };
        return InjectedProperties;
    }());
    /**
     * A collection of services for injection into other classes.
     * Currently this can only accept non generic typescript classes to inject.
     * It works by creating a hierarchy of service collections, which can then have scopes
     * created with additional servics defined if needed. Servics can be shared or transient.
     * If they are shared a single instance will be created when requested and stored at the
     * level in the instance resolver that it was defined on. If any child scopes attempt to
     * create a shared service they will get the shared instance. Note that this is not quite a
     * singleton because you can have multiple service stacks. Transient services are not shared
     * and a new instance will be created each time an instance is requested.
     * @returns
     */
    var ServiceCollection = /** @class */ (function () {
        function ServiceCollection() {
            this.resolvers = {};
        }
        /**
         * Add a shared service to the collection, shared services are created the first time they are requested
         * and persist across child scopes.
         * @param {function} typeHandle The constructor function for the type that represents this injected object.
         * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
         * @returns
         */
        ServiceCollection.prototype.addShared = function (typeHandle, resolver) {
            return this.addSharedId(undefined, typeHandle, resolver);
        };
        /**
         * Add a shared service to the collection, shared services are created the first time they are requested
         * and persist across child scopes. This version will additionally require an id object to get the service back.
         * @param {function} typeHandle The constructor function for the type that represents this injected object.
         * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
         * @returns
         */
        ServiceCollection.prototype.addSharedId = function (id, typeHandle, resolver) {
            if (IsInjectableConstructor(resolver)) {
                return this.add(id, typeHandle, Scopes.Shared, this.createConstructorResolver(resolver));
            }
            else {
                return this.add(id, typeHandle, Scopes.Shared, resolver);
            }
        };
        /**
         * Add a shared service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
         * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
         * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
         * for the existance of a service.
         * @param {DiFunction<T>} typeHandle
         * @param {InjectableConstructor<T> | T} resolver
         * @returns
         */
        ServiceCollection.prototype.tryAddShared = function (typeHandle, resolver) {
            return this.tryAddSharedId(undefined, typeHandle, resolver);
        };
        /**
         * Add a shared service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
         * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
         * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
         * for the existance of a service. This version will additionally require an id object to get the service back. You can add multiple
         * objects of the same type as long as they have different ids, but a match of id and object type will be blocked.
         * @param {DiFunction<T>} typeHandle
         * @param {InjectableConstructor<T> | T} resolver
         * @returns
         */
        ServiceCollection.prototype.tryAddSharedId = function (id, typeHandle, resolver) {
            if (!this.hasTypeHandle(id, typeHandle)) {
                this.addSharedId(id, typeHandle, resolver);
            }
            return this;
        };
        /**
         * Add a transient service to the collection, transient services are created each time they are asked for.
         * @param {function} typeHandle The constructor function for the type that represents this injected object.
         * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
         * @returns
         */
        ServiceCollection.prototype.addTransient = function (typeHandle, resolver) {
            return this.addTransientId(undefined, typeHandle, resolver);
        };
        /**
         * Add a transient service to the collection, transient services are created each time they are asked for.
         * This version will additionally require an id object to get the service back.
         * @param {function} typeHandle The constructor function for the type that represents this injected object.
         * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
         * @returns
         */
        ServiceCollection.prototype.addTransientId = function (id, typeHandle, resolver) {
            if (IsInjectableConstructor(resolver)) {
                return this.add(id, typeHandle, Scopes.Transient, this.createConstructorResolver(resolver));
            }
            else {
                return this.add(id, typeHandle, Scopes.Transient, resolver);
            }
        };
        /**
         * Add a transient service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
         * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
         * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
         * for the existance of a service.
         * @param {DiFunction<T>} typeHandle
         * @param {InjectableConstructor<T> | T} resolver
         * @returns
         */
        ServiceCollection.prototype.tryAddTransient = function (typeHandle, resolver) {
            return this.tryAddTransientId(undefined, typeHandle, resolver);
        };
        /**
         * Add a transient service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
         * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
         * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
         * for the existance of a service. This version will additionally require an id object to get the service back. You can add multiple
         * objects of the same type as long as they have different ids, but a match of id and object type will be blocked.
         * @param {DiFunction<T>} typeHandle
         * @param {InjectableConstructor<T> | T} resolver
         * @returns
         */
        ServiceCollection.prototype.tryAddTransientId = function (id, typeHandle, resolver) {
            if (!this.hasTypeHandle(id, typeHandle)) {
                this.addTransientId(id, typeHandle, resolver);
            }
            return this;
        };
        /**
         * Add an existing object instance as a singleton to this injector. Existing instances can only be added
         * as singletons.
         * @param {function} typeHandle The constructor function for the type that represents this injected object.
         * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
         * @returns
         */
        ServiceCollection.prototype.addSharedInstance = function (typeHandle, instance) {
            return this.addSharedInstanceId(undefined, typeHandle, instance);
        };
        /**
         * Add an existing object instance as a singleton to this injector. Existing instances can only be added
         * as singletons. This version will additionally require an id object to get the service back.
         * @param {function} typeHandle The constructor function for the type that represents this injected object.
         * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
         * @returns
         */
        ServiceCollection.prototype.addSharedInstanceId = function (id, typeHandle, instance) {
            return this.add(id, typeHandle, Scopes.Shared, function (s) { return instance; });
        };
        /**
         * Add a singleton service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
         * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
         * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
         * for the existance of a service.
         * @param {DiFunction<T>} typeHandle
         * @param {InjectableConstructor<T> | T} resolver
         * @returns
         */
        ServiceCollection.prototype.tryAddSharedInstance = function (typeHandle, instance) {
            return this.tryAddSharedInstanceId(undefined, typeHandle, instance);
        };
        /**
         * Add a singleton service to the collection if it does not exist in the collection already. Note that the ServiceCollections do not
         * have parents or any concept of parents, so services added this way to a ServiceCollection that is a child of another service
         * collection will override the service in the child collection as if you added it with add, since it has no way to check parents
         * for the existance of a service. This version will additionally require an id object to get the service back. You can add multiple
         * objects of the same type as long as they have different ids, but a match of id and object type will be blocked.
         * @param {DiFunction<T>} typeHandle
         * @param {InjectableConstructor<T> | T} resolver
         * @returns
         */
        ServiceCollection.prototype.tryAddSharedInstanceId = function (id, typeHandle, instance) {
            if (!this.hasTypeHandle(id, typeHandle)) {
                this.addSharedInstanceId(id, typeHandle, instance);
            }
            return this;
        };
        /**
         * Add a service to this service collection.
         * @param {function} typeHandle The constructor function for the type that represents this injected object.
         * @param {ResolverFunction<T>} resolver The resolver function for the object, can return promises.
         */
        ServiceCollection.prototype.add = function (id, typeHandle, scope, resolver) {
            if (!typeHandle.prototype.hasOwnProperty(DiIdProperty)) {
                typeHandle.prototype[DiIdProperty] = ServiceCollection.idIndex++;
            }
            var injector = this.resolvers[typeHandle.prototype[DiIdProperty]];
            if (!injector) {
                injector = new InjectedProperties();
                this.resolvers[typeHandle.prototype[DiIdProperty]] = injector;
            }
            injector.addResolver({
                resolver: resolver,
                scope: scope,
                id: id
            });
            return this;
        };
        /**
         * Determine if this service collection already has a resolver for the given type handle.
         * @param {DiFunction<T>} typeHandle The type handle to lookup
         * @returns True if there is a resolver, and false if there is not.
         */
        ServiceCollection.prototype.hasTypeHandle = function (id, typeHandle) {
            if (typeHandle.prototype.hasOwnProperty(DiIdProperty)) {
                var typeId = typeHandle.prototype[DiIdProperty];
                var resolver = this.resolvers[typeId];
                if (resolver !== undefined) {
                    return resolver.hasResolverForId(id);
                }
            }
            return false;
        };
        /**
         * Helper function to create a resolver that constructs objects from constructor functions, it will di
         * the arguments to the function.
         * @param {InjectableConstructor} resolver
         * @returns
         */
        ServiceCollection.prototype.createConstructorResolver = function (constructor) {
            return function (s) {
                var argTypes = constructor.InjectorArgs;
                var args = [];
                for (var i = 0; i < argTypes.length; ++i) {
                    var injectType = argTypes[i];
                    if (IsDiFuncitonId(injectType)) {
                        args[i] = s.getRequiredServiceId(injectType.id, injectType.arg);
                    }
                    else {
                        args[i] = s.getRequiredService(injectType);
                    }
                }
                var controllerObj = Object.create(constructor.prototype);
                constructor.apply(controllerObj, args);
                return controllerObj;
            };
        };
        /**
         * Resolve a service, note that every time this is called the service will be instantiated,
         * the scopes will hold the instances. Don't call this directly, but instead use the scopes
         * created by calling createScope.
         * @param {function} typeHandle
         * @param {Scope} scope
         * @internal
         * @returns
         */
        ServiceCollection.prototype.__resolveService = function (id, typeHandle, scope) {
            var diId = typeHandle.prototype[DiIdProperty];
            if (this.resolvers[diId] !== undefined) {
                //Instantiate service, have scope handle instances
                var info = this.resolvers[diId];
                var result = info.resolve(id, scope);
                if (result !== undefined) {
                    return result;
                }
            }
            return undefined;
        };
        /**
         * Create a scope to hold instantiated variables.
         * @returns The new scope.
         */
        ServiceCollection.prototype.createScope = function () {
            return new Scope(this);
        };
        ServiceCollection.idIndex = 0;
        return ServiceCollection;
    }());
    exports.ServiceCollection = ServiceCollection;
    var InstanceHandler = /** @class */ (function () {
        function InstanceHandler() {
            this.instances = [];
        }
        InstanceHandler.prototype.addInstance = function (instance) {
            this.instances.push(instance);
        };
        /**
         * Get an instance by id if it exists, otherwise return undefined.
         */
        InstanceHandler.prototype.getInstance = function (id) {
            for (var i = this.instances.length - 1; i >= 0; --i) {
                var instance = this.instances[i];
                if (instance.id === id) {
                    return instance.instance;
                }
            }
            return undefined;
        };
        return InstanceHandler;
    }());
    var InstanceHolder = /** @class */ (function () {
        function InstanceHolder() {
        }
        return InstanceHolder;
    }());
    /**
     * A scope for dependency injection.
     * @param {ServiceCollection} services
     * @param {Scope} parentScope?
     * @returns
     */
    var Scope = /** @class */ (function () {
        function Scope(services, parentScope) {
            this.singletons = {};
            this.services = services;
            this.parentScope = parentScope;
        }
        /**
         * Get a service defined by the given constructor function.
         * @param {function} typeHandle
         * @returns
         */
        Scope.prototype.getService = function (typeHandle) {
            return this.getServiceId(undefined, typeHandle);
        };
        /**
         * Get a service defined by the given constructor function and id.
         * @param {function} typeHandle
         * @returns
         */
        Scope.prototype.getServiceId = function (id, typeHandle) {
            var typeId = typeHandle.prototype[DiIdProperty];
            var instance = this.bubbleFindSingletonInstance(id, typeHandle);
            //If the service is not found, resolve from our service collection
            if (instance === undefined) {
                var result = this.resolveService(id, typeHandle, this);
                //Add scoped results to the scope instances if one was returned
                if (result !== undefined) {
                    instance = result.instance;
                }
            }
            return instance;
        };
        /**
         * Get a service defined by the given constructor function. If the service does not exist an error is thrown.
         * @param {function} typeHandle
         * @returns
         */
        Scope.prototype.getRequiredService = function (typeHandle) {
            return this.getRequiredServiceId(undefined, typeHandle);
        };
        /**
        * Get a service defined by the given constructor function and id. If the service does not exist an error is thrown.
        * @param {function} typeHandle
        * @returns
        */
        Scope.prototype.getRequiredServiceId = function (id, typeHandle) {
            var instance = this.getServiceId(id, typeHandle);
            if (instance === undefined) {
                var funcNameRegex = /^function\s+([\w\$]+)\s*\(/;
                var typeResult = funcNameRegex.exec(typeHandle.prototype.constructor.toString());
                var typeName = typeResult ? typeResult[1] : "anonymous";
                var withId = "";
                if (id !== undefined) {
                    withId = " with id " + id + " ";
                }
                throw new Error("Cannot find required service for function " + typeName + withId + ". Did you forget to inject it?");
            }
            return instance;
        };
        /**
         * Create a child scope that shares service definitions and singleton instances.
         * @returns
         */
        Scope.prototype.createChildScope = function (serviceCollection) {
            if (serviceCollection === undefined) {
                serviceCollection = new ServiceCollection();
            }
            return new Scope(serviceCollection, this);
        };
        /**
         * Walk up the tree looking for singletons, if one is found return it otherwise undefined is returned.
         * @param {DiFunction<T>} typeHandle
         * @returns
         */
        Scope.prototype.bubbleFindSingletonInstance = function (id, typeHandle) {
            var typeId = typeHandle.prototype[DiIdProperty];
            var handler = this.singletons[typeId];
            var instance;
            if (handler !== undefined) {
                instance = handler.getInstance(id);
            }
            if (instance === undefined && this.parentScope !== undefined) {
                instance = this.parentScope.bubbleFindSingletonInstance(id, typeHandle);
            }
            return instance;
        };
        /**
         * Helper to resolve services, only looks at the service collection, walks entire tree to create a service.
         * @param {DiFunction<T>} typeHandle
         * @returns
         */
        Scope.prototype.resolveService = function (id, typeHandle, scope) {
            var result = this.services.__resolveService(id, typeHandle, scope);
            if (result === undefined) {
                //Cannot find service at this level, search parent services.
                if (this.parentScope) {
                    result = this.parentScope.resolveService(id, typeHandle, scope);
                }
            }
            else if (result.scope === Scopes.Shared) {
                //If we found an instance and its a singleton, add it to this scope's list of singletons.
                //Do it here so its stored on the level that resolved it.
                var typeId = typeHandle.prototype[DiIdProperty];
                var handler = this.singletons[typeId];
                if (handler === undefined) {
                    handler = new InstanceHandler();
                    this.singletons[typeId] = handler;
                }
                handler.addInstance({
                    instance: result.instance,
                    id: id
                });
            }
            return result;
        };
        return Scope;
    }());
    exports.Scope = Scope;
});
///<amd-module name="hr.controller"/>
define("hr.controller", ["require", "exports", "hr.bindingcollection", "hr.bindingcollection", "hr.toggles", "hr.domquery", "hr.ignored", "hr.eventdispatcher", "hr.di", "hr.di"], function (require, exports, hr_bindingcollection_2, hr_bindingcollection_3, hr_toggles_1, domQuery, ignoredNodes, hr_eventdispatcher_1, di, hr_di_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BindingCollection = hr_bindingcollection_3.BindingCollection;
    exports.OnOffToggle = hr_toggles_1.OnOffToggle;
    exports.TypedToggle = hr_toggles_1.TypedToggle;
    exports.ServiceCollection = hr_di_1.ServiceCollection;
    /**
     * This class provides a way to get a handle to the data provided by the
     * createOnCallback data argument. Return this type from your InjectorArgs
     * where you take the row data argument, and the appropriate data object
     * will be returned. There is only a need for one of these, since controllers
     * can only accept one piece of callback data.
     */
    var InjectControllerData = /** @class */ (function () {
        function InjectControllerData() {
        }
        return InjectControllerData;
    }());
    exports.InjectControllerData = InjectControllerData;
    /**
     * This class builds controllers using dependency injection.
     * Controllers are pretty much normal dependency injected classes, they have no superclass and don't
     * have any constructor requirements, however, you might want to take controller.BindingCollection at a minimum.
     * In addition to this your controller can define a function called postBind that will be called after the
     * controller's constructor and setting the controller as the binding collection listener. This is the best
     * place to create additional neseted controllers without messing up the binding collection.
     *
     * The way to handle a controller is as follows:
     * 1. Create the controller class with any InjectorArgs defined that need to be injected, likely at a minimnum this is controller.BindingCollection
     * 2. Implement the constructor for the controller taking in arguments for everything you need injected.
     *    In the controller read anything you will need out of the BindingCollection, do not store it for later or read it later, it will change as the page
     *    changes, so if you have nested controllers they can potentially end up seeing each others elements.
     * 3. Implement protected postBind() to do any work that should happen after bindings are complete. This will fire after the constructor has run and after
     *    the new controller instance has bound its functions to the dom. Ideally this method is protected so subclasses can call it but nothing else in typescript
     *    can see it.
     */
    var InjectedControllerBuilder = /** @class */ (function () {
        /**
         * Create a new ControllerBuilder, can reference a parent controller by passing it.
         * @param controllerConstructor
         * @param scope The scope to use for dependency injection into the controller
         */
        function InjectedControllerBuilder(scope) {
            this.controllerCreatedEvent = new hr_eventdispatcher_1.ActionEventDispatcher();
            this.serviceCollection = new di.ServiceCollection();
            if (scope) {
                this.baseScope = scope.createChildScope(this.serviceCollection);
            }
            else {
                this.baseScope = new di.Scope(this.serviceCollection);
            }
        }
        Object.defineProperty(InjectedControllerBuilder.prototype, "Services", {
            /**
             * Get the service collection to define services for this builder. Don't create scopes with this
             * use createUnbound if you need to make an instance of something in the service collection, this
             * will prevent your scopes from getting messed up.
             */
            get: function () {
                return this.serviceCollection;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InjectedControllerBuilder.prototype, "controllerCreated", {
            /**
             * This event is fired when this builder creates a controller.
             */
            get: function () {
                return this.controllerCreatedEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Create a child builder from this controller builder, this allows you to add
         * shared instances to the child that will not be present in the parent.
         */
        InjectedControllerBuilder.prototype.createChildBuilder = function () {
            return new InjectedControllerBuilder(this.baseScope.createChildScope(new di.ServiceCollection()));
        };
        /**
         * Create a new controller instance on the named nodes in the document.
         * @param name The name of the data-hr-controller nodes to lookup.
         * @param controllerConstructor The controller to create when a node is found.
         * @param parentBindings The parent bindings to restrict the controller search.
         */
        InjectedControllerBuilder.prototype.create = function (name, controllerConstructor, parentBindings) {
            return this.createId(undefined, name, controllerConstructor, parentBindings);
        };
        /**
         * Create a new controller instance on the named nodes in the document using an id based service.
         * @param name The name of the data-hr-controller nodes to lookup.
         * @param controllerConstructor The controller to create when a node is found.
         * @param parentBindings The parent bindings to restrict the controller search.
         */
        InjectedControllerBuilder.prototype.createId = function (id, name, controllerConstructor, parentBindings) {
            var _this = this;
            var createdControllers = [];
            var foundElement = function (element) {
                if (!ignoredNodes.isIgnored(element)) {
                    var services = new di.ServiceCollection();
                    var scope = _this.baseScope.createChildScope(services);
                    var bindings = new hr_bindingcollection_2.BindingCollection(element);
                    services.addTransient(hr_bindingcollection_2.BindingCollection, function (s) { return bindings; });
                    element.removeAttribute('data-hr-controller');
                    var controller = _this.createController(id, controllerConstructor, services, scope, bindings);
                    createdControllers.push(controller);
                }
            };
            if (parentBindings) {
                parentBindings.iterateControllers(name, foundElement);
            }
            else {
                domQuery.iterate('[data-hr-controller="' + name + '"]', null, foundElement);
            }
            return createdControllers;
        };
        /**
         * This will create a single instance of the service that resolves to constructorFunc
         * without looking for html elements, it will not have a binding collection.
         * This can be used to create any kind of object, not just controllers. Do this for anything
         * you want to use from the service scope for this controller.
         */
        InjectedControllerBuilder.prototype.createUnbound = function (constructorFunc) {
            return this.createUnboundId(undefined, constructorFunc);
        };
        /**
         * This will create a single instance of the service that resolves to constructorFunc
         * without looking for html elements, it will not have a binding collection.
         * This can be used to create any kind of object, not just controllers. Do this for anything
         * you want to use from the service scope for this controller. This verison works by creating
         * the version of a service with the given id.
         */
        InjectedControllerBuilder.prototype.createUnboundId = function (id, constructorFunc) {
            var services = new di.ServiceCollection();
            var scope = this.baseScope.createChildScope(services);
            services.addTransient(InjectedControllerBuilder, function (s) { return new InjectedControllerBuilder(scope); });
            var controller = scope.getRequiredServiceId(id, constructorFunc);
            if (controller.postBind !== undefined) {
                controller.postBind();
            }
            this.controllerCreatedEvent.fire(controller);
            return controller;
        };
        /**
         * This will create a callback function that will create a new controller when it is called.
         * @returns
         */
        InjectedControllerBuilder.prototype.createOnCallback = function (controllerConstructor) {
            return this.createOnCallbackId(undefined, controllerConstructor);
        };
        /**
         * This will create a callback function that will create a new controller when it is called.
         * This version will use the service identified by id.
         * @returns
         */
        InjectedControllerBuilder.prototype.createOnCallbackId = function (id, controllerConstructor) {
            var _this = this;
            return function (bindings, data) {
                var services = new di.ServiceCollection();
                var scope = _this.baseScope.createChildScope(services);
                services.addTransient(hr_bindingcollection_2.BindingCollection, function (s) { return bindings; });
                //If some data was provided, use it as our InjectControllerData service
                //for the newly created scope.
                if (data !== undefined) {
                    services.addTransient(InjectControllerData, function (s) { return data; });
                }
                return _this.createController(id, controllerConstructor, services, scope, bindings);
            };
        };
        InjectedControllerBuilder.prototype.createController = function (id, controllerConstructor, services, scope, bindings) {
            services.addTransient(InjectedControllerBuilder, function (s) { return new InjectedControllerBuilder(scope); });
            var controller = scope.getRequiredServiceId(id, controllerConstructor);
            bindings.setListener(controller);
            if (controller.postBind !== undefined) {
                controller.postBind();
            }
            this.controllerCreatedEvent.fire(controller);
            return controller;
        };
        return InjectedControllerBuilder;
    }());
    exports.InjectedControllerBuilder = InjectedControllerBuilder;
});
define("node_modules/htmlrapier.widgets/src/MainLoadErrorLifecycle", ["require", "exports", "hr.toggles"], function (require, exports, toggles) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MainLoadErrorLifecycle = /** @class */ (function () {
        function MainLoadErrorLifecycle(mainToggle, loadToggle, errorToggle, activateLoading) {
            this.mainToggle = mainToggle;
            this.loadToggle = loadToggle;
            this.errorToggle = errorToggle;
            this.toggleGroup = new toggles.Group(this.mainToggle, this.loadToggle, this.errorToggle);
            if (activateLoading) {
                this.showLoad();
            }
            else {
                this.showMain();
            }
        }
        MainLoadErrorLifecycle.prototype.showMain = function () {
            this.toggleGroup.activate(this.mainToggle);
        };
        MainLoadErrorLifecycle.prototype.showLoad = function () {
            this.toggleGroup.activate(this.loadToggle);
        };
        MainLoadErrorLifecycle.prototype.showError = function (error) {
            this.toggleGroup.activate(this.errorToggle);
        };
        MainLoadErrorLifecycle.prototype.showOther = function (toggle) {
            this.toggleGroup.activate(toggle);
        };
        return MainLoadErrorLifecycle;
    }());
    exports.MainLoadErrorLifecycle = MainLoadErrorLifecycle;
});
define("node_modules/htmlrapier.widgets/src/ListingDisplayController", ["require", "exports", "node_modules/htmlrapier.widgets/src/MainLoadErrorLifecycle"], function (require, exports, hr_widgets_MainLoadErrorLifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ListingDisplayOptions = /** @class */ (function () {
        function ListingDisplayOptions() {
            this.listingModelName = "listing";
            this.mainToggleName = "main";
            this.errorToggleName = "error";
            this.loadToggleName = "load";
            this.setLoadingOnStart = true;
        }
        return ListingDisplayOptions;
    }());
    exports.ListingDisplayOptions = ListingDisplayOptions;
    /**
     * This superclass is pointless, should get rid of it
     */
    var ListingDisplayController = /** @class */ (function () {
        function ListingDisplayController(bindings, settings) {
            this.listingModel = bindings.getView(settings.listingModelName);
            this.lifecycle = new hr_widgets_MainLoadErrorLifecycle_1.MainLoadErrorLifecycle(bindings.getToggle(settings.mainToggleName), bindings.getToggle(settings.loadToggleName), bindings.getToggle(settings.errorToggleName), settings.setLoadingOnStart);
        }
        ListingDisplayController.prototype.clearData = function () {
            this.listingModel.clear();
        };
        ListingDisplayController.prototype.setFormatter = function (formatter) {
            this.listingModel.setFormatter(formatter);
        };
        ListingDisplayController.prototype.appendData = function (data, createdCallback, variantFinderCallback) {
            this.listingModel.appendData(data, createdCallback, variantFinderCallback);
        };
        ListingDisplayController.prototype.showMain = function () {
            this.lifecycle.showMain();
        };
        ListingDisplayController.prototype.showLoad = function () {
            this.lifecycle.showLoad();
        };
        ListingDisplayController.prototype.showError = function (error) {
            this.lifecycle.showError(error);
        };
        return ListingDisplayController;
    }());
    exports.ListingDisplayController = ListingDisplayController;
});
define("node_modules/htmlrapier.widgets/src/PageNumberWidget", ["require", "exports", "hr.eventdispatcher", "hr.controller"], function (require, exports, events, controller) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A toggle that is on, off or active.
     */
    var OnOffActiveToggle = /** @class */ (function (_super) {
        __extends(OnOffActiveToggle, _super);
        function OnOffActiveToggle() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        OnOffActiveToggle.prototype.active = function () {
            this.applyState("active");
        };
        OnOffActiveToggle.prototype.getPossibleStates = function () {
            return OnOffActiveToggle.activeStates;
        };
        OnOffActiveToggle.activeStates = ['on', 'off', 'active'];
        return OnOffActiveToggle;
    }(controller.OnOffToggle));
    exports.OnOffActiveToggle = OnOffActiveToggle;
    var HypermediaPageState = /** @class */ (function () {
        function HypermediaPageState(pageData) {
            var loc = pageData.data;
            this.currentPage = loc.offset;
            this.totalPages = 0;
            if (loc.offset !== undefined && loc.limit !== undefined && loc.limit !== 0 && loc.total !== undefined) {
                this.totalPages = Math.floor(loc.total / loc.limit);
                if (loc.total % loc.limit > 0) {
                    ++this.totalPages;
                }
            }
            this.canFirst = pageData.canFirst();
            this.canPrevious = pageData.canPrevious();
            this.canNext = pageData.canNext();
            this.canLast = pageData.canLast();
            this.itemStart = pageData.data.offset * pageData.data.limit;
            this.itemEnd = this.itemStart + pageData.data.limit;
            ++this.itemStart; //Increment so we start at 1 not 0.
            this.total = pageData.data.total;
            //Make sure we are displaying the correct number of items.
            if (this.itemEnd > this.total) {
                this.itemEnd = this.total;
            }
            this.offset = pageData.data.offset;
            this.limit = pageData.data.limit;
        }
        return HypermediaPageState;
    }());
    exports.HypermediaPageState = HypermediaPageState;
    var PageEventArgs = /** @class */ (function () {
        function PageEventArgs(page) {
            this._page = page;
        }
        Object.defineProperty(PageEventArgs.prototype, "page", {
            get: function () {
                return this._page;
            },
            enumerable: true,
            configurable: true
        });
        return PageEventArgs;
    }());
    exports.PageEventArgs = PageEventArgs;
    var PageNumberWidgetOptions = /** @class */ (function () {
        function PageNumberWidgetOptions(parentController) {
            this._parentController = parentController;
            this.loadPageFunctionBaseName = "page";
            this.toggleBaseName = "page";
            this.modelBaseName = "page";
            this.firstToggleName = "first";
            this.previousToggleName = "previous";
            this.nextToggleName = "next";
            this.lastToggleName = "last";
            this.firstCallbackFuncName = "pageFirst";
            this.previousCallbackFuncName = "pagePrevious";
            this.nextCallbackFuncName = "pageNext";
            this.lastCallbackFuncName = "pageLast";
        }
        Object.defineProperty(PageNumberWidgetOptions.prototype, "parentController", {
            get: function () {
                return this._parentController;
            },
            enumerable: true,
            configurable: true
        });
        return PageNumberWidgetOptions;
    }());
    exports.PageNumberWidgetOptions = PageNumberWidgetOptions;
    var PageNumberWidget = /** @class */ (function () {
        function PageNumberWidget(bindings, options) {
            var _this = this;
            this.pageNumberToggles = [];
            this.pageNumberModels = [];
            this.loadPageEventDispatcher = new events.ActionEventDispatcher();
            this.loadFirstEventDispatcher = new events.ActionEventDispatcher();
            this.loadPreviousEventDispatcher = new events.ActionEventDispatcher();
            this.loadNextEventDispatcher = new events.ActionEventDispatcher();
            this.loadLastEventDispatcher = new events.ActionEventDispatcher();
            var pageToggle;
            var lookup = true;
            var parentController = options.parentController;
            var i = 0;
            while (lookup) {
                pageToggle = bindings.getCustomToggle(options.toggleBaseName + i, new OnOffActiveToggle());
                lookup = pageToggle.isUsable();
                if (lookup) {
                    this.pageNumberToggles.push(pageToggle);
                    parentController[options.loadPageFunctionBaseName + i] = this.pageEventClojureCreator(i);
                    this.pageNumberModels.push(bindings.getModel(options.modelBaseName + i));
                }
                ++i;
            }
            this.halfPageButtonTotal = Math.floor(this.pageNumberModels.length / 2);
            this.firstToggle = bindings.getToggle(options.firstToggleName);
            this.previousToggle = bindings.getToggle(options.previousToggleName);
            this.nextToggle = bindings.getToggle(options.nextToggleName);
            this.lastToggle = bindings.getToggle(options.lastToggleName);
            //Setup remaining functions
            parentController[options.firstCallbackFuncName] = function (evt) { _this.fireNavEvent(evt, _this.currentState.canFirst, _this.loadFirstEventDispatcher); };
            parentController[options.previousCallbackFuncName] = function (evt) { _this.fireNavEvent(evt, _this.currentState.canPrevious, _this.loadPreviousEventDispatcher); };
            parentController[options.nextCallbackFuncName] = function (evt) { _this.fireNavEvent(evt, _this.currentState.canNext, _this.loadNextEventDispatcher); };
            parentController[options.lastCallbackFuncName] = function (evt) { _this.fireNavEvent(evt, _this.currentState.canLast, _this.loadLastEventDispatcher); };
        }
        PageNumberWidget.prototype.setState = function (state) {
            //Try to get the current page into the middle
            this.currentState = state;
            this.startIndex = state.currentPage - this.halfPageButtonTotal;
            if (this.startIndex < 0) {
                this.startIndex = 0;
            }
            var shiftedCurrent = state.currentPage - this.startIndex;
            //Layout pages from start index.
            var i;
            for (i = 0; i < this.pageNumberToggles.length && i + this.startIndex < state.totalPages; ++i) {
                if (i === shiftedCurrent) {
                    this.pageNumberToggles[i].active();
                }
                else {
                    this.pageNumberToggles[i].on();
                }
                this.pageNumberModels[i].setData({
                    pageNum: i + this.startIndex + 1
                });
            }
            //Turn off extra toggles
            for (; i < this.pageNumberToggles.length; ++i) {
                this.pageNumberToggles[i].off();
            }
            //Check other toggles
            PageNumberWidget.setNavigatorToggle(state.canFirst, this.firstToggle);
            PageNumberWidget.setNavigatorToggle(state.canPrevious, this.previousToggle);
            PageNumberWidget.setNavigatorToggle(state.canNext, this.nextToggle);
            PageNumberWidget.setNavigatorToggle(state.canLast, this.lastToggle);
        };
        PageNumberWidget.setNavigatorToggle = function (canNav, navToggle) {
            if (canNav) {
                navToggle.on();
            }
            else {
                navToggle.off();
            }
        };
        Object.defineProperty(PageNumberWidget.prototype, "loadPageEvent", {
            get: function () {
                return this.loadPageEventDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PageNumberWidget.prototype, "loadFirstEvent", {
            get: function () {
                return this.loadFirstEventDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PageNumberWidget.prototype, "loadPreviousEvent", {
            get: function () {
                return this.loadPreviousEventDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PageNumberWidget.prototype, "loadNextEvent", {
            get: function () {
                return this.loadNextEventDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PageNumberWidget.prototype, "loadLastEvent", {
            get: function () {
                return this.loadLastEventDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        PageNumberWidget.prototype.pageEventClojureCreator = function (index) {
            var _this = this;
            return function (evt) {
                evt.preventDefault();
                _this.loadPageEventDispatcher.fire(new PageEventArgs(_this.startIndex + index));
            };
        };
        PageNumberWidget.prototype.fireNavEvent = function (evt, ableToRespond, dispatcher) {
            evt.preventDefault();
            if (ableToRespond) {
                dispatcher.fire(this);
            }
        };
        return PageNumberWidget;
    }());
    exports.PageNumberWidget = PageNumberWidget;
});
define("node_modules/htmlrapier.widgets/src/CrudService", ["require", "exports", "hr.eventdispatcher"], function (require, exports, events) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ShowItemEditorEventArgs = /** @class */ (function () {
        function ShowItemEditorEventArgs(dataPromise, update, dataResult, closed) {
            this.dataPromise = dataPromise;
            this.update = update;
            this.dataResult = dataResult;
            this.closed = closed;
        }
        return ShowItemEditorEventArgs;
    }());
    exports.ShowItemEditorEventArgs = ShowItemEditorEventArgs;
    var DataLoadingEventArgs = /** @class */ (function () {
        function DataLoadingEventArgs(dataPromise) {
            this._dataPromise = dataPromise;
        }
        Object.defineProperty(DataLoadingEventArgs.prototype, "data", {
            get: function () {
                return this._dataPromise;
            },
            enumerable: true,
            configurable: true
        });
        return DataLoadingEventArgs;
    }());
    exports.DataLoadingEventArgs = DataLoadingEventArgs;
    var CrudDataModifiedEventArgs = /** @class */ (function () {
        function CrudDataModifiedEventArgs() {
        }
        return CrudDataModifiedEventArgs;
    }());
    exports.CrudDataModifiedEventArgs = CrudDataModifiedEventArgs;
    var ICrudService = /** @class */ (function () {
        function ICrudService() {
            this.showItemEditorDispatcher = new events.ActionEventDispatcher();
            this.showAddItemDispatcher = new events.ActionEventDispatcher();
            this.closeItemEditorDispatcher = new events.ActionEventDispatcher();
            this.dataLoadingDispatcher = new events.ActionEventDispatcher();
            this.crudDataModifiedDispatcher = new events.ActionEventDispatcher();
        }
        /**
         * This function will return the schema for adding an item. The default implementation will just return
         * getItemSchema, but if you can return a unique schema for adding, overwrite this function.
         */
        ICrudService.prototype.getAddItemSchema = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.getItemSchema()];
                });
            });
        };
        /**
         * Get the view of item that is its search query.
         * @param item The item
         */
        ICrudService.prototype.getSearchObject = function (item) {
            return item;
        };
        Object.defineProperty(ICrudService.prototype, "showItemEditorEvent", {
            /**
             * This event is fired when the service is requesting to show the item editor.
             */
            get: function () {
                return this.showItemEditorDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Call this function to show the item editor. What editor is shown depends on how your crud page is setup.
         * @param args The args for showing the editor
         */
        ICrudService.prototype.fireShowItemEditorEvent = function (args) {
            this.showItemEditorDispatcher.fire(args);
        };
        Object.defineProperty(ICrudService.prototype, "showAddItemEvent", {
            /**
             * This event is fired when the service is requesting to show the add item editor.
             */
            get: function () {
                return this.showAddItemDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Call this function to show the add item editor. What editor is really shown depends on how your crud page is setup.
         * @param args The args for showing the editor.
         */
        ICrudService.prototype.fireAddItemEvent = function (args) {
            this.showAddItemDispatcher.fire(args);
        };
        Object.defineProperty(ICrudService.prototype, "closeItemEditorEvent", {
            /**
             * This event is fired when item editors should close. Any open item editors should fire this event.
             */
            get: function () {
                return this.closeItemEditorDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Fire this function to close any open item editors. This should apply to both add and update.
         */
        ICrudService.prototype.fireCloseItemEditorEvent = function () {
            this.closeItemEditorDispatcher.fire(undefined);
        };
        Object.defineProperty(ICrudService.prototype, "dataLoadingEvent", {
            /**
             * This event is fired when the service is loading data for the main display.
             */
            get: function () {
                return this.dataLoadingDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Call this function to alert the crud page that main display data is loading.
         * @param args The args
         */
        ICrudService.prototype.fireDataLoadingEvent = function (args) {
            this.dataLoadingDispatcher.fire(args);
        };
        Object.defineProperty(ICrudService.prototype, "crudDataModifiedEvent", {
            /**
             * This event is fired when the service has changed some of its data.
             */
            get: function () {
                return this.crudDataModifiedDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Call this function to alert the crud page that crud data has changed.
         * @param args The args
         */
        ICrudService.prototype.fireCrudDataModifiedEvent = function (args) {
            this.crudDataModifiedDispatcher.fire(args);
        };
        return ICrudService;
    }());
    exports.ICrudService = ICrudService;
});
define("node_modules/htmlrapier.widgets/src/confirm", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var IConfirm = /** @class */ (function () {
        function IConfirm() {
        }
        return IConfirm;
    }());
    exports.IConfirm = IConfirm;
    /**
     * A simple confirm that uses the browser confirm function, this wraps that function in a promise
     * so it matches the other prompt interfaces.
     */
    var BrowserConfirm = /** @class */ (function () {
        function BrowserConfirm() {
        }
        BrowserConfirm.prototype.confirm = function (message) {
            return new Promise(function (resovle, reject) {
                if (window.confirm(message)) {
                    resovle(true);
                }
                else {
                    resovle(false);
                }
            });
        };
        return BrowserConfirm;
    }());
    exports.BrowserConfirm = BrowserConfirm;
});
define("node_modules/htmlrapier.widgets/src/alert", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var IAlert = /** @class */ (function () {
        function IAlert() {
        }
        return IAlert;
    }());
    exports.IAlert = IAlert;
    /**
     * A simple confirm that uses the browser confirm function, this wraps that function in a promise
     * so it matches the other prompt interfaces.
     */
    var BrowserAlert = /** @class */ (function () {
        function BrowserAlert() {
        }
        BrowserAlert.prototype.alert = function (message) {
            window.alert(message);
        };
        return BrowserAlert;
    }());
    exports.BrowserAlert = BrowserAlert;
});
define("node_modules/htmlrapier.widgets/src/CrudTableRow", ["require", "exports", "hr.controller", "node_modules/htmlrapier.widgets/src/confirm", "node_modules/htmlrapier.widgets/src/alert", "node_modules/htmlrapier.widgets/src/CrudService"], function (require, exports, controller, hr_widgets_confirm_1, hr_widgets_alert_1, crudService) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This class allows extensions to be created for CrudTableRows, this is the reccomended way to add
     * customizations to your CrudTableRows as you don't have to worry about injecting and calling a
     * superclass constructor.
     */
    var CrudTableRowControllerExtensions = /** @class */ (function () {
        function CrudTableRowControllerExtensions() {
        }
        /**
         * This function is called during the row's constructor.
         * @param row The row being constructed.
         * @param bindings The bindings for the row, you can use setListener to set your extensions class as an additional listener on the row.
         * @param data The data for the row, your subclassed version can be more specific here.
         */
        CrudTableRowControllerExtensions.prototype.rowConstructed = function (row, bindings, data) {
        };
        /**
         * This is called when a row edit button is pressed. Return true to allow the default editing process to happen, false if you want to handle
         * it yourself. By default the crud service is told to edit.
         * @param row The row being edited
         * @param data The data for the row, will be the same as what was passed to rowConstructed.
         */
        CrudTableRowControllerExtensions.prototype.onEdit = function (row, data) {
            return true;
        };
        CrudTableRowControllerExtensions.prototype.onDelete = function (row, data) {
            return Promise.resolve(true);
        };
        return CrudTableRowControllerExtensions;
    }());
    exports.CrudTableRowControllerExtensions = CrudTableRowControllerExtensions;
    /**
     * Controller for a row on the crud page, you can customize it by subclassing CrudTableRowControllerExtensions.
     */
    var CrudTableRowController = /** @class */ (function () {
        function CrudTableRowController(bindings, confirm, crudService, alert, data, extensions) {
            this.extensions = extensions;
            this.data = data;
            this.crudService = crudService;
            this.confirm = confirm;
            this.alert = alert;
            if (!this.crudService.canEdit(data)) {
                var editToggle = bindings.getToggle("edit");
                editToggle.off();
            }
            else {
                var viewToggle = bindings.getToggle("view");
                viewToggle.off();
            }
            if (!this.crudService.canDel(data)) {
                var deleteToggle = bindings.getToggle("del");
                deleteToggle.off();
            }
            this.extensions.rowConstructed(this, bindings, data);
        }
        Object.defineProperty(CrudTableRowController, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection, hr_widgets_confirm_1.IConfirm, crudService.ICrudService, hr_widgets_alert_1.IAlert, controller.InjectControllerData, CrudTableRowControllerExtensions];
            },
            enumerable: true,
            configurable: true
        });
        CrudTableRowController.prototype.edit = function (evt) {
            evt.preventDefault();
            if (this.extensions.onEdit(this, this.data)) {
                this.crudService.edit(this.data);
            }
        };
        CrudTableRowController.prototype.view = function (evt) {
            evt.preventDefault();
            if (this.extensions.onEdit(this, this.data)) {
                this.crudService.edit(this.data);
            }
        };
        CrudTableRowController.prototype.del = function (evt) {
            return __awaiter(this, void 0, void 0, function () {
                var err_1, message;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evt.preventDefault();
                            return [4 /*yield*/, this.extensions.onDelete(this, this.data)];
                        case 1:
                            if (!_a.sent()) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.confirm.confirm(this.crudService.getDeletePrompt(this.data))];
                        case 2:
                            if (!_a.sent()) return [3 /*break*/, 6];
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, this.crudService.del(this.data)];
                        case 4:
                            _a.sent();
                            return [3 /*break*/, 6];
                        case 5:
                            err_1 = _a.sent();
                            message = "An error occured deleting data.";
                            if (err_1.message) {
                                message += " Message: " + err_1.message;
                            }
                            console.log(message);
                            this.alert.alert(message);
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        return CrudTableRowController;
    }());
    exports.CrudTableRowController = CrudTableRowController;
    function addServices(services) {
        services.tryAddTransient(CrudTableRowControllerExtensions, function (s) { return new CrudTableRowControllerExtensions(); });
        services.tryAddTransient(CrudTableRowController, CrudTableRowController);
        services.tryAddShared(hr_widgets_confirm_1.IConfirm, function (s) { return new hr_widgets_confirm_1.BrowserConfirm(); });
        services.tryAddShared(hr_widgets_alert_1.IAlert, function (s) { return new hr_widgets_alert_1.BrowserAlert(); });
    }
    exports.addServices = addServices;
});
define("node_modules/htmlrapier.widgets/src/CrudQuery", ["require", "exports", "hr.eventdispatcher"], function (require, exports, events) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var QueryEventArgs = /** @class */ (function () {
        function QueryEventArgs(query) {
            this._query = query;
        }
        Object.defineProperty(QueryEventArgs.prototype, "query", {
            get: function () {
                return this._query;
            },
            enumerable: true,
            configurable: true
        });
        return QueryEventArgs;
    }());
    exports.QueryEventArgs = QueryEventArgs;
    var CrudQueryManager = /** @class */ (function () {
        function CrudQueryManager() {
            this.loadPageDispatcher = new events.ActionEventDispatcher();
            this.components = [];
        }
        Object.defineProperty(CrudQueryManager.prototype, "loadPageEvent", {
            get: function () {
                return this.loadPageDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        CrudQueryManager.prototype.addComponent = function (component) {
            var _this = this;
            this.components.push(component);
            component.loadPageEvent.add(function (a) { return _this.fireLoadPageEvent(); });
        };
        CrudQueryManager.prototype.fireLoadPageEvent = function () {
            var query = {};
            for (var i = 0; i < this.components.length; ++i) {
                this.components[i].setupQuery(query);
            }
            this.loadPageDispatcher.fire(new QueryEventArgs(query));
        };
        CrudQueryManager.prototype.setupQuery = function () {
            var query = {};
            for (var i = 0; i < this.components.length; ++i) {
                this.components[i].setupQuery(query);
            }
            return query;
        };
        return CrudQueryManager;
    }());
    exports.CrudQueryManager = CrudQueryManager;
    var ICrudQueryComponent = /** @class */ (function () {
        function ICrudQueryComponent() {
            this.loadPageDispatcher = new events.ActionEventDispatcher();
        }
        Object.defineProperty(ICrudQueryComponent.prototype, "loadPageEvent", {
            get: function () {
                return this.loadPageDispatcher.modifier;
            },
            enumerable: true,
            configurable: true
        });
        ICrudQueryComponent.prototype.fireLoadPage = function () {
            this.loadPageDispatcher.fire(undefined);
        };
        return ICrudQueryComponent;
    }());
    exports.ICrudQueryComponent = ICrudQueryComponent;
    function addServices(services) {
        services.tryAddShared(CrudQueryManager, function (s) {
            return new CrudQueryManager();
        });
    }
    exports.addServices = addServices;
});
define("node_modules/htmlrapier.widgets/src/CrudSearch", ["require", "exports", "node_modules/htmlrapier.widgets/src/CrudQuery", "hr.controller", "node_modules/htmlrapier.widgets/src/CrudService", "hr.form", "node_modules/htmlrapier.widgets/src/MainLoadErrorLifecycle"], function (require, exports, hr_widgets_CrudQuery_1, controller, hr_widgets_CrudService_1, form, hr_widgets_MainLoadErrorLifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CrudSearch = /** @class */ (function (_super) {
        __extends(CrudSearch, _super);
        function CrudSearch(bindings, crudService, queryManager) {
            var _this = _super.call(this) || this;
            _this.lifecycle = new hr_widgets_MainLoadErrorLifecycle_2.MainLoadErrorLifecycle(bindings.getToggle("main"), bindings.getToggle("load"), bindings.getToggle("error"), true);
            _this.crudService = crudService;
            _this.crudService.dataLoadingEvent.add(function (a) { return _this.handlePageLoad(a.data); });
            _this.queryManager = queryManager;
            _this.queryManager.addComponent(_this);
            _this.form = new form.NeedsSchemaForm(bindings.getForm("input"));
            _this.setup(bindings, crudService);
            return _this;
        }
        Object.defineProperty(CrudSearch, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection, hr_widgets_CrudService_1.ICrudService, hr_widgets_CrudQuery_1.CrudQueryManager];
            },
            enumerable: true,
            configurable: true
        });
        CrudSearch.prototype.setup = function (bindings, crudService) {
            return __awaiter(this, void 0, void 0, function () {
                var schema, properties, key, prop, err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.lifecycle.showLoad();
                            return [4 /*yield*/, crudService.getSearchSchema()];
                        case 1:
                            schema = _a.sent();
                            properties = schema.properties;
                            if (properties) {
                                for (key in properties) {
                                    prop = properties[key];
                                    if (prop["x-ui-search"] !== true) {
                                        delete properties[key]; //Delete all properties that do not have x-ui-search set.
                                    }
                                }
                            }
                            this.form.setSchema(schema);
                            this.lifecycle.showMain();
                            return [3 /*break*/, 3];
                        case 2:
                            err_2 = _a.sent();
                            this.lifecycle.showError(err_2);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CrudSearch.prototype.setupQuery = function (query) {
            var searchQuery = this.form.getData();
            if (searchQuery !== null) {
                for (var key in searchQuery) {
                    if (query[key] === undefined) {
                        query[key] = searchQuery[key];
                    }
                }
            }
        };
        CrudSearch.prototype.submit = function (evt) {
            evt.preventDefault();
            this.crudService.getPage(this.queryManager.setupQuery());
        };
        CrudSearch.prototype.setData = function (pageData) {
            this.form.setData(this.crudService.getSearchObject(pageData));
        };
        CrudSearch.prototype.handlePageLoad = function (promise) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, err_3;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            _a = this.setData;
                            return [4 /*yield*/, promise];
                        case 1:
                            _a.apply(this, [_b.sent()]);
                            return [3 /*break*/, 3];
                        case 2:
                            err_3 = _b.sent();
                            console.log("Error loading crud table data for search. Message: " + err_3.message);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return CrudSearch;
    }(hr_widgets_CrudQuery_1.ICrudQueryComponent));
    exports.CrudSearch = CrudSearch;
    function addServices(services) {
        services.tryAddTransient(CrudSearch, CrudSearch);
    }
    exports.addServices = addServices;
});
define("node_modules/htmlrapier.widgets/src/CrudItemEditor", ["require", "exports", "hr.controller", "hr.form", "node_modules/htmlrapier.widgets/src/CrudService", "node_modules/htmlrapier.widgets/src/MainLoadErrorLifecycle", "hr.error"], function (require, exports, controller, form, hr_widgets_CrudService_2, hr_widgets_MainLoadErrorLifecycle_3, error) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CrudItemEditorType;
    (function (CrudItemEditorType) {
        CrudItemEditorType[CrudItemEditorType["Add"] = 1] = "Add";
        CrudItemEditorType[CrudItemEditorType["Update"] = 2] = "Update";
    })(CrudItemEditorType = exports.CrudItemEditorType || (exports.CrudItemEditorType = {}));
    var CrudItemEditorControllerOptions = /** @class */ (function () {
        function CrudItemEditorControllerOptions() {
            this.formName = "input";
            this.dialogName = "dialog";
            this.mainErrorToggleName = "mainError";
            this.mainErrorViewName = "mainError";
            this.mainToggleName = "main";
            this.loadToggleName = "load";
            this.errorToggleName = "error";
            this.activateLoadingOnStart = true;
            this.type = CrudItemEditorType.Add | CrudItemEditorType.Update;
            this.viewOnlyToggleName = "viewOnly";
        }
        Object.defineProperty(CrudItemEditorControllerOptions, "InjectorArgs", {
            get: function () {
                return [];
            },
            enumerable: true,
            configurable: true
        });
        return CrudItemEditorControllerOptions;
    }());
    exports.CrudItemEditorControllerOptions = CrudItemEditorControllerOptions;
    var CrudItemEditorControllerExtensions = /** @class */ (function () {
        function CrudItemEditorControllerExtensions() {
        }
        CrudItemEditorControllerExtensions.prototype.constructed = function (editor, bindings) {
        };
        CrudItemEditorControllerExtensions.prototype.setup = function (editor) {
            return Promise.resolve(undefined);
        };
        return CrudItemEditorControllerExtensions;
    }());
    exports.CrudItemEditorControllerExtensions = CrudItemEditorControllerExtensions;
    var CrudItemEditorController = /** @class */ (function () {
        function CrudItemEditorController(bindings, extensions, crudService, options) {
            var _this = this;
            this.extensions = extensions;
            this._autoClose = true;
            if (options === undefined) {
                options = new CrudItemEditorControllerOptions();
            }
            this._form = new form.NeedsSchemaForm(bindings.getForm(options.formName));
            this._dialog = bindings.getToggle(options.dialogName);
            this._dialog.offEvent.add(function (i) { return !_this.closed || _this.closed(); });
            this.mainErrorToggle = bindings.getToggle(options.mainErrorToggleName);
            this.mainErrorView = bindings.getView(options.mainErrorViewName);
            this.lifecycle = new hr_widgets_MainLoadErrorLifecycle_3.MainLoadErrorLifecycle(bindings.getToggle(options.mainToggleName), bindings.getToggle(options.loadToggleName), bindings.getToggle(options.errorToggleName), options.activateLoadingOnStart);
            this.viewOnlyToggle = bindings.getToggle(options.viewOnlyToggleName);
            if ((options.type & CrudItemEditorType.Add) === CrudItemEditorType.Add) {
                crudService.showAddItemEvent.add(function (arg) {
                    _this.showItemEditorHandler(arg);
                });
            }
            if ((options.type & CrudItemEditorType.Update) === CrudItemEditorType.Update) {
                crudService.showItemEditorEvent.add(function (arg) {
                    _this.showItemEditorHandler(arg);
                });
            }
            crudService.closeItemEditorEvent.add(function () {
                _this._dialog.off();
            });
            this.extensions.constructed(this, bindings);
            this.setup(crudService, options);
        }
        Object.defineProperty(CrudItemEditorController, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection,
                    CrudItemEditorControllerExtensions,
                    hr_widgets_CrudService_2.ICrudService,
                ];
            },
            enumerable: true,
            configurable: true
        });
        CrudItemEditorController.prototype.submit = function (evt) {
            return __awaiter(this, void 0, void 0, function () {
                var data, err_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evt.preventDefault();
                            if (this.updated === null) {
                                return [2 /*return*/];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            this.mainErrorToggle.off();
                            this.lifecycle.showLoad();
                            data = this._form.getData() || {};
                            return [4 /*yield*/, this.updated(data)];
                        case 2:
                            _a.sent();
                            this.lifecycle.showMain();
                            if (this._autoClose) {
                                this._dialog.off();
                            }
                            return [3 /*break*/, 4];
                        case 3:
                            err_4 = _a.sent();
                            if (error.isFormErrors(err_4)) {
                                this._form.setError(err_4);
                                this.lifecycle.showMain();
                                this.mainErrorView.setData(err_4);
                                this.mainErrorToggle.on();
                            }
                            else {
                                this.lifecycle.showError(err_4);
                            }
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        Object.defineProperty(CrudItemEditorController.prototype, "autoClose", {
            get: function () {
                return this._autoClose;
            },
            set: function (value) {
                this._autoClose = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CrudItemEditorController.prototype, "form", {
            get: function () {
                return this._form;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CrudItemEditorController.prototype, "dialog", {
            get: function () {
                return this._dialog;
            },
            enumerable: true,
            configurable: true
        });
        CrudItemEditorController.prototype.showItemEditorHandler = function (arg) {
            return __awaiter(this, void 0, void 0, function () {
                var data, err_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.mainErrorToggle.off();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            this._dialog.on();
                            this.lifecycle.showLoad();
                            return [4 /*yield*/, arg.dataPromise];
                        case 2:
                            data = _a.sent();
                            this.updated = arg.update;
                            this.viewOnlyToggle.mode = this.updated === null;
                            this.closed = arg.closed;
                            this._form.setData(data);
                            this.lifecycle.showMain();
                            return [3 /*break*/, 4];
                        case 3:
                            err_5 = _a.sent();
                            this.lifecycle.showError(err_5);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        CrudItemEditorController.prototype.setup = function (crudService, options) {
            return __awaiter(this, void 0, void 0, function () {
                var schema, err_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 6, , 7]);
                            return [4 /*yield*/, this.extensions.setup(this)];
                        case 1:
                            _a.sent();
                            if (!((options.type & CrudItemEditorType.Update) === CrudItemEditorType.Update)) return [3 /*break*/, 3];
                            return [4 /*yield*/, crudService.getItemSchema()];
                        case 2:
                            //This covers the case where the editor is an update only or update and add
                            schema = _a.sent();
                            return [3 /*break*/, 5];
                        case 3:
                            if (!((options.type & CrudItemEditorType.Add) === CrudItemEditorType.Add)) return [3 /*break*/, 5];
                            return [4 /*yield*/, crudService.getAddItemSchema()];
                        case 4:
                            //This convers when the editor is for adding items
                            schema = _a.sent();
                            _a.label = 5;
                        case 5:
                            if (schema) {
                                this._form.setSchema(schema);
                            }
                            return [3 /*break*/, 7];
                        case 6:
                            err_6 = _a.sent();
                            console.log("An error occured loading the schema for the CrudItemEditor. Message: " + err_6.message);
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        return CrudItemEditorController;
    }());
    exports.CrudItemEditorController = CrudItemEditorController;
    function addServices(services) {
        //Register all types of crud item editor, the user can ask for what they need when they build their page
        //Undefined id acts as both add and update, by default the options and extensions are shared with all editors, unless otherwise specified
        services.tryAddSharedInstance(CrudItemEditorControllerOptions, new CrudItemEditorControllerOptions());
        services.tryAddSharedInstance(CrudItemEditorControllerExtensions, new CrudItemEditorControllerExtensions());
        services.tryAddShared(CrudItemEditorController, function (s) {
            return new CrudItemEditorController(s.getRequiredService(controller.BindingCollection), s.getRequiredService(CrudItemEditorControllerExtensions), s.getRequiredService(hr_widgets_CrudService_2.ICrudService), s.getRequiredService(CrudItemEditorControllerOptions));
        });
        //Add Item Editor
        services.tryAddSharedId(CrudItemEditorType.Add, CrudItemEditorControllerExtensions, function (s) { return s.getRequiredService(CrudItemEditorControllerExtensions); });
        services.tryAddSharedId(CrudItemEditorType.Add, CrudItemEditorControllerOptions, function (s) { return s.getRequiredService(CrudItemEditorControllerOptions); });
        services.tryAddSharedId(CrudItemEditorType.Add, CrudItemEditorController, function (s) {
            var options = s.getRequiredServiceId(CrudItemEditorType.Add, CrudItemEditorControllerOptions);
            var customOptions = Object.create(options);
            customOptions.type = CrudItemEditorType.Add;
            return new CrudItemEditorController(s.getRequiredService(controller.BindingCollection), s.getRequiredServiceId(CrudItemEditorType.Add, CrudItemEditorControllerExtensions), s.getRequiredService(hr_widgets_CrudService_2.ICrudService), customOptions);
        });
        //Update item editor
        services.tryAddSharedId(CrudItemEditorType.Update, CrudItemEditorControllerExtensions, function (s) { return s.getRequiredService(CrudItemEditorControllerExtensions); });
        services.tryAddSharedId(CrudItemEditorType.Update, CrudItemEditorControllerOptions, function (s) { return s.getRequiredService(CrudItemEditorControllerOptions); });
        services.tryAddSharedId(CrudItemEditorType.Update, CrudItemEditorController, function (s) {
            var options = s.getRequiredServiceId(CrudItemEditorType.Update, CrudItemEditorControllerOptions);
            var customOptions = Object.create(options);
            customOptions.type = CrudItemEditorType.Update;
            return new CrudItemEditorController(s.getRequiredService(controller.BindingCollection), s.getRequiredServiceId(CrudItemEditorType.Update, CrudItemEditorControllerExtensions), s.getRequiredService(hr_widgets_CrudService_2.ICrudService), customOptions);
        });
    }
    exports.addServices = addServices;
});
define("node_modules/htmlrapier.widgets/src/CrudPageNumbers", ["require", "exports", "node_modules/htmlrapier.widgets/src/CrudQuery", "hr.controller", "node_modules/htmlrapier.widgets/src/CrudService", "node_modules/htmlrapier.widgets/src/PageNumberWidget"], function (require, exports, hr_widgets_CrudQuery_2, controller, hr_widgets_CrudService_3, pageWidget) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CrudPageNumbers = /** @class */ (function (_super) {
        __extends(CrudPageNumbers, _super);
        function CrudPageNumbers(bindings, crudService, queryManager) {
            var _this = _super.call(this) || this;
            _this.currentPage = 0;
            _this.crudService = crudService;
            _this.crudService.dataLoadingEvent.add(function (a) { return _this.handlePageLoad(a.data); });
            _this.queryManager = queryManager;
            _this.queryManager.addComponent(_this);
            _this.pageNumbers = new pageWidget.PageNumberWidget(bindings, new pageWidget.PageNumberWidgetOptions(_this));
            _this.pageNumbers.loadPageEvent.add(function (arg) { return _this.loadPage(arg.page); });
            _this.pageNumbers.loadFirstEvent.add(function (arg) { return _this.crudService.firstPage(); });
            _this.pageNumbers.loadPreviousEvent.add(function (arg) { return _this.crudService.previousPage(); });
            _this.pageNumbers.loadNextEvent.add(function (arg) { return _this.crudService.nextPage(); });
            _this.pageNumbers.loadLastEvent.add(function (arg) { return _this.crudService.lastPage(); });
            _this.itemCountsModel = bindings.getModel("totals");
            _this.totalPerPageModel = bindings.getModel("itemsPerPage");
            _this.totalPerPageModel.setData({
                itemsPerPage: 10
            });
            return _this;
        }
        Object.defineProperty(CrudPageNumbers, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection, hr_widgets_CrudService_3.ICrudService, hr_widgets_CrudQuery_2.CrudQueryManager];
            },
            enumerable: true,
            configurable: true
        });
        CrudPageNumbers.prototype.loadPage = function (page) {
            this.currentPage = page;
            this.crudService.getPage(this.queryManager.setupQuery());
        };
        CrudPageNumbers.prototype.setupQuery = function (query) {
            query.offset = this.currentPage;
            var perPage = this.totalPerPageModel.getData();
            if (perPage.itemsPerPage === undefined) {
                perPage.itemsPerPage = 10;
            }
            query.limit = perPage.itemsPerPage;
        };
        CrudPageNumbers.prototype.itemsPerPageChanged = function (evt) {
            evt.preventDefault();
            this.crudService.getPage(this.queryManager.setupQuery());
        };
        CrudPageNumbers.prototype.setData = function (pageData) {
            var pageState = this.crudService.getPageNumberState(pageData);
            this.pageNumbers.setState(pageState);
            this.itemCountsModel.setData(pageState);
            this.totalPerPageModel.setData({
                itemsPerPage: pageState.limit
            });
            this.currentPage = pageState.offset;
        };
        CrudPageNumbers.prototype.handlePageLoad = function (promise) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, err_7;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            _a = this.setData;
                            return [4 /*yield*/, promise];
                        case 1:
                            _a.apply(this, [_b.sent()]);
                            return [3 /*break*/, 3];
                        case 2:
                            err_7 = _b.sent();
                            console.log("Error loading crud table data for pages. Message: " + err_7.message);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return CrudPageNumbers;
    }(hr_widgets_CrudQuery_2.ICrudQueryComponent));
    exports.CrudPageNumbers = CrudPageNumbers;
    function addServices(services) {
        services.tryAddTransient(CrudPageNumbers, CrudPageNumbers);
    }
    exports.addServices = addServices;
});
define("node_modules/htmlrapier.widgets/src/CrudTableController", ["require", "exports", "node_modules/htmlrapier.widgets/src/ListingDisplayController", "hr.controller", "node_modules/htmlrapier.widgets/src/CrudService", "node_modules/htmlrapier.widgets/src/CrudQuery", "node_modules/htmlrapier.widgets/src/CrudTableRow", "hr.view"], function (require, exports, hr_widgets_ListingDisplayController_1, controller, hr_widgets_CrudService_4, hr_widgets_CrudQuery_3, hr_widgets_CrudTableRow_1, view) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CrudTableControllerExtensions = /** @class */ (function () {
        function CrudTableControllerExtensions() {
        }
        CrudTableControllerExtensions.prototype.getVariant = function (item) {
            return null;
        };
        CrudTableControllerExtensions.prototype.getDisplayObject = function (display, original) {
            return display;
        };
        return CrudTableControllerExtensions;
    }());
    exports.CrudTableControllerExtensions = CrudTableControllerExtensions;
    var CrudTableController = /** @class */ (function (_super) {
        __extends(CrudTableController, _super);
        function CrudTableController(bindings, options, crudService, queryManager, builder, extensions) {
            var _this = _super.call(this, bindings, options) || this;
            _this.builder = builder;
            _this.extensions = extensions;
            _this.lookupDisplaySchema = true;
            _this.queryManager = queryManager;
            _this.crudService = crudService;
            _this.crudService.dataLoadingEvent.add(function (a) { return _this.handlePageLoad(a.data); });
            _this.addToggle = bindings.getToggle("add");
            if (options.setLoadingOnStart) {
                _this.crudService.getPage(queryManager.setupQuery()); //Fires async
            }
            return _this;
        }
        Object.defineProperty(CrudTableController, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection, hr_widgets_ListingDisplayController_1.ListingDisplayOptions, hr_widgets_CrudService_4.ICrudService, hr_widgets_CrudQuery_3.CrudQueryManager, controller.InjectedControllerBuilder, CrudTableControllerExtensions];
            },
            enumerable: true,
            configurable: true
        });
        CrudTableController.prototype.add = function (evt) {
            evt.preventDefault();
            this.crudService.add();
        };
        CrudTableController.prototype.setData = function (pageData) {
            var _this = this;
            var items = this.crudService.getItems(pageData);
            this.clearData();
            var listingCreator = this.builder.createOnCallback(hr_widgets_CrudTableRow_1.CrudTableRowController);
            for (var i = 0; i < items.length; ++i) {
                var item = items[i];
                var itemData = this.extensions.getDisplayObject(this.crudService.getListingDisplayObject(item), item);
                this.appendData(itemData, function (b, d) {
                    listingCreator(b, item);
                }, function (v) { return _this.extensions.getVariant(item); });
            }
            this.showMain();
        };
        CrudTableController.prototype.handlePageLoad = function (promise) {
            return __awaiter(this, void 0, void 0, function () {
                var data, schema, _a, err_8;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.showLoad();
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 7, , 8]);
                            return [4 /*yield*/, promise];
                        case 2:
                            data = _b.sent();
                            if (!this.lookupDisplaySchema) return [3 /*break*/, 4];
                            this.lookupDisplaySchema = false;
                            return [4 /*yield*/, this.crudService.getListingSchema()];
                        case 3:
                            schema = _b.sent();
                            if (schema) {
                                this.setFormatter(new view.SchemaViewDataFormatter(schema));
                            }
                            _b.label = 4;
                        case 4:
                            this.setData(data);
                            _a = this.addToggle;
                            if (!_a) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.crudService.canAdd()];
                        case 5:
                            _a = !(_b.sent());
                            _b.label = 6;
                        case 6:
                            if (_a) {
                                this.addToggle.off();
                            }
                            this.addToggle = undefined; //Saw this once, thats all we care about
                            return [3 /*break*/, 8];
                        case 7:
                            err_8 = _b.sent();
                            console.log("Error loading crud table data. Message: " + err_8.message);
                            this.showError(err_8);
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        return CrudTableController;
    }(hr_widgets_ListingDisplayController_1.ListingDisplayController));
    exports.CrudTableController = CrudTableController;
    function addServices(services) {
        services.tryAddTransient(CrudTableControllerExtensions, function (s) { return new CrudTableControllerExtensions(); });
        services.tryAddTransient(CrudTableController, CrudTableController);
        services.tryAddSharedInstance(hr_widgets_ListingDisplayController_1.ListingDisplayOptions, new hr_widgets_ListingDisplayController_1.ListingDisplayOptions());
    }
    exports.addServices = addServices;
});
define("node_modules/htmlrapier.widgets/src/CrudPage", ["require", "exports", "node_modules/htmlrapier.widgets/src/ListingDisplayController", "node_modules/htmlrapier.widgets/src/CrudService", "node_modules/htmlrapier.widgets/src/CrudTableRow", "node_modules/htmlrapier.widgets/src/CrudTableRow", "node_modules/htmlrapier.widgets/src/CrudQuery", "node_modules/htmlrapier.widgets/src/CrudQuery", "node_modules/htmlrapier.widgets/src/CrudSearch", "node_modules/htmlrapier.widgets/src/CrudSearch", "node_modules/htmlrapier.widgets/src/CrudItemEditor", "node_modules/htmlrapier.widgets/src/CrudItemEditor", "node_modules/htmlrapier.widgets/src/CrudPageNumbers", "node_modules/htmlrapier.widgets/src/CrudPageNumbers", "node_modules/htmlrapier.widgets/src/CrudTableController", "node_modules/htmlrapier.widgets/src/CrudTableController"], function (require, exports, hr_widgets_ListingDisplayController_2, hr_widgets_CrudService_5, crudRow, hr_widgets_CrudTableRow_2, crudQuery, hr_widgets_CrudQuery_4, crudSearch, hr_widgets_CrudSearch_1, crudItemEditor, hr_widgets_CrudItemEditor_1, crudPageNumbers, hr_widgets_CrudPageNumbers_1, crudTable, hr_widgets_CrudTableController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListingDisplayOptions = hr_widgets_ListingDisplayController_2.ListingDisplayOptions;
    exports.DataLoadingEventArgs = hr_widgets_CrudService_5.DataLoadingEventArgs;
    exports.ICrudService = hr_widgets_CrudService_5.ICrudService;
    exports.ShowItemEditorEventArgs = hr_widgets_CrudService_5.ShowItemEditorEventArgs;
    exports.CrudDataModifiedEventArgs = hr_widgets_CrudService_5.CrudDataModifiedEventArgs;
    exports.CrudTableRowController = hr_widgets_CrudTableRow_2.CrudTableRowController;
    exports.CrudTableRowControllerExtensions = hr_widgets_CrudTableRow_2.CrudTableRowControllerExtensions;
    exports.CrudQueryManager = hr_widgets_CrudQuery_4.CrudQueryManager;
    exports.ICrudQueryComponent = hr_widgets_CrudQuery_4.ICrudQueryComponent;
    exports.QueryEventArgs = hr_widgets_CrudQuery_4.QueryEventArgs;
    exports.CrudSearch = hr_widgets_CrudSearch_1.CrudSearch;
    exports.CrudItemEditorController = hr_widgets_CrudItemEditor_1.CrudItemEditorController;
    exports.CrudItemEditorControllerExtensions = hr_widgets_CrudItemEditor_1.CrudItemEditorControllerExtensions;
    exports.CrudItemEditorControllerOptions = hr_widgets_CrudItemEditor_1.CrudItemEditorControllerOptions;
    exports.CrudItemEditorType = hr_widgets_CrudItemEditor_1.CrudItemEditorType;
    exports.CrudPageNumbers = hr_widgets_CrudPageNumbers_1.CrudPageNumbers;
    exports.CrudTableController = hr_widgets_CrudTableController_1.CrudTableController;
    exports.CrudTableControllerExtensions = hr_widgets_CrudTableController_1.CrudTableControllerExtensions;
    /**
     * Setup the services to use a crud page in the given service collection. This will
     * try to add all services needed to make a crud page, but you will have to inject
     * your own ICrudService as the final piece to make everything work.
     * Since this uses try, you can override any services by injecting them before calling
     * this function. This will also inject the CrudPageNumbers and CrudSearch controllers,
     * so you can make instances of those without registering them.
     * @param {controller.ServiceCollection} services The service collection to add services to.
     */
    function addServices(services) {
        crudTable.addServices(services);
        crudRow.addServices(services);
        crudItemEditor.addServices(services);
        crudPageNumbers.addServices(services);
        crudSearch.addServices(services);
        crudQuery.addServices(services);
    }
    exports.addServices = addServices;
});
///<amd-module name="hr.externalpromise"/>
define("hr.externalpromise", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This is a wrapper for a promise that exposes the resolve
     * and reject functions.
     */
    var ExternalPromise = /** @class */ (function () {
        function ExternalPromise() {
            var _this = this;
            this._promise = new Promise(function (resolve, reject) {
                _this.resolveCb = resolve;
                _this.rejectCb = reject;
            });
        }
        ExternalPromise.prototype.resolve = function (data) {
            this.resolveCb(data);
        };
        ExternalPromise.prototype.reject = function (error) {
            this.rejectCb(error);
        };
        Object.defineProperty(ExternalPromise.prototype, "Promise", {
            get: function () {
                return this._promise;
            },
            enumerable: true,
            configurable: true
        });
        return ExternalPromise;
    }());
    exports.ExternalPromise = ExternalPromise;
    ;
});
///<amd-module name="hr.deeplink"/>
define("hr.deeplink", ["require", "exports", "hr.uri"], function (require, exports, hr_uri_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DeepLinkArgs = /** @class */ (function () {
        function DeepLinkArgs(_uri, basePath) {
            this._uri = _uri;
            this.basePath = basePath;
        }
        Object.defineProperty(DeepLinkArgs.prototype, "query", {
            get: function () {
                return this._uri.getQueryObject();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DeepLinkArgs.prototype, "inPagePath", {
            get: function () {
                return this._uri.path.substring(this.basePath.length);
            },
            enumerable: true,
            configurable: true
        });
        return DeepLinkArgs;
    }());
    exports.DeepLinkArgs = DeepLinkArgs;
    /**
     * This interface provides a way to handle deep links on a page. This makes it easy to setup
     * history for queries and paths that are under the current page. It has an event that will fire
     * when the user clicks forward or back. It also makes it easy to get the data out if the page was just loaded.
     * Any paths added will be normalized to only contain forward slashes / and to not end with a slash.
     */
    var IDeepLinkManager = /** @class */ (function () {
        function IDeepLinkManager() {
        }
        return IDeepLinkManager;
    }());
    exports.IDeepLinkManager = IDeepLinkManager;
    var DeepLinkManager = /** @class */ (function () {
        function DeepLinkManager(pageBaseUrl) {
            var _this = this;
            this.handlers = {};
            this.pageBaseUrl = this.normalizePath(pageBaseUrl);
            window.addEventListener("popstate", function (evt) { return _this.handlePopState(evt); });
        }
        DeepLinkManager.prototype.handlePopState = function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            var state = evt.state;
            if (state) {
                var handler = this.handlers[state.handler];
                if (handler !== undefined) {
                    handler.onPopState(new DeepLinkArgs(new hr_uri_2.Uri(), this.pageBaseUrl));
                }
            }
        };
        DeepLinkManager.prototype.registerHandler = function (name, handler) {
            if (this.handlers[name] !== undefined) {
                throw new Error("Attempted to register an IHistoryHandler named '" + name + "' multiple times, only one is allowed.");
            }
            this.handlers[name] = handler;
        };
        DeepLinkManager.prototype.pushState = function (handler, inPagePath, query, title) {
            var uri = new hr_uri_2.Uri();
            var state = this.createState(handler, inPagePath, query, uri);
            if (title === undefined) {
                title = document.title;
            }
            history.pushState(state, title, uri.build());
        };
        DeepLinkManager.prototype.replaceState = function (handler, inPagePath, query, title) {
            var uri = new hr_uri_2.Uri();
            var state = this.createState(handler, inPagePath, query, uri);
            if (title === undefined) {
                title = document.title;
            }
            history.replaceState(state, title, uri.build());
        };
        DeepLinkManager.prototype.getCurrentState = function () {
            return new DeepLinkArgs(new hr_uri_2.Uri(), this.pageBaseUrl);
        };
        DeepLinkManager.prototype.createState = function (handler, inPagePath, query, uri) {
            uri.directory = this.pageBaseUrl;
            if (inPagePath) {
                uri.directory += this.normalizePath(inPagePath);
            }
            uri.setQueryFromObject(query);
            return {
                handler: handler
            };
        };
        DeepLinkManager.prototype.normalizePath = function (url) {
            if (url) {
                url = url.replace('\\', '/');
                if (url[0] !== '/') {
                    url = '/' + url;
                }
                if (url[url.length - 1] === '/') {
                    url = url.substring(0, url.length - 1);
                }
            }
            return url;
        };
        return DeepLinkManager;
    }());
    exports.DeepLinkManager = DeepLinkManager;
    var NullDeepLinkManager = /** @class */ (function () {
        function NullDeepLinkManager() {
        }
        NullDeepLinkManager.prototype.registerHandler = function (name, handler) {
        };
        NullDeepLinkManager.prototype.pushState = function (handler, inPagePath, query) {
        };
        NullDeepLinkManager.prototype.replaceState = function (handler, inPagePath, query) {
        };
        NullDeepLinkManager.prototype.getCurrentState = function () {
            return null;
        };
        return NullDeepLinkManager;
    }());
    exports.NullDeepLinkManager = NullDeepLinkManager;
    var DeepLinkBaseUrlProvider = /** @class */ (function () {
        function DeepLinkBaseUrlProvider(pageBaseUrl) {
            this.pageBaseUrl = pageBaseUrl;
        }
        Object.defineProperty(DeepLinkBaseUrlProvider.prototype, "baseUrl", {
            get: function () {
                return this.pageBaseUrl;
            },
            enumerable: true,
            configurable: true
        });
        return DeepLinkBaseUrlProvider;
    }());
    exports.DeepLinkBaseUrlProvider = DeepLinkBaseUrlProvider;
    function setPageUrl(services, pageBaseUrl) {
        services.tryAddShared(DeepLinkBaseUrlProvider, function (s) { return new DeepLinkBaseUrlProvider(pageBaseUrl); });
    }
    exports.setPageUrl = setPageUrl;
    function addServices(services) {
        services.tryAddShared(IDeepLinkManager, function (s) {
            var linkProvider = s.getRequiredService(DeepLinkBaseUrlProvider);
            return new DeepLinkManager(linkProvider.baseUrl);
        });
    }
    exports.addServices = addServices;
});
define("node_modules/htmlrapier.widgets/src/HypermediaCrudService", ["require", "exports", "node_modules/htmlrapier.widgets/src/CrudPage", "node_modules/htmlrapier.widgets/src/PageNumberWidget", "node_modules/htmlrapier.widgets/src/CrudPage", "hr.externalpromise", "hr.deeplink"], function (require, exports, crudPage, pageWidget, hr_widgets_CrudPage_1, ep, deeplink) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CrudSearch = hr_widgets_CrudPage_1.CrudSearch;
    exports.CrudPageNumbers = hr_widgets_CrudPage_1.CrudPageNumbers;
    exports.CrudTableController = hr_widgets_CrudPage_1.CrudTableController;
    exports.CrudItemEditorController = hr_widgets_CrudPage_1.CrudItemEditorController;
    exports.CrudItemEditorType = hr_widgets_CrudPage_1.CrudItemEditorType;
    var HypermediaPageInjector = /** @class */ (function () {
        function HypermediaPageInjector(options) {
            this._usePageQueryForFirstLoad = true;
            if (options === undefined) {
                options = {};
            }
            if (options.usePageQueryForFirstLoad !== undefined) {
                this._usePageQueryForFirstLoad = options.usePageQueryForFirstLoad;
            }
            this._uniqueName = options.uniqueName;
            if (this.uniqueName === undefined) {
                this._uniqueName = "hr.autonamed_hypermedia_injector_" + HypermediaPageInjector.nameindex++;
            }
        }
        /**
         * Get the item id for a particular item. This can return null if there is no appropriate id.
         * @param item
         */
        HypermediaPageInjector.prototype.getItemId = function (item) {
            return null;
        };
        /**
         * Create a query that looks up an item by its id. The id that needs to be stored
         * will be passed in as a string, since that can represent any id type.
         */
        HypermediaPageInjector.prototype.createIdQuery = function (id) {
            return null;
        };
        /**
         * Get the item id for a particular item. This can return null if there is no appropriate id.
         * By default this function will use createIdQuery to create a query for the id and then the
         * list function to get the result. If you need to do something else you can override this function.
         * If createIdQuery returns null this function will also return null.
         * @param item
         */
        HypermediaPageInjector.prototype.getById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var query, retVal, results;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            query = this.createIdQuery(id);
                            retVal = null;
                            if (!(query !== null)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.list(query)];
                        case 1:
                            results = _a.sent();
                            if (results.data.total > 0) {
                                retVal = results.items[0];
                            }
                            _a.label = 2;
                        case 2: return [2 /*return*/, retVal];
                    }
                });
            });
        };
        Object.defineProperty(HypermediaPageInjector.prototype, "usePageQueryForFirstLoad", {
            /**
             * Determine if the query of the current page should be used as the first load's
             * query or not. Defaults to true. If you only have a single table and want deep linking
             * keep this to true, if the crud table you are creating is part of a larger page, you
             * probably want to set this to false.
             */
            get: function () {
                return this._usePageQueryForFirstLoad;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HypermediaPageInjector.prototype, "uniqueName", {
            get: function () {
                return this._uniqueName;
            },
            enumerable: true,
            configurable: true
        });
        HypermediaPageInjector.nameindex = 0;
        return HypermediaPageInjector;
    }());
    exports.HypermediaPageInjector = HypermediaPageInjector;
    var HypermediaChildPageInjector = /** @class */ (function (_super) {
        __extends(HypermediaChildPageInjector, _super);
        function HypermediaChildPageInjector(options) {
            var _this = this;
            if (options === undefined) {
                options = {};
            }
            else {
                options = Object.create(options);
            }
            options.usePageQueryForFirstLoad = false;
            _this = _super.call(this, options) || this;
            return _this;
        }
        Object.defineProperty(HypermediaChildPageInjector.prototype, "parent", {
            get: function () {
                return this.parentResult;
            },
            set: function (value) {
                this.parentResult = value;
            },
            enumerable: true,
            configurable: true
        });
        return HypermediaChildPageInjector;
    }(HypermediaPageInjector));
    exports.HypermediaChildPageInjector = HypermediaChildPageInjector;
    var AbstractHypermediaPageInjector = /** @class */ (function (_super) {
        __extends(AbstractHypermediaPageInjector, _super);
        function AbstractHypermediaPageInjector(options) {
            return _super.call(this, options) || this;
        }
        AbstractHypermediaPageInjector.prototype.getDeletePrompt = function (item) {
            return "Are you sure you want to delete this item?";
        };
        return AbstractHypermediaPageInjector;
    }(HypermediaPageInjector));
    exports.AbstractHypermediaPageInjector = AbstractHypermediaPageInjector;
    var AbstractHypermediaChildPageInjector = /** @class */ (function (_super) {
        __extends(AbstractHypermediaChildPageInjector, _super);
        function AbstractHypermediaChildPageInjector(options) {
            return _super.call(this, options) || this;
        }
        AbstractHypermediaChildPageInjector.prototype.getDeletePrompt = function (item) {
            return "Are you sure you want to delete this item?";
        };
        return AbstractHypermediaChildPageInjector;
    }(HypermediaChildPageInjector));
    exports.AbstractHypermediaChildPageInjector = AbstractHypermediaChildPageInjector;
    function IsHypermediaRefreshableResult(i) {
        return i.refresh !== undefined
            && i.canRefresh !== undefined;
    }
    exports.IsHypermediaRefreshableResult = IsHypermediaRefreshableResult;
    function IsHypermediaUpdatableResult(i) {
        return i.update !== undefined
            && i.canUpdate !== undefined;
    }
    exports.IsHypermediaUpdatableResult = IsHypermediaUpdatableResult;
    function IsHypermediaDeleteableResult(i) {
        return i.delete !== undefined
            && i.canDelete !== undefined;
    }
    exports.IsHypermediaDeleteableResult = IsHypermediaDeleteableResult;
    function IsAddableCrudCollection(i) {
        return i.hasAddDocs !== undefined
            && i.getAddDocs !== undefined
            && i.add !== undefined
            && i.canAdd !== undefined;
    }
    exports.IsAddableCrudCollection = IsAddableCrudCollection;
    function IsUpdateDocs(i) {
        return i.hasUpdateDocs !== undefined
            && i.getUpdateDocs !== undefined;
    }
    exports.IsUpdateDocs = IsUpdateDocs;
    function IsGetDocs(i) {
        return i.hasGetDocs !== undefined
            && i.getGetDocs !== undefined;
    }
    exports.IsGetDocs = IsGetDocs;
    function IsSearchableCrudCollection(i) {
        return i.hasListDocs !== undefined
            && i.getListDocs !== undefined;
    }
    exports.IsSearchableCrudCollection = IsSearchableCrudCollection;
    function IsListingSchemaCrudCollection(i) {
        return i.getGetDocs !== undefined
            && i.hasGetDocs !== undefined;
    }
    exports.IsListingSchemaCrudCollection = IsListingSchemaCrudCollection;
    var HypermediaCrudService = /** @class */ (function (_super) {
        __extends(HypermediaCrudService, _super);
        function HypermediaCrudService(pageInjector, linkManager) {
            var _this = _super.call(this) || this;
            _this.pageInjector = pageInjector;
            _this.linkManager = linkManager;
            _this.initialLoad = true;
            _this.initialPageLoadPromise = new ep.ExternalPromise();
            _this.currentPage = null;
            _this.allowCloseHistory = true;
            if (!_this.linkManager) {
                _this.linkManager = new deeplink.NullDeepLinkManager();
            }
            _this.linkManager.registerHandler(_this.pageInjector.uniqueName, _this);
            return _this;
        }
        Object.defineProperty(HypermediaCrudService, "InjectorArgs", {
            get: function () {
                return [HypermediaPageInjector, deeplink.IDeepLinkManager];
            },
            enumerable: true,
            configurable: true
        });
        HypermediaCrudService.prototype.getItemSchema = function () {
            return __awaiter(this, void 0, void 0, function () {
                var docs, schema, docs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        //This ensures that we don't return an item schema until at least one page is loaded.
                        return [4 /*yield*/, this.initialPageLoadPromise.Promise];
                        case 1:
                            //This ensures that we don't return an item schema until at least one page is loaded.
                            _a.sent();
                            if (!IsUpdateDocs(this.currentPage)) return [3 /*break*/, 3];
                            if (!this.currentPage.hasUpdateDocs()) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.currentPage.getUpdateDocs()];
                        case 2:
                            docs = _a.sent();
                            return [2 /*return*/, docs.requestSchema];
                        case 3: return [4 /*yield*/, this.getAddItemSchema()];
                        case 4:
                            schema = _a.sent();
                            if (schema !== undefined) {
                                return [2 /*return*/, schema];
                            }
                            if (!IsGetDocs(this.currentPage)) return [3 /*break*/, 6];
                            if (!this.currentPage.hasGetDocs()) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.currentPage.getGetDocs()];
                        case 5:
                            docs = _a.sent();
                            return [2 /*return*/, docs.responseSchema];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.getAddItemSchema = function () {
            return __awaiter(this, void 0, void 0, function () {
                var docs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        //This ensures that we don't return an item schema until at least one page is loaded.
                        return [4 /*yield*/, this.initialPageLoadPromise.Promise];
                        case 1:
                            //This ensures that we don't return an item schema until at least one page is loaded.
                            _a.sent();
                            if (!IsAddableCrudCollection(this.currentPage)) return [3 /*break*/, 3];
                            if (!this.currentPage.hasAddDocs()) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.currentPage.getAddDocs()];
                        case 2:
                            docs = _a.sent();
                            return [2 /*return*/, docs.requestSchema];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.getListingSchema = function () {
            return __awaiter(this, void 0, void 0, function () {
                var docs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        //This ensures that we don't return an item schema until at least one page is loaded.
                        return [4 /*yield*/, this.initialPageLoadPromise.Promise];
                        case 1:
                            //This ensures that we don't return an item schema until at least one page is loaded.
                            _a.sent();
                            if (!IsListingSchemaCrudCollection(this.currentPage)) return [3 /*break*/, 3];
                            if (!this.currentPage.hasGetDocs()) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.currentPage.getGetDocs()];
                        case 2:
                            docs = _a.sent();
                            return [2 /*return*/, docs.responseSchema];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.getSearchSchema = function () {
            return __awaiter(this, void 0, void 0, function () {
                var docs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        //This ensures that we don't return an item schema until at least one page is loaded.
                        return [4 /*yield*/, this.initialPageLoadPromise.Promise];
                        case 1:
                            //This ensures that we don't return an item schema until at least one page is loaded.
                            _a.sent();
                            if (!(IsSearchableCrudCollection(this.currentPage) && this.currentPage.hasListDocs())) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.currentPage.getListDocs()];
                        case 2:
                            docs = _a.sent();
                            return [2 /*return*/, docs.querySchema];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.add = function (item) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    if (item === undefined) {
                        item = {};
                    }
                    this.fireAddItemEvent(new crudPage.ShowItemEditorEventArgs(item, function (a) { return _this.finishAdd(a); }, this.currentPage));
                    return [2 /*return*/];
                });
            });
        };
        HypermediaCrudService.prototype.finishAdd = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!IsAddableCrudCollection(this.currentPage)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.currentPage.add(data)];
                        case 1:
                            _a.sent();
                            this.fireCrudDataModifiedEvent(new crudPage.CrudDataModifiedEventArgs());
                            this.refreshPage();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.itemEditorClosed = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (this.currentPage && this.allowCloseHistory) {
                        this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
                    }
                    return [2 /*return*/];
                });
            });
        };
        HypermediaCrudService.prototype.canAdd = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, IsAddableCrudCollection(this.currentPage) && this.currentPage.canAdd()];
                });
            });
        };
        HypermediaCrudService.prototype.edit = function (item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.beginEdit(item, true)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.beginEdit = function (item, recordHistory) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var itemId, dataPromise, update;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (recordHistory) {
                                itemId = this.pageInjector.getItemId(item);
                                if (itemId !== null) {
                                    this.linkManager.pushState(this.pageInjector.uniqueName, "Edit/" + itemId, null);
                                }
                            }
                            if (!(IsHypermediaRefreshableResult(item) && item.canRefresh())) return [3 /*break*/, 2];
                            return [4 /*yield*/, item.refresh()];
                        case 1:
                            item = _a.sent();
                            _a.label = 2;
                        case 2:
                            dataPromise = this.getEditObject(item);
                            update = null;
                            if (IsHypermediaUpdatableResult(item) && item.canUpdate()) {
                                update = function (a) { return _this.finishEdit(a, item); };
                            }
                            this.fireShowItemEditorEvent(new crudPage.ShowItemEditorEventArgs(dataPromise, update, item, function () { return _this.itemEditorClosed(); }));
                            return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.canEdit = function (item) {
            return IsHypermediaUpdatableResult(item) && item.canUpdate();
        };
        HypermediaCrudService.prototype.getEditObject = function (item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, item.data];
                });
            });
        };
        HypermediaCrudService.prototype.finishEdit = function (data, item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!IsHypermediaUpdatableResult(item)) return [3 /*break*/, 2];
                            return [4 /*yield*/, item.update(data)];
                        case 1:
                            _a.sent();
                            this.fireCrudDataModifiedEvent(new crudPage.CrudDataModifiedEventArgs());
                            this.refreshPage();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.del = function (item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!IsHypermediaDeleteableResult(item)) return [3 /*break*/, 2];
                            return [4 /*yield*/, item.delete()];
                        case 1:
                            _a.sent();
                            this.fireCrudDataModifiedEvent(new crudPage.CrudDataModifiedEventArgs());
                            this.refreshPage();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.canDel = function (item) {
            return IsHypermediaDeleteableResult(item) && item.canDelete();
        };
        HypermediaCrudService.prototype.getDeletePrompt = function (item) {
            return this.pageInjector.getDeletePrompt(item);
        };
        HypermediaCrudService.prototype.getSearchObject = function (item) {
            return item.data;
        };
        HypermediaCrudService.prototype.getPage = function (query) {
            var _this = this;
            var replacePageUrl = true;
            if (this.pageInjector.usePageQueryForFirstLoad && this.initialLoad) {
                var historyState = this.linkManager.getCurrentState();
                if (historyState) {
                    query = historyState.query;
                    var itemId = this.getEditIdFromPath(historyState.inPagePath);
                    if (itemId !== null) {
                        replacePageUrl = false;
                        var item = this.pageInjector.getById(itemId).then(function (r) {
                            if (r !== null) {
                                _this.linkManager.replaceState(_this.pageInjector.uniqueName, "Edit/" + itemId, null);
                                _this.beginEdit(r, false);
                            }
                        });
                    }
                }
            }
            var loadingPromise = this.getPageAsync(query, !this.initialLoad);
            if (this.initialLoad) {
                this.initialLoad = false;
                loadingPromise = loadingPromise
                    .then(function (r) {
                    if (replacePageUrl) {
                        _this.linkManager.replaceState(_this.pageInjector.uniqueName, null, _this.currentPage.data);
                    }
                    _this.initialPageLoadPromise.resolve(r);
                    return r;
                });
            }
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(loadingPromise));
            return loadingPromise;
        };
        HypermediaCrudService.prototype.getPageAsync = function (query, recordHistory) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.pageInjector.canList()];
                        case 1:
                            if (!_b.sent()) return [3 /*break*/, 3];
                            _a = this;
                            return [4 /*yield*/, this.pageInjector.list(query)];
                        case 2:
                            _a.currentPage = _b.sent();
                            if (recordHistory) {
                                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
                            }
                            return [2 /*return*/, this.currentPage];
                        case 3: throw new Error("No permissions to list, cannot get page.");
                    }
                });
            });
        };
        HypermediaCrudService.prototype.firstPage = function () {
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.firstPageAsync()));
        };
        HypermediaCrudService.prototype.firstPageAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.currentPage) return [3 /*break*/, 4];
                            if (!this.currentPage.canFirst()) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.currentPage.first()];
                        case 1:
                            _a.currentPage = _b.sent();
                            this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
                            return [2 /*return*/, this.currentPage];
                        case 2: throw new Error("Cannot visit the first page, no link found.");
                        case 3: return [3 /*break*/, 5];
                        case 4: throw new Error("Cannot visit the first page until a page has been loaded.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.lastPage = function () {
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.lastPageAsync()));
        };
        HypermediaCrudService.prototype.lastPageAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.currentPage) return [3 /*break*/, 4];
                            if (!this.currentPage.canLast()) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.currentPage.last()];
                        case 1:
                            _a.currentPage = _b.sent();
                            this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
                            return [2 /*return*/, this.currentPage];
                        case 2: throw new Error("Cannot visit the last page, no link found.");
                        case 3: return [3 /*break*/, 5];
                        case 4: throw new Error("Cannot visit the last page until a page has been loaded.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.nextPage = function () {
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.nextPageAsync()));
        };
        HypermediaCrudService.prototype.nextPageAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.currentPage) return [3 /*break*/, 4];
                            if (!this.currentPage.canNext()) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.currentPage.next()];
                        case 1:
                            _a.currentPage = _b.sent();
                            this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
                            return [2 /*return*/, this.currentPage];
                        case 2: throw new Error("Cannot visit the next page, no link found.");
                        case 3: return [3 /*break*/, 5];
                        case 4: throw new Error("Cannot visit the next page until a page has been loaded.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.previousPage = function () {
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.previousPageAsync()));
        };
        HypermediaCrudService.prototype.previousPageAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.currentPage) return [3 /*break*/, 4];
                            if (!this.currentPage.canPrevious()) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.currentPage.previous()];
                        case 1:
                            _a.currentPage = _b.sent();
                            this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
                            return [2 /*return*/, this.currentPage];
                        case 2: throw new Error("Cannot visit the previous page, no link found.");
                        case 3: return [3 /*break*/, 5];
                        case 4: throw new Error("Cannot visit the previous page until a page has been loaded.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.refreshPage = function () {
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.refreshPageAsync()));
        };
        HypermediaCrudService.prototype.refreshPageAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.currentPage) return [3 /*break*/, 4];
                            if (!this.currentPage.canRefresh()) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.currentPage.refresh()];
                        case 1:
                            _a.currentPage = _b.sent();
                            this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
                            return [2 /*return*/, this.currentPage];
                        case 2: throw new Error("Cannot refresh the page, no link found.");
                        case 3: return [3 /*break*/, 5];
                        case 4: throw new Error("Cannot refresh the page until a page has been loaded.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.getItems = function (list) {
            return list.items;
        };
        HypermediaCrudService.prototype.getListingDisplayObject = function (item) {
            return item.data;
        };
        HypermediaCrudService.prototype.getPageNumberState = function (list) {
            return new pageWidget.HypermediaPageState(list);
        };
        HypermediaCrudService.prototype.onPopState = function (args) {
            return __awaiter(this, void 0, void 0, function () {
                var itemId, item, loadingPromise;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            itemId = this.getEditIdFromPath(args.inPagePath);
                            if (!(itemId !== null)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.pageInjector.getById(itemId)];
                        case 1:
                            item = _a.sent();
                            if (item !== null) {
                                this.beginEdit(item, false);
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            loadingPromise = this.getPageAsync(args.query, false);
                            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(loadingPromise));
                            this.allowCloseHistory = false;
                            this.fireCloseItemEditorEvent();
                            this.allowCloseHistory = true;
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get the edit id of the current path, will be null if the current path is not an edit path.
         * @param inPagePath
         */
        HypermediaCrudService.prototype.getEditIdFromPath = function (inPagePath) {
            if (inPagePath) {
                var split = inPagePath.split("/"); //Deep link paths will always start with a /, so add 1 to expected indices
                if (split.length >= 3 && split[1].toLowerCase() === "edit") {
                    return split[2];
                }
            }
            return null;
        };
        return HypermediaCrudService;
    }(crudPage.ICrudService));
    exports.HypermediaCrudService = HypermediaCrudService;
    function addServices(services) {
        services.tryAddShared(crudPage.ICrudService, function (s) {
            return new HypermediaCrudService(s.getRequiredService(HypermediaPageInjector), s.getService(deeplink.IDeepLinkManager));
        });
        crudPage.addServices(services);
    }
    exports.addServices = addServices;
});
define("Client/Libs/ServiceClientInjectors", ["require", "exports", "Client/Libs/IdServerClient", "node_modules/htmlrapier.widgets/src/HypermediaCrudService"], function (require, exports, client, hyperCrud) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ApiResourceInjector = /** @class */ (function (_super) {
        __extends(ApiResourceInjector, _super);
        function ApiResourceInjector(injector) {
            var _this = _super.call(this) || this;
            _this.injector = injector;
            return _this;
        }
        Object.defineProperty(ApiResourceInjector, "InjectorArgs", {
            get: function () {
                return [client.EntryPointsInjector];
            },
            enumerable: true,
            configurable: true
        });
        ApiResourceInjector.prototype.list = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var entry;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.injector.load()];
                        case 1:
                            entry = _a.sent();
                            return [2 /*return*/, entry.listApiResource(query)];
                    }
                });
            });
        };
        ApiResourceInjector.prototype.canList = function () {
            return __awaiter(this, void 0, void 0, function () {
                var entry;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.injector.load()];
                        case 1:
                            entry = _a.sent();
                            return [2 /*return*/, entry.canListApiResource()];
                    }
                });
            });
        };
        ApiResourceInjector.prototype.getDeletePrompt = function (item) {
            return "Are you sure you want to delete the resource " + item.data.displayName + "?";
        };
        return ApiResourceInjector;
    }(hyperCrud.AbstractHypermediaPageInjector));
    exports.ApiResourceInjector = ApiResourceInjector;
    var ClientResourceInjector = /** @class */ (function (_super) {
        __extends(ClientResourceInjector, _super);
        function ClientResourceInjector(injector) {
            var _this = _super.call(this) || this;
            _this.injector = injector;
            return _this;
        }
        Object.defineProperty(ClientResourceInjector, "InjectorArgs", {
            get: function () {
                return [client.EntryPointsInjector];
            },
            enumerable: true,
            configurable: true
        });
        ClientResourceInjector.prototype.list = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var entry;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.injector.load()];
                        case 1:
                            entry = _a.sent();
                            return [2 /*return*/, entry.listClients(query)];
                    }
                });
            });
        };
        ClientResourceInjector.prototype.canList = function () {
            return __awaiter(this, void 0, void 0, function () {
                var entry;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.injector.load()];
                        case 1:
                            entry = _a.sent();
                            return [2 /*return*/, entry.canListClients()];
                    }
                });
            });
        };
        ClientResourceInjector.prototype.getDeletePrompt = function (item) {
            return "Are you sure you want to delete the client " + item.data.name + "?";
        };
        return ClientResourceInjector;
    }(hyperCrud.AbstractHypermediaPageInjector));
    exports.ClientResourceInjector = ClientResourceInjector;
});
define("node_modules/htmlrapier.widgets/src/StandardCrudPage", ["require", "exports", "node_modules/htmlrapier.widgets/src/HypermediaCrudService"], function (require, exports, hyperCrudPage) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Settings = /** @class */ (function () {
        function Settings() {
            this.searchName = "search";
            this.pageNumbersName = "pageNumbers";
            this.mainTableName = "mainTable";
            this.entryEditorName = "entryEditor";
            this.addItemEditorName = "addEntryEditor";
        }
        return Settings;
    }());
    exports.Settings = Settings;
    /**
     * This function will setup services for a crud page. This makes it easy to get a crud page working
     * without needing a lot of extra code per instance. If you need to do something other than what this
     * standard can provide, do it yourself.
     * @param injector
     */
    function addServices(builder, injector) {
        hyperCrudPage.addServices(builder.Services);
        builder.Services.tryAddShared(hyperCrudPage.HypermediaPageInjector, injector);
    }
    exports.addServices = addServices;
    /**
     * Create the controllers for the crud page.
     */
    function createControllers(builder, settings) {
        builder.create(settings.searchName, hyperCrudPage.CrudSearch);
        builder.create(settings.pageNumbersName, hyperCrudPage.CrudPageNumbers);
        builder.create(settings.mainTableName, hyperCrudPage.CrudTableController);
        //Its possible that the add item editor name is null, which means we shouldn't try to create it.
        if (settings.addItemEditorName === null) {
            builder.create(settings.entryEditorName, hyperCrudPage.CrudItemEditorController);
        }
        else {
            //Try to create the add item editor
            var addEditor = builder.createId(hyperCrudPage.CrudItemEditorType.Add, settings.addItemEditorName, hyperCrudPage.CrudItemEditorController);
            if (addEditor.length === 0) {
                //If we were unable to create an add item editor share the editor instead
                builder.create(settings.entryEditorName, hyperCrudPage.CrudItemEditorController);
            }
            else {
                //If we were able to create the add item editor, create a separate update editor
                builder.createId(hyperCrudPage.CrudItemEditorType.Update, settings.entryEditorName, hyperCrudPage.CrudItemEditorController);
            }
        }
    }
    exports.createControllers = createControllers;
});
define("node_modules/htmlrapier.widgets/src/prompt", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var IPrompt = /** @class */ (function () {
        function IPrompt() {
        }
        return IPrompt;
    }());
    exports.IPrompt = IPrompt;
    var PromptResult = /** @class */ (function () {
        function PromptResult(accepted, data) {
            this.accepted = accepted;
            this.data = data;
        }
        PromptResult.prototype.isAccepted = function () {
            return this.accepted;
        };
        PromptResult.prototype.getData = function () {
            return this.data;
        };
        return PromptResult;
    }());
    exports.PromptResult = PromptResult;
    /**
     * A simple prompt that uses the browser prompt function, this wraps that function in a promise
     * so it matches the other prompt interfaces.
     */
    var BrowserPrompt = /** @class */ (function () {
        function BrowserPrompt() {
        }
        BrowserPrompt.prototype.prompt = function (message, defaultText) {
            return new Promise(function (resovle, reject) {
                var data = window.prompt(message, defaultText);
                var result = new PromptResult(data !== null, data);
                resovle(result);
            });
        };
        return BrowserPrompt;
    }());
    exports.BrowserPrompt = BrowserPrompt;
});
///<amd-module name="hr.windowfetch"/>
define("hr.windowfetch", ["require", "exports", "hr.fetcher"], function (require, exports, hr_fetcher_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A fetcher implementation that calls the global window fetch function.
     * Use this to terminate fetcher chains and do the real fetch work.
     * @returns
     */
    var WindowFetch = /** @class */ (function (_super) {
        __extends(WindowFetch, _super);
        function WindowFetch() {
            return _super.call(this) || this;
        }
        WindowFetch.prototype.fetch = function (url, init) {
            return hr_fetcher_2.fetch(url, init);
        };
        return WindowFetch;
    }(hr_fetcher_2.Fetcher));
    exports.WindowFetch = WindowFetch;
});
///<amd-module name="hr.http"/>
define("hr.http", ["require", "exports", "hr.windowfetch"], function (require, exports, hr_windowfetch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var defaultFetcher = new hr_windowfetch_1.WindowFetch();
    /**
     * A simple function to get data from a url without caching. This still
     * uses fetch, but is available since this is a a pretty common operation.
     * If you need something more advanced use fetch directly.
     * @param {string} url - The url to get from
     * @returns
     */
    function get(url, fetcher) {
        if (fetcher === undefined) {
            fetcher = defaultFetcher;
        }
        return fetcher.fetch(url, {
            method: "GET",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            },
            credentials: "include"
        }).then(function (response) {
            return processResult(response);
        });
    }
    exports.get = get;
    /**
     * A simple function to post to a url. This still uses fetch, but
     * simplifies its usage. If you need something more advanced use
     * fetch directly.
     */
    function post(url, data, fetcher) {
        if (fetcher === undefined) {
            fetcher = defaultFetcher;
        }
        var body = undefined;
        if (data !== undefined) {
            body = JSON.stringify(data);
        }
        return fetcher.fetch(url, {
            method: "POST",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            },
            body: body,
            credentials: "include"
        }).then(function (response) {
            return processResult(response);
        });
    }
    exports.post = post;
    function processResult(response) {
        return response.text().then(function (data) {
            var resultData = data === "" ? null : JSON.parse(data);
            if (response.status > 199 && response.status < 300) {
                return resultData;
            }
            throw resultData;
        });
    }
});
define("node_modules/htmlrapier/src/whitelist", ["require", "exports", "hr.uri"], function (require, exports, uri) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function requestIsRequestObject(test) {
        return test.url !== undefined;
    }
    var Whitelist = /** @class */ (function () {
        function Whitelist(whitelist) {
            this.whitelist = [];
            if (whitelist) {
                for (var i = 0; i < whitelist.length; ++i) {
                    this.add(whitelist[i]);
                }
            }
        }
        Whitelist.prototype.add = function (url) {
            this.whitelist.push(new uri.Uri(this.transformInput(url)));
        };
        Whitelist.prototype.isWhitelisted = function (url) {
            var testUri;
            if (requestIsRequestObject(url)) {
                testUri = new uri.Uri(this.transformInput(url.url));
            }
            else {
                testUri = new uri.Uri(this.transformInput(url));
            }
            for (var i = 0; i < this.whitelist.length; ++i) {
                var item = this.whitelist[i];
                //Check to see if the urls match here, check that authorities match and
                //that the path for the item starts with the whitelisted path.
                if ((item.protocol === 'HTTPS' || item.protocol === '') //Accept https or empty protocol only 
                    && item.authority == testUri.authority
                    && testUri.path.startsWith(item.path)) {
                    return true;
                }
            }
            return false;
        };
        Whitelist.prototype.transformInput = function (url) {
            return url.toLocaleUpperCase();
        };
        return Whitelist;
    }());
    exports.Whitelist = Whitelist;
});
///<amd-module name="hr.accesstokens"/>
define("hr.accesstokens", ["require", "exports", "hr.http", "hr.fetcher", "hr.eventdispatcher", "hr.externalpromise"], function (require, exports, http, hr_fetcher_3, events, ep) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //From https://github.com/auth0/jwt-decode/blob/master/lib/base64_url_decode.js
    function b64DecodeUnicode(str) {
        return decodeURIComponent(atob(str).replace(/(.)/g, function (m, p) {
            var code = p.charCodeAt(0).toString(16).toUpperCase();
            if (code.length < 2) {
                code = '0' + code;
            }
            return '%' + code;
        }));
    }
    function base64_url_decode(str) {
        var output = str.replace(/-/g, "+").replace(/_/g, "/");
        switch (output.length % 4) {
            case 0:
                break;
            case 2:
                output += "==";
                break;
            case 3:
                output += "=";
                break;
            default:
                throw "Illegal base64url string!";
        }
        try {
            return b64DecodeUnicode(output);
        }
        catch (err) {
            return atob(output);
        }
    }
    ;
    //From https://github.com/auth0/jwt-decode/blob/master/lib/index.js
    function parseJwt(token, options) {
        if (typeof token !== 'string') {
            throw new Error('Invalid token specified');
        }
        options = options || {};
        var pos = options.header === true ? 0 : 1;
        return JSON.parse(base64_url_decode(token.split('.')[pos]));
    }
    ;
    var TokenManager = /** @class */ (function () {
        function TokenManager(tokenPath, fetcher) {
            this.tokenPath = tokenPath;
            this.fetcher = fetcher;
            this.needLoginEvent = new events.PromiseEventDispatcher();
            this.queuePromise = null;
        }
        TokenManager.prototype.getToken = function () {
            //First check if we should queue the request
            if (this.queuePromise !== null) {
                return this.queuePromise.Promise;
            }
            //Do we need to refresh?
            if (this.startTime === undefined || Date.now() / 1000 - this.startTime > this.expirationTick) {
                //If we need to refresh, create the queue and fire the refresh
                this.queuePromise = new ep.ExternalPromise();
                this.doRefreshToken(); //Do NOT await this, we want execution to continue.
                return this.queuePromise.Promise; //Here we return the queued promise that will resolve when doRefreshToken is done.
            }
            //Didn't need refresh, return current token.
            return Promise.resolve(this.currentToken);
        };
        TokenManager.prototype.doRefreshToken = function () {
            return __awaiter(this, void 0, void 0, function () {
                var err_9;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 8]);
                            return [4 /*yield*/, this.readServerToken()];
                        case 1:
                            _a.sent();
                            this.resolveQueue();
                            return [3 /*break*/, 8];
                        case 2:
                            err_9 = _a.sent();
                            if (!(this.currentToken === undefined)) return [3 /*break*/, 3];
                            this.resolveQueue();
                            return [3 /*break*/, 7];
                        case 3: return [4 /*yield*/, this.fireNeedLogin()];
                        case 4:
                            if (!_a.sent()) return [3 /*break*/, 6];
                            //After login read the server token again and resolve the queue
                            return [4 /*yield*/, this.readServerToken()];
                        case 5:
                            //After login read the server token again and resolve the queue
                            _a.sent();
                            this.resolveQueue();
                            return [3 /*break*/, 7];
                        case 6:
                            this.startTime = undefined;
                            this.rejectQueue("Could not refresh access token or log back in.");
                            _a.label = 7;
                        case 7: return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        TokenManager.prototype.readServerToken = function () {
            return __awaiter(this, void 0, void 0, function () {
                var data, tokenObj;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, http.post(this.tokenPath, undefined, this.fetcher)];
                        case 1:
                            data = _a.sent();
                            this.currentToken = data.accessToken;
                            this._headerName = data.headerName;
                            tokenObj = parseJwt(this.currentToken);
                            if (this.currentSub !== undefined) {
                                if (this.currentSub !== tokenObj.sub) {
                                    //Subjects do not match, clear tokens
                                    this.clearToken();
                                    throw new Error("Sub did not match on new token, likely a different user. Aborting refresh.");
                                }
                            }
                            else {
                                this.currentSub = tokenObj.sub;
                            }
                            this.startTime = tokenObj.nbf;
                            this.expirationTick = (tokenObj.exp - this.startTime) / 2; //After half the token time has expired we will turn it in for another one.
                            return [2 /*return*/];
                    }
                });
            });
        };
        TokenManager.prototype.clearToken = function () {
            this.currentToken = undefined;
            this.startTime = undefined;
            this.currentSub = undefined;
        };
        Object.defineProperty(TokenManager.prototype, "onNeedLogin", {
            /**
             * Get an event listener for the given status code. Since this fires as part of the
             * fetch request the events can return promises to delay sending the event again
             * until the promise resolves.
             * @param status The status code for the event.
             */
            get: function () {
                return this.needLoginEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TokenManager.prototype, "headerName", {
            get: function () {
                return this._headerName;
            },
            enumerable: true,
            configurable: true
        });
        TokenManager.prototype.fireNeedLogin = function () {
            return __awaiter(this, void 0, void 0, function () {
                var retryResults, i;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.needLoginEvent.fire(this)];
                        case 1:
                            retryResults = _a.sent();
                            if (retryResults) {
                                //Take first result that is actually defined
                                for (i = 0; i < retryResults.length; ++i) {
                                    if (retryResults[i]) {
                                        return [2 /*return*/, retryResults[i]];
                                    }
                                }
                            }
                            return [2 /*return*/, false];
                    }
                });
            });
        };
        TokenManager.prototype.resolveQueue = function () {
            var promise = this.queuePromise;
            this.queuePromise = null;
            promise.resolve(this.currentToken);
        };
        TokenManager.prototype.rejectQueue = function (err) {
            var promise = this.queuePromise;
            this.queuePromise = null;
            promise.reject(this.currentToken);
        };
        return TokenManager;
    }());
    var AccessTokenFetcher = /** @class */ (function (_super) {
        __extends(AccessTokenFetcher, _super);
        function AccessTokenFetcher(tokenPath, accessWhitelist, next) {
            var _this = _super.call(this) || this;
            _this.needLoginEvent = new events.PromiseEventDispatcher();
            _this._alwaysRefreshToken = false;
            _this.tokenManager = new TokenManager(tokenPath, next);
            _this.tokenManager.onNeedLogin.add(function (t) { return _this.fireNeedLogin(); });
            _this.next = next;
            _this.accessWhitelist = accessWhitelist;
            return _this;
        }
        AccessTokenFetcher.isInstance = function (t) {
            return t.onNeedLogin !== undefined
                && t.fetch !== undefined;
        };
        AccessTokenFetcher.prototype.fetch = function (url, init) {
            return __awaiter(this, void 0, void 0, function () {
                var whitelisted, token, headerName;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            whitelisted = this.accessWhitelist.isWhitelisted(url);
                            if (!(whitelisted || this._alwaysRefreshToken)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.tokenManager.getToken()];
                        case 1:
                            token = _a.sent();
                            headerName = this.tokenManager.headerName;
                            if (whitelisted && headerName && token) {
                                init.headers[headerName] = token;
                            }
                            _a.label = 2;
                        case 2: return [2 /*return*/, this.next.fetch(url, init)];
                    }
                });
            });
        };
        Object.defineProperty(AccessTokenFetcher.prototype, "onNeedLogin", {
            /**
             * This event will fire if the token manager tried to get an access token and failed. You can try
             * to log the user back in at this point.
             */
            get: function () {
                return this.needLoginEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AccessTokenFetcher.prototype, "alwaysRefreshToken", {
            get: function () {
                return this._alwaysRefreshToken;
            },
            set: function (value) {
                this._alwaysRefreshToken = value;
            },
            enumerable: true,
            configurable: true
        });
        AccessTokenFetcher.prototype.fireNeedLogin = function () {
            return __awaiter(this, void 0, void 0, function () {
                var retryResults, i;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.needLoginEvent.fire(this)];
                        case 1:
                            retryResults = _a.sent();
                            if (retryResults) {
                                for (i = 0; i < retryResults.length; ++i) {
                                    if (retryResults[i]) {
                                        return [2 /*return*/, retryResults[i]];
                                    }
                                }
                            }
                            return [2 /*return*/, false];
                    }
                });
            });
        };
        return AccessTokenFetcher;
    }(hr_fetcher_3.Fetcher));
    exports.AccessTokenFetcher = AccessTokenFetcher;
});
define("node_modules/htmlrapier.bootstrap/src/modal", ["require", "exports", "hr.toggles"], function (require, exports, toggles) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //Scrollbar fix, keeps scrollbars at correct length with multiple modals
    //Since this is on the document, only needed once, so register here
    //Works in bootstrap 3.3.7.
    //Thanks to A1rPun at https://stackoverflow.com/questions/19305821/multiple-modals-overlay
    $(document).on('hidden.bs.modal', '.modal', function () {
        $('.modal:visible').length && $(document.body).addClass('modal-open');
    });
    //Toggle Plugin
    var ModalStates = /** @class */ (function (_super) {
        __extends(ModalStates, _super);
        function ModalStates(element, next) {
            var _this = _super.call(this, next) || this;
            _this.modal = $(element);
            var theModal = _this.modal.modal({
                show: false
            });
            var thisShim = _this;
            _this.modal.on('show.bs.modal', function (e) {
                _this.fireStateChange('on');
            });
            _this.modal.on('hide.bs.modal', function (e) {
                _this.fireStateChange('off');
            });
            _this.addState('on', 'on');
            _this.addState('off', 'off');
            return _this;
        }
        ModalStates.prototype.activateState = function (state) {
            switch (state) {
                case 'on':
                    this.modal.modal('show');
                    break;
                case 'off':
                    this.modal.modal('hide');
                    break;
            }
            return false;
        };
        return ModalStates;
    }(toggles.ToggleStates));
    /**
     * Activate all modal htmlrapier plugin.
     */
    function activate() {
        toggles.addTogglePlugin(function (element, states, toggle) {
            if (element.classList.contains('modal')) {
                toggle = new ModalStates(element, toggle);
            }
            return toggle;
        });
    }
    exports.activate = activate;
});
define("node_modules/htmlrapier.bootstrap/src/dropdown", ["require", "exports", "hr.toggles"], function (require, exports, toggles) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //Toggle Plugin
    var DropdownStates = /** @class */ (function (_super) {
        __extends(DropdownStates, _super);
        function DropdownStates(element, next) {
            var _this = _super.call(this, next) || this;
            _this.drop = $(element).dropdown();
            return _this;
        }
        DropdownStates.prototype.activateState = function (state) {
            //States not supported, handled by bootstrap
            return false; //Never fire any events for this toggle
        };
        return DropdownStates;
    }(toggles.ToggleStates));
    /**
     * Activate the dropdown htmlrapier plugin.
     */
    function activate() {
        toggles.addTogglePlugin(function (element, states, toggle) {
            if (element.classList.contains('dropdown-toggle')) {
                toggle = new DropdownStates(element, toggle);
            }
            return toggle;
        });
    }
    exports.activate = activate;
});
define("node_modules/htmlrapier.bootstrap/src/tab", ["require", "exports", "hr.toggles"], function (require, exports, toggles) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //Toggle Plugin
    var TabStates = /** @class */ (function (_super) {
        __extends(TabStates, _super);
        function TabStates(element, next) {
            var _this = _super.call(this, next) || this;
            _this.tab = $(element);
            _this.tab.on('shown.bs.tab', function (e) {
                _this.fireStateChange('on');
            });
            _this.tab.on('hide.bs.tab', function (e) {
                _this.fireStateChange('off');
            });
            _this.addState('on', 'on');
            _this.addState('off', 'off');
            return _this;
        }
        TabStates.prototype.activateState = function (state) {
            switch (state) {
                case 'on':
                    this.tab.tab('show');
                    break;
                case 'off':
                    //Can't turn off tabs, does nothing
                    break;
            }
            return false;
        };
        return TabStates;
    }(toggles.ToggleStates));
    /**
     * Activate all modal htmlrapier plugin.
     */
    function activate() {
        toggles.addTogglePlugin(function (element, states, toggle) {
            if (element.getAttribute("data-toggle") === 'tab') {
                toggle = new TabStates(element, toggle);
            }
            return toggle;
        });
    }
    exports.activate = activate;
});
define("node_modules/htmlrapier.bootstrap/src/all", ["require", "exports", "node_modules/htmlrapier.bootstrap/src/modal", "node_modules/htmlrapier.bootstrap/src/dropdown", "node_modules/htmlrapier.bootstrap/src/tab"], function (require, exports, modal, dropdown, tab) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var needsActivation = true;
    /**
     * Activate all bootstrap plugins.
     */
    function activate() {
        if (needsActivation) {
            needsActivation = false;
            modal.activate();
            dropdown.activate();
            tab.activate();
        }
    }
    exports.activate = activate;
});
define("node_modules/htmlrapier.roleclient/src/RoleClient", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Make sure the passed in object is a correct RoleAssignmentsResult, this will return true on success and throw
     * an error on failure.
     * @param t
     */
    function IsRoleAssignmentsResult(t) {
        var errors = "";
        if (t.refresh === undefined) {
            errors += "refresh(): Promise<RoleAssignmentsResult>.\n";
        }
        if (t.canRefresh === undefined) {
            errors += "canRefresh(): boolean.\n";
        }
        if (t.setUser === undefined) {
            errors += "setUser(data: RoleAssignments): Promise<RoleAssignmentsResult>.\n";
        }
        if (t.canSetUser === undefined) {
            errors += "canSetUser(): boolean.\n";
        }
        if (t.getSetUserDocs === undefined) {
            errors += "getSetUserDocs(): Promise<hal.HalEndpointDoc>.\n";
        }
        if (t.hasSetUserDocs === undefined) {
            errors += "hasSetUserDocs(): boolean.\n";
        }
        if (t.deleteUser === undefined) {
            errors += "deleteUser().\n";
        }
        if (t.canDeleteUser === undefined) {
            errors += "canDeleteUser(): boolean.\n";
        }
        if (errors !== "") {
            errors = "Cannot accept RoleAssignmentResult. The following functions are missing:\n" + errors;
            throw new Error(errors);
        }
        return true;
    }
    exports.IsRoleAssignmentsResult = IsRoleAssignmentsResult;
    var IRoleEntryInjector = /** @class */ (function () {
        function IRoleEntryInjector() {
        }
        return IRoleEntryInjector;
    }());
    exports.IRoleEntryInjector = IRoleEntryInjector;
    /**
     * Make sure the passed in object is a correct EntryPointResult, this will return true on success and throw
     * an error on failure.
     * @param t
     */
    function IsEntryPointResult(t) {
        var errors = "";
        if (t.getUser === undefined) {
            errors += "getUser(query: RolesQuery): Promise<RoleAssignmentsResult>.\n";
        }
        if (t.canGetUser === undefined) {
            errors += "canGetUser(): boolean.\n";
        }
        if (t.listUsers === undefined) {
            errors += "listUsers(query: PagedCollectionQuery): Promise<UserCollectionResult>\n";
        }
        if (t.canListUsers === undefined) {
            errors += "canListUsers(): boolean;";
        }
        if (t.setUser === undefined) {
            errors += "setUser(data: RoleAssignments): Promise<RoleAssignmentsResult>\n";
        }
        if (t.canSetUser === undefined) {
            errors += "canSetUser(): boolean\n";
        }
        if (t.getSetUserDocs === undefined) {
            errors += "getSetUserDocs(): Promise<hal.HalEndpointDoc>\n";
        }
        if (t.hasSetUserDocs === undefined) {
            errors += "hasSetUserDocs(): boolean\n";
        }
        if (errors !== "") {
            errors = "Cannot accept RoleAssignmentResult. The following functions are missing:\n" + errors;
            throw new Error(errors);
        }
        return true;
    }
    exports.IsEntryPointResult = IsEntryPointResult;
});
define("node_modules/htmlrapier.roleclient/src/UserDirectoryClient", ["require", "exports", "node_modules/htmlrapier.halcyon/src/EndpointClient"], function (require, exports, hal) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var EntryPointInjector = /** @class */ (function () {
        function EntryPointInjector(url, fetcher) {
            this.url = url;
            this.fetcher = fetcher;
        }
        EntryPointInjector.prototype.load = function () {
            if (!this.instance) {
                this.instance = EntryPointResult.Load(this.url, this.fetcher);
            }
            return this.instance;
        };
        return EntryPointInjector;
    }());
    exports.EntryPointInjector = EntryPointInjector;
    var EntryPointResult = /** @class */ (function () {
        function EntryPointResult(client) {
            this.client = client;
        }
        EntryPointResult.Load = function (url, fetcher) {
            return hal.HalEndpointClient.Load({
                href: url,
                method: "GET"
            }, fetcher)
                .then(function (c) {
                return new EntryPointResult(c);
            });
        };
        Object.defineProperty(EntryPointResult.prototype, "data", {
            get: function () {
                return this.client.GetData();
            },
            enumerable: true,
            configurable: true
        });
        EntryPointResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new EntryPointResult(r);
            });
        };
        EntryPointResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        EntryPointResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        EntryPointResult.prototype.searchUsers = function (query) {
            return this.client.LoadLinkWithQuery("SearchUsers", query)
                .then(function (r) {
                return new PersonCollectionResult(r);
            });
        };
        EntryPointResult.prototype.canSearchUsers = function () {
            return this.client.HasLink("SearchUsers");
        };
        EntryPointResult.prototype.getSearchUsersDocs = function () {
            return this.client.LoadLinkDoc("SearchUsers")
                .then(function (r) {
                return r.GetData();
            });
        };
        EntryPointResult.prototype.hasSearchUsersDocs = function () {
            return this.client.HasLinkDoc("SearchUsers");
        };
        return EntryPointResult;
    }());
    exports.EntryPointResult = EntryPointResult;
    var PersonResult = /** @class */ (function () {
        function PersonResult(client) {
            this.client = client;
        }
        Object.defineProperty(PersonResult.prototype, "data", {
            get: function () {
                return this.client.GetData();
            },
            enumerable: true,
            configurable: true
        });
        PersonResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new PersonResult(r);
            });
        };
        PersonResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        PersonResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        PersonResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        return PersonResult;
    }());
    exports.PersonResult = PersonResult;
    var PersonCollectionResult = /** @class */ (function () {
        function PersonCollectionResult(client) {
            this.client = client;
        }
        Object.defineProperty(PersonCollectionResult.prototype, "data", {
            get: function () {
                return this.client.GetData();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PersonCollectionResult.prototype, "items", {
            get: function () {
                var embeds = this.client.GetEmbed("values");
                var clients = embeds.GetAllClients();
                var result = [];
                for (var i = 0; i < clients.length; ++i) {
                    result.push(new PersonResult(clients[i]));
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        PersonCollectionResult.prototype.refresh = function () {
            return this.client.LoadLink("self")
                .then(function (r) {
                return new PersonCollectionResult(r);
            });
        };
        PersonCollectionResult.prototype.canRefresh = function () {
            return this.client.HasLink("self");
        };
        PersonCollectionResult.prototype.getRefreshDocs = function () {
            return this.client.LoadLinkDoc("self")
                .then(function (r) {
                return r.GetData();
            });
        };
        PersonCollectionResult.prototype.hasRefreshDocs = function () {
            return this.client.HasLinkDoc("self");
        };
        return PersonCollectionResult;
    }());
    exports.PersonCollectionResult = PersonCollectionResult;
});
define("node_modules/htmlrapier.relogin/src/LoginPopup", ["require", "exports", "hr.controller", "hr.fetcher", "hr.externalpromise", "hr.accesstokens"], function (require, exports, controller, hr_fetcher_4, ep, hr_accesstokens_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LoginPopupOptions = /** @class */ (function () {
        function LoginPopupOptions(relogPage) {
            this._relogPage = relogPage;
        }
        Object.defineProperty(LoginPopupOptions.prototype, "relogPage", {
            get: function () {
                return this._relogPage;
            },
            enumerable: true,
            configurable: true
        });
        return LoginPopupOptions;
    }());
    exports.LoginPopupOptions = LoginPopupOptions;
    var LoginPopup = /** @class */ (function () {
        function LoginPopup(bindings, options, fetcher) {
            var _this = this;
            this.options = options;
            this.dialog = bindings.getToggle("dialog");
            this.dialog.offEvent.add(function (t) {
                _this.closed();
            });
            this.loginFrame = bindings.getHandle("loginFrame");
            if (hr_accesstokens_1.AccessTokenFetcher.isInstance(fetcher)) {
                fetcher.onNeedLogin.add(function (f) { return _this.open(f); });
                window.addEventListener("message", function (e) {
                    _this.handleMessage(e);
                });
            }
            this.resizeEvent = function (e) {
                _this.setIframeHeight();
            };
        }
        Object.defineProperty(LoginPopup, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection, LoginPopupOptions, hr_fetcher_4.Fetcher];
            },
            enumerable: true,
            configurable: true
        });
        LoginPopup.prototype.open = function (accessTokenManager) {
            this.dialog.on();
            this.currentPromise = new ep.ExternalPromise();
            this.setIframeHeight();
            this.loginFrame.src = this.options.relogPage;
            window.addEventListener("resize", this.resizeEvent);
            return this.currentPromise.Promise;
        };
        LoginPopup.prototype.handleMessage = function (e) {
            var message = JSON.parse(e.data);
            if (message.type === exports.MessageType && message.success) {
                this.dialog.off();
            }
        };
        LoginPopup.prototype.setIframeHeight = function () {
            this.loginFrame.style.height = (window.innerHeight - 240) + "px";
        };
        LoginPopup.prototype.closed = function () {
            return __awaiter(this, void 0, void 0, function () {
                var promise;
                return __generator(this, function (_a) {
                    if (this.currentPromise) {
                        promise = this.currentPromise;
                        this.currentPromise = null;
                        //Reset iframe contents
                        this.loginFrame.contentWindow.document.open();
                        this.loginFrame.contentWindow.document.close();
                        window.removeEventListener("resize", this.resizeEvent);
                        promise.resolve(true); //Try to determine true or false, true to try again, false to error
                    }
                    return [2 /*return*/];
                });
            });
        };
        return LoginPopup;
    }());
    exports.LoginPopup = LoginPopup;
    exports.MessageType = "LoginPageMessage";
    function addServices(services) {
        services.tryAddShared(LoginPopupOptions, function (s) { return new LoginPopupOptions("/Account/Relogin"); });
        services.tryAddShared(LoginPopup, LoginPopup);
    }
    exports.addServices = addServices;
});
///<amd-module name="hr.storage"/>
define("hr.storage", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CookieStorageDriver = /** @class */ (function () {
        function CookieStorageDriver(name, days, path) {
            this.name = name;
            this.path = '/';
            this.days = undefined;
            if (days !== undefined && days !== null) {
                this.days = days;
            }
            if (path !== undefined) {
                this.path = path;
            }
        }
        CookieStorageDriver.prototype.getValue = function () {
            return CookieStorageDriver.readRaw(this.name);
        };
        CookieStorageDriver.prototype.setValue = function (val) {
            CookieStorageDriver.createRaw(this.name, val, this.path, this.days);
        };
        //These three functions (createRaw, readRaw and erase) are from
        //http://www.quirksmode.org/js/cookies.html
        //The names were changed
        /**
         * Create a cookie on the doucment.
         * @param {type} name - The name of the cookie
         * @param {type} value - The value of the cookie
         * @param {type} days - The expiration in days for the cookie
         */
        CookieStorageDriver.createRaw = function (name, value, path, days) {
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                var expires = "; expires=" + date.toUTCString();
            }
            else
                var expires = "";
            document.cookie = name + "=" + value + expires + "; path=" + path;
        };
        /**
         * Read a cookie from the document.
         * @param {type} name - The name of the cookie to read
         * @returns {type} - The cookie value.
         */
        CookieStorageDriver.readRaw = function (name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ')
                    c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0)
                    return c.substring(nameEQ.length, c.length);
            }
            return null;
        };
        /**
         * Erase a cookie from the document.
         * @param {type} name
         */
        CookieStorageDriver.prototype.erase = function () {
            CookieStorageDriver.createRaw(this.name, "", this.path, -1);
        };
        return CookieStorageDriver;
    }());
    exports.CookieStorageDriver = CookieStorageDriver;
    var SessionStorageDriver = /** @class */ (function () {
        function SessionStorageDriver(name) {
            this.name = name;
        }
        /**
         * Get the value stored by the driver, will be null if there is no value
         */
        SessionStorageDriver.prototype.getValue = function () {
            return sessionStorage.getItem(this.name);
        };
        /**
         * Set the value stored by the driver.
         */
        SessionStorageDriver.prototype.setValue = function (val) {
            sessionStorage.setItem(this.name, val);
        };
        /**
         * Erase the value stored by the driver.
         */
        SessionStorageDriver.prototype.erase = function () {
            this.setValue(null);
        };
        return SessionStorageDriver;
    }());
    exports.SessionStorageDriver = SessionStorageDriver;
    var JsonStorage = /** @class */ (function () {
        function JsonStorage(storageDriver) {
            this.storageDriver = storageDriver;
        }
        JsonStorage.prototype.setSerializerOptions = function (replacer, space) {
            this.replacer = replacer;
            this.space = space;
        };
        JsonStorage.prototype.getValue = function (defaultValue) {
            var str = this.storageDriver.getValue();
            var recovered;
            if (str !== null) {
                recovered = JSON.parse(str);
            }
            else {
                recovered = defaultValue;
            }
            return recovered;
        };
        JsonStorage.prototype.setValue = function (val) {
            this.storageDriver.setValue(JSON.stringify(val, this.replacer, this.space));
        };
        JsonStorage.prototype.erase = function () {
            this.storageDriver.erase();
        };
        return JsonStorage;
    }());
    exports.JsonStorage = JsonStorage;
    var StringStorage = /** @class */ (function () {
        function StringStorage(storageDriver) {
            this.storageDriver = storageDriver;
        }
        StringStorage.prototype.getValue = function (defaultValue) {
            return this.storageDriver.getValue();
        };
        StringStorage.prototype.setValue = function (val) {
            this.storageDriver.setValue(val);
        };
        StringStorage.prototype.erase = function () {
            this.storageDriver.erase();
        };
        return StringStorage;
    }());
    exports.StringStorage = StringStorage;
});
///<amd-module name="hr.xsrftoken"/>
define("hr.xsrftoken", ["require", "exports", "hr.fetcher", "hr.storage"], function (require, exports, hr_fetcher_5, hr_storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CookieTokenAccessor = /** @class */ (function () {
        function CookieTokenAccessor(cookieName) {
            this.cookieName = cookieName;
            if (this.cookieName === undefined) {
                this.cookieName = "XSRF-TOKEN";
            }
        }
        Object.defineProperty(CookieTokenAccessor.prototype, "token", {
            get: function () {
                return hr_storage_1.CookieStorageDriver.readRaw(this.cookieName);
            },
            enumerable: true,
            configurable: true
        });
        return CookieTokenAccessor;
    }());
    exports.CookieTokenAccessor = CookieTokenAccessor;
    /**
     * A fetcher implementation that calls the global window fetch function.
     * Use this to terminate fetcher chains and do the real fetch work.
     * @returns
     */
    var XsrfTokenFetcher = /** @class */ (function (_super) {
        __extends(XsrfTokenFetcher, _super);
        function XsrfTokenFetcher(tokenAccessor, accessWhitelist, next, options) {
            var _this = _super.call(this) || this;
            _this.tokenAccessor = tokenAccessor;
            _this.accessWhitelist = accessWhitelist;
            _this.next = next;
            _this.options = options;
            if (_this.options === undefined) {
                _this.options = {
                    headerName: "RequestVerificationToken",
                };
            }
            return _this;
        }
        XsrfTokenFetcher.prototype.fetch = function (url, init) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (this.accessWhitelist.isWhitelisted(url)) {
                        init.headers[this.options.headerName] = this.tokenAccessor.token;
                    }
                    return [2 /*return*/, this.next.fetch(url, init)];
                });
            });
        };
        return XsrfTokenFetcher;
    }(hr_fetcher_5.Fetcher));
    exports.XsrfTokenFetcher = XsrfTokenFetcher;
});
///<amd-module name="hr.pageconfig"/>
define("hr.pageconfig", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Read the config off the page. You can optionally pass existing config. This function returns the configuration object after it is read.
     * @param config An existing config value to further fill out.
     */
    function read(config) {
        if (config === undefined) {
            config = {};
        }
        return window.hr_config ? window.hr_config(config) : config;
    }
    exports.read = read;
});
define("Client/Libs/startup", ["require", "exports", "hr.controller", "hr.windowfetch", "hr.accesstokens", "node_modules/htmlrapier/src/whitelist", "hr.fetcher", "node_modules/htmlrapier.bootstrap/src/all", "Client/Libs/IdServerClient", "node_modules/htmlrapier.roleclient/src/RoleClient", "node_modules/htmlrapier.roleclient/src/UserDirectoryClient", "node_modules/htmlrapier.relogin/src/LoginPopup", "hr.deeplink", "hr.xsrftoken", "hr.pageconfig"], function (require, exports, controller, WindowFetch, AccessTokens, whitelist, fetcher, bootstrap, client, roleClient, hr_roleclient_UserDirectoryClient_1, loginPopup, deepLink, xsrf, pageConfig) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var builder = null;
    function createBuilder() {
        if (builder === null) {
            builder = new controller.InjectedControllerBuilder();
            //Keep this bootstrap activator line, it will ensure that bootstrap is loaded and configured before continuing.
            bootstrap.activate();
            //Set up the access token fetcher
            var config = pageConfig.read();
            builder.Services.tryAddShared(fetcher.Fetcher, function (s) { return createFetcher(config); });
            builder.Services.tryAddShared(client.EntryPointsInjector, function (s) { return new client.EntryPointsInjector(config.client.IdentityServerHost + "/EntryPoint", s.getRequiredService(fetcher.Fetcher)); });
            //Map the role entry point to the service entry point and add the user directory
            builder.Services.addShared(roleClient.IRoleEntryInjector, function (s) { return s.getRequiredService(client.EntryPointsInjector); });
            builder.Services.addShared(hr_roleclient_UserDirectoryClient_1.EntryPointInjector, function (s) { return new hr_roleclient_UserDirectoryClient_1.EntryPointInjector(config.client.UserDirectoryHost, s.getRequiredService(fetcher.Fetcher)); });
            //Setup Deep Links
            deepLink.setPageUrl(builder.Services, config.client.PageBasePath);
            //Setup relogin
            loginPopup.addServices(builder.Services);
            builder.create("hr-relogin", loginPopup.LoginPopup);
        }
        return builder;
    }
    exports.createBuilder = createBuilder;
    function createFetcher(config) {
        var fetcher = new WindowFetch.WindowFetch();
        if (config.tokens !== undefined) {
            fetcher = new xsrf.XsrfTokenFetcher(new xsrf.CookieTokenAccessor(config.tokens.XsrfCookie), new whitelist.Whitelist(config.tokens.XsrfPaths), fetcher);
        }
        if (config.tokens.AccessTokenPath !== undefined) {
            fetcher = new AccessTokens.AccessTokenFetcher(config.tokens.AccessTokenPath, new whitelist.Whitelist([config.client.IdentityServerHost, config.client.UserDirectoryHost]), fetcher);
        }
        return fetcher;
    }
});
define("Views/Home/ApiResources", ["require", "exports", "Client/Libs/ServiceClientInjectors", "node_modules/htmlrapier.widgets/src/StandardCrudPage", "Client/Libs/IdServerClient", "node_modules/htmlrapier.widgets/src/CrudPage", "hr.controller", "node_modules/htmlrapier.widgets/src/prompt", "Client/Libs/startup"], function (require, exports, injectors, crudPageCore, client, crudPage, controller, promptWidget, startup) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AddFromMetadataController = /** @class */ (function () {
        function AddFromMetadataController(bindings, crudService, prompt, entryPointInjector) {
            this.crudService = crudService;
            this.prompt = prompt;
            this.entryPointInjector = entryPointInjector;
        }
        Object.defineProperty(AddFromMetadataController, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection, crudPage.ICrudService, promptWidget.IPrompt, client.EntryPointsInjector];
            },
            enumerable: true,
            configurable: true
        });
        AddFromMetadataController.prototype.addFromMetadata = function (evt) {
            return __awaiter(this, void 0, void 0, function () {
                var result, entry, resource, err_10;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evt.preventDefault();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 6, , 7]);
                            return [4 /*yield*/, this.prompt.prompt("Enter the target resource's base url.", "")];
                        case 2:
                            result = _a.sent();
                            if (!result.isAccepted()) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.entryPointInjector.load()];
                        case 3:
                            entry = _a.sent();
                            return [4 /*yield*/, entry.loadApiResourceFromMetadata({ targetUrl: result.getData() })];
                        case 4:
                            resource = _a.sent();
                            this.crudService.add(resource.data);
                            _a.label = 5;
                        case 5: return [3 /*break*/, 7];
                        case 6:
                            err_10 = _a.sent();
                            alert('Error loading metadata');
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        return AddFromMetadataController;
    }());
    exports.AddFromMetadataController = AddFromMetadataController;
    var injector = injectors.ApiResourceInjector;
    var builder = startup.createBuilder();
    crudPageCore.addServices(builder, injector);
    builder.Services.tryAddTransient(AddFromMetadataController, AddFromMetadataController);
    builder.Services.tryAddShared(promptWidget.IPrompt, function (s) { return new promptWidget.BrowserPrompt(); });
    crudPageCore.createControllers(builder, new crudPageCore.Settings());
    builder.create("addFromMetadata", AddFromMetadataController);
});
define("Client/Libs/SecretDisplayController", ["require", "exports", "hr.toggles", "hr.controller"], function (require, exports, hr_toggles_2, controller) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var SecretDisplayController = /** @class */ (function () {
        function SecretDisplayController(bindings) {
            var _this = this;
            this.close = function (evt) {
                _this.dialog.off();
            };
            this.secretModel = bindings.getModel('secret');
            this.errorModel = bindings.getModel('error');
            this.dialog = bindings.getToggle('dialog');
            this.dialog.offEvent.add(function () { return _this.closed(); });
            this.mainToggle = bindings.getToggle('main');
            this.loadToggle = bindings.getToggle('load');
            this.errorToggle = bindings.getToggle('error');
            this.toggleGroup = new hr_toggles_2.Group(this.mainToggle, this.loadToggle, this.errorToggle);
        }
        Object.defineProperty(SecretDisplayController, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection];
            },
            enumerable: true,
            configurable: true
        });
        SecretDisplayController.prototype.showLoading = function () {
            this.dialog.on();
            this.toggleGroup.activate(this.loadToggle);
        };
        SecretDisplayController.prototype.showError = function (errorData) {
            this.toggleGroup.activate(this.errorToggle);
            this.errorModel.setData(errorData);
        };
        SecretDisplayController.prototype.showSecret = function (name, secret) {
            this.toggleGroup.activate(this.mainToggle);
            this.secretModel.setData({
                name: name,
                secret: secret
            });
        };
        SecretDisplayController.prototype.closed = function () {
            this.secretModel.setData({ secret: "" });
        };
        SecretDisplayController.prototype.onHide = function (evt) {
            console.log("hidden");
        };
        return SecretDisplayController;
    }());
    exports.SecretDisplayController = SecretDisplayController;
    function addServices(services) {
        services.tryAddShared(SecretDisplayController, SecretDisplayController);
    }
    exports.addServices = addServices;
});
define("Views/Home/Clients", ["require", "exports", "Client/Libs/ServiceClientInjectors", "node_modules/htmlrapier.widgets/src/StandardCrudPage", "Client/Libs/IdServerClient", "node_modules/htmlrapier.widgets/src/CrudPage", "hr.controller", "node_modules/htmlrapier.widgets/src/prompt", "node_modules/htmlrapier.widgets/src/confirm", "Client/Libs/SecretDisplayController", "Client/Libs/startup"], function (require, exports, injectors, crudPageCore, client, crudPage, controller, promptWidget, hr_widgets_confirm_2, secrets, startup) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RowWithSecretController = /** @class */ (function (_super) {
        __extends(RowWithSecretController, _super);
        function RowWithSecretController(secretDisplay, confirm) {
            var _this = _super.call(this) || this;
            _this.secretDisplay = secretDisplay;
            _this.confirm = confirm;
            return _this;
        }
        Object.defineProperty(RowWithSecretController, "InjectorArgs", {
            get: function () {
                return [secrets.SecretDisplayController, hr_widgets_confirm_2.IConfirm];
            },
            enumerable: true,
            configurable: true
        });
        RowWithSecretController.prototype.rowConstructed = function (row, bindings, data) {
            this.data = data;
            bindings.setListener(this);
        };
        RowWithSecretController.prototype.createSecret = function (evt) {
            return __awaiter(this, void 0, void 0, function () {
                var secretResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evt.preventDefault();
                            return [4 /*yield*/, this.confirm.confirm("Continuing will override the secret already in the database, you will need to update any connected apps. Do you want to continue?")];
                        case 1:
                            if (!_a.sent()) return [3 /*break*/, 3];
                            this.secretDisplay.showLoading();
                            return [4 /*yield*/, this.data.addClientSecret()];
                        case 2:
                            secretResult = _a.sent();
                            this.secretDisplay.showSecret(this.data.data.name, secretResult.data.secret);
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return RowWithSecretController;
    }(crudPage.CrudTableRowControllerExtensions));
    var AddFromMetadataController = /** @class */ (function () {
        function AddFromMetadataController(bindings, crudService, prompt, entryPointInjector) {
            this.crudService = crudService;
            this.prompt = prompt;
            this.entryPointInjector = entryPointInjector;
        }
        Object.defineProperty(AddFromMetadataController, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection, crudPage.ICrudService, promptWidget.IPrompt, client.EntryPointsInjector];
            },
            enumerable: true,
            configurable: true
        });
        AddFromMetadataController.prototype.addFromMetadata = function (evt) {
            return __awaiter(this, void 0, void 0, function () {
                var result, entry, resource, err_11;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evt.preventDefault();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 6, , 7]);
                            return [4 /*yield*/, this.prompt.prompt("Enter the target client's base url.", "")];
                        case 2:
                            result = _a.sent();
                            if (!result.isAccepted()) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.entryPointInjector.load()];
                        case 3:
                            entry = _a.sent();
                            return [4 /*yield*/, entry.loadClientFromMetadata({ targetUrl: result.getData() })];
                        case 4:
                            resource = _a.sent();
                            this.crudService.add(resource.data);
                            _a.label = 5;
                        case 5: return [3 /*break*/, 7];
                        case 6:
                            err_11 = _a.sent();
                            alert('Error loading metadata');
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        return AddFromMetadataController;
    }());
    exports.AddFromMetadataController = AddFromMetadataController;
    var injector = injectors.ClientResourceInjector;
    var builder = startup.createBuilder();
    crudPageCore.addServices(builder, injector);
    secrets.addServices(builder.Services);
    builder.Services.addTransient(crudPage.CrudTableRowControllerExtensions, RowWithSecretController);
    builder.Services.tryAddTransient(AddFromMetadataController, AddFromMetadataController);
    builder.Services.tryAddShared(promptWidget.IPrompt, function (s) { return new promptWidget.BrowserPrompt(); });
    crudPageCore.createControllers(builder, new crudPageCore.Settings());
    builder.create("secretDisplay", secrets.SecretDisplayController);
    builder.create("addFromMetadata", AddFromMetadataController);
});
define("node_modules/htmlrapier.roleclient/src/UserSearchController", ["require", "exports", "node_modules/htmlrapier.roleclient/src/UserDirectoryClient", "hr.controller", "node_modules/htmlrapier.widgets/src/MainLoadErrorLifecycle", "hr.eventdispatcher"], function (require, exports, Client, controller, hr_widgets_MainLoadErrorLifecycle_4, event) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var UserSearchControllerOptions = /** @class */ (function () {
        function UserSearchControllerOptions() {
            this.mainToggleName = "main";
            this.errorToggleName = "error";
            this.loadToggleName = "load";
            this.dialogToggleName = "dialog";
            this.guidFormName = "fromGuidForm";
            this.setLoadingOnStart = true;
        }
        return UserSearchControllerOptions;
    }());
    exports.UserSearchControllerOptions = UserSearchControllerOptions;
    var UserSearchController = /** @class */ (function () {
        function UserSearchController(bindings, settings, builder, entryPointInjector) {
            this.builder = builder;
            this.entryPointInjector = entryPointInjector;
            this.addManuallyEvent = new event.ActionEventDispatcher();
            this.options = settings;
            this.guidForm = bindings.getForm(settings.guidFormName);
            this.searchModel = bindings.getModel("search");
            this.searchResultsModel = bindings.getModel("searchResults");
            this.noResultsModel = bindings.getModel("noResults");
            this.noResultsToggle = bindings.getToggle("noResults");
            this.noResultsToggle.off();
            this.dialogToggle = bindings.getToggle(settings.dialogToggleName);
            this.lifecycle = new hr_widgets_MainLoadErrorLifecycle_4.MainLoadErrorLifecycle(bindings.getToggle(settings.mainToggleName), bindings.getToggle(settings.loadToggleName), bindings.getToggle(settings.errorToggleName), settings.setLoadingOnStart);
            this.lifecycle.showLoad();
            this.setup();
        }
        Object.defineProperty(UserSearchController, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection,
                    UserSearchControllerOptions,
                    controller.InjectedControllerBuilder,
                    Client.EntryPointInjector];
            },
            enumerable: true,
            configurable: true
        });
        UserSearchController.prototype.show = function () {
            this.dialogToggle.on();
        };
        UserSearchController.prototype.hide = function () {
            this.dialogToggle.off();
        };
        Object.defineProperty(UserSearchController.prototype, "onAddManually", {
            get: function () {
                return this.addManuallyEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        UserSearchController.prototype.setup = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, err_12;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            _a = this;
                            return [4 /*yield*/, this.entryPointInjector.load()];
                        case 1:
                            _a.entryPoint = _b.sent();
                            if (this.entryPoint.canSearchUsers()) {
                                this.lifecycle.showMain();
                            }
                            else {
                                this.lifecycle.showError({
                                    name: "List User Error",
                                    message: "Cannot list users."
                                });
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            err_12 = _b.sent();
                            this.lifecycle.showError(err_12);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        UserSearchController.prototype.runSearch = function (evt) {
            return __awaiter(this, void 0, void 0, function () {
                var searchData, data, listingCreator, items, i, itemData, err_13;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evt.preventDefault();
                            this.lifecycle.showLoad();
                            searchData = this.searchModel.getData();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.entryPoint.searchUsers(searchData)];
                        case 2:
                            data = _a.sent();
                            listingCreator = this.builder.createOnCallback(IUserResultController);
                            items = data.items;
                            this.searchResultsModel.clear();
                            for (i = 0; i < items.length; ++i) {
                                itemData = items[i].data;
                                this.searchResultsModel.appendData(itemData, function (b, d) {
                                    listingCreator(b, items[i]);
                                });
                            }
                            this.lifecycle.showMain();
                            return [3 /*break*/, 4];
                        case 3:
                            err_13 = _a.sent();
                            this.lifecycle.showError(err_13);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        UserSearchController.prototype.addFromGuid = function (evt) {
            evt.preventDefault();
            this.addManuallyEvent.fire(this.guidForm.getData());
        };
        return UserSearchController;
    }());
    exports.UserSearchController = UserSearchController;
    var IUserResultController = /** @class */ (function () {
        function IUserResultController() {
        }
        return IUserResultController;
    }());
    exports.IUserResultController = IUserResultController;
    var UserResultController = /** @class */ (function () {
        function UserResultController(bindings) {
        }
        Object.defineProperty(UserResultController, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection, controller.InjectControllerData];
            },
            enumerable: true,
            configurable: true
        });
        return UserResultController;
    }());
    exports.UserResultController = UserResultController;
    function AddServices(services) {
        services.tryAddTransient(UserSearchControllerOptions, function (s) { return new UserSearchControllerOptions(); });
        services.tryAddTransient(UserSearchController, UserSearchController);
        services.tryAddTransient(IUserResultController, UserResultController);
    }
    exports.AddServices = AddServices;
});
define("node_modules/htmlrapier.roleclient/src/UserHypermediaCrudShim", ["require", "exports", "node_modules/htmlrapier.widgets/src/PageNumberWidget", "node_modules/htmlrapier.widgets/src/CrudPage"], function (require, exports, pageWidget, crudPage) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var HypermediaCrudService = /** @class */ (function (_super) {
        __extends(HypermediaCrudService, _super);
        function HypermediaCrudService(entry) {
            var _this = _super.call(this) || this;
            _this.entry = entry;
            return _this;
        }
        HypermediaCrudService.prototype.getItemSchema = function () {
            return __awaiter(this, void 0, void 0, function () {
                var entryPoint, docs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.entry.load()];
                        case 1:
                            entryPoint = _a.sent();
                            return [4 /*yield*/, this.getActualSchema(entryPoint)];
                        case 2:
                            docs = _a.sent();
                            return [2 /*return*/, docs.requestSchema];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.getListingSchema = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, undefined];
                });
            });
        };
        HypermediaCrudService.prototype.getSearchSchema = function () {
            return __awaiter(this, void 0, void 0, function () {
                var entryPoint, docs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.entry.load()];
                        case 1:
                            entryPoint = _a.sent();
                            return [4 /*yield*/, this.getActualSearchSchema(entryPoint)];
                        case 2:
                            docs = _a.sent();
                            return [2 /*return*/, docs.requestSchema];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.add = function (item) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    if (item === undefined) {
                        item = {};
                    }
                    this.fireShowItemEditorEvent(new crudPage.ShowItemEditorEventArgs(item, function (a) { return _this.finishAdd(a); }));
                    return [2 /*return*/];
                });
            });
        };
        HypermediaCrudService.prototype.finishAdd = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var entryPoint;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.entry.load()];
                        case 1:
                            entryPoint = _a.sent();
                            return [4 /*yield*/, this.commitAdd(entryPoint, data)];
                        case 2:
                            _a.sent();
                            this.refreshPage();
                            return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.canAdd = function () {
            return __awaiter(this, void 0, void 0, function () {
                var entryPoint;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.entry.load()];
                        case 1:
                            entryPoint = _a.sent();
                            return [2 /*return*/, this.canAddItem(entryPoint)];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.edit = function (item) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    data = this.getEditObject(item);
                    this.editData(item, data);
                    return [2 /*return*/];
                });
            });
        };
        HypermediaCrudService.prototype.editData = function (item, dataPromise) {
            var _this = this;
            this.fireShowItemEditorEvent(new crudPage.ShowItemEditorEventArgs(dataPromise, function (a) { return _this.finishEdit(a, item); }));
        };
        HypermediaCrudService.prototype.getEditObject = function (item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, item.data];
                });
            });
        };
        HypermediaCrudService.prototype.finishEdit = function (data, item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.commitEdit(data, item)];
                        case 1:
                            _a.sent();
                            this.refreshPage();
                            return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.del = function (item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.commitDelete(item)];
                        case 1:
                            _a.sent();
                            this.refreshPage();
                            return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.getPage = function (query) {
            var loadingPromise = this.getPageAsync(query);
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(loadingPromise));
            return loadingPromise;
        };
        HypermediaCrudService.prototype.getPageAsync = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var entryResult, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.entry.load()];
                        case 1:
                            entryResult = _b.sent();
                            if (!this.canList(entryResult)) return [3 /*break*/, 3];
                            _a = this;
                            return [4 /*yield*/, this.list(entryResult, query)];
                        case 2:
                            _a.currentPage = _b.sent();
                            return [2 /*return*/, this.currentPage];
                        case 3: throw new Error("No permissions to list people, cannot get page.");
                    }
                });
            });
        };
        HypermediaCrudService.prototype.firstPage = function () {
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.firstPageAsync()));
        };
        HypermediaCrudService.prototype.firstPageAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.currentPage) return [3 /*break*/, 4];
                            if (!this.currentPage.canFirst()) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.currentPage.first()];
                        case 1:
                            _a.currentPage = _b.sent();
                            return [2 /*return*/, this.currentPage];
                        case 2: throw new Error("Cannot visit the first page, no link found.");
                        case 3: return [3 /*break*/, 5];
                        case 4: throw new Error("Cannot visit the first page until a page has been loaded.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.lastPage = function () {
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.lastPageAsync()));
        };
        HypermediaCrudService.prototype.lastPageAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.currentPage) return [3 /*break*/, 4];
                            if (!this.currentPage.canLast()) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.currentPage.last()];
                        case 1:
                            _a.currentPage = _b.sent();
                            return [2 /*return*/, this.currentPage];
                        case 2: throw new Error("Cannot visit the last page, no link found.");
                        case 3: return [3 /*break*/, 5];
                        case 4: throw new Error("Cannot visit the last page until a page has been loaded.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.nextPage = function () {
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.nextPageAsync()));
        };
        HypermediaCrudService.prototype.nextPageAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.currentPage) return [3 /*break*/, 4];
                            if (!this.currentPage.canNext()) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.currentPage.next()];
                        case 1:
                            _a.currentPage = _b.sent();
                            return [2 /*return*/, this.currentPage];
                        case 2: throw new Error("Cannot visit the next page, no link found.");
                        case 3: return [3 /*break*/, 5];
                        case 4: throw new Error("Cannot visit the next page until a page has been loaded.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.previousPage = function () {
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.previousPageAsync()));
        };
        HypermediaCrudService.prototype.previousPageAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.currentPage) return [3 /*break*/, 4];
                            if (!this.currentPage.canPrevious()) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.currentPage.previous()];
                        case 1:
                            _a.currentPage = _b.sent();
                            return [2 /*return*/, this.currentPage];
                        case 2: throw new Error("Cannot visit the previous page, no link found.");
                        case 3: return [3 /*break*/, 5];
                        case 4: throw new Error("Cannot visit the previous page until a page has been loaded.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.refreshPage = function () {
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.refreshPageAsync()));
        };
        HypermediaCrudService.prototype.refreshPageAsync = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.currentPage) return [3 /*break*/, 4];
                            if (!this.currentPage.canRefresh()) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.currentPage.refresh()];
                        case 1:
                            _a.currentPage = _b.sent();
                            return [2 /*return*/, this.currentPage];
                        case 2: throw new Error("Cannot refresh the page, no link found.");
                        case 3: return [3 /*break*/, 5];
                        case 4: throw new Error("Cannot refresh the page until a page has been loaded.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        HypermediaCrudService.prototype.getItems = function (list) {
            return list.items;
        };
        HypermediaCrudService.prototype.getListingDisplayObject = function (item) {
            return item.data;
        };
        HypermediaCrudService.prototype.getPageNumberState = function (list) {
            return new pageWidget.HypermediaPageState(list);
        };
        return HypermediaCrudService;
    }(crudPage.ICrudService));
    exports.HypermediaCrudService = HypermediaCrudService;
});
define("node_modules/htmlrapier.roleclient/src/UserCrudService", ["require", "exports", "node_modules/htmlrapier.roleclient/src/RoleClient", "node_modules/htmlrapier.widgets/src/CrudPage", "hr.controller", "node_modules/htmlrapier.roleclient/src/UserSearchController", "node_modules/htmlrapier.roleclient/src/UserHypermediaCrudShim"], function (require, exports, client, crudPage, controller, UserSearchController, hyperShim) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function HasCrudServiceExtensions(t) {
        return t.editUserRoles !== undefined;
    }
    exports.HasCrudServiceExtensions = HasCrudServiceExtensions;
    var CrudService = /** @class */ (function (_super) {
        __extends(CrudService, _super);
        function CrudService(entry, userSearchController) {
            var _this = _super.call(this, entry) || this;
            _this.userSearchController = userSearchController;
            _this.entryInjector = entry;
            _this.userSearchController.onAddManually.add(function (data) {
                _this.editUserRoles(data.id, data.name);
            });
            return _this;
        }
        Object.defineProperty(CrudService, "InjectorArgs", {
            get: function () {
                return [client.IRoleEntryInjector, UserSearchController.UserSearchController];
            },
            enumerable: true,
            configurable: true
        });
        CrudService.prototype.getActualSchema = function (entryPoint) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (client.IsEntryPointResult(entryPoint)) {
                        return [2 /*return*/, entryPoint.getSetUserDocs()];
                    }
                    return [2 /*return*/];
                });
            });
        };
        CrudService.prototype.getActualSearchSchema = function (entryPoint) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    throw new Error("getActualSearchSchema Not supported");
                });
            });
        };
        CrudService.prototype.canAddItem = function (entryPoint) {
            if (client.IsEntryPointResult(entryPoint)) {
                return entryPoint.canSetUser();
            }
        };
        CrudService.prototype.add = function (item) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.userSearchController.show();
                    return [2 /*return*/];
                });
            });
        };
        CrudService.prototype.commitAdd = function (entryPoint, data) {
            if (client.IsEntryPointResult(entryPoint)) {
                return entryPoint.setUser(data);
            }
        };
        CrudService.prototype.getEditObject = function (item) {
            return __awaiter(this, void 0, void 0, function () {
                var refreshed;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!item.canRefresh()) return [3 /*break*/, 2];
                            return [4 /*yield*/, item.refresh()];
                        case 1:
                            refreshed = _a.sent();
                            return [2 /*return*/, refreshed.data];
                        case 2: return [2 /*return*/, item.data];
                    }
                });
            });
        };
        CrudService.prototype.commitEdit = function (data, item) {
            if (client.IsRoleAssignmentsResult(item)) {
                return item.setUser(data);
            }
        };
        CrudService.prototype.getDeletePrompt = function (item) {
            return "Are you sure you want to delete " + item.data.name + "?";
        };
        CrudService.prototype.commitDelete = function (item) {
            if (client.IsRoleAssignmentsResult(item)) {
                return item.deleteUser();
            }
        };
        CrudService.prototype.canList = function (entryPoint) {
            if (client.IsEntryPointResult(entryPoint)) {
                return entryPoint.canListUsers();
            }
        };
        CrudService.prototype.list = function (entryPoint, query) {
            if (client.IsEntryPointResult(entryPoint)) {
                return entryPoint.listUsers(query);
            }
        };
        CrudService.prototype.canEdit = function (item) {
            if (client.IsRoleAssignmentsResult(item)) {
                return item.canSetUser();
            }
        };
        CrudService.prototype.canDel = function (item) {
            if (client.IsRoleAssignmentsResult(item)) {
                return item.canDeleteUser();
            }
        };
        CrudService.prototype.editUserRoles = function (userId, name) {
            return __awaiter(this, void 0, void 0, function () {
                var entryPoint, roles;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.entryInjector.load()];
                        case 1:
                            entryPoint = _a.sent();
                            if (!entryPoint.canSetUser()) {
                                throw new Error("No permission to set roles.");
                            }
                            return [4 /*yield*/, entryPoint.listUsers({
                                    userId: [userId],
                                    name: name
                                })
                                    .then(function (r) {
                                    return r.items[0];
                                })];
                        case 2:
                            roles = _a.sent();
                            this.editData(roles, Promise.resolve(roles.data));
                            return [2 /*return*/];
                    }
                });
            });
        };
        return CrudService;
    }(hyperShim.HypermediaCrudService));
    exports.CrudService = CrudService;
    var UserResultController = /** @class */ (function () {
        function UserResultController(bindings, data, crudService) {
            this.data = data;
            this.crudService = crudService;
            this.editRolesToggle = bindings.getToggle("editRoles");
            this.setup();
        }
        Object.defineProperty(UserResultController, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection, controller.InjectControllerData, crudPage.ICrudService];
            },
            enumerable: true,
            configurable: true
        });
        UserResultController.prototype.setup = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.editRolesToggle;
                            return [4 /*yield*/, this.crudService.canAdd()];
                        case 1:
                            _a.mode = _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        UserResultController.prototype.editRoles = function (evt) {
            evt.preventDefault();
            if (HasCrudServiceExtensions(this.crudService)) {
                this.crudService.editUserRoles(this.data.data.userId, this.data.data.firstName + " " + this.data.data.lastName);
            }
        };
        return UserResultController;
    }());
    exports.UserResultController = UserResultController;
    function addServices(services) {
        services.tryAddShared(UserSearchController.UserSearchController, UserSearchController.UserSearchController); //This is overridden to be a singleton, only support 1 user search per page
        services.tryAddTransient(UserSearchController.IUserResultController, UserResultController);
        services.tryAddShared(crudPage.ICrudService, CrudService);
    }
    exports.addServices = addServices;
});
define("Views/Home/UserRoles", ["require", "exports", "Client/Libs/startup", "node_modules/htmlrapier.widgets/src/CrudPage", "node_modules/htmlrapier.roleclient/src/UserCrudService", "node_modules/htmlrapier.roleclient/src/UserSearchController"], function (require, exports, startup, crudPage, crudService, UserSearchController) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
});
define("Views/Home/Users", ["require", "exports", "Client/Libs/startup", "node_modules/htmlrapier.roleclient/src/UserSearchController"], function (require, exports, startup, UserSearchController) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var builder = startup.createBuilder();
    UserSearchController.AddServices(builder.Services);
    builder.create("search", UserSearchController.UserSearchController);
});
define("node_modules/htmlrapier.widgets/src/ChildCrudTable", ["require", "exports", "node_modules/htmlrapier.widgets/src/CrudPage", "node_modules/htmlrapier.widgets/src/HypermediaCrudService"], function (require, exports, crudPage, hyperCrudPage) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ChildCrudTable = /** @class */ (function () {
        function ChildCrudTable(crudService, injector, queryManager) {
            var _this = this;
            this.crudService = crudService;
            this.injector = injector;
            this.queryManager = queryManager;
            this.resultHandlers = [];
            this.crudService.crudDataModifiedEvent.add(function (a) { return _this.crudServiceLoading(a); });
        }
        Object.defineProperty(ChildCrudTable, "InjectorArgs", {
            get: function () {
                return [crudPage.ICrudService, hyperCrudPage.HypermediaPageInjector, crudPage.CrudQueryManager];
            },
            enumerable: true,
            configurable: true
        });
        ChildCrudTable.prototype.setCurrent = function (result) {
            this.injector.parent = result;
            this.crudService.getPage(this.queryManager.setupQuery());
            for (var i = 0; i < this.resultHandlers.length; ++i) {
                this.resultHandlers[i].setCurrent(result);
            }
        };
        ChildCrudTable.prototype.addResultHandler = function (handler) {
            this.resultHandlers.push(handler);
        };
        ChildCrudTable.prototype.crudServiceLoading = function (a) {
            return __awaiter(this, void 0, void 0, function () {
                var data, i;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, a.data];
                        case 1:
                            data = _a.sent();
                            for (i = 0; i < this.resultHandlers.length; ++i) {
                                this.resultHandlers[i].refresh();
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        return ChildCrudTable;
    }());
    exports.ChildCrudTable = ChildCrudTable;
});
define("node_modules/htmlrapier.widgets/src/GetSetPage", ["require", "exports", "hr.controller", "node_modules/htmlrapier.widgets/src/MainLoadErrorLifecycle", "hr.form", "hr.error"], function (require, exports, controller, hr_widgets_MainLoadErrorLifecycle_5, form, error) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var GetSetControllerOptions = /** @class */ (function () {
        function GetSetControllerOptions() {
            this.mainErrorToggleName = "mainError";
            this.mainErrorViewName = "mainError";
            this.mainToggleName = "main";
            this.loadToggleName = "load";
            this.errorToggleName = "error";
            this.formName = "input";
            this.completeToggleName = "complete";
        }
        Object.defineProperty(GetSetControllerOptions, "InjectorArgs", {
            get: function () {
                return [];
            },
            enumerable: true,
            configurable: true
        });
        return GetSetControllerOptions;
    }());
    exports.GetSetControllerOptions = GetSetControllerOptions;
    var IGetSetService = /** @class */ (function () {
        function IGetSetService() {
        }
        return IGetSetService;
    }());
    exports.IGetSetService = IGetSetService;
    var GetSetControllerExtensions = /** @class */ (function () {
        function GetSetControllerExtensions() {
        }
        Object.defineProperty(GetSetControllerExtensions, "InjectorArgs", {
            get: function () {
                return [];
            },
            enumerable: true,
            configurable: true
        });
        /**
         * This function is called when the data is finished being input and the InputItemEditorController is about to display
         * the complete page.
         * @param data
         * @param source
         */
        GetSetControllerExtensions.prototype.inputCompleted = function (data, source) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/];
                });
            });
        };
        return GetSetControllerExtensions;
    }());
    exports.GetSetControllerExtensions = GetSetControllerExtensions;
    var GetSetController = /** @class */ (function () {
        function GetSetController(bindings, inputService, extensions, options) {
            this.inputService = inputService;
            this.extensions = extensions;
            if (options === undefined) {
                options = new GetSetControllerOptions();
            }
            var config = bindings.getConfig();
            this.keepMainFormVisible = config.keepform !== "false";
            this.completeToggle = bindings.getToggle(options.completeToggleName);
            this.completeToggle.off();
            this.form = new form.NeedsSchemaForm(bindings.getForm(options.formName));
            this.mainErrorToggle = bindings.getToggle(options.mainErrorToggleName);
            this.mainErrorView = bindings.getView(options.mainErrorViewName);
            this.lifecycle = new hr_widgets_MainLoadErrorLifecycle_5.MainLoadErrorLifecycle(bindings.getToggle(options.mainToggleName), bindings.getToggle(options.loadToggleName), bindings.getToggle(options.errorToggleName), true);
            bindings.setListener(this.extensions);
            this.setup();
        }
        Object.defineProperty(GetSetController, "InjectorArgs", {
            get: function () {
                return [controller.BindingCollection,
                    IGetSetService,
                    GetSetControllerExtensions
                    /*Options here, must call constructor manually unless defaults are ok. Leave options last.*/ 
                ];
            },
            enumerable: true,
            configurable: true
        });
        GetSetController.prototype.setup = function () {
            return __awaiter(this, void 0, void 0, function () {
                var data, schema, err_14;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.lifecycle.showLoad();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, this.inputService.getData()];
                        case 2:
                            data = _a.sent();
                            return [4 /*yield*/, this.inputService.getSchema()];
                        case 3:
                            schema = _a.sent();
                            this.form.setSchema(schema);
                            this.form.setData(data);
                            this.lifecycle.showMain();
                            return [3 /*break*/, 5];
                        case 4:
                            err_14 = _a.sent();
                            this.lifecycle.showError(err_14);
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        GetSetController.prototype.submit = function (evt) {
            return __awaiter(this, void 0, void 0, function () {
                var data, err_15;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            evt.preventDefault();
                            this.lifecycle.showLoad();
                            this.mainErrorToggle.off();
                            this.completeToggle.off();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 7, , 8]);
                            data = this.form.getData() || {};
                            return [4 /*yield*/, this.inputService.setData(data)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.extensions.inputCompleted(data, this)];
                        case 3:
                            _a.sent();
                            if (!this.keepMainFormVisible) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.inputService.getData()];
                        case 4:
                            data = _a.sent();
                            this.form.setData(data);
                            this.lifecycle.showMain();
                            this.completeToggle.on();
                            return [3 /*break*/, 6];
                        case 5:
                            this.lifecycle.showOther(this.completeToggle);
                            _a.label = 6;
                        case 6: return [3 /*break*/, 8];
                        case 7:
                            err_15 = _a.sent();
                            if (error.isFormErrors(err_15)) {
                                this.form.setError(err_15);
                                this.lifecycle.showMain();
                                this.mainErrorView.setData(err_15);
                                this.mainErrorToggle.on();
                            }
                            else {
                                this.lifecycle.showError(err_15);
                            }
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        return GetSetController;
    }());
    exports.GetSetController = GetSetController;
    var HypermediaGetSetInjector = /** @class */ (function () {
        function HypermediaGetSetInjector() {
        }
        return HypermediaGetSetInjector;
    }());
    exports.HypermediaGetSetInjector = HypermediaGetSetInjector;
    var HypermediaGetSetService = /** @class */ (function (_super) {
        __extends(HypermediaGetSetService, _super);
        function HypermediaGetSetService(injector) {
            var _this = _super.call(this) || this;
            _this.injector = injector;
            _this.current = null;
            return _this;
        }
        Object.defineProperty(HypermediaGetSetService, "InjectorArgs", {
            get: function () {
                return [HypermediaGetSetInjector];
            },
            enumerable: true,
            configurable: true
        });
        HypermediaGetSetService.prototype.getSchema = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(this.current !== null)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.current.getSetDocs()];
                        case 1: return [2 /*return*/, (_a.sent()).requestSchema];
                        case 2: return [2 /*return*/, null];
                    }
                });
            });
        };
        HypermediaGetSetService.prototype.getData = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!(this.current === null)) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, this.injector.getStart()];
                        case 1:
                            _a.current = _b.sent();
                            _b.label = 2;
                        case 2: return [2 /*return*/, this.current.data];
                    }
                });
            });
        };
        HypermediaGetSetService.prototype.setData = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this;
                            return [4 /*yield*/, this.current.set(data)];
                        case 1:
                            _a.current = _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return HypermediaGetSetService;
    }(IGetSetService));
    exports.HypermediaGetSetService = HypermediaGetSetService;
    /**
     * This function will define a service for InputItemEditorController, it expects that you
     * will provide a IInputService implementation in order to work.
     * @param services
     */
    function AddServices(services) {
        services.tryAddTransient(GetSetControllerExtensions, GetSetControllerExtensions);
        services.tryAddTransient(GetSetController, GetSetController);
        services.tryAddTransient(IGetSetService, HypermediaGetSetService);
    }
    exports.AddServices = AddServices;
});
///<amd-module name="hr.relogin.logged-in-page"/>
define("hr.relogin.logged-in-page", ["require", "exports", "node_modules/htmlrapier.relogin/src/LoginPopup"], function (require, exports, loginPopup) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var data = {
        type: loginPopup.MessageType,
        success: true
    };
    parent.postMessage(JSON.stringify(data), "*");
});
define("node_modules/htmlrapier.halcyon/src/ResultModel", ["require", "exports", "hr.iterable", "hr.typeidentifiers"], function (require, exports, iter, typeId) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This class makes it easier to use hypermedia results in models where the result
     * data is sent to the binding functions and the result itself is sent to the controller
     * constructor as the item data and the callback functions. Wrap your real model inside
     * this class to use it. Getting data will get the data back out as the DataType specified.
     */
    var ResultModel = /** @class */ (function () {
        function ResultModel(model) {
            this.model = model;
        }
        /**
         * Set the data on the model. The model will not modify the data passed in again,
         * you must call getData to get it back out.
         */
        ResultModel.prototype.setData = function (data, createdCallback, variantFinderCallback) {
            var _this = this;
            this.model.clear();
            if (data !== undefined && data !== null) {
                var items;
                if (Array.isArray(data)) {
                    items = new iter.Iterable(data);
                }
                else if (typeId.isForEachable(data)) {
                    items = data;
                }
                else {
                    this.appendData(data, createdCallback, variantFinderCallback); //Directly append single item
                }
                if (items) {
                    items.forEach(function (result) {
                        _this.appendData(result, createdCallback, variantFinderCallback);
                    });
                }
            }
        };
        /**
         * Add more data to the model, does not erase existing data.
         */
        ResultModel.prototype.appendData = function (result, createdCallback, variantFinderCallback) {
            var createdShim = undefined;
            if (createdCallback !== undefined) {
                createdShim = function (created, item) {
                    createdCallback(created, result);
                };
            }
            var variantShim = undefined;
            if (variantFinderCallback !== undefined) {
                variantShim = function (item) {
                    return variantFinderCallback(result);
                };
            }
            this.model.appendData(result.data, createdShim, variantShim);
        };
        /**
         * Clear all data from the model.
         */
        ResultModel.prototype.clear = function () {
            this.model.clear();
        };
        /**
         * Get the current data from the model.
         */
        ResultModel.prototype.getData = function () {
            return this.model.getData();
        };
        /**
         * Get the data source for the model.
         */
        ResultModel.prototype.getSrc = function () {
            return this.model.getSrc();
        };
        /**
         * Set the prototype object to use when getting data.
         * When the new object is created it will use this as
         * its prototype.
         */
        ResultModel.prototype.setPrototype = function (proto) {
            this.model.setPrototype(proto);
        };
        return ResultModel;
    }());
    exports.ResultModel = ResultModel;
});
///<amd-module name="hr.bootstrap.activate"/>
define("hr.bootstrap.activate", ["require", "exports", "node_modules/htmlrapier.bootstrap/src/all"], function (require, exports, bootstrap) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    bootstrap.activate();
});
jsns.run("hr.bootstrap.activate");
///<amd-module name="hr.cachebuster"/>
define("hr.cachebuster", ["require", "exports", "hr.fetcher"], function (require, exports, hr_fetcher_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isRequest(url) {
        return url !== undefined && url !== null && url.url !== undefined;
    }
    /**
     * A fetcher that removes caching.
     * @param {type} next - The next fetcher in the chain.
     * @returns
     */
    var CacheBuster = /** @class */ (function (_super) {
        __extends(CacheBuster, _super);
        function CacheBuster(next) {
            var _this = _super.call(this) || this;
            _this.next = next;
            return _this;
        }
        CacheBuster.prototype.fetch = function (url, init) {
            if (init !== undefined && init.method == 'GET') {
                if (isRequest(url)) {
                    url.url = addTimestampQuery(url.url);
                }
                else {
                    url = addTimestampQuery(url);
                }
                init.cache = "no-cache";
            }
            return this.next.fetch(url, init);
        };
        return CacheBuster;
    }(hr_fetcher_6.Fetcher));
    exports.CacheBuster = CacheBuster;
    function addTimestampQuery(url) {
        var regex = /([?&]noCache=)\d*/g;
        if (regex.test(url)) {
            url = url.replace(regex, '$1' + new Date().getTime());
        }
        else {
            if (url.indexOf('?') > -1) {
                url += '&';
            }
            else {
                url += '?';
            }
            url += 'noCache=' + new Date().getTime();
        }
        return url;
    }
});
///<amd-module name="hr.componentgatherer"/>
define("hr.componentgatherer", ["require", "exports", "hr.components", "hr.ignored", "hr.iterable", "hr.componentbuilder"], function (require, exports, components, ignoredNodes, hr_iterable_1, hr_componentbuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var browserSupportsTemplates = 'content' in document.createElement('template');
    var anonTemplateIndex = 0;
    var extractedBuilders = {};
    function buildTemplateElements(nestedElementsStack) {
        if (nestedElementsStack.length > 0) {
            var currentTopLevelTemplate = nestedElementsStack[nestedElementsStack.length - 1].next();
            if (!currentTopLevelTemplate.done) {
                var element = currentTopLevelTemplate.value;
                var templateElement = document.createElement('div');
                templateElement.appendChild(document.importNode(element.content, true));
                var innerTemplates = templateElement.getElementsByTagName("TEMPLATE");
                if (innerTemplates.length > 0) {
                    nestedElementsStack.push(new hr_iterable_1.Iterable(Array.prototype.slice.call(innerTemplates)).iterator());
                }
                return {
                    element: element,
                    templateElement: templateElement
                };
            }
            else {
                nestedElementsStack.pop();
                return buildTemplateElements(nestedElementsStack);
            }
        }
    }
    var templateIterables = new hr_iterable_1.Iterable(Array.prototype.slice.call(document.getElementsByTagName("TEMPLATE")));
    var templateElements;
    //If the browser supports templates, iterate through them after creating temp ones.
    if (browserSupportsTemplates) {
        var nestedElementsStack = [];
        nestedElementsStack.push(templateIterables.iterator());
        templateElements = new hr_iterable_1.Iterable(function () {
            return buildTemplateElements(nestedElementsStack);
        }).iterator();
    }
    else {
        templateElements = templateIterables.select(function (t) {
            return {
                element: t,
                templateElement: t
            };
        }).iterator();
    }
    var currentTemplate = templateElements.next();
    while (!currentTemplate.done) {
        var currentBuilder = extractTemplate(currentTemplate.value, currentBuilder);
        //The iterator is incremented below where the comment says INC HERE
    }
    //Extract templates off the page
    function extractTemplate(elementPair, currentBuilder) {
        var element = elementPair.element;
        //INC HERE - This is where currentTemplate is incremented to its next value
        //This single iter is shared for all levels of the gatherer
        currentTemplate = templateElements.next();
        //Check to see if this is an ignored element, and quickly exit if it is
        if (ignoredNodes.isIgnored(element)) {
            return currentBuilder;
        }
        var templateElement = elementPair.templateElement;
        //Look for nested child templates, do this before taking inner html so children are removed
        while (!currentTemplate.done && templateElement.contains(currentTemplate.value.element)) {
            var currentBuilder = extractTemplate(currentTemplate.value, currentBuilder);
        }
        var componentString = templateElement.innerHTML.trim();
        //Special case for tables in ie, cannot create templates without a surrounding table element, this will eliminate that unless requested otherwise
        if (templateElement.childElementCount === 1 && templateElement.firstElementChild.tagName === 'TABLE' && !element.hasAttribute('data-hr-keep-table')) {
            var tableElement = templateElement.firstElementChild;
            if (tableElement.childElementCount > 0 && tableElement.firstElementChild.tagName === 'TBODY') {
                componentString = tableElement.firstElementChild.innerHTML.trim();
            }
            else {
                componentString = tableElement.innerHTML.trim();
            }
        }
        var elementParent = element.parentElement;
        elementParent.removeChild(element);
        var variantName = element.getAttribute("data-hr-variant");
        var componentName = element.getAttribute("data-hr-component");
        if (variantName === null) {
            //Check to see if this is an anonymous template, if so adjust the parent element and
            //name the template
            if (componentName === null) {
                componentName = 'AnonTemplate_' + anonTemplateIndex++;
                elementParent.setAttribute("data-hr-view-component", componentName);
            }
            var builder = new hr_componentbuilder_1.ComponentBuilder(componentString);
            extractedBuilders[componentName] = builder;
            components.register(componentName, builder);
            return builder;
        }
        else {
            if (componentName === null) {
                if (currentBuilder !== undefined) {
                    currentBuilder.addVariant(variantName, new hr_componentbuilder_1.VariantBuilder(componentString));
                }
                else {
                    console.log('Attempted to create a variant named "' + variantName + '" with no default component in the chain. Please start your template element chain with a data-hr-component or a anonymous template. This template has been ignored.');
                }
            }
            else {
                extractedBuilders[componentName].addVariant(variantName, new hr_componentbuilder_1.VariantBuilder(componentString));
            }
            return currentBuilder;
        }
    }
});
///<amd-module name="hr.credentialsfetcher"/>
define("hr.credentialsfetcher", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A fetcher that adds credentials to whitelisted urls.
     * @param {type} next - The next fetcher in the chain.
     * @returns
     */
    var WithCredentialsFetcher = /** @class */ (function () {
        function WithCredentialsFetcher(accessWhitelist, next) {
            this.next = next;
            this.accessWhitelist = accessWhitelist;
        }
        WithCredentialsFetcher.prototype.fetch = function (url, init) {
            if (this.accessWhitelist.isWhitelisted(url)) {
                if (init === undefined) {
                    init = {};
                }
                init.credentials = "include";
            }
            return this.next.fetch(url, init);
        };
        return WithCredentialsFetcher;
    }());
    exports.WithCredentialsFetcher = WithCredentialsFetcher;
});
///<amd-module name="hr.defaultform"/>
define("hr.defaultform", ["require", "exports", "hr.components", "hr.componentbuilder"], function (require, exports, component, hr_componentbuilder_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //Register default components
    if (!component.isDefined("hr.forms.default")) {
        var builder = new hr_componentbuilder_2.ComponentBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><input class="form-control" name="{{buildName}}" type="{{buildType}}" /></div></div>');
        builder.addVariant("date-time", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><input class="form-control" name="{{buildName}}" type="text" /></div></div>'));
        builder.addVariant("date", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><input class="form-control" name="{{buildName}}" type="text" /></div></div>'));
        builder.addVariant("textarea", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><textarea class="form-control" name="{{buildName}}" rows="{{size}}"></textarea></div></div>'));
        builder.addVariant("checkbox", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="checkbox"><label><input type="checkbox" name="{{buildName}}" value="{{buildValue}}" />&nbsp;{{title}}</label></div></div>'));
        builder.addVariant("hidden", new hr_componentbuilder_2.VariantBuilder('<input type="hidden" name="{{buildName}}" />'));
        builder.addVariant("select", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><select class="form-control" name="{{buildName}}"/></div></div>'));
        builder.addVariant("multiselect", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><select class="form-control" name="{{buildName}}" multiple size="{{size}}"/></div></div>'));
        builder.addVariant("arrayEditor", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div data-hr-view="items" data-hr-view-component="hr.forms.default-arrayEditorItem"></div><button class="btn btn-default" data-hr-on-click="add">Add</button></div></div>'));
        component.register("hr.forms.default", builder);
        var arrayEditorItem = new hr_componentbuilder_2.ComponentBuilder('<div><button data-hr-on-click="remove" class="btn btn-default" data-hr-form-end>Remove</button></div>');
        component.register("hr.forms.default-arrayEditorItem", arrayEditorItem);
    }
    //Register horizontal form
    if (!component.isDefined("hr.forms.horizontal")) {
        var builder = new hr_componentbuilder_2.ComponentBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><input class="form-control" name="{{buildName}}" type="{{buildType}}" /></div></div></div>');
        builder.addVariant("date-time", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><input class="form-control" name="{{buildName}}" type="text" /></div></div></div>'));
        builder.addVariant("date", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><input class="form-control" name="{{buildName}}" type="text" /></div></div></div>'));
        builder.addVariant("textarea", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><textarea class="form-control" name="{{buildName}}" rows="{{size}}"></textarea></div></div></div>'));
        builder.addVariant("checkbox", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group"><div class="col-sm-offset-2 col-sm-10"><div class="checkbox"><label><input type="checkbox" name="{{buildName}}" value="{{buildValue}}" />&nbsp;{{title}}</label></div></div></div></div>'));
        builder.addVariant("hidden", new hr_componentbuilder_2.VariantBuilder('<input type="hidden" name="{{buildName}}" />'));
        builder.addVariant("select", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><select class="form-control" name="{{buildName}}"/></div></div></div>'));
        builder.addVariant("multiselect", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><select class="form-control" name="{{buildName}}" multiple size="{{size}}"/></div></div></div>'));
        builder.addVariant("arrayEditor", new hr_componentbuilder_2.VariantBuilder('<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div data-hr-view="items" data-hr-view-component="hr.forms.horizontal-arrayEditorItem"></div><button class="btn btn-default" data-hr-on-click="add">Add</button></div></div>'));
        component.register("hr.forms.horizontal", builder);
        var arrayEditorItem = new hr_componentbuilder_2.ComponentBuilder('<div><button data-hr-on-click="remove" class="btn btn-default" data-hr-form-end>Remove</button></div>');
        component.register("hr.forms.horizontal-arrayEditorItem", arrayEditorItem);
    }
});
///<amd-module name="hr.formbuilder"/>
define("hr.formbuilder", ["require", "exports", "hr.components", "hr.domquery", "hr.bindingcollection", "hr.eventdispatcher", "hr.formhelper", "hr.schema", "hr.typeidentifiers", "hr.expressiontree"], function (require, exports, component, domquery, hr_bindingcollection_4, event, formHelper, hr_schema_1, typeIds, expression) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var FormValuesSource = /** @class */ (function () {
        function FormValuesSource(formValues) {
            this.formValues = formValues;
        }
        FormValuesSource.prototype.getValue = function (name) {
            var value = this.formValues.getFormValue(name);
            if (value !== undefined) {
                return value.getData();
            }
            return undefined;
        };
        return FormValuesSource;
    }());
    var FormValues = /** @class */ (function () {
        function FormValues() {
            this.values = [];
            this.fireChangesToValues = false;
            this.changedEventHandler = new event.ActionEventDispatcher();
            this.complexValues = true; //If this is true, the values passed in are complex, which means they are functions or objects with multiple values, otherwise they are simple and the values should be used directly.
            this.valueSource = new FormValuesSource(this);
        }
        FormValues.prototype.add = function (value) {
            var _this = this;
            this.values.push(value);
            if (value.isChangeTrigger) {
                value.onChanged.add(function (a) { return _this.fireDataChanged(); });
            }
            if (value.respondsToChanges) {
                this.fireChangesToValues = true;
            }
        };
        FormValues.prototype.setError = function (err, baseName) {
            if (baseName === undefined) {
                baseName = "";
            }
            for (var i = 0; i < this.values.length; ++i) {
                this.values[i].setError(err, baseName);
            }
        };
        FormValues.prototype.setData = function (data) {
            var dataType = formHelper.getDataType(data);
            for (var i = 0; i < this.values.length; ++i) {
                var item = this.values[i];
                var itemData = undefined;
                if (this.complexValues && data !== null) {
                    switch (dataType) {
                        case formHelper.DataType.Object:
                            itemData = data[item.getDataName()];
                            break;
                        case formHelper.DataType.Function:
                            itemData = data(item.getDataName());
                            break;
                    }
                }
                else {
                    if (dataType !== formHelper.DataType.Function) {
                        itemData = data;
                    }
                }
                item.setData(itemData);
            }
        };
        FormValues.prototype.recoverData = function (proto) {
            if (this.complexValues) {
                var data = Object.create(proto || null);
                for (var i = 0; i < this.values.length; ++i) {
                    var item = this.values[i];
                    var value = item.getData();
                    if (formHelper.shouldAddValue(value)) {
                        data[item.getDataName()] = value;
                    }
                }
                return data;
            }
            else {
                //Simple data only supports one return value, so return the first value item
                if (this.values.length > 0) {
                    return this.values[0].getData();
                }
                return undefined; //No data to get, return undefined.
            }
        };
        FormValues.prototype.changeSchema = function (componentName, schema, parentElement) {
            var keep = [];
            for (var i = 0; i < this.values.length; ++i) {
                if (!this.values[i].delete()) {
                    keep.push(this.values[i]);
                }
            }
            this.values = keep; //Replace the values with just what we kept
            buildForm(componentName, schema, parentElement, undefined, undefined, this); //Rebuild the form
        };
        FormValues.prototype.hasFormValue = function (buildName) {
            for (var i = 0; i < this.values.length; ++i) {
                if (this.values[i].getBuildName() === buildName) {
                    return true;
                }
            }
            return false;
        };
        FormValues.prototype.getFormValue = function (buildName) {
            for (var i = 0; i < this.values.length; ++i) {
                if (this.values[i].getBuildName() === buildName) {
                    return this.values[i];
                }
            }
            return undefined;
        };
        Object.defineProperty(FormValues.prototype, "onChanged", {
            get: function () {
                return this.changedEventHandler.modifier;
            },
            enumerable: true,
            configurable: true
        });
        FormValues.prototype.fireDataChanged = function () {
            if (this.fireChangesToValues) {
                for (var i = 0; i < this.values.length; ++i) {
                    this.values[i].handleChange(this.valueSource);
                }
            }
            this.changedEventHandler.fire(this);
        };
        /**
         * Set this to true to set that the values are complex and should be looked up, otherwise they are simple and
         * should be gotten / set directly.
         * @param complex
         */
        FormValues.prototype.setComplex = function (complex) {
            this.complexValues = complex;
        };
        return FormValues;
    }());
    var indexMax = 2147483647; //Sticking with 32 bit;
    var InfiniteIndex = /** @class */ (function () {
        function InfiniteIndex() {
            this.num = 0;
            this.base = "";
        }
        InfiniteIndex.prototype.getNext = function () {
            ++this.num;
            if (this.num === indexMax) {
                this.base += "b"; //Each time we hit index max we just add a 'b' to the base
                this.num = 0;
            }
            return this.base + this.num;
        };
        return InfiniteIndex;
    }());
    function sharedClearer(i) {
        return "";
    }
    var ArrayEditorRow = /** @class */ (function () {
        function ArrayEditorRow(bindings, schema, name) {
            this.bindings = bindings;
            this.name = name;
            this.removed = new event.ActionEventDispatcher();
            this.root = this.bindings.rootElement;
            var itemHandle = this.bindings.getHandle("item"); //Also supports adding to a handle named item, otherwise uses the root
            if (itemHandle !== null) {
                this.root = itemHandle;
            }
            this.formValues = buildForm('hr.forms.default', schema, this.root, this.name, true);
            bindings.setListener(this);
        }
        Object.defineProperty(ArrayEditorRow.prototype, "onRemoved", {
            get: function () {
                return this.removed.modifier;
            },
            enumerable: true,
            configurable: true
        });
        ArrayEditorRow.prototype.remove = function (evt) {
            if (evt) {
                evt.preventDefault();
            }
            this.setError(formHelper.getSharedClearingValidator(), "");
            this.pooled = this.bindings.pool();
            this.setData(sharedClearer);
            this.removed.fire(this);
        };
        ArrayEditorRow.prototype.restore = function () {
            if (this.pooled) {
                this.pooled.restore(null);
            }
        };
        ArrayEditorRow.prototype.setError = function (err, baseName) {
            this.formValues.setError(err, baseName);
        };
        ArrayEditorRow.prototype.getData = function () {
            var data = this.formValues.recoverData(null);
            if (typeIds.isObject(data)) {
                for (var key in data) {
                    return data;
                }
                return null; //Return null if the data returned has no keys in it, which means it is empty.
            }
            return data; //Not an object, just return the data
        };
        ArrayEditorRow.prototype.setData = function (data) {
            this.formValues.setData(data);
            this.setError(formHelper.getSharedClearingValidator(), "");
        };
        return ArrayEditorRow;
    }());
    var ArrayEditor = /** @class */ (function () {
        function ArrayEditor(name, buildName, baseTitle, bindings, schema, generated) {
            this.name = name;
            this.buildName = buildName;
            this.bindings = bindings;
            this.schema = schema;
            this.generated = generated;
            this.pooledRows = [];
            this.rows = [];
            this.indexGen = new InfiniteIndex();
            this.itemsView = bindings.getView("items");
            bindings.setListener(this);
            if (this.schema.title === undefined) {
                this.schema = Object.create(this.schema);
                if (baseTitle !== undefined) {
                    this.schema.title = baseTitle + " Item";
                }
                else {
                    this.schema.title = "Item";
                }
            }
            this.errorToggle = this.bindings.getToggle(this.buildName + "Error");
            this.errorMessage = this.bindings.getView(this.buildName + "ErrorMessage");
        }
        ArrayEditor.prototype.setError = function (err, baseName) {
            for (var i = 0; i < this.rows.length; ++i) {
                var rowName = err.addIndex(baseName, this.name, i);
                this.rows[i].setError(err, rowName);
            }
            var errorName = err.addKey(baseName, this.name);
            if (err.hasValidationError(errorName)) {
                this.errorToggle.on();
                this.errorMessage.setData(err.getValidationError(errorName));
            }
            else {
                this.errorToggle.off();
                this.errorMessage.setData("");
            }
        };
        ArrayEditor.prototype.add = function (evt) {
            evt.preventDefault();
            this.addRow();
        };
        ArrayEditor.prototype.addRow = function () {
            var _this = this;
            if (this.pooledRows.length == 0) {
                this.itemsView.appendData(this.schema, function (bindings, data) {
                    var row = new ArrayEditorRow(bindings, data, _this.buildName + '-' + _this.indexGen.getNext());
                    row.onRemoved.add(function (r) {
                        _this.rows.splice(_this.rows.indexOf(r), 1); //It will always be there
                        _this.pooledRows.push(r);
                    });
                    _this.rows.push(row);
                });
            }
            else {
                var row = this.pooledRows.pop();
                row.restore();
                this.rows.push(row);
            }
        };
        ArrayEditor.prototype.getData = function () {
            var items = [];
            for (var i = 0; i < this.rows.length; ++i) {
                items.push(this.rows[i].getData());
            }
            if (items.length > 0) {
                return items;
            }
            return undefined;
        };
        ArrayEditor.prototype.setData = function (data) {
            var i = 0;
            if (data) {
                //Make sure data is an array
                if (!typeIds.isArray(data)) {
                    data = [data];
                }
                for (; i < data.length; ++i) {
                    if (i >= this.rows.length) {
                        this.addRow();
                    }
                    this.rows[i].setData(data[i]);
                }
            }
            for (; i < this.rows.length;) {
                this.rows[i].remove();
            }
        };
        ArrayEditor.prototype.getBuildName = function () {
            return this.buildName;
        };
        ArrayEditor.prototype.getDataName = function () {
            return this.name;
        };
        ArrayEditor.prototype.delete = function () {
            if (this.generated) {
                this.bindings.remove();
            }
            return this.generated;
        };
        Object.defineProperty(ArrayEditor.prototype, "isChangeTrigger", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayEditor.prototype, "onChanged", {
            get: function () {
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArrayEditor.prototype, "respondsToChanges", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        ArrayEditor.prototype.handleChange = function (values) {
        };
        return ArrayEditor;
    }());
    var BasicItemEditor = /** @class */ (function () {
        function BasicItemEditor(args) {
            this.changedEventHandler = null;
            this.name = args.item.name;
            this.buildName = args.item.buildName;
            this.bindings = args.bindings;
            this.generated = args.generated;
            this.element = args.inputElement;
            this.displayExpression = args.item.displayExpression;
            if (args.item["x-ui-disabled"] === true || args.item.readOnly === true) {
                this.element.setAttribute("disabled", "");
            }
            var self = this;
            this.changedEventHandler = new event.ActionEventDispatcher();
            this.element.addEventListener("change", function (e) {
                self.changedEventHandler.fire(self);
            });
            this.errorToggle = this.bindings.getToggle(this.buildName + "Error");
            this.errorMessage = this.bindings.getView(this.buildName + "ErrorMessage");
            this.hideToggle = this.bindings.getToggle(this.buildName + "Hide");
        }
        BasicItemEditor.prototype.setError = function (err, baseName) {
            var errorName = err.addKey(baseName, this.name);
            if (err.hasValidationError(errorName)) {
                this.errorToggle.on();
                this.errorMessage.setData(err.getValidationError(errorName));
            }
            else {
                this.errorToggle.off();
                this.errorMessage.setData("");
            }
        };
        BasicItemEditor.prototype.getData = function () {
            return formHelper.readValue(this.element);
        };
        BasicItemEditor.prototype.setData = function (data) {
            this.doSetValue(data);
            this.setError(formHelper.getSharedClearingValidator(), "");
        };
        /**
         * This function actually sets the value for the element, if you are creating a subclass for BasicItemEditor
         * you should override this function to actually set the value instead of overriding setData,
         * this way the other logic for setting data (getting the actual data, clearing errors, computing defaults) can
         * still happen. There is no need to call super.doSetData as that will only set the data on the form
         * using the formHelper.setValue function.
         * @param itemData The data to set for the item, this is the final value that should be set, no lookup needed.
         */
        BasicItemEditor.prototype.doSetValue = function (itemData) {
            formHelper.setValue(this.element, itemData);
        };
        BasicItemEditor.prototype.getBuildName = function () {
            return this.buildName;
        };
        BasicItemEditor.prototype.getDataName = function () {
            return this.name;
        };
        BasicItemEditor.prototype.delete = function () {
            if (this.generated) {
                this.bindings.remove();
            }
            return this.generated;
        };
        Object.defineProperty(BasicItemEditor.prototype, "isChangeTrigger", {
            get: function () {
                return this.changedEventHandler !== null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BasicItemEditor.prototype, "onChanged", {
            get: function () {
                if (this.changedEventHandler !== null) {
                    return this.changedEventHandler.modifier;
                }
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BasicItemEditor.prototype, "respondsToChanges", {
            get: function () {
                return this.displayExpression !== undefined;
            },
            enumerable: true,
            configurable: true
        });
        BasicItemEditor.prototype.handleChange = function (values) {
            if (this.displayExpression) {
                if (this.displayExpression.isTrue(values)) {
                    this.hideToggle.off();
                }
                else {
                    this.hideToggle.on();
                }
            }
        };
        return BasicItemEditor;
    }());
    exports.BasicItemEditor = BasicItemEditor;
    var IFormValueBuilderArgs = /** @class */ (function () {
        function IFormValueBuilderArgs() {
        }
        return IFormValueBuilderArgs;
    }());
    exports.IFormValueBuilderArgs = IFormValueBuilderArgs;
    function buildForm(componentName, schema, parentElement, baseName, ignoreExisting, formValues) {
        if (ignoreExisting === undefined) {
            ignoreExisting = false;
        }
        if (baseName === undefined) {
            baseName = "";
        }
        if (formValues === undefined) {
            formValues = new FormValues();
        }
        var insertParent = parentElement;
        var dynamicInsertElement = domquery.first("[data-hr-form-end]", parentElement);
        if (dynamicInsertElement !== null) {
            //Adjust parent to end element if one was found
            insertParent = dynamicInsertElement.parentElement;
        }
        var propArray = [];
        var props = schema.properties;
        if (props === undefined) {
            //No props, add the schema itself as a property, this also means our formValues are simple values
            propArray.push(processProperty(schema, baseName, baseName));
            formValues.setComplex(false);
        }
        else {
            //There are properties, so the formValues are complex values
            formValues.setComplex(true);
            var baseNameWithSep = baseName;
            if (baseNameWithSep !== "") {
                baseNameWithSep = baseNameWithSep + '-';
            }
            for (var key in props) {
                propArray.push(processProperty(props[key], key, baseNameWithSep + key));
            }
            propArray.sort(function (a, b) {
                return a.buildOrder - b.buildOrder;
            });
        }
        for (var i = 0; i < propArray.length; ++i) {
            var item = propArray[i];
            var existing = domquery.first('[name=' + item.buildName + ']', parentElement);
            var bindings = null;
            var generated = false;
            if (ignoreExisting || existing === null) {
                //Create component if it is null
                bindings = component.one(componentName, item, insertParent, dynamicInsertElement, undefined, function (i) {
                    return i.buildType;
                });
                //Refresh existing, should be found now, when doing this always grab the last match.
                var elements = domquery.all('[name=' + item.buildName + ']', parentElement);
                if (elements.length > 0) {
                    existing = elements[elements.length - 1];
                }
                else {
                    existing = null;
                }
                generated = true;
            }
            else {
                //If this was an exising element, see if we should reuse what was found before, if the formValues already has an item, do nothing here
                if (!formValues.hasFormValue(item.buildName)) {
                    //Not found, try to create a binding collection for it
                    //Walk up element parents trying to find one with a data-hr-input-start attribute on it.
                    var bindParent = existing;
                    while (bindings === null && bindParent !== null && bindParent !== parentElement) {
                        if (bindParent.hasAttribute("data-hr-input-start")) {
                            bindings = new hr_bindingcollection_4.BindingCollection(bindParent);
                        }
                        else {
                            bindParent = bindParent.parentElement;
                        }
                    }
                    if (bindings === null) {
                        bindings = new hr_bindingcollection_4.BindingCollection(existing);
                    }
                    generated = false;
                }
            }
            if (bindings !== null) {
                formValues.add(createBindings({
                    bindings: bindings,
                    generated: generated,
                    item: item,
                    schema: schema,
                    inputElement: existing
                }));
            }
            //If this is a child form, mark the element as a child so the form serializer will ignore it
            if (IsElement(existing)) {
                existing.setAttribute("data-hr-form-level", baseName);
            }
            //If there are values defined for the element, put them on the page, this works for both
            //predefined and generated elements, which allows you to have predefined selects that can have dynamic values
            if (item.buildValues !== undefined) {
                if (IsSelectElement(existing)) {
                    for (var q = 0; q < item.buildValues.length; ++q) {
                        var current = item.buildValues[q];
                        var option = document.createElement("option");
                        option.text = current.label;
                        if (current.value !== null && current.value !== undefined) {
                            option.value = current.value;
                        }
                        else {
                            option.value = ""; //Make sure this stays as empty string, which will be null for these forms
                        }
                        existing.options.add(option);
                    }
                }
            }
        }
        return formValues;
    }
    function createBindings(args) {
        //See if there is a custom handler first
        for (var i = 0; i < formValueBuilders.length; ++i) {
            var created = formValueBuilders[i].create(args);
            if (created !== null) {
                return created;
            }
        }
        if (args.item.buildType === "arrayEditor") {
            var resolvedItems = hr_schema_1.resolveRef(args.item.items, args.schema);
            return new ArrayEditor(args.item.name, args.item.buildName, args.item.title, args.bindings, resolvedItems, args.generated);
        }
        else {
            return new BasicItemEditor(args);
        }
    }
    function IsElement(element) {
        return element && (element.nodeName !== undefined);
    }
    function IsSelectElement(element) {
        return element && (element.nodeName === 'SELECT');
    }
    function extractLabels(prop) {
        var values = [];
        var theEnum = prop.enum;
        var enumNames = theEnum;
        if (prop["x-enumNames"] !== undefined) {
            enumNames = prop["x-enumNames"];
        }
        for (var i = 0; i < theEnum.length; ++i) {
            values.push({
                label: enumNames[i],
                value: theEnum[i]
            });
        }
        return values;
    }
    function processProperty(prop, name, buildName) {
        var processed = Object.create(prop);
        processed.buildName = buildName;
        processed.name = name;
        if (processed.title === undefined) {
            processed.title = name;
        }
        if (prop["x-ui-order"] !== undefined) {
            processed.buildOrder = prop["x-ui-order"];
        }
        else {
            processed.buildOrder = Number.MAX_VALUE;
        }
        if (prop["x-display-if"] !== undefined) {
            processed.displayExpression = new expression.ExpressionTree(prop["x-display-if"]);
        }
        //Set this build type to what has been passed in, this will be processed further below
        processed.buildType = getPropertyType(prop).toLowerCase();
        if (prop["x-values"] !== undefined) {
            processed.buildValues = prop["x-values"];
        }
        else if (prop.enum !== undefined) {
            processed.buildValues = extractLabels(prop);
        }
        //Look for collections, anything defined as an array or that has x-values defined
        if (processed.buildType === 'array') {
            if (processed.buildValues !== undefined) {
                //Only supports checkbox and multiselect ui types. Checkboxes have to be requested.
                if (prop["x-ui-type"] === "checkbox") {
                    //Nothing for checkboxes yet, just be a basic multiselect until they are implemented
                    processed.buildType = "multiselect";
                }
                else {
                    processed.buildType = "multiselect";
                    processed.size = processed.buildValues.length;
                    if (processed.size > 15) {
                        processed.size = 15;
                    }
                }
            }
            else {
                //Array of complex objects, since values are not provided
                processed.buildType = "arrayEditor";
            }
        }
        else {
            if (prop["x-ui-type"] !== undefined) {
                processed.buildType = prop["x-ui-type"];
            }
            else {
                if (processed.buildValues !== undefined) {
                    //Has build options, force to select unless the user chose something else.
                    processed.buildType = "select";
                }
                else {
                    //Regular type, no options, derive html type
                    switch (processed.buildType) {
                        case 'integer':
                            processed.buildType = 'number';
                            break;
                        case 'boolean':
                            processed.buildType = 'checkbox';
                            break;
                        case 'string':
                            switch (processed.format) {
                                case 'date-time':
                                    processed.buildType = 'date-time';
                                    break;
                                default:
                                    processed.buildType = 'text';
                                    break;
                            }
                    }
                }
            }
            //Post process elements that might have more special properties
            //Do this here, since we don't really know how we got to this build type
            switch (processed.buildType) {
                case 'checkbox':
                    processed.buildValue = "true";
                    if (prop["x-value"] !== undefined) {
                        processed.buildValue = prop["x-value"];
                    }
                    break;
                case 'textarea':
                    if (processed.size === undefined) {
                        processed.size = 5;
                    }
                    break;
            }
        }
        return processed;
    }
    function getPropertyType(prop) {
        if (Array.isArray(prop.type)) {
            for (var j = 0; j < prop.type.length; ++j) {
                if (prop.type[j] !== "null") {
                    return prop.type[j];
                }
            }
        }
        else if (prop.type) {
            return prop.type;
        }
        return "string"; //Otherwise fallback to string
    }
    var formValueBuilders = [];
    function registerFormValueBuilder(builder) {
        formValueBuilders.push(builder);
    }
    exports.registerFormValueBuilder = registerFormValueBuilder;
    //Register form build function
    formHelper.setBuildFormFunc(buildForm);
});
///<amd-module name="hr.observablelist"/>
define("hr.observablelist", ["require", "exports", "hr.eventdispatcher", "hr.iterable"], function (require, exports, EventDispatcher, Iterable) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This class provides a list of items with events when they are added and removed.
     */
    var ObservableList = /** @class */ (function () {
        function ObservableList() {
            this.items = [];
            this.itemAddedEvent = new EventDispatcher.ActionEventDispatcher();
            this.itemRemovedEvent = new EventDispatcher.ActionEventDispatcher();
        }
        /**
         * Add an item to the collection.
         */
        ObservableList.prototype.add = function (value) {
            this.items.push(value);
            this.itemAddedEvent.fire(value);
        };
        /**
         * Remove an item from the collection.
         */
        ObservableList.prototype.remove = function (value) {
            var index = this.items.indexOf(value);
            if (index !== -1) {
                var item = this.items.splice(index, 1);
                this.itemRemovedEvent.fire(item[0]);
            }
        };
        /**
         * Clear the collection.
         */
        ObservableList.prototype.clear = function (fireEvents) {
            if (fireEvents === void 0) { fireEvents = true; }
            if (fireEvents) {
                for (var i = 0; i < this.items.length; ++i) {
                    this.itemRemovedEvent.fire(this.items[i]);
                }
            }
            this.items = [];
        };
        Object.defineProperty(ObservableList.prototype, "itemAdded", {
            /**
             * The item added event. Fires when items are added.
             */
            get: function () {
                return this.itemAddedEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObservableList.prototype, "itemRemoved", {
            /**
             * The item removed event. Fires when items are removed.
             */
            get: function () {
                return this.itemRemovedEvent.modifier;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Get an item at the specified index.
         */
        ObservableList.prototype.getItem = function (index) {
            return this.items[index];
        };
        Object.defineProperty(ObservableList.prototype, "count", {
            /**
             * The total number of items.
             */
            get: function () {
                return this.items.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObservableList.prototype, "iter", {
            /**
             * An iterator over the items in the collection.
             */
            get: function () {
                return new Iterable.Iterable(this.items);
            },
            enumerable: true,
            configurable: true
        });
        return ObservableList;
    }());
    exports.ObservableList = ObservableList;
});
///<amd-module name="hr.runattributes"/>
define("hr.runattributes", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //Find all data-hr-run attributes and run the runner they specify, it does not matter what kind of element
    //contains the runner.
    var runnerElements = document.querySelectorAll('[data-hr-run]');
    for (var i = 0; i < runnerElements.length; ++i) {
        var runnerElement = runnerElements[i];
        var runnerAttr = runnerElement.getAttribute('data-hr-run');
        if (runnerAttr) {
            jsns.run(runnerAttr);
        }
    }
    exports.ran = true; //Dummy operation to force this to be a module
});
jsns.run("hr.formbuilder"); //Makes sure buildForm function is registered
jsns.run("hr.componentgatherer");
jsns.run("hr.defaultform");
///<amd-module name="hr.timedtrigger"/>
define("hr.timedtrigger", ["require", "exports", "hr.eventdispatcher"], function (require, exports, hr_eventdispatcher_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TimedTrigger = /** @class */ (function () {
        function TimedTrigger(delay) {
            this.handler = new hr_eventdispatcher_2.ActionEventDispatcher();
            if (delay === undefined) {
                delay = 400;
            }
            this.delay = delay;
        }
        TimedTrigger.prototype.setDelay = function (delay) {
            this.delay = delay;
        };
        TimedTrigger.prototype.cancel = function () {
            clearTimeout(this.holder);
            this.args = undefined;
        };
        TimedTrigger.prototype.fire = function (args) {
            var _this = this;
            this.cancel();
            this.holder = window.setTimeout(function () { return _this.fireHandler(); }, this.delay);
            this.args = args;
        };
        TimedTrigger.prototype.addListener = function (listener) {
            this.handler.add(listener);
        };
        TimedTrigger.prototype.removeListener = function (listener) {
            this.handler.remove(listener);
        };
        TimedTrigger.prototype.fireHandler = function () {
            this.handler.fire(this.args);
        };
        return TimedTrigger;
    }());
    exports.TimedTrigger = TimedTrigger;
});
define("Client/Libs/MetadataBearerFetcher", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MetadataBearerFetcher = /** @class */ (function () {
        function MetadataBearerFetcher(next) {
            this.next = next;
        }
        MetadataBearerFetcher.prototype.fetch = function (url, init) {
            //set the header to null, the access token fetcher will take it from there.
            if (init === undefined) {
                init = {};
            }
            if (init.headers === undefined) {
                init.headers = {};
            }
            init.headers.bearer = null;
            return this.next.fetch(url, init);
        };
        return MetadataBearerFetcher;
    }());
    exports.MetadataBearerFetcher = MetadataBearerFetcher;
});
//# sourceMappingURL=tsbin.js.map