import { spawn } from 'child_process';
import { existsSync } from 'fs';

/**
 * Custom Vite plugin to run a PHP development server.
 * @param {object} options - Plugin configuration options.
 * @param {number} [options.port=8000] - The port for the PHP server.
 * @param {string} [options.baseDir='public'] - The document root for the PHP server.
 * @returns {import('vite').Plugin}
 */
export function phpServerPlugin(options = {}) {
    let phpProcess;

    // Set default values
    const {
        port = 8000,
        host = '127.0.0.1',
        baseDir = ''
    } = options;

    return {
        name: 'php-server-runner',
        enforce: 'pre',

        // Hook called when the dev server is starting
        configureServer(server) {
            if (server.config.command === 'serve') {
                console.log(`\nStarting PHP Dev Server on port ${port}, serving from ${baseDir ? baseDir : 'current directory'}...`);

                // Command: php -S <host>:<port> <baseDir>/index.php
                const indexFile = `${baseDir}${baseDir.length > 0 && !baseDir.endsWith('/') ? '/' : ''}index.php`;

                if (!existsSync(indexFile)) {
                    console.error(`Error: ${indexFile} not found. Please ensure the baseDir is correct.`);
                    return;
                }

                if (phpProcess) {
                    console.log('PHP Development Server is already running.');
                    return;
                }

                console.log(`Running command: php -S ${host}:${port} ${indexFile}`);

                phpProcess = spawn('php', ['-S', `${host}:${port}`, indexFile], {
                    stdio: 'inherit'
                });

                phpProcess.on('error', (err) => {
                    console.error('PHP server failed to start:', err);
                });
                
            }
        },

        // Hook called when the dev server is closing
        closeBundle() {
            if (phpProcess) {
                console.log('Stopping PHP Development Server...');
                phpProcess.kill();
                phpProcess = null;
            } else {
                console.log('PHP Development Server was not running.');
            }
        }
    };
}