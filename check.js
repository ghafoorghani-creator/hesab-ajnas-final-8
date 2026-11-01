
const KEY='ghafor_accounting_v1';
let db=JSON.parse(localStorage.getItem(KEY)||'{"transactions":[],"expenses":[],"notes":[],"trash":[],"partners":[],"settings":{"mainCurrency":"AFN","showPersianDate":true,"rates":{"USD_AFN":70,"EUR_AFN":76}}}');
db.sheetRows=db.sheetRows||[];db.sheetOtherLabel=db.sheetOtherLabel||'سایر مصارف';
db.sheetTables=Array.isArray(db.sheetTables)?db.sheetTables:[{id:'table-main',name:'جدول ۱',rows:db.sheetRows,otherLabel:db.sheetOtherLabel}];
if(!db.sheetTables.length)db.sheetTables=[{id:'table-main',name:'جدول ۱',rows:[],otherLabel:'سایر مصارف'}];
let activeSheetId=db.activeSheetId||db.sheetTables[0].id;
function activeSheet(){let t=db.sheetTables.find(x=>String(x.id)===String(activeSheetId))||db.sheetTables[0];if(!t.rows)t.rows=[];if(!t.otherLabel)t.otherLabel='سایر مصارف';if(!Array.isArray(t.sheetPartners))t.sheetPartners=[];if(t.sheetUnitCost==null)t.sheetUnitCost='';return t}
db.sheetRows=activeSheet().rows;db.sheetOtherLabel=activeSheet().otherLabel;
function syncSheetLegacy(){const t=activeSheet();db.sheetRows=t.rows;db.sheetOtherLabel=t.otherLabel;db.activeSheetId=t.id;localStorage.setItem(KEY,JSON.stringify(db))}

