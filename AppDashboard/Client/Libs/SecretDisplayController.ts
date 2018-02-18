import { Group } from 'hr.toggles';
import * as controller from 'hr.controller';

export class SecretDisplayController {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection];
    }

    private secretModel: controller.Model<any>;
    private errorModel: controller.Model<any>;
    private dialog: controller.OnOffToggle;
    private toggleGroup: Group;
    private mainToggle: controller.OnOffToggle;
    private loadToggle: controller.OnOffToggle;
    private errorToggle: controller.OnOffToggle;

    constructor(bindings: controller.BindingCollection) {
        this.secretModel = bindings.getModel('secret');
        this.errorModel = bindings.getModel('error');

        this.dialog = bindings.getToggle('dialog');
        this.dialog.offEvent.add(() => this.closed());

        this.mainToggle = bindings.getToggle('main');
        this.loadToggle = bindings.getToggle('load');
        this.errorToggle = bindings.getToggle('error');
        this.toggleGroup = new Group(this.mainToggle, this.loadToggle, this.errorToggle);
    }

    showLoading() {
        this.dialog.on();
        this.toggleGroup.activate(this.loadToggle);
    }

    showError(errorData) {
        this.toggleGroup.activate(this.errorToggle);
        this.errorModel.setData(errorData);
    }

    showSecret(name: string, secret: string) {
        this.toggleGroup.activate(this.mainToggle);
        this.secretModel.setData({
            name: name,
            secret: secret
        });
    }

    close = (evt) => {
        this.dialog.off();
    }

    closed() {
        this.secretModel.setData({secret:""});
    }

    public onHide(evt: Event): void {
        console.log("hidden");
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddShared(SecretDisplayController, SecretDisplayController);
}