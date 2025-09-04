#!/usr/bin/env node

import { Command } from 'commander';
import { spawn } from 'child_process';
import { createProject } from './cli/create.js';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import packageJson from '../package.json' assert { type: 'json' };


dotenv.config();

const program = new Command();

program
  .name('ai-impact-tracker')
  .description('Track environmental impact of AI workloads')
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
  .argument('<script...>', 'AI script to run (e.g., python train.py)')
  .option('-p, --project <name>', 'Project name')
  .option('-t, --team <name>', 'Team name')
  .option('-e, --environment <env>', 'Environment')
  .option('--dashboard-url <url>', 'Dashboard URL', 'http://localhost:8000')
  .action(async (script: string[], options: { project?: string; team?: string; environment?: string; dashboardUrl?: string }) => {
    try {
      const scriptCommand = script.join(' ');
      
      // Interactive prompts for missing options
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'project',
          message: 'Project name:',
          default: options.project || 'default',
          when: !options.project
        },
        {
          type: 'input',
          name: 'team',
          message: 'Team name:',
          default: options.team || 'default',
          when: !options.team
        },
        {
          type: 'list',
          name: 'environment',
          message: 'Environment:',
          choices: ['development', 'staging', 'production'],
          default: options.environment || 'development',
          when: !options.environment
        }
      ]);
      
      const project = options.project || answers.project;
      const team = options.team || answers.team;
      const environment = options.environment || answers.environment;
      const dashboardUrl = options.dashboardUrl || process.env.DASHBOARD_URL || 'http://localhost:8000';
      
      console.log('AI Impact Tracker');
      console.log(`Project: ${project}`);
      console.log(`Team: ${team}`);
      console.log(`Environment: ${environment}`);
      console.log(`Dashboard: ${dashboardUrl}`);
      console.log(`Running: ${scriptCommand}`);
      
      // Check and install required Python dependencies
      console.log('Checking Python dependencies...');
      try {
        await checkAndInstallDependencies();
      } catch (error) {
        console.log("Couldn't install dependencies, continuing anyway...");
      }
      
      // Create Python wrapper that handles tracking and sends data to dashboard
      const pythonWrapper = `
import os, sys, subprocess, time, requests
from datetime import datetime

# Set environment variables
os.environ['AI_DASHBOARD_PROJECT'] = '${project}'
os.environ['AI_DASHBOARD_TEAM'] = '${team}'
os.environ['AI_DASHBOARD_ENVIRONMENT'] = '${environment}'
os.environ['AI_DASHBOARD_RUN_ID'] = datetime.now().strftime('%Y%m%d_%H%M%S')

print('Starting environmental tracking...')

# Initialize both trackers
energy_consumed = 0.0
co2_emissions = 0.0
water_usage = 0.0

try:
    from codecarbon import EmissionsTracker
    from carbontracker.tracker import CarbonTracker
    
    # CodeCarbon
    tracker = EmissionsTracker(
        project_name='${project}',
        save_to_file=True,
        output_file=f'./data/{os.environ["AI_DASHBOARD_RUN_ID"]}_emissions.csv',
        log_level='error'
    )
    
    # CarbonTracker
    carbon_tracker = CarbonTracker(
        epochs=1,
        monitor_epochs=1,
        update_interval=1,
        log_dir='./data',
        verbose=2,
        ignore_errors=True
    )
    
    tracker.start()
    carbon_tracker.epoch_start()
    print('CodeCarbon and CarbonTracker tracking initialized')
except ImportError as e:
    print(f'Tracking libraries not available: {e}')
    tracker = None
    carbon_tracker = None

# Run the script
start_time = time.time()
cmd = ${JSON.stringify(script)}
print(f'Executing: {" ".join(cmd)}')

try:
    result = subprocess.run(cmd, check=False)
    end_time = time.time()
    duration = end_time - start_time
    
    # Stop tracking and get measurements
    if carbon_tracker:
        carbon_tracker.epoch_end()
    
    if tracker:
        emissions = tracker.stop()
        if emissions is not None and isinstance(emissions, (int, float)) and emissions > 0:
            energy_consumed = float(emissions)
            co2_emissions = energy_consumed * 0.5  # kg CO2 per kWh (typical grid mix)
            water_usage = 0.0   # No water usage for local AI training (air cooling)
            print(f'CodeCarbon measured energy: {energy_consumed:.6f} kWh')
            print(f'CO2 emissions: {co2_emissions:.6f} kg')
            print(f'Water usage: {water_usage:.6f} L (local training - no water cooling)')
        else:
            print('CodeCarbon returned no valid data - using zeros')
            energy_consumed = 0.0
            co2_emissions = 0.0
            water_usage = 0.0
    else:
        print('No tracking available - using zeros')
        energy_consumed = 0.0
        co2_emissions = 0.0
        water_usage = 0.0
    
    print(f'Energy consumed: {energy_consumed:.6f} kWh')
    print(f'CO2 emissions: {co2_emissions:.6f} g')
    print(f'Water usage: {water_usage:.6f} L')
    print(f'Duration: {duration:.2f} seconds')
    
    # Send data to dashboard
    try:
        # First try to authenticate
        username = os.environ.get('DASHBOARD_USERNAME', 'admin')
        password = os.environ.get('DASHBOARD_PASSWORD', 'admin123')
        login_data = {'username': username, 'password': password}
        login_response = requests.post('${dashboardUrl}/api/auth/login', json=login_data, timeout=10)
        
        if login_response.status_code == 200:
            token = login_response.json().get('access_token')
            if token:
                data = {
                    'project': '${project}',
                    'team': '${team}',
                    'environment': '${environment}',
                    'energy_consumed': energy_consumed,
                    'emissions': co2_emissions,
                    'water_usage': water_usage,
                    'duration': duration,
                    'timestamp': datetime.now().isoformat()
                }
                print(f'Sending metrics to dashboard: {data}')
                headers = {'Authorization': f'Bearer {token}'}
                response = requests.post('${dashboardUrl}/api/metrics', json=data, headers=headers, timeout=10)
                if response.status_code == 200:
                    print('Data sent to dashboard successfully!')
                else:
                    print(f'Dashboard response: {response.status_code}')
            else:
                print('No access token received')
        else:
            print(f'Could not authenticate: {login_response.status_code}')
    except Exception as e:
        print(f'Could not send to dashboard: {e}')
    
    if result.returncode == 0:
        print('AI training completed successfully')
    else:
        print(f'AI training failed (exit code: {result.returncode})')
    
    sys.exit(result.returncode)
    
except Exception as e:
    if carbon_tracker:
        try:
            carbon_tracker.epoch_end()
        except:
            pass
    if tracker:
        try:
            tracker.stop()
        except:
            pass
    print(f'Error: {e}')
    sys.exit(1)
`;

      // Write Python wrapper to temporary file and execute it
      const tempFile = path.join(os.tmpdir(), `ai-tracker-${Date.now()}.py`);
      await fs.writeFile(tempFile, pythonWrapper);
      
      const child = spawn('python', [tempFile], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PYTHONPATH: process.cwd() }
      });
      
      child.on('close', async (code) => {
        // Clean up temp file
        try {
          await fs.remove(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (code !== 0) {
          console.error(`AI training failed with exit code ${code}`);
          process.exit(code);
        }
      });
      
      child.on('error', async (error) => {
        // Clean up temp file
        try {
          await fs.remove(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        console.error('Failed to start AI training:', error);
        process.exit(1);
      });
      
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

async function checkAndInstallDependencies(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // Check if required packages are installed
    const checkCommand = `python -c "
try:
    import carbontracker
    import requests
    import codecarbon

    print('All dependencies available')
except ImportError as e:
    print(f'Missing dependency: {e}')
    exit(1)
"`;

    const checkChild = spawn('python', ['-c', checkCommand], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    checkChild.stdout?.on('data', (data) => {
      output += data.toString();
    });

    checkChild.on('close', async (code) => {
      if (code === 0) {
        console.log('Dependencies ready');
        resolve();
      } else {
        // Ask for permission to install dependencies
        const { installDeps } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'installDeps',
            message: 'Missing dependencies (carbontracker, codecarbon, requests). Install them now?',
            default: true
          }
        ]);
        
        if (installDeps) {
          console.log('Installing required dependencies...');
          installDependencies().then(resolve).catch(reject);
        } else {
          console.log('Skipping dependency installation. The script will not be able to track the environmental impact.');
          resolve();
        }
      }
    });

    checkChild.on('error', async () => {
      // Ask for permission to install dependencies
      const { installDeps } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'installDeps',
          message: 'Missing dependencies (carbontracker, codecarbon, requests). Install them now?',
          default: true
        }
      ]);
      
      if (installDeps) {
        console.log('Installing required dependencies...');
        installDependencies().then(resolve).catch(reject);
      } else {
        console.log('Skipping dependency installation. Some features may not work.');
        resolve();
      }
    });
  });
}

async function installDependencies(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Installing carbontracker, codecarbon, and requests...');
    
    const installChild = spawn('pip', ['install', 'carbontracker', 'codecarbon', 'requests'], {
      stdio: 'inherit',
      shell: true
    });

    installChild.on('close', (code) => {
      if (code === 0) {
        console.log('Dependencies installed successfully');
        resolve();
      } else {
        reject(new Error(`Failed to install dependencies (exit code: ${code})`));
      }
    });

    installChild.on('error', (error) => {
      reject(new Error(`Failed to install dependencies: ${error.message}`));
    });
  });
}

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
