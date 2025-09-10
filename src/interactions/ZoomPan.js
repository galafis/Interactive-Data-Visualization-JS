/**
 * ZoomPan.js - Interactive zoom and pan functionality for data visualizations
 * 
 * This class provides smooth zooming and panning capabilities for data visualization components.
 * Supports mouse wheel zooming and drag-based panning with configurable constraints.
 * 
 * @author Interactive Data Visualization Framework
 * @version 1.0.0
 */

class ZoomPan {
  /**
   * Initialize the ZoomPan interaction handler
   * @param {HTMLElement} container - The DOM element to attach interactions to
   * @param {Object} options - Configuration options
   * @param {number} options.minZoom - Minimum zoom level (default: 0.1)
   * @param {number} options.maxZoom - Maximum zoom level (default: 10)
   * @param {number} options.zoomStep - Zoom increment per wheel event (default: 0.1)
   * @param {boolean} options.enablePan - Enable pan functionality (default: true)
   * @param {boolean} options.enableZoom - Enable zoom functionality (default: true)
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      minZoom: 0.1,
      maxZoom: 10,
      zoomStep: 0.1,
      enablePan: true,
      enableZoom: true,
      ...options
    };

    // State management
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;

    // Event listeners
    this.callbacks = {
      onZoom: [],
      onPan: [],
      onInteractionStart: [],
      onInteractionEnd: []
    };

    this.init();
  }

  /**
   * Initialize event listeners
   * @private
   */
  init() {
    if (this.options.enableZoom) {
      this.container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    }

    if (this.options.enablePan) {
      this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.container.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }

    // Prevent default context menu
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Handle mouse wheel events for zooming
   * @param {WheelEvent} event - The wheel event
   * @private
   */
  handleWheel(event) {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? -this.options.zoomStep : this.options.zoomStep;
    const newZoom = Math.max(
      this.options.minZoom,
      Math.min(this.options.maxZoom, this.zoomLevel + delta)
    );

    if (newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;
      this.triggerCallbacks('onZoom', {
        zoom: this.zoomLevel,
        centerX: event.offsetX,
        centerY: event.offsetY
      });
    }
  }

  /**
   * Handle mouse down events for panning
   * @param {MouseEvent} event - The mouse event
   * @private
   */
  handleMouseDown(event) {
    if (event.button === 0) { // Left mouse button
      this.isDragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.container.style.cursor = 'grabbing';
      
      this.triggerCallbacks('onInteractionStart', {
        type: 'pan',
        x: event.clientX,
        y: event.clientY
      });
    }
  }

  /**
   * Handle mouse move events for panning
   * @param {MouseEvent} event - The mouse event
   * @private
   */
  handleMouseMove(event) {
    if (this.isDragging) {
      const deltaX = event.clientX - this.lastX;
      const deltaY = event.clientY - this.lastY;
      
      this.panX += deltaX;
      this.panY += deltaY;
      
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      
      this.triggerCallbacks('onPan', {
        panX: this.panX,
        panY: this.panY,
        deltaX,
        deltaY
      });
    }
  }

  /**
   * Handle mouse up events to end panning
   * @param {MouseEvent} event - The mouse event
   * @private
   */
  handleMouseUp(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.container.style.cursor = 'default';
      
      this.triggerCallbacks('onInteractionEnd', {
        type: 'pan',
        x: event.clientX,
        y: event.clientY
      });
    }
  }

  /**
   * Add event listener for interaction callbacks
   * @param {string} event - Event name (onZoom, onPan, onInteractionStart, onInteractionEnd)
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  /**
   * Trigger callbacks for a specific event
   * @param {string} event - Event name
   * @param {Object} data - Data to pass to callbacks
   * @private
   */
  triggerCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  /**
   * Get current transformation state
   * @returns {Object} Current zoom and pan values
   */
  getTransform() {
    return {
      zoom: this.zoomLevel,
      panX: this.panX,
      panY: this.panY
    };
  }

  /**
   * Set transformation state programmatically
   * @param {Object} transform - Transformation values
   * @param {number} transform.zoom - Zoom level
   * @param {number} transform.panX - Pan X offset
   * @param {number} transform.panY - Pan Y offset
   */
  setTransform(transform) {
    if (transform.zoom !== undefined) {
      this.zoomLevel = Math.max(
        this.options.minZoom,
        Math.min(this.options.maxZoom, transform.zoom)
      );
    }
    
    if (transform.panX !== undefined) {
      this.panX = transform.panX;
    }
    
    if (transform.panY !== undefined) {
      this.panY = transform.panY;
    }
  }

  /**
   * Reset zoom and pan to default values
   */
  reset() {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    
    this.triggerCallbacks('onZoom', { zoom: this.zoomLevel });
    this.triggerCallbacks('onPan', { panX: this.panX, panY: this.panY });
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    this.container.removeEventListener('wheel', this.handleWheel.bind(this));
    this.container.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.container.removeEventListener('mouseleave', this.handleMouseUp.bind(this));
    this.container.removeEventListener('contextmenu', (e) => e.preventDefault());
  }
}

// Export for use in other modules
export default ZoomPan;

// Also support CommonJS for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZoomPan;
}
