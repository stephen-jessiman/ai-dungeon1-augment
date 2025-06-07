import { DebugSystem } from './debug';

/**
 * Manages the game's user interface menu system.
 * Handles scene navigation, debug controls, and menu interactions.
 * Provides keyboard shortcuts, arrow key navigation, and visual feedback for user actions.
 *
 * Keyboard Controls:
 * - ESC: Toggle menu open/close
 * - Arrow Up/Down: Navigate between menu items
 * - Enter: Activate the currently focused menu item
 * - F3: Toggle FPS counter (when menu is closed)
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

  /** Array of all navigable menu buttons */
  private menuButtons: HTMLElement[] = [];

  /** Index of the currently focused menu item */
  private focusedIndex: number = 0;

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
    this.initializeMenuButtons();
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
   * Initializes the array of navigable menu buttons in order.
   * This determines the tab order for keyboard navigation.
   *
   * @private
   */
  private initializeMenuButtons(): void {
    this.menuButtons = [];

    // Add scene buttons in order
    const sceneButtons = document.querySelectorAll('[data-scene]') as NodeListOf<HTMLElement>;
    sceneButtons.forEach(button => this.menuButtons.push(button));

    // Add FPS toggle button
    if (this.fpsToggleButton) {
      this.menuButtons.push(this.fpsToggleButton);
    }

    // Add close button
    const closeButton = document.querySelector('.close-menu') as HTMLElement;
    if (closeButton) {
      this.menuButtons.push(closeButton);
    }
  }

  /**
   * Sets up all event listeners for menu interactions.
   * Handles keyboard shortcuts, button clicks, and menu navigation.
   *
   * @private
   */
  private setupEventListeners(): void {
    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.toggleMenu();
      } else if (this.isMenuOpen) {
        this.handleMenuKeyboard(event);
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

  /**
   * Handles keyboard navigation within the menu.
   * Supports arrow keys for navigation and Enter for activation.
   *
   * @param event - The keyboard event
   * @private
   */
  private handleMenuKeyboard(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.navigateUp();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.navigateDown();
        break;
      case 'Enter':
        event.preventDefault();
        this.activateCurrentItem();
        break;
    }
  }

  /**
   * Navigates to the previous menu item.
   * Wraps around to the last item if at the beginning.
   *
   * @private
   */
  private navigateUp(): void {
    this.focusedIndex = (this.focusedIndex - 1 + this.menuButtons.length) % this.menuButtons.length;
    this.updateFocusedItem();
  }

  /**
   * Navigates to the next menu item.
   * Wraps around to the first item if at the end.
   *
   * @private
   */
  private navigateDown(): void {
    this.focusedIndex = (this.focusedIndex + 1) % this.menuButtons.length;
    this.updateFocusedItem();
  }

  /**
   * Activates the currently focused menu item.
   * Simulates a click on the focused button.
   *
   * @private
   */
  private activateCurrentItem(): void {
    const currentButton = this.menuButtons[this.focusedIndex];
    if (currentButton) {
      currentButton.click();
    }
  }

  /**
   * Updates the visual focus indicator for the current menu item.
   * Adds/removes the 'focused' CSS class appropriately.
   *
   * @private
   */
  private updateFocusedItem(): void {
    // Remove focus from all buttons
    this.menuButtons.forEach(button => {
      button.classList.remove('focused');
    });

    // Add focus to current button
    const currentButton = this.menuButtons[this.focusedIndex];
    if (currentButton) {
      currentButton.classList.add('focused');
    }
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

    // Set focus to the currently active scene when opening menu
    this.focusedIndex = this.getCurrentSceneIndex();
    this.updateFocusedItem();
  }

  private closeMenu(): void {
    this.isMenuOpen = false;
    this.popupMenu.classList.add('hidden');

    // Clear focus when closing menu
    this.menuButtons.forEach(button => {
      button.classList.remove('focused');
    });
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

  /**
   * Gets the index of the currently active scene in the menu buttons array.
   * @returns The index of the current scene, or 0 if not found
   * @private
   */
  private getCurrentSceneIndex(): number {
    const sceneButton = this.menuButtons.find(button =>
      button.getAttribute('data-scene') === this.currentScene
    );

    if (sceneButton) {
      return this.menuButtons.indexOf(sceneButton);
    }

    return 0; // Default to first item if current scene not found
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
