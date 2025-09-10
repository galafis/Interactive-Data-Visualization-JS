/**
 * CanvasChart - Professional canvas-based chart visualization class
 * 
 * A high-performance chart component that provides canvas rendering capabilities
 * for data visualization with support for points, shapes, and interactive elements.
 * 
 * @class CanvasChart
 * @version 1.0.0
 * @author Interactive Data Visualization JS
 */
class CanvasChart {
  /**
   * Creates a new CanvasChart instance
   * 
   * @param {HTMLCanvasElement|string} canvas - Canvas element or selector
   * @param {Object} options - Configuration options
   * @param {number} [options.width=800] - Canvas width in pixels
   * @param {number} [options.height=600] - Canvas height in pixels
   * @param {string} [options.backgroundColor='#ffffff'] - Background color
   * @param {Object} [options.padding={top: 20, right: 20, bottom: 20, left: 20}] - Chart padding
   */
  constructor(canvas, options = {}) {
    // Handle canvas element or selector
    if (typeof canvas === 'string') {
      this.canvas = document.querySelector(canvas);
    } else {
      this.canvas = canvas;
    }
    
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
    
    // Default configuration
    this.config = {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      ...options
    };
    
    // Initialize canvas context
    this.ctx = this.canvas.getContext('2d');
    this.data = [];
    
    // Setup canvas dimensions
    this.setupCanvas();
  }
  
  /**
   * Sets up canvas dimensions and styling
   * @private
   */
  setupCanvas() {
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.border = '1px solid #ddd';
  }
  
  /**
   * Sets the data for the chart
   * 
   * @param {Array} data - Array of data points
   * @param {number} data[].x - X coordinate value
   * @param {number} data[].y - Y coordinate value
   * @param {string} [data[].color='#007bff'] - Point color
   * @param {number} [data[].radius=3] - Point radius
   */
  setData(data) {
    this.data = data.map(point => ({
      x: point.x,
      y: point.y,
      color: point.color || '#007bff',
      radius: point.radius || 3
    }));
  }
  
  /**
   * Clears the entire canvas
   * Removes all drawn content and resets to background color
   */
  clear() {
    // Clear the entire canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Fill with background color
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Renders the chart with current data
   * Draws all data points and chart elements on the canvas
   */
  render() {
    // Clear canvas before rendering
    this.clear();
    
    if (!this.data || this.data.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    // Calculate drawing area (excluding padding)
    const drawArea = {
      x: this.config.padding.left,
      y: this.config.padding.top,
      width: this.canvas.width - this.config.padding.left - this.config.padding.right,
      height: this.canvas.height - this.config.padding.top - this.config.padding.bottom
    };
    
    // Find data bounds
    const bounds = this.calculateDataBounds();
    
    // Render data points
    this.renderPoints(drawArea, bounds);
    
    // Render axes (basic implementation)
    this.renderAxes(drawArea);
  }
  
  /**
   * Calculates the bounds of the data
   * @private
   * @returns {Object} Data bounds with min/max x and y values
   */
  calculateDataBounds() {
    if (this.data.length === 0) {
      return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
    
    const bounds = {
      minX: Math.min(...this.data.map(d => d.x)),
      maxX: Math.max(...this.data.map(d => d.x)),
      minY: Math.min(...this.data.map(d => d.y)),
      maxY: Math.max(...this.data.map(d => d.y))
    };
    
    // Add some padding to the bounds
    const xRange = bounds.maxX - bounds.minX || 1;
    const yRange = bounds.maxY - bounds.minY || 1;
    const padding = 0.1;
    
    bounds.minX -= xRange * padding;
    bounds.maxX += xRange * padding;
    bounds.minY -= yRange * padding;
    bounds.maxY += yRange * padding;
    
    return bounds;
  }
  
  /**
   * Renders data points on the canvas
   * @private
   * @param {Object} drawArea - Available drawing area
   * @param {Object} bounds - Data bounds
   */
  renderPoints(drawArea, bounds) {
    this.data.forEach(point => {
      // Transform data coordinates to canvas coordinates
      const canvasX = drawArea.x + ((point.x - bounds.minX) / (bounds.maxX - bounds.minX)) * drawArea.width;
      const canvasY = drawArea.y + drawArea.height - ((point.y - bounds.minY) / (bounds.maxY - bounds.minY)) * drawArea.height;
      
      // Draw point
      this.ctx.beginPath();
      this.ctx.arc(canvasX, canvasY, point.radius, 0, 2 * Math.PI);
      this.ctx.fillStyle = point.color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    });
  }
  
  /**
   * Renders basic axes
   * @private
   * @param {Object} drawArea - Available drawing area
   */
  renderAxes(drawArea) {
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    
    // X-axis
    this.ctx.beginPath();
    this.ctx.moveTo(drawArea.x, drawArea.y + drawArea.height);
    this.ctx.lineTo(drawArea.x + drawArea.width, drawArea.y + drawArea.height);
    this.ctx.stroke();
    
    // Y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(drawArea.x, drawArea.y);
    this.ctx.lineTo(drawArea.x, drawArea.y + drawArea.height);
    this.ctx.stroke();
  }
  
  /**
   * Renders empty state message
   * @private
   */
  renderEmptyState() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.fillStyle = '#666';
    this.ctx.font = '16px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('No data available', centerX, centerY);
  }
  
  /**
   * Resizes the canvas and re-renders
   * 
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.config.width = width;
    this.config.height = height;
    this.setupCanvas();
    this.render();
  }
  
  /**
   * Updates chart configuration
   * 
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.setupCanvas();
    this.render();
  }
  
  /**
   * Gets the current canvas element
   * 
   * @returns {HTMLCanvasElement} The canvas element
   */
  getCanvas() {
    return this.canvas;
  }
  
  /**
   * Gets the current chart data
   * 
   * @returns {Array} Current data array
   */
  getData() {
    return this.data;
  }
}

// Export for use in other modules
export default CanvasChart;

// Also support CommonJS for broader compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasChart;
}
