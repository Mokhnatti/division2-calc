// Language state — must be declared before render() runs (TDZ fix)
var currentLang = (typeof localStorage !== 'undefined' && localStorage.getItem("d2calc_lang")) || "ru";

const STAT_RU = {
  "weapon damage":"Урон оружия","armor":"Броня","skill tier":"Уровень скиллов",
  "damage to armor":"Урон по броне","damage to health":"Урон по здоровью",
  "headshot damage":"Урон в голову","crit chance":"Шанс крит. попадания",
  "crit damage":"Урон крит. попадания","rate of fire":"Скорострельность",
  "weapon handling":"Управление оружием","reload speed":"Скорость перезарядки",
  "magazine size":"Ёмкость магазина","accuracy":"Точность","stability":"Стабильность",
  "optimal range":"Оптимальная дистанция","armor on kill":"Броня за убийство",
  "armor regeneration":"Восстан. брони","health on kill":"HP за убийство",
  "status effects":"Эффекты состояний","hazard protection":"Защита от опасностей",
  "skill haste":"Ускорение скиллов","skill duration":"Длительность скиллов",
  "skill health":"HP скиллов","skill damage":"Урон скиллов",
  "scanner pulse haste":"Ускорение сканирования","pulse haste":"Ускорение пульса",
  "pistol damage":"Урон пистолетов","assault rifle damage":"Урон винтовок",
  "smg damage":"Урон ПП","rifle damage":"Урон винтовок","mmr damage":"Урон снайперок",
  "lmg damage":"Урон пулемётов","shotgun damage":"Урон дробовиков",
};
function translateStat(s){if(!s)return s;return STAT_RU[s.toLowerCase()]||s;}

// ===== GEAR SETS =====
const G = D2DATA.G;

// ===== BRANDS =====
const B = D2DATA.B;

// ===== EXOTICS =====
const E = D2DATA.E;

// ===== NAMED ITEMS =====
const N = [...(D2DATA.N||[]), ...(D2DATA.NAMED_GEAR||[])];

// ===== LOGIC =====
const TL = D2DATA.TL;
function st(item){
    let p=[item.name,item.en||"",item.type||item.t||"",item.brand||"",item.tal||"",item.d||"",item.g||""];
    if(item.bonuses)p.push(...item.bonuses);
    if(item.chest)p.push(item.chest);
    if(item.bp)p.push(item.bp);
    return p.join(" ").toLowerCase();
}
function mq(text,q){if(!q)return true;return q.toLowerCase().trim().split(/\s+/).every(w=>text.includes(w))}
function fi(items,qs,mode){
    return items.filter(i=>{
        const t=st(i);const r=qs.filter(q=>q).map(q=>mq(t,q));
        if(!r.length)return true;
        return mode==="and"?r.every(x=>x):r.some(x=>x);
    });
}
function hl(s,qs){
    if(!qs.some(q=>q))return s;let r=s;
    qs.filter(q=>q).forEach(q=>{
        q.toLowerCase().trim().split(/\s+/).forEach(w=>{
            if(w.length<2)return;
            r=r.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi'),'<mark>$1</mark>');
        });
    });return r;
}

let activeCat="community";

function render(){
    if(activeCat==="meta"){
        document.getElementById("mc").style.display="none";
        document.getElementById("dps-panel").style.display="none";
        document.getElementById("meta-panel").style.display="block";
        document.getElementById("rc").innerHTML='';
        if(typeof loadTopBuilds==="function")loadTopBuilds();
        return;
    }
    document.getElementById("meta-panel").style.display="none";
    document.getElementById("build-panel").style.display="none";
    const q=[document.getElementById("s1").value,document.getElementById("s2").value,document.getElementById("s3").value];
    const mode=document.querySelector('input[name="mode"]:checked').value;
    const c=document.getElementById("mc");const qs=q.filter(x=>x);
    const fG=activeCat==="all"||activeCat==="gear"?fi(G,q,mode):[];
    const fB=activeCat==="all"||activeCat==="brand"?fi(B,q,mode):[];
    const fE=activeCat==="all"||activeCat==="exotic"?fi(E,q,mode):[];
    const fN=activeCat==="all"||activeCat==="named"?fi(N,q,mode):[];
    const tot=fG.length+fB.length+fE.length+fN.length;
    const all=G.length+B.length+E.length+N.length;
    document.getElementById("rc").innerHTML=qs.length?`Найдено: <span>${tot}</span> из ${all} (${mode==="and"?"И — пересечения":"ИЛИ — любое"})`:
        `Всего: <span>${all}</span> предметов`;
    let h="";const H=(s)=>hl(s,q);

    const isEn=currentLang==="en";
    const L=(ru,en)=>isEn&&en?en:ru;
    const trSet=(en)=>getEnDescription("sets",en);
    const trBrand=(name)=>getEnDescription("brands",name);
    const trExotic=(en)=>getEnDescription("exotics",en);
    const trNamed=(en)=>getEnDescription("named",en);

    // GEAR
    if(fG.length){
        h+=`<div class="section-title">${L("Комплекты снаряжения","Gear Sets")} <span class="cnt">${fG.length}</span></div><div class="grid">`;
        fG.forEach(g=>{
            const en=trSet(g.en);
            const bonuses=isEn&&en&&en.bonuses?en.bonuses:g.bonuses;
            const chest=isEn&&en&&en.chest?en.chest:g.chest;
            const bp=isEn&&en&&en.bp?en.bp:g.bp;
            h+=`<div class="card"><div class="card-h"><div><div class="cn gear">${H(isEn&&g.en?g.en:g.name)}${wikiIcon(g.en)}</div><div class="en">${H(isEn?g.name:g.en)}</div></div><span class="badge b-${g.type}">${TL[g.type]}</span></div>`;
            bonuses.forEach(b=>{const[t,...r]=b.split(": ");h+=`<div class="bl"><span class="bt">${t}:</span><span class="bv">${H(r.join(": "))}</span></div>`});
            h+=`<div class="tl"><div class="t-line"><span class="t-name">${L("Нагрудник","Chest")}:</span><span class="t-desc">${H(chest)}</span></div>`;
            h+=`<div class="t-line"><span class="t-name">${L("Рюкзак","Backpack")}:</span><span class="t-desc">${H(bp)}</span></div></div></div>`;
        });h+='</div>';
    }

    // BRANDS
    if(fB.length){
        h+=`<div class="section-title">${L("Брендовые наборы","Brand Sets")} <span class="cnt">${fB.length}</span></div><div class="grid sm">`;
        fB.forEach(b=>{
            const en=trBrand(b.name);
            const bonuses=isEn&&en&&en.bonuses?en.bonuses:b.bonuses;
            h+=`<div class="card"><div class="card-h"><div class="cn brand">${H(b.name)}${wikiIcon(b.name)}</div><span class="badge b-brand">${L("Бренд","Brand")}</span></div>`;
            bonuses.forEach(bn=>{const[t,...r]=bn.split(": ");h+=`<div class="bl"><span class="bt">${t}:</span><span class="bv">${H(r.join(": "))}</span></div>`});
            h+='</div>';
        });h+='</div>';
    }

    // EXOTICS
    if(fE.length){
        h+=`<div class="section-title">${L("Экзотики","Exotics")} <span class="cnt">${fE.length}</span></div>`;
        const eg={};fE.forEach(e=>{if(!eg[e.g])eg[e.g]=[];eg[e.g].push(e)});
        ["Штурмовые винтовки","Пистолеты-пулемёты","Ручные пулемёты","Дробовики","Снайперские винтовки","Винтовки","Пистолеты","Маски","Рюкзаки","Нагрудники","Перчатки","Наколенники","Кобуры"].forEach(gr=>{
            if(!eg[gr])return;
            h+=`<div class="sub">${gr} (${eg[gr].length})</div><div class="grid">`;
            eg[gr].forEach(e=>{
                const en=trExotic(e.en);
                let tal=isEn?(en&&en.tal?en.tal:e.tal):(e.tal_ru||talentName(e.tal));
                let d=isEn?(en&&en.d?en.d:e.d):(e.tal_ru_full||e.d);
                // Override with authoritative game text if available
                if(isEn){
                  const auth=getAuthoritativeTalent(e.tal);
                  if(auth&&auth.d){tal=auth.tal;d=auth.d}
                }
                const displayName=isEn&&e.en?e.en:e.name;
                const displaySub=isEn?e.name:(e.en||"");
                h+=`<div class="card"><div class="card-h"><div><div class="cn exotic">${H(displayName)}${wikiIcon(e.en)}</div>${displaySub?`<div class="en">${H(displaySub)}</div>`:""}</div><span class="badge b-exotic">${H(e.t)}</span></div>`;
                h+=`<div class="t-line"><span class="t-name">${H(tal)}</span></div>`;
                h+=`<div class="t-desc" style="font-size:12px;line-height:1.4">${H(d)}</div></div>`;
            });h+='</div>';
        });
    }

    // NAMED
    if(fN.length){
        h+=`<div class="section-title">${L("Именные предметы","Named Items")} <span class="cnt">${fN.length}</span></div>`;
        const ng={};fN.forEach(n=>{if(!ng[n.g])ng[n.g]=[];ng[n.g].push(n)});
        ["Штурмовые винтовки","Пистолеты-пулемёты","Дробовики","Ручные пулемёты","Снайперские винтовки","Винтовки","Пистолеты","Маски","Нагрудники","Рюкзаки","Перчатки","Кобуры","Наколенники"].forEach(gr=>{
            if(!ng[gr])return;
            h+=`<div class="sub">${gr} (${ng[gr].length})</div><div class="grid">`;
            ng[gr].forEach(n=>{
                const en=trNamed(n.en);
                let tal=isEn?(en&&en.tal?en.tal:n.tal):(n.tal_ru||talentName(n.tal));
                let d=isEn?(en&&en.d?en.d:n.d):n.d;
                if(isEn){
                  const auth=getAuthoritativeTalent(n.tal);
                  if(auth&&auth.d){tal=auth.tal;d=auth.d}
                }
                const displayName=isEn&&n.en?n.en:n.name;
                const displaySub=isEn?n.name:(n.en||"");
                h+=`<div class="card"><div class="card-h"><div><div class="cn named">${H(displayName)}${wikiIcon(n.en)}</div>${displaySub?`<div class="en">${H(displaySub)}</div>`:""}</div><span class="badge b-named">${H(n.t)}</span></div>`;
                if(n.brand)h+=`<div class="info">${L("Бренд","Brand")}: ${H(n.brand)}</div>`;
                const coreVal=Array.isArray(n.core)?n.core[0]:n.core;
                if(coreVal)h+=`<div class="info" style="color:#ff9800">${L("Осн. реквизит","Core")}: ${H(translateStat(coreVal))}</div>`;
                if(n.attr1){const a1=Object.entries(n.attr1).map(([k,v])=>`+${v}% ${translateStat(k)}`).join(", ");if(a1)h+=`<div class="info" style="color:#4caf50">${L("Атр.1","Attr.1")}: ${H(a1)}</div>`;}
                if(n.attr2){const a2=Object.entries(n.attr2).map(([k,v])=>`+${v}% ${translateStat(k)}`).join(", ");if(a2)h+=`<div class="info" style="color:#4caf50">${L("Атр.2","Attr.2")}: ${H(a2)}</div>`;}
                if(n.bonus_ru)h+=`<div class="info" style="color:#ff9800;font-weight:600">${L("Бонус","Bonus")}: ${H(n.bonus_ru)}</div>`;
                if(tal)h+=`<div class="t-line"><span class="t-name">${H(tal)}</span></div>`;
                if(d)h+=`<div class="t-desc" style="font-size:12px;line-height:1.4">${H(d)}</div>`;
                h+=`</div>`;
            });h+='</div>';
        });
    }

    if(!tot&&qs.length)h='<div style="text-align:center;padding:60px;color:#444;font-size:15px">Ничего не найдено</div>';
    c.innerHTML=h;
}

document.querySelectorAll("#s1,#s2,#s3").forEach(el=>el.addEventListener("input",render));

// ===== SEARCH HINTS (autocomplete) =====
let _searchIndex=null;
function buildSearchIndex(){
  if(_searchIndex)return _searchIndex;
  const out=[];const seen=new Set();
  const push=(name,kind)=>{
    if(!name)return;const key=name.toLowerCase();if(seen.has(key+"|"+kind))return;seen.add(key+"|"+kind);
    out.push({name,kind});
  };
  try{(D2DATA.E||[]).forEach(i=>{push(i.name,"экзотик");push(i.en,"экзотик");});}catch(e){}
  try{(D2DATA.N||[]).forEach(i=>{push(i.name,"именной");push(i.en,"именной");});}catch(e){}
  try{(D2DATA.NAMED_GEAR||[]).forEach(i=>{push(i.name,"именной");push(i.en,"именной");});}catch(e){}
  try{(D2DATA.G||[]).forEach(i=>{push(i.name,"сет");push(i.en,"сет");});}catch(e){}
  try{(D2DATA.B||[]).forEach(i=>{push(i.name,"бренд");push(i.en,"бренд");});}catch(e){}
  try{Object.keys(D2DATA.WEAPON_TALENTS||{}).forEach(k=>{push(k,"талант");});}catch(e){}
  try{Object.keys(D2DATA.TL||{}).forEach(k=>{push(k,"талант");});}catch(e){}
  _searchIndex=out;return out;
}
function showHints(inputId){
  const input=document.getElementById(inputId);
  const hints=document.getElementById(inputId+"-hints");
  if(!input||!hints)return;
  const q=input.value.toLowerCase().trim();
  if(!q||q.length<2){hints.style.display="none";hints.innerHTML="";return}
  const idx=buildSearchIndex();
  const matches=[];const seen=new Set();
  for(const item of idx){
    if(matches.length>=10)break;
    if(item.name.toLowerCase().includes(q)){
      const k=item.name.toLowerCase();
      if(seen.has(k))continue;seen.add(k);
      matches.push(item);
    }
  }
  if(!matches.length){hints.style.display="none";hints.innerHTML="";return}
  hints.innerHTML=matches.map(m=>{
    const esc=String(m.name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    return `<div class="sh-item" data-val="${esc}"><span>${esc}</span><span class="sh-kind">${m.kind}</span></div>`;
  }).join("");
  hints.style.display="block";
  hints.querySelectorAll(".sh-item").forEach(el=>{
    el.addEventListener("mousedown",ev=>{
      ev.preventDefault();
      input.value=el.getAttribute("data-val")||"";
      hints.style.display="none";hints.innerHTML="";
      render();
    });
  });
}
document.querySelectorAll("#s1,#s2,#s3").forEach(el=>{
  el.addEventListener("input",()=>showHints(el.id));
  el.addEventListener("focus",()=>showHints(el.id));
  el.addEventListener("blur",()=>{setTimeout(()=>{const h=document.getElementById(el.id+"-hints");if(h){h.style.display="none";h.innerHTML=""}},150);});
});
document.querySelectorAll('input[name="mode"]').forEach(el=>el.addEventListener("change",render));
document.querySelectorAll(".cat-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
        document.querySelectorAll(".cat-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");activeCat=btn.dataset.cat;
        // pushState routing
        const _urlMap={community:'/',build:'/build',dps:'/dps',meta:'/top',all:'/all',gear:'/sets',brand:'/brands',exotic:'/exotics',named:'/named-items',wmods:'/weapon-mods',smods:'/skill-mods',expertise:'/expertise',help:'/help'};
        const _titleMap={community:'Сообщество',build:'Билд-конструктор',dps:'DPS Калькулятор',meta:'Топ билдов',all:'База данных',gear:'Комплекты',brand:'Бренды',exotic:'Экзотики',named:'Именные предметы',wmods:'Моды оружия',smods:'Моды навыков',expertise:'Экспертиза',help:'Справка'};
        history.pushState({cat:activeCat},'',_urlMap[activeCat]||'/');
        document.title=(_titleMap[activeCat]||'Division 2')+' · divcalc.xyz';
        // toggle panels
        const isCalc = activeCat==="dps";
        const isMeta = activeCat==="meta";
        const isBuild = activeCat==="build";
        const isCommunity = activeCat==="community";
        const isWmods = activeCat==="wmods";
        const isSmods = activeCat==="smods";
        const isExpertise = activeCat==="expertise";
        const isHelp = activeCat==="help";
        const hideMain = isCalc||isMeta||isBuild||isCommunity||isWmods||isSmods||isExpertise||isHelp;
        document.getElementById("mc").style.display=hideMain?"none":"";
        document.getElementById("rc").style.display=hideMain?"none":"";
        document.querySelector(".search-panel").style.display=hideMain?"none":"";
        document.getElementById("dps-panel").style.display=isCalc?"block":"none";
        document.getElementById("meta-panel").style.display=isMeta?"block":"none";
        document.getElementById("build-panel").style.display=isBuild?"block":"none";
        const commPanel=document.getElementById("community-panel");
        if(commPanel)commPanel.style.display=isCommunity?"block":"none";
        const wmodsPanel=document.getElementById("wmods-panel");
        if(wmodsPanel)wmodsPanel.style.display=isWmods?"block":"none";
        const smodsPanel=document.getElementById("smods-panel");
        if(smodsPanel)smodsPanel.style.display=isSmods?"block":"none";
        const expPanel=document.getElementById("expertise-panel");
        if(expPanel)expPanel.style.display=isExpertise?"block":"none";
        const helpPanel=document.getElementById("help-panel");
        if(helpPanel)helpPanel.style.display=isHelp?"block":"none";
        if(!hideMain) render();
        else if(isCalc) calcDPS();
        else if(isBuild) calcBuild();
        else if(isCommunity) loadCommunityFeed();
        else if(isMeta) loadTopBuilds();
        else if(isWmods) renderWeaponMods();
        else if(isSmods) renderSkillGearMods();
        else if(isExpertise) renderExpertise();
    });
});
render();

// ===== PRESETS REMOVED =====

// ===== DPS CALCULATOR =====
function v(id){return parseFloat(document.getElementById(id).value)||0}

