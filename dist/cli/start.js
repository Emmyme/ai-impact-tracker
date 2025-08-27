import { spawn } from 'child_process';
export async function startSeamless(script, options) {
    const project = options.project || 'default';
    const team = options.team || 'default';
    const environment = options.environment || 'development';
    const autoInstall = options.autoInstall !== false;
    console.log(`📊 Project: ${project}`);
    console.log(`👥 Team: ${team}`);
    console.log(`🌍 Environment: ${environment}`);
    console.log(`🔧 Auto-install: ${autoInstall ? 'enabled' : 'disabled'}`);
    try {
        if (autoInstall) {
            await ensureDependencies();
        }
        const pythonWrapper = createSeamlessWrapper(script, { project, team, environment });
        await executeWrapper(pythonWrapper);
        console.log('✅ AI training completed with environmental tracking!');
    }
    catch (error) {
        console.error('❌ Failed to start AI training:', error);
        throw error;
    }
}
function createSeamlessWrapper(script, metadata) {
    const escapedScript = script.replace(/'/g, "\\'");
    return `
import os, sys, subprocess, time, json
from datetime import datetime
import threading
import queue

# Set up environment variables for the tracking
os.environ['AI_DASHBOARD_PROJECT'] = '${metadata.project}'
os.environ['AI_DASHBOARD_TEAM'] = '${metadata.team}'
os.environ['AI_DASHBOARD_ENVIRONMENT'] = '${metadata.environment}'
os.environ['AI_DASHBOARD_RUN_ID'] = datetime.now().strftime('%Y%m%d_%H%M%S')

print('🌱 AI Impact Tracker - Seamless Mode')
print(f'📊 Project: {metadata.project}')
print(f'👥 Team: {metadata.team}')
print(f'🌍 Environment: {metadata.environment}')
print(f'🆔 Run ID: {os.environ["AI_DASHBOARD_RUN_ID"]}')

# Initialize tracking
try:
    from codecarbon import EmissionsTracker
    tracker = EmissionsTracker(
        project_name='${metadata.project}',
        save_to_file=True,
        output_file=f'./data/{os.environ["AI_DASHBOARD_RUN_ID"]}_emissions.csv',
        log_level='error'
    )
    tracker.start()
    print('✅ Environmental tracking initialized')
except ImportError:
    print('⚠️  CodeCarbon not available - running without tracking')
    tracker = None

# Real-time metrics queue for dashboard updates
metrics_queue = queue.Queue()

def send_metrics_to_dashboard(metrics):
    """Send metrics to dashboard via HTTP"""
    try:
        import requests
        data = {
            'project': '${metadata.project}',
            'team': '${metadata.team}',
            'environment': '${metadata.environment}',
            'run_id': os.environ['AI_DASHBOARD_RUN_ID'],
            'timestamp': datetime.now().isoformat(),
            **metrics
        }
        
        # Try to send to local dashboard
        response = requests.post(
            'http://localhost:8000/api/metrics',
            json=data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if response.status_code == 200:
            print('📈 Metrics sent to dashboard')
        else:
            print(f'⚠️  Dashboard response: {response.status_code}')
            
    except Exception as e:
        print(f'⚠️  Could not send to dashboard: {e}')

def monitor_process(process, start_time):
    """Monitor the AI process and collect metrics"""
    try:
        while process.poll() is None:
            time.sleep(5)  # Check every 5 seconds
            
            # Calculate current metrics
            elapsed = time.time() - start_time
            
            if tracker:
                # Get current emissions estimate
                current_emissions = tracker._emissions_data.get_emissions_data()
                energy_consumed = current_emissions.get('energy_consumed', 0)
                emissions = current_emissions.get('emissions', 0)
            else:
                energy_consumed = elapsed * 0.1  # Rough estimate
                emissions = energy_consumed * 0.5
            
            metrics = {
                'energy_consumed': energy_consumed,
                'emissions': emissions,
                'duration': elapsed,
                'status': 'running'
            }
            
            # Send periodic updates
            send_metrics_to_dashboard(metrics)
            
    except Exception as e:
        print(f'⚠️  Monitoring error: {e}')

# Start the AI script
script_command = '${escapedScript}'
print(f'▶️  Running: {script_command}')
start_time = time.time()

try:
    # Run the script with real-time output
    process = subprocess.Popen(
        script_command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    # Start monitoring in background
    monitor_thread = threading.Thread(
        target=monitor_process,
        args=(process, start_time),
        daemon=True
    )
    monitor_thread.start()
    
    # Stream output in real-time
    for line in process.stdout:
        print(line.rstrip())
    
    # Wait for completion
    return_code = process.wait()
    end_time = time.time()
    
    # Final metrics
    if tracker:
        emissions = tracker.stop()
        energy_consumed = emissions
        co2_emissions = emissions * 0.5
    else:
        duration = end_time - start_time
        energy_consumed = duration * 0.1
        co2_emissions = energy_consumed * 0.5
    
    print(f'⚡ Energy consumed: {energy_consumed:.4f} kWh')
    print(f'🌱 CO2 emissions: {co2_emissions:.4f} g')
    print(f'⏱️  Duration: {end_time - start_time:.2f} seconds')
    
    # Send final metrics
    final_metrics = {
        'energy_consumed': energy_consumed,
        'emissions': co2_emissions,
        'duration': end_time - start_time,
        'status': 'completed' if return_code == 0 else 'failed',
        'exit_code': return_code
    }
    
    send_metrics_to_dashboard(final_metrics)
    
    if return_code == 0:
        print('✅ AI training completed successfully')
    else:
        print(f'❌ AI training failed with exit code: {return_code}')
    
    sys.exit(return_code)
    
except Exception as e:
    if tracker:
        tracker.stop()
    print(f'❌ Error running AI script: {e}')
    sys.exit(1)
`;
}
async function ensureDependencies() {
    console.log('🔧 Checking Python dependencies...');
    return new Promise((resolve, reject) => {
        const checkCommand = `python -c "
try:
    import codecarbon
    import requests
    print('✅ All dependencies available')
except ImportError as e:
    print(f'❌ Missing: {e}')
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
                console.log('✅ Dependencies ready');
                resolve();
            }
            else {
                console.log('📦 Installing required dependencies...');
                installDependencies().then(resolve).catch(reject);
            }
        });
        checkChild.on('error', () => {
            console.log('📦 Installing required dependencies...');
            installDependencies().then(resolve).catch(reject);
        });
    });
}
async function installDependencies() {
    return new Promise((resolve, reject) => {
        console.log('📦 Installing codecarbon and requests...');
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
async function executeWrapper(pythonCode) {
    return new Promise((resolve, reject) => {
        const child = spawn('python', ['-c', pythonCode], {
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
                reject(new Error(`AI training exited with code ${code}`));
            }
        });
        child.on('error', (error) => {
            reject(error);
        });
    });
}
//# sourceMappingURL=start.js.map