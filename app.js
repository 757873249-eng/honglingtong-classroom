const state = {
  step: 0,
  report: "楼上住户多次在深夜直播，楼下住户反映休息受到影响。网格员已分别听取双方陈述并现场核实，双方此前沟通未能解决。",
  agreement: "balanced",
  consentA: false,
  consentB: false,
  followupOk: true,
  completed: false,
  history: []
};

const titles = ["事件上报", "辅助研判", "协同处置", "协商方案", "回访结案"];
const subtitles = [
  "网格员现场核实后，记录双方诉求并提交工单。",
  "系统提供辅助提示，由工作人员核实信息后决定处置。",
  "确认责任人员和协同力量，开展现场沟通。",
  "围绕双方实际困难形成自愿、可执行的协商方案。",
  "回访协议履行情况，确认是否结案或继续跟进。"
];
const statuses = ["待上报", "待人工复核", "处置中", "待双方确认", "待回访"];

const workArea = document.querySelector("#workArea");
const detailRail = document.querySelector("#detailRail");
const toastEl = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

function record(title, detail) {
  state.history.unshift({time: new Date().toLocaleTimeString("zh-CN", {hour:"2-digit", minute:"2-digit"}), title, detail});
}

function railContent() {
  const base = `
    <section class="panel">
      <div class="panel-head"><div><h2 class="panel-title">工单信息</h2><p class="panel-sub">当前模拟事件</p></div><span class="tag tag-sim">${state.completed ? "已完成" : statuses[state.step]}</span></div>
      <div class="panel-body">
        <div class="fact-row"><span>事件类别</span><b>邻里噪声纠纷</b></div>
        <div class="fact-row"><span>发现渠道</span><b>网格走访 · 居民反映</b></div>
        <div class="fact-row"><span>发生地点</span><b>某老旧小区 · 模拟地址</b></div>
        <div class="fact-row"><span>风险提示</span><b>${state.step > 0 ? "中等关注 · 人工复核" : "尚未研判"}</b></div>
        <div class="fact-row"><span>责任人员</span><b>${state.step >= 2 ? "社区调解员老李" : "待派单"}</b></div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2 class="panel-title">协同人员</h2><p class="panel-sub">按职责参与，不替代法定处置</p></div></div>
      <div class="panel-body">
        <div class="person-card"><span class="avatar">陈</span><div><b>网格员小陈</b><small>首报、核实、跟踪回访</small></div></div>
        <div class="person-card"><span class="avatar">李</span><div><b>镇街中心工作人员小李</b><small>受理、分流、协调资源</small></div></div>
        <div class="person-card"><span class="avatar">调</span><div><b>社区调解员老李</b><small>听取双方意见、主持自愿协商</small></div></div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2 class="panel-title">数据与责任提示</h2><p class="panel-sub">课堂推演的治理边界</p></div></div>
      <div class="panel-body">
        <ul class="privacy-list">
          <li>仅使用工单中必要信息，不自动读取私人群聊。</li>
          <li>模型提示不等于事实认定，须由工作人员核实。</li>
          <li>不生成信用惩戒，不把纠纷标签扩展到个人。</li>
          <li>当事人不同意协商时，保留其他法定渠道。</li>
        </ul>
      </div>
    </section>
    <div class="footer-line">模拟页面 · 不采集或上传个人信息</div>`;
  detailRail.innerHTML = base;
}

function eventCard(title, subtitle, body) {
  return `<section class="panel"><div class="panel-head"><div><h2 class="panel-title">${title}</h2><p class="panel-sub">${subtitle}</p></div></div><div class="panel-body">${body}</div></section>`;
}

