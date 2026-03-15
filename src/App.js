import { useState, useRef } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

/* ═══ DESIGN TOKENS — matching v5 exactly ═══ */
const T={
  bg:"#0c1520",card:"#141f2e",cardHover:"#1a2a3d",border:"#1e3044",borderLight:"#263d55",
  accent:"#34d399",accentDim:"rgba(52,211,153,.1)",accentBorder:"rgba(52,211,153,.3)",
  blue:"#60a5fa",blueDim:"rgba(96,165,250,.1)",
  purple:"#c084fc",purpleDim:"rgba(192,132,252,.1)",
  green:"#4ade80",greenDim:"rgba(74,222,128,.08)",
  yellow:"#fbbf24",yellowDim:"rgba(251,191,36,.08)",
  red:"#f87171",redDim:"rgba(248,113,113,.08)",
  gold:"#f0a500",
  text:"#e2e8f0",textSub:"#94a3b8",textDim:"#64748b",
  gradBtn:"linear-gradient(135deg,#6366f1,#22d3ee)",
  gaugeTrack:"#1e3044",
};
const AREAS=[
  {id:"E",label:"환경",eng:"Environment",icon:"🌱",color:T.green,dim:T.greenDim,range:[0,10]},
  {id:"S",label:"사회",eng:"Social",icon:"🤝",color:T.blue,dim:T.blueDim,range:[10,20]},
  {id:"G",label:"지배구조",eng:"Governance",icon:"🏛️",color:T.purple,dim:T.purpleDim,range:[20,30]},
];
const GRADES=[
  {min:80,grade:"A",label:"선도(Leading)",color:"#22c55e"},
  {min:70,grade:"B+",label:"우수(Performing)",color:"#34d399"},
  {min:60,grade:"B0",label:"양호(Stable)",color:"#60a5fa"},
  {min:50,grade:"B-",label:"보통(Developing)",color:"#fbbf24"},
  {min:35,grade:"C",label:"관심(Introductory)",color:"#f97316"},
  {min:0,grade:"D",label:"미흡(Insufficient)",color:"#ef4444"},
];
const getGrade=s=>{for(const g of GRADES)if(s>=g.min)return g;return GRADES[GRADES.length-1];};
const SCALE=["매우 미흡","미흡","보통","우수","매우 우수"];
// 산업특성 (v5 실험 결과 반영)
const INDUSTRY_INSIGHT={
  "제조업":{strength:"S/G 영역 상대적 우수 (평균 5.37/5.38)",weakness:"E 영역 취약 (평균 3.19)",tip:"환경경영시스템(ISO 14001) 구축이 최우선. 에너지 절감·폐기물 관리부터 시작"},
  "ICT/정보통신":{strength:"E/G 영역 균형적 (3.31/4.86)",weakness:"전반적 중상위, 세부 취약점 개선 필요",tip:"정보보안(G-05) 및 개인정보보호(S-10) 특화 강화"},
  "건설업":{strength:"E 영역 비교적 양호 (3.37)",weakness:"S/G 전반 취약 (3.72/3.79), 제조업 대비 유의한 차이 (p=0.002)",tip:"안전보건(S-03/S-04) 긴급 강화. 산업안전보건법 중대재해 대응 필수"},
  "도소매업":{strength:"G 영역 보통 수준 (4.53)",weakness:"E 영역 최저 수준 (3.20)",tip:"소비자 개인정보보호(S-10)와 공급망 ESG(S-07) 중점 개선"},
  "기타서비스":{strength:"E/S/G 균형적 (3.47/4.55/4.76)",weakness:"환경 영역 상대적 취약",tip:"서비스업 특성상 에너지·폐기물 보다는 인력관리(S-05/S-06)와 윤리경영(G-01) 집중"},
};

