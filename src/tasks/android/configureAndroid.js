import Listr from 'listr';
import chalk from 'chalk';
import parser from 'fast-xml-parser';
import fs from 'fs-extra';

const SETTINGS_GRADLE_PATH = 'android-tmp/settings.gradle';
const BUILD_GRADLE_FILE = 'android-tmp/app/build.gradle';
const BUCK_PATH = 'android-tmp/app/BUCK';
const STRINGS_XML_PATH = 'android-tmp/app/src/main/res/values/strings.xml';
const ANDROID_MANIFEST_PATH = 'android-tmp/app/src/main/AndroidManifest.xml';

export async function configureAndroid({ androidPackageName: newPackageName, name: newAppName }) {
    let oldPackageName;
    let oldAppName;
    console.log('%s android project', chalk.yellow.bold('CONFIGURE'));
    const tasks = new Listr([
        {
            title: 'Getting project package name',
            task: async () => {
                oldPackageName = await getPackageName();
                console.log('packageName is %s', chalk.blue.bold(oldPackageName));
            },
        },
        {
            title: 'Getting project name',
            task: async () => {
                oldAppName = await getApplicationName();
                console.log('appname is %s', chalk.blue.bold(oldAppName));
            },
        },
        {
            title: 'Preparing temp folder',
            task: async () => await createTempFolder(),
        },
        {
            title: 'Updating /android/settings.gradle',
            task: async () => await updateFile(SETTINGS_GRADLE_PATH, oldAppName, newAppName),
        },
        {
            title: 'Updating /android/app/build.gradle',
            task: async () => await updateFile(BUILD_GRADLE_FILE, oldPackageName, newPackageName),
        },
        {
            title: 'Updating /android/app/BUCK',
            task: async () => await updateFile(BUCK_PATH, oldPackageName, newPackageName),
        },
        {
            title: 'Updating /android/app/src/main/res/values/strings.xml',
            task: async () => await updateFile(STRINGS_XML_PATH, oldAppName, newAppName),
        },
        {
            title: 'Updating /android/app/src/main/AndroidManifest.xml',
            task: async () => await updateFile(ANDROID_MANIFEST_PATH, oldPackageName, newPackageName),
        },
        {
            title: 'Updating /android/app/src/main/java/**/*.java',
            task: async () => await updateJavaFiles(oldPackageName, oldAppName, newPackageName, newAppName),
        },
        {
            title: 'Cleanup',
            task: async () => await copyTempFolder(),
        },
    ]);
    await tasks.run();
}

async function createTempFolder() {
    await fs.remove('android-tmp');
    await fs.copy('android', 'android-tmp', { overwrite: true });
}

async function copyTempFolder() {
    await fs.remove('android');
    await fs.move('android-tmp', 'android', { overwrite: true });
}

async function getPackageName() {
    const buildGradle = fs.readFileSync('android/app/build.gradle').toString();
    const regex = /applicationId "(.*?)"/g;
    return buildGradle.match(regex)[0].split('"')[1];
}

function updateFile(path, oldVal, newVal) {
    const file = fs.readFileSync(path).toString();
    fs.writeFileSync(path, file.replace(
        new RegExp(oldVal, 'g'),
        newVal,
    ));
}

async function getApplicationName() {
    const stringsXml = fs.readFileSync('android/app/src/main/res/values/strings.xml').toString();
    const parsedStringsXml = parser.parse(stringsXml, { ignoreAttributes: false });
    return parsedStringsXml.resources.string.find(e => e['@_name'] === 'app_name')['#text'];
}

async function updateJavaFiles(oldPackageName, oldAppName, newPackageName, newAppName) {
    const oldDir = `android-tmp/app/src/main/java/${oldPackageName.replace(/\./g, '/')}`;
    const newDir = `android-tmp/app/src/main/java/${newPackageName.replace(/\./g, '/')}`;
    const tmpDir = `android-tmp/app/src/main/java/__temp`;
    await updateFile(`${oldDir}/MainActivity.java`, oldPackageName, newPackageName);
    await updateFile(`${oldDir}/MainActivity.java`, oldAppName, newAppName);
    await updateFile(`${oldDir}/MainApplication.java`, oldPackageName, newPackageName);

    await fs.move(oldDir, tmpDir, { overwrite: true });
    await fs.remove(`android-tmp/app/src/main/java/${oldPackageName.split('.')[0]}`);
    await fs.move(tmpDir, newDir);
    await fs.remove(tmpDir);
}
