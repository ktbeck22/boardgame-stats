try {
  let players = JSON.parse(localStorage.getItem('players') || '[]');
  let sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

  function saveData() {
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('sessions', JSON.stringify(sessions));
  }

  function render() {
    const app = document.getElementById('app');
    if (!app) throw new Error("Missing #app element");
    app.innerHTML = '<h1>🎲 Board Game Stats</h1>';

    const controls = document.createElement('div');
    const nameInput = document.createElement('input');
    nameInput.placeholder = 'Player name';
    controls.appendChild(nameInput);

    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add Player';
    addBtn.onclick = () => {
      if (nameInput.value) {
        players.push({ name: nameInput.value, color: '#ffffff' });
        saveData();
        render();
      }
    };
    controls.appendChild(addBtn);
    app.appendChild(controls);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Name', 'Games'].forEach(label => {
      const th = document.createElement('th');
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    players.forEach(p => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td');
      td1.textContent = p.name;
      const td2 = document.createElement('td');
      td2.textContent = p.games || 0;
      tr.append(td1, td2);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    app.appendChild(table);
  }

  window.onload = () => {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<p>Loading app...</p>';
    }
    render();
  };

} catch (e) {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '<pre style="color: red; white-space: pre-wrap;">Error loading app:\n' + e.message + '</pre>';
  }
}