function renderReport() {
  return `
    ${eventCard("事件基本信息", "网格员上门核实后提交。请勿录入与处置无关的个人信息。", `
      <div class="form-grid">
        <div class="field"><label for="district">发生区域</label><input id="district" value="萧山区 · 某街道 · 某老旧小区（模拟）" readonly></div>
        <div class="field"><label for="source">发现方式</label><select id="source"><option>网格走访 + 居民反映</option><option>居民主动来访</option><option>物业转报</option></select></div>
        <div class="field full"><label for="eventText">事件经过</label><textarea id="eventText">${escapeHtml(state.report)}</textarea></div>
        <div class="field"><label for="issueType">事件类别</label><select id="issueType"><option>邻里噪声纠纷</option><option>物业服务争议</option><option>公共空间使用争议</option></select></div>
        <div class="field"><label for="urgency">初步处置建议</label><select id="urgency"><option>尽快联系双方，核实诉求</option><option>转社区调解员跟进</option><option>需要其他部门依法处理</option></select></div>
      </div>
      <div class="actions"><span class="helper">提交即进入课堂模拟流程。这里不会连接真实“红领通”。</span><button class="primary-button" data-action="submit">提交并受理 <span class="button-arrow">›</span></button></div>
    `)}
    ${eventCard("网格员核实记录", "仅展示本次推演设定的现场信息。", `
      <div class="event-summary"><div class="summary-cell"><small>居民A · 楼上住户</small><strong>夜间直播为主要工作时段</strong></div><div class="summary-cell"><small>居民B · 楼下住户</small><strong>反映休息受影响，希望减少夜间噪声</strong></div><div class="summary-cell"><small>现场核实</small><strong>双方曾沟通，尚未达成一致</strong></div></div>
    `)}
  `;
}

function renderAssessment() {
  return `
    ${eventCard("AI辅助研判", "基于已提交工单文本生成提示。模型不作事实认定，也不自动决定执法措施。", `
      <div class="ai-score"><div class="score-mark">关注</div><div class="score-text"><b>建议尽快人工跟进</b><small>情景模拟提示：重复反映、双方沟通未果。不能据此推定某一方存在过错。</small></div></div>
      <div style="height:13px"></div>
      <div class="source-list">
        <div class="source-row"><span class="source-check">✓</span><span><b>输入信息：</b>网格员提交的事件描述和双方自愿提供的诉求。</span></div>
        <div class="source-row"><span class="source-check">✓</span><span><b>系统提示：</b>建议分别听取双方意见，优先安排社区调解员沟通。</span></div>
        <div class="source-row"><span class="source-check">✓</span><span><b>人工核验：</b>核实噪声发生时段、持续情况及双方可接受的调整空间。</span></div>
      </div>
      <div style="height:12px"></div>
      <div class="note-box"><b>研判边界</b> 本模拟不展示“升级概率”等未经验证的精确数字，也不读取居民群聊、健康信息或职业画像。实际应用须有明确的数据来源、使用权限和纠错渠道。</div>
      <div class="actions"><span class="helper">请工作人员复核提示后再派单。</span><button class="primary-button" data-action="confirmAssessment">确认研判并派单 <span class="button-arrow">›</span></button></div>
    `)}
    ${eventCard("处置记录", "记录系统提示与人工判断的区别。", historyMarkup())}
  `;
}

function renderDispatch() {
  return `
    ${eventCard("协同处置任务", "中心受理后，将任务交由适当人员跟进。处置时限为本次课堂推演设置。", `
      <div class="task-row"><div class="task-person"><span class="avatar">李</span><div><b>社区调解员老李</b><small>主办 · 分别联系纠纷双方</small></div></div><span class="task-status">已派单</span></div>
      <div class="task-row"><div class="task-person"><span class="avatar">陈</span><div><b>网格员小陈</b><small>协办 · 提供核实记录并陪同回访</small></div></div><span class="task-status">协同</span></div>
      <div class="task-row"><div class="task-person"><span class="avatar">物</span><div><b>物业服务人员</b><small>按需参与 · 核实隔音与施工条件</small></div></div><span class="task-status">待联系</span></div>
      <div class="note-box" style="margin-top:12px">多部门联动不等于所有部门都调取全部数据。只邀请与具体问题有关的人员，并说明各自职责。</div>
      <div class="actions"><span class="helper">现场调解由工作人员开展，AI仅提供参考。</span><button class="primary-button" data-action="arrive">记录到场并开始沟通 <span class="button-arrow">›</span></button></div>
    `)}
    ${eventCard("工单流转", "每一步都保留人工操作记录。", historyMarkup())}
  `;
}

