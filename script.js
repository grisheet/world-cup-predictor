const DATA_PATH = "./data/teams.json";

const state = {
  teams: [],
  selectedTeam1: "",
  selectedTeam2: ""
};

const els = {
  team1: document.getElementById("team1"),
  team2: document.getElementById("team2"),
  predictBtn: document.getElementById("predictBtn"),
  result: document.getElementById("result"),
  comparison: document.getElementById("comparison"),
  squads: document.getElementById("squads"),
  lineups: document.getElementById("lineups")
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getHeadshot(player) {
  return player?.headshot || `https://via.placeholder.com/80x80?text=${encodeURIComponent((player?.name || "?").slice(0, 2).toUpperCase())}`;
}

function createOption(team) {
  const option = document.createElement("option");
  option.value = team.name;
  option.textContent = team.name;
  return option;
}

function clearSelectOptions(select) {
  const defaultOption = select.querySelector('option[value=""]');
  select.innerHTML = "";
  if (defaultOption) {
    select.appendChild(defaultOption);
  } else {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Select a team";
    select.appendChild(option);
  }
}

function populateTeamSelectors(teams) {
  clearSelectOptions(els.team1);
  clearSelectOptions(els.team2);

  teams
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((team) => {
      els.team1.appendChild(createOption(team));
      els.team2.appendChild(createOption(team));
    });
}

function normalizeTeam(rawTeam) {
  return {
    name: rawTeam.name,
    attack: Number(rawTeam.attack ?? 0),
    midfield: Number(rawTeam.midfield ?? 0),
    defense: Number(rawTeam.defense ?? 0),
    form: Number(rawTeam.form ?? 0),
    worldCupHistory: Number(rawTeam.worldCupHistory ?? 0),
    manager: rawTeam.manager || "Unknown manager",
    formation: rawTeam.formation || "4-3-3",
    startingXI: Array.isArray(rawTeam.startingXI) ? rawTeam.startingXI : [],
    substitutes: Array.isArray(rawTeam.substitutes) ? rawTeam.substitutes : [],
    reserves: Array.isArray(rawTeam.reserves) ? rawTeam.reserves : []
  };
}

function getTeamByName(name) {
  return state.teams.find((team) => team.name === name);
}

function formatPct(value) {
  return `${Number(value).toFixed(1)}%`;
}

function getMetricItems(team) {
  return [
    { key: "attack", label: "Attack", value: team.attack },
    { key: "midfield", label: "Midfield", value: team.midfield },
    { key: "defense", label: "Defense", value: team.defense },
    { key: "form", label: "Form", value: team.form },
    { key: "worldCupHistory", label: "World Cup History", value: team.worldCupHistory }
  ];
}

function calculateTeamStrength(team) {
  return (
    team.attack * 0.30 +
    team.midfield * 0.22 +
    team.defense * 0.22 +
    team.form * 0.16 +
    team.worldCupHistory * 0.10
  );
}

function calculatePrediction(teamA, teamB) {
  const strengthA = calculateTeamStrength(teamA);
  const strengthB = calculateTeamStrength(teamB);
  const diff = strengthA - strengthB;

  let teamAWin = 33;
  let draw = 34;
  let teamBWin = 33;

  if (diff > 0) {
    teamAWin += Math.min(36, diff * 2.2);
    teamBWin -= Math.min(22, diff * 1.15);
    draw -= Math.min(14, diff * 0.95);
  } else {
    teamBWin += Math.min(36, Math.abs(diff) * 2.2);
    teamAWin -= Math.min(22, Math.abs(diff) * 1.15);
    draw -= Math.min(14, Math.abs(diff) * 0.95);
  }

  teamAWin = Math.max(6, teamAWin);
  draw = Math.max(6, draw);
  teamBWin = Math.max(6, teamBWin);

  const total = teamAWin + draw + teamBWin;

  const probabilities = {
    teamAWin: (teamAWin / total) * 100,
    draw: (draw / total) * 100,
    teamBWin: (teamBWin / total) * 100
  };

  const winner =
    probabilities.teamAWin > probabilities.teamBWin
      ? teamA.name
      : probabilities.teamBWin > probabilities.teamAWin
      ? teamB.name
      : "Too close to call";

  return {
    teamA,
    teamB,
    strengthA,
    strengthB,
    probabilities,
    winner
  };
}

function renderEmptyState(message) {
  return `<div class="section-kicker">${escapeHtml(message)}</div>`;
}

function renderPrediction(teamA, teamB) {
  const prediction = calculatePrediction(teamA, teamB);
  const { probabilities, strengthA, strengthB, winner } = prediction;

  return `
    <div class="section-kicker">Match forecast</div>
    <div class="match-title">${escapeHtml(teamA.name)} vs ${escapeHtml(teamB.name)}</div>

    <div class="prob-row">
      <span class="prob-label">${escapeHtml(teamA.name)} win</span>
      <span class="prob-value">${formatPct(probabilities.teamAWin)}</span>
    </div>
    <div class="bar">
      <div class="fill team-a" style="width: ${probabilities.teamAWin}%"></div>
    </div>

    <div class="prob-row">
      <span class="prob-label">Draw</span>
      <span class="prob-value">${formatPct(probabilities.draw)}</span>
    </div>
    <div class="bar">
      <div class="fill draw" style="width: ${probabilities.draw}%"></div>
    </div>

    <div class="prob-row">
      <span class="prob-label">${escapeHtml(teamB.name)} win</span>
      <span class="prob-value">${formatPct(probabilities.teamBWin)}</span>
    </div>
    <div class="bar">
      <div class="fill team-b" style="width: ${probabilities.teamBWin}%"></div>
    </div>

    <div class="scoreline">
      Projected edge: ${escapeHtml(winner)}<br>
      Strength score: ${escapeHtml(teamA.name)} ${strengthA.toFixed(1)} - ${strengthB.toFixed(1)} ${escapeHtml(teamB.name)}
    </div>
  `;
}

function renderComparisonRow(teamA, teamB, item) {
  const aWins = teamA[item.key] > teamB[item.key];
  const bWins = teamB[item.key] > teamA[item.key];

  return `
    <div class="comparison-row">
      <div class="comp-team-a" style="color:${aWins ? "#93c5fd" : "inherit"}">${teamA[item.key]}</div>
      <div class="comp-label">${escapeHtml(item.label)}</div>
      <div class="comp-team-b" style="color:${bWins ? "#fca5a5" : "inherit"}">${teamB[item.key]}</div>
    </div>
  `;
}

function renderComparison(teamA, teamB) {
  const metrics = getMetricItems(teamA);

  return `
    <div class="section-kicker">Side-by-side breakdown</div>
    <div class="match-title">${escapeHtml(teamA.name)} vs ${escapeHtml(teamB.name)}</div>
    <div class="comparison-grid">
      ${metrics.map((item) => renderComparisonRow(teamA, teamB, item)).join("")}
    </div>
  `;
}

function renderPlayerListItem(player) {
  return `
    <li class="player-list-item">
      <img
        class="player-avatar"
        src="${escapeHtml(getHeadshot(player))}"
        alt="${escapeHtml(player.name)}"
        width="44"
        height="44"
        loading="lazy"
        onerror="this.onerror=null;this.src='https://via.placeholder.com/80x80?text=?';"
      />
      <div class="player-meta">
        <span class="player-list-name">${escapeHtml(player.name)}</span>
        <span class="player-list-position">${escapeHtml(player.position || "N/A")}</span>
      </div>
    </li>
  `;
}

function renderSquadSection(title, players) {
  return `
    <div class="squad-block">
      <h3>${escapeHtml(title)}</h3>
      <ul class="player-list">
        ${players.length ? players.map(renderPlayerListItem).join("") : `<li class="player-list-item"><div class="player-meta"><span class="player-list-name">No players listed</span></div></li>`}
      </ul>
    </div>
  `;
}

function renderTeamSquad(team) {
  return `
    <div class="squad-team">
      <div class="squad-top">
        <div>
          <div class="section-kicker">National Team</div>
          <div class="match-title">${escapeHtml(team.name)}</div>
        </div>

        <div class="squad-meta">
          <span class="meta-pill manager-pill">${escapeHtml(team.manager)}</span>
          <span class="meta-pill formation-pill">${escapeHtml(team.formation)}</span>
        </div>
      </div>

      ${renderSquadSection("Starting XI", team.startingXI)}
      ${renderSquadSection("Substitutes", team.substitutes)}
      ${renderSquadSection("Reserves", team.reserves)}
    </div>
  `;
}

function renderSquads(teamA, teamB) {
  return `
    <div class="squad-grid">
      ${renderTeamSquad(teamA)}
      ${renderTeamSquad(teamB)}
    </div>
  `;
}

function parseFormation(formation) {
  const parts = String(formation || "4-3-3")
    .split("-")
    .map((part) => Number(part))
    .filter((part) => !Number.isNaN(part) && part > 0);

  if (parts.length === 3) {
    return [1, ...parts];
  }

  if (parts.length === 4) {
    return [1, parts[0], parts[1], parts[2], parts[3]];
  }

  return [1, 4, 3, 3];
}

function getRoleLabels(rowCount) {
  if (rowCount === 4) return ["GK", "DEF", "MID", "FWD"];
  if (rowCount === 5) return ["GK", "DEF", "MID", "AM", "FWD"];
  return ["GK", "DEF", "MID", "FWD"];
}

function splitPlayersByFormation(players, formation) {
  const rowCounts = parseFormation(formation);
  const grouped = [];
  let cursor = 0;

  for (const count of rowCounts) {
    grouped.push(players.slice(cursor, cursor + count));
    cursor += count;
  }

  return grouped;
}

function renderLineupPlayer(player) {
  return `
    <div class="player-chip player-card">
      <img
        class="player-chip-avatar"
        src="${escapeHtml(getHeadshot(player))}"
        alt="${escapeHtml(player.name)}"
        width="36"
        height="36"
        loading="lazy"
        onerror="this.onerror=null;this.src='https://via.placeholder.com/80x80?text=?';"
      />
      <div class="player-chip-info">
        <span class="player-name">${escapeHtml(player.name)}</span>
        <span class="player-pos">${escapeHtml(player.position || "N/A")}</span>
      </div>
    </div>
  `;
}

function renderFormationRow(playersInRow, role) {
  return `
    <div class="formation-row-wrap">
      <div class="role-label">${escapeHtml(role)}</div>
      <div class="formation-row players-${playersInRow.length}">
        ${playersInRow.map(renderLineupPlayer).join("")}
      </div>
    </div>
  `;
}

function renderTeamLineup(team) {
  const groupedRows = splitPlayersByFormation(team.startingXI || [], team.formation || "4-3-3");
  const roleLabels = getRoleLabels(groupedRows.length);

  return `
    <div class="lineup-team">
      <div class="lineup-header">
        <div>
          <div class="section-kicker">${escapeHtml(team.name)}</div>
          <div class="match-title">${escapeHtml(team.formation)}</div>
        </div>
        <div class="lineup-badge">Starting XI</div>
      </div>

      <div class="pitch">
        <div class="pitch-markings"></div>
        <div class="lineup-players formation-layout">
          ${groupedRows.map((row, index) => renderFormationRow(row, roleLabels[index] || "ROW")).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderLineups(teamA, teamB) {
  return `
    <div class="lineup-grid">
      ${renderTeamLineup(teamA)}
      ${renderTeamLineup(teamB)}
    </div>
  `;
}

function setInitialContent() {
  els.result.innerHTML = renderEmptyState("Choose two teams and click predict.");
  els.comparison.innerHTML = renderEmptyState("Pick two teams to compare their stats.");
  els.squads.innerHTML = renderEmptyState("Pick two teams to view manager, formation, and squad lists.");
  els.lineups.innerHTML = renderEmptyState("Pick two teams to view their starting XI on the pitch.");
}

function validateSelections(team1Name, team2Name) {
  if (!team1Name || !team2Name) {
    els.result.innerHTML = renderEmptyState("Select both teams first.");
    return false;
  }

  if (team1Name === team2Name) {
    els.result.innerHTML = renderEmptyState("Pick two different teams.");
    return false;
  }

  return true;
}

function updateDashboard() {
  const team1Name = els.team1.value;
  const team2Name = els.team2.value;

  state.selectedTeam1 = team1Name;
  state.selectedTeam2 = team2Name;

  if (!validateSelections(team1Name, team2Name)) {
    return;
  }

  const teamA = getTeamByName(team1Name);
  const teamB = getTeamByName(team2Name);

  if (!teamA || !teamB) {
    els.result.innerHTML = renderEmptyState("Unable to load one or both teams.");
    return;
  }

  els.result.innerHTML = renderPrediction(teamA, teamB);
  els.comparison.innerHTML = renderComparison(teamA, teamB);
  els.squads.innerHTML = renderSquads(teamA, teamB);
  els.lineups.innerHTML = renderLineups(teamA, teamB);
}

let teams = [];

async function loadTeams() {
  try {
    const response = await fetch("./data/teams.json");

    if (!response.ok) {
      throw new Error(`Failed to load teams: ${response.status}`);
    }

    const rawTeams = await response.json();
    state.teams = rawTeams.map(normalizeTeam);
    populateTeamSelectors(state.teams);
    setInitialContent();
  } catch (error) {
    console.error(error);
    els.result.innerHTML = renderEmptyState("Could not load teams.json.");
    els.comparison.innerHTML = renderEmptyState("Comparison unavailable.");
    els.squads.innerHTML = renderEmptyState("Squad view unavailable.");
    els.lineups.innerHTML = renderEmptyState("Lineup view unavailable.");
  }
}

els.predictBtn.addEventListener("click", updateDashboard);
els.team1.addEventListener("change", () => {
  if (els.team2.value) updateDashboard();
});
els.team2.addEventListener("change", () => {
  if (els.team1.value) updateDashboard();
});

loadTeams();