function calcDPS(){
    const base=v("c_base"), rpm=v("c_rpm"), mag=v("c_mag"), reload=v("c_reload");
    const wd=v("c_wd"), wtd=v("c_wtd");
    const chc=Math.min(v("c_chc"),60)/100, chd=v("c_chd")/100;
    const hsd=v("c_hsd")/100, hsRate=v("c_hsrate")/100;
    const dta=v("c_dta")/100, ooc=v("c_ooc")/100, amp=v("c_amp")/100;

    // Бакеты (множатся между собой)
    const bWD = 1 + (wd+wtd)/100;       // Weapon Damage bucket (аддитивный внутри)
    const bCrit = 1 + chc * chd;          // Средний крит множитель
    const bHS = 1 + hsRate * hsd;         // Средний хедшот множитель
    const bDtA = 1 + dta;                 // Damage to Armor
    const bOoC = 1 + ooc;                 // Out of Cover
    const bAmp = 1 + amp;                 // Amplified

    // Урон за пулю (средний)
    const bulletDmg = base * bWD * bCrit * bHS * bDtA * bOoC * bAmp;

    // Sustained DPS
    const rps = rpm / 60;
    const magTime = mag / rps;
    const cycleTime = magTime + reload;
    const dps = (bulletDmg * mag) / cycleTime;

    // Burst DPS (без перезарядки)
    const burstDps = bulletDmg * rps;

    // Update multiplier displays
    document.getElementById("wd-mult").textContent = "x" + bWD.toFixed(2);
    document.getElementById("crit-mult").textContent = "x" + bCrit.toFixed(2);

    document.getElementById("dps-val").textContent = Math.round(dps).toLocaleString("ru");
    document.getElementById("dps-details").innerHTML =
        `Урон/пулю: <b>${Math.round(bulletDmg).toLocaleString("ru")}</b> &nbsp;|&nbsp; `+
        `Burst DPS: <b>${Math.round(burstDps).toLocaleString("ru")}</b> &nbsp;|&nbsp; `+
        `Цикл: ${magTime.toFixed(1)}с стрельба + ${reload}с перезарядка = ${cycleTime.toFixed(1)}с`;

    // Buckets chart
    const buckets = [
        {name:"Урон оружием (WD+тип)",val:bWD,color:"#ef5350",pct:(wd+wtd)},
        {name:"Крит (CHC×CHD)",val:bCrit,color:"#fdd835",pct:Math.round((bCrit-1)*100)},
        {name:"Хедшот (HSD×%)",val:bHS,color:"#42a5f5",pct:Math.round((bHS-1)*100)},
        {name:"Урон по броне (DtA)",val:bDtA,color:"#00c853",pct:Math.round(dta*100)},
        {name:"Вне укрытия (OoC)",val:bOoC,color:"#ff7043",pct:Math.round(ooc*100)},
        {name:"Усиленный (Amp)",val:bAmp,color:"#ab47bc",pct:Math.round(amp*100)},
    ];
    const maxBucket = Math.max(...buckets.map(b=>b.val));
    document.getElementById("buckets-chart").innerHTML = buckets.map(b=>{
        const w = Math.max((b.val/maxBucket)*100, 2);
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <div style="min-width:180px;font-size:12px;color:var(--muted)">${b.name}</div>
            <div style="flex:1;height:20px;background:var(--border);border-radius:4px;position:relative;overflow:hidden">
                <div style="height:100%;width:${w}%;background:${b.color};border-radius:4px;transition:width .3s"></div>
            </div>
            <div style="min-width:50px;text-align:right;font-size:13px;font-weight:700;color:${b.color}">x${b.val.toFixed(2)}</div>
            <div style="min-width:40px;text-align:right;font-size:11px;color:#555">${b.pct}%</div>
        </div>`;
    }).join("");

    // Веса статов — маржинальный DPS за +1%
    const weights = [
        {name:'Урон оружием (<span class="stat-tip" data-stat="WD">WD</span>)', delta: calcWith("wd",1) - dps},
        {name:"Урон типа оружия", delta: calcWith("wtd",1) - dps},
        {name:'Шанс крита (<span class="stat-tip" data-stat="CHC">CHC</span>)', delta: calcWithCHC(1) - dps},
        {name:'Урон крита (<span class="stat-tip" data-stat="CHD">CHD</span>)', delta: calcWithCHD(1) - dps},
        {name:'Урон в голову (<span class="stat-tip" data-stat="HSD">HSD</span>)', delta: calcWithHSD(1) - dps},
        {name:'Урон по броне (<span class="stat-tip" data-stat="DtA">DtA</span>)', delta: calcWithMult("dta",1) - dps},
        {name:'Урон вне укрытия (<span class="stat-tip" data-stat="OoC">OoC</span>)', delta: calcWithMult("ooc",1) - dps},
        {name:'Усиленный (<span class="stat-tip" data-stat="AMP">Amplified</span>)', delta: calcWithMult("amp",1) - dps},
    ];

    const maxDelta = Math.max(...weights.map(w=>w.delta));
    const tbody = document.getElementById("weights-body");
    tbody.innerHTML = weights.map(w=>{
        const pct = maxDelta > 0 ? (w.delta/maxDelta*100) : 0;
        const best = w.delta === maxDelta ? ' w-best' : '';
        return `<tr><td class="${best}">${w.name}${best?' ★':''}</td>
            <td class="${best}">+${Math.round(w.delta).toLocaleString("ru")}</td>
            <td style="width:40%"><div class="w-bar-bg"><div class="w-bar" style="width:${pct}%"></div></div></td>
            <td class="${best}" style="font-size:11px;width:50px">${(w.delta/dps*100).toFixed(2)}%</td></tr>`;
    }).join("");
    if(typeof updateStatTooltips==="function")updateStatTooltips();

    function calcWith(field, add){
        const wd2 = (field==="wd"?wd+add:wd), wtd2 = (field==="wtd"?wtd+add:wtd);
        const bWD2 = 1 + (wd2+wtd2)/100;
        const b2 = base * bWD2 * bCrit * bHS * bDtA * bOoC * bAmp;
        return (b2 * mag) / cycleTime;
    }
    function calcWithCHC(add){
        const chc2 = Math.min(chc + add/100, 0.6);
        const bC2 = 1 + chc2 * chd;
        const b2 = base * bWD * bC2 * bHS * bDtA * bOoC * bAmp;
        return (b2 * mag) / cycleTime;
    }
    function calcWithCHD(add){
        const chd2 = chd + add/100;
        const bC2 = 1 + chc * chd2;
        const b2 = base * bWD * bC2 * bHS * bDtA * bOoC * bAmp;
        return (b2 * mag) / cycleTime;
    }
    function calcWithHSD(add){
        const hsd2 = hsd + add/100;
        const bH2 = 1 + hsRate * hsd2;
        const b2 = base * bWD * bCrit * bH2 * bDtA * bOoC * bAmp;
        return (b2 * mag) / cycleTime;
    }
    function calcWithMult(field, add){
        const dta2 = field==="dta"?dta+add/100:dta;
        const ooc2 = field==="ooc"?ooc+add/100:ooc;
        const amp2 = field==="amp"?amp+add/100:amp;
        const b2 = base * bWD * bCrit * bHS * (1+dta2) * (1+ooc2) * (1+amp2);
        return (b2 * mag) / cycleTime;
    }
}

// Auto-calc on any input change
document.querySelectorAll("#dps-panel input").forEach(el=>el.addEventListener("input",calcDPS));

// ===== BUILD CALCULATOR =====
// Full weapon database — base + exotic + named (named auto-generated from N[] at init)
// Damage values: exact from Teriyaki calculator (div2-gear-calc v1.7.4 April 2026)
const WPNS_BASE = D2DATA.WPNS_BASE;

// Exotic weapons — stats from Teriyaki v1.7.4, mechanics preserved from our hand-tuned values
const EXOTIC_WPNS = D2DATA.EXOTIC_WPNS;

// WPNS — runtime-built: base + exotics + named. Auto-populated by initWpnDb()
let WPNS={};
let WPNS_LIST=[];

function initWpnDb(){
  WPNS={};WPNS_LIST=[];
  // Base weapons: map type→cat и сгенерить id если нет
  const TYPE_TO_CAT={"AR":"AR","SMG":"SMG","LMG":"LMG","MMR":"MMR","Rifle":"Rifle","Shotgun":"SG","SG":"SG","Pistol":"Pistol"};
  WPNS_BASE.forEach(w=>{
    const cat=w.cat||TYPE_TO_CAT[w.type]||"AR";
    const id=w.id||("base_"+(w.name||"unknown").toLowerCase().replace(/[^a-z0-9]+/g,"_"));
    const full={...w,id,cat,kind:"base",tal:"—",tal_type:"none"};
    WPNS[id]=full;
    WPNS_LIST.push(full);
  });
  // Exotics from E[]
  const E_CAT={"Штурмовые винтовки":"AR","Пистолеты-пулемёты":"SMG","Ручные пулемёты":"LMG","Дробовики":"SG","Снайперские винтовки":"MMR","Винтовки":"Rifle","Пистолеты":"Pistol"};
  E.forEach(e=>{
    const cat=E_CAT[e.g];if(!cat)return;
    const ex=EXOTIC_WPNS[e.name];
    const stats=ex||{cat,dmg:cat==="MMR"?600000:cat==="LMG"?115000:cat==="SG"?250000:cat==="Rifle"?180000:cat==="Pistol"?80000:cat==="SMG"?34000:48000,rpm:cat==="MMR"?180:cat==="LMG"?600:cat==="SG"?100:cat==="Rifle"?240:cat==="Pistol"?300:cat==="SMG"?850:790,mag:cat==="MMR"?15:cat==="LMG"?100:cat==="SG"?8:cat==="Rifle"?20:cat==="Pistol"?10:cat==="SMG"?30:30,reload:cat==="MMR"?3.0:cat==="LMG"?5.0:cat==="SG"?3.5:cat==="Rifle"?2.5:cat==="Pistol"?2.3:cat==="SMG"?2.1:2.0};
    const id="exotic_"+e.en.toLowerCase().replace(/[^a-z0-9]+/g,"_");
    const full={id,name:e.name,en:e.en,cat:stats.cat,dmg:stats.dmg,rpm:stats.rpm,mag:stats.mag,reload:stats.reload,kind:"exotic",tal:e.tal,tal_desc:e.d,tal_type:stats.tal_type||"none",tal_bonus:stats.tal_bonus,tal_max:stats.tal_max};
    WPNS[id]=full;
    WPNS_LIST.push(full);
  });
  // Named from N[] — inherit stats from base weapon by parsing t:"AR (Police M4)"
  const N_CAT={"Штурмовые винтовки":"AR","Пистолеты-пулемёты":"SMG","Ручные пулемёты":"LMG","Дробовики":"SG","Снайперские винтовки":"MMR","Винтовки":"Rifle","Пистолеты":"Pistol"};
  const baseByName={};
  WPNS_BASE.forEach(b=>{baseByName[b.name.toLowerCase()]=b});
  N.forEach(n=>{
    const cat=N_CAT[n.g];if(!cat)return;
    const m=/\(([^)]+)\)/.exec(n.t||"");
    const baseName=m?m[1].trim():"";
    let baseStats=null;
    if(baseName){
      const k=Object.keys(baseByName).find(k=>k===baseName.toLowerCase()||k.includes(baseName.toLowerCase())||baseName.toLowerCase().includes(k));
      if(k)baseStats=baseByName[k];
    }
    if(!baseStats){
      baseStats=WPNS_BASE.find(b=>b.cat===cat)||WPNS_BASE[0];
    }
    const tb=talentBonus(n.tal);
    const idSrc=(n.en||n.name||"unknown").toString().toLowerCase();
    const id="named_"+idSrc.replace(/[^a-z0-9]+/g,"_");
    const full={id,name:n.name,en:n.en||n.name,cat:baseStats.cat,dmg:baseStats.dmg,rpm:baseStats.rpm,mag:baseStats.mag,reload:baseStats.reload,base:baseName||baseStats.name,kind:"named",tal:n.tal,tal_desc:n.d,tal_type:"none",named_bonus:tb};
    WPNS[id]=full;
    WPNS_LIST.push(full);
  });
  // Custom (user inputs)
  WPNS.custom={id:"custom",name:"Своё оружие",cat:"AR",dmg:60000,rpm:750,mag:30,reload:2.0,kind:"custom",tal:"",tal_type:"none"};
}

// Set bonus definitions — DPS-relevant math for all 26 sets
// Bonus keys used by math: rof, mag, chc, chd, hsd, wd, reload, type_dmg+type, handling(display)
// p4 can be: object (flat bonus), "stacks" (uses stacks{}), or a tag string (shown as note only)
const SB = D2DATA.SB;

// ===== SLOT/ITEM SYSTEM =====
const SLOT_META = D2DATA.SLOT_META;

// Talent math: parsed bonuses for known named talents
// Conditional talents have "conditional:true" — applied only at peak, not base
const TALENT_MATH = D2DATA.TALENT_MATH;

function talentBonus(talentName){
  if(!talentName)return null;
  // normalize: strip "Perfect" vs "Perfectly"
  const k=Object.keys(TALENT_MATH).find(t=>t.toLowerCase()===talentName.toLowerCase());
  return k?TALENT_MATH[k]:null;
}

// Database of items per armor slot
const ITEMS_BY_SLOT={};
const GENRE_ALIASES={
  "Маски":["Маски","Маска"],
  "Нагрудники":["Нагрудники","Нагрудник","Броня","Бронежилет","Бронежилеты"],
  "Рюкзаки":["Рюкзаки","Рюкзак"],
  "Перчатки":["Перчатки"],
  "Кобуры":["Кобуры","Кобура"],
  "Наколенники":["Наколенники","Наколенник"]
};
function matchGenre(g,target){
  if(!g)return false;
  const list=GENRE_ALIASES[target]||[target];
  return list.includes(g);
}
function buildItemDb(){
  for(const slot of Object.keys(SLOT_META)){
    const genre=SLOT_META[slot].genre;
    const arr=[];
    // greens: one entry per set
    G.forEach(g=>arr.push({kind:"green",name:g.name+" — "+genre,en:g.en,setName:g.name,color:g.type==="red"?"#ef5350":g.type==="blue"?"#42a5f5":g.type==="yellow"?"#fdd835":"#ce93d8",bonuses:g.bonuses,slot}));
    // brands: one entry per brand per slot
    B.forEach(b=>arr.push({kind:"brand",name:b.name+" — "+genre,brand:b.name,bonuses:b.bonuses,slot}));
    // named items for this slot
    N.filter(n=>matchGenre(n.g,genre)).forEach(n=>{
      const tb=talentBonus(n.tal);
      arr.push({kind:"named",name:n.name,en:n.en,brand:n.brand,talent:n.tal,talentDesc:n.d,talentBonus:tb,slot,core:n.core,attr1:n.attr1,attr2:n.attr2,bonus_ru:n.bonus_ru,bonus_short_en:n.bonus_short_en});
    });
    // exotics
    E.filter(e=>matchGenre(e.g,genre)).forEach(e=>{
      arr.push({kind:"exotic",name:e.name,en:e.en,talent:e.tal,talentDesc:e.d,slot,core:e.core,attr1:e.attr1,attr2:e.attr2,bonus_ru:e.bonus_ru});
    });
    ITEMS_BY_SLOT[slot]=arr;
  }
}

const slotState={mask:null,chest:null,bp:null,gloves:null,holster:null,knees:null};
let curSlot=null;
let modFilter="all";

function openSlot(slot){
  curSlot=slot;
  document.getElementById("mod-title").textContent="Выбор: "+SLOT_META[slot].label;
  document.getElementById("mod-s1").value="";
  document.getElementById("mod-s2").value="";
  modFilter="all";
  document.querySelectorAll("#mod-filters .mf-btn").forEach(b=>b.classList.toggle("on",b.dataset.k==="all"));
  document.getElementById("slot-modal").classList.add("open");
  renderSlotItems();
  setTimeout(()=>document.getElementById("mod-s1").focus(),50);
}
function closeSlotModal(){
  document.getElementById("slot-modal").classList.remove("open");
  curSlot=null;
}
function matchQ(txt,qs){return qs.every(q=>!q||txt.includes(q))}
function renderSlotItems(){
  if(!curSlot)return;
  const items=ITEMS_BY_SLOT[curSlot]||[];
  const q1=document.getElementById("mod-s1").value.toLowerCase().trim();
  const q2=document.getElementById("mod-s2").value.toLowerCase().trim();
  const qs=[q1,q2].filter(x=>x);
  const filtered=items.filter(it=>{
    if(modFilter!=="all"&&it.kind!==modFilter)return false;
    if(!qs.length)return true;
    const parts=[it.name,it.en||"",it.brand||"",it.setName||"",it.talent||"",it.talentDesc||"",(it.bonuses||[]).join(" ")].join(" ").toLowerCase();
    return qs.every(q=>q.split(/\s+/).every(w=>parts.includes(w)));
  });
  const html=filtered.slice(0,200).map((it,i)=>{
    const globalIdx=items.indexOf(it);
    const tagClass=it.kind==="green"?"b-gear":it.kind==="named"?"b-named":it.kind==="exotic"?"b-exotic":"b-brand";
    const tagLbl=it.kind==="green"?"Сет":it.kind==="brand"?"Бренд":it.kind==="named"?"Именной":"Экзотик";
    let body="";
    if(it.kind==="green"){
      body=`<div class="mi-desc">${(it.bonuses||[]).slice(0,3).join(" · ")}</div>`;
    }else if(it.kind==="brand"){
      body=`<div class="mi-desc">${(it.bonuses||[]).join(" · ")}</div>`;
    }else if(it.kind==="named"){
      const mathStr=it.talentBonus?Object.entries(it.talentBonus).filter(([k])=>!["note","conditional","static"].includes(k)).map(([k,v])=>`+${v}% ${k}`).join(" "):"";
      const coreVal=Array.isArray(it.core)?it.core[0]:it.core;
      const coreStr=coreVal?`<div class="mi-desc" style="color:#ff9800">Core: ${translateStat(coreVal)}</div>`:"";
      const attr1Str=it.attr1?Object.entries(it.attr1).map(([k,v])=>`+${v}% ${translateStat(k)}`).join(", "):"";
      const attr2Str=it.attr2?Object.entries(it.attr2).map(([k,v])=>`+${v}% ${translateStat(k)}`).join(", "):"";
      const attrsStr=[attr1Str,attr2Str].filter(x=>x).join(" · ");
      const bonusStr=it.bonus_ru?`<div class="mi-desc" style="color:#ff9800;font-weight:600">★ ${it.bonus_ru}</div>`:"";
      const talLocal=talentName(it.talent);
      const talStr=it.talent?`<div class="mi-tal">${talLocal}${it.brand?" · <span style=\"color:var(--blue)\">"+it.brand+"</span>":""}</div>`:(it.brand?`<div class="mi-tal" style="color:var(--blue)">${it.brand}</div>`:"");
      body=`${talStr}
            ${it.talentDesc?`<div class="mi-desc">${it.talentDesc}</div>`:""}
            ${bonusStr}
            ${coreStr}
            ${attrsStr?`<div class="mi-desc" style="color:#4caf50">${attrsStr}</div>`:""}
            ${mathStr?`<div class="mi-math">→ ${mathStr}${it.talentBonus&&it.talentBonus.conditional?" (условно)":""}</div>`:""}`;
    }else if(it.kind==="exotic"){
      const coreVal=Array.isArray(it.core)?it.core[0]:it.core;
      const coreStr=coreVal?`<div class="mi-desc" style="color:#ff9800">Core: ${translateStat(coreVal)}</div>`:"";
      const bonusStr=it.bonus_ru?`<div class="mi-desc" style="color:#ff9800;font-weight:600">★ ${it.bonus_ru}</div>`:"";
      body=`<div class="mi-tal">${talentName(it.talent)||""}</div>
            ${it.talentDesc?`<div class="mi-desc">${it.talentDesc}</div>`:""}
            ${bonusStr}${coreStr}`;
    }else{
      body=`<div class="mi-tal">${talentName(it.talent)||""}</div><div class="mi-desc">${it.talentDesc||""}</div>`;
    }
    return`<div class="mitem" onclick="pickItem(${globalIdx})">
      <div class="mi-h">
        <div><span class="mi-n ${it.kind}">${it.name}</span>${wikiIcon(it.en||it.brand||it.setName)} ${it.en?`<span class="mi-en">${it.en}</span>`:""}</div>
        <span class="badge ${tagClass}">${tagLbl}</span>
      </div>
      ${body}
    </div>`;
  }).join("");
  document.getElementById("mod-list").innerHTML=html||'<div style="padding:20px;text-align:center;color:var(--muted);font-size:12px">Ничего не найдено</div>';
}
function pickItem(idx){
  if(!curSlot)return;
  const item=ITEMS_BY_SLOT[curSlot][idx];
  slotState[curSlot]=item;
  updateSlotBtn(curSlot);
  closeSlotModal();
  calcBuild();
}
function clearSlot(ev,slot){
  ev.stopPropagation();
  slotState[slot]=null;
  updateSlotBtn(slot);
  calcBuild();
}
function updateSlotBtn(slot){
  const el=document.getElementById("bs-"+slot);
  const it=slotState[slot];
  el.className="slot-btn"+(it?" filled "+it.kind:"");
  if(!it){el.innerHTML='<span class="ss">— пусто —</span>';return}
  const talLocal=it.talent?talentName(it.talent):"";
  const sub=it.kind==="green"?it.setName:it.kind==="brand"?it.brand:it.kind==="named"?(it.brand||"")+" · "+talLocal:(talLocal||"Экзотик");
  el.innerHTML=`<span class="sn ${it.kind}">${it.name}</span><span class="ss">${sub}</span>`+
    `<span class="clr" onclick="clearSlot(event,'${slot}')">×</span>`;
}
// Modal filter clicks
document.addEventListener("click",function(e){
  const b=e.target.closest("#mod-filters .mf-btn");
  if(!b)return;
  modFilter=b.dataset.k;
  document.querySelectorAll("#mod-filters .mf-btn").forEach(x=>x.classList.toggle("on",x===b));
  renderSlotItems();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeSlotModal()});

function initBuildSlots(){
  initWpnDb();
  buildItemDb();
  Object.keys(slotState).forEach(updateSlotBtn);
  updateWpnBtn();
  // Populate weapon talent select
  const talSel=document.getElementById("b-wpn-tal");
  if(talSel){
    talSel.innerHTML='<option value="none">— нет —</option>'+Object.entries(WEAPON_TALENTS_FULL).map(([k,v])=>{const label=currentLang==='en'?(v.name_en||v.name_ru):(v.name_ru||v.name_en);return`<option value="${k}">${label}</option>`}).join("");
    talSel.value=selectedWpnTalent;
  }
  // Populate Prototype Augment selects
  const augOpts='<option value="">— нет —</option>'+Object.entries(PROTOTYPE_AUGMENTS).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join("");
  for(let i=1;i<=3;i++){
    const el=document.getElementById(`proto-${i}-aug`);
    if(el)el.innerHTML=augOpts;
  }
  refreshSavedList();
  // Try to restore build from URL hash or last localStorage session
  const fromHash=buildFromHash();
  if(fromHash){applyBuildState(fromHash);showShareStatus("Билд загружен из ссылки",2500)}
  else{
    const last=localStorage.getItem("d2calc_last");
    if(last){try{applyBuildState(JSON.parse(last))}catch(e){}}
  }
}

function onWpnTalentChange(){
  selectedWpnTalent=document.getElementById("b-wpn-tal").value;
  const t=WEAPON_TALENTS_FULL[selectedWpnTalent];
  const desc=document.getElementById("b-wpn-tal-desc");
  if(desc)desc.textContent=t?.desc_ru||t?.desc_en||"";
  calcBuild();
}

function initGearTalentSelects(){
  const chestSel=document.getElementById("b-chest-talent");
  const bpSel=document.getElementById("b-bp-talent");
  if(!chestSel||!bpSel)return;
  const fill=(sel,slot)=>{
    const en=currentLang==='en';
    const talents=GEAR_TALENTS.filter(t=>t.slot===slot).sort((a,b)=>(en?(a.name_en||a.name_ru):(a.name_ru||a.name_en||"")).localeCompare(en?(b.name_en||b.name_ru):(b.name_ru||b.name_en||"")));
    const og=document.createElement("optgroup");og.label=en?"Regular":"Обычные";
    const pg=document.createElement("optgroup");pg.label=en?"Perfect":"Совершенные";
    for(const t of talents){
      const key=t.id||t.name_en;
      const setSuffix=t.set?` (${t.set})`:"";
      const baseName=en?(t.name_en||t.name_ru):(t.name_ru||t.name_en);
      const oReg=document.createElement("option");
      oReg.value=key;
      oReg.textContent=baseName+setSuffix;
      og.appendChild(oReg);
      const perfName=en?(t.perfect_name_en||`Perfect ${baseName}`):(t.perfect_name_ru||`${baseName} (идеальный)`);
      const oPerf=document.createElement("option");
      oPerf.value="perfect:"+key;
      oPerf.textContent=perfName+setSuffix;
      pg.appendChild(oPerf);
    }
    sel.appendChild(og);
    sel.appendChild(pg);
  };
  fill(chestSel,"chest");
  fill(bpSel,"backpack");
}

function onChestTalentChange(){
  const id=document.getElementById("b-chest-talent").value;
  const desc=document.getElementById("b-chest-talent-desc");
  if(!desc)return;
  if(!id){desc.textContent="";return;}
  const isPerfect=id.startsWith("perfect:");
  const baseId=isPerfect?id.slice(8):id;
  const t=GEAR_TALENTS.find(x=>(x.id||x.name_en)===baseId);
  if(t){
    const prefix=isPerfect?"⭐ СОВЕРШЕННЫЙ — ":"";
    desc.textContent=prefix+(t.desc_ru||t.description||"");
  }
}

function onBpTalentChange(){
  const id=document.getElementById("b-bp-talent").value;
  const desc=document.getElementById("b-bp-talent-desc");
  if(!desc)return;
  if(!id){desc.textContent="";return;}
  const isPerfect=id.startsWith("perfect:");
  const baseId=isPerfect?id.slice(8):id;
  const t=GEAR_TALENTS.find(x=>(x.id||x.name_en)===baseId);
  if(t){
    const prefix=isPerfect?"⭐ СОВЕРШЕННЫЙ — ":"";
    desc.textContent=prefix+(t.desc_ru||t.description||"");
  }
}

// ===== BUILD STATE =====
function getBuildState(){
  const slots={};
  for(const[s,it] of Object.entries(slotState)){
    if(!it){slots[s]=null;continue}
    slots[s]={k:it.kind,n:it.kind==="green"?it.setName:it.kind==="brand"?it.brand:(it.en||it.name)};
  }
  return{
    wpn:selectedWpnId,
    wpnTal:selectedWpnTalent,
    cw:{dmg:v("cw-dmg"),rpm:v("cw-rpm"),mag:v("cw-mag"),rel:parseFloat(document.getElementById("cw-rel")?.value)||2,cat:document.getElementById("cw-cat")?.value||"AR"},
    slots,
    b:{chc:v("b-chc"),chd:v("b-chd"),hsd:v("b-hsd"),hsrate:v("b-hsrate"),ooc:v("b-ooc"),dta:v("b-dta"),wd:v("b-wd"),reload:v("b-reload"),rof:v("b-rof"),mag:v("b-mag"),amp:v("b-amp"),expertise:v("b-expertise"),"wd-ar":v("b-wd-ar"),"wd-smg":v("b-wd-smg"),"wd-lmg":v("b-wd-lmg"),"wd-mmr":v("b-wd-mmr"),"wd-rifle":v("b-wd-rifle"),"wd-sg":v("b-wd-sg"),"wd-pistol":v("b-wd-pistol")},
    core:{mode:document.getElementById("b-core-mode")?.value||"red",mask:document.getElementById("b-core-mask")?.value||"red",chest:document.getElementById("b-core-chest")?.value||"red",bp:document.getElementById("b-core-bp")?.value||"red",gloves:document.getElementById("b-core-gloves")?.value||"red",holster:document.getElementById("b-core-holster")?.value||"red",knees:document.getElementById("b-core-knees")?.value||"red"},
    shd:{wd:v("shd-wd"),hsd:v("shd-hsd"),chc:v("shd-chc"),chd:v("shd-chd"),ammo:v("shd-ammo")},
    rc:{hsd:v("rc-hsd"),ammo:v("rc-ammo"),ergo:v("rc-ergo"),armor:v("rc-armor"),elite:v("rc-elite"),hazprot:v("rc-hazprot"),status:v("rc-status"),skilldmg:v("rc-skilldmg"),util3:v("rc-util3")},
    ttk:{diff:ttkDiff,hp:v("ttk-hp-mult"),ar:v("ttk-ar-mult")},
    chestTal:document.getElementById("b-chest-talent")?.value||"",
    bpTal:document.getElementById("b-bp-talent")?.value||"",
  };
}

function applyBuildState(s){
  if(!s)return;
  // Weapon
  if(s.wpn&&WPNS[s.wpn]){selectedWpnId=s.wpn;updateWpnBtn()}
  if(s.wpnTal&&(s.wpnTal==="none"||WEAPON_TALENTS_FULL[s.wpnTal])){
    selectedWpnTalent=s.wpnTal;
    const el=document.getElementById("b-wpn-tal");if(el)el.value=s.wpnTal;
  }
  // Custom weapon inputs
  if(s.cw){
    setInput("cw-dmg",s.cw.dmg);setInput("cw-rpm",s.cw.rpm);
    setInput("cw-mag",s.cw.mag);setInput("cw-rel",s.cw.rel);
    const cat=document.getElementById("cw-cat");if(cat&&s.cw.cat)cat.value=s.cw.cat;
  }
  // Slots
  for(const[slot,st] of Object.entries(s.slots||{})){
    if(!st){slotState[slot]=null;updateSlotBtn(slot);continue}
    const items=ITEMS_BY_SLOT[slot]||[];
    const match=items.find(it=>{
      if(it.kind!==st.k)return false;
      if(st.k==="green")return it.setName===st.n;
      if(st.k==="brand")return it.brand===st.n;
      return it.en===st.n||it.name===st.n;
    });
    slotState[slot]=match||null;
    updateSlotBtn(slot);
  }
  // Manual stats
  ["chc","chd","hsd","hsrate","ooc","dta","wd","reload","rof","mag","amp","expertise","wd-ar","wd-smg","wd-lmg","wd-mmr","wd-rifle","wd-sg","wd-pistol"].forEach(k=>{if(s.b&&s.b[k]!==undefined)setInput("b-"+k,s.b[k])});
  if(s.core){
    const modeSel=document.getElementById("b-core-mode");
    if(modeSel&&s.core.mode)modeSel.value=s.core.mode;
    ["mask","chest","bp","gloves","holster","knees"].forEach(slot=>{
      const el=document.getElementById("b-core-"+slot);
      if(el&&s.core[slot])el.value=s.core[slot];
    });
    const box=document.getElementById("b-core-custom");
    if(box)box.style.display=(s.core.mode==="custom")?"block":"none";
  }
  ["wd","hsd","chc","chd","ammo"].forEach(k=>{if(s.shd&&s.shd[k]!==undefined)setInput("shd-"+k,s.shd[k])});
  ["hsd","ammo","ergo","armor","elite","hazprot","status","skilldmg","util3"].forEach(k=>{if(s.rc&&s.rc[k]!==undefined)setInput("rc-"+k,s.rc[k])});
  if(s.ttk){
    if(s.ttk.diff)setTtkDiff(s.ttk.diff);
    setInput("ttk-hp-mult",s.ttk.hp);setInput("ttk-ar-mult",s.ttk.ar);
  }
  if(s.chestTal){
    const el=document.getElementById("b-chest-talent");
    if(el){el.value=s.chestTal;onChestTalentChange();}
  }
  if(s.bpTal){
    const el=document.getElementById("b-bp-talent");
    if(el){el.value=s.bpTal;onBpTalentChange();}
  }
  calcBuild();
}
function setInput(id,val){const el=document.getElementById(id);if(el&&val!==undefined&&val!==null)el.value=val}

function onCoreModeChange(){
  const mode=document.getElementById("b-core-mode")?.value||"red";
  const box=document.getElementById("b-core-custom");
  if(box)box.style.display=mode==="custom"?"block":"none";
  calcBuild();
}

// ===== URL SHARING =====
function buildToHash(){
  try{
    const s=JSON.stringify(getBuildState());
    return "#b="+btoa(unescape(encodeURIComponent(s)));
  }catch(e){return""}
}
function buildFromHash(){
  const m=/^#b=(.+)$/.exec(location.hash);
  if(!m)return null;
  try{return JSON.parse(decodeURIComponent(escape(atob(m[1]))))}catch(e){return null}
}
function shareBuild(){
  const hash=buildToHash();
  if(!hash){showShareStatus("Ошибка кодирования",3000);return}
  const url=location.origin+location.pathname+hash;
  if(navigator.clipboard){
    navigator.clipboard.writeText(url).then(
      ()=>showShareStatus("Ссылка скопирована: "+url.slice(0,60)+"...",4000),
      ()=>fallbackCopy(url)
    );
  }else fallbackCopy(url);
  history.replaceState(null,"",hash);
}
async function exportBuildAsPng(){
  const area=document.getElementById("build-export-area")||document.getElementById("build-panel");
  if(!area){alert("Панель билда не найдена");return}
  if(typeof html2canvas==="undefined"){alert("html2canvas не загружен");return}
  document.body.classList.add("capturing");
  try{
    const canvas=await html2canvas(area,{backgroundColor:"#121212",scale:2,useCORS:true,logging:false});
    const link=document.createElement("a");
    const wpn=(getWeapon()||{}).name||"build";
    const safe=String(wpn).replace(/[^A-Za-z0-9а-яА-Я_\-]+/g,"_").slice(0,40);
    link.download=`divcalc-build-${safe}-${Date.now()}.png`;
    link.href=canvas.toDataURL("image/png");
    document.body.appendChild(link);link.click();document.body.removeChild(link);
    showShareStatus("Картинка сохранена",3000);
  }catch(e){alert("Ошибка экспорта: "+(e&&e.message?e.message:e));}
  finally{document.body.classList.remove("capturing");}
}
function fallbackCopy(txt){
  const ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);
  ta.select();try{document.execCommand("copy");showShareStatus("Ссылка скопирована",3000)}catch(e){showShareStatus("Скопируй вручную: "+txt,8000)}
  document.body.removeChild(ta);
}
function showShareStatus(msg,ms){
  const el=document.getElementById("b-share-status");
  if(!el)return;el.textContent=msg;
  if(ms)setTimeout(()=>{if(el.textContent===msg)el.textContent=""},ms);
}

// ===== SAVED BUILDS (localStorage) =====
const BUILDS_KEY="d2calc_builds_v1";
function getSavedBuilds(){
  try{return JSON.parse(localStorage.getItem(BUILDS_KEY)||"{}")}catch(e){return{}}
}
function refreshSavedList(){
  const sel=document.getElementById("b-saved");if(!sel)return;
  const all=getSavedBuilds();
  const names=Object.keys(all).sort();
  sel.innerHTML='<option value="">— '+(names.length?names.length+" сохранённых":"нет сохранённых")+' —</option>'+
    names.map(n=>`<option value="${n.replace(/"/g,'&quot;')}">${n}</option>`).join("");
}
function saveCurrentBuild(){
  const name=prompt("Название билда:","");
  if(!name)return;
  const all=getSavedBuilds();
  all[name]=getBuildState();
  localStorage.setItem(BUILDS_KEY,JSON.stringify(all));
  refreshSavedList();
  document.getElementById("b-saved").value=name;
  showShareStatus('Билд "'+name+'" сохранён',2500);
}
function loadSelectedBuild(){
  const name=document.getElementById("b-saved").value;
  if(!name){showShareStatus("Выбери билд из списка",2500);return}
  const all=getSavedBuilds();
  if(!all[name]){showShareStatus("Билд не найден",2500);return}
  applyBuildState(all[name]);
  showShareStatus('Загружен "'+name+'"',2500);
}
function deleteSelectedBuild(){
  const name=document.getElementById("b-saved").value;
  if(!name){showShareStatus("Выбери билд",2500);return}
  if(!confirm('Удалить "'+name+'"?'))return;
  const all=getSavedBuilds();
  delete all[name];
  localStorage.setItem(BUILDS_KEY,JSON.stringify(all));
  refreshSavedList();
  showShareStatus('Удалён "'+name+'"',2500);
}
function onSavedSelect(){}

function resetCurrentBuild(){
  if(!confirm("Сбросить все слоты, оружейный талант и статы? Это не затронет сохранённые билды."))return;
  // Reset all armor slots
  for(const slot of Object.keys(slotState)){
    slotState[slot]=null;
    updateSlotBtn(slot);
  }
  // Reset weapon talent
  selectedWpnTalent="none";
  const talSel=document.getElementById("b-wpn-tal");
  if(talSel)talSel.value="none";
  // Reset manual stats to defaults
  setInput("b-chc",0);setInput("b-chd",0);setInput("b-hsd",0);
  setInput("b-hsrate",0);setInput("b-ooc",0);setInput("b-dta",0);setInput("b-wd",0);
  setInput("b-reload",0);setInput("b-rof",0);setInput("b-mag",0);
  ["b-wd-ar","b-wd-smg","b-wd-lmg","b-wd-mmr","b-wd-rifle","b-wd-sg","b-wd-pistol"].forEach(id=>setInput(id,0));
  // Keep SHD at maxed defaults (пользователь просил)
  setInput("shd-wd",10);setInput("shd-hsd",20);setInput("shd-chc",10);setInput("shd-chd",20);setInput("shd-ammo",0);
  // Recombinator back to zeros
  ["rc-hsd","rc-ammo","rc-ergo","rc-armor","rc-elite","rc-hazprot","rc-status","rc-skilldmg","rc-util3"].forEach(id=>setInput(id,0));
  // TTK multipliers
  setInput("ttk-hp-mult",0);setInput("ttk-ar-mult",0);
  calcBuild();
  showShareStatus("Билд сброшен",2000);
}