function renderAgreement() {
  const selected = state.agreement;
  return `
    ${eventCard("双方诉求", "先听取当事人意见，再讨论是否存在双方都能接受的方案。", `
      <div class="choice-row">
        <div class="note-box"><b>楼上住户</b><br>直播是主要工作来源；可以考虑隔音措施，但需要保留合理工作时间。</div>
        <div class="note-box"><b>楼下住户</b><br>夜间休息受到影响；希望明确安静时段并看到实际改善。</div>
      </div>
      <div style="height:13px"></div>
      <div class="field"><label>调解员提出的协商选项</label></div>
      <label class="agreement-option"><input type="radio" name="agreement" value="balanced" ${selected === "balanced" ? "checked" : ""}><b>双方调整方案</b><small>楼上住户自愿在约定时段降低音量并加装隔音设施；物业协助确认可行做法，社区按实际政策提供支持。</small></label>
      <label class="agreement-option"><input type="radio" name="agreement" value="schedule" ${selected === "schedule" ? "checked" : ""}><b>先约定安静时段</b><small>双方先试行一周，约定夜间安静时段；网格员回访，再决定是否需要其他措施。</small></label>
      <label class="agreement-option"><input type="radio" name="agreement" value="continue" ${selected === "continue" ? "checked" : ""}><b>暂不签订协议</b><small>双方暂时无法达成一致，由调解员记录意见，并告知后续可选择的正式处理渠道。</small></label>
      <label class="consent-line"><input id="consentA" type="checkbox" ${state.consentA ? "checked" : ""}>居民A自愿接受该方案</label>
      <label class="consent-line"><input id="consentB" type="checkbox" ${state.consentB ? "checked" : ""}>居民B自愿接受该方案</label>
      <div class="actions"><span class="helper">双方均同意后，才生成模拟调解协议。</span><button class="primary-button" data-action="agreement" ${selected === "continue" || !state.consentA || !state.consentB ? "disabled" : ""}>生成协商记录 <span class="button-arrow">›</span></button></div>
    `)}
    ${eventCard("调解原则", "社区调解建立在自愿、平等的基础上。", `
      <div class="source-list"><div class="source-row"><span class="source-check">✓</span><span>不把 AI 推荐方案当成强制命令。</span></div><div class="source-row"><span class="source-check">✓</span><span>双方可以拒绝、修改方案或要求进一步沟通。</span></div><div class="source-row"><span class="source-check">✓</span><span>不得将履约情况直接转成未获授权的信用惩戒。</span></div></div>
    `)}
  `;
}

function renderFollowup() {
  return `
    ${eventCard("协议履行回访", "按协商约定核实实际变化，不只以系统状态作为结案依据。", `
      <div class="success-box"><span class="success-icon">✓</span><div><b>模拟回访节点已到</b><p>网格员已联系双方，确认隔音措施和安静时段是否落实。请根据本次课堂推演选择回访结果。</p></div></div>
      <div style="height:13px"></div>
      <div class="field"><label>回访结果</label></div>
      <div class="choice-row">
        <label class="select-card"><input type="radio" name="followup" value="ok" ${state.followupOk ? "checked" : ""}><span><b>双方反馈已改善</b><small>记录回访结果，结束本次模拟工单。</small></span></label>
        <label class="select-card"><input type="radio" name="followup" value="reopen" ${!state.followupOk ? "checked" : ""}><span><b>问题仍有反复</b><small>重新联系双方，调整方案或转入其他处理渠道。</small></span></label>
      </div>
      <div class="actions"><span class="helper">回访结论由工作人员核实并记录。</span><button class="primary-button" data-action="closeCase">${state.followupOk ? "确认回访并结案" : "重新启动协调"} <span class="button-arrow">›</span></button></div>
    `)}
    ${eventCard("处置时间线", "本页面记录仅保存在当前浏览器内存中。", historyMarkup())}
  `;
}

