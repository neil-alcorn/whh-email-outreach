#!/usr/bin/env node
import { runCommand } from './commands.js';

const result = await runCommand(process.argv.slice(2));

if (result.output) process.stdout.write(result.output);
if (result.error) process.stderr.write(result.error);

process.exitCode = result.exitCode;
