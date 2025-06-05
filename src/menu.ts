export class MenuSystem {
  private popupMenu: HTMLElement;
  private menuIcon: HTMLElement;
  private isMenuOpen: boolean = false;
  private onSceneChange?: (sceneId: string) => void;
  private currentScene: string = 'scene1';

  constructor(onSceneChangeCallback?: (sceneId: string) => void) {
    this.onSceneChange = onSceneChangeCallback;
    
    // Get menu elements
    this.popupMenu = document.getElementById('popupMenu')!;
    this.menuIcon = document.getElementById('menuIcon')!;
    
    this.setupEventListeners();
    this.updateActiveScene();
  }

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

  public getCurrentScene(): string {
    return this.currentScene;
  }

  public setCurrentScene(sceneId: string): void {
    this.currentScene = sceneId;
    this.updateActiveScene();
  }
}
