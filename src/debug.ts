export class DebugSystem {
  private fpsElement: HTMLElement;
  private isVisible: boolean = false;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 0;
  private updateInterval: number = 500; // Update FPS display every 500ms
  private onToggleCallback?: () => void;

  constructor() {
    this.createFPSElement();
    this.setupEventListeners();
  }

  private createFPSElement(): void {
    // Create FPS counter element
    this.fpsElement = document.createElement('div');
    this.fpsElement.id = 'fpsCounter';
    this.fpsElement.className = 'fps-counter hidden';
    this.fpsElement.innerHTML = 'FPS: 0';
    document.body.appendChild(this.fpsElement);
  }

  private setupEventListeners(): void {
    // F3 key to toggle FPS counter
    document.addEventListener('keydown', (event) => {
      if (event.key === 'F3') {
        event.preventDefault();
        this.toggleFPS();
      }
    });
  }

  public toggleFPS(): void {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.fpsElement.classList.remove('hidden');
      console.log('FPS counter enabled (Press F3 to toggle)');
    } else {
      this.fpsElement.classList.add('hidden');
      console.log('FPS counter disabled');
    }

    // Notify callback if set
    if (this.onToggleCallback) {
      this.onToggleCallback();
    }
  }

  public updateFPS(): void {
    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // Update FPS display every updateInterval milliseconds
    if (deltaTime >= this.updateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      
      if (this.isVisible) {
        this.fpsElement.innerHTML = `FPS: ${this.fps}`;
        
        // Color coding based on FPS
        this.fpsElement.className = 'fps-counter';
        if (this.fps >= 50) {
          this.fpsElement.classList.add('fps-good');
        } else if (this.fps >= 30) {
          this.fpsElement.classList.add('fps-ok');
        } else {
          this.fpsElement.classList.add('fps-poor');
        }
      }

      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  public getFPS(): number {
    return this.fps;
  }

  public isDebugVisible(): boolean {
    return this.isVisible;
  }

  public setOnToggleCallback(callback: () => void): void {
    this.onToggleCallback = callback;
  }

  public dispose(): void {
    if (this.fpsElement && this.fpsElement.parentNode) {
      this.fpsElement.parentNode.removeChild(this.fpsElement);
    }
  }
}
