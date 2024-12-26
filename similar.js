import { network } from "https://cdn.jsdelivr.net/npm/@gramex/network@2";
import { kpartite } from "https://cdn.jsdelivr.net/npm/@gramex/network@2/dist/kpartite.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const submissions = await d3.csv("submissions.csv", d3.autoType);
const codeLinks = Object.fromEntries(
  submissions.map((s) => {
    const id = s[submissions.columns[1]].split("@")[0];
    const link = s[submissions.columns[2]] ?? s[submissions.columns[2]];
    const time = new Date(s[submissions.columns[0]]);
    const { owner, repo, branch } = parseGithubURL(link);
    const githubURL = `https://github.com/${owner}/${repo}/tree/${branch}`;
    return [id, { link, time, githubURL }];
  })
);

function parseGithubURL(url) {
  if (!url) return null;
  const parts = url.split("/");
  if (parts.length < 7) return {};

  // Return object with owner, repo, and branch properties
  return parts[5] === "refs" && parts[6] === "heads"
    ? { owner: parts[3], repo: parts[4], branch: parts[7] }
    : { owner: parts[3], repo: parts[4], branch: parts[5] };
}

const results = await d3.csv("results.csv", d3.autoType);
const marks = d3.rollup(
  results.filter((d) => d.test != "diversity"),
  (v) => d3.sum(v, (d) => d.marks),
  (d) => d.id
);

const data = await d3.csv("pairwise.csv", d3.autoType);
const { nodes, links } = kpartite(
  data,
  [
    ["id", "id"],
    ["id", "other"],
  ],
  {
    jaccard: (d) => d.jaccard,
  }
);
const nodeMap = Object.fromEntries(nodes.map((d) => [d.value, d]));

function updateHash(value) {
  window.location.replace(`#?similarity=${value}`);
}

const pc = d3.format(".0%");

function draw() {
  // Filter the data
  const minJaccard = +document.querySelector("#link-filter").value;
  updateHash(minJaccard);
  const filteredLinks = links.filter((d) => d.jaccard >= minJaccard);
  nodes.forEach((d) => (d.n = d.links = d.maxJaccard = 0));
  for (const link of filteredLinks) {
    nodeMap[link.source.value].n++;
    nodeMap[link.source.value].links++;
    nodeMap[link.target.value].links++;
    nodeMap[link.source.value].maxJaccard = Math.max(nodeMap[link.source.value].maxJaccard, link.jaccard);
  }

  // Create the network
  const forces = { charge: () => d3.forceManyBody().strength(-20) };
  const graph = network("#network", { nodes, links: filteredLinks, forces, brush, d3 });

  graph.nodes
    .attr("fill", (d) => `var(--bs-${nodeColor(d)})`)
    .attr("r", (d) => 1 + (marks.get(d.value) ?? 0) / 2)
    .attr("data-bs-toggle", "tooltip")
    .attr("title", (d) => d.value);
  graph.links.attr("stroke", (d) =>
    d.jaccard == 1 ? "rgba(255,0,0,0.2)" : d.jaccard > 0.6 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)"
  );
}

function brush(nodes) {
  if (!nodes.length) {
    document.querySelector("#details").innerHTML = "Brush the network to select submissions and see details.";
    return;
  }
  const rows = d3
    .sort(nodes, (a, b) => !!b.links - !!a.links || a.n - b.n)
    .map(
      (d, i) => /* html */ `
        <tr>
          <td>${i + 1}</td>
          <td class="text-${nodeColor(d)}">⬤</td>
          <td>
            <a href="${codeLinks[d.value]?.link}" target="_blank">${d.value}</a>
            <a href="${codeLinks[d.value]?.githubURL}" target="_blank"><i class="bi bi-github"></i></a>
          </td>
          <td class="text-end">${(marks.get(d.value) ?? 0).toFixed(2)}</td>
          <td>${codeLinks[d.value]?.time?.toLocaleString()}</td>
          <td class="text-end">${pc(d.maxJaccard)}</td>
        </tr>`
    )
    .join("");
  document.querySelector("#details").innerHTML = /* html */ `<table class="table table-sm table-striped sortable">
    <thead><tr><th></th><th></th><th>ID</th><th>Marks</th><th>Time</th><th>% Sim</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

const nodeColor = (d) => (d.links == 0 ? "secondary" : d.n == 0 ? "success" : d.n == 1 ? "warning" : "danger");

// Initialize from hash or default value
function drawFromURL() {
  const similarity = new URLSearchParams(window.location.hash.slice(2)).get("similarity") ?? 0.6;
  document.querySelector("#link-filter").value = +similarity;
  draw();
}
// Listen for input changes and hash changes
document.querySelector("#link-filter").addEventListener("input", draw);
window.addEventListener("hashchange", drawFromURL);

drawFromURL();