/* ═══ 30 QUESTIONS ═══ */
const QS=[
  {c:"E-01",t:"환경경영 방침이 서면으로 제정·승인되어 있습니까?",a:"E",help:"ISO 14001 기반 환경경영 방침을 서면 제정, 최고경영자 승인 후 전 직원 공표",docs:["환경경영방침서","환경경영 선언문","이사회 승인 의사록"],law:"환경정책기본법 제2조",guide:"K-ESG E-1-1",template:"환경경영방침서에는 ①환경경영 비전, ②오염예방 의지, ③법규준수 서약, ④지속적 개선 약속을 포함해야 합니다."},
  {c:"E-02",t:"환경목표와 KPI가 연간 계획으로 수립되어 있습니까?",a:"E",help:"에너지 사용량, 폐기물 발생량 등 정량적 환경목표를 연간 계획에 포함",docs:["환경목표 관리대장","연간 환경계획서"],law:"환경기술산업법 제17조",guide:"K-ESG E-1-2",template:"연간 환경계획서: ①전년 대비 에너지 5% 절감, ②폐기물 재활용률 70% 달성, ③월별 진도율 관리"},
  {c:"E-03",t:"최근 12개월 환경 성과관리표를 보유하고 있습니까?",a:"E",help:"Scope1/2 배출량, 에너지·용수 사용량 월별 집계 관리",docs:["환경성과 관리표","에너지 사용 집계표"],law:"온실가스배출권법",guide:"K-ESG E-2",template:"월별 집계표: 전력(kWh), 가스(Nm³), 용수(톤), 폐기물(톤), GHG(tCO2eq)"},
  {c:"E-04",t:"대기배출시설 보유 시 자가측정·점검을 수행합니까?",a:"E",help:"대기환경보전법에 따라 반기 1회 이상 자가측정 수행",docs:["자가측정 결과서","대기배출시설 신고서"],law:"대기환경보전법 제39조",guide:"K-ESG E-3",template:"자가측정 항목: 먼지, SOx, NOx, 배출허용기준 대비 측정값 기록"},
  {c:"E-05",t:"폐수배출 또는 위탁처리를 적정하게 관리합니까?",a:"E",help:"물환경보전법에 따라 폐수배출시설 허가/신고 및 처리 기준 준수",docs:["폐수 위탁처리 계약서","수질측정 결과서"],law:"물환경보전법 제33조",guide:"K-ESG E-3",template:"폐수처리 기록부: 배출량(톤/일), BOD/COD 측정값, 위탁처리업체 정보"},
  {c:"E-06",t:"유해화학물질(MSDS) 관리체계를 보유하고 있습니까?",a:"E",help:"화학물질관리법에 따라 MSDS 비치, 취급자 교육 실시",docs:["MSDS 비치 목록","화학물질 교육 이수증"],law:"화학물질관리법",guide:"K-ESG E-4",template:"MSDS 관리대장: 물질명, CAS번호, 보관량, 비치위치, 교육일시"},
  {c:"E-07",t:"폐기물 분류·처리가 기준에 맞게 관리됩니까?",a:"E",help:"일반/지정폐기물 구분, 적법 처리업체 위탁 처리",docs:["폐기물 위탁처리 계약서","폐기물 관리대장"],law:"폐기물관리법",guide:"K-ESG E-5",template:"폐기물 관리대장: 종류(지정/일반), 발생량, 처리방법, 위탁업체, 인수인계서"},
  {c:"E-08",t:"연간 에너지 사용량 집계 및 절감활동을 수행합니까?",a:"E",help:"에너지원별 사용량 집계, 절감 목표·활동 수행",docs:["에너지 사용량 집계표","절감활동 보고서"],law:"에너지이용합리화법",guide:"K-ESG E-2",template:"에너지 절감활동: ①LED 교체(전력 15%↓), ②공조기 인버터(20%↓), ③압축공기 누설점검"},
  {c:"E-09",t:"Scope 1/2 배출 인벤토리를 보유하고 있습니까?",a:"E",help:"직접배출(Scope1)·간접배출(Scope2) 구분 산정",docs:["온실가스 인벤토리","배출량 검증 보고서"],law:"온실가스배출권법",guide:"K-ESG E-2",template:"GHG 인벤토리: Scope1(보일러,차량), Scope2(전력), 배출계수 적용, 연간 총량"},
  {c:"E-10",t:"환경 관련 연간 교육계획 및 이행을 수행합니까?",a:"E",help:"환경 법규, 비상대응 절차 등 연간 교육 계획·실시",docs:["환경교육 계획서","교육 이수 증빙"],law:"환경교육진흥법",guide:"K-ESG E-6",template:"교육계획: 상반기 환경법규(2h), 하반기 비상대응(2h), 신입사원 OJT(1h)"},
  {c:"S-01",t:"인권경영 선언문/정책을 보유하고 공표했습니까?",a:"S",help:"UN 인권경영 원칙 참고, 인권경영 방침 수립·공표",docs:["인권경영 선언문","인권정책 게시 확인"],law:"국가인권위원회법",guide:"K-ESG S-1-1",template:"인권경영 선언문: ①강제노동 금지, ②아동노동 금지, ③차별금지, ④결사의 자유 보장"},
  {c:"S-02",t:"임직원 고충·신고·구제 절차가 운영되고 있습니까?",a:"S",help:"고충처리위원회 또는 신고 채널 운영, 처리 절차 마련",docs:["고충처리 규정","신고 접수 대장"],law:"근로기준법 제76조",guide:"K-ESG S-1-2",template:"고충처리 절차: 접수→조사(5일)→심의→조치→통보→사후관리"},
  {c:"S-03",t:"안전보건방침 수립 및 위험성평가를 정기 수행합니까?",a:"S",help:"산업안전보건법에 따라 위험성평가 연 1회 이상 실시",docs:["안전보건방침","위험성평가 보고서"],law:"산업안전보건법 제36조",guide:"K-ESG S-2",template:"위험성평가: 위험요인 파악→위험성 추정→결정→대책수립→기록"},
  {c:"S-04",t:"비상대응 절차 및 모의훈련을 실시합니까?",a:"S",help:"화재·누출 등 비상상황 대응 절차 수립, 연 1회 이상 모의훈련",docs:["비상대응 매뉴얼","모의훈련 실시 결과"],law:"산업안전보건법",guide:"K-ESG S-2",template:"비상대응: 상황별 시나리오(화재/누출/지진), 훈련계획, 실시결과, 개선사항"},
  {c:"S-05",t:"근로계약, 임금, 근로시간 관리가 법정 기준에 부합합니까?",a:"S",help:"근로기준법 근로계약서 작성, 최저임금 준수, 법정 근로시간 준수",docs:["표준근로계약서","임금대장"],law:"근로기준법",guide:"K-ESG S-3",template:"점검항목: 근로계약서 교부, 최저임금 이상, 주52시간, 연차수당 지급"},
  {c:"S-06",t:"차별금지·평등정책을 수립·교육하고 있습니까?",a:"S",help:"성별·연령·장애 등 차별 금지 정책 수립·교육",docs:["평등정책 규정","교육 이수 현황"],law:"남녀고용평등법",guide:"K-ESG S-3",template:"평등정책: 채용·승진·보상 기준 공개, 성별 임금격차 현황, 교육실시"},
  {c:"S-07",t:"협력사 행동규범(CoC) 및 서약을 운영합니까?",a:"S",help:"협력사 ESG 행동규범 제정, 이행 서약 수령",docs:["협력사 CoC","이행 서약서"],law:"하도급법",guide:"K-ESG S-4",template:"협력사 CoC: 인권·노동·환경·윤리 준수항목 + 위반 시 제재조항 + 연간 점검"},
  {c:"S-08",t:"연간 인권/안전/윤리 등 사회분야 교육을 수행합니까?",a:"S",help:"직장 내 괴롭힘 예방, 안전보건, 개인정보보호 등 법정 교육 실시",docs:["교육계획서","교육 이수 대장"],law:"산업안전보건법 등",guide:"K-ESG S-5",template:"법정교육: 성희롱예방(1h), 괴롭힘예방(1h), 개인정보(1h), 안전보건(6h이상)"},
  {c:"S-09",t:"지역사회 공헌 활동을 수행합니까?",a:"S",help:"봉사활동, 기부, 지역경제 기여 등 사회공헌",docs:["사회공헌 활동 보고","기부금 영수증"],law:"-",guide:"K-ESG S-6",template:"사회공헌 계획: 연간 2회 봉사활동, 매출 0.5% 기부, 지역 채용 비율 관리"},
  {c:"S-10",t:"개인정보 처리방침을 수립·공지하고 준수합니까?",a:"S",help:"개인정보보호법에 따라 처리방침 수립, 홈페이지 등 공개",docs:["개인정보 처리방침","개인정보 관리대장"],law:"개인정보보호법",guide:"K-ESG S-7",template:"처리방침 필수항목: 수집목적, 항목, 보유기간, 파기방법, 위탁현황, 책임자"},
  {c:"G-01",t:"윤리강령 및 부패방지 정책을 수립·교육합니까?",a:"G",help:"임직원 윤리강령 제정, 연 1회 이상 부패방지 교육",docs:["윤리강령","부패방지 교육 증빙"],law:"청탁금지법",guide:"K-ESG G-1",template:"윤리강령: 금품수수금지, 이해충돌방지, 공정거래, 위반 시 징계규정"},
  {c:"G-02",t:"ESG 책임자가 지정되어 정기 보고합니까?",a:"G",help:"ESG 전담 책임자(또는 위원회) 지정, 경영진 정기 보고",docs:["ESG 위원회 구성안","정기보고 회의록"],law:"-",guide:"K-ESG G-2",template:"ESG 위원회: 구성(대표이사+각부서장), 분기 1회 개최, 안건·의결·후속조치 기록"},
  {c:"G-03",t:"법규 준수 및 ESG 리스크 관리 절차를 운영합니까?",a:"G",help:"ESG 법규 준수 점검, 리스크 식별·관리 절차 운영",docs:["컴플라이언스 체크리스트","리스크 관리 대장"],law:"공정거래법",guide:"K-ESG G-3",template:"리스크 관리: ①법규변경 모니터링, ②리스크맵(발생확률×영향도), ③분기별 점검"},
  {c:"G-04",t:"공정거래 준수 프로그램을 운영합니까?",a:"G",help:"하도급·대리점 거래 공정거래 규정 준수 프로그램",docs:["CP 운영 규정","공정거래 교육 증빙"],law:"공정거래법",guide:"K-ESG G-3",template:"CP 프로그램: 자율준수관리자 지정, 교육연 2회, 내부감시체계, 제재절차"},
  {c:"G-05",t:"정보보안 정책 및 점검 절차를 운영합니까?",a:"G",help:"정보보안 정책 수립, 정기 취약점 점검 수행",docs:["정보보안 정책","보안점검 결과서"],law:"정보통신망법",guide:"K-ESG G-4",template:"보안점검: 분기 1회 취약점 스캔, 연 1회 모의해킹, 백업 주기, 접근통제"},
  {c:"G-06",t:"내부신고 제도 및 신고자 보호절차를 운영합니까?",a:"G",help:"부정행위 신고 채널 및 신고자 보호 절차 운영",docs:["내부신고 규정","신고자 보호 지침"],law:"공익신고자보호법",guide:"K-ESG G-5",template:"신고제도: 신고채널(전화/이메일/우편), 익명보장, 보호조치, 처리기한(30일)"},
  {c:"G-07",t:"개인정보보호 책임자 지정 및 접근·권한 관리를 수행합니까?",a:"G",help:"CPO 지정, 접근 권한 관리",docs:["CPO 지정 공문","접근권한 관리대장"],law:"개인정보보호법",guide:"K-ESG G-6",template:"CPO 업무: 처리방침 관리, 접근권한 부여/변경/해제, 위탁업체 감독, 사고대응"},
  {c:"G-08",t:"ESG 관련 정책·절차·기록 문서의 버전관리를 운영합니까?",a:"G",help:"ESG 문서 제·개정 이력 관리, 최신 버전 유지",docs:["문서관리 규정","버전관리 대장"],law:"-",guide:"K-ESG G-7",template:"문서관리: 제·개정번호 체계, 승인절차, 배포관리, 폐기절차, 보존기간"},
  {c:"G-09",t:"ESG 정책/성과를 홈페이지 등 외부에 공시합니까?",a:"G",help:"ESG 정책·성과를 홈페이지, 지속가능보고서 등 공개",docs:["홈페이지 ESG 페이지","지속가능보고서"],law:"-",guide:"K-ESG G-8",template:"공시항목: ESG 방침, 목표/성과, GHG 배출량, 사회공헌 실적, 지배구조 현황"},
  {c:"G-10",t:"임직원 대상 윤리/정보보안/개인정보 교육을 실시합니까?",a:"G",help:"윤리·정보보안·개인정보보호 법정 교육 연 1회 이상",docs:["교육계획서","교육 이수 현황"],law:"개인정보보호법 등",guide:"K-ESG G-9",template:"교육계획: 윤리(2h), 정보보안(2h), 개인정보(1h), 신입교육(4h)"},
];

