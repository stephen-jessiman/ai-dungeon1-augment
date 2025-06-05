/**
 * Debug system for monitoring game performance and providing development tools.
 * Includes FPS counter with color-coded performance indicators and keyboard shortcuts.
 *
 * @example
 * ```typescript
 * const debugSystem = new DebugSystem();
 * // FPS counter can be toggled with F3 key or programmatically
 * debugSystem.toggleFPS();
 * ```
 */
export class DebugSystem {
  /** HTML element displaying the FPS counter */
  private fpsElement: HTMLElement;

  /** Whether the debug information is currently visible */
  private isVisible: boolean = false;

  /** Number of frames rendered since last FPS calculation */
  private frameCount: number = 0;

  /** Timestamp of the last FPS calculation */
  private lastTime: number = performance.now();

  /** Current frames per second value */
  private fps: number = 0;

  /** Interval in milliseconds between FPS display updates */
  private updateInterval: number = 500; // Update FPS display every 500ms

  /** Optional callback function called when FPS counter is toggled */
  private onToggleCallback?: () => void;

  /**
   * Creates a new DebugSystem instance.
   * Automatically creates the FPS display element and sets up keyboard listeners.
   */
  constructor() {
    this.createFPSElement();
    this.setupEventListeners();
  }

  /**
   * Creates and initializes the FPS counter HTML element.
   * The element is initially hidden and styled with CSS classes.
   * @private
   */
  private createFPSElement(): void {
    // Create FPS counter element
    this.fpsElement = document.createElement('div');
    this.fpsElement.id = 'fpsCounter';
    this.fpsElement.className = 'fps-counter hidden';
    this.fpsElement.innerHTML = 'FPS: 0';
    document.body.appendChild(this.fpsElement);
  }

  /**
   * Sets up keyboard event listeners for debug system controls.
   * Currently handles F3 key for toggling FPS counter visibility.
   * @private
   */
  private setupEventListeners(): void {
    // F3 key to toggle FPS counter
    document.addEventListener('keydown', (event) => {
      if (event.key === 'F3') {
        event.preventDefault();
        this.toggleFPS();
      }
    });
  }

  /**
   * Toggles the visibility of the FPS counter.
   * Shows or hides the FPS display and logs the current state to console.
   * Calls the registered toggle callback if one is set.
   *
   * @public
   */
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

  /**
   * Updates the FPS counter with the current frame rate.
   * Should be called once per frame in the render loop.
   * Calculates FPS based on frame count and elapsed time, updating the display
   * with color-coded performance indicators.
   *
   * Performance color coding:
   * - Green: 50+ FPS (good performance)
   * - Orange: 30-49 FPS (acceptable performance)
   * - Red: <30 FPS (poor performance)
   *
   * @public
   */
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

  /**
   * Gets the current frames per second value.
   *
   * @returns The current FPS as a number
   * @public
   */
  public getFPS(): number {
    return this.fps;
  }

  /**
   * Checks if the debug information is currently visible.
   *
   * @returns True if debug info is visible, false otherwise
   * @public
   */
  public isDebugVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Sets a callback function to be called when the FPS counter is toggled.
   * Useful for updating UI elements that reflect the debug state.
   *
   * @param callback - Function to call when FPS counter visibility changes
   * @public
   */
  public setOnToggleCallback(callback: () => void): void {
    this.onToggleCallback = callback;
  }

  /**
   * Cleans up the debug system by removing DOM elements and event listeners.
   * Should be called when the debug system is no longer needed.
   *
   * @public
   */
  public dispose(): void {
    this.fpsElement?.parentNode?.removeChild(this.fpsElement);
  }
}