function historyMarkup() {
  if (!state.history.length) return `<p class="empty-hint">暂无操作记录。</p>`;
  return `<div class="timeline">${state.history.map(item => `<div class="timeline-row"><time>${item.time}</time><span class="timeline-line"><i></i></span><div class="timeline-copy"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.detail)}</small></div></div>`).join("")}</div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
}

function render() {
  document.querySelector("#pageTitle").textContent = titles[state.step];
  document.querySelector("#pageSub").textContent = subtitles[state.step];
  document.querySelector("#sideStatus").textContent = statuses[state.step];
  document.querySelectorAll(".workflow-item").forEach((el, index) => {
    el.classList.toggle("active", index === state.step);
    el.classList.toggle("done", index < state.step);
  });
  document.querySelectorAll(".step-link").forEach((el, index) => {
    el.classList.toggle("current", index === state.step);
    el.classList.toggle("done", index < state.step);
    el.disabled = index > state.step;
  });
  workArea.innerHTML = [renderReport, renderAssessment, renderDispatch, renderAgreement, renderFollowup][state.step]();
  railContent();
  bindStageControls();
}

function advance(step) {
  state.step = step;
  render();
  window.scrollTo({top:0, behavior:"smooth"});
}

function bindStageControls() {
  workArea.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "submit") {
      state.report = workArea.querySelector("#eventText").value.trim();
      if (!state.report) return showToast("请先填写事件经过");
      record("网格员提交事件", "现场核实后提交邻里噪声纠纷工单。");
      record("镇街中心受理", "工单进入模拟处置流程。");
      showToast("模拟工单已受理");
      advance(1);
    }
    if (action === "confirmAssessment") {
      record("工作人员复核研判", "确认重复反映和沟通未果情况，采纳尽快联系双方的建议。");
      record("任务派发", "派社区调解员主办，网格员协办。");
      showToast("已完成人工复核并派单");
      advance(2);
    }
    if (action === "arrive") {
      record("现场沟通开始", "调解员分别听取双方意见，网格员协助记录。");
      showToast("已记录现场沟通");
      advance(3);
    }
    if (action === "agreement") {
      record("双方自愿确认方案", state.agreement === "balanced" ? "约定降低夜间噪声并核实隔音措施。" : "先试行约定的安静时段，再进行回访。");
      record("设置回访", "网格员按约定节点联系双方，核实实际履行情况。");
      showToast("模拟协商记录已生成");
      advance(4);
    }
    if (action === "closeCase") {
      if (state.followupOk) {
        state.completed = true;
        record("回访完成", "双方反馈情况已有改善，模拟工单结案。");
        showToast("本次情景推演已完成");
        showCompletion();
      } else {
        record("回访发现反复", "不直接结案，重新联系双方并调整处置方式。");
        showToast("工单重新进入协调流程");
        advance(2);
      }
    }
  }));

  workArea.querySelectorAll('input[name="agreement"]').forEach(input => input.addEventListener("change", () => { state.agreement = input.value; render(); }));
  workArea.querySelector("#consentA")?.addEventListener("change", event => { state.consentA = event.target.checked; render(); });
  workArea.querySelector("#consentB")?.addEventListener("change", event => { state.consentB = event.target.checked; render(); });
  workArea.querySelectorAll('input[name="followup"]').forEach(input => input.addEventListener("change", () => { state.followupOk = input.value === "ok"; render(); }));
}

function showCompletion() {
  workArea.innerHTML = `
    ${eventCard("情景推演完成", "从网格发现到协商回访，模拟工单已走完处置流程。", `
      <div class="success-box"><span class="success-icon">✓</span><div><b>工单已模拟结案</b><p>本次结果来自课堂角色推演，不是萧山区真实处置结果，也不构成平台成效证明。</p></div></div>
      <div style="height:14px"></div>
      <div class="event-summary"><div class="summary-cell"><small>技术发挥的作用</small><strong>整理线索、提示跟进、记录流程</strong></div><div class="summary-cell"><small>人工发挥的作用</small><strong>核实事实、听取诉求、协商方案</strong></div><div class="summary-cell"><small>需要继续讨论</small><strong>数据边界、误判责任、基层负担</strong></div></div>
      <div class="actions"><span class="helper">推演结果不上传、不统计。</span><button class="secondary-button" id="restartInline">重新开始</button></div>
    `)}
    ${eventCard("本次操作记录", "仅在当前页面展示，刷新后清除。", historyMarkup())}
  `;
  document.querySelectorAll(".step-link").forEach(el => {el.disabled = false;});
  document.querySelector("#sideStatus").textContent = "已完成";
  document.querySelector("#restartInline")?.addEventListener("click", reset);
  railContent();
}

function reset() {
  state.step = 0;
  state.report = "楼上住户多次在深夜直播，楼下住户反映休息受到影响。网格员已分别听取双方陈述并现场核实，双方此前沟通未能解决。";
  state.agreement = "balanced";
  state.consentA = false;
  state.consentB = false;
  state.followupOk = true;
  state.completed = false;
  state.history = [];
  render();
  showToast("已重新开始情景推演");
}

document.querySelectorAll(".step-link").forEach(link => link.addEventListener("click", () => {
  const target = Number(link.dataset.step);
  if (target <= state.step) advance(target);
}));
document.querySelector("#resetButton").addEventListener("click", reset);
render();
