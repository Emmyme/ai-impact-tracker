import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

interface RunOptions {
  project?: string;
  team?: string;
  environment?: string;
  config?: string;
  track?: boolean;
  dryRun?: boolean;
}

export async function runAI(script: string, options: RunOptions): Promise<void> {
  console.log('Starting AI workload tracking...');
  
  try {
    // Parse the script command
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

    // Check if tracking is disabled
    if (options.track === false) {
      console.log('Running AI script without tracking...');
      if (command) {
        await runScript(command, args);
      }
      console.log('AI script completed successfully');
      return;
    }

    // Create tracking wrapper
    const trackingScript = await createTrackingWrapper(script, options);
    
    console.log('Running AI script with environmental tracking...');
    
    // Run the tracking wrapper
    await runTrackingScript(trackingScript, options);
    
    console.log('AI script completed with tracking');
    
  } catch (error) {
    console.error('Failed to run AI script');
    throw error;
  }
}

async function createTrackingWrapper(script: string, options: RunOptions): Promise<string> {
  const project = options.project || 'default';
  const team = options.team || 'default';
  const environment = options.environment || 'development';
  
  console.log('Debug - Project name:', project);
  console.log('Debug - Team name:', team);
  console.log('Debug - Environment:', environment);
  
  // Create a Python tracking wrapper
  const trackingCode = `
import os
import sys
import subprocess
import time
from datetime import datetime
from codecarbon import EmissionsTracker
from carbontracker.tracker import CarbonTracker

# Set environment variables for tracking
os.environ['AI_DASHBOARD_PROJECT'] = '${project}'
os.environ['AI_DASHBOARD_TEAM'] = '${team}'
os.environ['AI_DASHBOARD_ENVIRONMENT'] = '${environment}'

# Initialize tracking
tracker = EmissionsTracker(
    project_name='${project}',
    save_to_file=True,
    output_file='./data/emissions.csv'
)

carbon_tracker = CarbonTracker(
    epochs=1,
    monitor_epochs=1,
    update_interval=1,
    log_dir='./data',
    verbose=2,
    ignore_errors=True
)

print("Starting environmental impact tracking...")
print(f"Project: '${project}'")
print(f"Team: '${team}'")
print(f"Environment: '${environment}'")

def sendToDashboard(emissions, carbon_tracker):
    try:
        import requests
        import json
        
        data = {
            "project": "${project}",
            "team": "${team}",
            "environment": "${environment}",
            "energy_consumed": emissions,
            "emissions": emissions * 0.5,  # kg CO2 per kWh (typical grid mix)
            "duration": 0.1,  # Default duration
            "timestamp": datetime.now().isoformat(),
            "gpu_energy": getattr(carbon_tracker, 'intensity', 0),
            "cpu_energy": getattr(carbon_tracker, 'cpu_intensity', 0),
            "water_usage": emissions * 2.0  # L per kWh (typical data center cooling)
        }
        
        # Send to local dashboard API
        response = requests.post(
            "http://localhost:8000/api/metrics",
            json=data,
            timeout=5
        )
        
        if response.status_code == 200:
            print("Data sent to dashboard successfully")
        else:
            print(f"Failed to send data to dashboard: {response.status_code}")
            
    except Exception as e:
        print(f"Could not send data to dashboard: {e}")

# Start tracking
tracker.start()
carbon_tracker.epoch_start()

try:
    # Run the original script
    print(f"Running: '${script}'")
    result = subprocess.run('${script}', shell=True, check=False, timeout=30, capture_output=True, text=True)
    
    # Print the script output
    if result.stdout:
        print(f"Script output: {result.stdout}")
    if result.stderr:
        print(f"Script errors: {result.stderr}")
    
    # Stop tracking
    carbon_tracker.epoch_end()
    emissions = tracker.stop()
    
    if result.returncode == 0:
        print("AI script completed successfully")
    else:
        print(f"AI script failed with exit code: {result.returncode}")
    
    print(f"Energy consumed: {emissions:.4f} kWh")
    print(f"CO2 emissions: {emissions * 0.0005:.4f} kg")  # Rough estimate
    
    # Send data to dashboard API
    sendToDashboard(emissions, carbon_tracker)
    
except subprocess.CalledProcessError as e:
    carbon_tracker.epoch_end()
    tracker.stop()
    print(f"❌ AI script failed with exit code: {e.returncode}")
    sys.exit(e.returncode)
except Exception as e:
    carbon_tracker.epoch_end()
    tracker.stop()
    print(f"❌ Tracking error: {e}")
    sys.exit(1)
`;

  // Write tracking script to temporary file
  const trackingScriptPath = path.join(process.cwd(), 'temp_tracking_script.py');
  await fs.writeFile(trackingScriptPath, trackingCode);
  
  return trackingScriptPath;
}

async function runScript(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTrackingScript(scriptPath: string, options: RunOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('python', [scriptPath], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PYTHONPATH: process.cwd()
      }
    });
    
    child.on('close', (code) => {
      // Clean up temporary script
      fs.remove(scriptPath).catch(() => {});
      
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tracking script exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      // Clean up temporary script
      fs.remove(scriptPath).catch(() => {});
      reject(error);
    });
  });
}
