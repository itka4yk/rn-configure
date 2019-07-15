import arg from 'arg';
import inquirer from 'inquirer';
import { configureAndroid } from './tasks/android/configureAndroid';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--src': String,
            '--name': String,
            '--androidPackageName': String,
            '--iosPackageName': String,
            '-s': '--src',
            '-n': '--name',
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        src: args['--src'],
        name: args['--name'],
        androidPackageName: args['--androidPackageName'],
        iosPackageName: args['--iosPackageName'],
    };
}

async function promptForMissingOptions(options) {

    const questions = [];
    if (!options.src) {
        questions.push({
            type: 'input',
            name: 'src',
            message: 'please, enter git repository url for your React-Native project',
        });
    }

    if (!options.name) {
        questions.push({
            type: 'input',
            name: 'name',
            message: 'please, enter your new application name',
        });
    }

    if (!options.src) {
        questions.push({
            type: 'input',
            name: 'androidPackageName',
            message: 'please, enter your android package name',
            default: 'com.example.YOUR_APPLICATION_NAME',
            validate: s => !s.includes(' '),
        });
    }

    if (!options.src) {
        questions.push({
            type: 'input',
            name: 'iosPackageName',
            message: 'please, enter your ios package name',
            default: 'com.example.YOUR_APPLICATION_NAME',
            validate: s => !s.includes(' '),
        });
    }

    const answers = await inquirer.prompt(questions);
    return {
        ...options,
        src: answers.src,
        androidPackageName: answers.androidPackageName === 'com.example.YOUR_APPLICATION_NAME'
            ? `com.example.${answers.name}` : answers.androidPackageName,
        iosPackageName: answers.iosPackageName === 'com.example.YOUR_APPLICATION_NAME'
            ? `com.example.${answers.name}` : answers.iosPackageName,
    };
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);

    await configureAndroid(options);
}