// ===== COMMUNITY (PocketBase backend) =====
const PB_BASE=(location.hostname==="divcalc.xyz"||location.hostname==="www.divcalc.xyz")
  ? location.origin
  : "https://divcalc.xyz";
const PB_API=PB_BASE+"/api/collections";

// ===== AUTH =====
const AUTH_KEY="d2calc_auth_v1";
let currentUser=null;

function saveAuth(auth){
  localStorage.setItem(AUTH_KEY,JSON.stringify(auth));
  currentUser=auth;
  updateAuthUI();
}
function loadAuth(){
  try{
    const a=JSON.parse(localStorage.getItem(AUTH_KEY)||"null");
    if(a&&a.token)currentUser=a;
  }catch(e){}
  updateAuthUI();
}
function logoutUser(){
  localStorage.removeItem(AUTH_KEY);
  currentUser=null;
  hideAuthDropdown();
  updateAuthUI();
}
async function loginUser(email,password){
  const r=await fetch(`${PB_BASE}/api/collections/users/auth-with-password`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({identity:email,password})
  });
  if(!r.ok){
    let msg="Login failed";
    try{const j=await r.json();msg=j.message||msg;}catch(e){}
    throw new Error(msg);
  }
  const data=await r.json();
  saveAuth({
    id:data.record.id,
    email:data.record.email,
    username:data.record.username||(data.record.email||"").split("@")[0],
    token:data.token
  });
}
async function registerUser(email,password,username){
  const r=await fetch(`${PB_BASE}/api/collections/users/records`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email,password,passwordConfirm:password,username,emailVisibility:false})
  });
  if(!r.ok){
    let msg="Registration failed";
    try{const j=await r.json();msg=j.message||msg;if(j.data){const keys=Object.keys(j.data);if(keys.length){const first=j.data[keys[0]];msg=`${keys[0]}: ${(first&&first.message)||msg}`;}}}catch(e){}
    throw new Error(msg);
  }
  await loginUser(email,password);
}
function updateAuthUI(){
  const btn=document.getElementById("auth-btn");
  if(!btn)return;
  if(currentUser){
    btn.innerHTML=`👤 ${escapeHtml(currentUser.username||"user")}`;
    btn.onclick=toggleAuthDropdown;
  }else{
    btn.innerHTML="👤 Войти";
    btn.onclick=openAuthModal;
    hideAuthDropdown();
  }
}
function toggleAuthDropdown(){
  const dd=document.getElementById("auth-dropdown");
  if(!dd)return;
  dd.style.display=dd.style.display==="block"?"none":"block";
}
function hideAuthDropdown(){
  const dd=document.getElementById("auth-dropdown");
  if(dd)dd.style.display="none";
}
document.addEventListener("click",(e)=>{
  const wrap=document.getElementById("auth-wrap");
  if(wrap&&!wrap.contains(e.target))hideAuthDropdown();
});

function openAuthModal(){
  const m=document.getElementById("auth-modal");
  if(!m)return;
  m.classList.add("open");
  switchAuthTab("login");
  const s1=document.getElementById("auth-login-status");if(s1){s1.textContent="";s1.className="bug-status";}
  const s2=document.getElementById("auth-register-status");if(s2){s2.textContent="";s2.className="bug-status";}
}
function closeAuthModal(){
  const m=document.getElementById("auth-modal");
  if(m)m.classList.remove("open");
}
function switchAuthTab(tab){
  const tl=document.getElementById("auth-tab-login");
  const tr=document.getElementById("auth-tab-register");
  const fl=document.getElementById("auth-login-form");
  const fr=document.getElementById("auth-register-form");
  const title=document.getElementById("auth-modal-title");
  const isLogin=tab==="login";
  if(tl)tl.classList.toggle("on",isLogin);
  if(tr)tr.classList.toggle("on",!isLogin);
  if(fl)fl.style.display=isLogin?"":"none";
  if(fr)fr.style.display=isLogin?"none":"";
  if(title)title.textContent=isLogin?"👤 Вход":"👤 Регистрация";
}
async function submitLogin(ev){
  ev.preventDefault();
  const f=ev.target;
  const btn=document.getElementById("auth-login-btn");
  const status=document.getElementById("auth-login-status");
  btn.disabled=true;btn.textContent="Вход...";
  status.className="bug-status";status.textContent="";
  try{
    await loginUser(f.email.value.trim(),f.password.value);
    status.className="bug-status ok";
    status.textContent="✓ Успешный вход";
    setTimeout(()=>{closeAuthModal();},800);
  }catch(e){
    status.className="bug-status err";
    status.textContent="Ошибка: "+e.message;
  }finally{
    btn.disabled=false;btn.textContent="Войти";
  }
}
async function submitRegister(ev){
  ev.preventDefault();
  const f=ev.target;
  const btn=document.getElementById("auth-register-btn");
  const status=document.getElementById("auth-register-status");
  status.className="bug-status";status.textContent="";
  if(f.password.value!==f.password_confirm.value){
    status.className="bug-status err";
    status.textContent="Пароли не совпадают";
    return;
  }
  btn.disabled=true;btn.textContent="Регистрация...";
  try{
    await registerUser(f.email.value.trim(),f.password.value,f.username.value.trim());
    status.className="bug-status ok";
    status.textContent="✓ Аккаунт создан, вошёл";
    setTimeout(()=>{closeAuthModal();},800);
  }catch(e){
    status.className="bug-status err";
    status.textContent="Ошибка: "+e.message;
  }finally{
    btn.disabled=false;btn.textContent="Зарегистрироваться";
  }
}
function openMyBuilds(){
  hideAuthDropdown();
  const commBtn=document.querySelector('.cat-btn[data-cat="community"]');
  if(commBtn)commBtn.click();
  const scope=document.getElementById("comm-scope");
  if(scope){scope.value="mine";if(typeof loadCommunityFeed==="function")loadCommunityFeed();}
}
document.addEventListener("DOMContentLoaded",loadAuth);

// Stable per-browser fingerprint for anti-spam likes
function getFingerprint(){
  let fp=localStorage.getItem("d2calc_fp_v1");
  if(!fp){
    fp=(crypto&&crypto.randomUUID)?crypto.randomUUID():("fp-"+Date.now()+"-"+Math.random().toString(36).slice(2,10));
    localStorage.setItem("d2calc_fp_v1",fp);
  }
  return fp;
}
function getLikedSet(){
  try{return new Set(JSON.parse(localStorage.getItem("d2calc_liked_v1")||"[]"))}catch(e){return new Set()}
}
function saveLikedSet(set){
  localStorage.setItem("d2calc_liked_v1",JSON.stringify(Array.from(set)));
}
function fmtAgo(iso){
  if(!iso)return "";
  const d=new Date(iso);
  const diff=(Date.now()-d.getTime())/1000;
  if(diff<60)return "только что";
  if(diff<3600)return Math.floor(diff/60)+"мин назад";
  if(diff<86400)return Math.floor(diff/3600)+"ч назад";
  if(diff<86400*7)return Math.floor(diff/86400)+"д назад";
  return d.toLocaleDateString("ru");
}
function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let commReloadTimer=null;
function debouncedCommReload(){
  clearTimeout(commReloadTimer);
  commReloadTimer=setTimeout(loadCommunityFeed,350);
}
function initCommTalentFilter(){
  const sel=document.getElementById("comm-talent-filter");
  if(!sel||sel.options.length>1)return;
  Object.entries(WEAPON_TALENTS_FULL)
    .map(([k,v])=>({key:k,name:v.name_ru?`${v.name_ru} (${v.name_en})`:v.name_en}))
    .sort((a,b)=>a.name.localeCompare(b.name))
    .forEach(t=>{
      const opt=document.createElement("option");
      opt.value=t.key;
      opt.textContent=t.name;
      sel.appendChild(opt);
    });
}

