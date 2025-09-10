/**
 * Exemplo profissional de uso do CanvasChart.
 * Gera um gráfico de dispersão simples em um container chamado 'viz-container'.
 * Ideal para incluir após seu index.html carregar!
 */

import CanvasChart from '../src/charts/CanvasChart.js';

const demoData = Array.from({ length: 40 }, (_, i) => ({
  x: Math.random() * 600 + 40,
  y: Math.random() * 350 + 30,
  color: i % 3 === 0 ? '#E91E63' : (i % 2 === 0 ? "#1976D2" : "#388E3C"),
  radius: Math.random() * 8 + 4
}));

const chart = new CanvasChart({
  container: 'viz-container',
  width: 800,
  height: 500,
  backgroundColor: '#fff'
});

chart.setData(demoData);
chart.render();

// Para ativar zoom/pan basta importar e adicionar:
// import ZoomPan from '../src/interactions/ZoomPan.js';
// new ZoomPan(chart.getCanvas());
