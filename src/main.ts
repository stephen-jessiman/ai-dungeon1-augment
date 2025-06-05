/**
 * Main entry point for the Babylon.js game application.
 *
 * This file initializes the game once the DOM is fully loaded.
 * It creates a new Game instance that handles all game systems including
 * the Babylon.js engine, scene management, menu system, and debug tools.
 *
 * The game automatically:
 * - Initializes the Babylon.js engine with the "renderCanvas" element
 * - Registers all available scenes (Scene1, Scene2, Scene3)
 * - Sets up the menu system with scene navigation and debug controls
 * - Starts with Scene 1 (Spinning Cube Scene)
 * - Begins the render loop for continuous animation
 * - Enables FPS counter toggle with F3 key
 * - Provides ESC key and menu icon for scene navigation
 *
 * @author Game Development Team
 * @version 1.0.0
 */

import { Game } from "./game";

/**
 * Initialize the game when the DOM is fully loaded.
 * Ensures all HTML elements are available before creating the game instance.
 */
window.addEventListener('DOMContentLoaded', () => {
  // Create the game instance with the canvas element ID
  new Game("renderCanvas");
});