async function loadCommunityFeed(){
  initCommTalentFilter();
  const listEl=document.getElementById("comm-list");
  const status=document.getElementById("comm-status");
  if(!listEl||!status)return;
  status.textContent="Загружаю...";
  status.style.color="var(--muted)";
  listEl.innerHTML="";
  const sort=document.getElementById("comm-sort").value||"-likes,-created";
  const isTrending=sort==="trending";
  const pbSort=isTrending?"-created":sort;
  const cat=document.getElementById("comm-cat-filter").value||"";
  const talentFilter=document.getElementById("comm-talent-filter")?.value||"";
  const scope=document.getElementById("comm-scope")?.value||"all";
  const search=(document.getElementById("comm-search")?.value||"").trim();
  const filters=[];
  if(cat)filters.push(`weapon_cat="${cat}"`);
  if(search){
    const safe=search.replace(/"/g,'\\"');
    filters.push(`(name~"${safe}" || author~"${safe}" || description~"${safe}" || weapon_name~"${safe}")`);
  }
  const url=`${PB_API}/builds/records?perPage=100&sort=${encodeURIComponent(pbSort)}${filters.length?"&filter="+encodeURIComponent(filters.join(" && ")):""}`;
  try{
    const r=await fetch(url);
    if(!r.ok)throw new Error("HTTP "+r.status);
    const j=await r.json();
    let items=j.items||[];
    if(isTrending){
      const now=Date.now();
      items=items.map(b=>{
        const hoursAge=(now-Date.parse(b.created))/3600000;
        return Object.assign({},b,{_trendScore:(b.likes||0)/Math.pow(hoursAge+2,1.5)});
      }).sort((a,b)=>b._trendScore-a._trendScore);
    }
    if(talentFilter){
      items=items.filter(b=>{
        if(!b._decoded){
          b._decoded=b.build_hash?decodeBuildHash(b.build_hash):null;
        }
        return b._decoded&&b._decoded.wpnTal===talentFilter;
      });
    }
    if(scope==="mine"){
      const mine=getMyBuilds();
      items=items.filter(b=>mine.has(b.id));
    }else if(scope==="liked"){
      const liked=getLikedSet();
      items=items.filter(b=>liked.has(b.id));
    }
    if(items.length===0){
      const msg={
        all:"Пока нет билдов в этой категории. Будь первым — жми 🚀 Опубликовать во вкладке BUILD!",
        mine:"Ты ещё ничего не публиковал. Собирай билд в BUILD и жми 🚀 Опубликовать.",
        liked:"Ты ещё ничего не лайкнул. Жми ❤ на понравившиеся билды.",
      };
      status.textContent=msg[scope]||msg.all;
      return;
    }
    let extraStats="";
    if(scope==="mine"){
      const totalLikes=items.reduce((a,b)=>a+(b.likes||0),0);
      const avgLikes=items.length?Math.round(totalLikes/items.length*10)/10:0;
      extraStats=` · Всего лайков: <b style="color:var(--red)">${totalLikes}</b> · В среднем: ${avgLikes}`;
    }else if(scope==="liked"){
      extraStats=` · Ты лайкнул ${items.length} билдов`;
    }
    status.innerHTML=`Найдено: <b>${items.length}</b>${scope==="all"?` (всего в базе: ${j.totalItems})`:""}${extraStats}`;
    const liked=getLikedSet();
    currentBuilds=items;
    listEl.innerHTML=items.map(b=>renderBuildCard(b,liked.has(b.id),isTrending)).join("");
  }catch(e){
    status.textContent="Ошибка загрузки: "+e.message+". Бэкенд PocketBase может быть недоступен.";
    status.style.color="var(--red)";
  }
}

let currentBuilds=[];
let compareList=[];

function toggleCompare(buildId,btn){
  const idx=compareList.findIndex(b=>b.id===buildId);
  if(idx>=0){
    compareList.splice(idx,1);
    btn.classList.remove("compared");
    if(compareList.length<2)hideComparison();
  }else{
    if(compareList.length>=2){
      const removed=compareList.shift();
      const old=document.querySelector(`.comm-card[data-id="${removed.id}"] .cc-like[onclick*="toggleCompare"]`);
      if(old)old.classList.remove("compared");
    }
    const build=currentBuilds.find(b=>b.id===buildId);
    if(!build)return;
    compareList.push(build);
    btn.classList.add("compared");
  }
  if(compareList.length===2)showComparison();
}

function hideComparison(){
  const panel=document.getElementById("compare-panel");
  if(panel)panel.style.display="none";
  compareList=[];
  document.querySelectorAll(".cc-like.compared").forEach(b=>b.classList.remove("compared"));
}

function decodeBuildHash(hash){
  try{return JSON.parse(decodeURIComponent(escape(atob(hash))))}catch(e){return null}
}

function getStatLabel(key){
  const ru={dmg:"База урона",rpm:"RPM",mag:"Магазин",rel:"Перезарядка",chc:"CHC",chd:"CHD",hsd:"HSD",wd:"WD",ooc:"OoC",dta:"DtA",hsrate:"% HS"};
  const en={dmg:"Base Damage",rpm:"RPM",mag:"Magazine",rel:"Reload",chc:"CHC",chd:"CHD",hsd:"HSD",wd:"WD",ooc:"OoC",dta:"DtA",hsrate:"HS rate"};
  return(currentLang==="en"?en:ru)[key]||key;
}

function formatStatVal(key,val){
  if(val===undefined||val===null||val==="")return"—";
  if(["chc","chd","hsd","wd","ooc","dta","hsrate"].includes(key))return val+"%";
  if(key==="rpm")return val+" rpm";
  if(key==="rel")return val+" сек";
  return String(val);
}

function makeDelta(v1,v2,higherBetter=true){
  const n1=parseFloat(v1),n2=parseFloat(v2);
  if(isNaN(n1)||isNaN(n2))return`<span class="compare-delta neutral">—</span>`;
  const d=n2-n1;
  if(d===0)return`<span class="compare-delta neutral">=</span>`;
  const better=(d>0)===higherBetter;
  const sign=d>0?"+":"";
  return`<span class="compare-delta ${better?"positive":"negative"}">${sign}${Math.round(d*10)/10}</span>`;
}

function showComparison(){
  const panel=document.getElementById("compare-panel");
  const grid=document.getElementById("compare-grid");
  if(!panel||!grid||compareList.length<2)return;
  const [b1,b2]=compareList;
  const s1=b1.build_hash?decodeBuildHash(b1.build_hash):null;
  const s2=b2.build_hash?decodeBuildHash(b2.build_hash):null;
  const dps1=b1.peak_dps||0;
  const dps2=b2.peak_dps||0;
  const dpsDelta=dps2-dps1;
  const dpsDeltaSign=dpsDelta>0?"+":"";
  const dpsDeltaCls=dpsDelta>0?"positive":dpsDelta<0?"negative":"neutral";
  const statKeys=["dmg","rpm","mag","rel","chc","chd","hsd","wd","ooc","dta"];
  function getStat(s,key){
    if(!s)return"";
    const cw=s.cw||{};
    const b=s.b||{};
    if(["dmg","rpm","mag","rel","cat"].includes(key))return cw[key]!==undefined?cw[key]:"";
    return b[key]!==undefined?b[key]:"";
  }
  function colHtml(b,s,align){
    const dps=b.peak_dps?`${Math.round(b.peak_dps/1000)}k`:"—";
    const rows=statKeys.map(k=>{
      const val=getStat(s,k);
      if(val===""||val===undefined)return"";
      return`<div class="compare-row"><span class="lbl">${getStatLabel(k)}</span><span class="val">${formatStatVal(k,val)}</span></div>`;
    }).join("");
    return`<div class="compare-col">
      <div class="compare-col-title">${escapeHtml(b.name)}</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:4px">${escapeHtml(b.author||"Аноним")} · ${escapeHtml(b.weapon_cat||"")}</div>
      ${b.weapon_name?`<div style="font-size:11px;color:var(--orange);margin-bottom:6px">🔫 ${escapeHtml(b.weapon_name)}</div>`:""}
      <div class="compare-dps-lbl">Пик DPS</div>
      <div class="compare-dps">${dps}</div>
      ${rows}
    </div>`;
  }
  const vsHtml=`<div class="compare-vs">
    <div style="font-size:11px;color:var(--muted);font-weight:700">VS</div>
    <div style="font-size:11px;color:var(--muted)">DPS δ</div>
    <span class="compare-delta ${dpsDeltaCls}" style="font-size:13px">${dpsDelta===0?"=":(dpsDeltaSign+Math.round(dpsDelta/1000*10)/10+"k")}</span>
    ${statKeys.map(k=>{
      const v1=getStat(s1,k),v2=getStat(s2,k);
      if((v1===""||v1===undefined)&&(v2===""||v2===undefined))return"";
      const lowerBetter=["rel"].includes(k);
      return makeDelta(v1,v2,!lowerBetter);
    }).filter(x=>x).join("")}
  </div>`;
  grid.innerHTML=colHtml(b1,s1,"left")+vsHtml+colHtml(b2,s2,"right");
  panel.style.display="block";
  panel.scrollIntoView({behavior:"smooth",block:"start"});
}

function isAdmin(){return !!localStorage.getItem("d2calc_admin_token")}
function getMyBuilds(){
  try{return new Set(JSON.parse(localStorage.getItem("d2calc_mine_v1")||"[]"))}catch(e){return new Set()}
}
// Legacy map для сохранённых билдов: старое имя → новое правильное
const SET_LEGACY_MAP = {
  "Боевое снаряжение Страйкера":"Боевик",
  "Разбиватель сердец":"Разбиватель Сердец",
  "Инициатива Умбра":"Umbra Initiative",
  "Ярость охотника":"Ярость Охотника",
  "Дилемма переговорщика":"Дилемма Переговорщика",
  "Горячий выстрел":"Горячая штучка",
  "Текущая директива":"Бессрочная Директива",
  "Истинный патриот":"Истинный Патриот",
  "Тузы и восьмёрки":"Восьмёрки и Тузы",
  "Остриё копья":"Остриё Копья",
  "Точка разрыва":"Переломная точка",
  "Переломный момент":"Tipping Scales",
  "Сосредоточенная компания":"Точка концентрации",
  "Оплот оружейни":"Сталелитейный Бастион",
  "Системное повреждение":"Коррупция в Системе",
  "Кавалерист":"Кавалер",
  "Протокол Затмения":"Протокол Затмение",
  "Будущая инициатива":"Инициатива Будущего",
  "Жёсткая проводка":"Спецпрограмма",
  "Ортис: Экзуро":"Экскуро",
  "Переработка":"Рефакторинг",
  "Взвешенная сборка":"Аккуратная сборка",
  "Стержневая сила":"Сила мышечного корсета"
};
function resolveSetName(n){ return SET_LEGACY_MAP[n]||n; }

// Локализация таланта: возвращает имя на текущем языке
function talentName(en){
  if(!en)return '';
  if(currentLang==='en')return en;
  try{
    const t = WEAPON_TALENTS_FULL&&Object.values(WEAPON_TALENTS_FULL).find(x=>x.name_en===en||x.perfect_name_en===en);
    if(t){
      if(t.perfect_name_en===en)return t.perfect_name_ru||en;
      return t.name_ru||en;
    }
  }catch(e){}
  try{
    if(typeof D2DATA!=='undefined'&&D2DATA.GEAR_TALENTS){
      const g = D2DATA.GEAR_TALENTS.find(x=>x.name_en===en);
      if(g&&g.name_ru)return g.name_ru;
    }
  }catch(e){}
  return en;
}
function talentDesc(enDesc, ruDesc){
  if(currentLang==='en')return enDesc||'';
  return ruDesc||enDesc||'';
}

// Короткие имена сетов (из официальной RU таблицы Ubisoft) — теперь идентичны полным
const SET_SHORT = {
  "Боевое снаряжение Страйкера":"Боевик",
  "Разбиватель сердец":"Разбиватель Сердец",
  "Инициатива Умбра":"Umbra",
  "Ярость охотника":"Ярость Охотника",
  "Дилемма переговорщика":"Переговорщик",
  "Горячий выстрел":"Горячая штучка",
  "Текущая директива":"Бессрочная Директива",
  "Истинный патриот":"Истинный Патриот",
  "Тузы и восьмёрки":"Восьмёрки и Тузы",
  "Остриё копья":"Остриё Копья",
  "Точка разрыва":"Переломная точка",
  "Виртуоз":"Виртуоз",
  "Переломный момент":"Tipping Scales",
  "Сосредоточенная компания":"Точка концентрации",
  "Оплот оружейни":"Сталелитейный Бастион",
  "Системное повреждение":"Коррупция в Системе",
  "Эгида":"Эгида",
  "Кавалерист":"Кавалер",
  "Такелажник":"Такелажник",
  "Протокол Затмения":"Протокол Затмение",
  "Будущая инициатива":"Инициатива Будущего",
  "Жёсткая проводка":"Спецпрограмма",
  "Ортис: Экзуро":"Экскуро",
  "Переработка":"Рефакторинг",
  "Взвешенная сборка":"Аккуратная сборка",
  "Стержневая сила":"Сила мышечного корсета"
};
function setShort(full){
  if(!full)return full;
  const clean=full.split(/\s*[—–\-]\s*/)[0].trim();
  return SET_SHORT[clean]||clean;
}

function renderCardSlotTags(b){
  if(!b.build_hash)return"";
  const dec=b._decoded||(b._decoded=decodeBuildHash(b.build_hash));
  if(!dec||!dec.slots)return"";
  const order=["mask","chest","bp","gloves","holster","knees"];
  const groups={};
  for(const slot of order){
    const s=dec.slots[slot];
    if(!s||!s.n)continue;
    let key,short;
    const k=s.k;
    if(k==="green"){
      short=setShort(s.n);
      key="set:"+short;
    }else if(k==="brand"){
      short=s.n;
      key="brand:"+short;
    }else if(k==="named"){
      short=s.n;
      key="named:"+slot+":"+short;
    }else if(k==="exotic"){
      short=s.n;
      key="exotic:"+slot+":"+short;
    }else continue;
    if(!groups[key])groups[key]={kind:k,short,count:0};
    groups[key].count++;
  }
  const list=Object.values(groups);
  if(!list.length)return"";
  list.sort((a,b)=>b.count-a.count);
  const tags=list.map(g=>{
    const cls=g.kind==="exotic"?"exotic":(g.kind==="named"?"named":(g.kind==="brand"?"brand":"set"));
    const icon=g.kind==="exotic"?"🧿 ":(g.kind==="named"?"✦ ":"");
    const count=g.count>1?` ×${g.count}`:"";
    return`<span class="cc-slot-tag ${cls}">${icon}${escapeHtml(g.short)}${count}</span>`;
  }).join("");
  return`<div class="cc-slots">${tags}</div>`;
}

function renderBuildCard(b,isLiked,showTrend){
  const weapon=b.weapon_name?`<div class="cc-weapon">🔫 <b>${escapeHtml(b.weapon_name)}</b></div>`:"";
  const dps=b.peak_dps?`<div class="cc-dps">Пик DPS: <b>${Math.round(b.peak_dps/1000)}k</b></div>`:`<div class="cc-dps"></div>`;
  const desc=b.description?`<div class="cc-desc">${escapeHtml(b.description)}</div>`:`<div class="cc-desc" style="color:#555;font-style:italic">— без описания —</div>`;
  const slotsTags=renderCardSlotTags(b);
  const adminBtn=isAdmin()?`<button class="cc-like" style="background:rgba(239,83,80,.15);border-color:rgba(239,83,80,.4);color:var(--red)" onclick="adminDeleteBuild('${b.id}')" title="Удалить (админ)">🗑</button>`:"";
  const mine=getMyBuilds().has(b.id);
  const myBadge=mine?`<span class="cc-cat" style="background:rgba(0,200,83,.12);color:var(--green);border-color:rgba(0,200,83,.3)">МОЙ</span>`:"";
  const copyBtn=`<button class="cc-like" style="background:rgba(66,165,245,.08);border-color:rgba(66,165,245,.3);color:var(--blue);padding:4px 8px" onclick="copyBuildUrl('${b.build_hash||""}',this)" title="Скопировать ссылку на билд">🔗</button>`;
  return`<div class="comm-card" data-id="${b.id}" ${mine?'style="border-color:rgba(0,200,83,.4)"':''}>
    <div class="cc-h">
      <div class="cc-title">${escapeHtml(b.name)}</div>
      <div class="cc-meta">
        ${myBadge}
        <span class="cc-cat">${escapeHtml(b.weapon_cat||"")}</span>
      </div>
    </div>
    <div class="cc-meta">
      <span class="cc-author" style="cursor:pointer;text-decoration:underline" onclick="showAuthorProfile('${escapeHtml(b.author||"Аноним").replace(/'/g,"\\'")}')">${escapeHtml(b.author||"Аноним")}</span>
      <span class="cc-time">· ${fmtAgo(b.created)}</span>
    </div>
    ${weapon}
    ${slotsTags}
    ${desc}
    <div class="cc-footer">
      ${dps}
      <div class="cc-actions">
        ${adminBtn}
        ${copyBtn}
        <button class="cc-like${compareList.some(x=>x.id===b.id)?" compared":""}" onclick="toggleCompare('${b.id}',this)" title="Сравнить">⚖️</button>
        <button class="cc-like" onclick="toggleComments('${b.id}',this)" title="Комменты">💬</button>
        <button class="cc-like" onclick="forkBuild('${b.id}','${(b.name||'').replace(/'/g,"\\'")}','${b.build_hash||''}')" title="Сохранить себе как новый билд" style="background:rgba(0,200,83,.08);border-color:rgba(0,200,83,.3);color:var(--green)">📋</button>
        ${showTrend&&b._trendScore!=null?`<span class="cc-like" style="background:rgba(255,152,0,.1);border-color:rgba(255,152,0,.4);color:#ffa000;cursor:default" title="Trending score">📈 ${b._trendScore.toFixed(1)}</span>`:""}
        <button class="cc-like ${isLiked?"liked":""}" onclick="toggleLike('${b.id}',this)" ${isLiked?'title="Убрать лайк"':'title="Лайк"'}>❤ <span>${b.likes||0}</span></button>
        <button class="cc-open" onclick="openCommunityBuild('${b.id}','${b.build_hash||""}')">Открыть</button>
      </div>
    </div>
    <div class="cc-comments" id="cc-comments-${b.id}" style="display:none;border-top:1px solid var(--border);margin-top:8px;padding-top:8px"></div>
  </div>`;
}

// === FORK BUILD ===
function forkBuild(id, name, hash) {
  if (!hash) { alert('Нет данных билда'); return; }
  try {
    const state = JSON.parse(decodeURIComponent(escape(atob(hash))));
    const all = JSON.parse(localStorage.getItem(BUILDS_KEY) || '{}');
    const forkName = name + ' (форк)';
    let finalName = forkName;
    let i = 2;
    while (all[finalName]) { finalName = forkName + ' #' + i; i++; }
    all[finalName] = state;
    localStorage.setItem(BUILDS_KEY, JSON.stringify(all));
    refreshSavedList();
    showShareStatus(`✓ Форк сохранён как "${finalName}". Найдёшь в Билды → дропдаун.`, 4000);
  } catch (e) {
    alert('Ошибка форка: ' + e.message);
  }
}

// === AUTHOR PROFILE ===
async function showAuthorProfile(authorName) {
  const profileEl = document.getElementById('author-profile');
  const listEl = document.getElementById('comm-list');
  const statsEl = document.getElementById('author-stats');
  const buildsEl = document.getElementById('author-builds');
  const nameEl = document.getElementById('author-name');
  const filterBar = document.querySelector('#community-panel .bsect');
  const statusEl = document.getElementById('comm-status');
  if (!profileEl || !listEl) return;
  nameEl.textContent = authorName;
  statsEl.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:10px">Загружаю...</div>';
  buildsEl.innerHTML = '';
  listEl.style.display = 'none';
  if (filterBar) filterBar.style.display = 'none';
  if (statusEl) statusEl.style.display = 'none';
  profileEl.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  try {
    const r = await fetch(`${PB_API}/builds/records?perPage=100&sort=-likes&filter=${encodeURIComponent(`author='${authorName}'`)}`);
    const j = await r.json();
    const items = j.items || [];
    const count = items.length;
    const totalLikes = items.reduce((s, b) => s + (b.likes || 0), 0);
    const dpsItems = items.filter(b => b.peak_dps > 0);
    const avgDps = dpsItems.length ? Math.round(dpsItems.reduce((s, b) => s + b.peak_dps, 0) / dpsItems.length) : 0;
    const bestBuild = dpsItems.length ? dpsItems.reduce((a, b) => b.peak_dps > a.peak_dps ? b : a) : null;
    const catCount = {};
    items.forEach(b => { if (b.weapon_cat) catCount[b.weapon_cat] = (catCount[b.weapon_cat] || 0) + 1; });
    const favCat = Object.keys(catCount).length ? Object.keys(catCount).reduce((a, b) => catCount[b] > catCount[a] ? b : a) : '—';
    statsEl.innerHTML = `
      <div class="author-stat-card"><span class="asv">${count}</span><span class="asl">Билдов</span></div>
      <div class="author-stat-card"><span class="asv">${totalLikes}</span><span class="asl">Лайков</span></div>
      <div class="author-stat-card"><span class="asv">${avgDps ? Math.round(avgDps / 1000) + 'k' : '—'}</span><span class="asl">Средний DPS</span></div>
      <div class="author-stat-card"><span class="asv">${bestBuild ? Math.round(bestBuild.peak_dps / 1000) + 'k' : '—'}</span><span class="asl">Лучший DPS${bestBuild ? '<br><span style="font-size:10px;color:var(--named)">' + escapeHtml(bestBuild.name) + '</span>' : ''}</span></div>
      <div class="author-stat-card"><span class="asv" style="font-size:16px">${escapeHtml(favCat)}</span><span class="asl">Любимое оружие</span></div>
    `;
    const liked = getLikedSet();
    buildsEl.innerHTML = items.length ? items.map(b => renderBuildCard(b, liked.has(b.id), false)).join('') : '<div style="text-align:center;padding:30px;color:var(--muted);font-size:13px">Нет билдов</div>';
  } catch (e) {
    statsEl.innerHTML = `<div style="color:var(--red);font-size:12px;padding:10px">Ошибка загрузки: ${e.message}</div>`;
  }
}

function closeAuthorProfile() {
  const profileEl = document.getElementById('author-profile');
  const listEl = document.getElementById('comm-list');
  const filterBar = document.querySelector('#community-panel .bsect');
  const statusEl = document.getElementById('comm-status');
  if (profileEl) profileEl.style.display = 'none';
  if (listEl) listEl.style.display = '';
  if (filterBar) filterBar.style.display = '';
  if (statusEl) statusEl.style.display = '';
}

// === COMMENTS ===
async function toggleComments(buildId, btn) {
  const box = document.getElementById(`cc-comments-${buildId}`);
  if (!box) return;
  if (box.style.display === 'block') {
    box.style.display = 'none';
    return;
  }
  box.style.display = 'block';
  box.innerHTML = '<div style="font-size:11px;color:var(--muted)">Загрузка...</div>';
  try {
    const r = await fetch(`${PB_API}/comments/records?filter=${encodeURIComponent(`build="${buildId}"`)}&sort=-created&perPage=50`);
    const j = await r.json();
    const items = j.items || [];
    const author = localStorage.getItem('d2calc_author_v1') || '';
    const list = items.map(c => `
      <div style="margin:6px 0;padding:6px 10px;background:rgba(255,255,255,.04);border-radius:6px">
        <div style="font-size:11px;color:var(--orange);font-weight:600">${escapeHtml(c.author)} <span style="color:#555;font-weight:400">· ${fmtAgo(c.created)}</span></div>
        <div style="font-size:12px;color:var(--text);margin-top:3px">${escapeHtml(c.text)}</div>
      </div>
    `).join('') || '<div style="font-size:11px;color:#555;font-style:italic">Пока нет комментов</div>';
    box.innerHTML = `
      <div style="font-size:11px;color:var(--muted);margin-bottom:6px">Комментариев: <b>${items.length}</b></div>
      ${list}
      <form onsubmit="postComment(event,'${buildId}')" style="margin-top:10px;display:flex;gap:6px;flex-direction:column">
        <input name="author" type="text" placeholder="Твой ник" maxlength="40" value="${escapeHtml(author)}" style="padding:6px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);font-size:12px">
        <textarea name="text" placeholder="Оставить комментарий..." required maxlength="1000" style="padding:6px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);font-size:12px;min-height:50px;resize:vertical"></textarea>
        <button type="submit" class="cc-open" style="align-self:flex-start;padding:5px 14px">Отправить</button>
      </form>
    `;
  } catch (e) {
    box.innerHTML = `<div style="font-size:11px;color:var(--red)">Ошибка: ${e.message}</div>`;
  }
}

async function postComment(ev, buildId) {
  ev.preventDefault();
  const form = ev.target;
  const author = form.author.value.trim() || 'Аноним';
  const text = form.text.value.trim();
  if (!text) return;
  if (author && author !== 'Аноним') localStorage.setItem('d2calc_author_v1', author);
  const fp = getFingerprint();
  try {
    const r = await fetch(`${PB_API}/comments/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ build: buildId, author, text, fingerprint: fp }),
    });
    if (r.ok) {
      // Re-render comments
      const box = document.getElementById(`cc-comments-${buildId}`);
      if (box) box.style.display = 'none';
      // Toggle to refresh
      const btn = document.querySelector(`button[onclick*="toggleComments('${buildId}'"]`);
      if (btn) toggleComments(buildId, btn);
    } else {
      alert('Ошибка отправки комментария');
    }
  } catch (e) {
    alert('Сбой сети: ' + e.message);
  }
}
function copyBuildUrl(hash,btn){
  if(!hash){return}
  const url=location.origin+location.pathname+"#b="+hash;
  if(navigator.clipboard){
    navigator.clipboard.writeText(url).then(()=>{
      const orig=btn.innerHTML;btn.innerHTML="✓";
      setTimeout(()=>{btn.innerHTML=orig},1500);
    });
  }
}
function shareToTelegram(hash,name){
  if(!hash)return;
  const url=location.origin+location.pathname+"#b="+hash;
  const text=`Division 2 билд "${name}" — жми на ссылку чтобы открыть в калькуляторе`;
  const tgUrl=`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  window.open(tgUrl,"_blank");
}

// Admin functions
async function adminLogin(email,password){
  try{
    const r=await fetch(`${PB_BASE}/api/admins/auth-with-password`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({identity:email,password})
    });
    if(!r.ok)throw new Error("Login failed");
    const j=await r.json();
    localStorage.setItem("d2calc_admin_token",j.token);
    return true;
  }catch(e){
    alert("Ошибка авторизации: "+e.message);
    return false;
  }
}
function adminLogout(){
  localStorage.removeItem("d2calc_admin_token");
  loadCommunityFeed();
}
async function adminDeleteBuild(id){
  if(!confirm("Удалить билд? Это безвозвратно."))return;
  const token=localStorage.getItem("d2calc_admin_token");
  try{
    const r=await fetch(`${PB_API}/builds/records/${id}`,{
      method:"DELETE",
      headers:{"Authorization":token}
    });
    if(r.ok){loadCommunityFeed()}
    else if(r.status===401){
      localStorage.removeItem("d2calc_admin_token");
      alert("Токен устарел, залогинься заново");
    }else{
      alert("Ошибка удаления: HTTP "+r.status);
    }
  }catch(e){
    alert("Сбой: "+e.message);
  }
}
// Console shortcut: `adminLogin("email","pass")` in browser devtools

async function promptAdminLogin(){
  if(isAdmin()){
    if(confirm("Ты уже залогинен админом. Выйти?")){
      adminLogout();
    }
    return;
  }
  const email=prompt("Email админа:","admin@divcalc.xyz");
  if(!email)return;
  const password=prompt("Пароль:");
  if(!password)return;
  const ok=await adminLogin(email,password);
  if(ok){
    alert("✓ Залогинен. Теперь на карточках есть кнопка 🗑 для удаления.");
    loadCommunityFeed();
  }
}

async function toggleLike(buildId,btn){
  btn.disabled=true;
  const liked=getLikedSet();
  const fp=getFingerprint();
  try{
    if(liked.has(buildId)){
      // Unlike: find and delete the like record
      const r=await fetch(`${PB_API}/likes/records?filter=${encodeURIComponent(`build="${buildId}" && fingerprint="${fp}"`)}&perPage=1`);
      const j=await r.json();
      if(j.items&&j.items[0]){
        await fetch(`${PB_API}/likes/records/${j.items[0].id}`,{method:"DELETE"});
      }
      // decrement on build
      const br=await fetch(`${PB_API}/builds/records/${buildId}`);
      const bj=await br.json();
      const newLikes=Math.max(0,(bj.likes||0)-1);
      await fetch(`${PB_API}/builds/records/${buildId}`,{
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({likes:newLikes})
      });
      liked.delete(buildId);
      saveLikedSet(liked);
      btn.classList.remove("liked");
      btn.querySelector("span").textContent=newLikes;
    }else{
      // Like: create like record + increment
      const createRes=await fetch(`${PB_API}/likes/records`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({build:buildId,fingerprint:fp})
      });
      if(createRes.ok||createRes.status===400){
        // increment counter regardless (if 400, likely dup — refresh UI anyway)
        const br=await fetch(`${PB_API}/builds/records/${buildId}`);
        const bj=await br.json();
        const newLikes=(bj.likes||0)+1;
        if(createRes.ok){
          await fetch(`${PB_API}/builds/records/${buildId}`,{
            method:"PATCH",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({likes:newLikes})
          });
          liked.add(buildId);
          saveLikedSet(liked);
          btn.classList.add("liked");
          btn.querySelector("span").textContent=newLikes;
        }
      }
    }
  }catch(e){
    console.error(e);
  }finally{
    btn.disabled=false;
  }
}

function openCommunityBuild(id,hash){
  if(!hash){alert("Билд без данных");return}
  // Switch to BUILD tab and apply state from hash
  try{
    const s=JSON.parse(decodeURIComponent(escape(atob(hash))));
    // Switch tab
    document.querySelectorAll(".cat-btn").forEach(b=>b.classList.remove("active"));
    const buildBtn=document.querySelector('.cat-btn[data-cat="build"]');
    if(buildBtn){
      buildBtn.classList.add("active");
      buildBtn.click();
    }
    applyBuildState(s);
    // Update URL hash for shareability
    history.replaceState(null,"","#b="+hash);
    window.scrollTo(0,0);
  }catch(e){
    alert("Ошибка загрузки билда: "+e.message);
  }
}

// ===== PUBLISH =====
function openPublishModal(){
  // Pre-fill from current state
  const form=document.getElementById("pub-form");
  if(!form)return;
  const wpn=getWeapon();
  const catSel=form.weapon_cat;
  if(catSel&&wpn&&wpn.cat){
    const map={AR:"AR",SMG:"SMG",LMG:"LMG",MMR:"MMR",Rifle:"Rifle",SG:"SG",Pistol:"Pistol"};
    catSel.value=map[wpn.cat]||"Mixed";
  }
  // Restore saved author nickname
  const savedAuthor=localStorage.getItem("d2calc_author_v1");
  if(savedAuthor&&form.author)form.author.value=savedAuthor;
  // Show preview
  const state=getBuildState();
  const slotCount=Object.values(state.slots||{}).filter(x=>x).length;
  const peakDps=window._lastBuildDPS?.peak||0;
  const peakStr=peakDps?` · Пик DPS: <b style="color:var(--orange)">${Math.round(peakDps/1000)}k</b>`:"";
  document.getElementById("pub-preview").innerHTML=
    `📦 <b>${wpn?wpn.name:"—"}</b> (${wpn?wpn.cat:"?"}) · слотов: <b>${slotCount}/6</b>${peakStr}<br><span style="color:#555">Сохранится: оружие, талант, ${slotCount} предметов брони, все статы/SHD/рекомбинатор</span>`;
  document.getElementById("pub-modal").classList.add("open");
  document.getElementById("pub-status").className="bug-status";
  document.getElementById("pub-status").textContent="";
}
function closePublishModal(){
  document.getElementById("pub-modal").classList.remove("open");
}

async function submitPublish(ev){
  ev.preventDefault();
  const form=ev.target;
  const btn=document.getElementById("pub-submit-btn");
  const status=document.getElementById("pub-status");
  btn.disabled=true;btn.textContent="Публикация...";
  status.className="bug-status";status.textContent="";
  try{
    const state=getBuildState();
    const hashB64=btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    // Compute peak DPS by looking at current b-peak div (it's been calculated)
    const peakNum=extractPeakDPS();
    const wpn=getWeapon();
    const payload={
      name:form.name.value.trim(),
      author:(currentUser&&currentUser.username)||form.author.value.trim()||"Аноним",
      description:form.description.value.trim(),
      weapon_cat:form.weapon_cat.value,
      weapon_name:wpn?wpn.name:"",
      build_hash:hashB64,
      peak_dps:peakNum||0,
      likes:0,
      author_id:(currentUser&&currentUser.id)||null,
    };
    const r=await fetch(`${PB_API}/builds/records`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    if(r.ok){
      const j=await r.json();
      status.className="bug-status ok";
      const shareLink=location.origin+location.pathname+"#b="+hashB64;
      const tgLink=`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent("Division 2 билд \""+payload.name+"\" — жми чтобы открыть в калькуляторе")}`;
      status.innerHTML=`✓ Опубликовано! <a href="${tgLink}" target="_blank" style="color:var(--blue);text-decoration:underline">Поделиться в Telegram</a>`;
      // Save author nickname for next publish
      if(payload.author&&payload.author!=="Аноним"){
        localStorage.setItem("d2calc_author_v1",payload.author);
      }
      // Save publisher mark
      const mine=JSON.parse(localStorage.getItem("d2calc_mine_v1")||"[]");
      mine.push(j.id);
      localStorage.setItem("d2calc_mine_v1",JSON.stringify(mine));
      setTimeout(()=>{
        closePublishModal();
        // Switch to community tab
        const commBtn=document.querySelector('.cat-btn[data-cat="community"]');
        if(commBtn)commBtn.click();
      },3500);
    }else{
      const j=await r.json().catch(()=>({}));
      status.className="bug-status err";
      status.textContent="Ошибка: "+(j.message||j.error||("HTTP "+r.status));
    }
  }catch(e){
    status.className="bug-status err";
    status.textContent="Сбой сети: "+e.message;
  }finally{
    btn.disabled=false;btn.textContent="Опубликовать";
  }
}

function extractPeakDPS(){
  // Use globally stored value from last calcBuild run (exact, no parsing)
  if(window._lastBuildDPS&&window._lastBuildDPS.peak)return Math.round(window._lastBuildDPS.peak);
  // Fallback: parse from DOM (less reliable)
  const el=document.getElementById("b-peak");
  if(!el)return 0;
  const nums=(el.textContent||"").match(/\d[\d\s]*\d/g);
  if(!nums||nums.length===0)return 0;
  // Pick the largest number found (usually peak)
  return Math.max(...nums.map(n=>parseInt(n.replace(/\D/g,""))||0));
}

// ===== PROTOTYPE AUGMENTS (Y8S1 Rise Up) =====
// Source: div2hub/data augments.csv (verified April 2026)
// min = initial value at level 0, max = fully upgraded at level 10
const PROTOTYPE_AUGMENTS = D2DATA.PROTOTYPE_AUGMENTS;

// Weapon 4th-roll talents (generic, rolls on any weapon — not exotic/named talents)
const WEAPON_TALENTS = D2DATA.WEAPON_TALENTS;
const WEAPON_TALENTS_FULL = D2DATA.WEAPON_TALENTS_FULL;
const GEAR_TALENTS = D2DATA.GEAR_TALENTS || [];

// Currently selected weapon (by id from WPNS)
let selectedWpnId="police_m4";
let selectedWpnTalent="none";
function getWeapon(){
  if(selectedWpnId==="custom"){
    return{id:"custom",name:"Своё оружие",cat:document.getElementById("cw-cat").value,
      dmg:parseFloat(document.getElementById("cw-dmg").value)||60000,
      rpm:parseFloat(document.getElementById("cw-rpm").value)||750,
      mag:parseFloat(document.getElementById("cw-mag").value)||30,
      reload:parseFloat(document.getElementById("cw-rel").value)||2.0,
      kind:"custom",tal:"",tal_type:"none"};
  }
  return WPNS[selectedWpnId]||WPNS_BASE[0];
}

// Weapon picker modal — reuses slot-modal UI but with weapon filters
let wpnModFilterKind="all"; // all/base/named/exotic
let wpnModFilterCat="all";  // all/AR/SMG/LMG/MMR/Rifle/SG/Pistol
function openWpnSlot(){
  document.getElementById("mod-title").textContent="Выбор оружия";
  document.getElementById("mod-s1").value="";
  document.getElementById("mod-s2").value="";
  wpnModFilterKind="all";wpnModFilterCat="all";
  curSlot="__weapon__";
  // Replace filter bar with weapon-specific
  document.getElementById("mod-filters").innerHTML=
    '<button class="mf-btn on" data-wk="all">Все</button>'+
    '<button class="mf-btn" data-wk="base">Базовые</button>'+
    '<button class="mf-btn" data-wk="named">Именные</button>'+
    '<button class="mf-btn" data-wk="exotic">Экзотики</button>'+
    '<span style="width:10px"></span>'+
    '<button class="mf-btn on" data-wc="all">Все типы</button>'+
    '<button class="mf-btn" data-wc="AR">AR</button>'+
    '<button class="mf-btn" data-wc="SMG">SMG</button>'+
    '<button class="mf-btn" data-wc="LMG">LMG</button>'+
    '<button class="mf-btn" data-wc="MMR">MMR</button>'+
    '<button class="mf-btn" data-wc="Rifle">Rifle</button>'+
    '<button class="mf-btn" data-wc="SG">SG</button>'+
    '<button class="mf-btn" data-wc="Pistol">Pistol</button>';
  document.getElementById("slot-modal").classList.add("open");
  renderWpnList();
  setTimeout(()=>document.getElementById("mod-s1").focus(),50);
}
function renderWpnList(){
  const q1=document.getElementById("mod-s1").value.toLowerCase().trim();
  const q2=document.getElementById("mod-s2").value.toLowerCase().trim();
  const qs=[q1,q2].filter(x=>x);
  const filtered=WPNS_LIST.filter(w=>{
    if(wpnModFilterKind!=="all"&&w.kind!==wpnModFilterKind)return false;
    if(wpnModFilterCat!=="all"&&w.cat!==wpnModFilterCat)return false;
    if(!qs.length)return true;
    const parts=[w.name,w.en||"",w.cat,w.tal||"",w.tal_desc||"",w.base||""].join(" ").toLowerCase();
    return qs.every(q=>q.split(/\s+/).every(wrd=>parts.includes(wrd)));
  });
  const html=filtered.slice(0,300).map(w=>{
    const kindClass=w.kind==="base"?"brand":w.kind==="named"?"named":"exotic";
    const kindLbl=w.kind==="base"?"Базовое":w.kind==="named"?"Именное":"Экзотик";
    const tagClass=w.kind==="base"?"b-brand":w.kind==="named"?"b-named":"b-exotic";
    const stats=`<span style="color:var(--orange)">${w.dmg.toLocaleString("ru")}</span> · ${w.rpm}rpm · ${w.mag}маг · ${w.reload}с`;
    const tal=w.tal&&w.tal!=="—"?`<div class="mi-tal">${w.tal}</div>`:"";
    const tald=w.tal_desc?`<div class="mi-desc">${w.tal_desc}</div>`:"";
    const base=w.base?`<div class="mi-desc" style="color:#555">базовое: ${w.base}</div>`:"";
    return`<div class="mitem" onclick="pickWpn('${w.id}')">
      <div class="mi-h">
        <div><span class="mi-n ${kindClass}">${w.name}</span>${wikiIcon(w.en||w.name)} ${w.en?`<span class="mi-en">${w.en}</span>`:""}</div>
        <span class="badge ${tagClass}">${w.cat} · ${kindLbl}</span>
      </div>
      <div class="mi-desc">${stats}</div>
      ${tal}${tald}${base}
    </div>`;
  }).join("");
  document.getElementById("mod-list").innerHTML=html||'<div style="padding:20px;text-align:center;color:var(--muted);font-size:12px">Ничего не найдено</div>';
}
function pickWpn(id){
  selectedWpnId=id;
  updateWpnBtn();
  closeSlotModal();
  calcBuild();
}
function updateWpnBtn(){
  const el=document.getElementById("bs-wpn");
  const w=WPNS[selectedWpnId]||WPNS_BASE[0];
  const kind=w.kind||"base";
  const cls=kind==="base"?"brand":kind;
  el.className="slot-btn filled "+cls;
  el.innerHTML=`<span class="sn ${cls}">${w.name}</span><span class="ss">${w.cat} · ${w.dmg.toLocaleString("ru")} · ${w.rpm}rpm · ${w.mag}маг · ${w.reload}с</span>`;
}

// Extend modal filter click handler for weapon tabs
document.addEventListener("click",function(e){
  const b=e.target.closest("#mod-filters .mf-btn");
  if(!b||curSlot!=="__weapon__")return;
  if(b.dataset.wk){
    wpnModFilterKind=b.dataset.wk;
    document.querySelectorAll("#mod-filters .mf-btn[data-wk]").forEach(x=>x.classList.toggle("on",x===b));
  }
  if(b.dataset.wc){
    wpnModFilterCat=b.dataset.wc;
    document.querySelectorAll("#mod-filters .mf-btn[data-wc]").forEach(x=>x.classList.toggle("on",x===b));
  }
  renderWpnList();
});
// Hook modal search inputs for weapon mode
document.addEventListener("input",e=>{
  if(curSlot!=="__weapon__")return;
  if(e.target.id==="mod-s1"||e.target.id==="mod-s2")renderWpnList();
});

function bonusDesc(b,cat){
  const parts=[];
  if(b.rof)parts.push(`+${b.rof}% скорострельность`);
  if(b.mag)parts.push(`+${b.mag}% магазин`);
  if(b.chc)parts.push(`+${b.chc}% шанс крита`);
  if(b.chd)parts.push(`+${b.chd}% урон крита`);
  if(b.hsd)parts.push(`+${b.hsd}% урон в голову`);
  if(b.wd)parts.push(`+${b.wd}% урон оружием`);
  if(b.type_dmg){
    const match=!b.type||b.type==="ALL"||b.type.split("+").some(t=>cat&&cat.includes(t));
    parts.push(`+${b.type_dmg}% урон ${b.type||""}${match?" ✓":" ✗ (не тот тип)"}`);
  }
  if(b.handling)parts.push(`+${b.handling}% управление`);
  return parts.join(" · ")||"—";
}

// Proper stack calculation with decay
// rate = stacks per second (RPM-based or fixed tempo)
function stacksAtTime(rate, max, decayAbove, decayPerSec, t){
  if(t===Infinity) return max;
  if(t<=0) return 0;
  const dA=(decayAbove!=null&&decayAbove<max)?decayAbove:max;
  const dR=decayPerSec||0;
  // Phase 1: accumulate at rate up to decayAbove
  const t1=dA/rate;
  if(t<=t1) return Math.min(rate*t, max);
  // Phase 2: net rate = rate - decay
  const net=rate-dR;
  if(net<=0) return dA;
  return Math.min(dA+net*(t-t1), max);
}

function timeToFull(rate, max, decayAbove, decayPerSec){
  const dA=(decayAbove!=null&&decayAbove<max)?decayAbove:max;
  const dR=decayPerSec||0;
  if(dA>=max) return max/rate;
  const net=rate-dR;
  if(net<=0) return Infinity;
  return dA/rate+(max-dA)/net;
}

function getStackRate(stkDef, sps){
  if(stkDef.trigger==="tempo") return stkDef.tempo_rate||20;
  if(stkDef.trigger==="kill"||stkDef.trigger==="kill_team") return 0.33;
  if(stkDef.trigger==="hs") return sps*0.15;
  return sps;
}

function dpsAtTime(wpn,totalWD,totalROF,totalMAG,chcTotal,chdTotal,hsdTotal,hsRate,reloadBonus,ooc,dta,activeStacks,hasChest,hasBP,t){
  const sps0=wpn.rpm/60;
  // Stack bonuses at time t — ВНЕ WD БАКЕТА как AMP (по замерам на манекене Y9)
  let sAmpWD=0,sCHD=0,sROF=0,sCHC=0;
  const stkRows=[];
  for(const s of activeStacks){
    const maxS=(hasChest[s.name]&&s.def.max_chest)?s.def.max_chest:s.def.max_base;
    const dA=(s.def.decay_above!=null)?s.def.decay_above:maxS;
    const dR=s.def.decay_sec||0;
    const rate=getStackRate(s.def,sps0);
    const stks=stacksAtTime(rate,maxS,dA,dR,t);
    if(s.def.wd_base!==undefined){
      const pp=(hasBP[s.name]&&s.def.wd_bp!==undefined)?s.def.wd_bp:s.def.wd_base;
      sAmpWD+=stks*pp; // накопленный amp% от стаков (additive между разными сетами)
    }
    if(s.def.chd_base!==undefined){
      const pp=s.def.chd_base+(hasBP[s.name]?(s.def.chd_bp_extra||0):0);
      sCHD+=stks*pp;
    }
    if(s.def.rof_base!==undefined) sROF+=stks*s.def.rof_base;
    if(s.def.chc_base!==undefined) sCHC+=stks*s.def.chc_base;
    stkRows.push({name:s.name,stks:Math.round(stks),max:maxS,color:s.color});
  }
  // Экзотик-таланты (Алехандро, Eagle Bearer) — в WD бакет (по описанию игры)
  let talWD=0;
  if(wpn.tal_type==="shot_cover"){
    const ts=t===Infinity?wpn.tal_max:Math.min(sps0*t,wpn.tal_max);
    talWD=ts;
  }
  // Экзотик-таланты: растут со временем до пикового значения
  if(wpn.tal_type==="kill"&&wpn.tal_bonus){
    // Стаки на убийствах: 0.33 kill/sec, линейно до пика
    const maxK=wpn.tal_max||50;
    const kills=t===Infinity?maxK:Math.min(t*0.33,maxK);
    talWD=(wpn.tal_bonus/maxK)*kills;
  }
  else if(wpn.tal_type==="stacks"&&wpn.tal_bonus){
    // Стаки за попадания: sps0 попаданий/сек, нарастают до пика
    const maxHits=wpn.tal_max||30;
    const hits=t===Infinity?maxHits:Math.min(sps0*t,maxHits);
    talWD=(wpn.tal_bonus/maxHits)*hits;
  }
  else if(wpn.tal_type==="amp"&&wpn.tal_bonus){
    // Постоянный бонус: активен всегда (с первого выстрела)
    talWD=wpn.tal_bonus;
  }
  else if(wpn.tal_type==="hs_kill"&&wpn.tal_bonus){
    // HS-kill стаки: растут медленнее чем обычные kills
    talWD=t===Infinity?wpn.tal_bonus:Math.min(t*0.15*wpn.tal_bonus/10,wpn.tal_bonus);
  }
  else if(wpn.tal_type==="swap_in"&&wpn.tal_bonus){
    // Swap-in бонус на 10-20 сек: активен сразу, затухает
    talWD=t<=20?wpn.tal_bonus:0;
  }
  else if(wpn.tal_type==="conditional"&&wpn.tal_bonus){
    // Условные (первый выстрел, после перезарядки и т.п.) — только пиковый
    talWD=t===Infinity?wpn.tal_bonus:0;
  }
  const talAmp=0;
  // WD bucket: ручной ввод + экзотик-талант (но НЕ стаки сетов — они amp)
  const wdMult=1+(totalWD+talWD)/100;
  // ROF
  const rpm_f=wpn.rpm*(1+(totalROF+sROF)/100);
  // Mag
  const mag_f=Math.round(wpn.mag*(1+totalMAG/100));
  // CHC capped 60%
  const chcCap=Math.min(chcTotal+sCHC,60)/100;
  // CHD: ввод уже включает базовый (по замерам на манекене Y9 — base × (1 + CHD/100))
  const totalCHD=chdTotal/100+sCHD/100;
  const critAvg=1+chcCap*totalCHD;
  // HSD multiplier (independent bucket)
  const hsM=1+(hsRate/100)*(hsdTotal/100);
  // Reload — Bullet King и no_reload чекбокс обнуляют время перезарядки
  const noReloadCheckbox=typeof document!=="undefined"&&document.getElementById("b-no-reload")?.checked;
  const noReloadExotic=wpn.tal_type==="no_reload";
  const noReload=noReloadCheckbox||noReloadExotic;
  const reloadFinal=noReload?0:(wpn.reload/(1+reloadBonus/100));
  // Cycle
  const sps_f=rpm_f/60;
  const cycleT=mag_f/sps_f+reloadFinal;
  const effSPS=noReload?sps_f:(mag_f/cycleT);
  // External
  const oocM=1+ooc/100;
  const dtaM=1+dta/100;
  // Amp множители (все внешние): ручной Amp + стаки сетов + экзотик-талант (Алехандро/Eagle Bearer)
  const ampM=(1+(globalThis._buildAmp||0)/100)*(1+sAmpWD/100)*(1+talAmp/100);
  // Expertise — отключена (по замерам на манекене не применяется к per-shot в Y9)
  const expM=1;
  // Общий wdMult_total для отображения (база + стаки + Алехандро "эквивалентно")
  const wdMultDisplay=wdMult*ampM;
  // Sustained DPS
  const dps=wpn.dmg*wdMult*critAvg*hsM*oocM*dtaM*ampM*expM*effSPS;
  // Burst DPS (без учёта reload)
  const burstDps=wpn.dmg*wdMult*critAvg*hsM*oocM*dtaM*ampM*expM*sps_f;
  return{dps,burstDps,wdMult:wdMultDisplay,critAvg,hsM,rpm_f,mag_f,stkRows};
}

function calcBuild(){
  const wpn=getWeapon();
  // Show/hide custom
  document.getElementById("b-custom-sect").style.display=wpn.kind==="custom"?"block":"none";
  // Weapon info bar
  document.getElementById("b-wpn-stats").innerHTML=
    `<div class="wpn-stat">База: <b>${wpn.dmg.toLocaleString("ru")}</b></div>`+
    `<div class="wpn-stat" id="b-wpn-total-dmg" style="color:var(--orange);border-color:rgba(245,166,35,.3)">Общий урон: <b>—</b></div>`+
    `<div class="wpn-stat">RPM: <b>${wpn.rpm}</b></div>`+
    `<div class="wpn-stat">Магазин: <b>${wpn.mag}</b></div>`+
    `<div class="wpn-stat">Перезарядка: <b>${wpn.reload}с</b></div>`+
    (wpn.tal?`<div class="wpn-stat" style="color:var(--orange);border-color:rgba(245,166,35,.3)">${talentName(wpn.tal)}</div>`:"");
  // Lock 4th-roll talent for exotic (they have fixed unique talent), show exotic talent desc
  const wpnTalSel=document.getElementById("b-wpn-tal");
  const wpnTalDesc=document.getElementById("b-wpn-tal-desc");
  if(wpn.kind==="exotic"){
    if(wpnTalSel){
      wpnTalSel.disabled=true;
      wpnTalSel.style.opacity="0.5";
      wpnTalSel.title="Экзотик имеет фиксированный уникальный талант — 4-й ролл не применяется";
    }
    if(wpnTalDesc){
      wpnTalDesc.innerHTML=`<div style="color:var(--orange);font-weight:600;font-size:12px;margin-top:4px">🧿 Экзотик-талант: ${talentName(wpn.tal)||""}</div><div style="font-size:11px;color:var(--muted);line-height:1.4;margin-top:2px">${talentDesc(wpn.tal_desc, wpn.tal_ru_full||wpn.tal_desc_ru)||""}</div>`;
    }
  }else{
    if(wpnTalSel){
      wpnTalSel.disabled=false;
      wpnTalSel.style.opacity="";
      wpnTalSel.title="";
    }
  }

  // Count set pieces + brand pieces from slotState
  const cnt={};const hasChest={};const hasBP={};
  const brandCnt={};
  const namedItems=[];
  let ninjaBikeBag=false;
  for(const[slot,it] of Object.entries(slotState)){
    if(!it)continue;
    if(it.kind==="green"){
      cnt[it.setName]=(cnt[it.setName]||0)+1;
      if(slot==="chest")hasChest[it.setName]=true;
      if(slot==="bp")hasBP[it.setName]=true;
    }else if(it.kind==="brand"){
      if(it.brand)brandCnt[it.brand]=(brandCnt[it.brand]||0)+1;
    }else if(it.kind==="named"){
      if(it.brand)brandCnt[it.brand]=(brandCnt[it.brand]||0)+1;
      namedItems.push({slot,item:it});
    }else if(it.kind==="exotic"){
      // NinjaBike Bag (Resourceful): +1 к каждому сету/бренду где уже есть хотя бы 1 предмет
      if(slot==="bp"&&(it.en==="NinjaBike Bag"||/ВелоНиндз/.test(it.name||""))){
        ninjaBikeBag=true;
      }
      // exotic_armor_dps обработаем ниже после объявления tPeakOnly/pushG
    }
  }
  if(ninjaBikeBag){
    for(const k of Object.keys(cnt)){if(cnt[k]>=1)cnt[k]++;}
    for(const k of Object.keys(brandCnt)){if(brandCnt[k]>=1)brandCnt[k]++;}
  }

  // Aggregate bonuses
  let tWD=0,tROF=0,tMAG=0,tCHC=0,tCHD=0,tHSD=0,tRELOAD=0;
  const bonuses=[];const activeStacks=[];
  // Единый список гарантированных (авто) статов: {stat, value, source, conditional?}
  const guaranteed=[];
  const pushG=(stat,value,source,conditional)=>{
    if(!stat||!value)return;
    guaranteed.push({stat,value,source,conditional:!!conditional});
  };
  const pushGObj=(b,source,wpnCat)=>{
    if(!b||typeof b!=="object")return;
    if(b.rof)pushG("rof",b.rof,source);
    if(b.mag)pushG("mag",b.mag,source);
    if(b.chc)pushG("chc",b.chc,source);
    if(b.chd)pushG("chd",b.chd,source);
    if(b.hsd)pushG("hsd",b.hsd,source);
    if(b.wd)pushG("wd",b.wd,source);
    if(b.reload)pushG("reload",b.reload,source);
    if(b.handling)pushG("handling",b.handling,source);
    if(b.type_dmg){
      const match=!b.type||b.type==="ALL"||b.type.split("+").some(t=>wpnCat&&wpnCat.includes(t));
      const typeLbl=b.type||"";
      if(match){
        pushG("wd",b.type_dmg,source+" ("+typeLbl+")");
      }else{
        pushG("wd",b.type_dmg,source+" ("+typeLbl+" ✗ не твой тип)",true);
      }
    }
  };

  for(const[nm,count] of Object.entries(cnt)){
    const def=SB[nm];if(!def)continue;
    [[2,def.p2],[3,def.p3],[4,def.p4]].forEach(([tier,b])=>{
      if(count<tier||!b)return;
      if(b==="stacks"&&def.stacks){
        activeStacks.push({name:nm,def:def.stacks,color:def.color});
        const maxS=hasChest[nm]&&def.stacks.max_chest?def.stacks.max_chest:def.stacks.max_base;
        bonuses.push({color:def.color,tier,nm,desc:`Стаки (${def.stacks.stat}) — макс ${maxS}${hasChest[nm]&&def.stacks.max_chest?" (нагрудник)":""}`});
      }else if(b&&typeof b==="object"){
        if(b.rof)tROF+=b.rof;
        if(b.mag)tMAG+=b.mag;
        if(b.chc)tCHC+=b.chc;
        if(b.chd)tCHD+=b.chd;
        if(b.hsd)tHSD+=b.hsd;
        if(b.wd)tWD+=b.wd;
        if(b.reload)tRELOAD+=b.reload;
        if(b.type_dmg){
          const match=!b.type||b.type.split("+").some(t=>wpn.cat.includes(t));
          if(match)tWD+=b.type_dmg;
        }
        pushGObj(b,`${nm} (${tier}pc)`,wpn.cat);
        const noteExtra=(tier===4&&def.p4_note)?` — ${def.p4_note}`:"";
        bonuses.push({color:def.color,tier,nm,desc:bonusDesc(b,wpn.cat)+noteExtra});
      }else if(typeof b==="string"&&b!=="stacks"){
        const note=def.p4_note?def.p4_note:b;
        bonuses.push({color:def.color,tier,nm,desc:`4шт: ${note}`});
      }
    });
  }

  // Brand bonuses (up to 3 pieces per brand)
  const BRAND_MATH={
    "Providence Defense":[{hsd:13},{chc:8},{chd:13}],
    "Airaldi":[{type_dmg:10,type:"MMR"},{hsd:13},{}],
    "Fenris Group":[{type_dmg:10,type:"AR"},{reload:30},{}],
    "Petrov Defense Group":[{type_dmg:10,type:"LMG"},{handling:15},{}],
    "Overlord Armaments":[{type_dmg:10,type:"Rifle"},{},{handling:30}],
    "Walker, Harris & Co":[{wd:5},{},{}],
    "Yaahl Gear":[{},{wd:10},{}],
    "Hana-U":[{},{},{wd:15}],
    "Badger Tuff":[{type_dmg:10,type:"SG"},{},{}],
    "Habsburg Guard":[{hsd:13},{type_dmg:20,type:"MMR"},{}],
    "Lengmo":[{},{},{type_dmg:30,type:"LMG"}],
    "Ceska Vyroba":[{chc:8},{},{}],
    "Douglas & Harding":[{type_dmg:20,type:"Pistol"},{},{}],
    "Grupo Sombra S.A.":[{chd:13},{},{hsd:13}],
    "Grupo Sombra":[{chd:13},{},{hsd:13}],
    "Sokolov Concern":[{type_dmg:10,type:"SMG"},{chd:13},{chc:8}],
    "Sokolov":[{type_dmg:10,type:"SMG"},{chd:13},{chc:8}],
    "Zwiadowka":[{mag:15},{type_dmg:20,type:"Rifle"},{handling:30}],
    "Legatus":[{},{},{wd:15}],
    "Imminence Armaments":[{wd:5},{},{type_dmg:60,type:"Pistol"}],
    "Unit Alloys":[{rof:5},{type_dmg:20,type:"AR"},{mag:50}],
    "Royal Works":[{handling:5},{mag:32.5},{chd:15}],
    "Electrique":[{},{},{type_dmg:30,type:"SMG"}],
    "Urban Lookout":[{},{},{type_dmg:30,type:"MMR"}],
  };
  const catMap={LMG:"LMG",AR:"AR",SMG:"SMG",SG:"SG",MMR:"MMR",Rifle:"Rifle",Pistol:"Pistol"};
  for(const[brandName,count] of Object.entries(brandCnt)){
    const tiers=BRAND_MATH[brandName];
    if(!tiers)continue;
    for(let i=0;i<Math.min(count,3);i++){
      const b=tiers[i];if(!b)continue;
      if(b.rof)tROF+=b.rof;
      if(b.mag)tMAG+=b.mag;
      if(b.chc)tCHC+=b.chc;
      if(b.chd)tCHD+=b.chd;
      if(b.hsd)tHSD+=b.hsd;
      if(b.wd)tWD+=b.wd;
      if(b.reload)tRELOAD+=b.reload;
      if(b.type_dmg){
        const match=!b.type||b.type.split("+").some(t=>wpn.cat===catMap[t]||wpn.cat.includes(t));
        if(match)tWD+=b.type_dmg;
      }
      pushGObj(b,`${brandName} ${i+1}pc`,wpn.cat);
      bonuses.push({color:"#42a5f5",tier:i+1,nm:brandName,desc:"бренд "+(i+1)+"шт: "+(Object.entries(b).filter(([k])=>k!=="type").map(([k,v])=>`+${v}% ${k}`).join(" · ")||"—")});
    }
  }

  // ===== Guaranteed stats aggregation =====
  // Собираем из core/attr1/attr2 каждого занятого слота. Для пустых слотов или слотов
  // без явного core (green/brand) — применяем глобальный режим (red/blue/yellow/custom).
  let gWD=0,gCHC=0,gCHD=0,gHSD=0,gDTA=0,gOOC=0,gROF=0,gMAG=0,gRELOAD=0,gARMOR=0,gSKILL=0;
  const gOtherStats={}; // прочие атрибуты (hazard protection и т.п.) — для отображения
  const coreMode=(document.getElementById("b-core-mode")?.value)||"red";
  const SLOT_LIST=["mask","chest","bp","gloves","holster","knees"];
  const SLOT_LABELS_RU={mask:"Маска",chest:"Нагрудник",bp:"Рюкзак",gloves:"Перчатки",holster:"Кобура",knees:"Наколенники"};
  const CORE_KEY_TO_STAT={red:"weapon damage",blue:"armor",yellow:"skill tier"};
  function applyCoreStat(coreVal,source){
    const cv=Array.isArray(coreVal)?coreVal[0]:coreVal;
    if(cv==="weapon damage"){gWD+=15; pushG("wd",15,source);}
    else if(cv==="armor"){gARMOR+=16594; pushG("armor",16594,source);}
    else if(cv==="skill tier"){gSKILL+=1; pushG("skill",1,source);}
  }
  function mapAttrKey(rawK){
    const key=rawK.toLowerCase();
    if(key.includes("weapon damage"))return "wd";
    if(key.includes("critical hit chance")||key==="crit chance"||key.includes("crit chance"))return "chc";
    if(key.includes("critical hit damage")||key==="crit damage"||key.includes("crit damage"))return "chd";
    if(key.includes("headshot damage"))return "hsd";
    if(key.includes("damage to armor"))return "dta";
    if(key.includes("damage out of cover")||key.includes("out of cover"))return "ooc";
    if(key.includes("rate of fire"))return "rof";
    if(key.includes("mag size")||key.includes("magazine"))return "mag";
    if(key.includes("reload"))return "reload";
    return null;
  }
  function applyAttr(attrs,source){
    if(!attrs||typeof attrs!=="object")return;
    for(const[rawK,v] of Object.entries(attrs)){
      if(typeof v!=="number")continue;
      const stat=mapAttrKey(rawK);
      if(stat==="wd"){gWD+=v; pushG("wd",v,source);}
      else if(stat==="chc"){gCHC+=v; pushG("chc",v,source);}
      else if(stat==="chd"){gCHD+=v; pushG("chd",v,source);}
      else if(stat==="hsd"){gHSD+=v; pushG("hsd",v,source);}
      else if(stat==="dta"){gDTA+=v; pushG("dta",v,source);}
      else if(stat==="ooc"){gOOC+=v; pushG("ooc",v,source);}
      else if(stat==="rof"){gROF+=v; pushG("rof",v,source);}
      else if(stat==="mag"){gMAG+=v; pushG("mag",v,source);}
      else if(stat==="reload"){gRELOAD+=v; pushG("reload",v,source);}
      else {
        const k=rawK.toLowerCase();
        gOtherStats[k]=(gOtherStats[k]||0)+v;
        pushG("other:"+k,v,source);
      }
    }
  }
  // Сначала учитываем core именных/экзотиков
  let slotsWithOwnCore=0;
  for(const slot of SLOT_LIST){
    const it=slotState[slot];
    const slotRu=SLOT_LABELS_RU[slot]||slot;
    if(it&&it.core){
      applyCoreStat(it.core,`Core (${slotRu})`);
      slotsWithOwnCore++;
    }
    if(it){
      const itemName=it.name||it.setName||it.brand||slotRu;
      applyAttr(it.attr1,`Attr1 ${slotRu} · ${itemName}`);
      applyAttr(it.attr2,`Attr2 ${slotRu} · ${itemName}`);
    }
  }
  // Свободные слоты — распределяются по счётчикам Red/Blue/Yellow
  const cntRed=parseInt(document.getElementById("core-red")?.value)||0;
  const cntBlue=parseInt(document.getElementById("core-blue")?.value)||0;
  const cntYellow=parseInt(document.getElementById("core-yellow")?.value)||0;
  for(let i=0;i<cntRed;i++)applyCoreStat("weapon damage",`🔴 Core Red #${i+1}`);
  for(let i=0;i<cntBlue;i++)applyCoreStat("armor",`🔵 Core Blue #${i+1}`);
  for(let i=0;i<cntYellow;i++)applyCoreStat("skill tier",`🟡 Core Yellow #${i+1}`);
  // Итог: добавляем к общим totals (до DPS-расчёта)
  tWD+=gWD; tCHC+=gCHC; tCHD+=gCHD; tHSD+=gHSD;
  tROF+=gROF; tMAG+=gMAG; tRELOAD+=gRELOAD;
  // OoC / DtA — ручные поля-модификаторы, зальём напрямую ниже через mOOC/mDTA.

  // Named item talents (parsed, non-conditional applied as static base)
  let tPeakOnly={wd:0,chc:0,chd:0,hsd:0,rof:0,mag:0};

  // Экзотик-доспехи с DPS-релевантными бонусами
  for(const[slot,it] of Object.entries(slotState)){
    if(!it||it.kind!=="exotic"||!it.exotic_armor_dps)continue;
    const exSrc=`🧿 Экзотик-доспех: ${it.name}`;
    const isAmp=it.exotic_amp_type==="amp";
    if(it.exotic_peak_wd){
      if(isAmp){tWD+=it.exotic_peak_wd; pushG("wd",it.exotic_peak_wd,exSrc);}
      else{tPeakOnly.wd+=it.exotic_peak_wd; pushG("wd",it.exotic_peak_wd,exSrc+" (пик)",true);}
    }
    if(it.exotic_peak_chd){
      if(isAmp){tCHD+=it.exotic_peak_chd; pushG("chd",it.exotic_peak_chd,exSrc);}
      else{tPeakOnly.chd+=it.exotic_peak_chd; pushG("chd",it.exotic_peak_chd,exSrc+" (пик)",true);}
    }
    if(it.exotic_peak_chc){
      if(isAmp){tCHC+=it.exotic_peak_chc; pushG("chc",it.exotic_peak_chc,exSrc);}
      else{tPeakOnly.chc+=it.exotic_peak_chc; pushG("chc",it.exotic_peak_chc,exSrc+" (пик)",true);}
    }
    if(it.exotic_peak_rof){
      if(isAmp){tROF+=it.exotic_peak_rof; pushG("rof",it.exotic_peak_rof,exSrc);}
      else{tPeakOnly.rof+=it.exotic_peak_rof; pushG("rof",it.exotic_peak_rof,exSrc+" (пик)",true);}
    }
    bonuses.push({color:"#ab47bc",tier:"🧿",nm:`Экзотик: ${it.name}`,desc:it.exotic_note||""});
  }

  for(const ni of namedItems){
    const tb=ni.item.talentBonus;
    if(!tb){bonuses.push({color:"#ab47bc",tier:"им",nm:ni.item.name,desc:(ni.item.talent||"")+" — "+(ni.item.talentDesc||"")});continue}
    const isCond=tb.conditional;
    const niSrc=`Именной: ${ni.item.name}`;
    ["wd","chc","chd","hsd","rof","mag"].forEach(k=>{
      if(tb[k]){
        if(isCond)tPeakOnly[k]+=tb[k];
        else{
          if(k==="wd")tWD+=tb[k];
          if(k==="chc")tCHC+=tb[k];
          if(k==="chd")tCHD+=tb[k];
          if(k==="hsd")tHSD+=tb[k];
          if(k==="rof")tROF+=tb[k];
          if(k==="mag")tMAG+=tb[k];
          pushG(k,tb[k],niSrc);
        }
      }
    });
    if(tb.reload){tRELOAD+=tb.reload; if(!isCond)pushG("reload",tb.reload,niSrc);}
    const mathStr=Object.entries(tb).filter(([k])=>!["note","conditional","static"].includes(k)).map(([k,v])=>`+${v}% ${k}`).join(" ");
    bonuses.push({color:"#ab47bc",tier:"им",nm:ni.item.name,desc:(ni.item.talent||"")+": "+mathStr+(isCond?" (условно — только пик)":"")});
  }

  // Gear talents (chest + backpack) — selected from dropdown
  const chestTalId=document.getElementById("b-chest-talent")?.value;
  const bpTalId=document.getElementById("b-bp-talent")?.value;
  for(const[selId,slotName] of [[chestTalId,"Нагрудник"],[bpTalId,"Рюкзак"]]){
    if(!selId)continue;
    const isPerfect=selId.startsWith("perfect:");
    const baseId=isPerfect?selId.slice(8):selId;
    const t=GEAR_TALENTS.find(x=>(x.id||x.name_en)===baseId);
    if(!t)continue;
    const slotKey=slotName==="Нагрудник"?"chest":"bp";
    const it=slotState[slotKey];
    if(it&&(it.kind==="named"||it.kind==="exotic")&&it.talent){
      bonuses.push({color:"#ffa000",tier:"⚠️",nm:"Талант "+slotName,desc:`Уже задан вещью "${it.name}": ${it.talent}. Селект игнорируется.`});
      continue;
    }
    // Для Perfect сначала пробуем "Perfect X", потом X. Для обычного — X, потом "Perfect X".
    const tb=isPerfect?(talentBonus("Perfect "+t.name_en)||talentBonus(t.perfect_name_ru)||talentBonus(t.name_en)):(talentBonus(t.name_en)||talentBonus("Perfect "+t.name_en));
    if(tb){
      const isCond=tb.conditional;
      ["wd","chc","chd","hsd","rof","mag","reload"].forEach(k=>{
        if(tb[k]){
          if(isCond)tPeakOnly[k]=(tPeakOnly[k]||0)+tb[k];
          else{
            if(k==="wd")tWD+=tb[k];
            else if(k==="chc")tCHC+=tb[k];
            else if(k==="chd")tCHD+=tb[k];
            else if(k==="hsd")tHSD+=tb[k];
            else if(k==="rof")tROF+=tb[k];
            else if(k==="mag")tMAG+=tb[k];
            else if(k==="reload")tRELOAD+=tb[k];
          }
          pushG(k,tb[k],`${slotName}: ${isPerfect?"⭐ ":""}${t.name_ru||t.name_en}`,isCond);
        }
      });
    }
    const label=isPerfect?(t.perfect_name_ru||`${t.name_ru||t.name_en} (идеальный)`):(t.name_ru||t.name_en);
    const descText=t.desc_ru||t.description||"";
    bonuses.push({color:"#f5a623",tier:"🎽",nm:`Талант ${slotName}`,desc:`${label}: ${descText.slice(0,120)}${descText.length>120?"...":""}`});
  }

  // Exotic weapon talent — always applies, guaranteed
  if(wpn.kind==="exotic"){
    const exSrc=`🧿 Экзотик: ${wpn.name}`;
    if(wpn.tal_type==="kill"&&wpn.tal_bonus){
      pushG("wd",wpn.tal_bonus,exSrc+" (максимум на киллах)",true);
    }
    if(wpn.tal_type==="shot_cover"&&wpn.tal_max){
      pushG("wd",wpn.tal_max,exSrc+" (из укрытия, пик)",true);
    }
    if(wpn.tal_type==="amp"&&wpn.tal_bonus){
      pushG("wd",wpn.tal_bonus,exSrc+" (постоянный бонус)",false);
    }
    if(wpn.tal_type==="stacks"&&wpn.tal_bonus){
      pushG("wd",wpn.tal_bonus,exSrc+" (пик стаков)",true);
    }
    if(wpn.tal_type==="hs_kill"&&wpn.tal_bonus){
      pushG("wd",wpn.tal_bonus,exSrc+" (HS-kill, пик)",true);
    }
    if(wpn.tal_type==="swap_in"&&wpn.tal_bonus){
      pushG("wd",wpn.tal_bonus,exSrc+" (swap-in бонус 10-20s)",true);
    }
    if(wpn.tal_type==="no_reload"){
      pushG("wd",0,exSrc+" (Bullet King: без перезарядки)",false);
    }
    if(wpn.tal_type==="conditional"&&wpn.tal_bonus){
      pushG("wd",wpn.tal_bonus,exSrc+" (условно — burst-шот)",true);
    }
    const exStats=EXOTIC_WPNS[wpn.name]||{};
    if(exStats.static_bonus){
      const sb=exStats.static_bonus;
      ["wd","chc","chd","hsd","rof","mag","reload"].forEach(k=>{
        if(sb[k]){
          if(k==="wd")tWD+=sb[k];
          else if(k==="chc")tCHC+=sb[k];
          else if(k==="chd")tCHD+=sb[k];
          else if(k==="hsd")tHSD+=sb[k];
          else if(k==="rof")tROF+=sb[k];
          else if(k==="mag")tMAG+=sb[k];
          else if(k==="reload")tRELOAD+=sb[k];
          pushG(k,sb[k],exSrc+" (статический)"+(sb.note?" · "+sb.note:""));
        }
      });
    }
    if(exStats.peak_bonus){
      const pb=exStats.peak_bonus;
      ["wd","chc","chd","hsd","rof","mag","reload"].forEach(k=>{
        if(pb[k]){
          tPeakOnly[k]=(tPeakOnly[k]||0)+pb[k];
          pushG(k,pb[k],exSrc+" (пик)"+(pb.note?" · "+pb.note:""),true);
        }
      });
    }
    bonuses.push({color:"#ab47bc",tier:"🧿",nm:"Экзотик: "+wpn.name,desc:(talentName(wpn.tal)||"")+": "+(talentDesc(wpn.tal_desc,wpn.tal_ru_full||wpn.tal_desc_ru)||"").slice(0,140)});
  }

  // Weapon 4th-roll talent (applies on top of base/exotic/named). For exotic — skip (slot locked)
  const wtFull=(wpn.kind==="exotic")?null:WEAPON_TALENTS_FULL[selectedWpnTalent];
  const wtOld=(wpn.kind==="exotic")?null:WEAPON_TALENTS[selectedWpnTalent];
  const wtBonus=(wtFull?.bonus&&Object.keys(wtFull.bonus).length>0)?wtFull.bonus:wtOld?.bonus??null;
  const wtName=wtFull?(wtFull.name_ru?`${wtFull.name_ru} (${wtFull.name_en})`:wtFull.name_en):wtOld?.name||"";
  if(wtBonus){
    const tb=wtBonus;
    const isCond=tb.conditional;
    const wtSrc=`Талант оружия: ${wtName}`;
    ["wd","chc","chd","hsd","rof","mag"].forEach(k=>{
      if(tb[k]){
        if(isCond)tPeakOnly[k]+=tb[k];
        else{
          if(k==="wd")tWD+=tb[k];
          if(k==="chc")tCHC+=tb[k];
          if(k==="chd")tCHD+=tb[k];
          if(k==="hsd")tHSD+=tb[k];
          if(k==="rof")tROF+=tb[k];
          if(k==="mag")tMAG+=tb[k];
          pushG(k,tb[k],wtSrc);
        }
      }
    });
    if(tb.reload){tRELOAD+=tb.reload; if(!isCond)pushG("reload",tb.reload,wtSrc);}
    const mathStr=Object.entries(tb).filter(([k])=>!["note","conditional","static"].includes(k)).map(([k,v])=>`+${v}% ${k}`).join(" ");
    bonuses.push({color:"#f5a623",tier:"🎯",nm:"Талант: "+wtName,desc:mathStr+(isCond?" (условно — только пик)":"")+(tb.note?" · "+tb.note:"")});
  }

  // Named weapon talent (if any) — applies same way as named armor
  if(wpn.kind==="named"&&wpn.named_bonus){
    const tb=wpn.named_bonus;
    const isCond=tb.conditional;
    const nwSrc=`Оружие: ${wpn.name}`;
    ["wd","chc","chd","hsd","rof","mag"].forEach(k=>{
      if(tb[k]){
        if(isCond)tPeakOnly[k]+=tb[k];
        else{
          if(k==="wd")tWD+=tb[k];
          if(k==="chc")tCHC+=tb[k];
          if(k==="chd")tCHD+=tb[k];
          if(k==="hsd")tHSD+=tb[k];
          if(k==="rof")tROF+=tb[k];
          if(k==="mag")tMAG+=tb[k];
          pushG(k,tb[k],nwSrc);
        }
      }
    });
    if(tb.reload){tRELOAD+=tb.reload; if(!isCond)pushG("reload",tb.reload,nwSrc);}
    const mathStr=Object.entries(tb).filter(([k])=>!["note","conditional","static"].includes(k)).map(([k,v])=>`+${v}% ${k}`).join(" ");
    bonuses.push({color:"#ab47bc",tier:"🔫",nm:"Оружие: "+wpn.name,desc:(talentName(wpn.tal)||"")+": "+mathStr+(isCond?" (условно — только пик)":"")});
  }

  // Manual stats — пользователь вводит ИТОГИ из меню игры ("Наступление").
  // Калькулятор НЕ суммирует авто-бонусы от core/сетов/брендов/талантов в tWD/tCHC/...
  // (классовые перки делают автосчёт ненадёжным). Из авто-сбора остаются только:
  // - tPeakOnly (conditional-стаки, экзотиков peak_bonus) → применяются при пиковом DPS
  // - activeStacks (Страйкер и т.п.)
  // - bonuses (для отображения источников)
  const mCHC=parseFloat(document.getElementById("b-chc").value)||0;
  const mCHD=parseFloat(document.getElementById("b-chd").value)||0;
  const mHSD=parseFloat(document.getElementById("b-hsd").value)||0;
  const mHSR=parseFloat(document.getElementById("b-hsrate").value)||0;
  const mOOC=parseFloat(document.getElementById("b-ooc").value)||0;
  const mDTA=parseFloat(document.getElementById("b-dta").value)||0;
  const mWD=parseFloat(document.getElementById("b-wd").value)||0;
  const mRELOAD=parseFloat(document.getElementById("b-reload")?.value)||0;
  const mROF=parseFloat(document.getElementById("b-rof")?.value)||0;
  const mMAG=parseFloat(document.getElementById("b-mag")?.value)||0;
  const mAMP=parseFloat(document.getElementById("b-amp")?.value)||0;
  const mEXP=parseFloat(document.getElementById("b-expertise")?.value)||0;
  globalThis._buildAmp=mAMP;
  globalThis._buildExpertise=mEXP;
  const catBonusMap={
    AR:parseFloat(document.getElementById("b-wd-ar")?.value)||0,
    SMG:parseFloat(document.getElementById("b-wd-smg")?.value)||0,
    LMG:parseFloat(document.getElementById("b-wd-lmg")?.value)||0,
    MMR:parseFloat(document.getElementById("b-wd-mmr")?.value)||0,
    Rifle:parseFloat(document.getElementById("b-wd-rifle")?.value)||0,
    SG:parseFloat(document.getElementById("b-wd-sg")?.value)||0,
    Pistol:parseFloat(document.getElementById("b-wd-pistol")?.value)||0,
  };
  const catBonus=catBonusMap[wpn.cat]||0;
  const wpnCatLabel={AR:"AR (штурмовая)",SMG:"SMG (ПП)",LMG:"LMG (пулемёт)",MMR:"MMR (снайперка)",Rifle:"Rifle (винтовка)",SG:"SG (дробовик)",Pistol:"Pistol"};
  const hintEl=document.getElementById("b-wpn-cat-hint");
  if(hintEl){
    const lbl=wpnCatLabel[wpn.cat]||wpn.cat||"—";
    hintEl.textContent=`→ активен бонус "От ${lbl}"`;
  }
  // ОБНУЛЯЕМ все авто-накопления: берём ИТОГ только из ручных полей
  tWD=mWD+catBonus;
  tCHC=mCHC;
  tCHD=mCHD;
  tHSD=mHSD;
  tROF=mROF;
  tMAG=mMAG;
  tRELOAD=mRELOAD;
  const mOOCeff=mOOC;
  const mDTAeff=mDTA;
  // SHD / Prototype Gear / Recombinator — больше не суммируются в DPS (итог уже введён в игре).
  // Читаем только чтобы показать их в списке bonuses (информативно).
  const shd={wd:v("shd-wd"),hsd:v("shd-hsd"),chc:v("shd-chc"),chd:v("shd-chd"),ammo:v("shd-ammo"),reload:v("shd-reload")};
  if(Object.values(shd).some(x=>x>0)){
    bonuses.push({color:"#42a5f5",tier:"⌚",nm:"SHD Watch",desc:Object.entries(shd).filter(([,x])=>x).map(([k,x])=>`+${x}% ${k}`).join(" · ")});
  }
  const proto={slots:v("proto-slots-count"),wd:v("proto-wd"),hsd:v("proto-hsd"),chc:v("proto-chc"),chd:v("proto-chd"),elite:v("proto-elite"),health:v("proto-health")};
  if(proto.wd)pushG("wd",proto.wd,"Prototype Gear");
  if(proto.hsd)pushG("hsd",proto.hsd,"Prototype Gear");
  if(proto.chc)pushG("chc",proto.chc,"Prototype Gear");
  if(proto.chd)pushG("chd",proto.chd,"Prototype Gear");
  // elite/health damage are conditional on enemy type, store separately for note
  const protoSum=proto.wd+proto.hsd+proto.chc+proto.chd+proto.elite+proto.health;
  if(protoSum>0||proto.slots>0){
    const parts=[];
    if(proto.slots>0)parts.push(`${proto.slots}/6 слотов Prototype`);
    if(proto.wd)parts.push(`+${proto.wd}% WD`);
    if(proto.hsd)parts.push(`+${proto.hsd}% HSD`);
    if(proto.chc)parts.push(`+${proto.chc}% CHC`);
    if(proto.chd)parts.push(`+${proto.chd}% CHD`);
    if(proto.elite)parts.push(`+${proto.elite}% vs Elite (по элите)`);
    if(proto.health)parts.push(`+${proto.health}% vs Health (по здоровью)`);
    bonuses.push({color:"#ab47bc",tier:"🧪",nm:"Prototype Gear",desc:parts.join(" · ")});
  }
  // Recombinator (Y8S1 seasonal modifiers) — информативно, не влияет на DPS (итог вводится вручную)
  const rc={hsd:v("rc-hsd"),ammo:v("rc-ammo"),ergo:v("rc-ergo"),armor:v("rc-armor"),elite:v("rc-elite"),hazprot:v("rc-hazprot"),status:v("rc-status"),skilldmg:v("rc-skilldmg"),util3:v("rc-util3")};
  if(rc.hsd)pushG("hsd",rc.hsd,"Рекомбинатор: Offense");
  if(rc.ammo)pushG("mag",rc.ammo,"Рекомбинатор: Offense");
  const rcOff=rc.hsd+rc.ammo+rc.ergo;
  const rcDef=rc.armor+rc.elite+rc.hazprot;
  const rcUtl=rc.status+rc.skilldmg+rc.util3;
  if(rcOff>0){
    const parts=[];
    if(rc.hsd)parts.push(`+${rc.hsd}% HSD`);
    if(rc.ammo)parts.push(`+${rc.ammo}% патроны`);
    if(rc.ergo)parts.push(`+${rc.ergo}% эргономика`);
    bonuses.push({color:"#ef5350",tier:"🧬",nm:"Рекомбинатор: Offense",desc:parts.join(" · ")});
  }
  if(rcDef>0){
    bonuses.push({color:"#42a5f5",tier:"🧬",nm:"Рекомбинатор: Defense",desc:`+${rc.armor}% броня · +${rc.elite}% vs элит · +${rc.hazprot}% защ. статусов (не DPS)`});
  }
  if(rcUtl>0){
    bonuses.push({color:"#fdd835",tier:"🧬",nm:"Рекомбинатор: Utility",desc:`+${rc.status}% статусы · +${rc.skilldmg}% урон навыка · +${rc.util3}% свободный (не DPS оружия)`});
  }

  // Prototype Augments (Y8S1)
  const augActive=[];
  for(let i=1;i<=3;i++){
    const key=document.getElementById(`proto-${i}-aug`)?.value;
    const lvl=Math.max(0,Math.min(10,parseFloat(document.getElementById(`proto-${i}-lvl`)?.value)||0));
    if(!key||!PROTOTYPE_AUGMENTS[key])continue;
    const aug=PROTOTYPE_AUGMENTS[key];
    const value=Math.min(aug.max,aug.init+lvl*aug.per);
    const valEl=document.getElementById(`proto-${i}-val`);
    if(valEl)valEl.textContent=value.toFixed(1)+aug.unit;
    augActive.push({key,name:aug.name,lvl,value,desc:aug.desc,impact:aug.dps_impact});
    // Augments информативно (итог вводится вручную, автосчёт отключён)
    if(key==="echo")pushG("wd",value,`Prototype Augment: ${aug.name}`);
    else if(key==="paradox")pushG("mag",value*3,`Prototype Augment: ${aug.name}`);
  }
  if(augActive.length){
    bonuses.push({color:"#ab47bc",tier:"🧪",nm:"Prototype Augments",desc:augActive.map(a=>`${a.name} lvl${a.lvl} (${a.value.toFixed(1)}${PROTOTYPE_AUGMENTS[a.key].unit})`).join(" · ")});
    const descEl=document.getElementById("proto-desc");
    if(descEl)descEl.innerHTML=augActive.map(a=>`<b>${a.name}</b>: ${a.desc}`).join("<br>");
  }else{
    const descEl=document.getElementById("proto-desc");
    if(descEl)descEl.innerHTML="";
  }

  // ===== Рендер "Гарантированные статы" — отключён (пользователь вводит итоги руками) =====
  if(false){
    const gSect=document.getElementById("b-guaranteed-sect");
    const gGrid=document.getElementById("b-guaranteed-grid");
    if(gSect&&gGrid){
      const statMeta={
        wd:{icon:"⚔️",label:"Урон оружия",unit:"%"},
        chc:{icon:"💥",label:"Шанс крита",unit:"%"},
        chd:{icon:"💢",label:"Урон крита",unit:"%"},
        hsd:{icon:"🎯",label:"Урон в голову",unit:"%"},
        dta:{icon:"🛡",label:"Урон по броне",unit:"%"},
        ooc:{icon:"🚶",label:"Вне укрытия",unit:"%"},
        rof:{icon:"🔥",label:"Скорострельность",unit:"%"},
        mag:{icon:"📦",label:"Ёмкость магазина",unit:"%"},
        reload:{icon:"♻️",label:"Перезарядка",unit:"%"},
        handling:{icon:"🎯",label:"Управление",unit:"%"},
        armor:{icon:"🛡",label:"Броня",unit:""},
        skill:{icon:"⚡",label:"Ур. навыка",unit:""},
      };
      const statOrder=["wd","chc","chd","hsd","dta","ooc","rof","mag","reload","handling","armor","skill"];
      const groupedG={};
      for(const g of guaranteed){
        if(!groupedG[g.stat])groupedG[g.stat]=[];
        groupedG[g.stat].push(g);
      }
      const keys=Object.keys(groupedG).sort((a,b)=>{
        const ia=statOrder.indexOf(a),ib=statOrder.indexOf(b);
        if(ia===-1&&ib===-1)return a.localeCompare(b);
        if(ia===-1)return 1;
        if(ib===-1)return -1;
        return ia-ib;
      });
      const escH=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      const html=keys.map(stat=>{
        const list=groupedG[stat];
        const active=list.filter(x=>!x.conditional);
        const condit=list.filter(x=>x.conditional);
        const meta=statMeta[stat]||{icon:"•",label:stat.startsWith("other:")?(typeof translateStat==="function"?translateStat(stat.slice(6)):stat.slice(6)):stat,unit:"%"};
        const total=active.reduce((s,x)=>s+x.value,0);
        const activeStr=active.map(x=>`${x.value>0?"+":""}${x.value}${meta.unit||""} (${escH(x.source)})`).join(", ");
        const conditStr=condit.map(x=>`${x.value>0?"+":""}${x.value}${meta.unit||""} (${escH(x.source)})`).join(", ");
        const totalStr=(stat==="armor")?total.toLocaleString("ru"):((total>0?"+":"")+total);
        return `
          <div class="g-row" style="padding:6px 8px;background:rgba(0,200,83,.04);border-radius:5px;margin-bottom:4px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>${meta.icon} <b>${meta.label}</b></span>
              <b style="color:var(--green);font-size:14px">${totalStr}${meta.unit||""}</b>
            </div>
            ${activeStr?`<div style="font-size:10px;color:var(--muted);margin-top:2px;line-height:1.3">${activeStr}</div>`:""}
            ${conditStr?`<div style="font-size:10px;color:#f5a623;opacity:.75;margin-top:2px;line-height:1.3">⚠ ${conditStr}</div>`:""}
          </div>`;
      }).join("");
      if(html){
        gSect.style.display="block";
        gGrid.innerHTML=html;
      }else{
        gSect.style.display="none";
      }
    }
  }

  // Render bonuses
  const bsect=document.getElementById("b-bonuses-sect");
  bsect.style.display=bonuses.length?"block":"none";
  document.getElementById("b-bonuses").innerHTML=`<div class="bon-list">`+
    bonuses.map(b=>`<div class="bon-item" style="border-color:${b.color}"><span class="bon-v" style="color:${b.color}">${b.nm} ${b.tier}шт</span><span>${b.desc}</span></div>`).join("")+`</div>`;

  // Top: primary sources (exotic + 4pc sets + named)
  const topKey=document.getElementById("b-top-key");
  if(topKey){
    const keys=[];
    bonuses.forEach(b=>{
      if(b.tier==="🧿") keys.push(b.nm.replace(/^Экзотик:\s*/,""));
      else if(typeof b.tier==="number"&&b.tier===4) keys.push(setShort(b.nm)+" 4шт");
    });
    topKey.innerHTML=keys.length?`<span style="color:var(--muted)">💥 Главное:</span> <b style="color:var(--orange)">${keys.map(k=>escapeHtml(k)).join(" + ")}</b>`:"";
  }

  // Top compact bonus tags
  const topB=document.getElementById("b-top-bonuses");
  if(topB){
    const maxTierBySet={};
    bonuses.forEach(b=>{if(typeof b.tier==="number"){maxTierBySet[b.nm]=Math.max(maxTierBySet[b.nm]||0,b.tier);}});
    const finalTags=bonuses.filter(b=>{
      if(typeof b.tier==="number") return b.tier===maxTierBySet[b.nm];
      return true;
    }).map(b=>{
      let kind="";
      if(/Экзотик/i.test(b.nm)||b.tier==="🧿") kind="exotic";
      else if(b.tier==="им") kind="named";
      let short=b.nm.replace(/^(Экзотик: |Оружие: )/,"");
      const isNum=typeof b.tier==="number";
      if(isNum)short=setShort(short);
      const tierLbl=isNum?` ${b.tier}шт`:(b.tier==="им"?"":` ${b.tier||""}`);
      return `<span class="rtb-tag ${kind}">${short}${tierLbl}</span>`;
    });
    topB.innerHTML=finalTags.join("")||`<span class="rtb-hint">Нет активных сет-бонусов — набери 2/3/4 предмета одного сета/бренда.</span>`;
  }

  // Stack info
  let stkHtml="";
  const sps=wpn.rpm/60;
  for(const s of activeStacks){
    const max=(hasChest[s.name]&&s.def.max_chest)?s.def.max_chest:s.def.max_base;
    const dA=(s.def.decay_above!=null)?s.def.decay_above:max;
    const dR=s.def.decay_sec||0;
    const rate=getStackRate(s.def,sps);
    const rampT=timeToFull(rate,max,dA,dR);
    const stks5=Math.round(stacksAtTime(rate,max,dA,dR,5));
    const pct5=Math.round(stks5/max*100);
    const trigLbl=s.def.trigger==="tempo"?`${rate}/сек (фикс.)`:`${rate.toFixed(1)}/сек`;
    const netRate=dR>0?`${trigLbl} · выше ${dA}: чистый ${(rate-dR).toFixed(1)}/с (−${dR}/с)`:`${trigLbl}`;
    const note=s.def.note?`<br><span style="color:#555;font-size:10px;font-style:italic">${s.def.note}</span>`:"";
    stkHtml+=`<div class="stk-info" style="flex-direction:column;gap:6px;align-items:flex-start">
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
        <span style="color:${s.color};font-weight:700">${s.name}</span>
        <span>Макс: <b>${max}</b></span>
        <span>Скорость: <b>${netRate}</b></span>
        ${dR>0?`<span style="color:#ef5350">−${dR}/с выше ${dA}</span>`:""}
        ${note}
        <span>Фул стаки: <b>${rampT===Infinity?"∞":rampT.toFixed(1)+"с"}</b></span>
        <span>За 5с: <b>${stks5}/${max} (${pct5}%)</b></span>
      </div>
      <div style="width:100%">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-bottom:2px">
          <span>0с</span><span>5с: ${stks5}</span><span>фул: ${rampT===Infinity?"∞":rampT.toFixed(1)+"с"}</span>
        </div>
        <div class="stk-bar-bg"><div class="stk-bar-fill" style="width:${pct5}%;background:${s.color}"></div></div>
      </div>
    </div>`;
  }

  // DPS timeline
  const times=[
    {t:0,label:"Без стаков (0с)"},
    {t:2,label:"2 секунды"},
    {t:5,label:"5 секунд"},
    {t:10,label:"10 секунд"},
    {t:15,label:"15 секунд"},
    {t:20,label:"20 секунд"},
    {t:30,label:"30 секунд"},
    {t:Infinity,label:"Фул стаки ★"},
  ];
  const rows=times.map(tp=>{
    const isPeak=tp.t===Infinity;
    const wdX=tWD+(isPeak?tPeakOnly.wd:0);
    const rofX=tROF+(isPeak?tPeakOnly.rof:0);
    const magX=tMAG+(isPeak?tPeakOnly.mag:0);
    const chcX=tCHC+(isPeak?tPeakOnly.chc:0);
    const chdX=tCHD+(isPeak?tPeakOnly.chd:0);
    const hsdX=tHSD+(isPeak?tPeakOnly.hsd:0);
    return{...tp,...dpsAtTime(wpn,wdX,rofX,magX,chcX,chdX,hsdX,mHSR,tRELOAD,mOOCeff,mDTAeff,activeStacks,hasChest,hasBP,tp.t)};
  });
  const peak=rows[rows.length-1];
  const baseDPS=rows[0].dps;
  const maxDPS=peak.dps;
  // Обновим "Общий урон" в инфо-баре оружия: БАЗА (без peak-стаков) + ПИК (со стаками)
  // Сверка с меню игры: без экспертизы/ампа (как показывает карточка оружия в игре)
  const baseDmg=Math.round(wpn.dmg*(1+tWD/100));
  const peakWD=tWD+(tPeakOnly.wd||0);
  const peakDmg=Math.round(wpn.dmg*(1+peakWD/100));
  // С экспертизой и ампом — реальный урон в бою
  const realDmg=Math.round(baseDmg*(1+mEXP/100)*(1+mAMP/100));
  const totalDmgEl=document.getElementById("b-wpn-total-dmg");
  if(totalDmgEl){
    const hasPeak=peakWD>tWD;
    const hasExpAmp=mEXP>0||mAMP>0;
    totalDmgEl.innerHTML=`<div style="font-size:11px">В игре карточка: <b>${baseDmg.toLocaleString("ru")}</b> <span style="color:var(--muted);font-size:10px">(+${tWD}% WD, БЕЗ экспертизы/ампа)</span></div>`+
      (hasExpAmp?`<div style="font-size:11px;margin-top:2px">Реальный per-shot: <b style="color:var(--green)">${realDmg.toLocaleString("ru")}</b> <span style="color:var(--muted);font-size:10px">(+${mEXP}% exp × +${mAMP}% amp)</span></div>`:"")+
      (hasPeak?`<div style="font-size:11px;margin-top:2px">Пик со стаками: <b style="color:var(--orange)">${peakDmg.toLocaleString("ru")}</b> <span style="color:#f5a623;font-size:10px">(+${peakWD}% WD)</span></div>`:"");
  }
  // Simpson-ish average over 10s window (sustained fight)
  const samplesAvg=[0,1,2,3,5,7,10].map(tt=>dpsAtTime(wpn,tWD,tROF,tMAG,tCHC,tCHD,tHSD,mHSR,tRELOAD,mOOCeff,mDTAeff,activeStacks,hasChest,hasBP,tt).dps);
  const avgDPS10=samplesAvg.reduce((a,b)=>a+b,0)/samplesAvg.length;

  document.getElementById("b-stacks").innerHTML=stkHtml;
  document.getElementById("b-tbl").innerHTML=rows.map((r,i)=>{
    const isPeak=i===rows.length-1;
    const isBase=i===0;
    const pctOfPeak=Math.round(r.dps/maxDPS*100);
    const growth=isBase?"":` <span style="color:${r.dps>=baseDPS?"#00c853":"#ef5350"};font-size:10px">${r.dps>=baseDPS?"+":""}${Math.round((r.dps/baseDPS-1)*100)}%</span>`;
    const bar=`<div style="height:4px;background:var(--border);border-radius:2px;margin-top:3px;overflow:hidden"><div style="height:100%;width:${pctOfPeak}%;background:${isPeak?"var(--orange)":isBase?"#888":"#f5a623"};border-radius:2px"></div></div>`;
    return`<tr class="${isPeak?"peak":""}">
      <td>${r.label}</td>
      <td style="font-size:11px">${r.stkRows.map(s=>`${s.stks}/${s.max}`).join(" · ")||"—"}</td>
      <td>×${r.wdMult.toFixed(2)}</td>
      <td>×${r.critAvg.toFixed(2)}</td>
      <td>×${r.hsM.toFixed(2)}</td>
      <td>${Math.round(r.rpm_f)}</td>
      <td><b>${Math.round(r.dps).toLocaleString("ru")}</b>${growth}${bar}</td>
    </tr>`;
  }).join("");

  const rampPct=Math.round((maxDPS/baseDPS-1)*100);
  // TTK data
  renderTtk(baseDPS,avgDPS10,maxDPS);

  document.getElementById("b-peak").innerHTML=
    `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
      <div>
        <div style="font-size:22px;font-weight:700;color:#888">${Math.round(baseDPS).toLocaleString("ru")}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">БАЗА (без стаков)</div>
      </div>
      <div>
        <div style="font-size:26px;font-weight:700;color:#f5a623">${Math.round(avgDPS10).toLocaleString("ru")}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">СРЕДНИЙ (10с бой)</div>
      </div>
      <div>
        <div style="font-size:32px;font-weight:700;color:var(--orange)">${Math.round(maxDPS).toLocaleString("ru")}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">ПИК (фул стаки)</div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-top:12px;border-top:1px solid var(--border);padding-top:8px">
      Прирост база→пик: <b style="color:${rampPct>0?"#00c853":"#888"}">+${rampPct}%</b> · WD ×${peak.wdMult.toFixed(2)} · Крит ×${peak.critAvg.toFixed(2)} · HS ×${peak.hsM.toFixed(2)} · RPM ${Math.round(peak.rpm_f)} · Маг ${peak.mag_f}
    </div>
    <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:10px">
      <h4 style="margin:0 0 6px;font-size:11px;color:var(--orange);text-transform:uppercase;letter-spacing:.5px">💥 Урон за выстрел (для сверки с манекеном в игре)</h4>
      ${(()=>{
        // Считаем урон per-shot на ФУЛ стаках
        const wdMultPeak=peak.wdMult;
        const chdVal=mCHD/100; // CHD input без базового 25%
        const hsdVal=mHSD/100;
        const ampMult=(1+mAMP/100); // без talAmp — уже в WD
        const expMult=(1+mEXP/100);
        const oocM=1+mOOCeff/100;
        const dtaM=1+mDTAeff/100;
        const baseShot=Math.round(wpn.dmg*wdMultPeak*oocM*dtaM*ampMult*expMult);
        const critShot=Math.round(baseShot*(1+chdVal));
        const hsShot=Math.round(baseShot*(1+hsdVal));
        const critHsShot=Math.round(baseShot*(1+chdVal)*(1+hsdVal));
        return `<table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead><tr style="color:var(--muted);font-size:10px;text-transform:uppercase">
            <th style="text-align:left;padding:4px 6px">Тип выстрела</th>
            <th style="text-align:right;padding:4px 6px">Урон</th>
            <th style="text-align:left;padding:4px 6px;color:#666">Формула</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding:4px 6px">Обычный (не крит, в тело)</td><td style="text-align:right;padding:4px 6px;font-weight:700">${baseShot.toLocaleString("ru")}</td><td style="padding:4px 6px;color:#666;font-size:10px">база × WD × OoC × DtA × Amp</td></tr>
            <tr><td style="padding:4px 6px">Крит</td><td style="text-align:right;padding:4px 6px;font-weight:700;color:var(--yellow)">${critShot.toLocaleString("ru")}</td><td style="padding:4px 6px;color:#666;font-size:10px">обычный × ${(1+chdVal).toFixed(2)}</td></tr>
            <tr><td style="padding:4px 6px">В голову (без крита)</td><td style="text-align:right;padding:4px 6px;font-weight:700;color:var(--blue)">${hsShot.toLocaleString("ru")}</td><td style="padding:4px 6px;color:#666;font-size:10px">обычный × ${(1+hsdVal).toFixed(2)}</td></tr>
            <tr><td style="padding:4px 6px">Крит в голову (макс)</td><td style="text-align:right;padding:4px 6px;font-weight:700;color:var(--orange)">${critHsShot.toLocaleString("ru")}</td><td style="padding:4px 6px;color:#666;font-size:10px">обычный × ${((1+chdVal)*(1+hsdVal)).toFixed(2)}</td></tr>
          </tbody>
        </table>
        <div style="font-size:10px;color:var(--muted);margin-top:4px">Сравни с цифрами над врагом в игре на фул стаках. Формула верифицирована по замерам на манекене.</div>`;
      })()}
    </div>`;

  document.getElementById("b-results-sect").style.display="block";
  document.getElementById("b-ttk-sect").style.display="block";

  // Top compact result panel
  const topN=document.getElementById("b-top-nums");
  const topSect=document.getElementById("b-result-top");
  if(topN&&topSect){
    topN.innerHTML=`
      <div class="rtn-base">
        <div class="rtn-val">${Math.round(baseDPS).toLocaleString("ru")}</div>
        <div class="rtn-lbl">База · без стаков</div>
      </div>
      <div class="rtn-avg">
        <div class="rtn-val">${Math.round(avgDPS10).toLocaleString("ru")}</div>
        <div class="rtn-lbl">Средний · 10с бой</div>
      </div>
      <div class="rtn-peak">
        <div class="rtn-val">${Math.round(maxDPS).toLocaleString("ru")}</div>
        <div class="rtn-lbl">Пик · фул стаки</div>
      </div>`;
    topSect.style.display="block";
  }

  // Store for publish flow
  window._lastBuildDPS={base:baseDPS,avg:avgDPS10,peak:maxDPS};
  // Build validation
  runBuildValidation({wpn,cnt,hasChest,hasBP,brandCnt,tCHC,tWD,tHSD,tROF,namedItems,slotState});
  // Stat weights — what to level up next
  computeBuildWeights({wpn,tWD,tROF,tMAG,tCHC,tCHD,tHSD,tRELOAD,mHSR,mOOC:mOOCeff,mDTA:mDTAeff,activeStacks,hasChest,hasBP,tPeakOnly,maxDPS});
  // Autosave last state
  try{localStorage.setItem("d2calc_last",JSON.stringify(getBuildState()))}catch(e){}
}

// Compute stat weights: +1% per stat → DPS delta at peak
function computeBuildWeights(ctx){
  const {wpn,tWD,tROF,tMAG,tCHC,tCHD,tHSD,tRELOAD,mHSR,mOOC,mDTA,activeStacks,hasChest,hasBP,tPeakOnly,maxDPS}=ctx;
  if(!wpn||!maxDPS)return;
  // Helper to call dpsAtTime at peak (Infinity) with modified totals
  const calcPeak=(wd,rof,mag,chc,chd,hsd)=>{
    const r=dpsAtTime(wpn,wd+tPeakOnly.wd,rof+tPeakOnly.rof,mag+tPeakOnly.mag,chc+tPeakOnly.chc,chd+tPeakOnly.chd,hsd+tPeakOnly.hsd,mHSR,tRELOAD,mOOC,mDTA,activeStacks,hasChest,hasBP,Infinity);
    return r.dps;
  };
  const base=calcPeak(tWD,tROF,tMAG,tCHC,tCHD,tHSD);
  const STAT_TIP_KEYS={"WD":1,"CHC":1,"CHD":1,"HSD":1,"RPM":1,"MAG":1};
  function wrapStatK(k){return STAT_TIP_KEYS[k]?`<span class="stat-tip" data-stat="${k}">${k}</span>`:k}
  const weights=[
    {k:"WD",d:calcPeak(tWD+1,tROF,tMAG,tCHC,tCHD,tHSD)-base},
    {k:"CHC",d:calcPeak(tWD,tROF,tMAG,tCHC+1,tCHD,tHSD)-base},
    {k:"CHD",d:calcPeak(tWD,tROF,tMAG,tCHC,tCHD+1,tHSD)-base},
    {k:"HSD",d:mHSR>0?calcPeak(tWD,tROF,tMAG,tCHC,tCHD,tHSD+1)-base:0},
    {k:"RPM",d:calcPeak(tWD,tROF+1,tMAG,tCHC,tCHD,tHSD)-base},
    {k:"Магазин",d:calcPeak(tWD,tROF,tMAG+1,tCHC,tCHD,tHSD)-base},
  ];
  weights.sort((a,b)=>b.d-a.d);
  const maxD=Math.max(...weights.map(w=>w.d));
  const body=document.getElementById("b-weights-body");
  const sect=document.getElementById("b-weights-sect");
  if(!body||!sect)return;
  sect.style.display="block";
  body.innerHTML=weights.map((w,i)=>{
    const pct=maxD>0?Math.round(w.d/maxD*100):0;
    const pctDps=base>0?(w.d/base*100).toFixed(2):"0.00";
    const best=i===0&&w.d>0?' w-best':'';
    const bar=`<div class="w-bar-bg"><div class="w-bar" style="width:${pct}%"></div></div>`;
    return`<tr><td class="${best}">${i===0&&w.d>0?"⭐ ":""}${wrapStatK(w.k)}</td><td>+${Math.round(w.d).toLocaleString("ru")}</td><td>${bar}</td><td>+${pctDps}%</td></tr>`;
  }).join("");
  if(typeof updateStatTooltips==="function")updateStatTooltips();
}

// Returns list of warning objects: {level:'err'|'warn'|'info', text:string}
function runBuildValidation(ctx){
  const warns=[];
  const {wpn,cnt,hasChest,hasBP,brandCnt,tCHC,tWD,tHSD,tROF,namedItems,slotState}=ctx;

  // Count filled slots
  const filledCount=Object.values(slotState).filter(x=>x).length;
  if(filledCount<6){
    warns.push({level:"warn",text:`Заполнено ${filledCount}/6 слотов брони. Ты теряешь часть характеристик.`});
  }

  // CHC cap check
  if(tCHC>60){
    warns.push({level:"warn",text:`Шанс крита <b>${Math.round(tCHC)}%</b> превышает soft-cap 60%. Избыточные <b>${Math.round(tCHC-60)}%</b> пропадают впустую — перебрось их в CHD/WD/HSD.`});
  }

  // Set piece checks
  for(const[nm,count] of Object.entries(cnt)){
    const def=SB[nm];if(!def)continue;
    if(count===1){
      warns.push({level:"info",text:`"${nm}" — только 1шт, все бонусы сета (p2/p3/p4) неактивны. Либо добери, либо убери.`});
    }else if(count===2&&def.p4&&def.p4!=="stacks"){
      // OK 2pc
    }else if(count===3&&def.p4){
      // Has 3pc, 4pc missing — only tell if 4pc is meaningful
      if(def.p4==="stacks"||(typeof def.p4==="object"&&Object.keys(def.p4).length>0)){
        warns.push({level:"info",text:`"${nm}" — 3шт, активны p2+p3. До 4шт остался 1 предмет — это даст основной эффект сета (стаки/бонус).`});
      }
    }
    // Stack chest/bp checks
    if(def.stacks&&count>=4){
      if(!hasChest[nm]&&def.stacks.max_chest){
        warns.push({level:"info",text:`"${nm}" 4pc — сет-стаки активны. Нагрудник этого сета расширит макс до <b>${def.stacks.max_chest}</b> (сейчас ${def.stacks.max_base}).`});
      }
      if(!hasBP[nm]&&(def.stacks.wd_bp||def.stacks.chd_bp_extra)){
        const bonus=def.stacks.wd_bp?`+${(def.stacks.wd_bp-def.stacks.wd_base).toFixed(1)}% WD/стак`:`+${def.stacks.chd_bp_extra}% CHD/стак`;
        warns.push({level:"info",text:`"${nm}" — рюкзак этого сета усилит стаки: ${bonus}.`});
      }
    }
  }

  // Brand: 1pc is fine (gives its single-piece bonus), no warning.
  // Only note if 2pc skipped when there are 3 of the same brand — unlikely in practice.

  // Weapon cat mismatch with set type damage
  if(wpn&&wpn.cat){
    for(const[nm,count] of Object.entries(cnt)){
      const def=SB[nm];if(!def)continue;
      [def.p2,def.p3].forEach(b=>{
        if(b&&typeof b==="object"&&b.type_dmg&&b.type){
          const match=b.type.split("+").some(t=>wpn.cat===t||wpn.cat.includes(t));
          if(!match&&count>=2){
            warns.push({level:"warn",text:`Бонус сета "${nm}" даёт +${b.type_dmg}% урона ${b.type}, но у тебя <b>${wpn.cat}</b> — бонус не работает.`});
          }
        }
      });
    }
  }

  // Empty chest/bp for stack sets
  const stackSets=Object.entries(cnt).filter(([nm,c])=>c>=4&&SB[nm]&&SB[nm].stacks);
  if(stackSets.length===0&&filledCount>=4){
    warns.push({level:"info",text:"В билде нет сетов со стаками — рассмотри Страйкер/Tipping Scales/Умбра/Точка разрыва для роста DPS во времени."});
  }

  // Publish-ready check
  if(filledCount===6&&warns.filter(w=>w.level==="warn").length===0){
    warns.push({level:"ok",text:"✓ Билд полностью собран. Нет критичных предупреждений. Можно публиковать через 🚀."});
  }

  // Render
  const el=document.getElementById("b-warnings");
  const sect=document.getElementById("b-warnings-sect");
  if(!el||!sect)return;
  if(warns.length===0){sect.style.display="none";return}
  sect.style.display="block";
  const colors={err:"#ef5350",warn:"#f5a623",info:"#42a5f5",ok:"#00c853"};
  const icons={err:"✗",warn:"⚠",info:"💡",ok:"✓"};
  el.innerHTML=warns.map(w=>
    `<div style="padding:8px 12px;border-radius:7px;background:${colors[w.level]}1a;border-left:3px solid ${colors[w.level]};font-size:12px;line-height:1.4;color:var(--text)">
      <b style="color:${colors[w.level]};margin-right:6px">${icons[w.level]}</b>${w.text}
    </div>`
  ).join("");
}

// ===== TTK =====
const ENEMY_HP = D2DATA.ENEMY_HP;
let ttkDiff="heroic";
let ttkPlayers=1;
const TTK_DIFF_NAME_MAP = (function(){
  const m = {};
  const diffs = (ENEMY_HP && ENEMY_HP.difficulties) || [];
  const pairs = [
    ["normal",   n => n.includes("СРЕД")],
    ["high",     n => n.includes("ВЫСО")],
    ["challenging", n => n.includes("ИСПЫ")],
    ["heroic",   n => n.includes("ГЕРО")],
    ["legendary",n => n.includes("ЛЕГЕН")],
  ];
  for(const d of diffs){
    const name=(d.name||"").toUpperCase();
    for(const [key,fn] of pairs){
      if(fn(name)){ m[key]=d; break; }
    }
  }
  return m;
})();
// Escalation tier → HP/armor multiplier (datamined from Y8S1 TU28, r/thedivision)
const ESCALATION_TIERS = D2DATA.ESCALATION_TIERS;
const ESCALATION_DROP_CHANCE = D2DATA.ESCALATION_DROP_CHANCE;
const PROTO_UPGRADE_COST = D2DATA.PROTO_UPGRADE_COST;
const PROTO_REROLL_COST = D2DATA.PROTO_REROLL_COST;
const PROTO_ROLL_CHANCE = D2DATA.PROTO_ROLL_CHANCE;
const ESCALATION_MUTATORS = D2DATA.ESCALATION_MUTATORS;
const ESCALATION_REWARDS = D2DATA.ESCALATION_REWARDS;
function setEscalationTier(tier){
  const t=ESCALATION_TIERS[tier];
  if(!t)return;
  setInput("ttk-hp-mult",t.hp);
  setInput("ttk-ar-mult",t.ar);
  onTtkMultChange();
}
let lastDps={base:0,avg:0,peak:0};
function setTtkDiff(d){
  ttkDiff=d;
  const sel=document.getElementById("ttk-diff");
  if(sel && sel.value!==d) sel.value=d;
  renderTtk(lastDps.base,lastDps.avg,lastDps.peak);
}
function setTtkPlayers(n){
  ttkPlayers=parseInt(n,10)||1;
  const sel=document.getElementById("ttk-players");
  if(sel && sel.value!==String(ttkPlayers)) sel.value=String(ttkPlayers);
  renderTtk(lastDps.base,lastDps.avg,lastDps.peak);
}
function fmtTime(s){
  if(!isFinite(s)||s<=0)return "∞";
  if(s<1)return (s*1000|0)+"мс";
  if(s<60)return s.toFixed(1)+"с";
  return Math.floor(s/60)+"м "+Math.round(s%60)+"с";
}
function ttkColor(s){
  if(s<2)return "#00c853";
  if(s<5)return "#9ccc65";
  if(s<10)return "#fdd835";
  if(s<20)return "#ff9800";
  return "#ef5350";
}
function onTtkMultChange(){
  renderTtk(lastDps.base,lastDps.avg,lastDps.peak);
}
function clamp(x,lo,hi){return Math.max(lo,Math.min(hi,x))}
function renderTtk(base,avg,peak){
  lastDps={base,avg,peak};
  const hpMult=clamp(parseFloat(document.getElementById("ttk-hp-mult")?.value)||0,0,800);
  const arMult=clamp(parseFloat(document.getElementById("ttk-ar-mult")?.value)||0,0,800);
  const hasBoost=hpMult>0||arMult>0;
  const pKey="p"+ttkPlayers;
  const diffRow=TTK_DIFF_NAME_MAP[ttkDiff];
  const enemyTypesRu=ENEMY_HP.enemy_types_ru||{normal:"Рядовые",veteran:"Ветераны",elite:"Элитные",named:"Именные"};
  const typeIcons={normal:"🔴",veteran:"🟣",elite:"🟠",named:"🟡"};
  let enemies;
  if(diffRow && diffRow.health && diffRow.armor){
    enemies=["normal","veteran","elite","named"].map(t=>{
      const hp=(diffRow.health[t]&&diffRow.health[t][pKey])||0;
      const ar=(diffRow.armor[t]&&diffRow.armor[t][pKey])||0;
      return { name:`${typeIcons[t]||""} ${enemyTypesRu[t]||t}`, hp:hp, armor:ar };
    });
  } else {
    enemies=ENEMY_HP.types||ENEMY_HP[ttkDiff]||[];
  }
  const body=enemies.map(e=>{
    const baseEhp=(e.hp||0)+(e.armor||0);
    const ehp=(e.hp||0)*(1+hpMult/100)+(e.armor||0)*(1+arMult/100);
    const tb=base>0?ehp/base:Infinity;
    const ta=avg>0?ehp/avg:Infinity;
    const tp=peak>0?ehp/peak:Infinity;
    const hpLabel=hasBoost?`${(ehp/1e6).toFixed(1)}М <span style="font-size:10px;color:#555">(было ${(baseEhp/1e6).toFixed(1)}М)</span>`:`${(baseEhp/1e6).toFixed(1)}М`;
    return`<tr>
      <td style="text-align:left">${e.name}</td>
      <td>${hpLabel}</td>
      <td style="color:${ttkColor(tb)}">${fmtTime(tb)}</td>
      <td style="color:${ttkColor(ta)};font-weight:700">${fmtTime(ta)}</td>
      <td style="color:${ttkColor(tp)};font-weight:700">${fmtTime(tp)}</td>
    </tr>`;
  }).join("");
  document.getElementById("ttk-body").innerHTML=body;
}

// ===== WIKI LINKS =====
// English names → fandom wiki search (stable, no 404s)
function wikiLink(enName){
  if(!enName)return "";
  return "https://thedivision.fandom.com/wiki/Special:Search?query="+encodeURIComponent(enName);
}
function wikiIcon(enName){
  if(!enName)return "";
  return `<a href="${wikiLink(enName)}" target="_blank" rel="noopener" title="Open on Fandom Wiki (EN) / Открыть в Фандом Вики (EN)" style="color:var(--blue);text-decoration:none;margin-left:6px;font-size:11px;opacity:.7" onclick="event.stopPropagation()">📖</a>`;
}

// ===== TRANSLATIONS (loaded lazily from translations_en.json) =====
let __translations=null;
let __translationsLoading=null;
function loadTranslations(){
  if(__translations)return Promise.resolve(__translations);
  if(__translationsLoading)return __translationsLoading;
  __translationsLoading=fetch("translations_en.json").then(r=>r.ok?r.json():null).then(j=>{
    __translations=j||{sets:{},brands:{},exotics:{},named:{}};
    return __translations;
  }).catch(()=>{
    __translations={sets:{},brands:{},exotics:{},named:{}};
    return __translations;
  });
  return __translationsLoading;
}
// Preload on page load so it's ready when user toggles language
loadTranslations();

function getEnDescription(type,enName){
  if(!__translations||!enName)return null;
  const bucket=__translations[type];
  if(!bucket||!bucket[enName])return null;
  return bucket[enName];
}
// Authoritative talent description (from faildruid/division-2-db — real in-game text)
// Takes English talent name (e.g. "Perfect Vigilance") and returns official description
function getAuthoritativeTalent(talEn){
  if(!__translations||!talEn)return null;
  const a=__translations.talents_authoritative;
  if(!a)return null;
  return a[talEn]||null;
}

const STAT_TOOLTIPS = D2DATA.STAT_TOOLTIPS;
function updateStatTooltips(){
  document.querySelectorAll(".stat-tip").forEach(el=>{
    const key=el.dataset.stat;
    if(STAT_TOOLTIPS[currentLang]&&STAT_TOOLTIPS[currentLang][key])
      el.title=STAT_TOOLTIPS[currentLang][key];
  });
}

// ===== LANGUAGE SWITCHER =====
// currentLang declared earlier (TDZ fix) — reassign here to ensure localStorage value
currentLang=localStorage.getItem("d2calc_lang")||"ru";
function updateLangBtn(){
  const btn=document.getElementById("lang-btn");
  if(!btn)return;
  btn.textContent=currentLang==="ru"?"🇷🇺 RU":"🇬🇧 EN";
}
async function toggleLang(){
  currentLang=currentLang==="ru"?"en":"ru";
  localStorage.setItem("d2calc_lang",currentLang);
  updateLangBtn();
  updateStatTooltips();
  if(currentLang==="en")await loadTranslations();
  // Re-init slot buttons + talent selects to re-render labels
  try{Object.keys(slotState).forEach(updateSlotBtn);}catch(e){}
  try{
    const chestSel=document.getElementById("b-chest-talent");
    const bpSel=document.getElementById("b-bp-talent");
    if(chestSel)chestSel.innerHTML='<option value="">— не выбран —</option>';
    if(bpSel)bpSel.innerHTML='<option value="">— не выбран —</option>';
    initGearTalentSelects();
  }catch(e){}
  try{
    const talSel=document.getElementById("b-wpn-tal");
    if(talSel&&typeof WEAPON_TALENTS_FULL!=='undefined'){
      const prev=talSel.value;
      talSel.innerHTML='<option value="none">— нет —</option>'+Object.entries(WEAPON_TALENTS_FULL).map(([k,v])=>{const label=currentLang==='en'?(v.name_en||v.name_ru):(v.name_ru||v.name_en);return`<option value="${k}">${label}</option>`}).join("");
      talSel.value=prev;
    }
  }catch(e){}
  if(typeof render==="function")render();
  if(activeCat==="build")calcBuild();
  if(activeCat==="community")loadCommunityFeed();
}
updateLangBtn();
updateStatTooltips();

// Init build slots from gear set data
initBuildSlots();
initGearTalentSelects();

// Lazy-load Recombinator modifiers reference (Y8S1 Rise Up)
let __rcmCache=null;
async function loadRecombinatorRef(){
  if(__rcmCache)return __rcmCache;
  try{
    const r=await fetch("recombinator_modifiers.json");
    if(!r.ok)return null;
    __rcmCache=await r.json();
    return __rcmCache;
  }catch(e){return null}
}
let __simRendered=false;
async function initRecomSim(){
  if(__simRendered)return;
  __simRendered=true;
  const el=document.getElementById("recom-sim");
  if(!el)return;
  const mods=await loadRecombinatorRef();
  if(!mods||!mods.length){el.innerHTML='<i>Не удалось загрузить модификаторы</i>';return}
  const cats={Offense:[],Defense:[],Utility:[],Wildcard:[]};
  for(const m of mods){if(cats[m.category])cats[m.category].push(m)}
  const catColors={Offense:"#ef5350",Defense:"#42a5f5",Utility:"#fdd835",Wildcard:"#ce93d8"};
  const catLabels={Offense:"⚔ Offense",Defense:"🛡 Defense",Utility:"🔧 Utility",Wildcard:"⭐ Wildcard"};
  let optionsHtml='<option value="">— нет —</option>';
  for(const cat of["Offense","Defense","Utility","Wildcard"]){
    optionsHtml+=`<optgroup label="${catLabels[cat]}">`;
    for(const m of cats[cat]){
      optionsHtml+=`<option value="${m.id}">${m.icon||""} ${m.name} (${cat})</option>`;
    }
    optionsHtml+=`</optgroup>`;
  }
  let html=`<div class="rsim-bars">`;
  for(const [key,label,color] of[["offense","Offense","#ef5350"],["defense","Defense","#42a5f5"],["utility","Utility","#fdd835"]]){
    html+=`<div class="rsim-bar-row">
      <div class="rsim-bar-label" style="color:${color}">${label}</div>
      <div class="rsim-bar-track"><div class="rsim-bar-fill" id="rsim-fill-${key}" style="background:${color};width:0%"></div><span class="rsim-bar-val" id="rsim-val-${key}">0</span></div>
    </div>`;
  }
  html+=`</div><div class="rsim-warning" id="rsim-warning"></div><div class="rsim-tiers">`;
  for(let t=1;t<=10;t++){
    html+=`<div class="rsim-tier-row">
      <div class="rsim-tier-label">Tier ${t}</div>
      <select class="rsim-tier-sel" id="rsim-t${t}" onchange="recalcRecomSim()">${optionsHtml}</select>
      <div class="rsim-tier-eff" id="rsim-eff${t}"></div>
    </div>`;
  }
  html+=`</div><div id="rsim-bonuses"></div>
  <button class="rsim-apply-btn" onclick="applyRecomSimToBuild()">Применить к билду (HSD + Патроны)</button>`;
  el.innerHTML=html;
  recalcRecomSim();
}

function _rsimGetMod(id){
  if(!__rcmCache)return null;
  return __rcmCache.find(m=>m.id===id)||null;
}

function recalcRecomSim(){
  if(!__rcmCache)return;
  const stacks={offense:0,defense:0,utility:0};
  const potency={offense:1,defense:1,utility:1};
  const locked={offense:false,defense:false,utility:false};
  const saturated={offense:false,defense:false,utility:false};
  const converts={offense:null,defense:null,utility:null};
  const history={offense:[],defense:[],utility:[]};
  const warnings=[];
  let approx=false;

  const keyMap={Offense:"offense",Defense:"defense",Utility:"utility"};
  const otherTwo={offense:["defense","utility"],defense:["offense","utility"],utility:["offense","defense"]};

  for(let t=1;t<=10;t++){
    const sel=document.getElementById("rsim-t"+t);
    if(!sel)continue;
    const modId=sel.value;
    if(!modId){document.getElementById("rsim-eff"+t).textContent="";continue}
    const mod=_rsimGetMod(modId);
    if(!mod){document.getElementById("rsim-eff"+t).textContent="";continue}

    const cat=mod.category==="Wildcard"?null:keyMap[mod.category];
    const effType=mod.effectType;

    if(effType==="none"||effType==="saturate"||effType==="redistribute"){
      for(const sc of(mod.stackChanges||[])){
        const k=keyMap[sc.cat];
        if(k&&!locked[k]){
          stacks[k]+=sc.amount;
          history[k].push(sc.amount);
          if(stacks[k]<0)stacks[k]=0;
        }
      }
      if(effType==="saturate"&&cat)saturated[cat]=true;
    } else if(effType==="compress"){
      if(cat&&!locked[cat]){
        const sc=(mod.stackChanges||[]).find(x=>keyMap[x.cat]===cat);
        if(sc){stacks[cat]+=sc.amount;history[cat].push(sc.amount);if(stacks[cat]<0)stacks[cat]=0;}
        potency[cat]*=1.5;
      }
    } else if(effType==="convert"){
      if(cat)converts[cat]=mod.id;
    } else if(effType==="stabilize"){
      if(cat)locked[cat]=true;
    } else if(effType==="invert"){
      if(cat){
        const others=otherTwo[cat];
        const maxOther=Math.max(stacks[others[0]],stacks[others[1]]);
        if(stacks[others[0]]===stacks[others[1]]||stacks[cat]>=maxOther){
          warnings.push(`T${t} Invert — не сработал (условие не выполнено)`);
        } else {
          const highKey=stacks[others[0]]>stacks[others[1]]?others[0]:others[1];
          if(!locked[cat]&&!locked[highKey]){
            const tmp=stacks[cat];stacks[cat]=stacks[highKey];stacks[highKey]=tmp;
            history[cat].push(0);history[highKey].push(0);
          }
        }
      }
    } else if(effType==="pivot"){
      if(cat&&!locked[cat]){
        const others=otherTwo[cat];
        const lowKey=stacks[others[0]]<stacks[others[1]]?others[0]:others[1];
        if(stacks[others[0]]===stacks[others[1]]){
          approx=true;
        } else {
          if(!locked[lowKey]){
            const boost=Math.floor(stacks[cat]/2);
            stacks[lowKey]+=boost;history[lowKey].push(boost);
          }
        }
      }
    } else if(effType==="nullify"){
      const minVal=Math.min(stacks.offense,stacks.defense,stacks.utility);
      const ties=[["offense","defense","utility"].filter(k=>stacks[k]===minVal)];
      if(ties[0].length>1){
        warnings.push(`T${t} Nullify — не сработал (два и более модуля на минимуме)`);
      } else {
        const lowKey=ties[0][0];
        if(!locked[lowKey]){
          const delta=history[lowKey].reduce((a,b)=>a+b,0);
          stacks[lowKey]-=delta*2;
          if(stacks[lowKey]<0)stacks[lowKey]=0;
          history[lowKey]=[];
        }
      }
    } else if(effType==="cascade"){
      const vals=[["offense",stacks.offense],["defense",stacks.defense],["utility",stacks.utility]];
      vals.sort((a,b)=>b[1]-a[1]);
      if(vals[0][1]===vals[1][1]){
        warnings.push(`T${t} Cascade — не сработал (два модуля с одинаковым максимумом)`);
      } else {
        const highKey=vals[0][0];
        const bonus=Math.ceil(stacks[highKey]/2);
        saturated[highKey]=true;
        for(const [k] of vals.slice(1)){if(!locked[k]){stacks[k]+=bonus;history[k].push(bonus);}}
      }
    } else if(effType==="converge"){
      const vals=[["offense",stacks.offense],["defense",stacks.defense],["utility",stacks.utility]];
      vals.sort((a,b)=>a[1]-b[1]);
      if(vals[0][1]===vals[1][1]){
        warnings.push(`T${t} Converge — не сработал (два модуля на минимуме)`);
      } else {
        const lowKey=vals[0][0];
        const avg=Math.floor((stacks[vals[1][0]]+stacks[vals[2][0]])/2);
        if(!locked[lowKey]){stacks[lowKey]=avg;history[lowKey]=[avg];}
        for(const [k] of vals.slice(1)){if(!locked[k]){stacks[k]=0;history[k]=[];}}
      }
    } else if(effType==="equalize"){
      const sorted=[stacks.offense,stacks.defense,stacks.utility].slice().sort((a,b)=>a-b);
      const med=sorted[1];
      if(sorted[0]===sorted[1]||sorted[1]===sorted[2]){
        warnings.push(`T${t} Equalize — не сработал (медиана не уникальна)`);
      } else {
        for(const k of["offense","defense","utility"]){if(!locked[k]){stacks[k]=med;history[k]=[med];}}
      }
    } else {
      approx=true;
    }

    const effParts=[];
    effParts.push(`O${stacks.offense>=0?"+":""}${stacks.offense-stacks.offense} D${stacks.defense>=0?"+":""}${0} U${stacks.utility>=0?"+":""}${0}`);
    const delta={offense:0,defense:0,utility:0};
    for(const sc of(mod.stackChanges||[])){const k=keyMap[sc.cat];if(k)delta[k]+=sc.amount;}
    let effStr="";
    for(const [k,label] of[["offense","O"],["defense","D"],["utility","U"]]){
      const d=delta[k];
      if(d!==0)effStr+=`${label}${d>0?"+":""}${d} `;
    }
    if(effType==="compress")effStr+="×1.5";
    if(effType==="stabilize")effStr+="🔒";
    if(effType==="convert")effStr+="→"+mod.stats?.[0]?.stat||"";
    if(["invert","pivot","nullify","cascade","converge","equalize"].includes(effType))effStr=effType;
    document.getElementById("rsim-eff"+t).textContent=effStr.trim()||mod.effectType;
  }

  const maxStack=Math.max(stacks.offense,stacks.defense,stacks.utility,50);
  for(const [k,id] of[["offense","offense"],["defense","defense"],["utility","utility"]]){
    const fill=document.getElementById("rsim-fill-"+id);
    const val=document.getElementById("rsim-val-"+id);
    if(fill&&val){
      fill.style.width=Math.min(100,Math.max(2,(stacks[k]/maxStack)*100))+"%";
      val.textContent=stacks[k];
    }
  }

  const warn=document.getElementById("rsim-warning");
  if(warn)warn.textContent=warnings.join(" · ");

  const bonusEl=document.getElementById("rsim-bonuses");
  if(!bonusEl)return;

  const statLabels={weaponHandling:"Weapon Handling",headshotDamage:"Headshot Damage",magazineSize:"Magazine Size",totalArmor:"Total Armor",protectionFromElites:"Protection from Elites",hazardProtection:"Hazard Protection",skillDamage:"Skill Damage",skillRepair:"Skill Repair",statusEffects:"Status Effects"};
  const statUnits={weaponHandling:"%",headshotDamage:"%",magazineSize:"%",totalArmor:"%",protectionFromElites:"%",hazardProtection:"%",skillDamage:"%",skillRepair:"%",statusEffects:"%"};

  const results=[];
  function calcModule(key,defaultStat,perStack){
    if(saturated[key])return{stat:defaultStat,value:0,note:"saturated"};
    const convId=converts[key];
    let stat=defaultStat,rate=perStack;
    if(convId){
      const cm=_rsimGetMod(convId);
      if(cm&&cm.stats&&cm.stats[0]){stat=cm.stats[0].stat;rate=cm.stats[0].base/10;}
    }
    const val=Math.round(stacks[key]*rate*potency[key]*10)/10;
    return{stat,value:val,note:convId?_rsimGetMod(convId)?.name||"":null,approx};
  }
  results.push({module:"Offense",color:"#ef5350",...calcModule("offense","weaponHandling",1)});
  results.push({module:"Defense",color:"#42a5f5",...calcModule("defense","totalArmor",0.5)});
  results.push({module:"Utility",color:"#fdd835",...calcModule("utility","skillDamage",1)});

  let tbl=`<table class="rsim-bonus-table"><thead><tr><th>Модуль</th><th>Стат</th><th>Итого</th><th>Тип</th></tr></thead><tbody>`;
  for(const r of results){
    tbl+=`<tr>
      <td style="color:${r.color};font-weight:700">${r.module}</td>
      <td>${statLabels[r.stat]||r.stat}</td>
      <td style="font-weight:700;color:${r.color}">+${r.value}${statUnits[r.stat]||""}${r.approx?` <span class="rsim-approx">(≈)</span>`:""}</td>
      <td style="color:#888;font-size:10px">${r.note||"default"}${r.note==="saturated"?` <span style="color:#ef5350">SATURATED</span>`:""}</td>
    </tr>`;
  }
  tbl+=`</tbody></table>`;
  bonusEl.innerHTML=tbl;
  bonusEl.__simData={results,stacks,converts,potency};
}

function applyRecomSimToBuild(){
  const el=document.getElementById("rsim-bonuses");
  if(!el||!el.__simData)return;
  const {results}=el.__simData;
  const hsdR=results.find(r=>r.stat==="headshotDamage");
  const ammoR=results.find(r=>r.stat==="magazineSize");
  if(hsdR&&hsdR.value){setInput("rc-hsd",hsdR.value);}
  if(ammoR&&ammoR.value){setInput("rc-ammo",ammoR.value);}
  calcBuild();
}

async function renderRecombinatorRef(){
  const el=document.getElementById("rcm-reference");
  if(!el)return;
  const mods=await loadRecombinatorRef();
  if(!mods||!mods.length){el.innerHTML='<i>Не удалось загрузить</i>';return}
  const cats={Offense:[],Defense:[],Utility:[],Wildcard:[]};
  for(const m of mods){if(cats[m.category])cats[m.category].push(m)}
  const colors={Offense:"#ef5350",Defense:"#42a5f5",Utility:"#fdd835",Wildcard:"#ce93d8"};
  const labels={Offense:"⚔ Атакующие (Offense)",Defense:"🛡 Защитные (Defense)",Utility:"🔧 Вспомогательные (Utility)",Wildcard:"⭐ Универсальные (Wildcard)"};
  let html="";
  for(const cat of Object.keys(cats)){
    if(!cats[cat].length)continue;
    html+=`<div style="margin-top:8px;color:${colors[cat]};font-weight:700;font-size:11px;text-transform:uppercase">${labels[cat]}</div>`;
    for(const m of cats[cat]){
      const stacks=m.stackChanges?m.stackChanges.map(s=>`${s.cat[0]}${s.amount>0?"+":""}${s.amount}`).join(" "):"";
      const stat=m.stats&&m.stats[0]?`+${m.stats[0].base}% ${m.stats[0].stat}`:"";
      html+=`<div style="margin:6px 0;padding:6px 8px;background:rgba(255,255,255,.03);border-left:2px solid ${colors[cat]};border-radius:4px">
        <div style="font-size:12px;color:var(--text);font-weight:600">${m.icon||""} ${m.name} <span style="color:#555;font-weight:400">${stacks?"["+stacks+"]":""}</span></div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${m.description||""}</div>
        ${m.description_ru?`<div style="font-size:10px;color:#9ccc65;margin-top:2px">🇷🇺 ${m.description_ru}</div>`:""}
        ${stat?`<div style="font-size:10px;color:var(--orange);margin-top:2px">→ ${stat}</div>`:""}
      </div>`;
    }
  }
  el.innerHTML=html;
}
// Render when details opened
document.addEventListener("click",e=>{
  if(e.target.closest("details>summary")&&e.target.closest("details").querySelector("#rcm-reference")){
    setTimeout(renderRecombinatorRef,50);
  }
  if(e.target.closest("details>summary")&&e.target.closest("details").id==="esc-ref-details"){
    setTimeout(renderEscalationRef,50);
  }
  if(e.target.closest("details>summary")&&e.target.closest("details").id==="recom-sim-details"){
    setTimeout(initRecomSim,50);
  }
});
let __escRefRendered=false;
function renderEscalationRef(){
  if(__escRefRendered)return;
  const el=document.getElementById("esc-ref-content");
  if(!el)return;
  __escRefRendered=true;
  const tblStyle="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px";
  const thStyle="background:rgba(255,255,255,.06);padding:4px 8px;text-align:center;border:1px solid var(--border);color:var(--orange);font-weight:700";
  const tdStyle="padding:4px 8px;text-align:center;border:1px solid var(--border)";
  const tdAlt="padding:4px 8px;text-align:center;border:1px solid var(--border);background:rgba(255,255,255,.03)";
  let h="";
  h+=`<div style="font-weight:700;color:var(--orange);margin-bottom:6px;font-size:12px">Difficulty Scaling</div>`;
  h+=`<table style="${tblStyle}"><thead><tr>`;
  for(const c of["Тир","Deposit","Profit","Group","Enemy DMG","Enemy HP","Enemy AR","Drop %"])h+=`<th style="${thStyle}">${c}</th>`;
  h+=`</tr></thead><tbody>`;
  for(let i=0;i<=10;i++){
    const t=ESCALATION_TIERS[String(i)]||{hp:0,ar:0,dmg:100};
    const r=ESCALATION_REWARDS[i]||{deposit:0,profit:0,group:0};
    const d=ESCALATION_DROP_CHANCE[i]||0;
    const td=i%2===0?tdStyle:tdAlt;
    h+=`<tr>
      <td style="${td}">${i===0?"Базовый":"T"+i}</td>
      <td style="${td}">${r.deposit}</td>
      <td style="${td}">${r.profit}</td>
      <td style="${td}">${r.group}</td>
      <td style="${td}">${t.dmg}%</td>
      <td style="${td}">+${t.hp}%</td>
      <td style="${td}">+${t.ar}%</td>
      <td style="${td}">${i===0?"—":d.toFixed(2)+"%"}</td>
    </tr>`;
  }
  h+=`</tbody></table>`;
  h+=`<div style="font-weight:700;color:var(--orange);margin-bottom:6px;font-size:12px">Мутаторы по тирам</div>`;
  h+=`<table style="${tblStyle}"><thead><tr>`;
  for(const c of["Тир","Harvester","Suppressor","Anchor","Aid Specialist"])h+=`<th style="${thStyle}">${c}</th>`;
  h+=`</tr></thead><tbody>`;
  for(let i=1;i<=10;i++){
    const m=ESCALATION_MUTATORS[i];
    const td=i%2===0?tdStyle:tdAlt;
    const fmt=v=>v===0?`<span style="color:#555">—</span>`:`${v}%`;
    h+=`<tr>
      <td style="${td}">T${i}</td>
      <td style="${td}">${fmt(m.harvester)}</td>
      <td style="${td}">${fmt(m.suppressor)}</td>
      <td style="${td}">${fmt(m.anchor)}</td>
      <td style="${td}">${fmt(m.aid)}</td>
    </tr>`;
  }
  h+=`</tbody></table>`;
  h+=`<div style="font-weight:700;color:var(--orange);margin-bottom:6px;font-size:12px">Prototype Gear</div>`;
  h+=`<div style="display:flex;gap:16px;flex-wrap:wrap">`;
  h+=`<div><div style="color:var(--muted);font-size:11px;margin-bottom:4px">Стоимость прокачки (Prototype Cores)</div>`;
  h+=`<table style="${tblStyle};margin-bottom:0"><thead><tr><th style="${thStyle}">Уровень</th><th style="${thStyle}">Cores</th></tr></thead><tbody>`;
  for(let i=2;i<=10;i++){
    const td=i%2===0?tdStyle:tdAlt;
    h+=`<tr><td style="${td}">${i-1}→${i}</td><td style="${td}">${PROTO_UPGRADE_COST[i]}</td></tr>`;
  }
  h+=`</tbody></table></div>`;
  h+=`<div><div style="color:var(--muted);font-size:11px;margin-bottom:4px">Стоимость перероллов</div>`;
  h+=`<table style="${tblStyle};margin-bottom:0"><thead><tr><th style="${thStyle}">Ролл</th><th style="${thStyle}">Cores</th></tr></thead><tbody>`;
  for(let i=0;i<PROTO_REROLL_COST.length;i++){
    const td=i%2===0?tdStyle:tdAlt;
    const label=i===PROTO_REROLL_COST.length-1?`${i+1}+`:`${i+1}`;
    h+=`<tr><td style="${td}">${label}</td><td style="${td}">${PROTO_REROLL_COST[i]}</td></tr>`;
  }
  h+=`</tbody></table></div>`;
  h+=`<div><div style="color:var(--muted);font-size:11px;margin-bottom:4px">Шанс макс. роллов</div>`;
  h+=`<table style="${tblStyle};margin-bottom:0"><thead><tr><th style="${thStyle}">Макс. роллов</th><th style="${thStyle}">Шанс</th></tr></thead><tbody>`;
  const rk=Object.keys(PROTO_ROLL_CHANCE);
  for(let i=0;i<rk.length;i++){
    const td=i%2===0?tdStyle:tdAlt;
    h+=`<tr><td style="${td}">${rk[i]}</td><td style="${td}">${PROTO_ROLL_CHANCE[rk[i]]}%</td></tr>`;
  }
  h+=`</tbody></table></div>`;
  h+=`</div>`;
  el.innerHTML=h;
}

// If URL has #b=... hash — auto-switch to BUILD tab so user sees the shared build
if(/^#b=/.test(location.hash)){
  const buildBtn=document.querySelector('.cat-btn[data-cat="build"]');
  if(buildBtn){
    document.querySelectorAll(".cat-btn").forEach(b=>b.classList.remove("active"));
    buildBtn.click();
  }
}else{
  // Default: open Community tab to greet users with the gallery
  const commBtn=document.querySelector('.cat-btn[data-cat="community"]');
  if(commBtn){
    document.querySelectorAll(".cat-btn").forEach(b=>b.classList.remove("active"));
    commBtn.click();
  }
}

// ===== BUG REPORT =====
const FORMSPREE_ENDPOINT="https://formspree.io/f/mlgadraa";
const FORMSPREE_LIMIT=50;
const WARN_THRESHOLD=40;
let bugScreenshotBlob=null;
function bugCounterKey(){
  const d=new Date();
  return "bugs-"+d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
}
async function fetchBugCount(){
  const key=bugCounterKey();
  try{
    const r=await fetch("https://abacus.jasoncameron.dev/get/mokhnatti-d2calc/"+key);
    if(r.ok){const j=await r.json();return j.value||0}
    // key doesn't exist yet this month → create
    const c=await fetch("https://abacus.jasoncameron.dev/create/mokhnatti-d2calc/"+key+"?initializer=0");
    if(c.ok){const j=await c.json();return j.value||0}
  }catch(e){}
  return 0;
}
async function incrementBugCount(){
  const key=bugCounterKey();
  try{await fetch("https://abacus.jasoncameron.dev/hit/mokhnatti-d2calc/"+key)}catch(e){}
}

async function openBugModal(){
  document.getElementById("bug-page-url").value=location.href;
  document.getElementById("bug-ua").value=navigator.userAgent;
  document.getElementById("bug-modal").classList.add("open");
  // Check monthly submission count
  const warn=document.getElementById("bug-limit-warn");
  warn.style.display="none";
  const count=await fetchBugCount();
  if(count>=WARN_THRESHOLD){
    const left=Math.max(0,FORMSPREE_LIMIT-count);
    warn.innerHTML=`⚠ В этом месяце уже <b>${count}</b> репортов через форму (лимит ${FORMSPREE_LIMIT}/мес, осталось ~${left}).<br>Если не срочно — лучше открой <a href="https://github.com/Mokhnatti/division2-calc/issues/new" target="_blank" style="color:var(--orange)">issue на GitHub</a>, там без лимита.`;
    warn.style.display="block";
  }
}
function closeBugModal(){
  document.getElementById("bug-modal").classList.remove("open");
}

async function handleBugFile(file){
  if(!file||!file.type.startsWith("image/"))return;
  const status=document.getElementById("bug-upload-status");
  status.textContent="Сжимаю...";
  const compressed=await compressImage(file,1400,0.78);
  bugScreenshotBlob=compressed;
  const url=URL.createObjectURL(compressed);
  document.getElementById("bug-preview-img").src=url;
  document.getElementById("bug-preview").style.display="block";
  status.textContent="Готов · "+(compressed.size/1024|0)+"КБ (загрузится при отправке)";
}

function compressImage(file,maxW,quality){
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>{
      const ratio=Math.min(1,maxW/img.width);
      const w=Math.round(img.width*ratio),h=Math.round(img.height*ratio);
      const cv=document.createElement("canvas");cv.width=w;cv.height=h;
      cv.getContext("2d").drawImage(img,0,0,w,h);
      cv.toBlob(b=>res(b),"image/jpeg",quality);
    };
    img.src=URL.createObjectURL(file);
  });
}

