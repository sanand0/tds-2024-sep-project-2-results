import { network } from "https://cdn.jsdelivr.net/npm/@gramex/network@2";
import { kpartite } from "https://cdn.jsdelivr.net/npm/@gramex/network@2/dist/kpartite.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const submissions = await d3.csv("submissions.csv", d3.autoType);
const codeLinks = Object.fromEntries(
  submissions.map((s) => {
    const id = s[submissions.columns[1]].split("@")[0];
    const link = s[submissions.columns[2]] ?? s[submissions.columns[2]];
    return [id, link];
  })
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

function draw() {
  // Filter the data
  const minJaccard = +document.querySelector("#link-filter").value;
  updateHash(minJaccard);
  const filteredLinks = links.filter((d) => d.jaccard >= minJaccard);
  nodes.forEach((d) => (d.n = d.links = 0));
  for (const link of filteredLinks) {
    nodeMap[link.target.value].n++;
    nodeMap[link.source.value].links++;
    nodeMap[link.target.value].links++;
  }

  // Create the network
  const forces = { charge: () => d3.forceManyBody().strength(-20) };
  const graph = network("#network", { nodes, links: filteredLinks, forces, brush, d3 });

  graph.nodes
    .attr("fill", (d) => `var(--bs-${color(d)})`)
    .attr("r", 5)
    .attr("data-bs-toggle", "tooltip")
    .attr("title", (d) => d.value);
  graph.links.attr("stroke", "rgba(0,0,0,0.2)");
}

function brush(nodes) {
  const list = d3
    .sort(nodes, (a, b) => !!b.links - !!a.links || a.n - b.n)
    .map(
      (d) => /* html */ `
        <li><span class="text-${color(d)}">⬤</span> <a href="${codeLinks[d.value]}" target="_blank">
          ${d.value}
        </a></li>`
    )
    .join("");
  document.querySelector("#details").innerHTML = `<ol>${list}</ol>`;
}

const color = (d) => (d.links == 0 ? "secondary" : d.n == 0 ? "success" : d.n == 1 ? "warning" : "danger");

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
