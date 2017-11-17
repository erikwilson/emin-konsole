#!/usr/bin/env node
// Copyright 2017 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =============================================================================

const path = require('path');
const spawn = require('cross-spawn');
const opn = require('opn');

const demoPath = process.argv[2];
const outputPath = path.join('.', 'bundle.js')

const cmd = path.join('node_modules', '.bin', 'watchify');
const watchify = spawn(cmd, [demoPath, '-p', '[tsify]', '-v', '--debug',
    '-iw', 'test/*', '-o' , outputPath], {detached: false});
watchify.stdout.pipe(process.stdout);
watchify.stderr.pipe(process.stderr);

let httpServerStarted = false;

console.log('Waiting for initial compile...');
watchify.stderr.on('data', (data) => {
  if (data.toString().includes(`bytes written to`)) {
    if (!httpServerStarted) {
      const httpCmd = path.join('node_modules', '.bin', 'http-server');
      const httpServer = spawn(httpCmd, ['-c-1'], { detached: false});

      httpServer.stdout.on('data', data => {
        data = data.toString().split('\n')[0].trim()
        if (data.startsWith('http://127.0.0.1:')) {
          // Open a browser pointing to the demo.
          opn(path.join(data, demoPath));
        }
      });

      httpServer.stdout.pipe(process.stdout);
      httpServer.stderr.pipe(process.stderr);
      httpServerStarted = true;
    }
  }
});
