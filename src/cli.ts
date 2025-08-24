#!/usr/bin/env node

import { Command } from 'commander';

import { createProject } from './cli/create.js';
import { runAI } from './cli/run.js';
import { setupDashboard } from './cli/setup.js';
import packageJson from '../package.json' assert { type: 'json' };

const program = new Command();

program
  .name('ai-impact-tracker')
  .description('AI Sustainability Dashboard - Track environmental impact of AI workloads')
  .version(packageJson.version);

program
  .command('create <project-name>')
  .description('Create a new AI sustainability dashboard project')
  .option('-t, --template <template>', 'Template to use (default, minimal, full)', 'default')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (projectName: string, options: { template: string; yes: boolean }) => {
    try {
      await createProject(projectName, options);
      } catch (error) {
    console.error('Error creating project:', error);
    process.exit(1);
  }
  });

program
  .command('run')
  .description('Run an AI script with environmental impact tracking')
  .option('-p, --project <project>', 'Project name for this run', 'default')
  .option('-t, --team <team>', 'Team name for this run', 'default')
  .option('-e, --environment <env>', 'Environment (development, staging, production)', 'development')
  .option('-c, --config <path>', 'Path to dashboard config file')
  .option('--no-track', 'Disable tracking for this run')
  .option('--dry-run', 'Show what would be tracked without actually running')
  .argument('<script...>', 'Script command to run')
  .action(async (script: string[], options: {
    project?: string;
    team?: string;
    environment?: string;
    config?: string;
    track?: boolean;
    dryRun?: boolean;
  }) => {
    try {
      console.log('Debug - Raw options:', options);
      console.log('Debug - Raw script args:', script);
      
      let project = options.project;
      let team = options.team;
      let environment = options.environment;
      
      const scriptArgs = [...script];
      
      if (scriptArgs.length >= 3) {
        const lastThree = scriptArgs.slice(-3);
        if (lastThree[0] !== 'python' && lastThree[1] !== 'test_image_training.py') {
          project = lastThree[0];
          team = lastThree[1];
          environment = lastThree[2];
          
          scriptArgs.splice(-3);
        }
      }
      
      const scriptCommand = scriptArgs.join(' ');
      
      console.log('Script command:', scriptCommand);
      console.log('Project:', project);
      console.log('Team:', team);
      console.log('Environment:', environment);
      
      await runAI(scriptCommand, { ...options, project: project || 'default', team: team || 'default', environment: environment || 'development' });
      } catch (error) {
    console.error('Error running AI script:', error);
    process.exit(1);
  }
  });

program
  .command('setup')
  .description('Setup dashboard for an existing project')
  .option('-c, --config <path>', 'Path to config file')
  .option('-d, --database <url>', 'Database connection URL')
  .option('-p, --port <port>', 'Dashboard port', '3000')
  .action(async (options: { config?: string; database?: string; port?: string }) => {
    try {
      await setupDashboard(options);
      } catch (error) {
    console.error('Error setting up dashboard:', error);
    process.exit(1);
  }
  });

program
  .command('status')
  .description('Show dashboard status and configuration')
  .action(async () => {
    try {
          console.log('Dashboard status command coming soon...');
  } catch (error) {
    console.error('Error getting status:', error);
    process.exit(1);
  }
  });

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