function predict(ans,uploads){
  const adj=ans.map((v,i)=>uploads[i]&&uploads[i].length>0?Math.min(5,v+0.5):v);
  const calc=(r)=>{const s=adj.slice(r[0],r[1]);return+(s.reduce((a,b)=>a+b,0)/10).toFixed(2);};
  const eA=calc([0,10]),sA=calc([10,20]),gA=calc([20,30]),total=+((eA+sA+gA)/3).toFixed(2),score=Math.round(total*20);
  const strong=adj.filter(v=>v>=4).length,weak=adj.filter(v=>v<=2).length;
  const weakItems=adj.map((v,i)=>({idx:i,...QS[i],score:v,orig:ans[i],hasEv:!!(uploads[i]&&uploads[i].length)})).filter(x=>x.score<=2.5).sort((a,b)=>a.score-b.score);
  const noEvidence=ans.map((v,i)=>({idx:i,...QS[i],score:adj[i],hasEv:!!(uploads[i]&&uploads[i].length)})).filter(x=>!x.hasEv&&x.score<=3);
  return{score,eA,sA,gA,total,strong,weak,weakItems,noEvidence,adj,orig:ans,uploads,...getGrade(score)};
}

/* ═══ GAUGE ═══ */
function Gauge({value,max=100,size=180,color=T.accent,label=""}){
  const r=size/2-14,cx=size/2,cy=size/2+8;const sa=-210,ea=30,rng=ea-sa;
  const pct=Math.min(value/max,1),valA=sa+rng*pct;
  const toR=d=>d*Math.PI/180;
  const arc=(a1,a2)=>{const s={x:cx+r*Math.cos(toR(a1)),y:cy+r*Math.sin(toR(a1))},e={x:cx+r*Math.cos(toR(a2)),y:cy+r*Math.sin(toR(a2))};return`M${s.x},${s.y} A${r},${r} 0 ${a2-a1>180?1:0} 1 ${e.x},${e.y}`;};
  return <svg width={size} height={size*.68} viewBox={`0 0 ${size} ${size*.72}`}>
    <path d={arc(sa,ea)} fill="none" stroke={T.gaugeTrack} strokeWidth={11} strokeLinecap="round"/>
    <path d={arc(sa,valA)} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round"/>
    <text x={cx} y={cy-6} textAnchor="middle" fill={T.text} fontSize={size*.24} fontWeight="800">{value}<tspan fontSize={size*.11} fill={T.textDim}>.0</tspan></text>
    {label&&<text x={cx} y={cy+18} textAnchor="middle" fill={T.textSub} fontSize={12}>{label}</text>}
  </svg>;
}