function blobToBase64(blob){
  return new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(blob)});
}

async function uploadScreenshot(blob){
  const dataUrl=await blobToBase64(blob);
  const base64=dataUrl.split(",")[1];
  const IMGBB_KEY="858a71caf467953cdcc8973e9c438f75";
  try{
    const fd=new FormData();
    fd.append("key",IMGBB_KEY);
    fd.append("image",base64);
    const r=await fetch("https://api.imgbb.com/1/upload",{method:"POST",body:fd});
    if(r.ok){
      const j=await r.json();
      if(j?.data?.url)return{url:j.data.url,method:"imgbb"};
    }
  }catch(e){}
  return{url:"",dataUrl,method:"base64 (встроено)"};
}

async function submitBug(ev){
  ev.preventDefault();
  const form=ev.target;
  const btn=document.getElementById("bug-submit-btn");
  const status=document.getElementById("bug-status");
  btn.disabled=true;btn.textContent="Отправка...";
  status.className="bug-status";status.textContent="";
  try{
    const payload={
      type:form.type.value,
      item:form.item.value,
      slot:form.slot.value,
      description:form.description.value,
      contact:form.contact.value,
      page_url:location.href,
      user_agent:navigator.userAgent,
      _subject:"Division 2 Calc — баг-репорт",
    };
    if(bugScreenshotBlob){
      document.getElementById("bug-upload-status").textContent="Загружаю скрин...";
      const up=await uploadScreenshot(bugScreenshotBlob);
      if(up.url){
        payload.screenshot_url=up.url;
      }else if(up.dataUrl){
        payload.screenshot_base64=up.dataUrl.length>180000?up.dataUrl.slice(0,180000)+"...[обрезано]":up.dataUrl;
      }
      document.getElementById("bug-upload-status").textContent="Загружено через "+up.method;
    }
    const r=await fetch(FORMSPREE_ENDPOINT,{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify(payload),
    });
    if(r.ok){
      status.className="bug-status ok";
      status.textContent="✓ Отправлено. Спасибо!";
      form.reset();
      bugScreenshotBlob=null;
      document.getElementById("bug-preview").style.display="none";
      incrementBugCount();
      setTimeout(closeBugModal,1500);
    }else{
      const j=await r.json().catch(()=>({}));
      status.className="bug-status err";
      status.textContent="Ошибка: "+(j.error||j.errors?.map(e=>e.message).join(", ")||r.status);
    }
  }catch(e){
    status.className="bug-status err";
    status.textContent="Сбой сети: "+e.message;
  }finally{
    btn.disabled=false;btn.textContent="Отправить";
  }
}

