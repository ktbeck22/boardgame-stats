let players = JSON.parse(localStorage.getItem('players') || '[]');
let sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

function saveData() {
  localStorage.setItem('players', JSON.stringify(players));
  localStorage.setItem('sessions', JSON.stringify(sessions));
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '<h1>🎲 Board Game Stats</h1>';

  const controls = document.createElement('div');

  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Player name';
  controls.appendChild(nameInput);

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = '#ffffff';
  colorInput.style.marginRight = '0.5em';
  controls.appendChild(colorInput);

  const addBtn = document.createElement('button');
  addBtn.textContent = '➕ Add Player';
  addBtn.onclick = () => {
    if (nameInput.value) {
      players.push({ name: nameInput.value, color: colorInput.value });
      saveData();
      render();
    }
  };
  controls.appendChild(addBtn);

  const recordBtn = document.createElement('button');
  recordBtn.textContent = '📝 Record Game';
  recordBtn.onclick = showGameForm;
  controls.appendChild(recordBtn);

  app.appendChild(controls);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Name', 'Wins', 'Games', 'Avg Place', 'Avg Dominance', 'Avg Game Score'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  players.forEach(p => {
    const tr = document.createElement('tr');
    const data = [
      p.name,
      p.wins || 0,
      p.games || 0,
      p.avgPlacement?.toFixed(2) || '—',
      (p.avgDominance * 100)?.toFixed(1) + '%' || '—',
      p.avgGameScore?.toFixed(1) || '—'
    ];
    data.forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  app.appendChild(table);

  if (sessions.length) {
    const graphSection = document.createElement('div');
    graphSection.innerHTML = \`
      <h2>📈 Stats Over Time</h2>
      <select onchange="renderChart(this.value)">
        <option value="placement">Average Placement</option>
        <option value="gameScore">Game Score</option>
        <option value="dominance">Dominance</option>
      </select>
      <canvas id="stats-chart" width="800" height="400"></canvas>\`;
    app.appendChild(graphSection);
    renderChart('placement');
  }
}

function showGameForm() {
  const app = document.getElementById('app');
  app.innerHTML = '<h1>📝 Record Game</h1>';

  const form = document.createElement('div');
  const gameInput = document.createElement('input');
  gameInput.placeholder = 'Game name';
  form.appendChild(gameInput);

  const entries = players.map(p => {
    const div = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = p.name;
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = 'Score';
    div.append(label, input);
    form.appendChild(div);
    return { name: p.name, input };
  });

  const submit = document.createElement('button');
  submit.textContent = 'Submit';
  submit.onclick = () => {
    const scores = entries.map(e => ({
      name: e.name,
      score: parseFloat(e.input.value) || 0
    })).filter(s => !isNaN(s.score));

    scores.sort((a, b) => b.score - a.score);
    const max = scores[0].score;
    const min = scores[scores.length - 1].score;

    scores.forEach((s, i) => {
      const p = players.find(p => p.name === s.name);
      p.games = (p.games || 0) + 1;
      p.wins = p.wins || 0;
      if (i === 0) p.wins++;
      p.placementSum = (p.placementSum || 0) + (i + 1);
      p.avgPlacement = p.placementSum / p.games;
      const dominance = (s.score - min) / (max - min || 1);
      p.dominanceSum = (p.dominanceSum || 0) + dominance;
      p.avgDominance = p.dominanceSum / p.games;
      const scoreSteps = scores.length > 1 ? 100 / (scores.length - 1) : 0;
      const gameScore = 100 - i * scoreSteps;
      p.gameScoreSum = (p.gameScoreSum || 0) + gameScore;
      p.avgGameScore = p.gameScoreSum / p.games;
    });

    sessions.push({
      game: gameInput.value,
      date: new Date().toISOString(),
      scores: scores.map((s, i) => {
        return {
          name: s.name,
          score: s.score,
          dominance: (s.score - min) / (max - min || 1),
          gameScore: 100 - i * ((scores.length > 1) ? 100 / (scores.length - 1) : 0)
        };
      })
    });

    saveData();
    render();
  };
  form.appendChild(submit);
  app.appendChild(form);
}

function renderChart(metric) {
  const canvas = document.getElementById('stats-chart');
  if (!canvas || !sessions.length || !players.length) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const padding = 40;
  const maxGames = sessions.length;
  const totals = Object.fromEntries(players.map(p => [p.name, { sum: 0, count: 0, data: [] }]));
  let maxVal = 0;

  sessions.forEach((s, i) => {
    s.scores.forEach(score => {
      const value = metric === 'placement' ? score.score : score[metric];
      const t = totals[score.name];
      t.sum += value;
      t.count += 1;
      const avg = t.sum / t.count;
      t.data.push({ x: i, y: avg });
      if (avg > maxVal) maxVal = avg;
    });
  });

  Object.entries(totals).forEach(([name, t]) => {
    const p = players.find(p => p.name === name);
    if (!t.data.length) return;
    ctx.beginPath();
    ctx.strokeStyle = p.color || 'white';
    t.data.forEach((pt, i) => {
      const x = padding + pt.x * ((canvas.width - 2 * padding) / (maxGames - 1 || 1));
      const y = canvas.height - padding - (pt.y / maxVal) * (canvas.height - 2 * padding);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  ctx.strokeStyle = '#666';
  ctx.strokeRect(padding, padding, canvas.width - 2 * padding, canvas.height - 2 * padding);
}

window.onload = render;