import { spawn } from 'child_process';
export async function runAI(script, options) {
    console.log('Starting AI workload tracking...');
    try {
        const scriptParts = script.split(' ');
        const command = scriptParts[0];
        const args = scriptParts.slice(1);
        if (options.dryRun) {
            console.log('Dry run mode - would track:');
            console.log(`Command: ${command} ${args.join(' ')}`);
            console.log(`Project: ${options.project || 'default'}`);
            console.log(`Team: ${options.team || 'default'}`);
            console.log(`Environment: ${options.environment || 'development'}`);
            return;
        }
        if (options.track === false) {
            console.log('Running AI script without tracking...');
            if (command) {
                await runScript(command, args);
            }
            console.log('AI script completed successfully');
            return;
        }
        console.log('Running AI script with environmental tracking...');
        await runTrackingCode(script, options);
        console.log('AI script completed with tracking');
    }
    catch (error) {
        console.error('Failed to run AI script');
        throw error;
    }
}
async function runTrackingCode(script, options) {
    const project = options.project || 'default';
    const team = options.team || 'default';
    const environment = options.environment || 'development';
    console.log('Debug - Project name:', project);
    console.log('Debug - Team name:', team);
    console.log('Debug - Environment:', environment);
    await ensureDependencies();
    const pythonCommand = `python -c "
import os, sys, subprocess, time
from datetime import datetime
from codecarbon import EmissionsTracker
import requests, json

print('🚀 Starting environmental impact tracking...')
print(f'📊 Project: \\'${project}\\'')
print(f'👥 Team: \\'${team}\\'')
print(f'🌍 Environment: \\'${environment}\\'')

os.environ['AI_DASHBOARD_PROJECT'] = '${project}'
os.environ['AI_DASHBOARD_TEAM'] = '${team}'
os.environ['AI_DASHBOARD_ENVIRONMENT'] = '${environment}'

tracker = EmissionsTracker(project_name='${project}', save_to_file=True, output_file='./data/emissions.csv', log_level='error')
tracker.start()

try:
    print(f'▶️  Running: \\'${script}\\'')
    result = subprocess.run('${script}', shell=True, check=False, timeout=300, capture_output=True, text=True)
    
    if result.stdout: print(f'📤 Script output: {result.stdout}')
    if result.stderr: print(f'⚠️  Script errors: {result.stderr}')
    
    emissions = tracker.stop()
    
    if result.returncode == 0: print('✅ AI script completed successfully')
    else: print(f'❌ AI script failed with exit code: {result.returncode}')
    
    print(f'⚡ Energy consumed: {emissions:.4f} kWh')
    print(f'🌱 CO2 emissions: {emissions * 0.5:.4f} g')
    
    # Send to dashboard
    try:
        login_response = requests.post('http://localhost:8000/api/auth/login', json={'username': 'admin', 'password': 'admin123'}, timeout=10)
        if login_response.status_code == 200:
            token = login_response.json().get('access_token')
            if token:
                data = {'project': '${project}', 'team': '${team}', 'environment': '${environment}', 'energy_consumed': emissions, 'emissions': emissions * 0.5, 'duration': 0.1, 'timestamp': datetime.now().isoformat(), 'water_usage': emissions * 2.0}
                response = requests.post('http://localhost:8000/api/metrics', json=data, headers={'Authorization': f'Bearer {token}'}, timeout=10)
                if response.status_code == 200: print('📈 Data sent to dashboard successfully')
                else: print(f'⚠️  Failed to send data: {response.status_code}')
            else: print('⚠️  No access token received')
        else: print(f'⚠️  Could not authenticate: {login_response.status_code}')
    except Exception as e: print(f'⚠️  Could not send data to dashboard: {e}')
    
    sys.exit(result.returncode)
except Exception as e:
    tracker.stop()
    print(f'❌ Tracking error: {e}')
    sys.exit(1)
"`;
    return new Promise((resolve, reject) => {
        const child = spawn('python', ['-c', pythonCommand], {
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                PYTHONPATH: process.cwd()
            }
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`Tracking script exited with code ${code}`));
            }
        });
        child.on('error', (error) => {
            reject(error);
        });
    });
}
async function ensureDependencies() {
    console.log('🔧 Checking and installing required Python dependencies...');
    return new Promise((resolve, reject) => {
        const checkCommand = `python -c "
try:
    import codecarbon
    import requests
    print('✅ All dependencies are already installed')
except ImportError as e:
    print(f'❌ Missing dependency: {e}')
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
        checkChild.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Dependencies are ready');
                resolve();
            }
            else {
                console.log('📦 Installing required dependencies...');
                installDependencies().then(resolve).catch(reject);
            }
        });
        checkChild.on('error', (error) => {
            console.log('📦 Installing required dependencies...');
            installDependencies().then(resolve).catch(reject);
        });
    });
}
async function installDependencies() {
    return new Promise((resolve, reject) => {
        const installChild = spawn('pip', ['install', 'codecarbon', 'requests'], {
            stdio: 'inherit',
            shell: true
        });
        installChild.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Dependencies installed successfully');
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
async function runScript(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`Script exited with code ${code}`));
            }
        });
        child.on('error', (error) => {
            reject(error);
        });
    });
}
//# sourceMappingURL=run.js.map