// Paste screenshot from clipboard anywhere while bug modal is open
window.addEventListener("paste",e=>{
  if(!document.getElementById("bug-modal").classList.contains("open"))return;
  const items=e.clipboardData?.items||[];
  for(const it of items){
    if(it.type.startsWith("image/")){
      const file=it.getAsFile();
      if(file)handleBugFile(file);
      e.preventDefault();
      return;
    }
  }
});
// Drag & drop onto bug file input area
document.addEventListener("DOMContentLoaded",()=>{
  const fileInput=document.getElementById("bug-file");
  if(!fileInput)return;
  const parent=fileInput.parentElement;
  parent.addEventListener("dragover",e=>{e.preventDefault()});
  parent.addEventListener("drop",e=>{
    e.preventDefault();
    if(e.dataTransfer.files[0])handleBugFile(e.dataTransfer.files[0]);
  });
});
document.addEventListener("DOMContentLoaded",updateStatTooltips);

// ===== WEAPON MODS TAB =====
const WEAPON_MODS = D2DATA.WEAPON_MODS || [];
const SKILL_MODS = D2DATA.SKILL_MODS || [];
const GEAR_MODS = D2DATA.GEAR_MODS || [];
const EXPERTISE = D2DATA.EXPERTISE || {};

function escHtml(s){
  return (s==null?"":String(s)).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

let __wmodsTypeInit=false;
function initWmodsTypeOptions(){
  if(__wmodsTypeInit)return;
  const sel=document.getElementById("wmods-type");
  if(!sel)return;
  const types=Array.from(new Set(WEAPON_MODS.map(m=>m.type_en).filter(Boolean))).sort();
  for(const t of types){
    const o=document.createElement("option");
    o.value=t;o.textContent=t;sel.appendChild(o);
  }
  __wmodsTypeInit=true;
}

function renderWeaponMods(){
  initWmodsTypeOptions();
  const host=document.getElementById("wmods-content");
  if(!host)return;
  const q=(document.getElementById("wmods-search")?.value||"").trim().toLowerCase();
  const typeFilter=document.getElementById("wmods-type")?.value||"";
  let items=WEAPON_MODS.slice();
  if(typeFilter) items=items.filter(m=>(m.type_en||"")===typeFilter);
  if(q){
    items=items.filter(m=>{
      const hay=[m.name_en,m.bonus_en,m.penalty_en,m.stat,m.slot_en,m.source_en].map(x=>(x||"").toLowerCase()).join(" ");
      return hay.includes(q);
    });
  }
  const groups={};
  for(const m of items){
    const k=m.type_en||"Other";
    (groups[k]=groups[k]||[]).push(m);
  }
  const order=["OPTICS RAIL","MAGAZINE SLOT","MUZZLE SLOT","UNDERBARREL","Other"];
  const keys=Object.keys(groups).sort((a,b)=>{
    const ia=order.indexOf(a), ib=order.indexOf(b);
    return (ia<0?99:ia)-(ib<0?99:ib);
  });
  if(!keys.length){
    host.innerHTML=`<div class="bsect" style="text-align:center;color:var(--muted)">Нет модов по фильтру.</div>`;
    return;
  }
  const typeIcon={ "OPTICS RAIL":"🔭", "MAGAZINE SLOT":"📦", "MUZZLE SLOT":"💥", "UNDERBARREL":"🔻" };
  const html=keys.map(k=>{
    const arr=groups[k];
    const cards=arr.map(m=>{
      const bonus=m.bonus_en?`<div style="color:var(--green);font-weight:600;font-size:12px;margin-top:4px">+ ${escHtml(m.bonus_en)}</div>`:"";
      const penalty=m.penalty_en?`<div style="color:var(--red);font-size:11px;margin-top:2px">− ${escHtml(m.penalty_en)}</div>`:"";
      const slot=m.slot_en?`<div style="color:var(--muted);font-size:10px;margin-top:6px">${escHtml(m.slot_en)}</div>`:"";
      const src=m.source_en?`<div style="color:#555;font-size:10px">${escHtml(m.source_en)}</div>`:"";
      const val=m.value?`<div style="position:absolute;top:10px;right:12px;color:var(--orange);font-weight:700;font-size:12px">${escHtml(m.value)}</div>`:"";
      return `<div style="position:relative;background:var(--card);border:1px solid var(--border);border-radius:9px;padding:12px 14px">
        ${val}
        <div style="font-weight:700;color:var(--text);font-size:13px;padding-right:60px">${escHtml(m.name_en||"—")}</div>
        ${m.stat?`<div style="color:var(--blue);font-size:11px;margin-top:2px">${escHtml(m.stat)}</div>`:""}
        ${bonus}${penalty}${slot}${src}
      </div>`;
    }).join("");
    return `<div class="bsect">
      <h3>${typeIcon[k]||""} ${escHtml(k)} <span style="color:var(--muted);font-weight:400;font-size:11px">(${arr.length})</span></h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">${cards}</div>
    </div>`;
  }).join("");
  host.innerHTML=html;
}

// ===== SKILL + GEAR MODS TAB =====
function renderSkillGearMods(){
  const host=document.getElementById("smods-content");
  if(!host)return;
  const bySkill={};
  for(const m of SKILL_MODS){
    const k=m.skill_ru||"Прочее";
    (bySkill[k]=bySkill[k]||[]).push(m);
  }
  const skillHtml=Object.keys(bySkill).sort().map(k=>{
    const arr=bySkill[k];
    const rows=arr.map(m=>`<tr>
      <td style="text-align:left;color:var(--muted);font-size:11px">${escHtml(m.slot_en||"—")}</td>
      <td style="text-align:left">${escHtml(m.stat_ru||m.stat_en||"—")}</td>
      <td style="color:var(--orange);font-weight:700">${escHtml(m.value||"—")}</td>
    </tr>`).join("");
    return `<div class="bsect">
      <h3>🛠 ${escHtml(k)} <span style="color:var(--muted);font-weight:400;font-size:11px">(${arr.length})</span></h3>
      <table class="btl">
        <thead><tr><th style="text-align:left">Слот</th><th style="text-align:left">Характеристика</th><th>Значение</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join("");
  const byCat={};
  for(const m of GEAR_MODS){
    const k=m.category_ru||"Прочее";
    (byCat[k]=byCat[k]||[]).push(m);
  }
  const gearHtml=Object.keys(byCat).sort().map(k=>{
    const arr=byCat[k];
    const rows=arr.map(m=>{
      let val=m.value;
      if(typeof val==="number"){
        val = val<=1 ? (val*100).toFixed(2).replace(/\.00$/,"")+"%" : String(val);
      }
      return `<tr>
        <td style="text-align:left">${escHtml(m.stat_ru||"—")}</td>
        <td style="color:var(--orange);font-weight:700">${escHtml(val||"—")}</td>
      </tr>`;
    }).join("");
    return `<div class="bsect">
      <h3>🎽 ${escHtml(k)} <span style="color:var(--muted);font-weight:400;font-size:11px">(${arr.length})</span></h3>
      <table class="btl">
        <thead><tr><th style="text-align:left">Характеристика</th><th>Максимум</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join("");
  host.innerHTML = `
    <div class="bsect"><h3>📟 Моды навыков (${SKILL_MODS.length})</h3></div>
    ${skillHtml}
    <div class="bsect" style="margin-top:16px"><h3>🎽 Моды снаряжения (${GEAR_MODS.length})</h3></div>
    ${gearHtml}
  `;
}

// ===== EXPERTISE TAB =====
let expertiseCat="weapon";
function setExpertiseCat(c){
  expertiseCat=c;
  for(const k of ["weapon","gear","skill"]){
    const b=document.getElementById("exp-cat-"+k);
    if(b) b.classList.toggle("on",k===c);
  }
  renderExpertise();
}
function renderExpertise(){
  const host=document.getElementById("expertise-content");
  if(!host)return;
  const key=expertiseCat+"_ru";
  const data=EXPERTISE[key];
  if(!data || !data.rows){
    host.innerHTML=`<div class="bsect" style="text-align:center;color:var(--muted)">Нет данных для «${escHtml(expertiseCat)}».</div>`;
    return;
  }
  const headers=data.headers||[];
  const rows=data.rows||[];
  const dataKeys=headers.slice(1);
  const headHtml=headers.map((h,i)=>
    `<th style="${i===0?"text-align:left":""}">${escHtml(h)}</th>`
  ).join("");
  const bodyHtml=rows.map(r=>{
    const isTotal=r.level==="ИТОГО";
    const lvl=r.level;
    const cells=[`<td style="text-align:left;color:${isTotal?"var(--orange)":"var(--text)"};font-weight:${isTotal?"700":"400"}">${escHtml(lvl==null?"—":String(lvl))}</td>`];
    for(const h of dataKeys){
      const v=r[h];
      const disp=v==null?`<span style="color:#444">—</span>`:escHtml(String(v));
      cells.push(`<td style="${isTotal?"color:var(--orange);font-weight:700":""}">${disp}</td>`);
    }
    return `<tr${isTotal?' style="background:rgba(245,166,35,.08)"':""}>${cells.join("")}</tr>`;
  }).join("");
  const titleMap={weapon:"🔫 Оружие",gear:"🎽 Снаряжение",skill:"📟 Навыки"};
  host.innerHTML=`
    <div class="bsect">
      <h3>${titleMap[expertiseCat]||expertiseCat}</h3>
      <div style="overflow-x:auto">
        <table class="btl">
          <thead><tr>${headHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ===== TOP BUILDS (META TAB) =====
let topBuildsFilter="all";
function setTopFilter(f){
  topBuildsFilter=f;
  document.querySelectorAll("#meta-panel .mf-btn").forEach(b=>
    b.classList.toggle("on",b.dataset.filter===f));
  loadTopBuilds();
}
async function loadTopBuilds(){
  const host=document.getElementById("top-builds-content");
  if(!host)return;
  host.innerHTML='<div style="padding:40px;text-align:center;color:var(--muted)">Загрузка...</div>';
  try{
    const filter=topBuildsFilter==="all"?"":`&filter=${encodeURIComponent(`weapon_cat="${topBuildsFilter}"`)}`;
    const r=await fetch(`${PB_API}/builds/records?sort=-likes&perPage=20${filter}`);
    const data=await r.json();
    const items=data.items||[];
    if(!items.length){
      host.innerHTML='<div style="padding:40px;text-align:center;color:var(--muted)">Пока нет билдов в этой категории. <a href="#" onclick="document.querySelector(\'.cat-btn[data-cat=build]\').click();return false" style="color:var(--orange)">Собери и опубликуй свой!</a></div>';
      return;
    }
    const liked=getLikedSet();
    const html=items.map(b=>renderBuildCard(b,liked.has(b.id),false)).join("");
    host.innerHTML=`<div class="comm-grid">${html}</div>`;
  }catch(e){
    host.innerHTML=`<div style="padding:40px;text-align:center;color:var(--red)">Ошибка: ${escapeHtml(e.message)}</div>`;
  }
}
