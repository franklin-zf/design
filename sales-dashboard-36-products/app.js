const data = window.__SALES_DASHBOARD_DATA__;
const yuan = new Intl.NumberFormat('zh-CN');
const money = (value) => value >= 100000000 ? `¥${(value / 100000000).toFixed(2)}亿` : `¥${(value / 10000).toFixed(0)}万`;
const millions = (value) => (value / 1000000).toFixed(2);
const rate = (value) => `${Number(value).toFixed(1)}%`;
const rateClass = (value) => value >= 90 ? 'rate--good' : value >= 75 ? 'rate--mid' : 'rate--low';
const $ = (id) => document.getElementById(id);

function setText(id, value) { $(id).textContent = value; }
function renderSummary() {
  const s = data.summary;
  setText('kpi-contract', money(s.contract_amount)); setText('kpi-contract-rate', rate(s.contract_completion_rate));
  setText('kpi-revenue', money(s.recognized_revenue)); setText('kpi-revenue-rate', rate(s.revenue_recognition_rate));
  setText('kpi-cash', money(s.cash_received)); setText('kpi-cash-rate', rate(s.cash_completion_rate));
  setText('kpi-volume', `${yuan.format(s.sales_volume)} 单`); setText('kpi-gap', money(Math.abs(s.cash_gap)));
  $('meter-contract').style.width = `${Math.min(s.contract_completion_rate, 100)}%`;
  $('meter-revenue').style.width = `${Math.min(s.revenue_recognition_rate, 100)}%`;
  $('meter-cash').style.width = `${Math.min(s.cash_completion_rate, 100)}%`;
  const lead = data.regions.slice().sort((a, b) => b.contract_completion_rate - a.contract_completion_rate)[0];
  $('insight-copy').textContent = `${lead.key} 区域合同完成率 ${rate(lead.contract_completion_rate)}，但整体收现完成率只有 ${rate(s.cash_completion_rate)}。`;
}

function renderRanking() {
  const max = Math.max(...data.leaderboard.map((row) => row.contract_amount));
  $('ranking').innerHTML = data.leaderboard.map((row, index) => `<div class="rank-row"><span class="rank-num">${String(index + 1).padStart(2, '0')}</span><span class="rank-name" title="${row.product_name}">${row.product_name}</span><span class="rank-bar"><i style="--bar-scale:${(row.contract_amount / max * 100).toFixed(2)}"></i></span><span class="rank-value">${millions(row.contract_amount)}m</span></div>`).join('');
}

function renderRegions() {
  $('region-list').innerHTML = data.regions.map((row) => `<div class="region-row"><div class="region-row__head"><strong>${row.key}区域</strong><span>${money(row.contract_amount)}</span></div><div class="region-meters"><div class="region-meter"><span>合同完成率</span><span class="region-meter__track"><i style="--meter-scale:${Math.min(row.contract_completion_rate, 120) / 1.2}"></i></span><span>${rate(row.contract_completion_rate)}</span></div><div class="region-meter region-meter--cash"><span>收现完成率</span><span class="region-meter__track"><i style="--meter-scale:${Math.min(row.cash_completion_rate, 120) / 1.2}"></i></span><span>${rate(row.cash_completion_rate)}</span></div></div></div>`).join('');
}

function populateFilters() {
  const options = (values) => values.map((value) => `<option value="${value}">${value}</option>`).join('');
  $('region-filter').insertAdjacentHTML('beforeend', options(data.regions.map((row) => row.key)));
  $('category-filter').insertAdjacentHTML('beforeend', options(data.categories.map((row) => row.key)));
}

function renderTable() {
  const search = $('search').value.trim().toLowerCase();
  const region = $('region-filter').value; const category = $('category-filter').value; const sort = $('sort-filter').value;
  const rows = data.products.filter((row) => (!search || row.product_name.toLowerCase().includes(search)) && (region === 'all' || row.region === region) && (category === 'all' || row.category === category)).sort((a, b) => {
    const field = sort === 'cash-rate' ? 'cash_completion_rate' : sort === 'contract-rate' ? 'contract_completion_rate' : sort === 'sales' ? 'sales_volume' : 'contract_amount';
    return b[field] - a[field];
  });
  setText('result-count', `${rows.length} / 36 款`);
  $('empty-state').hidden = rows.length > 0;
  $('product-table').innerHTML = rows.map((row) => `<tr><td><div class="product-cell"><i class="product-cell__dot"></i><span><strong>${row.product_name}</strong><small class="product-cell__meta">${row.category} · ${row.region}</small></span></div></td><td>${yuan.format(row.sales_volume)}</td><td>${money(row.contract_amount)}</td><td>${money(row.recognized_revenue)}</td><td>${money(row.cash_received)}</td><td><span class="rate ${rateClass(row.contract_completion_rate)}">${rate(row.contract_completion_rate)}</span></td><td><span class="rate ${rateClass(row.cash_completion_rate)}">${rate(row.cash_completion_rate)}</span></td></tr>`).join('');
}

renderSummary(); renderRanking(); renderRegions(); populateFilters(); renderTable();
['search', 'region-filter', 'category-filter', 'sort-filter'].forEach((id) => $(id).addEventListener(id === 'search' ? 'input' : 'change', renderTable));
$('reset-filters').addEventListener('click', () => { $('search').value = ''; $('region-filter').value = 'all'; $('category-filter').value = 'all'; $('sort-filter').value = 'contract'; renderTable(); });
