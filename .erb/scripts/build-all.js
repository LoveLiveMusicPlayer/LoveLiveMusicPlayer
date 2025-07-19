const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

let architectures;

for (const item of process.argv) {
    if (item.startsWith('platform')) {
        platform = item.replace('platform=', '');
        if (platform == 'win') {
            architectures = [
                {
                    platform: 'win',
                    arch: 'ia32',
                    command: 'ts-node .erb/scripts/prepack.js platform=win arch=ia32 && yarn package -w --ia32'
                },
                {
                    platform: 'win',
                    arch: 'x64',
                    command: 'ts-node .erb/scripts/prepack.js platform=win arch=x64 && yarn package -w --x64'
                }
            ];
        } else if (platform == 'mac') {
            architectures = [
                {
                    platform: 'win',
                    arch: 'arm64',
                    command: 'ts-node .erb/scripts/prepack.js platform=win arch=x64 && yarn package -w --arm64'
                },
                {
                    platform: 'linux',
                    arch: 'arm64',
                    command: 'ts-node .erb/scripts/prepack.js platform=linux arch=arm64 && yarn package -l --arm64'
                },
                {
                    platform: 'linux',
                    arch: 'x64',
                    command: 'ts-node .erb/scripts/prepack.js platform=linux arch=x64 && yarn package -l --x64'
                },
                {
                    platform: 'darwin',
                    arch: 'arm64',
                    command: 'ts-node .erb/scripts/prepack.js platform=darwin arch=arm64 && yarn package -m --arm64'
                },
                {
                    platform: 'darwin',
                    arch: 'x64',
                    command: 'ts-node .erb/scripts/prepack.js platform=darwin arch=x64 && yarn package -m --x64'
                }
            ];
        }
    }
}

const buildDirectory = path.join(__dirname, '../../release', 'build');

function renameBuildDirectory(arch) {
    const newDir = path.join(__dirname, '../../release', `${arch}`);
    fs.renameSync(buildDirectory, newDir);
    console.log(`Renamed ${buildDirectory} to ${newDir}`);
}

function executeCommand(command, arch) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr}`);
            } else {
                console.log(`Output: ${stdout}`);
                renameBuildDirectory(arch);
                resolve();
            }
        });
    });
}

async function buildAll() {
    for (const { platform, arch, command } of architectures) {
        console.log(`Building for ${platform}-${arch}...`);
        try {
            await executeCommand(command, `${platform}-${arch}`);
        } catch (error) {
            console.error(error);
        }
    }
}

buildAll();
