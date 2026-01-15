import os
import subprocess
import sys
import time
import threading
import signal

# Configuration
BACKEND_DIR = os.path.join("rust-sistemi", "new-api")
FRONTEND_DIR = "rust-sistemi"
BACKEND_PORT = 4001
FRONTEND_PORT = 1420

stop_event = threading.Event()

def watch_backend():
    """
    Runs 'cargo run' for the backend and restarts it if files in src/ change.
    """
    print(f"[Backend] Starting Watcher in {BACKEND_DIR}...")
    
    src_path = os.path.join(BACKEND_DIR, "src")
    if not os.path.exists(src_path):
        # Adjust for absolute path if needed
        base = os.path.dirname(os.path.abspath(__file__))
        src_path = os.path.join(base, BACKEND_DIR, "src")
        cwd = os.path.join(base, BACKEND_DIR)
    else:
        cwd = BACKEND_DIR

    # Helper to get max mtime
    def get_max_mtime():
        max_mtime = 0
        for root, dirs, files in os.walk(src_path):
            for file in files:
                if file.endswith(".rs") or file.endswith(".toml"):
                    try:
                        mtime = os.stat(os.path.join(root, file)).st_mtime
                        if mtime > max_mtime:
                            max_mtime = mtime
                    except:
                        pass
        return max_mtime

    last_mtime = get_max_mtime()
    process = None

    def start_cargo():
        print("[Backend] Compiling and Running...")
        # Kill any existing new-api.exe processes first
        subprocess.run("taskkill /F /IM new-api.exe", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.5)  # Give it a moment to clean up
        # Use shell=True to find cargo in path easily, keeping env
        return subprocess.Popen(["cargo", "run"], cwd=cwd, shell=True) # shell=True for windows

    process = start_cargo()

    while not stop_event.is_set():
        time.sleep(1)
        current_mtime = get_max_mtime()
        if current_mtime > last_mtime:
            print("[Backend] Change detected! Restarting server...")
            last_mtime = current_mtime
            
            # Kill previous process
            if process:
                # Windows kill
                subprocess.run(f"taskkill /F /T /PID {process.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                process.wait()
            
            process = start_cargo()
            
    if process:
         subprocess.run(f"taskkill /F /T /PID {process.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def run_frontend():
    """
    Runs 'npm run dev' for the frontend.
    """
    print(f"[Frontend] Starting Vite in {FRONTEND_DIR}...")
    base = os.path.dirname(os.path.abspath(__file__))
    cwd = os.path.join(base, FRONTEND_DIR)
    
    # Check dependencies
    if not os.path.exists(os.path.join(cwd, "node_modules")):
        print("[Frontend] Installing dependencies...")
        subprocess.run(["npm", "install"], cwd=cwd, shell=True, check=True)

    process = subprocess.Popen(["npm", "run", "dev"], cwd=cwd, shell=True)
    process.wait()

def main():
    print("==================================================")
    print("   Məzuniyyət İdarəetmə Sistemi - Full Stack Dev")
    print("==================================================")
    print(f"Backend: http://localhost:{BACKEND_PORT}")
    print(f"Frontend: http://localhost:{5173} (Default)")
    print("Logs will appear below. Press Ctrl+C to stop.")
    print("==================================================\n")

    # Start Backend Watcher in a thread
    # Start Backend Watcher in a thread
    # backend_thread = threading.Thread(target=watch_backend)
    # backend_thread.daemon = True
    # backend_thread.start()
    print("[Backend] Remote Server Configured (Skipping Local Backend)")

    # Start Frontend in this main thread (or another)
    # Better to run frontend in main thread to capture its output easily, 
    # but npm run dev is blocking.
    
    # We want to handle Ctrl+C gracefully
    try:
        run_frontend()
    except KeyboardInterrupt:
        print("\nStopping services...")
        stop_event.set()
        # Give time for threads to clean up
        time.sleep(1)
        sys.exit(0)

if __name__ == "__main__":
    main()
