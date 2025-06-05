import { DebugSystem } from './debug';

/**
 * Manages the game's user interface menu system.
 * Handles scene navigation, debug controls, and menu interactions.
 * Provides keyboard shortcuts and visual feedback for user actions.
 *
 * @example
 * ```typescript
 * const menuSystem = new MenuSystem(
 *   (sceneId) => switchToScene(sceneId),
 *   debugSystem
 * );
 * ```
 */
export class MenuSystem {
  /** The popup menu container element */
  private popupMenu: HTMLElement;

  /** The menu icon/hamburger button element */
  private menuIcon: HTMLElement;

  /** Whether the menu is currently open */
  private isMenuOpen: boolean = false;

  /** Callback function called when a scene is selected */
  private onSceneChange?: (sceneId: string) => void;

  /** The ID of the currently active scene */
  private currentScene: string = 'scene1';

  /** Reference to the debug system for FPS counter control */
  private debugSystem?: DebugSystem;

  /** The FPS toggle button element */
  private fpsToggleButton?: HTMLElement;

  /**
   * Creates a new MenuSystem instance.
   *
   * @param onSceneChangeCallback - Optional callback function called when a scene is selected
   * @param debugSystem - Optional debug system for FPS counter integration
   */
  constructor(onSceneChangeCallback?: (sceneId: string) => void, debugSystem?: DebugSystem) {
    this.onSceneChange = onSceneChangeCallback;
    this.debugSystem = debugSystem;

    // Get menu elements
    this.popupMenu = document.getElementById('popupMenu')!;
    this.menuIcon = document.getElementById('menuIcon')!;
    this.fpsToggleButton = document.getElementById('fpsToggleButton')!;

    this.setupEventListeners();
    this.updateActiveScene();
    this.updateFPSButtonText();

    // Set up callback for when FPS is toggled via F3
    if (this.debugSystem) {
      this.debugSystem.setOnToggleCallback(() => {
        this.updateFPSButtonText();
      });
    }
  }

  /**
   * Sets up all event listeners for menu interactions.
   * Handles keyboard shortcuts, button clicks, and menu navigation.
   *
   * @private
   */
  private setupEventListeners(): void {
    // ESC key listener
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.toggleMenu();
      }
    });

    // Menu icon click
    this.menuIcon.addEventListener('click', () => {
      this.toggleMenu();
    });

    // Close menu when clicking outside content
    this.popupMenu.addEventListener('click', (event) => {
      if (event.target === this.popupMenu) {
        this.closeMenu();
      }
    });

    // Scene selection buttons
    const sceneButtons = document.querySelectorAll('[data-scene]');
    sceneButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const sceneId = target.getAttribute('data-scene');
        if (sceneId) {
          this.selectScene(sceneId);
        }
      });
    });

    // Close menu button
    const closeButton = document.querySelector('.close-menu');
    closeButton?.addEventListener('click', () => {
      this.closeMenu();
    });

    // FPS toggle button
    this.fpsToggleButton?.addEventListener('click', () => {
      this.toggleFPS();
    });
  }

  private toggleMenu(): void {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  private openMenu(): void {
    this.isMenuOpen = true;
    this.popupMenu.classList.remove('hidden');
    this.updateActiveScene();
    this.updateFPSButtonText();
  }

  private closeMenu(): void {
    this.isMenuOpen = false;
    this.popupMenu.classList.add('hidden');
  }

  private selectScene(sceneId: string): void {
    this.currentScene = sceneId;
    this.updateActiveScene();
    
    if (this.onSceneChange) {
      this.onSceneChange(sceneId);
    }
    
    this.closeMenu();
  }

  private updateActiveScene(): void {
    // Remove active class from all scene buttons
    const sceneButtons = document.querySelectorAll('[data-scene]');
    sceneButtons.forEach(button => {
      button.classList.remove('active');
    });

    // Add active class to current scene button
    const activeButton = document.querySelector(`[data-scene="${this.currentScene}"]`);
    activeButton?.classList.add('active');
  }

  /**
   * Gets the ID of the currently active scene.
   *
   * @returns The current scene ID
   * @public
   */
  public getCurrentScene(): string {
    return this.currentScene;
  }

  /**
   * Sets the current scene and updates the menu UI.
   * Updates the visual indicators to show which scene is active.
   *
   * @param sceneId - The ID of the scene to set as current
   * @public
   */
  public setCurrentScene(sceneId: string): void {
    this.currentScene = sceneId;
    this.updateActiveScene();
  }

  private toggleFPS(): void {
    if (this.debugSystem) {
      this.debugSystem.toggleFPS();
      this.updateFPSButtonText();
    }
  }

  private updateFPSButtonText(): void {
    if (this.fpsToggleButton && this.debugSystem) {
      const isVisible = this.debugSystem.isDebugVisible();
      this.fpsToggleButton.textContent = isVisible
        ? 'Hide FPS Counter (F3)'
        : 'Show FPS Counter (F3)';

      // Add visual indicator for active state
      if (isVisible) {
        this.fpsToggleButton.classList.add('active');
      } else {
        this.fpsToggleButton.classList.remove('active');
      }
    }
  }
}
