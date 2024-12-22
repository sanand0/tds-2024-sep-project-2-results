/* globals bootstrap */
import { render, html } from "https://cdn.jsdelivr.net/npm/lit-html@3/+esm";
import { num2 } from "https://cdn.jsdelivr.net/npm/@gramex/ui@0.3/dist/format.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function parseGithubURL(url) {
  if (!url) return null;
  const parts = url.split("/");
  if (parts.length < 7) return {};

  // Return object with owner, repo, and branch properties
  return parts[5] === "refs" && parts[6] === "heads"
    ? { owner: parts[3], repo: parts[4], branch: parts[7] }
    : { owner: parts[3], repo: parts[4], branch: parts[5] };
}

const data = await d3.csv("results.csv", d3.autoType);

// links[id] = URL of submission
const submissions = await d3.csv("submissions.csv", d3.autoType);
const links = Object.fromEntries(
  submissions.map((s) => {
    const id = s[submissions.columns[1]].split("@")[0];
    const link = s[submissions.columns[2]] ?? s[submissions.columns[2]];
    const { owner, repo, branch } = parseGithubURL(link);
    const tree = `https://github.com/${owner}/${repo}/tree/${branch}/`;
    return [id, { link, tree }];
  })
);

/**
 * Renders tables based on URL parameters
 * @param {Event} [event] - Optional hashchange event
 */
async function renderTables(event) {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const sort = params.get("sort");

  let filtered = data;
  // Handle filtering and tab selection
  for (const [key, value] of params) {
    if (data.columns.includes(key)) filtered = filtered.filter((row) => row[key] === value);
    if (key === "tab") {
      const $tab = document.querySelector(`#${value}-tab`);
      $tab.click();
    }
  }

  const agg = (v) => ({
    marks: d3.sum(v, (d) => +d.marks),
    correct: d3.sum(v, (d) => +d.correct),
    tests: v.length,
    total: d3.sum(v, (d) => +d.total),
  });
  const marksById = d3.rollup(filtered, agg, (d) => d.id);
  const correctByTest = d3.rollup(filtered, agg, (d) => d.test);

  const max = (d) => ({
    marks: d3.max(d.values(), (d) => d.marks),
    correct: d3.max(d.values(), (d) => d.correct),
    total: d3.max(d.values(), (d) => d.total),
    tests: d3.max(d.values(), (d) => d.tests),
  });
  const maxById = max(marksById);
  const maxByTest = max(correctByTest);

  const cell = (value, max, outOf, decimals) => html`<td
    class="text-end"
    style="position: relative; min-width: 200px; padding-left: 0;"
  >
    <div
      style="position: absolute; width: ${num2(
        (+value / max) * 100
      )}%; height: calc(100% - 1rem); background-color: var(--bs-warning)"
    ></div>
    <div style="position: relative; z-index: 1">${(+value).toFixed(decimals)}</div>
  </td>`;

  function sorted(iterable) {
    const result = [...iterable];
    if (sort == "id" || sort == "test") result.sort((a, b) => d3.ascending(a[0], b[0]));
    else result.sort((a, b) => d3.descending(+a[1][sort], +b[1][sort]));
    return result;
  }

  const updateHash = (newParams) => {
    const updatedParams = new URLSearchParams(params);
    Object.entries(newParams).forEach(([key, value]) => {
      if (updatedParams.get(key) === value) updatedParams.delete(key);
      else updatedParams.set(key, value);
    });
    location.hash = updatedParams.toString();
  };
  const sortClass = (key) => (sort == key ? "text-bg-primary" : "");
  const filterClass = (key, value) => (params.get(key) == value ? "text-bg-primary" : "");

  const th = (key, value) => html`<th
    scope="col"
    role="button"
    class="${sortClass(key)}"
    @click=${() => updateHash({ sort: key })}
  >
    ${key}
  </th>`;

  const summaryTable = (data, max, key) => html`
    <div class="table-responsive">
      <table class="table table-striped table-hover w-auto mx-auto">
        <thead>
          <tr>
            <th scole="col" class="text-end">#</th>
            ${th(key)} ${th("marks")} ${th("total")} ${th("correct")} ${th("tests")}
          </tr>
        </thead>
        <tbody>
          ${sorted(data.entries()).map(
            ([id, { marks, total, correct, tests }], i) => html` <tr>
              <td class="text-end font-monospace">
                ${id in links
                  ? html`
                      <a href="${links[id].link}" target="_blank">${i + 1}</a>
                      <a href="${links[id].tree}/goodreads/" target="_blank">G</a>
                      <a href="${links[id].tree}/happiness/" target="_blank">H</a>
                      <a href="${links[id].tree}/media/" target="_blank">M</a>
                    `
                  : i + 1}
              </td>
              <td role="button" class="${filterClass(key, id)}" @click=${() => updateHash({ [key]: id })}>${id}</td>
              ${cell(marks, max.marks, total, 2)}
              <td class="text-end">${(+total).toFixed(2)}</td>
              ${cell(correct, max.correct, tests, 0)}
              <td class="text-end">${(+tests).toFixed(2)}</td>
            </tr>`
          )}
        </tbody>
      </table>
    </div>
  `;

  render(summaryTable(marksById, maxById, "id"), document.querySelector("#student"));
  render(summaryTable(correctByTest, maxByTest, "test"), document.querySelector("#test"));

  const sortedData = d3.sort(
    filtered,
    sort == "id" || sort == "test" || sort == "reason" ? (d) => d[sort] : (d) => -d[sort]
  );
  render(
    html`
      <div class="table-responsive">
        <table class="table table-striped table-hover w-auto mx-auto">
          <thead>
            <tr>
              <th scole="col" class="text-end">#</th>
              ${th("id")} ${th("test")} ${th("marks")} ${th("reason")}
            </tr>
          </thead>
          <tbody>
            ${sortedData.slice(0, 1000).map(
              ({ id, test, reason, marks, total }, i) => html` <tr>
                <td>${id in links ? html`<a href="${links[id]}" target="_blank">${i + 1}</a>` : i + 1}</td>
                <td role="button" class="${filterClass("id", id)}" @click=${() => updateHash({ id })}>${id}</td>
                <td role="button" class="${filterClass("test", test)}" @click=${() => updateHash({ test })}>${test}</td>
                ${cell(marks, total, total, 2)}
                <td role="button" class="${filterClass("reason", reason)}" @click=${() => updateHash({ reason })}>
                  ${reason}
                </td>
              </tr>`
            )}
          </tbody>
        </table>
      </div>
      ${filtered.length > 1000 ? html`<div class="text-center">Showing 1000 / ${filtered.length} rows.</div>` : ""}
    `,
    document.querySelector("#detail")
  );
}
// Initial render
await renderTables();
document.querySelector("#loading").remove();
// Listen for hash changes
window.addEventListener("hashchange", renderTables);
