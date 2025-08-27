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
    .action(async (projectName, options) => {
    try {
        await createProject(projectName, options);
    }
    catch (error) {
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
    .action(async (script, options) => {
    try {
        const scriptCommand = script.join(' ');
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
        console.log('🔧 Checking Python dependencies...');
        try {
            await checkAndInstallDependencies();
        }
        catch (error) {
            console.log("Couldn't install dependencies, continuing anyway...");
        }
        const pythonWrapper = `
import os, sys, subprocess, time, requests
from datetime import datetime

# Set environment variables
os.environ['AI_DASHBOARD_PROJECT'] = '${project}'
os.environ['AI_DASHBOARD_TEAM'] = '${team}'
os.environ['AI_DASHBOARD_ENVIRONMENT'] = '${environment}'
os.environ['AI_DASHBOARD_RUN_ID'] = datetime.now().strftime('%Y%m%d_%H%M%S')

print('Starting environmental tracking...')

# Try to use CodeCarbon if available
try:
    from codecarbon import EmissionsTracker
    tracker = EmissionsTracker(
        project_name='${project}',
        save_to_file=True,
        output_file=f'./data/{os.environ["AI_DASHBOARD_RUN_ID"]}_emissions.csv',
        log_level='error'
    )
    tracker.start()
    print('CodeCarbon tracking initialized')
except ImportError:
    print('CodeCarbon not available - using basic timing')
    tracker = None

# Run the AI script
start_time = time.time()
cmd = ${JSON.stringify(script)}
print(f'Executing: {" ".join(cmd)}')

try:
    result = subprocess.run(cmd, check=False)
    end_time = time.time()
    duration = end_time - start_time
    
    # Calculate metrics
    if tracker:
        emissions = tracker.stop()
        energy_consumed = emissions
        co2_emissions = emissions * 0.5
    else:
        energy_consumed = duration * 0.1  # Rough estimate
        co2_emissions = energy_consumed * 0.5
    
    # Calculate water usage (cooling for data centers)
    water_usage = energy_consumed * 2.0  # Rough estimate: 2L per kWh
    
    print(f'Energy consumed: {energy_consumed:.4f} kWh')
    print(f'CO2 emissions: {co2_emissions:.4f} g')
    print(f'Water usage: {water_usage:.4f} L')
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
    if tracker:
        tracker.stop()
    print(f'Error: {e}')
    sys.exit(1)
`;
        const tempFile = path.join(os.tmpdir(), `ai-tracker-${Date.now()}.py`);
        await fs.writeFile(tempFile, pythonWrapper);
        const child = spawn('python', [tempFile], {
            stdio: 'inherit',
            shell: true,
            env: { ...process.env, PYTHONPATH: process.cwd() }
        });
        child.on('close', async (code) => {
            try {
                await fs.remove(tempFile);
            }
            catch (e) {
            }
            if (code !== 0) {
                console.error(`AI training failed with exit code ${code}`);
                process.exit(code);
            }
        });
        child.on('error', async (error) => {
            try {
                await fs.remove(tempFile);
            }
            catch (e) {
            }
            console.error('Failed to start AI training:', error);
            process.exit(1);
        });
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
async function checkAndInstallDependencies() {
    return new Promise(async (resolve, reject) => {
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
            }
            else {
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
                }
                else {
                    console.log('Skipping dependency installation. The script will not be able to track the environmental impact.');
                    resolve();
                }
            }
        });
        checkChild.on('error', async () => {
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
            }
            else {
                console.log('Skipping dependency installation. Some features may not work.');
                resolve();
            }
        });
    });
}
async function installDependencies() {
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
            }
            else {
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
//# sourceMappingURL=cli.js.map