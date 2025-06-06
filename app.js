function safeGetItem(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

let players = safeGetItem('players', []);
let sessions = safeGetItem('sessions', []);

function saveData() {
  try {
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('sessions', JSON.stringify(sessions));
  } catch (e) {
    alert("Unable to save data. Try using a different browser.");
  }
}

function render() {
  const app = document.getElementById('app');
  if (!app) {
    document.body.innerHTML = "<p style='color: white; padding: 1em;'>Error: Could not load app.</p>";
    return;
  }

  app.innerHTML = '<h1>Board Game Stats</h1>';

  const playerList = document.createElement('div');
  playerList.innerHTML = '<h2>Players</h2>' + players.map(p => `
    <div class="card">
      <strong>${p.name}</strong><br>
      Wins: ${p.wins || 0}<br>
      Games: ${p.games || 0}<br>
      Avg Placement: ${(p.avgPlacement || 0).toFixed(2)}<br>
      Best Win: ${p.biggestWin ? (p.biggestWin.percent.toFixed(2) + '%') : '—'}
    </div>
  `).join('');
  app.appendChild(playerList);

  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Player name';
  nameInput.style = 'display:block;margin-top:1em;padding:0.5em;';
  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add Player';
  addBtn.onclick = () => {
    if (nameInput.value) {
      players.push({ name: nameInput.value, wins: 0, games: 0, avgPlacement: 0, biggestWin: null });
      saveData();
      render();
    }
  };
  app.appendChild(nameInput);
  app.appendChild(addBtn);
}

window.onload = render;