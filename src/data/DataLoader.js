/**
 * DataLoader - Professional data fetching and parsing utility
 * ES Module for handling various data sources and formats
 * @author Interactive Data Visualization JS
 * @version 1.0.0
 */

/**
 * Supported data formats
 */
export const DATA_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  XML: 'xml',
  TEXT: 'text'
};

/**
 * HTTP methods for data fetching
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

/**
 * DataLoader class for fetching and parsing data from various sources
 */
export class DataLoader {
  /**
   * Constructor
   * @param {Object} config - Configuration options
   * @param {string} config.baseURL - Base URL for relative requests
   * @param {Object} config.defaultHeaders - Default headers for requests
   * @param {number} config.timeout - Request timeout in milliseconds
   */
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      defaultHeaders: config.defaultHeaders || {
        'Content-Type': 'application/json'
      },
      timeout: config.timeout || 10000
    };
  }

  /**
   * Fetch data from URL
   * @param {string} url - URL to fetch data from
   * @param {Object} options - Fetch options
   * @param {string} options.method - HTTP method
   * @param {Object} options.headers - Request headers
   * @param {*} options.body - Request body
   * @returns {Promise<Response>} Fetch response
   */
  async fetch(url, options = {}) {
    const fullUrl = this._buildURL(url);
    const fetchOptions = this._buildFetchOptions(options);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Load and parse JSON data
   * @param {string} url - URL to JSON resource
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Parsed JSON data
   */
  async loadJSON(url, options = {}) {
    const response = await this.fetch(url, options);
    return await response.json();
  }

  /**
   * Load and parse CSV data
   * @param {string} url - URL to CSV resource
   * @param {Object} options - Fetch options
   * @param {string} options.delimiter - CSV delimiter (default: ',')
   * @param {boolean} options.header - Whether first row contains headers
   * @returns {Promise<Array>} Parsed CSV data as array of objects
   */
  async loadCSV(url, options = {}) {
    const response = await this.fetch(url, options);
    const text = await response.text();
    return this._parseCSV(text, {
      delimiter: options.delimiter || ',',
      header: options.header !== false
    });
  }

  /**
   * Load XML data
   * @param {string} url - URL to XML resource
   * @param {Object} options - Fetch options
   * @returns {Promise<Document>} Parsed XML document
   */
  async loadXML(url, options = {}) {
    const response = await this.fetch(url, options);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parsing error: ' + parseError.textContent);
    }
    
    return doc;
  }

  /**
   * Load plain text data
   * @param {string} url - URL to text resource
   * @param {Object} options - Fetch options
   * @returns {Promise<string>} Text content
   */
  async loadText(url, options = {}) {
    const response = await this.fetch(url, options);
    return await response.text();
  }

  /**
   * Generic data loader that auto-detects format
   * @param {string} url - URL to resource
   * @param {string} format - Data format (optional, auto-detected if not provided)
   * @param {Object} options - Fetch options
   * @returns {Promise<*>} Parsed data
   */
  async load(url, format = null, options = {}) {
    const detectedFormat = format || this._detectFormat(url);
    
    switch (detectedFormat) {
      case DATA_FORMATS.JSON:
        return this.loadJSON(url, options);
      case DATA_FORMATS.CSV:
        return this.loadCSV(url, options);
      case DATA_FORMATS.XML:
        return this.loadXML(url, options);
      case DATA_FORMATS.TEXT:
      default:
        return this.loadText(url, options);
    }
  }

  /**
   * Load multiple data sources concurrently
   * @param {Array} sources - Array of source objects {url, format?, options?}
   * @returns {Promise<Array>} Array of loaded data
   */
  async loadMultiple(sources) {
    const promises = sources.map(source => 
      this.load(source.url, source.format, source.options)
    );
    return await Promise.all(promises);
  }

  /**
   * Build full URL from base URL and relative path
   * @private
   * @param {string} url - URL or path
   * @returns {string} Full URL
   */
  _buildURL(url) {
    if (url.startsWith('http') || !this.config.baseURL) {
      return url;
    }
    return `${this.config.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }

  /**
   * Build fetch options with defaults
   * @private
   * @param {Object} options - User options
   * @returns {Object} Complete fetch options
   */
  _buildFetchOptions(options) {
    return {
      method: options.method || HTTP_METHODS.GET,
      headers: {
        ...this.config.defaultHeaders,
        ...options.headers
      },
      ...(options.body && { body: options.body })
    };
  }

  /**
   * Detect data format from URL extension
   * @private
   * @param {string} url - URL to analyze
   * @returns {string} Detected format
   */
  _detectFormat(url) {
    const extension = url.split('.').pop().toLowerCase().split('?')[0];
    
    switch (extension) {
      case 'json':
        return DATA_FORMATS.JSON;
      case 'csv':
        return DATA_FORMATS.CSV;
      case 'xml':
        return DATA_FORMATS.XML;
      default:
        return DATA_FORMATS.TEXT;
    }
  }

  /**
   * Simple CSV parser
   * @private
   * @param {string} text - CSV text content
   * @param {Object} options - Parse options
   * @returns {Array} Parsed CSV data
   */
  _parseCSV(text, options) {
    const lines = text.trim().split('\n');
    const delimiter = options.delimiter;
    
    if (lines.length === 0) return [];
    
    const data = lines.map(line => 
      line.split(delimiter).map(cell => cell.trim().replace(/^"(.*)"$/, '$1'))
    );
    
    if (options.header && data.length > 0) {
      const headers = data[0];
      return data.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
    }
    
    return data;
  }
}

/**
 * Default DataLoader instance with common configuration
 */
export const dataLoader = new DataLoader();

/**
 * Convenience functions for common use cases
 */
export const loadJSON = (url, options) => dataLoader.loadJSON(url, options);
export const loadCSV = (url, options) => dataLoader.loadCSV(url, options);
export const loadXML = (url, options) => dataLoader.loadXML(url, options);
export const loadText = (url, options) => dataLoader.loadText(url, options);
export const load = (url, format, options) => dataLoader.load(url, format, options);

export default DataLoader;
