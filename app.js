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

  app.innerHTML = '<h1>Board Game Stats</h1>';

  const sortOptions = ['name', 'wins', 'games', 'avgPlacement', 'biggestWin'];
  const sortButtons = document.createElement('div');
  sortButtons.innerHTML = '<h2>Sort Players By:</h2>';
  sortOptions.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.onclick = () => {
      sortBy = option;
      render();
    };
    sortButtons.appendChild(btn);
  });
  app.appendChild(sortButtons);

  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'biggestWin') {
      const aWin = a.biggestWin ? a.biggestWin.percent : 0;
      const bWin = b.biggestWin ? b.biggestWin.percent : 0;
      return bWin - aWin;
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      return (b[sortBy] || 0) - (a[sortBy] || 0);
    }
  });

  const playerList = document.createElement('div');
  playerList.innerHTML = '<h2>Players</h2>' + sortedPlayers.map(p => `
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

  const gameBtn = document.createElement('button');
  gameBtn.textContent = 'Record Game';
  gameBtn.style.marginLeft = '1em';
  gameBtn.onclick = showGameForm;
  app.appendChild(gameBtn);
}

function showGameForm() {
  const app = document.getElementById('app');
  app.innerHTML = '<h1>Record a Game</h1>';

  const form = document.createElement('div');
  const gameInput = document.createElement('input');
  gameInput.placeholder = 'Game name';
  form.appendChild(gameInput);

  const scoreInputs = [];
  players.forEach((player, i) => {
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

    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(dnp);
    form.appendChild(dnpLabel);
    form.appendChild(document.createElement('br'));

    scoreInputs.push({ input, dnp, index: i });
  });

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save Game';
  saveBtn.onclick = () => {
    const scores = [];
    scoreInputs.forEach(({ input, dnp, index }) => {
      if (!dnp.checked && input.value !== '') {
        scores.push({ name: players[index].name, score: parseInt(input.value, 10) });
      }
    });
    if (scores.length > 1) {
      scores.sort((a, b) => b.score - a.score);
      const winner = scores[0];
      const second = scores[1];
      const relWin = (winner.score - second.score) / second.score;
      players.forEach(p => {
        const played = scores.find(s => s.name === p.name);
        if (played) {
          p.games = (p.games || 0) + 1;
          if (played.name === winner.name) p.wins = (p.wins || 0) + 1;
        }
      });
      const winnerPlayer = players.find(p => p.name === winner.name);
      if (winnerPlayer && (!winnerPlayer.biggestWin || relWin > winnerPlayer.biggestWin.percent)) {
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