import { tsc } from 'threax-npm-tk/typescript';
import * as artifact from 'threax-npm-tk/artifacts';

var filesDir = __dirname + "/..";

(async function () {
    await tsc({
        projectFolder: filesDir
    });

    await artifact.importConfigs(filesDir, filesDir + "/wwwroot", [filesDir + '/artifacts.json', artifact.getDefaultGlob(filesDir)]);
})();