db.transactions=db.transactions||[];db.expenses=db.expenses||[];db.notes=db.notes||[];db.trash=db.trash||[];db.partners=db.partners||[];if(!db.settings)db.settings={mainCurrency:'AFN',showPersianDate:true,rates:{USD_AFN:70,EUR_AFN:76}};if(!db.settings.rates)db.settings.rates={USD_AFN:70,EUR_AFN:76};
let editingNote=null;
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
function money(n,c='AFN'){return new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(n)||0)+' '+c}
function isoToday(){return new Date().toISOString().slice(0,10)}
function faDigits(s){return String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d])}
function persianDate(dateStr){try{return new Intl.DateTimeFormat('fa-AF-u-ca-persian',{year:'numeric',month:'long',day:'numeric'}).format(new Date(dateStr+'T12:00:00'))}catch(e){return dateStr}}
function dateText(d){return db.settings.showPersianDate?persianDate(d)+' • '+d:d}
const pageScrollPositions={};let currentPageId='ordersSheet';function showPage(id){
  if(currentPageId) pageScrollPositions[currentPageId]=window.scrollY;
  const previous=currentPageId;
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  $(id).classList.add('active'); currentPageId=id;
  document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===id));
  if(id==='reports')renderReports();
  if(id==='partners')renderPartners();
  if(id==='inventory')renderInventory();
  if(id==='partnerReports')renderPartnerPeriod();
  if(id==='ordersSheet')renderSheet();
  // Restore only pages visited before. On first visit keep the current viewport;
  // this prevents the app from snapping to the top when changing sections.
  if(Object.prototype.hasOwnProperty.call(pageScrollPositions,id)){
    const target=pageScrollPositions[id];
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:target,behavior:'auto'})));
  }
}
function openNotesTool(){setTimeout(()=>document.getElementById('notesTool')?.scrollIntoView({behavior:'smooth'}),60)}
function openModal(html){$('sheet').innerHTML=html;$('modal').classList.add('open')}
function closeModal(){$('modal').classList.remove('open')}
function openTransaction(type){const isBuy=type==='buy';openModal(`<button class="close" onclick="closeModal()">×</button><h2>${isBuy?'ثبت خرید':'ثبت فروش'}</h2><div class="fields"><div class="field"><label>کالا</label><input id="txProduct" placeholder="نام کالا"></div><div class="field"><label>تعداد</label><input id="txQty" class="ltr" type="number" step="0.01" value="1"></div><div class="field"><label>${isBuy?'قیمت خرید هر واحد':'قیمت فروش هر واحد'}</label><input id="txPrice" class="ltr" type="number" step="0.01"></div><div class="field"><label>مصرف مستقیم ${isBuy?'خرید/انتقال':'این فروش'}</label><input id="txExpense" class="ltr" type="number" step="0.01" value="0"></div><div class="field"><label>تاریخ</label><input id="txDate" type="date" value="${isoToday()}"></div><div class="field full"><label>طرف حساب / مشتری</label><input id="txPerson" placeholder="اختیاری"></div></div><div class="tiny" style="margin:8px 0 12px">مصرف مستقیم همین جنس در بهای تمام‌شده آن حساب می‌شود.</div><button class="primary" onclick="addTransaction('${type}')">ثبت ${isBuy?'خرید':'فروش'}</button>`)}
function addTransaction(type){let q=+$('txQty').value,p=+$('txPrice').value,e=+$('txExpense').value||0;if(!$('txProduct').value||q<=0||p<0||e<0)return alert('معلومات معامله را درست وارد کنید.');db.transactions.push({id:Date.now(),type,product:$('txProduct').value.trim(),qty:q,price:p,total:q*p,expense:e,date:$('txDate').value,person:$('txPerson').value.trim()});save();closeModal()}
function openExpense(){openModal(`<button class="close" onclick="closeModal()">×</button><h2>ثبت مصرف</h2><div class="fields"><div class="field"><label>نام شخص</label><input id="exPerson" placeholder="مثلاً غفور"></div><div class="field"><label>مبلغ</label><input id="exAmount" class="ltr" type="number"></div><div class="field"><label>تاریخ</label><input id="exDate" type="date" value="${isoToday()}"></div><div class="field"><label>نوع مصرف</label><input id="exTitle" placeholder="کرایه، غذا، برق..."></div><div class="field full"><label>یادداشت</label><input id="exNote"></div></div><button class="primary" onclick="addExpense()">ثبت مصرف</button>`)}
function addExpense(){let a=+$('exAmount').value;if(!$('exPerson').value||a<=0)return alert('نام شخص و مبلغ را وارد کنید.');db.expenses.push({id:Date.now(),person:$('exPerson').value.trim(),amount:a,date:$('exDate').value,title:$('exTitle').value,note:$('exNote').value});save();closeModal()}
function txDateKey(x){return (x.date||'9999-99-99')+'-'+String(x.id||0).padStart(15,'0')}
function saleAccounting(){
 const tx=[...db.transactions].sort((a,b)=>txDateKey(a).localeCompare(txDateKey(b)));
 const lots={},sales=[];
 for(const x of tx){
  const p=(x.product||'بدون نام').trim(); if(!lots[p])lots[p]=[];
  if(x.type==='buy'){
   const qty=Number(x.qty)||0, price=Number(x.price)||0, extra=Number(x.expense)||0;
   lots[p].push({qty,unit:price+(qty?extra/qty:0)});
  }else if(x.type==='sell'){
   let need=Number(x.qty)||0,cost=0;
   while(need>0 && lots[p].length){
    const lot=lots[p][0],take=Math.min(need,lot.qty);cost+=take*lot.unit;lot.qty-=take;need-=take;
    if(lot.qty<=1e-9)lots[p].shift();
   }
   const revenue=(Number(x.total)||0),direct=(Number(x.expense)||0);
   sales.push({tx:x,revenue,cost,direct,profit:revenue-cost-direct,missing:Math.max(0,need)});
  }
 }
 return {sales,lots};
}
function inventorySummary(){
 const tx=[...db.transactions].sort((a,b)=>txDateKey(a).localeCompare(txDateKey(b))),lots={},info={};
 for(const x of tx){
  const p=(x.product||'بدون نام').trim(); if(!lots[p])lots[p]=[]; if(!info[p])info[p]={purchasedQty:0,soldQty:0,sales:0,cogs:0,direct:0};
  if(x.type==='buy'){
   const qty=Number(x.qty)||0,price=Number(x.price)||0,extra=Number(x.expense)||0;
   lots[p].push({qty,unit:price+(qty?extra/qty:0)}); info[p].purchasedQty+=qty;
  }else if(x.type==='sell'){
   let need=Number(x.qty)||0,cost=0;
   while(need>0&&lots[p].length){const lot=lots[p][0],take=Math.min(need,lot.qty);cost+=take*lot.unit;lot.qty-=take;need-=take;if(lot.qty<=1e-9)lots[p].shift()}
   info[p].soldQty+=Number(x.qty)||0; info[p].sales+=Number(x.total)||0; info[p].cogs+=cost; info[p].direct+=Number(x.expense)||0;
  }
 }
 return Object.entries(info).map(([p,i])=>{const ls=lots[p]||[];const qty=ls.reduce((a,l)=>a+l.qty,0),cost=ls.reduce((a,l)=>a+l.qty*l.unit,0);return {product:p,purchasedQty:i.purchasedQty,soldQty:i.soldQty,qty,cost,sales:i.sales,cogs:i.cogs,direct:i.direct,profit:i.sales-i.cogs-i.direct};});
}
function totals(){
 const buys=db.transactions.filter(x=>x.type==='buy'),sells=db.transactions.filter(x=>x.type==='sell'),ac=saleAccounting();
 const buy=buys.reduce((a,x)=>a+(Number(x.total)||0)+(Number(x.expense)||0),0),sell=sells.reduce((a,x)=>a+(Number(x.total)||0),0),direct=sells.reduce((a,x)=>a+(Number(x.expense)||0),0),cogs=ac.sales.reduce((a,x)=>a+x.cost,0),exp=db.expenses.reduce((a,x)=>a+(Number(x.amount)||0),0);
 const gross=sell-cogs, net=gross-direct-exp, saleProfit=gross-direct;
 return {buy,sell,exp,direct,cogs,gross,saleProfit,net,sales:ac.sales,inventory:inventorySummary()};
}
function renderDashboard(){let t=totals();$('buyTotal').textContent=money(t.buy);$('sellTotal').textContent=money(t.sell);$('grossProfit').textContent=money(t.gross);$('expenseTotal').textContent=money(t.direct+t.exp);$('netProfit').textContent=money(t.net);$('todayLine').textContent=dateText(isoToday());let arr=[...db.transactions].sort((a,b)=>b.id-a.id).slice(0,6);$('recentCount').textContent=db.transactions.length;$('recentList').innerHTML=arr.length?arr.map(x=>`<div class="glass row"><div><b>${x.product}</b><div class="sub">${x.type==='buy'?'خرید':'فروش'} • ${x.qty} × ${x.price} • ${dateText(x.date)}</div></div><strong class="${x.type==='buy'?'red':'green'}">${x.type==='buy'?'-':'+'}${money(x.total)}</strong></div>`).join(''):'<div class="glass empty">هنوز معامله‌ای ثبت نشده است.</div>'}
function renderInventory(){let rows=inventorySummary();$('inventoryList').innerHTML=rows.length?rows.map(x=>`<div class="glass card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><div><b>${x.product}</b><div class="sub" style="margin-top:6px">خرید: ${x.purchasedQty} واحد • فروش: ${x.soldQty} واحد • موجودی: ${x.qty} واحد</div></div><span class="badge">موجودی ${money(x.cost)}</span></div><div class="sub" style="margin-top:8px">بهای تمام‌شده موجودی: ${money(x.cost)} • مبلغ فروش: ${money(x.sales)}</div><div class="sub" style="margin-top:5px">بهای جنس فروخته‌شده: ${money(x.cogs)} • مصرف مستقیم: ${money(x.direct)} • سود فروش: <b class="${x.profit>=0?'green':'red'}">${money(x.profit)}</b></div></div>`).join(''):'<div class="glass empty">کالایی ثبت نشده است.</div>'}
function renderReports(){let from=$('reportFrom').value,to=$('reportTo').value,tx=db.transactions.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));$('rSales').textContent=tx.filter(x=>x.type==='sell').length;$('rBuys').textContent=tx.filter(x=>x.type==='buy').length;let people={};db.expenses.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to)).forEach(x=>people[x.person]=(people[x.person]||0)+(Number(x.amount)||0));$('personExpenses').innerHTML=Object.keys(people).length?Object.entries(people).sort((a,b)=>b[1]-a[1]).map(([p,a])=>`<div class="glass row"><div><b>${p}</b><div class="sub">مجموع مصرف عمومی</div></div><strong class="red">${money(a)}</strong></div>`).join(''):'<div class="glass empty">مصرفی ثبت نشده است.</div>';let sales=saleAccounting().sales.filter(s=>(!from||s.tx.date>=from)&&(!to||s.tx.date<=to));$('partnerProfitList').innerHTML=sales.length?sales.map(s=>`<div class="glass row"><div><b>${s.tx.product}</b><div class="sub">${s.tx.qty} واحد • فروش ${money(s.revenue)} • بهای جنس ${money(s.cost)} • مصرف مستقیم ${money(s.direct)}</div></div><strong class="${s.profit>=0?'green':'red'}">${money(s.profit)}</strong></div>`).join(''):'<div class="glass empty">فروشی در این بازه ثبت نشده است.</div>'}
function savePartner(){let n=$('partnerName').value.trim(),p=+$('partnerPct').value;if(!n||p<=0)return alert('نام و فیصدی را وارد کنید.');let sum=db.partners.reduce((a,x)=>a+x.pct,0);if(sum+p>100)return alert('جمع فیصدی شریکان نمی‌تواند بیشتر از 100٪ باشد.');db.partners.push({id:Date.now(),name:n,pct:p});$('partnerName').value='';$('partnerPct').value='';save()}
function renderPartners(){let t=totals();$('partnersList').innerHTML=db.partners.length?db.partners.map(p=>`<div class="glass row"><div><b>${p.name}</b><div class="sub">${p.pct}% • ناخالص ${money(t.gross*p.pct/100)} • خالص ${money(t.net*p.pct/100)}</div></div><button class="danger smallbtn" onclick="deletePartner(${p.id})">حذف</button></div>`).join(''):'<div class="glass empty">هنوز شریکی ثبت نشده است.</div>'}
function deletePartner(id){if(confirm('شریک حذف شود؟')){db.partners=db.partners.filter(x=>x.id!==id);save()}}
function saveNote(){let title=$('noteTitle').value.trim(),body=$('noteBody').value.trim();if(!title&&!body)return alert('نوت خالی است.');let old=editingNote?db.notes.find(x=>x.id===editingNote):null;let n={id:editingNote||Date.now(),title,body,date:old?.date||isoToday()};if(editingNote)db.notes=db.notes.map(x=>x.id===editingNote?n:x);else db.notes.unshift(n);editingNote=null;clearNoteForm();save()}
function clearNoteForm(){ $('noteTitle').value='';$('noteBody').value='';editingNote=null}
function renderNotes(){$('notesList').innerHTML=db.notes.length?db.notes.map(n=>`<div class="glass card"><b>${n.title||'بدون عنوان'}</b><div class="sub">${dateText(n.date)}</div><p class="note">${n.body}</p><div class="actions-inline"><button class="secondary smallbtn" onclick="editNote(${n.id})">ویرایش</button><button class="danger smallbtn" onclick="trashNote(${n.id})">حذف</button></div></div>`).join(''):'<div class="glass empty">نوتی وجود ندارد.</div>';$('trashCount').textContent=db.trash.length;$('trashList').innerHTML=db.trash.length?db.trash.map(n=>`<div class="glass row"><div><b>${n.title||'بدون عنوان'}</b><div class="sub">${dateText(n.date)}</div></div><div class="actions-inline"><button class="secondary smallbtn" onclick="restoreNote(${n.id})">بازگردانی</button><button class="danger smallbtn" onclick="deleteTrash(${n.id})">حذف دائمی</button></div></div>`).join(''):'<div class="glass empty">سطل زباله خالی است.</div>'}
function editNote(id){let n=db.notes.find(x=>x.id===id);if(!n)return;$('noteTitle').value=n.title||'';$('noteBody').value=n.body||'';editingNote=id;showPage('tools');setTimeout(()=>document.getElementById('notesTool')?.scrollIntoView({behavior:'smooth',block:'start'}),80)}
function trashNote(id){if(!confirm('اجازه حذف این نوت را می‌دهید؟'))return;let n=db.notes.find(x=>x.id===id);if(n){db.notes=db.notes.filter(x=>x.id!==id);db.trash.unshift(n);save()}}
function restoreNote(id){let n=db.trash.find(x=>x.id===id);if(n){db.trash=db.trash.filter(x=>x.id!==id);db.notes.unshift(n);save()}}
function deleteTrash(id){if(confirm('این نوت برای همیشه حذف شود؟')){db.trash=db.trash.filter(x=>x.id!==id);save()}}
function openCalc(){openModal(`<button class="close" onclick="closeModal()">×</button><h2>ماشین حساب</h2><input id="calcDisplay" class="calc-display ltr" readonly value="0"><div class="calc">${['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','C','+','(',')','%','='].map(x=>`<button class="${x==='='?'eq':''}" onclick="calcKey('${x}')">${x}</button>`).join('')}</div>`)}
let calc='';function calcKey(k){if(k==='C'){calc='';}else if(k==='='){try{let e=calc.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replace(/%/g,'/100');calc=String(Function('return '+e)())}catch{calc='خطا'}}else calc+=k;$('calcDisplay').value=calc||'0'}
function openCurrency(){let r=db.settings.rates||{USD_AFN:70,EUR_AFN:76};openModal(`<button class="close" onclick="closeModal()">×</button><h2>تبدیل ارز</h2><p class="tiny">نرخ‌ها قابل تغییر و ذخیره هستند؛ اعداد انگلیسی نمایش داده می‌شوند.</p><div class="glass card"><div class="fields"><div class="field"><label>1 USD = AFN</label><input id="rateUSD" class="ltr" type="number" step="0.0001" value="${r.USD_AFN||70}"></div><div class="field"><label>1 EUR = AFN</label><input id="rateEUR" class="ltr" type="number" step="0.0001" value="${r.EUR_AFN||76}"></div></div><button class="secondary" onclick="saveCurrencyRates()">ذخیره نرخ‌ها</button></div><div class="field"><label>مقدار</label><input id="cvAmount" class="ltr" type="number" value="1"></div><div class="fields"><div class="field"><label>از</label><select id="cvFrom"><option>USD</option><option>EUR</option><option>AFN</option></select></div><div class="field"><label>به</label><select id="cvTo"><option>AFN</option><option>USD</option><option>EUR</option></select></div></div><button class="primary" onclick="convertCurrency()">تبدیل</button><div id="cvResult" class="glass card" style="margin-top:12px;direction:ltr;text-align:left">1 USD ≈ ${(r.USD_AFN||70).toLocaleString('en-US')} AFN</div>`)}
function saveCurrencyRates(){let u=+$('rateUSD').value,e=+$('rateEUR').value;if(u<=0||e<=0)return alert('نرخ‌ها را درست وارد کنید.');db.settings.rates={USD_AFN:u,EUR_AFN:e};save();alert('نرخ ارز ذخیره شد.')}
function convertCurrency(){let r=db.settings.rates||{USD_AFN:70,EUR_AFN:76};let rates={USD:{USD:1,EUR:r.USD_AFN/r.EUR_AFN,AFN:r.USD_AFN},EUR:{USD:r.EUR_AFN/r.USD_AFN,EUR:1,AFN:r.EUR_AFN},AFN:{USD:1/r.USD_AFN,EUR:1/r.EUR_AFN,AFN:1}};let a=+$('cvAmount').value||0,f=$('cvFrom').value,t=$('cvTo').value;$('cvResult').textContent=(a*rates[f][t]).toLocaleString('en-US',{maximumFractionDigits:6})+' '+t}
function openDate(){openModal(`<button class="close" onclick="closeModal()">×</button><h2>تبدیل تاریخ عیسوی و دری</h2><div class="glass card"><div class="field"><label>تاریخ عیسوی</label><input id="dateEdit" type="date" value="${isoToday()}" onchange="showDateResult()"></div><div id="dateResult" class="amount">${persianDate(isoToday())}</div></div><div class="glass card" style="margin-top:12px"><b>تبدیل تاریخ دری به عیسوی</b><div class="fields" style="margin-top:10px"><div class="field"><label>سال دری</label><input id="pYear" type="number" placeholder="مثلاً ۱۴۰۵" inputmode="numeric"></div><div class="field"><label>ماه دری (۱ تا ۱۲)</label><input id="pMonth" type="number" min="1" max="12" inputmode="numeric"></div><div class="field"><label>روز دری</label><input id="pDay" type="number" min="1" max="31" inputmode="numeric"></div></div><button class="primary" onclick="convertPersianToGregorian()">تبدیل به عیسوی</button><div id="gregorianResult" class="amount" style="margin-top:10px"></div></div>`)}
function showDateResult(){const d=$('dateEdit').value;$('dateResult').textContent=d?persianDate(d):''}
function convertPersianToGregorian(){let y=Number($('pYear').value),m=Number($('pMonth').value),d=Number($('pDay').value);if(!y||m<1||m>12||d<1||d>31)return alert('سال، ماه و روز دری را درست وارد کنید.');const fmt=new Intl.DateTimeFormat('en-u-ca-persian-nu-latn',{year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'});let start=Date.UTC(y+621,2,15),end=Date.UTC(y+622,2,25),found='';for(let t=start;t<=end;t+=86400000){let parts=Object.fromEntries(fmt.formatToParts(new Date(t)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));if(parts.year===y&&parts.month===m&&parts.day===d){found=new Date(t).toISOString().slice(0,10);break}}$('gregorianResult').textContent=found?found+' • '+new Date(found+'T12:00:00Z').toLocaleDateString('en-GB'):'این تاریخ معتبر نیست.'}
function applyTheme(){const c=db.settings.colors||{};const root=document.documentElement;for(const [k,v] of Object.entries(c))if(v)root.style.setProperty('--'+k,v);document.body.classList.toggle('theme-custom',!!c.bg);document.body.classList.toggle('dark-mode',!!db.settings.darkMode)}
function setThemeColor(key,value){db.settings.colors=db.settings.colors||{};db.settings.colors[key]=value;localStorage.setItem(KEY,JSON.stringify(db));applyTheme()}
function openSettings(){const c=db.settings.colors||{};const colors=[['bg','پس‌زمینه','#062b68'],['card','کارت‌ها','#1470e6'],['line','خطوط جداکننده','#84c4ff'],['text','متن اصلی','#f7fbff'],['muted','متن ثانوی','#c0d9f8'],['accent','رنگ تأکیدی','#62b8ff'],['accent2','رنگ تأکیدی دوم','#176be0'],['danger','رنگ هشدار','#ff718b'],['ok','رنگ موفقیت','#5ee7b0']];openModal(`<button class="close" onclick="closeModal()">×</button><h2>تنظیمات و رنگ‌ها</h2><div class="switch"><span>دارک مود</span><input type="checkbox" ${db.settings.darkMode?'checked':''} onchange="db.settings.darkMode=this.checked;localStorage.setItem(KEY,JSON.stringify(db));applyTheme()"></div><div class="switch" style="margin-top:8px"><span>نمایش تاریخ دری</span><input type="checkbox" ${db.settings.showPersianDate?'checked':''} onchange="db.settings.showPersianDate=this.checked;localStorage.setItem(KEY,JSON.stringify(db));renderSheet()"></div><div class="section-title">تغییر رنگ‌های برنامه</div>${colors.map(([k,label,def])=>`<div class="field"><label>${label}</label><div style="display:flex;gap:10px;align-items:center"><input type="color" value="${c[k]||def}" onchange="setThemeColor('${k}',this.value)" style="width:58px;height:42px;padding:3px"><span class="tiny">${c[k]||def}</span></div></div>`).join('')}<button class="secondary" onclick="db.settings.colors={};db.settings.darkMode=false;db.settings.customBackground=false;localStorage.setItem(KEY,JSON.stringify(db));applyTheme();openSettings()">بازگشت رنگ‌ها به حالت اصلی</button>`)}
function saveSettings(){db.settings.mainCurrency=$('mainCurrency').value;save()}
function resetAll(){if(confirm('تمام اطلاعات برنامه پاک شود؟')){localStorage.removeItem(KEY);location.reload()}}
let partnerPeriod='week';
function periodRange(kind){const n=new Date();let f=new Date(n),t=new Date(n);if(kind==='week'){let d=(n.getDay()+6)%7;f.setDate(n.getDate()-d)}else if(kind==='month')f=new Date(n.getFullYear(),n.getMonth(),1);return{from:f.toISOString().slice(0,10),to:t.toISOString().slice(0,10)}}
function setPartnerPeriod(k){partnerPeriod=k;$('partnerCustomDates').style.display=k==='custom'?'grid':'none';['Week','Month','Custom'].forEach(x=>{$('p'+x+'Btn').className=k===x.toLowerCase()?'primary smallbtn':'secondary smallbtn'});if(k==='custom'){if(!$('pFrom').value)$('pFrom').value=isoToday();if(!$('pTo').value)$('pTo').value=isoToday()}renderPartnerPeriod()}
function renderPartnerPeriod(){
 let r=partnerPeriod==='custom'?{from:$('pFrom').value||isoToday(),to:$('pTo').value||isoToday()}:periodRange(partnerPeriod);
 let sales=saleAccounting().sales.filter(s=>(!r.from||s.tx.date>=r.from)&&(!r.to||s.tx.date<=r.to));
 let revenue=sales.reduce((a,s)=>a+s.revenue,0),cogs=sales.reduce((a,s)=>a+s.cost,0),direct=sales.reduce((a,s)=>a+s.direct,0);
 let general=db.expenses.filter(x=>(!r.from||x.date>=r.from)&&(!r.to||x.date<=r.to)).reduce((a,x)=>a+(Number(x.amount)||0),0);
 let gross=revenue-cogs, saleProfit=gross-direct, net=saleProfit-general;
 $('partnerPeriodText').textContent=`${dateText(r.from)} تا ${dateText(r.to)} • ${sales.length} فروش محاسبه شد`;
 $('pSales').textContent=revenue.toLocaleString('en-US',{maximumFractionDigits:2})+' AFN';
 $('pGross').textContent=gross.toLocaleString('en-US',{maximumFractionDigits:2})+' AFN';
 $('pExp').textContent=(direct+general).toLocaleString('en-US',{maximumFractionDigits:2})+' AFN';
 $('pNet').textContent=net.toLocaleString('en-US',{maximumFractionDigits:2})+' AFN';
 let partnerRows=db.partners.map(p=>{let grossShare=gross*p.pct/100,netShare=net*p.pct/100;return `<div class="glass row"><div><b>${p.name}</b><div class="sub">${p.pct}% • سهم از سود ناخالص: ${money(grossShare)} • سهم از سود خالص: ${money(netShare)}</div></div><strong class="${netShare>=0?'green':'red'}">${money(netShare)}</strong></div>`}).join('');
 $('periodPartnerList').innerHTML=(partnerRows||'<div class="glass empty">شریکی ثبت نشده است.</div>')+(sales.length?`<div class="section-title">جزئیات فروش‌های این دوره</div>`+sales.map(s=>`<div class="glass card"><div style="display:flex;justify-content:space-between;gap:10px"><div><b>${s.tx.product}</b><div class="sub">${dateText(s.tx.date)} • ${s.tx.qty} واحد</div></div><strong class="${s.profit>=0?'green':'red'}">${money(s.profit)}</strong></div><div class="sub" style="margin-top:8px">فروش: ${money(s.revenue)} • بهای جنس: ${money(s.cost)} • مصرف مستقیم: ${money(s.direct)}</div>${s.missing>0?`<div class="tiny red" style="margin-top:7px">⚠️ این فروش ${s.missing} واحد بیشتر از موجودی ثبت‌شده بوده است.</div>`:''}</div>`).join(''):'<div class="glass empty">در این بازه فروشی ثبت نشده است.</div>');
}

function sheetSave(){let t=activeSheet();t.rows=db.sheetRows;t.otherLabel=db.sheetOtherLabel;syncSheetLegacy()}
function addSheetTable(){const n=db.sheetTables.length+1,t={id:'table-'+Date.now()+'-'+Math.random().toString(16).slice(2),name:'جدول '+n,rows:[],otherLabel:'سایر مصارف'};db.sheetTables.push(t);activeSheetId=t.id;db.sheetRows=t.rows;db.sheetOtherLabel=t.otherLabel;sheetSave();renderSheet()}
function switchSheetTable(id){let old=activeSheet();old.rows=db.sheetRows;old.otherLabel=db.sheetOtherLabel;activeSheetId=id;let t=activeSheet();db.sheetRows=t.rows;db.sheetOtherLabel=t.otherLabel;sheetSave();renderSheet()}
function renameSheetTable(name){let t=activeSheet();t.name=(name||'').trim()||'جدول';sheetSave();renderSheetTableControls()}
function deleteSheetTable(){if(db.sheetTables.length<=1)return alert('حداقل یک جدول باید باقی بماند.');if(!confirm('تمام ردیف‌های این جدول حذف شود؟'))return;db.sheetTables=db.sheetTables.filter(t=>String(t.id)!==String(activeSheetId));activeSheetId=db.sheetTables[0].id;db.sheetRows=activeSheet().rows;db.sheetOtherLabel=activeSheet().otherLabel;sheetSave();renderSheet()}
function renderSheetTableControls(){let sel=$('sheetTableSelect');if(!sel)return;sel.innerHTML=db.sheetTables.map(t=>`<option value="${escSheet(t.id)}" ${String(t.id)===String(activeSheetId)?'selected':''}>${escSheet(t.name)}</option>`).join('');$('sheetTableName').value=activeSheet().name||''}
function addSheetRow(){db.sheetRows.push({id:String(Date.now())+Math.random().toString(16).slice(2),position:'',seller:'',qty:'',kara:'',goods:'',expenses:'',other:'',codeNumber:'',date:isoToday()});sheetSave();renderSheet()}
function updateSheetCell(id,key,value){let r=db.sheetRows.find(x=>String(x.id)===String(id));if(!r)return;r[key]=value;sheetSave();let tr=[...$('ordersRows').querySelectorAll('tr')].find(x=>x.dataset.rowId===String(id));if(tr){let cell=tr.querySelector('[data-row-total]');if(cell)cell.textContent=rowTotal(r).toLocaleString('en-US',{maximumFractionDigits:2})}renderSheetTotalsOnly();renderAllTablesSummary()}
function deleteSheetRow(id){if(!confirm('این ردیف حذف شود؟'))return;db.sheetRows=db.sheetRows.filter(x=>String(x.id)!==String(id));sheetSave();renderSheet()}
function renameOtherColumn(){db.sheetOtherLabel=$('sheetOtherLabel').value||'سایر مصارف';sheetSave();$('otherHeader').textContent=db.sheetOtherLabel}
function sheetNum(v){let n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0}
function sheetSum(key){return db.sheetRows.reduce((s,r)=>s+sheetNum(r[key]),0)}
function escSheet(v){return String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function rowTotal(r){return sheetNum(r.goods)-sheetNum(r.kara)+sheetNum(r.expenses)-sheetNum(r.other)}
function sheetQuantityTotal(){return db.sheetRows.reduce((sum,r)=>sum+sheetNum(r.qty),0)}
function sheetCostTotal(){return sheetNum(activeSheet().sheetUnitCost)*sheetQuantityTotal()}
function rowProfitBeforeCost(r){return sheetNum(r.goods)-sheetNum(r.kara)+sheetNum(r.expenses)}
function sheetPartnerProfit(){return db.sheetRows.reduce((sum,r)=>sum+rowProfitBeforeCost(r),0)-sheetCostTotal()}
function updateSheetCost(value){activeSheet().sheetUnitCost=value;sheetSave();renderSheetPartnerAmounts();renderAllTablesSummary()}
function addSheetPartner(){activeSheet().sheetPartners.push({id:'partner-'+Date.now()+'-'+Math.random().toString(16).slice(2),name:'',percent:0});sheetSave();renderSheetPartners();renderAllTablesSummary()}
function updateSheetPartner(id,key,value){const p=activeSheet().sheetPartners.find(x=>String(x.id)===String(id));if(!p)return;p[key]=value;sheetSave();renderSheetPartnerAmounts();renderAllTablesSummary()}
function deleteSheetPartner(id){activeSheet().sheetPartners=activeSheet().sheetPartners.filter(p=>String(p.id)!==String(id));sheetSave();renderSheetPartners();renderAllTablesSummary()}
function renderSheetPartnerAmounts(){const profit=sheetPartnerProfit();const costTotalEl=$('sheetCostTotalDisplay');if(costTotalEl)costTotalEl.textContent=sheetCostTotal().toLocaleString('en-US',{maximumFractionDigits:2});const profitEl=$('sheetPartnerProfit');if(profitEl)profitEl.textContent=profit.toLocaleString('en-US',{maximumFractionDigits:2});const list=$('sheetPartnersList');if(!list)return;activeSheet().sheetPartners.forEach(p=>{const tr=list.querySelector('[data-partner-id="'+String(p.id).replace(/"/g,'&quot;')+'"]');if(tr){const share=tr.querySelector('[data-partner-share]');if(share)share.textContent=(profit*sheetNum(p.percent)/100).toLocaleString('en-US',{maximumFractionDigits:2})}})}
function renderSheetPartners(){const t=activeSheet();const cost=$('sheetUnitCost');if(cost&&document.activeElement!==cost)cost.value=t.sheetUnitCost??'';const list=$('sheetPartnersList');if(!list)return;list.innerHTML=t.sheetPartners.map((p,i)=>`<div data-partner-id="${escSheet(p.id)}" class="fields" style="align-items:end;gap:6px;margin:8px 0;padding:8px;border:1px solid rgba(120,180,255,.22);border-radius:10px"><div class="field"><label>نام شریک ${i+1}</label><input value="${escSheet(p.name)}" placeholder="نام شریک" oninput="updateSheetPartner('${escSheet(p.id)}','name',this.value)"></div><div class="field"><label>فیصدی سهم</label><input type="number" min="0" step="any" inputmode="decimal" value="${escSheet(p.percent)}" placeholder="٪" oninput="updateSheetPartner('${escSheet(p.id)}','percent',this.value)"></div><div class="field"><label>سهم از سود</label><div data-partner-share class="amount">0</div></div><button class="secondary" style="padding:6px" onclick="deleteSheetPartner('${escSheet(p.id)}')">حذف</button></div>`).join('');renderSheetPartnerAmounts()}

function allSheetRows(){return db.sheetTables.flatMap(t=>(t.rows||[]).map(r=>({...r,_unitCost:sheetNum(t.sheetUnitCost)})))}
function karaReceived(r){return r.kara!==undefined&&r.kara!==null&&String(r.kara).trim()!==''}
function fmtN(n){return Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2})}
function renderAllTablesSummary(){
 const rows=allSheetRows(),sum=k=>rows.reduce((a,r)=>a+sheetNum(r[k]),0),total=rows.reduce((a,r)=>a+rowTotal(r),0);
 $('allTablesSummary').innerHTML=`<div class="tiny">شامل ${db.sheetTables.length} جدول و ${rows.length} ردیف</div><table><tbody><tr><th>مجموع تعداد</th><td>${fmtN(sum('qty'))}</td><th>مجموع کرا</th><td>${fmtN(sum('kara'))}</td></tr><tr><th>مجموع قیمت</th><td>${fmtN(sum('goods'))}</td><th>قیمت مجموع</th><td>${fmtN(total)}</td></tr><tr><th>مجموع مصارف</th><td>${fmtN(sum('expenses'))}</td><th>سایر مصارف</th><td>${fmtN(sum('other'))}</td></tr></tbody></table>`;
 const sellers={};rows.forEach(r=>{const n=String(r.seller||'').trim()||'نام ثبت نشده';sellers[n]=(sellers[n]||0)+sheetNum(r.qty)});
 $('sellerQuantitySummary').innerHTML=Object.keys(sellers).length?`<table><thead><tr><th>نام نفر</th><th>مجموع تعداد فروخته‌شده</th></tr></thead><tbody>${Object.entries(sellers).sort((a,b)=>b[1]-a[1]).map(([n,q])=>`<tr><td>${escSheet(n)}</td><td>${fmtN(q)}</td></tr>`).join('')}</tbody></table>`:'<div class="tiny">هنوز ردیفی ثبت نشده است.</div>';
 const eligible=rows.filter(karaReceived),eligibleProfit=eligible.reduce((a,r)=>a+rowProfitBeforeCost(r)-r._unitCost*sheetNum(r.qty),0),partnerTotals={};
 db.sheetTables.forEach(t=>{const rs=(t.rows||[]).filter(karaReceived),profit=rs.reduce((a,r)=>a+rowProfitBeforeCost(r)-sheetNum(t.sheetUnitCost)*sheetNum(r.qty),0);(t.sheetPartners||[]).forEach(p=>{const n=String(p.name||'شریک بدون نام').trim()||'شریک بدون نام';partnerTotals[n]=(partnerTotals[n]||0)+profit*sheetNum(p.percent)/100})});
 $('allPartnersSummary').innerHTML=`<div style="margin-bottom:8px"><b>سود باقی‌مانده پس از کسر نرخ تمام‌شده:</b> ${fmtN(eligibleProfit)}</div><div class="tiny">فقط ردیف‌هایی حساب شده که خانهٔ «کرا» در آن‌ها خالی نیست؛ مقدار صفر نیز حساب می‌شود. تعداد ردیف‌های واجد شرایط: ${eligible.length}</div>${Object.keys(partnerTotals).length?`<table style="margin-top:10px"><thead><tr><th>نام شریک</th><th>مجموع سهم در تمام جدول‌ها</th></tr></thead><tbody>${Object.entries(partnerTotals).map(([n,v])=>`<tr><td>${escSheet(n)}</td><td>${fmtN(v)}</td></tr>`).join('')}</tbody></table>`:'<div class="tiny" style="margin-top:8px">برای نمایش سهم‌ها، در هر جدول شریک و فیصدی‌اش را ثبت کن.</div>'}`;
 const dated=eligible.filter(r=>r.date&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)),days=new Set(dated.map(r=>r.date)).size;
 const dailyQty=days?dated.reduce((a,r)=>a+sheetNum(r.qty),0)/days:0,dailyPrice=days?dated.reduce((a,r)=>a+rowTotal(r),0)/days:0,dailyOther=days?dated.reduce((a,r)=>a+sheetNum(r.other),0)/days:0;
 const loc={};eligible.forEach(r=>{const n=String(r.position||'').trim()||'موقعیت ثبت نشده';if(!loc[n])loc[n]={qty:0,price:0};loc[n].qty+=sheetNum(r.qty);loc[n].price+=rowTotal(r)});const sorted=Object.entries(loc).sort((a,b)=>a[1].qty-b[1].qty);const minRow=eligible.length?eligible.reduce((a,b)=>sheetNum(a.qty)<=sheetNum(b.qty)?a:b):null;const maxRow=eligible.length?eligible.reduce((a,b)=>sheetNum(a.qty)>=sheetNum(b.qty)?a:b):null;
 const rowSalesLabel=r=>r?`تعداد: ${fmtN(r.qty)} • قیمت مجموع: ${fmtN(rowTotal(r))} • موقعیت: ${escSheet(String(r.position||'موقعیت ثبت نشده').trim()||'موقعیت ثبت نشده')}`:'—';
 const locationRows=sorted.slice().reverse().map(([name,v],i)=>`<tr><td>${i+1}</td><td>${escSheet(name)}</td><td>${fmtN(v.qty)}</td><td>${fmtN(v.price)}</td></tr>`).join('');
 $('dailyAndLocationSummary').innerHTML=`<table><tbody><tr><th>میانگین تعداد فروش در روز</th><td>${fmtN(dailyQty)}</td></tr><tr><th>میانگین قیمت مجموع در روز</th><td>${fmtN(dailyPrice)}</td></tr><tr><th>میانگین سایر مصارف در روز</th><td>${fmtN(dailyOther)}</td></tr><tr><th>روزهای دارای تاریخ و کرا ثبت‌شده</th><td>${days}</td></tr></tbody></table><div class="tiny" style="margin-top:8px">میانگین‌ها فقط از ردیف‌های دارای کرا ثبت‌شده و تاریخ معتبر حساب می‌شوند. تاریخ ردیف را با نگه‌داشتن انگشت روی ردیف تنظیم کن.</div><div style="margin-top:12px"><b>بیشترین فروش (بر اساس تعداد)</b><div class="tiny">${maxRow?rowSalesLabel(maxRow):'ردیفی موجود نیست'}</div><b style="display:block;margin-top:8px">کمترین فروش (بر اساس تعداد)</b><div class="tiny">${minRow?rowSalesLabel(minRow):'ردیفی موجود نیست'}</div></div><div style="margin-top:14px"><b>رتبه‌بندی تمام موقعیت‌ها از پرفروش به کم‌فروش</b>${sorted.length?`<table style="margin-top:8px"><thead><tr><th>شماره</th><th>موقعیت</th><th>مجموع تعداد</th><th>قیمت مجموع</th></tr></thead><tbody>${locationRows}</tbody></table>`:'<div class="tiny">موقعیت فروشی ثبت نشده است.</div>'}</div>`;
}
let rowLongPressTimer=null,contextRowId=null;
function openRowActions(id){const row=db.sheetRows.find(r=>String(r.id)===String(id));if(!row)return;contextRowId=id;openModal(`<button class="close" onclick="closeModal()">×</button><h2>عملیات روی ردیف</h2><p class="tiny">ردیف ${escSheet(row.seller||row.position||id)} — کاپی یا انتقال به جدول دیگر</p><div class="field"><label>جدول مقصد</label><select id="rowTargetTable">${db.sheetTables.filter(t=>String(t.id)!==String(activeSheetId)).map(t=>`<option value="${escSheet(t.id)}">${escSheet(t.name)}</option>`).join('')}</select></div><div class="field"><label>تاریخ ردیف برای محاسبهٔ میانگین روزانه</label><input id="rowDateEdit" type="date" value="${row.date||''}"></div><button class="secondary" onclick="saveRowDate()">ذخیره تاریخ</button><div class="actions-inline" style="margin-top:12px"><button class="primary" onclick="copyRowToTable()" ${db.sheetTables.length<2?'disabled':''}>کاپی به جدول دیگر</button><button class="secondary" onclick="moveRowToTable()" ${db.sheetTables.length<2?'disabled':''}>انتقال به جدول دیگر</button></div>`)}
function saveRowDate(){const r=db.sheetRows.find(x=>String(x.id)===String(contextRowId));if(!r)return;r.date=$('rowDateEdit').value;sheetSave();renderAllTablesSummary();alert('تاریخ ردیف ذخیره شد.')}
function copyRowToTable(){const dest=db.sheetTables.find(t=>String(t.id)===String($('rowTargetTable').value)),row=db.sheetRows.find(r=>String(r.id)===String(contextRowId));if(!dest||!row)return;dest.rows=dest.rows||[];dest.rows.push({...row,id:String(Date.now())+Math.random().toString(16).slice(2)});syncSheetLegacy();renderAllTablesSummary();closeModal();alert('ردیف کاپی شد.')}
function moveRowToTable(){const dest=db.sheetTables.find(t=>String(t.id)===String($('rowTargetTable').value)),i=db.sheetRows.findIndex(r=>String(r.id)===String(contextRowId));if(!dest||i<0)return;const [row]=db.sheetRows.splice(i,1);dest.rows=dest.rows||[];dest.rows.push(row);sheetSave();renderSheet();renderAllTablesSummary();closeModal();alert('ردیف انتقال شد.')}
function installRowLongPress(){const tb=$('ordersRows');if(!tb||tb.dataset.longpressInstalled)return;tb.dataset.longpressInstalled='1';tb.addEventListener('touchstart',ev=>{const tr=ev.target.closest('tr[data-row-id]');if(!tr)return;const id=tr.dataset.rowId;rowLongPressTimer=setTimeout(()=>{openRowActions(id);rowLongPressTimer=null},600)},{passive:true});['touchend','touchmove','touchcancel'].forEach(n=>tb.addEventListener(n,()=>{if(rowLongPressTimer){clearTimeout(rowLongPressTimer);rowLongPressTimer=null}}));tb.addEventListener('contextmenu',ev=>{const tr=ev.target.closest('tr[data-row-id]');if(tr){ev.preventDefault();openRowActions(tr.dataset.rowId)}})}

function renderSheet(){if(!$('ordersRows'))return;renderSheetTableControls();$('sheetOtherLabel').value=db.sheetOtherLabel||'سایر مصارف';$('otherHeader').textContent=db.sheetOtherLabel||'سایر مصارف';$('ordersRows').innerHTML=db.sheetRows.map((r,i)=>`<tr data-row-id="${escSheet(r.id)}"><td>${i+1}</td><td><input value="${escSheet(r.position)}" oninput="updateSheetCell('${r.id}','position',this.value)" placeholder="موقعیت"></td><td><input value="${escSheet(r.seller)}" oninput="updateSheetCell('${r.id}','seller',this.value)" placeholder="فروشنده"></td><td><input class="num" type="number" step="any" value="${escSheet(r.qty)}" oninput="updateSheetCell('${r.id}','qty',this.value)"></td><td><input class="num" type="number" step="any" value="${escSheet(r.kara)}" oninput="updateSheetCell('${r.id}','kara',this.value)"></td><td><input class="num" type="number" step="any" value="${escSheet(r.goods)}" oninput="updateSheetCell('${r.id}','goods',this.value)"></td><td><input class="num" type="number" step="any" value="${escSheet(r.expenses)}" oninput="updateSheetCell('${r.id}','expenses',this.value)"></td><td><input class="num" type="number" step="any" value="${escSheet(r.other)}" oninput="updateSheetCell('${r.id}','other',this.value)"></td><td><input value="${escSheet(r.codeNumber??r.paid)}" oninput="updateSheetCell(\'${r.id}\',\'codeNumber\',this.value)" placeholder="کود نمبر"></td><td data-row-total>${rowTotal(r).toLocaleString('en-US',{maximumFractionDigits:2})}</td><td><button onclick="deleteSheetRow('${r.id}')">×</button></td></tr>`).join('');renderSheetPartners();renderSheetTotalsOnly();installRowLongPress();renderAllTablesSummary()}
function renderSheetTotalsOnly(){if(!$('ordersFoot'))return;let keys=['qty','kara','goods','expenses','other'];$('ordersFoot').innerHTML=`<tr><td colspan="3">مجموع</td>${keys.map(k=>`<td>${(k==='other'?-sheetSum(k):sheetSum(k)).toLocaleString('en-US',{maximumFractionDigits:2})}</td>`).join('')}<td></td><td>${db.sheetRows.reduce((s,r)=>s+rowTotal(r),0).toLocaleString('en-US',{maximumFractionDigits:2})}</td><td></td></tr>`;renderSheetPartnerAmounts()}

function exportSheetCSV(){
  const escExcel=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const headers=['شماره','موقعیت','فروشنده','تعداد','کرا','قیمت','مصارف',db.sheetOtherLabel||'سایر مصارف','کود نمبر','قیمت مجموع'];
  const data=db.sheetRows.map((r,i)=>[i+1,r.position,r.seller,r.qty,r.kara,r.goods,r.expenses,-sheetNum(r.other),(r.codeNumber??r.paid??''),rowTotal(r)]);
  const table='<table border="1"><thead><tr>'+headers.map(v=>'<th>'+escExcel(v)+'</th>').join('')+'</tr></thead><tbody>'+data.map(row=>'<tr>'+row.map(v=>'<td>'+escExcel(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+table+'</body></html>';
  const blob=new Blob(['\ufeff',html],{type:'application/vnd.ms-excel;charset=utf-8;'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='جدول-اجناس-غفور.xls';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}


// Keep the document from drifting sideways when editing compact spreadsheet cells on iPhone.
document.addEventListener('focusin',function(ev){
  const el=ev.target;
  if(!el || !el.matches || !el.matches('#ordersTable input')) return;
  const scroller=el.closest('.glass.card');
  if(!scroller) return;
  const pageY=window.scrollY;
  requestAnimationFrame(()=>{
    // Safari may shift the document while opening its keyboard; restore vertical position
    // while leaving the table's own horizontal scroll available.
    if(Math.abs(window.scrollY-pageY)>4) window.scrollTo({top:pageY,behavior:'auto'});
  });
});
function renderAll(){if($('dashboard'))renderDashboard();if($('inventoryList'))renderInventory();if($('notesList'))renderNotes();if($('partnersList'))renderPartners();if($('reportFrom'))renderReports();renderSheet();if($('mainCurrency'))$('mainCurrency').value=db.settings.mainCurrency;if($('showPersianDate'))$('showPersianDate').checked=db.settings.showPersianDate;applyTheme()}
if($('reportFrom'))$('reportFrom').value='';if($('reportTo'))$('reportTo').value='';renderAll();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
