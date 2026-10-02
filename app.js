// Math & Numerical Utilities
function normalPDF(x, mu, sigma) {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}

function erf(x) {
  // Abramowitz and Stegun approximation for error function
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function normalCDF(x, mu = 0, sigma = 1) {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2))));
}

function factorial(n) {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function combinations(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

// Probability Lab Controller
class ProbabilityLab {
  constructor() {
    this.currentTab = 'dist';
    this.currentDist = 'normal';

    // Parameters
    this.normalParams = { mu: 0, sigma: 1 };
    this.binomParams = { n: 20, p: 0.5 };
    this.poissonParams = { lambda: 4 };
    this.uniformParams = { a: -3, b: 3 };

    // Canvas
    this.distCanvas = document.getElementById('distCanvas');
    this.distCtx = this.distCanvas.getContext('2d');
    this.cltCanvas = document.getElementById('cltCanvas');
    this.cltCtx = this.cltCanvas.getContext('2d');

    this.initEvents();
    this.renderDistSliders();
    this.drawDist();
    this.runCLT();
  }

  initEvents() {
    // Tab switching
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        const targetTab = e.target.dataset.tab;
        this.currentTab = targetTab;
        if (targetTab === 'dist') {
          document.getElementById('paneDist').classList.add('active');
          this.drawDist();
        } else if (targetTab === 'clt') {
          document.getElementById('paneClt').classList.add('active');
          this.drawCLT();
        } else if (targetTab === 'hypo') {
          document.getElementById('paneHypo').classList.add('active');
          this.calculateHypothesis();
        }
      });
    });

    // Distribution selector
    document.getElementById('distSelect').addEventListener('change', (e) => {
      this.currentDist = e.target.value;
      this.renderDistSliders();
      this.drawDist();
    });

    // CLT sample size slider
    const cltSlider = document.getElementById('cltSampleSize');
    cltSlider.addEventListener('input', (e) => {
      document.getElementById('cltNVal').textContent = e.target.value;
    });

    document.getElementById('runCltBtn').addEventListener('click', () => {
      this.runCLT();
    });

    // Hypothesis Button
    document.getElementById('calcHypoBtn').addEventListener('click', () => {
      this.calculateHypothesis();
    });
  }

  renderDistSliders() {
    const container = document.getElementById('slidersContainer');
    container.innerHTML = '';

    if (this.currentDist === 'normal') {
      container.innerHTML = `
        <div class="slider-item">
          <label>평균 (μ): <strong id="muVal">${this.normalParams.mu}</strong></label>
          <input type="range" id="muRange" min="-5" max="5" step="0.1" value="${this.normalParams.mu}">
        </div>
        <div class="slider-item">
          <label>표준편차 (σ): <strong id="sigmaVal">${this.normalParams.sigma}</strong></label>
          <input type="range" id="sigmaRange" min="0.2" max="3" step="0.1" value="${this.normalParams.sigma}">
        </div>
      `;
      document.getElementById('muRange').addEventListener('input', (e) => {
        this.normalParams.mu = parseFloat(e.target.value);
        document.getElementById('muVal').textContent = this.normalParams.mu;
        this.drawDist();
      });
      document.getElementById('sigmaRange').addEventListener('input', (e) => {
        this.normalParams.sigma = parseFloat(e.target.value);
        document.getElementById('sigmaVal').textContent = this.normalParams.sigma;
        this.drawDist();
      });
    } else if (this.currentDist === 'binomial') {
      container.innerHTML = `
        <div class="slider-item">
          <label>시행 횟수 (n): <strong id="nVal">${this.binomParams.n}</strong></label>
          <input type="range" id="nRange" min="5" max="40" step="1" value="${this.binomParams.n}">
        </div>
        <div class="slider-item">
          <label>성공 확률 (p): <strong id="pVal">${this.binomParams.p}</strong></label>
          <input type="range" id="pRange" min="0.05" max="0.95" step="0.05" value="${this.binomParams.p}">
        </div>
      `;
      document.getElementById('nRange').addEventListener('input', (e) => {
        this.binomParams.n = parseInt(e.target.value);
        document.getElementById('nVal').textContent = this.binomParams.n;
        this.drawDist();
      });
      document.getElementById('pRange').addEventListener('input', (e) => {
        this.binomParams.p = parseFloat(e.target.value);
        document.getElementById('pVal').textContent = this.binomParams.p;
        this.drawDist();
      });
    } else if (this.currentDist === 'poisson') {
      container.innerHTML = `
        <div class="slider-item">
          <label>모수 (λ): <strong id="lambdaVal">${this.poissonParams.lambda}</strong></label>
          <input type="range" id="lambdaRange" min="1" max="15" step="0.5" value="${this.poissonParams.lambda}">
        </div>
      `;
      document.getElementById('lambdaRange').addEventListener('input', (e) => {
        this.poissonParams.lambda = parseFloat(e.target.value);
        document.getElementById('lambdaVal').textContent = this.poissonParams.lambda;
        this.drawDist();
      });
    } else if (this.currentDist === 'uniform') {
      container.innerHTML = `
        <div class="slider-item">
          <label>하한 (a): <strong id="aVal">${this.uniformParams.a}</strong></label>
          <input type="range" id="aRange" min="-5" max="0" step="0.5" value="${this.uniformParams.a}">
        </div>
        <div class="slider-item">
          <label>상한 (b): <strong id="bVal">${this.uniformParams.b}</strong></label>
          <input type="range" id="bRange" min="0.5" max="5" step="0.5" value="${this.uniformParams.b}">
        </div>
      `;
      document.getElementById('aRange').addEventListener('input', (e) => {
        this.uniformParams.a = parseFloat(e.target.value);
        document.getElementById('aVal').textContent = this.uniformParams.a;
        this.drawDist();
      });
      document.getElementById('bRange').addEventListener('input', (e) => {
        this.uniformParams.b = parseFloat(e.target.value);
        document.getElementById('bVal').textContent = this.uniformParams.b;
        this.drawDist();
      });
    }
  }

  drawDist() {
    const w = this.distCanvas.width;
    const h = this.distCanvas.height;
    const ctx = this.distCtx;
    ctx.clearRect(0, 0, w, h);

    // Padding
    const pad = 40;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;

    // Draw axes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.stroke();

    const summaryEl = document.getElementById('statsSummary');

    if (this.currentDist === 'normal') {
      const { mu, sigma } = this.normalParams;
      summaryEl.innerHTML = `
        <span>평균 E(X): <strong>${mu.toFixed(2)}</strong></span>
        <span>분산 Var(X): <strong>${(sigma*sigma).toFixed(2)}</strong></span>
        <span>표준편차: <strong>${sigma.toFixed(2)}</strong></span>
      `;

      const xMin = mu - 4 * sigma;
      const xMax = mu + 4 * sigma;
      const yMax = normalPDF(mu, mu, sigma) * 1.25;

      // Draw Curve
      ctx.beginPath();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;

      for (let i = 0; i <= 200; i++) {
        const xVal = xMin + (i / 200) * (xMax - xMin);
        const yVal = normalPDF(xVal, mu, sigma);
        const px = pad + ((xVal - xMin) / (xMax - xMin)) * plotW;
        const py = (h - pad) - (yVal / yMax) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Fill area under curve
      ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
      ctx.lineTo(w - pad, h - pad);
      ctx.lineTo(pad, h - pad);
      ctx.closePath();
      ctx.fill();

    } else if (this.currentDist === 'binomial') {
      const { n, p } = this.binomParams;
      const mean = n * p;
      const variance = n * p * (1 - p);
      summaryEl.innerHTML = `
        <span>평균 E(X): <strong>${mean.toFixed(2)}</strong></span>
        <span>분산 Var(X): <strong>${variance.toFixed(2)}</strong></span>
        <span>표준편차: <strong>${Math.sqrt(variance).toFixed(2)}</strong></span>
      `;

      // PMF bars
      const probs = [];
      let maxP = 0;
      for (let k = 0; k <= n; k++) {
        const prob = combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        probs.push(prob);
        if (prob > maxP) maxP = prob;
      }
      maxP *= 1.2;

      const barW = Math.max(4, plotW / (n + 2) - 4);
      probs.forEach((prob, k) => {
        const px = pad + (k / (n + 1)) * plotW;
        const barH = (prob / maxP) * plotH;
        const py = (h - pad) - barH;

        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px, py, barW, barH);
      });

    } else if (this.currentDist === 'poisson') {
      const { lambda } = this.poissonParams;
      summaryEl.innerHTML = `
        <span>평균 E(X): <strong>${lambda.toFixed(2)}</strong></span>
        <span>분산 Var(X): <strong>${lambda.toFixed(2)}</strong></span>
        <span>표준편차: <strong>${Math.sqrt(lambda).toFixed(2)}</strong></span>
      `;

      const kMax = Math.max(15, Math.ceil(lambda * 2.5));
      const probs = [];
      let maxP = 0;
      for (let k = 0; k <= kMax; k++) {
        const prob = (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
        probs.push(prob);
        if (prob > maxP) maxP = prob;
      }
      maxP *= 1.2;

      const barW = Math.max(4, plotW / (kMax + 2) - 4);
      probs.forEach((prob, k) => {
        const px = pad + (k / (kMax + 1)) * plotW;
        const barH = (prob / maxP) * plotH;
        const py = (h - pad) - barH;

        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(px, py, barW, barH);
      });

    } else if (this.currentDist === 'uniform') {
      const { a, b } = this.uniformParams;
      const mean = (a + b) / 2;
      const variance = Math.pow(b - a, 2) / 12;
      summaryEl.innerHTML = `
        <span>평균 E(X): <strong>${mean.toFixed(2)}</strong></span>
        <span>분산 Var(X): <strong>${variance.toFixed(2)}</strong></span>
        <span>표준편차: <strong>${Math.sqrt(variance).toFixed(2)}</strong></span>
      `;

      const xMin = a - 1;
      const xMax = b + 1;
      const height = 1 / (b - a);
      const yMax = height * 1.4;

      const ax = pad + ((a - xMin) / (xMax - xMin)) * plotW;
      const bx = pad + ((b - xMin) / (xMax - xMin)) * plotW;
      const py = (h - pad) - (height / yMax) * plotH;

      ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
      ctx.fillRect(ax, py, bx - ax, (h - pad) - py);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.strokeRect(ax, py, bx - ax, (h - pad) - py);
    }
  }

  // Central Limit Theorem Monte Carlo Simulation
  runCLT() {
    const popType = document.getElementById('cltPopSelect').value;
    const n = parseInt(document.getElementById('cltSampleSize').value);
    const numSims = parseInt(document.getElementById('cltSimCount').value);

    const sampleMeans = [];
    let popMean = 0;
    let popVar = 0;

    // Distribution samplers
    const sampleOne = () => {
      if (popType === 'exponential') {
        // Exp(lambda = 1), mean=1, var=1
        return -Math.log(1 - Math.random());
      } else if (popType === 'uniform') {
        // U(0, 1), mean=0.5, var=1/12
        return Math.random();
      } else if (popType === 'bimodal') {
        // 50% N(0, 0.5), 50% N(4, 0.5)
        return Math.random() < 0.5
          ? (Math.random() + Math.random() - 1)
          : (4 + Math.random() + Math.random() - 1);
      }
      return Math.random();
    };

    // Calculate theoretical stats
    if (popType === 'exponential') { popMean = 1; popVar = 1; }
    else if (popType === 'uniform') { popMean = 0.5; popVar = 1 / 12; }
    else if (popType === 'bimodal') { popMean = 2; popVar = 4; }

    for (let sim = 0; sim < numSims; sim++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += sampleOne();
      }
      sampleMeans.push(sum / n);
    }

    this.cltData = {
      sampleMeans,
      n,
      numSims,
      theoryMean: popMean,
      theorySD: Math.sqrt(popVar / n)
    };

    this.drawCLT();
  }

  drawCLT() {
    if (!this.cltData) return;
    const { sampleMeans, n, theoryMean, theorySD } = this.cltData;
    const w = this.cltCanvas.width;
    const h = this.cltCanvas.height;
    const ctx = this.cltCtx;
    ctx.clearRect(0, 0, w, h);

    const pad = 40;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;

    // Histogram Bins
    const numBins = 40;
    const minVal = theoryMean - 3.5 * theorySD;
    const maxVal = theoryMean + 3.5 * theorySD;
    const binWidth = (maxVal - minVal) / numBins;
    const bins = new Array(numBins).fill(0);

    sampleMeans.forEach(val => {
      if (val >= minVal && val < maxVal) {
        const b = Math.floor((val - minVal) / binWidth);
        if (b >= 0 && b < numBins) bins[b]++;
      }
    });

    const maxBinCount = Math.max(...bins) * 1.15;

    // Draw Histogram
    const barW = plotW / numBins;
    bins.forEach((cnt, idx) => {
      const bx = pad + idx * barW;
      const bh = (cnt / maxBinCount) * plotH;
      const by = (h - pad) - bh;

      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(bx, by, barW - 1, bh);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, barW - 1, bh);
    });

    // Draw Theoretical Normal Curve Overlaid
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;

    for (let i = 0; i <= 200; i++) {
      const xVal = minVal + (i / 200) * (maxVal - minVal);
      const pdfVal = normalPDF(xVal, theoryMean, theorySD);
      // scale PDF to histogram peak
      const maxPdf = normalPDF(theoryMean, theoryMean, theorySD);
      const px = pad + ((xVal - minVal) / (maxVal - minVal)) * plotW;
      const py = (h - pad) - (pdfVal / maxPdf) * (Math.max(...bins) / maxBinCount) * plotH;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Baseline axis
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    // Legend
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#0284c7';
    ctx.fillText(`■ 표본평균 히스토그램 (n=${n})`, pad + 10, pad + 15);
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`— 이론적 정규분포 N(μ, σ²/n)`, pad + 200, pad + 15);
  }

  // Hypothesis Testing Z-calc
  calculateHypothesis() {
    const xBar = parseFloat(document.getElementById('hypoX').value);
    const mu = parseFloat(document.getElementById('hypoMu').value);
    const sigma = parseFloat(document.getElementById('hypoSigma').value);
    const n = parseFloat(document.getElementById('hypoN').value);
    const tail = document.getElementById('hypoTail').value;

    const se = sigma / Math.sqrt(n);
    const z = (xBar - mu) / se;

    let pVal = 0;
    if (tail === 'two') {
      pVal = 2 * (1 - normalCDF(Math.abs(z)));
    } else if (tail === 'right') {
      pVal = 1 - normalCDF(z);
    } else if (tail === 'left') {
      pVal = normalCDF(z);
    }

    document.getElementById('hypoZVal').textContent = (z >= 0 ? '+' : '') + z.toFixed(2);
    document.getElementById('hypoPVal').textContent = pVal.toFixed(4);

    const decisionEl = document.getElementById('hypoDecision');
    if (pVal < 0.05) {
      decisionEl.textContent = '유의수준 α = 0.05에서 귀무가설(H₀) 기각! (통계적으로 매우 유의미한 차이)';
      decisionEl.style.color = '#15803d';
    } else {
      decisionEl.textContent = '유의수준 α = 0.05에서 귀무가설(H₀) 채택 (통계적으로 유의미한 차이 없음)';
      decisionEl.style.color = '#b45309';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ProbabilityLab();
});
