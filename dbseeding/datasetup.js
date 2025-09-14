
const { execSync } = require('child_process');
const path = require('path');

function runScript(script) {
    try {
        execSync(`node "${script}"`, { stdio: 'inherit' });
    } catch (err) {
        console.error(`Failed to run ${script}`);
        process.exit(1);
    }
}

const baseDir = __dirname;
runScript(path.join(baseDir, 'rbac_generate.js'));
runScript(path.join(baseDir, 'formdata_generate.js'));
