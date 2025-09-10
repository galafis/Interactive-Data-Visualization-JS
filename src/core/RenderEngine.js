/**
 * RenderEngine.js - Engine de Renderização Global
 * Camada básica para Canvas, WebGL ou SVG, preparada para expansão.
 * Autor: Gabriel Demetrios Lafis
 * Versão: 1.0.0
 */

/**
 * Classe RenderEngine
 * Incorpora inicialização do contexto no container especificado e stub para métodos globais de renderização.
 *
 * Exemplo de uso:
 *   const renderer = new RenderEngine('viz-container');
 *   renderer.clear();
 *   renderer.renderFrame();
 */

export class RenderEngine {
  /**
   * Construtor da RenderEngine
   * @param {string} containerId - ID do container HTML alvo da renderização.
   * @param {Object} [options] - Configurações avançadas (tipo de contexto, largura, altura, etc).
   */
  constructor(containerId = 'viz-container', options = {}) {
    this.container = document.getElementById(containerId);
    this.width = options.width || 800;
    this.height = options.height || 600;
    this.type = options.type || "canvas"; // ou "webgl", "svg"
    this.context = null;

    if (!this.container) {
      throw new Error(`Container '${containerId}' não encontrado no DOM.`);
    }

    this._setupContext();
  }

  /**
   * Inicializa o contexto de renderização (Canvas, WebGL, SVG, stub).
   * Pode ser facilmente expandido para suportar novos tipos.
   */
  _setupContext() {
    if(this.type === "canvas") {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      this.container.appendChild(canvas);
      this.context = canvas.getContext('2d');
    }
    // Espaço para suportar WebGL, SVG, etc.
  }

  /**
   * Limpa o contexto de renderização.
   */
  clear() {
    if(this.type === "canvas" && this.context) {
      this.context.clearRect(0, 0, this.width, this.height);
    }
  }

  /**
   * Renderiza um quadro vazio ou stub.
   */
  renderFrame() {
    // Exemplo: desenha um retângulo central
    if(this.context) {
      this.context.fillStyle = '#E0E0E0';
      this.context.fillRect(this.width/4, this.height/4, this.width/2, this.height/2);
    }
  }
}

export default RenderEngine;