/* ═══ MAIN APP ═══ */
export default function App(){
  const[step,setStep]=useState("landing");
  const[co,setCo]=useState({name:"",biz:"",size:"중소기업",ksic:"",industry:"제조업"});
  const[ans,setAns]=useState(Array(30).fill(0));
  const[ups,setUps]=useState(Array(30).fill(null));
  const[pg,setPg]=useState(0);
  const[res,setRes]=useState(null);
  const[tab,setTab]=useState("summary");
  const[report,setReport]=useState(null);
  const[rptLoading,setRptLoading]=useState(false);
  const[helpIdx,setHelpIdx]=useState(null);
  const[apiKey,setApiKey]=useState(()=>{ try{return localStorage.getItem("esg_api_key")||"";}catch{return "";} });
  const[isAdmin,setIsAdmin]=useState(false);
  const[showPw,setShowPw]=useState(false);
  const[pw,setPw]=useState("");
  const fRefs=useRef({});
  const answered=ans.filter(v=>v>0).length;

  const doLogin=()=>{if(pw==="esg2026"){setIsAdmin(true);setShowPw(false);}else alert("비밀번호 오류");};
  const reset=()=>{setStep("landing");setAns(Array(30).fill(0));setUps(Array(30).fill(null));setRes(null);setReport(null);setPg(0);setTab("summary");};

  /* ── Consulting ── */
  const genReport=async()=>{
    if(!res)return;setRptLoading(true);setReport(null);
    const indInfo=INDUSTRY_INSIGHT[co.industry]||INDUSTRY_INSIGHT["제조업"];
    const weakByArea=AREAS.map(a=>({...a,items:res.weakItems.filter(w=>w.a===a.id)}));
    const noEvByArea=AREAS.map(a=>({...a,items:res.noEvidence.filter(w=>w.a===a.id)}));
    const weakDetail=weakByArea.map(a=>`[${a.label}(${a.id}) 취약문항]\n${a.items.length===0?"(없음)":a.items.map(w=>`- ${w.c}(${w.orig}점): ${w.t}\n  관련법규: ${w.law}\n  필요서류: ${w.docs.join(", ")}\n  작성가이드: ${w.template}`).join("\n")}`).join("\n\n");
    const noEvDetail=noEvByArea.map(a=>`[${a.label} 증빙미비]\n${a.items.length===0?"(없음)":a.items.map(w=>`- ${w.c}: ${w.t} → 필요서류: ${QS[w.idx].docs.join(", ")}`).join("\n")}`).join("\n\n");

    const prompt=`당신은 ${co.industry} 분야 중소기업 ESG 전문 컨설턴트입니다. 아래 정보를 바탕으로 "${co.name}" 맞춤형 ESG 컨설팅 보고서를 작성하세요.

[기업정보]
기업명: ${co.name} | 산업군: ${co.industry} | 규모: ${co.size}
ESG 종합: ${res.score}점 (${res.grade} ${res.label})
환경(E): ${res.eA}/5.0 | 사회(S): ${res.sA}/5.0 | 지배구조(G): ${res.gA}/5.0
우수문항: ${res.strong}개 | 취약문항: ${res.weak}개

[산업특성 분석 — 300개사 실증 데이터 기반]
- ${co.industry} 강점: ${indInfo.strength}
- ${co.industry} 약점: ${indInfo.weakness}
- 권고사항: ${indInfo.tip}

[영역별 취약문항 상세 (관련법규·필요서류·작성가이드 포함)]
${weakDetail}

[증빙자료 미비 현황]
${noEvDetail}

[참고 법규 체계 — 지식그래프 기반 연계]
환경: 환경정책기본법→ISO14001→환경목표(E-02)→성과관리(E-03)→GHG인벤토리(E-09)
사회: 산업안전보건법→ISO45001→위험성평가(S-03)→비상대응(S-04)→교육(S-08)
지배구조: 청탁금지법→윤리강령(G-01)→내부신고(G-06)→컴플라이언스(G-03)

다음 구조로 보고서를 작성하세요. 각 항목은 충분히 상세하게, 구체적 수치와 일정을 포함하세요.

# ${co.name} ESG 맞춤 컨설팅 보고서

## 1. 종합진단
- 현재 등급과 점수 해석
- ${co.industry} 산업 내 위치 (300개사 실증 분석 기준)
- 핵심 강점 3가지와 시급한 과제 3가지

## 2. 환경(E) 영역 개선과제
- 취약문항별: 현황→문제점→개선방안→필요서류 양식→수치목표→소요기간/비용
- 해당 법규 조항과 인증 기준 명시
- ${co.name}이 즉시 작성할 수 있는 서류 템플릿 제시

## 3. 사회(S) 영역 개선과제
- 동일 구조

## 4. 지배구조(G) 영역 개선과제
- 동일 구조

## 5. 증빙자료 보완 가이드
- 미비 항목별 필요서류, 작성방법, 참고양식

## 6. 실행 로드맵
- 단기(0~6개월): 즉시 실행 가능한 과제 (예산 소규모)
- 중기(6~18개월): 시스템 구축 과제 (인증 취득 등)
- 장기(18~36개월): 고도화 및 성과 창출

## 7. 기대효과
- 등급 향상 시나리오 (현재 ${res.grade} → 목표)
- 경영 실익 (거래처 요구 대응, 금융혜택, 규제 리스크 감소)

한국어로, ${co.industry} 중소기업에 실질적으로 도움이 되는 수준으로 작성하세요.
모든 개선과제에 구체적 서류명, 양식 항목, 작성 예시를 포함하세요.`;

    try{
      try{localStorage.setItem("esg_api_key",apiKey);}catch{}
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:prompt}]})});
      const d=await r.json();
      if(d.error){setReport("API 오류: "+(d.error.message||JSON.stringify(d.error)));}
      else{setReport(d.content?.map(c=>c.text||"").join("\n")||"응답 없음");}
    }catch(e){setReport("API 호출 실패: "+e.message);}
    setRptLoading(false);
  };

  const printReport=()=>window.print();

  /* ═══ SHELL ═══ */
  const Shell=({children})=><div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Pretendard',-apple-system,sans-serif",color:T.text}}>
    <style>{`@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
*{margin:0;padding:0;box-sizing:border-box}
@media print{nav,[data-np]{display:none!important}.print-break{page-break-before:always}body{background:#fff!important;color:#000!important}}`}</style>
    <nav data-np style={{background:"rgba(12,21,32,.92)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:800,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",height:48,justifyContent:"space-between"}}>
        <span onClick={reset} style={{fontSize:14,fontWeight:700,color:T.text,cursor:"pointer"}}>ESG 자가진단 시스템</span>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {isAdmin&&<span style={{fontSize:10,color:T.accent,background:T.accentDim,padding:"2px 8px",borderRadius:4}}>관리자</span>}
          <button onClick={()=>{if(isAdmin)setIsAdmin(false);else setShowPw(!showPw);}} style={{padding:"3px 10px",borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",color:T.textDim,fontSize:11,cursor:"pointer"}}>{isAdmin?"로그아웃":"관리자"}</button>
        </div>
      </div>
      {showPw&&!isAdmin&&<div style={{maxWidth:800,margin:"0 auto",padding:"8px 20px 12px",display:"flex",gap:6}}>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호" onKeyDown={e=>e.key==="Enter"&&doLogin()} style={{flex:1,padding:"7px 12px",borderRadius:6,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:12,outline:"none"}}/>
        <button onClick={doLogin} style={{padding:"7px 14px",borderRadius:6,border:"none",background:T.accent,color:"#000",fontSize:12,fontWeight:600,cursor:"pointer"}}>확인</button>
      </div>}
    </nav>
    <main style={{maxWidth:800,margin:"0 auto",padding:"24px 20px 48px",animation:"fadeUp .4s ease"}}>{children}</main>
  </div>;

  /* ═══ LANDING ═══ */
  if(step==="landing")return<Shell>
    <div style={{textAlign:"center",padding:"52px 20px 44px",background:`linear-gradient(160deg,#080e16,${T.bg},#0a1828)`,borderRadius:20,border:`1px solid ${T.border}`,marginBottom:32}}>
      <p style={{color:T.textDim,fontSize:11,letterSpacing:3,marginBottom:8}}>ESG SELF-DIAGNOSIS v6</p>
      <h1 style={{color:T.accent,fontSize:28,fontWeight:800,marginBottom:10}}>ESG 자가진단 시스템</h1>
      <p style={{color:T.textSub,fontSize:13}}>중소기업중앙회 ESG 규정례 기반 | 30문항 | 13등급 | 39종+150종 진단유형</p>
      <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:16}}>
        {AREAS.map(a=><span key={a.id} style={{background:a.dim,color:a.color,padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:600}}>{a.icon} {a.label} 10문항</span>)}
      </div>
    </div>
    <div style={{background:T.card,borderRadius:16,padding:28,border:`1px solid ${T.border}`,maxWidth:560,margin:"0 auto"}}>
      {[{l:"기업명 *",k:"name",ph:"기업명 입력"},{l:"사업자번호",k:"biz",ph:"000-00-00000"},{l:"기업규모 *",k:"size",sel:["중소기업","중견기업","스타트업"]},{l:"KSIC",k:"ksic",ph:"예: C, J"},{l:"업종구분 *",k:"industry",sel:["제조업","ICT/정보통신","건설업","도소매업","기타서비스"]}].map(f=>
        <div key={f.k} style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:5,display:"block"}}>{f.l}</label>
          {f.sel?<select value={co[f.k]} onChange={e=>setCo({...co,[f.k]:e.target.value})} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:14,outline:"none"}}>{f.sel.map(o=><option key={o}>{o}</option>)}</select>
          :<input value={co[f.k]} onChange={e=>setCo({...co,[f.k]:e.target.value})} placeholder={f.ph} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:14,outline:"none",boxSizing:"border-box"}}/>}
        </div>)}
      <button onClick={()=>{if(!co.name.trim())return alert("기업명을 입력하세요.");setStep("diag");}} style={{width:"100%",marginTop:8,padding:"13px",borderRadius:10,border:"none",background:T.gradBtn,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>자가진단 시작하기</button>
    </div>
  </Shell>;

  /* ═══ DIAGNOSIS ═══ */
  if(step==="diag"){
    const si=pg*5,ei=Math.min(si+5,30),pQs=QS.slice(si,ei);
    return<Shell>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{color:T.textSub,fontSize:13}}>진단 진행률</span>
        <span style={{color:T.accent,fontSize:13,fontWeight:700}}>{answered} / 30 ({Math.round(answered/30*100)}%)</span>
      </div>
      <div style={{height:3,background:T.border,borderRadius:2,marginBottom:6}}><div style={{height:3,background:T.accent,borderRadius:2,width:`${answered/30*100}%`,transition:"width .3s"}}/></div>
      <div style={{display:"flex",gap:3,justifyContent:"center",marginBottom:20}}>
        {Array.from({length:6}).map((_,i)=>{const a=AREAS.find(a2=>i*5>=a2.range[0]&&i*5<a2.range[1]);const done=ans.slice(i*5,i*5+5).filter(v=>v>0).length;
          return<div key={i} onClick={()=>setPg(i)} style={{width:done===5?24:16,height:5,borderRadius:3,background:i===pg?a.color:done===5?a.color+"66":T.border,cursor:"pointer",transition:"all .3s"}}/>;
        })}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {pQs.map((q,qi)=>{const gi=si+qi;const a=AREAS.find(a2=>gi>=a2.range[0]&&gi<a2.range[1]);
          return<div key={q.c} style={{background:T.card,borderRadius:12,padding:"16px 18px",border:`1px solid ${ans[gi]>0?a.color+"44":T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{background:a.dim,color:a.color,padding:"2px 8px",borderRadius:5,fontSize:11,fontWeight:700}}>{a.icon} {q.c}</span>
                <span style={{fontSize:12,color:T.textDim}}>Q{gi+1}/30</span>
              </div>
              <div style={{display:"flex",gap:5}} data-np>
                <button onClick={()=>setHelpIdx(helpIdx===gi?null:gi)} style={{padding:"2px 8px",borderRadius:5,border:`1px solid ${T.border}`,background:helpIdx===gi?a.dim:"transparent",color:helpIdx===gi?a.color:T.textDim,fontSize:11,fontWeight:600,cursor:"pointer"}}>도움말</button>
                <button onClick={()=>fRefs.current[gi]?.click()} style={{padding:"2px 8px",borderRadius:5,border:`1px solid ${T.border}`,background:ups[gi]?a.dim:"transparent",color:ups[gi]?a.color:T.textDim,fontSize:11,fontWeight:600,cursor:"pointer"}}>{ups[gi]?"✓증빙":"증빙"}</button>
                <input ref={el=>fRefs.current[gi]=el} type="file" multiple hidden onChange={e=>{const n=[...ups];n[gi]=Array.from(e.target.files).map(f=>f.name);setUps(n);}}/>
              </div>
            </div>
            <p style={{fontSize:14,fontWeight:600,color:T.text,lineHeight:1.55,marginBottom:10}}>{q.t}</p>
            {helpIdx===gi&&<div style={{background:T.bg,borderRadius:8,padding:12,marginBottom:10,fontSize:12,color:T.textSub,lineHeight:1.6}}>
              <p style={{marginBottom:6}}>{q.help}</p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>{q.docs.map((d,di)=><span key={di} style={{background:T.border,color:T.text,padding:"2px 7px",borderRadius:4,fontSize:10}}>{d}</span>)}</div>
              <p style={{fontSize:10,color:T.textDim}}>법규: {q.law} · {q.guide}</p>
            </div>}
            {ups[gi]&&<div style={{fontSize:11,color:a.color,marginBottom:8}}>📎 {ups[gi].join(", ")} <span style={{color:T.textDim}}>(+0.5점 보정)</span></div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
              {[1,2,3,4,5].map(v=><button key={v} onClick={()=>{const n=[...ans];n[gi]=v;setAns(n);}} style={{padding:"8px 0",borderRadius:7,border:ans[gi]===v?`2px solid ${a.color}`:`1px solid ${T.border}`,background:ans[gi]===v?a.color:"transparent",color:ans[gi]===v?"#fff":T.textDim,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .1s"}}>
                {v}<div style={{fontSize:9,fontWeight:500,marginTop:1,opacity:.8}}>{SCALE[v-1]}</div>
              </button>)}
            </div>
          </div>;
        })}
      </div>
      <div style={{display:"flex",gap:8,marginTop:16}} data-np>
        {pg>0&&<button onClick={()=>setPg(pg-1)} style={{padding:"10px 20px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.textSub,fontWeight:600,fontSize:13,cursor:"pointer"}}>이전</button>}
        {pg<5?<button onClick={()=>setPg(pg+1)} style={{padding:"10px 20px",borderRadius:8,border:"none",background:T.accent,color:"#000",fontWeight:700,fontSize:13,cursor:"pointer"}}>다음</button>
        :<button onClick={()=>{if(answered<30)return alert(`${30-answered}문항이 남았습니다.`);setRes(predict(ans,ups));setStep("result");}} style={{padding:"10px 28px",borderRadius:8,border:"none",background:answered>=30?T.gradBtn:T.textDim,color:"#fff",fontWeight:700,fontSize:14,cursor:answered>=30?"pointer":"not-allowed"}}>진단완료</button>}
      </div>
    </Shell>;
  }

  /* ═══ RESULT ═══ */
  if(step==="result"&&res){
    const indInfo=INDUSTRY_INSIGHT[co.industry]||INDUSTRY_INSIGHT["제조업"];
    const radarD=[{a:"환경(E)",s:res.eA,f:5},{a:"사회(S)",s:res.sA,f:5},{a:"지배구조(G)",s:res.gA,f:5}];
    return<Shell>
      <div style={{textAlign:"center",marginBottom:4}}>
        <p style={{color:T.textDim,fontSize:11,letterSpacing:2}}>ESG DIAGNOSIS REPORT v6</p>
        <h2 style={{color:T.accent,fontSize:22,fontWeight:800}}>ESG 자가진단 결과보고서</h2>
        <p style={{color:T.textSub,fontSize:13,marginTop:4}}>{co.name} | {co.industry} | {co.size}</p>
        <div style={{fontSize:40,fontWeight:900,color:res.color,marginTop:8}}>{res.score}<span style={{fontSize:14,color:T.textDim}}>.0</span></div>
        <div style={{color:res.color,fontSize:13}}>{res.grade} · {res.label}</div>
      </div>
      {/* Tabs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,margin:"18px 0"}} data-np>
        {[{id:"summary",l:"종합"},{id:"area",l:"영역별(39종)"},{id:"detail",l:"상세(150종)"},{id:"consult",l:"AI컨설팅"}].map(t=>
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"9px 0",borderRadius:8,border:tab===t.id?`1.5px solid ${T.accent}`:`1px solid ${T.border}`,background:tab===t.id?T.accentDim:"transparent",color:tab===t.id?T.accent:T.textSub,fontSize:13,fontWeight:tab===t.id?700:500,cursor:"pointer"}}>{t.l}</button>)}
      </div>

      {/* SUMMARY */}
      {tab==="summary"&&<div>
        <div style={{background:T.card,borderRadius:16,padding:24,border:`1px solid ${T.border}`,textAlign:"center",marginBottom:16}}>
          <p style={{color:T.textSub,fontSize:13,marginBottom:4}}>종합 진단 결과</p>
          <Gauge value={res.score} color={res.color} label={res.label}/>
          <span style={{display:"inline-block",background:res.color+"22",color:res.color,padding:"4px 14px",borderRadius:8,fontSize:12,fontWeight:700,marginTop:4}}>{res.label}</span>
          <p style={{color:T.textSub,fontSize:13,marginTop:12,lineHeight:1.6,maxWidth:480,marginLeft:"auto",marginRight:"auto"}}>
            {res.grade==="A"||res.grade==="B+"?`${co.name}은(는) ESG 경영이 ${res.label} 수준입니다.`:
             res.grade==="B0"||res.grade==="B-"?`${co.name}은(는) ESG 경영 기반이 갖춰져 있으나 취약 ${res.weak}개 문항의 개선이 필요합니다.`:
             `${co.name}은(는) ESG 경영 인식이 낮아 법규 위반 가능성이 상존합니다. 즉각적 조치가 필요합니다.`}
          </p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {AREAS.map(a=>{const v=a.id==="E"?res.eA:a.id==="S"?res.sA:res.gA;const sc=Math.round(v*20);const g=getGrade(sc);
            return<div key={a.id} style={{background:T.card,borderRadius:12,padding:14,border:`1px solid ${T.border}`,textAlign:"center"}}>
              <p style={{color:T.textSub,fontSize:11,marginBottom:2}}>{a.icon} {a.label}</p>
              <Gauge value={sc} size={120} color={a.color} label={g.grade}/>
            </div>;
          })}
        </div>
        <div style={{background:T.card,borderRadius:14,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
          <p style={{color:T.text,fontSize:14,fontWeight:700,marginBottom:8,textAlign:"center"}}>영역별 균형 분석</p>
          <ResponsiveContainer width="100%" height={200}><RadarChart data={radarD}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="a" tick={{fontSize:12,fill:T.textSub}}/><PolarRadiusAxis domain={[0,5]} tick={{fontSize:9,fill:T.textDim}}/><Radar dataKey="s" fill={T.accent} fillOpacity={.15} stroke={T.accent} strokeWidth={2}/></RadarChart></ResponsiveContainer>
        </div>
        {/* 종합분석 — E/S/G 영역별 */}
        <div style={{background:T.card,borderRadius:14,padding:20,border:`1px solid ${T.border}`,marginBottom:16}}>
          <h3 style={{color:T.text,fontSize:15,fontWeight:700,marginBottom:14}}>종합 분석</h3>
          {AREAS.map(a=>{const v=a.id==="E"?res.eA:a.id==="S"?res.sA:res.gA;const sc=Math.round(v*20);const wk=res.weakItems.filter(w=>w.a===a.id);const noEv=res.noEvidence.filter(w=>w.a===a.id);
            return<div key={a.id} style={{marginBottom:16,padding:14,background:a.dim,borderRadius:10,border:`1px solid ${a.color}22`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{color:a.color,fontSize:14,fontWeight:700}}>{a.icon} {a.label} ({a.eng})</span>
                <span style={{color:a.color,fontSize:15,fontWeight:800}}>{sc}점 <span style={{fontSize:11,fontWeight:500}}>{getGrade(sc).grade}</span></span>
              </div>
              <p style={{color:T.textSub,fontSize:13,lineHeight:1.6,marginBottom:6}}>
                {sc>=70?`${a.label} 영역은 우수한 수준입니다. 지속적 관리와 고도화를 추진하세요.`:
                 sc>=50?`${a.label} 영역의 기본 체계는 갖추어져 있으나, ${wk.length}개 취약 문항의 집중 개선이 필요합니다.`:
                 `${a.label} 영역은 즉각적인 개선이 필요합니다. 관련 법규 준수 여부를 긴급 점검하세요.`}
              </p>
              {wk.length>0&&<p style={{fontSize:12,color:T.red}}>취약: {wk.map(w=>w.c).join(", ")}</p>}
              {noEv.length>0&&<p style={{fontSize:12,color:T.yellow,marginTop:2}}>⚠ 증빙 미비 {noEv.length}건 — 보완 시 등급 향상 가능</p>}
            </div>;
          })}
          {/* 산업특성 */}
          <div style={{padding:14,background:T.accentDim,borderRadius:10,border:`1px solid ${T.accentBorder}`}}>
            <p style={{color:T.accent,fontSize:13,fontWeight:700,marginBottom:6}}>📊 {co.industry} 산업 특성 (300개사 실증 분석 기반)</p>
            <p style={{color:T.textSub,fontSize:12,lineHeight:1.6}}>
              강점: {indInfo.strength}<br/>약점: {indInfo.weakness}<br/>권고: {indInfo.tip}
            </p>
          </div>
        </div>
      </div>}

      {/* AREA (39종) */}
      {tab==="area"&&<div>
        <div style={{background:T.card,borderRadius:12,padding:16,border:`1px solid ${T.border}`,marginBottom:12}}>
          <p style={{color:T.text,fontSize:14,fontWeight:700}}>영역별 분석 (39종 진단유형)</p>
          <p style={{color:T.textDim,fontSize:12}}>E/S/G 각 영역 13등급 × 3영역 = 39종 진단 유형</p>
        </div>
        {AREAS.map(a=>{const aAns=res.adj.slice(a.range[0],a.range[1]);const avg=+(aAns.reduce((s,v)=>s+v,0)/10).toFixed(1);const sc=Math.round(avg*20);const g=getGrade(sc);
          return<div key={a.id} style={{background:T.card,borderRadius:14,padding:20,border:`1px solid ${T.border}`,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{color:a.color,fontSize:15,fontWeight:700}}>{a.icon} {a.label} ({a.eng})</span>
              <span style={{color:a.color,fontSize:16,fontWeight:800}}>{sc}점 <span style={{fontSize:12,background:a.dim,padding:"2px 8px",borderRadius:4}}>{g.grade}</span></span>
            </div>
            <div style={{background:a.dim,borderRadius:8,padding:12,marginBottom:12,fontSize:12,color:T.textSub,lineHeight:1.6}}>
              <p><strong style={{color:a.color}}>진단유형: {a.label} {g.label.split("(")[0]}</strong></p>
              <p>{sc>=70?`${a.label} 경영 방침이 체계적으로 수립되어 있으며, 지속적 성과관리가 이루어지고 있습니다.`:
                sc>=50?`기본 체계는 갖추어져 있으나, 일부 문항에서 개선이 필요합니다. 증빙자료 보완을 권고합니다.`:
                `관리 체계가 미흡합니다. 법규 준수 현황을 즉시 점검하고, 기본 방침 수립부터 시작하세요.`}</p>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={QS.slice(a.range[0],a.range[1]).map((q,i)=>({name:q.c,score:aAns[i]*20}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:T.textDim}}/>
                <YAxis domain={[0,100]} tick={{fontSize:10,fill:T.textDim}}/>
                <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text}}/>
                <Bar dataKey="score" radius={[3,3,0,0]}>{QS.slice(a.range[0],a.range[1]).map((_,i)=><Cell key={i} fill={aAns[i]*20>=70?T.green:aAns[i]*20>=50?T.yellow:T.red}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>;
        })}
      </div>}

      {/* DETAIL (150종) */}
      {tab==="detail"&&<div style={{background:T.card,borderRadius:14,padding:18,border:`1px solid ${T.border}`}}>
        <p style={{color:T.text,fontSize:14,fontWeight:700,marginBottom:4}}>개별 문항 상세 분석 (150종 진단유형)</p>
        <p style={{color:T.textDim,fontSize:12,marginBottom:12}}>30문항 × 5등급 = 150종 고유 진단유형</p>
        {AREAS.map(a=><div key={a.id}>
          <div style={{background:a.dim,padding:"8px 12px",borderRadius:8,marginBottom:6,marginTop:a.id!=="E"?10:0}}>
            <span style={{color:a.color,fontSize:13,fontWeight:700}}>{a.icon} {a.label} 영역</span>
          </div>
          {QS.slice(a.range[0],a.range[1]).map((q,qi)=>{const gi=a.range[0]+qi;const sc=res.adj[gi];const sc100=Math.round(sc*20);const g=getGrade(sc100);
            return<div key={q.c} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${T.border}22`}}>
              <span style={{fontSize:11,fontWeight:700,color:a.color,minWidth:36}}>{q.c}</span>
              <span style={{flex:1,fontSize:12,color:T.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.t}</span>
              <span style={{fontSize:12,fontWeight:700,color:g.color}}>{g.grade}</span>
              <span style={{fontSize:12,fontWeight:700,color:g.color,minWidth:32,textAlign:"right"}}>{sc100}점</span>
            </div>;
          })}
        </div>)}
      </div>}

      {/* CONSULTING */}
      {tab==="consult"&&<div>
        <div style={{background:T.card,borderRadius:10,padding:14,marginBottom:12,border:`1px solid ${T.border}`}}>
          <p style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:6}}>Anthropic API Key</p>
          <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-api03-..." style={{width:"100%",padding:"9px 12px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          <p style={{fontSize:10,color:T.textDim,marginTop:4}}>console.anthropic.com 발급 키 입력 (브라우저에만 저장)</p>
        </div>
        {isAdmin&&<div style={{background:T.card,borderRadius:10,padding:12,marginBottom:12,border:`1px solid ${T.border}`}}>
          <p style={{fontSize:11,color:T.accent,fontWeight:700,marginBottom:6}}>🔒 관리자: 조건 선택</p>
          <div style={{display:"flex",gap:6}}>
            {["Baseline","RAG","RAG_KG"].map(c=><span key={c} style={{flex:1,textAlign:"center",padding:"6px",borderRadius:6,border:`1px solid ${c==="RAG_KG"?T.accent:T.border}`,background:c==="RAG_KG"?T.accentDim:"transparent",color:c==="RAG_KG"?T.accent:T.textDim,fontSize:11,fontWeight:600}}>{c}{c==="RAG_KG"?" ✓":""}</span>)}
          </div>
        </div>}
        <button onClick={()=>{if(!apiKey.trim()){alert("API Key를 입력해주세요.");return;}genReport();}} disabled={rptLoading} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:rptLoading?T.textDim:T.gradBtn,color:"#fff",fontSize:15,fontWeight:700,cursor:rptLoading?"wait":"pointer",marginBottom:16}}>
          {rptLoading?"⏳ 보고서 생성 중... (30~60초)":"🤖 "+co.name+" 맞춤 컨설팅 보고서 생성"}
        </button>
        {report&&<div style={{background:T.card,borderRadius:14,padding:24,border:`1px solid ${T.border}`,animation:"fadeUp .5s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:14,marginBottom:16,borderBottom:`1px solid ${T.border}`}}>
            <div>
              <h3 style={{color:T.accent,fontSize:16,fontWeight:700}}>{co.name} ESG 맞춤 컨설팅 보고서</h3>
              <p style={{color:T.textDim,fontSize:11,marginTop:2}}>{co.industry} · {res.grade} {res.label} · RAG+KG 기반 분석</p>
            </div>
            <span style={{background:T.accentDim,color:T.accent,padding:"3px 10px",borderRadius:5,fontSize:10,fontWeight:600}}>AI Generated</span>
          </div>
          <div style={{fontSize:14,color:T.text,lineHeight:1.85,whiteSpace:"pre-wrap"}}>{report}</div>
        </div>}
      </div>}

      {/* Bottom buttons */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:20}} data-np>
        <button onClick={reset} style={{padding:"13px",borderRadius:10,border:`1px solid ${T.border}`,background:"transparent",color:T.textSub,fontSize:14,fontWeight:600,cursor:"pointer"}}>새로 진단</button>
        <button onClick={()=>setTab("consult")} style={{padding:"13px",borderRadius:10,border:"none",background:T.accent,color:"#000",fontSize:14,fontWeight:700,cursor:"pointer"}}>컨설팅</button>
        <button onClick={printReport} style={{padding:"13px",borderRadius:10,border:"none",background:T.gradBtn,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>인쇄 / PDF</button>
      </div>
    </Shell>;
  }
  return null;
}
