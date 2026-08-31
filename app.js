(async () => {
  "use strict";

  const data = await loadDashboardData(window.DASHBOARD_DATA);
  const state = {
    platform: data.defaultPlatform,
    week: null,
    group: "all",
    category: "all",
    signal: "all",
    search: "",
    tableLimit: 8,
    selectedMovement: null,
    attentionOnly: false,
  };

  const els = {
    platformSwitch: document.querySelector("#platformSwitch"),
    weekFilter: document.querySelector("#weekFilter"),
    groupFilter: document.querySelector("#groupFilter"),
    categoryFilter: document.querySelector("#categoryFilter"),
    searchInput: document.querySelector("#searchInput"),
    searchLabel: document.querySelector("#searchLabel"),
    resetFilters: document.querySelector("#resetFilters"),
    attentionWatchlist: document.querySelector("#attentionWatchlist"),
    reportTitle: document.querySelector("#reportTitle"),
    reportDescription: document.querySelector("#reportDescription"),
    reportRange: document.querySelector("#reportRange"),
    previousDate: document.querySelector("#previousDate"),
    sideSnapshot: document.querySelector("#sideSnapshot"),
    brandSubtitle: document.querySelector("#brandSubtitle"),
    kpiGrid: document.querySelector("#kpiGrid"),
    highlightTitle: document.querySelector("#highlightTitle"),
    highlightPeriod: document.querySelector("#highlightPeriod"),
    highlightLead: document.querySelector("#highlightLead"),
    highlightGrid: document.querySelector("#highlightGrid"),
    groupChart: document.querySelector("#groupChart"),
    recordHint: document.querySelector("#recordHint"),
    signalDonut: document.querySelector("#signalDonut"),
    signalTotal: document.querySelector("#signalTotal"),
    signalTotalLabel: document.querySelector("#signalTotalLabel"),
    signalList: document.querySelector("#signalList"),
    signalCallout: document.querySelector("#signalCallout"),
    productStrip: document.querySelector("#productStrip"),
    topProductDescription: document.querySelector("#topProductDescription"),
    movementRows: document.querySelector("#movementRows"),
    freshOpportunityCount: document.querySelector("#freshOpportunityCount"),
    salesHeader: document.querySelector("#salesHeader"),
    rowCount: document.querySelector("#rowCount"),
    showMore: document.querySelector("#showMore"),
    signalTabs: document.querySelector("#signalTabs"),
    ownProductList: document.querySelector("#ownProductList"),
    ulanziStats: document.querySelector("#ulanziStats"),
    strategyText: document.querySelector("#strategyText"),
    pipelineSource: document.querySelector("#pipelineSource"),
    pipelineSourceDetail: document.querySelector("#pipelineSourceDetail"),
    dataFrequency: document.querySelector("#dataFrequency"),
    marketplaceScope: document.querySelector("#marketplaceScope"),
    fieldCoverageNote: document.querySelector("#fieldCoverageNote"),
    footerTitle: document.querySelector("#footerTitle"),
    footerStatus: document.querySelector("#footerStatus"),
    toast: document.querySelector("#toast"),
    floatingGuide: document.querySelector("#floatingGuide"),
    guideToggle: document.querySelector("#guideToggle"),
    trendPopover: document.querySelector("#trendPopover"),
    trendTitle: document.querySelector("#trendTitle"),
    trendStability: document.querySelector("#trendStability"),
    trendRange: document.querySelector("#trendRange"),
    trendCanvas: document.querySelector("#trendCanvas"),
  };

  const number = new Intl.NumberFormat("zh-CN");
  let signalSegments = [];

  function platform() {
    return data.platforms[state.platform];
  }

  function week() {
    return platform().weeks.find((item) => item.key === state.week) || platform().weeks[0];
  }

  function buildReport() {
    const source = platform();
    const selectedWeek = week();
    const weekIndex = source.weeks.findIndex((item) => item.key === selectedWeek.key);
    if (selectedWeek.snapshot) {
      const snapshot = selectedWeek.snapshot;
      const categories = snapshot.categories.map((item) => ({
        ...item,
        rankHistory: normalizeRankHistory(item.rankHistory)
          || runtimeRankHistory(source.weeks, weekIndex, item.asin, item.rank || 1),
      }));
      return {
        meta: { ...snapshot.meta, reportDate: selectedWeek.key, previousDate: selectedWeek.previous },
        groups: snapshot.groups.map((item) => ({ ...item })),
        categories,
        movements: snapshot.movements.map((item) => ({
          ...item,
          isFresh: Number.isFinite(item.listingDays) && item.listingDays <= 90,
        })),
        ownProducts: snapshot.ownProducts.map((item) => ({ ...item })),
        week: selectedWeek,
        platform: source,
      };
    }
    const base = source.base;
    const priceFactor = 1 - weekIndex * 0.006;
    const recordTotal = base.meta.records + selectedWeek.recordDelta;
    const groups = base.groups.map((item) => ({
      ...item,
      records: Math.max(0, Math.round(item.records + selectedWeek.recordDelta * (item.records / base.meta.records))),
    }));
    const categories = base.categories.map((item, index) => {
      const listingDays = Math.max(1, (item.listingDays || 220 + index * 73) - weekIndex * 7);
      return {
        ...item,
        topSales: Math.max(0, Math.round(item.topSales * selectedWeek.salesFactor)),
        price: roundMoney(item.price * priceFactor),
        listingDays,
        listedAt: listedDate(selectedWeek.key, listingDays),
        rankChange: index % 4 === 0 ? 1 + weekIndex : index % 5 === 0 ? -1 : 0,
        rankHistory: buildRankHistory(item.rank || 1, index, weekIndex),
      };
    });
    const movements = base.movements.map((item, index) => {
      const listingDays = Math.max(
        1,
        (item.listingDays || (item.type === "新上榜" ? 24 + index * 3 : 185 + index * 17)) - weekIndex * 7,
      );
      const rank = Math.min(100, Math.max(1, item.rank + selectedWeek.rankShift));
      const previousRank = item.previousRank === null
        ? null
        : Math.min(100, Math.max(1, item.previousRank + selectedWeek.rankShift));
      return {
        ...item,
        rank,
        previousRank,
        sales: Math.max(0, Math.round(item.sales * selectedWeek.salesFactor)),
        price: roundMoney(item.price * priceFactor),
        listingDays,
        listedAt: listedDate(selectedWeek.key, listingDays),
        demoIndex: index,
        isFresh: listingDays <= 90,
      };
    });
    const ownProducts = base.ownProducts.map((item, index) => {
      const listingDays = Math.max(1, (item.listingDays || 260 + index * 52) - weekIndex * 7);
      return {
        ...item,
        sales: Math.round(item.sales * selectedWeek.salesFactor),
        price: roundMoney((item.price || 29.9 + index * 8) * priceFactor),
        listingDays,
        listedAt: listedDate(selectedWeek.key, listingDays),
      };
    });
    return {
      meta: { ...base.meta, records: recordTotal, reportDate: selectedWeek.key, previousDate: selectedWeek.previous },
      groups,
      categories,
      movements,
      ownProducts,
      week: selectedWeek,
      platform: source,
    };
  }

  async function loadDashboardData(fallback) {
    fallback.runtimePlatforms = [];
    try {
      const response = await fetch("./data/dashboard-data.json", { cache: "no-store" });
      if (!response.ok) return fallback;
      const runtime = await response.json();
      Object.entries(runtime.platforms || {}).forEach(([key, payload]) => {
        if (!fallback.platforms[key] || !Array.isArray(payload.weeks) || !payload.weeks.length) return;
        fallback.platforms[key].weeks = payload.weeks;
        fallback.runtimePlatforms.push(key);
      });
    } catch (error) {
      console.warn("Dashboard runtime data unavailable; using bundled demo data.", error);
    }
    return fallback;
  }

  function normalizeRankHistory(values) {
    if (!Array.isArray(values) || !values.length) return null;
    return values.slice(-4).map((rank) => Number.isFinite(rank) && rank >= 1 && rank <= 100 ? rank : null);
  }

  function runtimeRankHistory(weeks, weekIndex, asin, fallbackRank) {
    const history = weeks
      .slice(weekIndex, weekIndex + 4)
      .reverse()
      .map((item) => item.snapshot?.categories?.find((category) => category.asin === asin)?.rank)
      .map((rank) => Number.isFinite(rank) ? rank : null);
    return history.some(Number.isFinite) ? history : [fallbackRank];
  }

  function selectedCategories(report) {
    return report.categories.filter(
      (item) =>
        (state.group === "all" || item.group === state.group) &&
        (state.category === "all" || item.name === state.category),
    );
  }

  function selectedMovements(report, { ignoreSignal = false, ignoreSearch = false } = {}) {
    const term = state.search.toLowerCase().trim();
    return report.movements.filter((item) => {
      const inGroup = state.group === "all" || item.group === state.group;
      const inCategory = state.category === "all" || item.category === state.category;
      const inSignal = ignoreSignal || state.signal === "all" || item.type === state.signal;
      const inAttention = ignoreSignal || !state.attentionOnly || isAttention(item);
      const haystack = `${item.brand} ${item.shop || ""} ${item.asin} ${item.title} ${item.category}`.toLowerCase();
      const inSearch = ignoreSearch || !term || haystack.includes(term);
      return inGroup && inCategory && inSignal && inAttention && inSearch;
    });
  }

  function isAttention(item) {
    const lowRatedFastRiser = item.type === "上升" && Number.isFinite(item.rating) && item.rating < 4;
    const largeRankMove = item.change !== null && Math.abs(item.change) >= 30;
    return item.isFresh || lowRatedFastRiser || largeRankMove;
  }

  function renderContext(report) {
    const source = report.platform;
    document.body.classList.toggle("platform-taotian", state.platform === "taotian");
    document.title = `${source.title} · ${report.week.key}`;
    els.platformSwitch.querySelectorAll("button").forEach((button) => {
      const active = button.dataset.platform === state.platform;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    els.reportTitle.textContent = source.title;
    els.reportDescription.textContent = `覆盖 ${report.meta.groups} 个类目组、${report.meta.categories} 个细分类目，快速识别增长机会、排名异动与本品表现。`;
    els.reportRange.textContent = report.week.label;
    els.previousDate.textContent = `较上周 · ${report.week.previous}`;
    els.sideSnapshot.textContent = `${report.week.key} · ${source.marketplace}`;
    const attentionCount = report.movements.filter(isAttention).length;
    els.attentionWatchlist.textContent = `本周待关注 ${attentionCount}`;
    els.attentionWatchlist.setAttribute("aria-label", `查看本周 ${attentionCount} 个待关注商品`);
    els.brandSubtitle.textContent = `${source.name} Weekly Intelligence`;
    els.searchLabel.textContent = `搜索品牌 / ${source.idLabel}`;
    els.searchInput.placeholder = state.platform === "amazon" ? "例如 ULANZI、B0..." : "例如 ULANZI、商品 ID...";
    els.salesHeader.textContent = source.salesLabel;
    els.recordHint.textContent = `共 ${number.format(report.meta.records)} 条结构化记录`;
    els.topProductDescription.textContent = state.platform === "amazon"
      ? "每个细分类目的榜首商品，补充价格、上架时间与本周排名表现。"
      : "每个细分类目的榜首商品，展示店铺、商品链接与本周排名表现。";
    els.pipelineSource.textContent = state.platform === "amazon" ? "Sorftime API" : "淘天榜单采集";
    els.pipelineSourceDetail.textContent = state.platform === "amazon" ? "Top 100 原始数据" : "类目榜单与商品快照";
    els.dataFrequency.textContent = `数据频率：${state.platform === "amazon" ? "每周三数据，周五发布" : "每周一数据，周五统一发布"}`;
    els.marketplaceScope.textContent = `样本范围：${source.marketplace} · ${report.meta.categories} 个细分类目`;
    els.fieldCoverageNote.textContent = state.platform === "amazon"
      ? "字段覆盖：价格、评分、月销、上架时间"
      : "字段覆盖：排名、异动、店铺、商品链接、商品图片；价格、评分、销量、上架时间源表暂无";
    const runtimeActive = data.runtimePlatforms?.includes(state.platform);
    els.footerTitle.textContent = `${source.name} Weekly Intelligence · ${runtimeActive ? "Live" : "Demo"}`;
    els.footerStatus.textContent = runtimeActive
      ? `正式数据 · 最近发布 ${report.week.key}`
      : state.platform === "taotian" ? "当前使用淘天内置演示数据" : "当前使用内置演示数据";
  }

  function fillWeekOptions() {
    els.weekFilter.innerHTML = platform().weeks
      .map((item) => `<option value="${item.key}">${item.label}</option>`)
      .join("");
    if (!platform().weeks.some((item) => item.key === state.week)) {
      state.week = platform().weeks[0].key;
    }
    els.weekFilter.value = state.week;
  }

  function fillGroupOptions(report) {
    els.groupFilter.innerHTML = `<option value="all">全部 ${report.groups.length} 个类目组</option>`;
    report.groups.forEach((group) => {
      els.groupFilter.insertAdjacentHTML(
        "beforeend",
        `<option value="${group.name}">${group.name} · ${group.categories} 个类目</option>`,
      );
    });
    if (!report.groups.some((group) => group.name === state.group)) state.group = "all";
    els.groupFilter.value = state.group;
    updateCategoryOptions(report);
  }

  function updateCategoryOptions(report) {
    const current = state.category;
    const categories = report.categories.filter(
      (item) => state.group === "all" || item.group === state.group,
    );
    els.categoryFilter.innerHTML = `<option value="all">全部 ${categories.length} 个类目</option>`;
    categories.forEach((item) => {
      els.categoryFilter.insertAdjacentHTML(
        "beforeend",
        `<option value="${item.name}">${item.name}</option>`,
      );
    });
    state.category = categories.some((item) => item.name === current) ? current : "all";
    els.categoryFilter.value = state.category;
  }

  function renderKpis(report) {
    const categories = selectedCategories(report);
    const movements = selectedMovements(report, { ignoreSignal: true, ignoreSearch: true });
    const currentGroups = state.group === "all"
      ? report.groups
      : report.groups.filter((item) => item.name === state.group);
    const records = currentGroups.reduce((sum, item) => sum + item.records, 0);
    const imageCount = currentGroups.reduce((sum, item) => sum + item.images, 0);
    const opportunities = movements.filter((item) => item.type !== "下降").length;
    const salesValues = categories.map((item) => item.topSales).filter(Number.isFinite);
    const topSales = salesValues.reduce((sum, value) => sum + value, 0);
    const cards = [
      ["结构化记录", number.format(records), "条", `已汇总 ${currentGroups.length} 个类目组`, "▦", "#0b6b4b", "#eaf7f1"],
      ["当前覆盖类目", categories.length, "个", state.category === "all" ? "支持按类目快速下钻" : "已定位到单一细分类目", "◎", "#5f83c1", "#eef4ff"],
      [`Top 1 ${report.platform.salesLabel}合计`, salesValues.length ? compactNumber(topSales) : "—", salesValues.length ? "件" : "", salesValues.length ? "基于当前周次头部商品" : "当前源表未采集销量", "↗", "#e27846", "#fff0e8"],
      ["机会信号", opportunities, "条", `<em>${imageCount} 张图片</em>已进入结构化字段`, "✦", "#607c0f", "#f0facf"],
    ];
    els.kpiGrid.innerHTML = cards
      .map(
        ([label, value, unit, foot, icon, tone, tint]) => `
          <article class="kpi-card" style="--tone:${tone};--tint:${tint}">
            <div class="kpi-top"><span>${label}</span><i class="kpi-icon">${icon}</i></div>
            <div class="kpi-value"><strong>${value}</strong><span>${unit}</span></div>
            <div class="kpi-foot">${foot}</div>
          </article>`,
      )
      .join("");
  }

  function renderHighlights(report) {
    const highlights = report.week.highlights;
    const scoped = state.group === "all"
      ? highlights
      : highlights.filter(([label]) => label === "总体" || state.group.includes(label) || label.includes(state.group.replace("与脚架", "")));
    const lead = scoped[0] || highlights[0];
    const detail = scoped.slice(1).length ? scoped.slice(1) : highlights.slice(1);
    els.highlightTitle.textContent = `本周 ${report.platform.name} 报告速览`;
    els.highlightPeriod.textContent = report.week.label;
    els.highlightLead.innerHTML = `<strong>${lead[0]}</strong><p>${lead[1]}</p>`;
    els.highlightGrid.innerHTML = detail
      .map(([label, text]) => `<article><span>${label}</span><p>${text}</p></article>`)
      .join("");
  }

  function renderGroupChart(report) {
    const maxRecords = Math.max(...report.groups.map((item) => item.records));
    const maxImages = Math.max(...report.groups.map((item) => item.images));
    els.groupChart.innerHTML = report.groups
      .map((group) => {
        const recordWidth = Math.max(8, Math.round((group.records / maxRecords) * 100));
        const imageWidth = Math.max(8, Math.round((group.images / maxImages) * 100));
        const dimmed = state.group !== "all" && state.group !== group.name ? " dimmed" : "";
        const active = state.group === group.name ? " active" : "";
        return `
          <button class="group-metric-row${dimmed}${active}" data-group="${group.name}" type="button" aria-pressed="${state.group === group.name}">
            <span class="group-metric-name"><strong>${group.name}</strong><small>${group.categories} 个细分类目</small></span>
            <span class="metric-pair">
              <span class="metric-line"><span>记录</span><i><b class="records-bar" style="width:${recordWidth}%"></b></i><strong>${group.records}</strong></span>
              <span class="metric-line"><span>图片</span><i><b class="images-bar" style="width:${imageWidth}%"></b></i><strong>${group.images}</strong></span>
            </span>
          </button>`;
      })
      .join("");
  }

  function renderSignals(report) {
    const movements = selectedMovements(report, { ignoreSignal: true, ignoreSearch: true });
    const counts = [
      { name: "强势上升", key: "上升", color: "#0b6b4b" },
      { name: "明显下降", key: "下降", color: "#dc655d" },
      { name: "新上榜", key: "新上榜", color: "#5f83c1" },
    ].map((item) => ({ ...item, value: movements.filter((movement) => movement.type === item.key).length }));
    const total = counts.reduce((sum, item) => sum + item.value, 0);
    const percentages = counts.map((item) => (total ? (item.value / total) * 100 : 0));
    const end1 = percentages[0];
    const end2 = end1 + percentages[1];
    signalSegments = [
      { ...counts[0], start: 0, end: end1 },
      { ...counts[1], start: end1, end: end2 },
      { ...counts[2], start: end2, end: 100 },
    ];
    const segmentColor = (item) => state.signal === "all" || state.signal === item.key ? item.color : "#dce2de";
    els.signalDonut.style.background = total
      ? `conic-gradient(${segmentColor(counts[0])} 0 ${end1}%, ${segmentColor(counts[1])} ${end1}% ${end2}%, ${segmentColor(counts[2])} ${end2}% 100%)`
      : "#edf1ee";
    const selectedCount = counts.find((item) => item.key === state.signal);
    els.signalTotal.textContent = selectedCount ? selectedCount.value : total;
    els.signalTotalLabel.textContent = selectedCount ? selectedCount.name : "重点信号";
    els.signalDonut.classList.toggle("filtered", state.signal !== "all");
    els.signalList.innerHTML = counts
      .map((item) => {
        const active = state.signal === item.key ? " active" : "";
        const dimmed = state.signal !== "all" && state.signal !== item.key ? " dimmed" : "";
        return `<button class="signal-row${active}${dimmed}" data-signal="${item.key}" type="button" aria-pressed="${state.signal === item.key}"><i style="background:${item.color}"></i><span>${item.name}</span><strong>${item.value}</strong></button>`;
      })
      .join("");
    const lowRatingRise = movements
      .filter((item) => item.type === "上升" && Number.isFinite(item.rating) && item.rating < 4.0)
      .sort((a, b) => (b.change || 0) - (a.change || 0));
    els.signalCallout.classList.toggle("has-products", Boolean(lowRatingRise.length));
    els.signalCallout.innerHTML = lowRatingRise.length
      ? `<div class="low-rating-summary"><strong>${lowRatingRise.length} 个低评分商品仍在快速上升</strong><span>点击商品可定位到异动明细；即使未出现在当前首屏，也会在这里单独保留。</span></div>
        <div class="low-rating-products">${lowRatingRise.slice(0, 3).map((item) => `
          <button class="low-rating-product" type="button" data-product-id="${item.asin}">
            <img src="${item.image}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
            <span><strong>${item.title}</strong><small>${item.brand} · ${item.category}</small><em>★ ${item.rating.toFixed(1)} · #${item.rank} · ↑ ${item.change} · ${formatMoney(report.platform, item.price)}</em></span>
            <span class="material-symbols-rounded">arrow_downward</span>
          </button>`).join("")}</div>`
      : "上升商品评分整体稳定，可优先查看高销量新上榜款。";
  }

  function renderProducts(report) {
    const categories = selectedCategories(report);
    if (!categories.length) {
      els.productStrip.innerHTML = `<div class="empty-row">当前筛选条件下暂无类目商品。</div>`;
      return;
    }
    els.productStrip.innerHTML = categories
      .map((item) => {
        const movement = item.rankChange > 0 ? `↑ ${item.rankChange}` : item.rankChange < 0 ? `↓ ${Math.abs(item.rankChange)}` : "—";
        const seller = item.shop || item.brand;
        return `
          <article class="product-card detailed" tabindex="0" data-product-id="${item.asin}" data-category="${item.name}">
            <a class="product-image" data-fallback="${item.brand.slice(0, 2)}" href="${productUrl(report.platform, item)}" target="_blank" rel="noreferrer">
              <span class="rank-badge">榜单 #${item.rank || 1}</span>
              <img src="${item.image}" alt="${item.brand} 商品图" loading="lazy" onload="this.parentElement.classList.add('image-loaded')" onerror="this.style.display='none'" />
            </a>
            <div class="product-body">
              <div class="product-meta"><span>${item.group}</span><span>${item.asin}</span></div>
              <h3 title="${item.title}">${item.title}</h3>
              <div class="seller-line"><strong>${seller}</strong><span>本周 ${movement}</span></div>
              <div class="product-metrics">
                <span>${report.platform.salesLabel}<strong>${formatOptionalNumber(item.topSales)}</strong></span>
                <span>价格<strong>${formatMoney(report.platform, item.price)}</strong></span>
                <span>评分<strong>${formatRating(item.rating)}</strong></span>
              </div>
              <div class="listing-line">${listingText(item)}</div>
              <div class="trend-hint"><span class="material-symbols-rounded">show_chart</span>悬停查看近 4 周同款排名</div>
            </div>
          </article>`;
      })
      .join("");
  }

  function renderTable(report) {
    const rows = selectedMovements(report);
    const visible = rows.slice(0, state.tableLimit);
    if (!visible.length) {
      els.movementRows.innerHTML = `<tr><td class="empty-row" colspan="10">没有匹配的商品，请调整筛选条件。</td></tr>`;
    } else {
      els.movementRows.innerHTML = visible.map((item) => tableRow(report, item)).join("");
    }
    els.rowCount.textContent = `显示 ${visible.length} / ${rows.length} 条商品异动`;
    const freshCount = rows.filter((item) => item.isFresh).length;
    els.freshOpportunityCount.textContent = freshCount ? `${freshCount} 个近 90 天上架机会款` : "当前筛选暂无近 90 天新品";
    els.movementRows.closest("table").classList.toggle("has-row-focus", Boolean(state.selectedMovement));
    els.showMore.hidden = rows.length <= 8;
    els.showMore.textContent = state.tableLimit >= rows.length ? "收起" : "查看更多";
  }

  function tableRow(report, item) {
    const style = item.type === "上升" ? "up" : item.type === "下降" ? "down" : "new";
    const change = item.change === null ? "NEW" : `${item.change > 0 ? "+" : ""}${item.change}`;
    const action = item.type === "上升" ? "机会复盘" : item.type === "下降" ? "风险观察" : "新品追踪";
    const seller = item.shop || item.brand;
    return `
      <tr class="${item.isFresh ? "fresh-product " : ""}${state.selectedMovement === item.asin ? "selected-product" : ""}" data-product-id="${item.asin}" tabindex="0" aria-selected="${state.selectedMovement === item.asin}">
        <td>
          <a class="product-cell" href="${productUrl(report.platform, item)}" target="_blank" rel="noreferrer">
            <img class="table-thumb" src="${item.image}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
            <span><strong title="${item.title}">${item.title}</strong><span>${seller} · ${item.asin}</span></span>
          </a>
        </td>
        <td><span class="category-cell"><strong>${item.group}</strong><span>${item.category}</span></span></td>
        <td><span class="signal-pill ${style}">${item.type}</span></td>
        <td><strong>#${item.rank}</strong>${item.previousRank ? ` <span class="previous-rank">← #${item.previousRank}</span>` : ""}</td>
        <td><span class="change-pill ${style}">${change}</span></td>
        <td><strong class="price-cell">${formatMoney(report.platform, item.price)}</strong></td>
        <td>${formatOptionalNumber(item.sales)}</td>
        <td><span class="listing-cell">${listingCell(item)}</span></td>
        <td>${formatRating(item.rating)}</td>
        <td><span class="action-pill">${action}</span></td>
      </tr>`;
  }

  function renderOwnProducts(report) {
    const scoped = report.ownProducts.filter(
      (item) =>
        (state.group === "all" || item.group === state.group) &&
        (state.category === "all" || item.category === state.category),
    );
    const source = scoped.length ? scoped : report.ownProducts;
    const visible = [...source].sort((a, b) => b.change - a.change).slice(0, 5);
    const salesValues = source.map((item) => item.sales).filter(Number.isFinite);
    const totalSales = salesValues.reduce((sum, value) => sum + value, 0);
    const best = [...source].sort((a, b) => b.change - a.change)[0];
    els.ulanziStats.innerHTML = [
      [source.length, "监测本品"],
      [`+${best ? best.change : 0}`, "最大升幅"],
      [salesValues.length ? compactNumber(totalSales) : "—", report.platform.salesLabel],
    ].map(([value, label]) => `<div class="ulanzi-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");
    els.strategyText.textContent = state.platform === "amazon"
      ? "优先复盘支架与灯光上升款，结合关键词、价格与促销节奏定位增长来源。"
      : "优先复盘磁吸补光灯与自拍杆上升款，并补齐淘天价格、上架时间字段的正式采集链路。";
    els.ownProductList.innerHTML = visible
      .map((item) => `
        <a class="own-product-row" href="${productUrl(report.platform, item)}" target="_blank" rel="noreferrer">
          <img src="${item.image}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
          <span class="own-copy"><strong>${item.title}</strong><span>${item.category} · ${item.asin} · ${Number.isFinite(item.listingDays) ? `上架 ${item.listingDays} 天` : "上架时间暂无"}</span></span>
          <span class="own-sales">${report.platform.salesLabel}<strong>${formatOptionalNumber(item.sales)}</strong></span>
          <span class="own-change">${Number.isFinite(item.change) ? `${item.change > 0 ? "↑" : "↓"} ${Math.abs(item.change)}` : "NEW"}</span>
        </a>`)
      .join("");
  }

  function renderAll({ rebuildFilters = false } = {}) {
    const report = buildReport();
    if (rebuildFilters) fillGroupOptions(report);
    renderContext(report);
    renderKpis(report);
    renderHighlights(report);
    renderGroupChart(report);
    renderSignals(report);
    renderProducts(report);
    renderTable(report);
    renderOwnProducts(report);
  }

  function resetFilters({ keepPlatform = true } = {}) {
    if (!keepPlatform) state.platform = data.defaultPlatform;
    state.group = "all";
    state.category = "all";
    state.signal = "all";
    state.search = "";
    state.tableLimit = 8;
    state.selectedMovement = null;
    state.attentionOnly = false;
    els.searchInput.value = "";
    syncSignalTabs();
    renderAll({ rebuildFilters: true });
  }

  function switchPlatform(key) {
    if (!data.platforms[key] || key === state.platform) return;
    state.platform = key;
    state.week = platform().weeks[0].key;
    fillWeekOptions();
    resetFilters();
    syncUrl();
    showToast(`已切换到 ${platform().name} 周报`);
  }

  function downloadCsv() {
    const report = buildReport();
    const rows = selectedMovements(report);
    const headers = ["平台", "报告周次", "类目组", "细分类目", "异动类型", "品牌/店铺", report.platform.idLabel, "产品名称", "本周排名", "上周排名", "排名变化", "价格", report.platform.salesLabel, "上架日期", "上架天数", "评分", "商品图片"];
    const csvRows = rows.map((item) => [
      report.platform.name, report.week.key, item.group, item.category, item.type, item.shop || item.brand,
      item.asin, item.title, item.rank, item.previousRank ?? "", item.change ?? "", item.price, item.sales,
      item.listedAt, item.listingDays, item.rating, item.image,
    ]);
    const csv = [headers, ...csvRows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${state.platform}-bsr-weekly-${report.week.key}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast(`已导出 ${rows.length} 条当前筛选数据`);
  }

  function bindEvents() {
    els.platformSwitch.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-platform]");
      if (button) switchPlatform(button.dataset.platform);
    });
    els.weekFilter.addEventListener("change", (event) => {
      state.week = event.target.value;
      state.tableLimit = 8;
      renderAll();
      syncUrl();
      showToast(`已切换至 ${week().label}`);
    });
    els.groupFilter.addEventListener("change", (event) => {
      state.group = event.target.value;
      state.tableLimit = 8;
      const report = buildReport();
      updateCategoryOptions(report);
      renderAll();
    });
    els.groupChart.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-group]");
      if (!button) return;
      state.group = state.group === button.dataset.group ? "all" : button.dataset.group;
      state.category = "all";
      state.tableLimit = 8;
      state.selectedMovement = null;
      const report = buildReport();
      els.groupFilter.value = state.group;
      updateCategoryOptions(report);
      renderAll();
    });
    els.categoryFilter.addEventListener("change", (event) => {
      state.category = event.target.value;
      state.tableLimit = 8;
      renderAll();
    });
    els.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value;
      state.tableLimit = 8;
      renderTable(buildReport());
    });
    els.resetFilters.addEventListener("click", () => resetFilters());
    els.signalTabs.addEventListener("click", (event) => {
      const attentionButton = event.target.closest("button[data-attention]");
      if (attentionButton) {
        applyAttentionFilter();
        return;
      }
      const button = event.target.closest("button[data-signal]");
      if (!button) return;
      selectSignal(button.dataset.signal, { toggle: false });
    });
    els.signalList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-signal]");
      if (!button) return;
      selectSignal(button.dataset.signal, { scroll: true });
    });
    els.signalDonut.addEventListener("click", handleDonutClick);
    els.signalDonut.addEventListener("keydown", (event) => {
      if (!["1", "2", "3"].includes(event.key)) return;
      selectSignal(signalSegments[Number(event.key) - 1]?.key, { scroll: false });
    });
    els.signalCallout.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-product-id]");
      if (button) revealMovement(button.dataset.productId);
    });
    els.movementRows.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-product-id]");
      if (!row) return;
      state.selectedMovement = state.selectedMovement === row.dataset.productId ? null : row.dataset.productId;
      renderTable(buildReport());
    });
    els.movementRows.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const row = event.target.closest("tr[data-product-id]");
      if (!row) return;
      event.preventDefault();
      state.selectedMovement = state.selectedMovement === row.dataset.productId ? null : row.dataset.productId;
      renderTable(buildReport());
    });
    els.showMore.addEventListener("click", () => {
      const report = buildReport();
      const total = selectedMovements(report).length;
      state.tableLimit = state.tableLimit >= total ? 8 : total;
      renderTable(report);
    });
    document.querySelector("#scrollPrev").addEventListener("click", () => els.productStrip.scrollBy({ left: -620, behavior: "smooth" }));
    document.querySelector("#scrollNext").addEventListener("click", () => els.productStrip.scrollBy({ left: 620, behavior: "smooth" }));
    document.querySelector("#downloadCsv").addEventListener("click", downloadCsv);
    els.attentionWatchlist.addEventListener("click", () => applyAttentionFilter({ scroll: true, resetScope: true }));
    document.querySelector("#signalHelp").addEventListener("click", () => showToast("点击环形图扇区可筛选信号；新品机会指上架不超过 90 天的商品。"));
    els.guideToggle.addEventListener("click", () => {
      const collapsed = els.floatingGuide.classList.toggle("collapsed");
      els.guideToggle.setAttribute("aria-expanded", String(!collapsed));
      els.guideToggle.setAttribute("aria-label", collapsed ? "展开页面导航" : "收起页面导航");
      els.guideToggle.querySelector(".material-symbols-rounded").textContent = collapsed ? "menu" : "menu_open";
    });
    bindTrendPopover();
  }

  function observeSections() {
    const links = [...document.querySelectorAll(".guide-link")];
    const sections = links.map((link) => document.querySelector(`#${link.dataset.section}`)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => link.classList.toggle("active", link.dataset.section === visible.target.id));
    }, { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.15, 0.4] });
    sections.forEach((section) => observer.observe(section));
  }

  function roundMoney(value) {
    return Math.round(value * 100) / 100;
  }

  function compactNumber(value) {
    if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return number.format(value);
  }

  function formatOptionalNumber(value) {
    return Number.isFinite(value) ? number.format(value) : "—";
  }

  function formatRating(value) {
    return Number.isFinite(value) ? `★ ${value.toFixed(1)}` : "—";
  }

  function listingText(item) {
    if (!Number.isFinite(item.listingDays) || !item.listedAt) return "<span>上架时间</span><strong>—</strong>";
    return `<span>上架 ${item.listedAt}</span><strong>${item.listingDays} 天</strong>`;
  }

  function listingCell(item) {
    if (!Number.isFinite(item.listingDays) || !item.listedAt) return "<strong>—</strong><small>源表暂无</small>";
    return `<strong>${item.listedAt}</strong><small>${item.listingDays} 天</small>${item.isFresh ? `<em>新品机会</em>` : ""}`;
  }

  function formatMoney(source, value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat(source.currency === "USD" ? "en-US" : "zh-CN", {
      style: "currency",
      currency: source.currency,
      maximumFractionDigits: source.currency === "CNY" ? 0 : 2,
    }).format(value);
  }

  function listedDate(reportDate, days) {
    const date = new Date(`${reportDate}T00:00:00`);
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }

  function buildRankHistory(baseRank, index, weekIndex) {
    const patterns = [
      [8, 6, 5, 3, 2, 0],
      [-3, 2, -1, 1, 0, 0],
      [12, 9, 7, 4, 2, 0],
      [1, -1, 2, -2, 1, 0],
    ];
    return patterns[index % patterns.length].map((delta, point) =>
      Math.max(1, Math.min(100, baseRank + delta + weekIndex + (point === 0 ? index % 3 : 0))),
    );
  }

  function productUrl(source, item) {
    if (item.productUrl) return item.productUrl;
    if (source.key === "amazon") return `https://www.amazon.com/dp/${item.asin}`;
    const query = `${item.title || ""} ${item.shop || item.brand || ""}`.trim();
    return `https://s.taobao.com/search?q=${encodeURIComponent(query)}`;
  }

  function syncSignalTabs() {
    els.signalTabs.querySelectorAll("button[data-signal]").forEach((button) => {
      button.classList.toggle("active", !state.attentionOnly && button.dataset.signal === state.signal);
    });
    const attentionButton = els.signalTabs.querySelector("button[data-attention]");
    attentionButton.classList.toggle("active", state.attentionOnly);
  }

  function selectSignal(key, { toggle = true, scroll = false } = {}) {
    if (!key) return;
    state.attentionOnly = false;
    state.signal = toggle && state.signal === key ? "all" : key;
    state.tableLimit = 8;
    state.selectedMovement = null;
    syncSignalTabs();
    const report = buildReport();
    renderSignals(report);
    renderTable(report);
    if (scroll) document.querySelector("#movements").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function applyAttentionFilter({ scroll = false, resetScope = false } = {}) {
    state.attentionOnly = true;
    state.signal = "all";
    state.search = "";
    state.tableLimit = 8;
    state.selectedMovement = null;
    els.searchInput.value = "";
    if (resetScope) {
      state.group = "all";
      state.category = "all";
    }
    renderAll({ rebuildFilters: resetScope });
    syncSignalTabs();
    if (scroll) {
      requestAnimationFrame(() => document.querySelector("#movements").scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  function handleDonutClick(event) {
    const rect = els.signalDonut.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < rect.width * 0.27 || distance > rect.width * 0.53) return;
    const angle = (Math.atan2(dy, dx) * (180 / Math.PI) + 90 + 360) % 360;
    const percentage = angle / 3.6;
    const segment = signalSegments.find((item) => percentage >= item.start && percentage < item.end);
    if (segment) selectSignal(segment.key, { scroll: false });
  }

  function revealMovement(productId) {
    const report = buildReport();
    const item = report.movements.find((movement) => movement.asin === productId);
    if (!item) return;
    state.group = item.group;
    state.category = item.category;
    state.signal = "all";
    state.attentionOnly = false;
    state.search = item.asin;
    state.tableLimit = 8;
    state.selectedMovement = item.asin;
    els.groupFilter.value = state.group;
    updateCategoryOptions(report);
    els.categoryFilter.value = state.category;
    els.searchInput.value = state.search;
    syncSignalTabs();
    renderAll();
    requestAnimationFrame(() => document.querySelector("#movements").scrollIntoView({ behavior: "smooth", block: "start" }));
    showToast(`已定位 ${item.brand} · ${item.asin}`);
  }

  function bindTrendPopover() {
    const open = (card) => showTrendPopover(card);
    els.productStrip.addEventListener("pointerover", (event) => {
      const card = event.target.closest(".product-card[data-product-id]");
      if (card && !card.contains(event.relatedTarget)) open(card);
    });
    els.productStrip.addEventListener("pointerout", (event) => {
      const card = event.target.closest(".product-card[data-product-id]");
      if (card && !card.contains(event.relatedTarget)) els.trendPopover.hidden = true;
    });
    els.productStrip.addEventListener("focusin", (event) => {
      const card = event.target.closest(".product-card[data-product-id]");
      if (card) open(card);
    });
    els.productStrip.addEventListener("focusout", (event) => {
      const card = event.target.closest(".product-card[data-product-id]");
      if (card && !card.contains(event.relatedTarget)) els.trendPopover.hidden = true;
    });
  }

  function showTrendPopover(card) {
    const report = buildReport();
    const item = report.categories.find((category) => category.asin === card.dataset.productId);
    if (!item) return;
    const history = item.rankHistory;
    const ranked = history.filter(Number.isFinite);
    const spread = ranked.length > 1 ? Math.max(...ranked) - Math.min(...ranked) : 0;
    const hasMissing = ranked.length !== history.length;
    els.trendTitle.textContent = item.name;
    const stability = ranked.length < 2
      ? ["数据不足", "volatile"]
      : hasMissing
        ? ["曾未上榜", "volatile"]
        : spread <= 3
          ? ["高度稳定", "stable"]
          : spread <= 8
            ? ["相对稳定", "steady"]
            : ["波动关注", "volatile"];
    els.trendStability.textContent = stability[0];
    els.trendStability.className = `trend-stability ${stability[1]}`;
    els.trendRange.textContent = ranked.length
      ? `#${Math.min(...ranked)} — #${Math.max(...ranked)}${hasMissing ? " · 含未上榜周" : ""}`
      : "最近 4 周未上榜";
    drawTrend(history);
    els.trendPopover.hidden = false;
    const rect = card.getBoundingClientRect();
    const width = 366;
    const left = Math.min(window.innerWidth - width - 18, Math.max(18, rect.left + rect.width / 2 - width / 2));
    const placeAbove = rect.top > 310;
    els.trendPopover.style.left = `${left}px`;
    els.trendPopover.style.top = `${placeAbove ? rect.top - 250 : rect.bottom + 14}px`;
  }

  function drawTrend(values) {
    const canvas = els.trendCanvas;
    const ratio = window.devicePixelRatio || 1;
    const width = 340;
    const height = 150;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    const padding = { left: 28, right: 14, top: 30, bottom: 28 };
    const ranked = values.filter(Number.isFinite);
    const min = ranked.length ? Math.max(1, Math.min(...ranked) - 2) : 1;
    const max = ranked.length ? Math.max(...ranked) + 2 : 100;
    const x = (index) => padding.left + (index / Math.max(1, values.length - 1)) * (width - padding.left - padding.right);
    const y = (value) => padding.top + ((value - min) / Math.max(1, max - min)) * (height - padding.top - padding.bottom);
    ctx.strokeStyle = "#e4ebe6";
    ctx.lineWidth = 1;
    [0, 0.5, 1].forEach((position) => {
      const lineY = padding.top + position * (height - padding.top - padding.bottom);
      ctx.beginPath(); ctx.moveTo(padding.left, lineY); ctx.lineTo(width - padding.right, lineY); ctx.stroke();
    });
    ctx.strokeStyle = "#0b6b4b";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    let drawing = false;
    ctx.beginPath();
    values.forEach((value, index) => {
      if (!Number.isFinite(value)) {
        drawing = false;
        return;
      }
      if (drawing) ctx.lineTo(x(index), y(value));
      else ctx.moveTo(x(index), y(value));
      drawing = true;
    });
    ctx.stroke();
    values.forEach((value, index) => {
      if (!Number.isFinite(value)) {
        const missingY = height - padding.bottom - 4;
        ctx.strokeStyle = "#c86c5d"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x(index) - 4, missingY - 4); ctx.lineTo(x(index) + 4, missingY + 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x(index) + 4, missingY - 4); ctx.lineTo(x(index) - 4, missingY + 4); ctx.stroke();
        ctx.fillStyle = "#9b5145"; ctx.font = "700 10px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("未上榜", x(index), missingY - 10);
        ctx.fillStyle = "#68776f"; ctx.font = "11px sans-serif";
        ctx.fillText(`W-${values.length - index - 1}`, x(index), height - 8);
        return;
      }
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#0b6b4b"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x(index), y(value), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#173d2d"; ctx.font = "700 11px sans-serif"; ctx.textAlign = "center";
      const labelY = y(value) < 43 ? y(value) + 20 : y(value) - 10;
      ctx.fillText(`#${value}`, x(index), labelY);
      ctx.fillStyle = "#68776f"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`W-${values.length - index - 1}`, x(index), height - 8);
    });
  }

  function restoreContextFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const requestedPlatform = params.get("platform");
    if (requestedPlatform && data.platforms[requestedPlatform]) state.platform = requestedPlatform;
    const requestedWeek = params.get("week");
    const availableWeeks = platform().weeks;
    state.week = availableWeeks.some((item) => item.key === requestedWeek)
      ? requestedWeek
      : availableWeeks[0].key;
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("platform", state.platform);
    url.searchParams.set("week", state.week);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function csvCell(value) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
  }

  let toastTimer;
  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("visible");
    toastTimer = setTimeout(() => els.toast.classList.remove("visible"), 2600);
  }

  restoreContextFromUrl();
  fillWeekOptions();
  bindEvents();
  observeSections();
  renderAll({ rebuildFilters: true });
  syncUrl();
})();
