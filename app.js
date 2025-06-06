function safeGetItem(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

let players = safeGetItem('players', []);
let sessions = safeGetItem('sessions', []);
let sortBy = 'name';
let sortAsc = true;

function saveData() {
  try {
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('sessions', JSON.stringify(sessions));
  } catch (e) {
    alert("Unable to save data.");
  }
}

function render() {
  const app = document.getElementById('app');
  if (!app) {
    document.body.innerHTML = "<p style='color: white; padding: 1em;'>Error: Could not load app.</p>";
    return;
  }

  app.innerHTML = '<h1 style="font-size: 1.8em; margin-bottom: 0.5em;">🎲 Board Game Stats</h1>';

  const controls = document.createElement('div');
  controls.style.marginBottom = '1em';

  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Player name';
  nameInput.style = 'padding: 0.5em; margin-right: 0.5em;';
  controls.appendChild(nameInput);

  const addBtn = document.createElement('button');
  addBtn.textContent = '➕ Add Player';
  addBtn.onclick = () => {
    if (nameInput.value) {
      players.push({ name: nameInput.value, wins: 0, games: 0, avgPlacement: 0, biggestWin: null });
      saveData();
      render();
    }
  };
  controls.appendChild(addBtn);

  const gameBtn = document.createElement('button');
  gameBtn.textContent = '📝 Record Game';
  gameBtn.style.marginLeft = '0.5em';
  gameBtn.onclick = showGameForm;
  controls.appendChild(gameBtn);

  const resetBtn = document.createElement('button');
  resetBtn.textContent = '🗑️ Reset';
  resetBtn.style.marginLeft = '0.5em';
  resetBtn.onclick = () => {
    if (confirm("Are you sure you want to clear all data?")) {
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
    { label: 'Avg Placement', key: 'avgPlacement' },
    { label: 'Best Win', key: 'biggestWin' },
    { label: '', key: 'remove' }
  ];

  const sortedPlayers = [...players].sort((a, b) => {
    let aVal = a[sortBy], bVal = b[sortBy];
    if (sortBy === 'biggestWin') {
      aVal = a.biggestWin ? a.biggestWin.percent : 0;
      bVal = b.biggestWin ? b.biggestWin.percent : 0;
    }
    if (sortBy === 'name') {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    return sortAsc ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
  });

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.marginTop = '1em';
  table.style.borderCollapse = 'collapse';
  table.innerHTML = '<thead><tr>' + headers.map(h => 
    `<th style="text-align:left;padding:8px;">
      ${h.label} ${h.key !== 'remove' ? `<button onclick="changeSort('${h.key}')" style="background:none;border:none;color:white;">↕️</button>` : ''}
    </th>`
  ).join('') + '</tr></thead>';

  const tbody = document.createElement('tbody');
  sortedPlayers.forEach((p, index) => {
    const row = document.createElement('tr');
    const avg = p.games > 0 ? (p.avgPlacement || 0).toFixed(2) : '—';
    const best = p.biggestWin ? p.biggestWin.percent.toFixed(2) + '%' : '—';
    row.innerHTML = `
      <td style="padding:8px;">${p.name}</td>
      <td style="text-align:right;padding:8px;">${p.wins}</td>
      <td style="text-align:right;padding:8px;">${p.games}</td>
      <td style="text-align:right;padding:8px;">${avg}</td>
      <td style="text-align:right;padding:8px;">${best}</td>
      <td style="text-align:right;padding:8px;">
        <button onclick="removePlayer(${index})" style="background:red;color:white;border:none;padding:0.3em 0.6em;">Remove</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  app.appendChild(table);
}

function changeSort(key) {
  if (sortBy === key) {
    sortAsc = !sortAsc;
  } else {
    sortBy = key;
    sortAsc = true;
  }
  render();
}

function removePlayer(index) {
  players.splice(index, 1);
  saveData();
  render();
}

function showGameForm() {
  const app = document.getElementById('app');
  app.innerHTML = '<h1>Record a Game</h1>';

  const form = document.createElement('div');

  const gameLabel = document.createElement('label');
  gameLabel.textContent = 'Game Name:';
  gameLabel.style.display = 'block';
  const gameInput = document.createElement('input');
  gameInput.placeholder = 'Enter game name';
  gameInput.style = 'display:block;margin-bottom:1em;padding:0.5em;';
  form.appendChild(gameLabel);
  form.appendChild(gameInput);

  const scoreInputs = [];
  players.forEach((player, i) => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '0.5em';

    const label = document.createElement('label');
    label.textContent = player.name;
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = 'Score';
    input.style.marginLeft = '1em';
    input.dataset.index = i;

    const dnp = document.createElement('input');
    dnp.type = 'checkbox';
    dnp.style.marginLeft = '1em';
    const dnpLabel = document.createElement('span');
    dnpLabel.textContent = 'Did Not Play';
    dnpLabel.style.marginLeft = '0.5em';

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(dnp);
    wrapper.appendChild(dnpLabel);
    form.appendChild(wrapper);

    scoreInputs.push({ input, dnp, index: i });
  });

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '💾 Save Game';
  saveBtn.onclick = () => {
    const scores = [];
    scoreInputs.forEach(({ input, dnp, index }) => {
      if (!dnp.checked && input.value !== '') {
        scores.push({ name: players[index].name, score: parseInt(input.value, 10), index });
      }
    });
    if (scores.length > 1) {
      scores.sort((a, b) => b.score - a.score);
      const winner = scores[0];
      const second = scores[1];
      const relWin = (winner.score - second.score) / second.score;

      scores.forEach((s, place) => {
        const p = players[s.index];
        p.games = (p.games || 0) + 1;
        p.avgPlacement = ((p.avgPlacement || 0) * (p.games - 1) + (place + 1)) / p.games;
        if (s.index === winner.index) p.wins = (p.wins || 0) + 1;
      });

      const winnerPlayer = players[winner.index];
      if (!winnerPlayer.biggestWin || relWin > winnerPlayer.biggestWin.percent) {
        winnerPlayer.biggestWin = {
          percent: relWin,
          game: gameInput.value,
          date: new Date().toISOString()
        };
      }

      saveData();
      render();
    } else {
      alert('Need at least two players with scores.');
    }
  };

  form.appendChild(document.createElement('br'));
  form.appendChild(saveBtn);
  app.appendChild(form);
}

window.onload = render;