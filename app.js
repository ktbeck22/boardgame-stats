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

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '💾 Save Backup';
  saveBtn.onclick = downloadState;
  controls.appendChild(saveBtn);

  const loadLabel = document.createElement('label');
  loadLabel.textContent = '📂 Load Backup';
  const loadInput = document.createElement('input');
  loadInput.type = 'file';
  loadInput.accept = '.json';
  loadInput.style.display = 'none';
  loadInput.onchange = uploadState;
  loadLabel.appendChild(loadInput);
  loadLabel.style.cursor = 'pointer';
  controls.appendChild(loadLabel);

  const resetBtn = document.createElement('button');
  resetBtn.textContent = '♻️ Reset All';
  resetBtn.onclick = () => {
    if (confirm('Reset all data?')) {
      players = [];
      sessions = [];
      saveData();
      render();
    }
  };
  controls.appendChild(resetBtn);

  app.appendChild(controls);

  const headers = [
    { label: 'Name', key: 'name' },
    { label: 'Wins', key: 'wins' },
    { label: 'Games', key: 'games' },
    { label: 'Avg Place', key: 'avgPlacement' },
    { label: 'Dominance', key: 'avgDominance' },
    { label: 'Game Score', key: 'avgGameScore' }
  ];

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h.label;
    const sortBtn = document.createElement('button');
    sortBtn.textContent = '⇅';
    sortBtn.onclick = () => {
      players.sort((a, b) => (b[h.key] || 0) - (a[h.key] || 0));
      render();
    };
    th.appendChild(sortBtn);
    headRow.appendChild(th);
  });
  headRow.appendChild(document.createElement('th'));
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  players.forEach(p => {
    const tr = document.createElement('tr');
    headers.forEach(h => {
      const td = document.createElement('td');
      let val = p[h.key];
      if (h.key.includes('avg')) val = val ? val.toFixed(2) : '—';
      td.textContent = val || (h.key === 'name' ? p.name : '—');
      td.style.textAlign = 'right';
      tr.appendChild(td);
    });
    const logBtn = document.createElement('button');
    logBtn.textContent = 'Log';
    logBtn.onclick = () => showPlayerLog(p.name);
    const td = document.createElement('td');
    td.appendChild(logBtn);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  app.appendChild(table);

  // Game list
  if (sessions.length) {
    const gameList = document.createElement('ul');
    app.appendChild(document.createElement('h2')).textContent = '📅 Past Games';
    sessions.forEach((s, i) => {
      const item = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = `${s.game} (${new Date(s.date).toLocaleString()})`;
      btn.onclick = () => showGameLog(i);
      item.appendChild(btn);
      gameList.appendChild(item);
    });
    app.appendChild(gameList);
  }

  // Chart
  const chartSection = document.createElement('div');
  chartSection.innerHTML = `
    <h2>📈 Stats Over Time</h2>
    <select onchange="renderChart(this.value)">
      <option value="placement">Average Placement</option>
      <option value="gameScore">Game Score</option>
      <option value="dominance">Dominance</option>
    </select>
    <canvas id="stats-chart" width="800" height="400"></canvas>`;
  app.appendChild(chartSection);
  renderChart('placement');
}

function showGameForm() {
  const app = document.getElementById('app');
  app.innerHTML = '<h1>📝 Record Game</h1>';

  const form = document.createElement('div');
  const gameInput = document.createElement('input');
  gameInput.placeholder = 'Game name';
  form.appendChild(gameInput);

  const inputs = players.map(p => {
    const div = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = p.name;
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = 'Score';
    const skip = document.createElement('input');
    skip.type = 'checkbox';
    skip.onchange = () => input.disabled = skip.checked;
    div.append(label, input, skip);
    form.appendChild(div);
    return { name: p.name, input, skip };
  });

  const submitBtn = document.createElement('button');
  submitBtn.textContent = '✅ Submit';
  submitBtn.onclick = () => {
    const scores = inputs.filter(i => !i.skip.checked).map(i => ({
      name: i.name,
      score: parseFloat(i.input.value) || 0
    }));
    scores.sort((a, b) => b.score - a.score);
    const maxScore = scores[0].score;
    const minScore = scores[scores.length - 1].score;
    scores.forEach((s, place) => {
      const p = players.find(p => p.name === s.name);
      p.games = (p.games || 0) + 1;
      p.placementSum = (p.placementSum || 0) + (place + 1);
      p.avgPlacement = p.placementSum / p.games;
      if (place === 0) p.wins = (p.wins || 0) + 1;
      p.dominanceSum = (p.dominanceSum || 0) + ((s.score - minScore) / (maxScore - minScore || 1));
      p.avgDominance = p.dominanceSum / p.games;
      const step = scores.length > 1 ? 100 / (scores.length - 1) : 0;
      p.gameScoreSum = (p.gameScoreSum || 0) + (100 - place * step);
      p.avgGameScore = p.gameScoreSum / p.games;
    });

    const session = {
      game: gameInput.value,
      date: new Date().toISOString(),
      scores: scores.map((s, place) => ({
        name: s.name,
        score: s.score,
        dominance: (s.score - minScore) / (maxScore - minScore || 1),
        gameScore: 100 - place * ((scores.length > 1) ? 100 / (scores.length - 1) : 0)
      }))
    };
    sessions.push(session);
    saveData();
    render();
  };
  form.appendChild(submitBtn);
  app.appendChild(form);
}

function renderChart(metric) {
  const canvas = document.getElementById('stats-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const padding = 40;
  const maxGames = sessions.length;
  const playersByName = Object.fromEntries(players.map(p => [p.name, []]));
  let maxVal = 0;

  const totals = Object.fromEntries(players.map(p => [p.name, { sum: 0, count: 0, data: [] }]));

  sessions.forEach((s, i) => {
    s.scores.forEach(score => {
      const value = metric === 'placement' ? score.score : score[metric];
      const t = totals[score.name];
      t.sum += value;
      t.count += 1;
      const avg = t.sum / t.count;
      if (avg > maxVal) maxVal = avg;
      t.data.push({ x: i, y: avg });
    });
  });

  Object.entries(totals).forEach(([name, t]) => {
    const p = players.find(p => p.name === name);
    ctx.beginPath();
    ctx.strokeStyle = p.color || 'white';
    ctx.lineWidth = 2;
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
}

function showPlayerLog(name) {
  const app = document.getElementById('app');
  app.innerHTML = `<h1>📋 Game Log: ${name}</h1>`;
  const backBtn = document.createElement('button');
  backBtn.textContent = '⬅️ Back';
  backBtn.onclick = render;
  app.appendChild(backBtn);

  const rows = sessions.map((s, i) => {
    const score = s.scores.find(sc => sc.name === name);
    if (!score) return null;
    const place = [...s.scores].sort((a, b) => b.score - a.score).findIndex(sc => sc.name === name) + 1;
    return `<tr><td>${s.game}</td><td>${place}</td><td>${score.score}</td><td>${score.gameScore.toFixed(1)}</td><td>${(score.dominance * 100).toFixed(1)}%</td></tr>`;
  }).filter(Boolean).join('');
  app.innerHTML += `<table><thead><tr><th>Game</th><th>Place</th><th>Score</th><th>Game Score</th><th>Dominance</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function showGameLog(index) {
  const session = sessions[index];
  const app = document.getElementById('app');
  app.innerHTML = `<h1>📊 Game: ${session.game}</h1>`;
  const backBtn = document.createElement('button');
  backBtn.textContent = '⬅️ Back';
  backBtn.onclick = render;
  app.appendChild(backBtn);

  const rows = session.scores.map((s, i) => `<tr><td>${s.name}</td><td>${i + 1}</td><td>${s.score}</td><td>${s.gameScore.toFixed(1)}</td><td>${(s.dominance * 100).toFixed(1)}%</td></tr>`).join('');
  app.innerHTML += `<table><thead><tr><th>Player</th><th>Place</th><th>Score</th><th>Game Score</th><th>Dominance</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function downloadState() {
  const data = { players, sessions };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'boardgame_stats_backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function uploadState(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const data = JSON.parse(e.target.result);
    players = data.players || [];
    sessions = data.sessions || [];
    saveData();
    render();
  };
  reader.readAsText(file);
}

window.onload = render;