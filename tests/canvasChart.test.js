/**
 * Teste automatizado para o CanvasChart.
 * Deve rodar com Jest (JS DOM) ou runner equivalente.
 */

import CanvasChart from '../src/charts/CanvasChart.js';

describe('CanvasChart', () => {
  beforeEach(() => {
    // Simula container DOM presente na página
    document.body.innerHTML = '<div id="viz-container"></div>';
  });

  it('inicializa e renderiza corretamente', () => {
    const chart = new CanvasChart({
      container: 'viz-container',
      width: 400,
      height: 200
    });

    const dados = [
      { x: 30, y: 50, color: '#1976D2', radius: 8 },
      { x: 180, y: 120, color: '#e91e63', radius: 10 }
    ];
    chart.setData(dados);
    chart.render();

    // O canvas deve existir no DOM
    expect(chart.getCanvas()).toBeDefined();

    // O array de dados foi salvo corretamente
    expect(chart.getData().length).toBe(2);

    // Checar dimensões do canvas
    const canvas = chart.getCanvas();
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(200);
  });
});

