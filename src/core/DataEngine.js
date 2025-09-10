/**
 * DataEngine.js - Core Data Management Engine
 * 
 * Professional data processing engine for the Interactive Data Visualization platform.
 * Handles data loading, transformation, validation, and caching with enterprise-grade performance.
 * 
 * Features:
 * - High-performance data loading from multiple sources
 * - Data transformation and normalization pipelines
 * - Intelligent caching and memory management
 * - Real-time data streaming capabilities
 * - Data validation and error handling
 * 
 * @author Gabriel Demetrios Lafis
 * @version 1.0.0
 * @since 2024-09-09
 */

import { EventEmitter } from '../utils/EventEmitter.js';
import { DataCache } from '../data/DataCache.js';
import { DataValidator } from '../utils/DataValidator.js';

/**
 * DataEngine class - Core data management system
 * 
 * Provides comprehensive data processing capabilities including loading,
 * transformation, validation, and caching. Designed for high-performance
 * handling of large datasets with real-time streaming support.
 */
export class DataEngine extends EventEmitter {
  /**
   * Creates a new DataEngine instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} [options.maxCacheSize=100000] - Maximum cache size in items
   * @param {boolean} [options.enableStreaming=false] - Enable real-time streaming
   * @param {number} [options.batchSize=10000] - Batch size for processing
   * @param {boolean} [options.validateData=true] - Enable data validation
   */
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      maxCacheSize: options.maxCacheSize || 100000,
      enableStreaming: options.enableStreaming || false,
      batchSize: options.batchSize || 10000,
      validateData: options.validateData !== false,
      timeout: options.timeout || 30000
    };
    
    // Core components
    this.cache = new DataCache({
      maxSize: this.config.maxCacheSize,
      ttl: 300000 // 5 minutes default TTL
    });
    
    this.validator = new DataValidator();
    
    // State management
    this.isLoading = false;
    this.loadedDatasets = new Map();
    this.activeConnections = new Set();
    this.streamingConnections = new Map();
    
    // Performance metrics
    this.metrics = {
      totalLoaded: 0,
      cacheHits: 0,
      cacheMisses: 0,
      loadTime: 0,
      transformTime: 0
    };
    
    // Initialize
    this._initialize();
  }
  
  /**
   * Loads data from various sources with intelligent caching
   * 
   * Supports multiple data sources including URLs, files, arrays, and streams.
   * Implements automatic caching, validation, and transformation pipelines.
   * 
   * @param {string|Object|Array} source - Data source (URL, file, object, or array)
   * @param {Object} [options={}] - Loading options
   * @param {string} [options.format='auto'] - Data format (json, csv, xml, auto)
   * @param {Function} [options.transform] - Data transformation function
   * @param {boolean} [options.cache=true] - Enable caching for this dataset
   * @param {Object} [options.headers] - HTTP headers for URL requests
   * @param {number} [options.timeout] - Request timeout in milliseconds
   * @returns {Promise<Object>} Processed data with metadata
   * 
   * @example
   * // Load from URL
   * const data = await dataEngine.loadData('https://api.example.com/data.json');
   * 
   * // Load with transformation
   * const transformedData = await dataEngine.loadData(rawArray, {
   *   transform: (item) => ({ ...item, processed: true })
   * });
   * 
   * // Load CSV with custom headers
   * const csvData = await dataEngine.loadData('/data/dataset.csv', {
   *   format: 'csv',
   *   headers: { 'Accept': 'text/csv' }
   * });
   */
  async loadData(source, options = {}) {
    const startTime = performance.now();
    
    try {
      // Set loading state
      this.isLoading = true;
      this.emit('loadStart', { source, options });
      
      // Generate cache key
      const cacheKey = this._generateCacheKey(source, options);
      
      // Check cache first
      if (options.cache !== false) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
          this.metrics.cacheHits++;
          this.emit('loadComplete', { source, data: cachedData, fromCache: true });
          return cachedData;
        }
        this.metrics.cacheMisses++;
      }
      
      // Determine source type and load accordingly
      let rawData;
      if (typeof source === 'string') {
        rawData = await this._loadFromUrl(source, options);
      } else if (Array.isArray(source)) {
        rawData = source;
      } else if (typeof source === 'object') {
        rawData = source;
      } else {
        throw new Error('Unsupported data source type');
      }
      
      // Validate data if enabled
      if (this.config.validateData) {
        const validationResult = this.validator.validate(rawData);
        if (!validationResult.valid) {
          throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`);
        }
      }
      
      // Transform data if transformer provided
      let processedData = rawData;
      if (options.transform && typeof options.transform === 'function') {
        const transformStart = performance.now();
        processedData = await this._transformData(rawData, options.transform);
        this.metrics.transformTime += performance.now() - transformStart;
      }
      
      // Normalize data structure
      const normalizedData = this._normalizeData(processedData);
      
      // Create data package with metadata
      const dataPackage = {
        data: normalizedData,
        metadata: {
          source: typeof source === 'string' ? source : 'object',
          format: options.format || 'auto',
          loadedAt: new Date().toISOString(),
          size: Array.isArray(normalizedData) ? normalizedData.length : Object.keys(normalizedData).length,
          loadTime: performance.now() - startTime
        },
        statistics: this._calculateStatistics(normalizedData)
      };
      
      // Cache the result
      if (options.cache !== false) {
        this.cache.set(cacheKey, dataPackage);
      }
      
      // Store in active datasets
      this.loadedDatasets.set(cacheKey, dataPackage);
      
      // Update metrics
      this.metrics.totalLoaded++;
      this.metrics.loadTime += dataPackage.metadata.loadTime;
      
      // Emit completion event
      this.emit('loadComplete', {
        source,
        data: dataPackage,
        fromCache: false
      });
      
      return dataPackage;
      
    } catch (error) {
      this.emit('loadError', { source, error });
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Private initialization method
   */
  _initialize() {
    // Set up error handling
    this.on('error', (error) => {
      console.error('[DataEngine] Error:', error);
    });
    
    // Initialize performance monitoring
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('dataEngine-initialized');
    }
  }
  
  /**
   * Generates a cache key for the given source and options
   */
  _generateCacheKey(source, options) {
    const key = typeof source === 'string' ? source : JSON.stringify(source);
    const optionsKey = JSON.stringify({
      format: options.format,
      transform: options.transform ? options.transform.toString() : null
    });
    return `${key}:${optionsKey}`;
  }
  
  /**
   * Loads data from URL with proper error handling
   */
  async _loadFromUrl(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.config.timeout);
    
    try {
      const response = await fetch(url, {
        headers: options.headers || {},
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      
      // Auto-detect format if not specified
      if (options.format === 'auto' || !options.format) {
        if (contentType?.includes('application/json')) {
          return await response.json();
        } else if (contentType?.includes('text/csv')) {
          return await this._parseCSV(await response.text());
        } else {
          return await response.text();
        }
      }
      
      // Use specified format
      switch (options.format) {
        case 'json':
          return await response.json();
        case 'csv':
          return await this._parseCSV(await response.text());
        case 'text':
          return await response.text();
        default:
          return await response.json();
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Transforms data using provided transformer function
   */
  async _transformData(data, transformer) {
    if (Array.isArray(data)) {
      // Process in batches for large arrays
      if (data.length > this.config.batchSize) {
        const results = [];
        for (let i = 0; i < data.length; i += this.config.batchSize) {
          const batch = data.slice(i, i + this.config.batchSize);
          const transformedBatch = batch.map(transformer);
          results.push(...transformedBatch);
          
          // Yield control to prevent blocking
          if (i % (this.config.batchSize * 10) === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        return results;
      } else {
        return data.map(transformer);
      }
    } else {
      return transformer(data);
    }
  }
  
  /**
   * Normalizes data structure for consistent processing
   */
  _normalizeData(data) {
    // Ensure consistent data structure
    if (Array.isArray(data)) {
      return data.map((item, index) => ({
        id: item.id || index,
        ...item
      }));
    }
    
    return data;
  }
  
  /**
   * Calculates basic statistics for the dataset
   */
  _calculateStatistics(data) {
    if (!Array.isArray(data)) {
      return { type: 'object', keys: Object.keys(data).length };
    }
    
    return {
      type: 'array',
      length: data.length,
      memoryUsage: JSON.stringify(data).length,
      firstItem: data[0] || null,
      lastItem: data[data.length - 1] || null
    };
  }
  
  /**
   * Simple CSV parser
   */
  _parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return data;
  }
  
  /**
   * Gets current performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      activeDatasets: this.loadedDatasets.size,
      activeConnections: this.activeConnections.size
    };
  }
  
  /**
   * Clears all cached data and resets metrics
   */
  clear() {
    this.cache.clear();
    this.loadedDatasets.clear();
    this.metrics = {
      totalLoaded: 0,
      cacheHits: 0,
      cacheMisses: 0,
      loadTime: 0,
      transformTime: 0
    };
    this.emit('cleared');
  }
  
  /**
   * Destroys the DataEngine instance and cleans up resources
   */
  destroy() {
    this.clear();
    this.activeConnections.clear();
    this.streamingConnections.clear();
    this.removeAllListeners();
    this.emit('destroyed');
  }
}

// Export default instance for convenience
export default new DataEngine();
