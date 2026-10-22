import { mkdir } from "node:fs/promises";

const sections = [
  { id:"possibility", title:"The possibility", start:0, duration:25, shots:[
    [0,8,"Authority should rotate","A savings circle with three separate powers.","overview.jpg","contain"],
    [8,8,"Hostless Hui","Members contribute. The receiving turn changes by cycle.","overview.jpg","contain"],
    [16,9,"Operate. Approve. Redeem.","Hosting does not automatically grant access to a release code.","sealed.jpg","cover"],
  ]},
  { id:"constraint", title:"The constraint", start:25, duration:25, shots:[
    [0,9,"Who controls the server?","Ordinary login can leave the operator in control of permissions.","denied.jpg","contain"],
    [9,8,"Access denied","Operator has no default reader grant for Bao's turn.","denied.jpg","contain"],
    [17,8,"A request is not a grant","The group must decide before access changes.","pending-zero.jpg","cover"],
  ]},
  { id:"prototype", title:"The prototype", start:50, duration:50, shots:[
    [0,6,"A working simulation","Bao seals cycle four. All identities and funds shown are fictional.","sealed.jpg","cover"],
    [6,3,"Operator is denied","The app checks the committed reader grant on the server.","denied.jpg","contain"],
    [9,5,"Pending • 0 of 2","Proposed by Operator. Nothing has been applied.","pending-zero.jpg","cover"],
    [14,4,"One vote. No new access.","Hanh approves. The request remains pending.","pending-one.jpg","cover"],
    [18,4,"Committed • 2 of 2","Tuan approves independently. The reader grant now takes effect.","committed.jpg","cover"],
    [22,6,"Read does not mean redeem","Operator may inspect the sample code. Only Bao may redeem.","operator-open.jpg","cover"],
    [28,4,"The recipient redeems once","Bao's own reader grant was approved separately before this redemption.","recipient-redeemed.jpg","cover"],
    [32,18,"Why TideCloak matters","Intended boundary: signed record policies and ORK decryption beyond server permissions. Live proof is pending.","evidence.jpg","contain"],
  ]},
  { id:"changes", title:"What changes", start:100, duration:20, shots:[
    [0,8,"Oversight without one ruler","Visible proposals. Independent review. Access scoped to each turn.","committed.jpg","cover"],
    [8,7,"Authority has a lifetime","Renewal and revocation require review. A copied code cannot be recalled.","evidence.jpg","contain"],
    [15,5,"Hostless Hui","Disclosure prototype • synthetic funds. Next gate: live Tide cryptographic acceptance.","overview.jpg","contain"],
  ]},
] as const;
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
await mkdir('compositions',{recursive:true});
const style=`@font-face{font-family:Geist;src:url('assets/fonts/geist.woff2');font-weight:100 900}*{box-sizing:border-box}#root{position:absolute;inset:0;background:#090a0f;color:#eef1f8;font-family:Geist,sans-serif}.chapter{position:absolute;left:64px;top:32px;font-size:23px;font-weight:600;color:#fbbf24}.mode{position:absolute;right:64px;top:35px;font-size:17px;color:#aab3c8}.clip{position:absolute;inset:0}.layout{position:absolute;inset:0}.words{position:absolute;left:64px;top:165px;width:335px}h1{font-size:49px;line-height:1.08;letter-spacing:-1.5px;margin:0;font-weight:680}p.note{font-size:23px;line-height:1.35;color:#aab3c8;margin-top:24px}.screen{position:absolute;left:440px;top:116px;width:776px;height:456px;border:1px solid #293041;border-radius:12px;overflow:hidden;background:#10131c}.screen img{width:100%;height:100%;object-position:center bottom}.receipt{position:absolute;left:64px;bottom:105px;font-size:16px;color:#aab3c8}`;
const safeStyle=style.replaceAll("font-size:17px","font-size:19px").replace("bottom:105px;font-size:16px","bottom:38px;font-size:19px") + '.screen img[style*="contain"]{object-position:center center}';
for(const section of sections){
  const shots=section.shots.map((s,i)=>`<section id="${section.id}-shot-${i}" class="clip" data-start="${s[0]}" data-duration="${s[1]}" data-track-index="1" data-hold="true"><div id="${section.id}-body-${i}" class="layout"><div class="words"><h1>${esc(s[2])}</h1><p class="note">${esc(s[3])}</p></div><div class="screen" data-layout-allow-overflow><img src="assets/${s[4]}" style="object-fit:contain;object-position:center" alt="Authentic Hostless Hui prototype state" /></div></div></section>`).join('\n');
  const tweens=section.shots.map((s,i)=>`tl.fromTo('#${section.id}-body-${i}',{opacity:0.3,x:18},{opacity:1,x:0,duration:0.35,ease:'power3.out'},${s[0]});`).join('\n');
  await Bun.write(`compositions/${section.id}.html`,`<template><style>${safeStyle}</style><div id="root" data-composition-id="${section.id}" data-width="1280" data-height="720" data-duration="${section.duration}"><div class="chapter">${section.title}</div><div class="mode">SIMULATED PROTOTYPE</div>${shots}<div class="receipt">Actual app captures • live Tide encryption and quorum not yet verified</div></div><script>const tl=gsap.timeline({paused:true});${tweens}window.__timelines['${section.id}']=tl;</script></template>`);
}
const narration=(await Bun.file('../voiceover-en.txt').text()).trim().split(/\r?\n\s*\r?\n/);
const audio=[{start:.7,duration:20.271},{start:25.7,duration:20.688938},{start:50.4,duration:45.479125},{start:100.2,duration:19.4}];
const caps: {start:number,end:number,text:string}[]=[];
for(let p=0;p<4;p++){const words=narration[p].split(/\s+/); for(let j=0;j<words.length;j+=10){const end=Math.min(words.length,j+10);caps.push({start:audio[p].start+j/words.length*audio[p].duration,end:audio[p].start+end/words.length*audio[p].duration,text:words.slice(j,end).join(' ')});}}
const capMarkup=caps.map((cap,i)=>`<div id="caption-${i}" class="clip caption" data-start="${cap.start.toFixed(3)}" data-duration="${(cap.end-cap.start).toFixed(3)}" data-track-index="1"><p>${esc(cap.text)}</p></div>`).join('\n');
await Bun.write('compositions/captions.html',`<template><style>@font-face{font-family:Geist;src:url('assets/fonts/geist.woff2');font-weight:100 900}#root{position:absolute;inset:0;pointer-events:none}.caption{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:0 128px 72px}.caption p{margin:0;padding:10px 18px;background:#090a0f;color:#eef1f8;font:500 24px/1.25 Geist,sans-serif;text-align:center;max-width:1024px;border-radius:8px}</style><div id="root" data-composition-id="captions" data-width="1280" data-height="720" data-duration="120" data-no-timeline>${capMarkup}</div></template>`);
const hosts=sections.map((s,i)=>`<div id="${s.id}" class="clip" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.start}" data-duration="${s.duration}" data-track-index="${i+1}" data-track-kind="graphics" data-width="1280" data-height="720"></div>`).join('\n');
await Bun.write('index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Hostless Hui — RMIT UNLOCKED</title><script src="assets/gsap.min.js"></script><style>html,body{margin:0;width:1280px;height:720px;overflow:hidden;background:#090a0f}#root{position:relative;width:100%;height:100%;overflow:hidden}.clip{position:absolute;inset:0}#progress{position:absolute;left:64px;bottom:24px;width:1152px;height:3px;background:#fbbf24;transform-origin:left center;z-index:100}</style></head><body><div id="root" data-composition-id="main" data-duration="120" data-start="0" data-width="1280" data-height="720" data-fps="24">${hosts}<div id="captions" class="clip" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="120" data-track-index="8" data-track-kind="captions" data-width="1280" data-height="720" data-no-timeline style="z-index:50"></div>${audio.map((a,i)=>`<audio id="voice-${i+1}" class="clip" src="assets/audio/part-${i+1}.mp3" data-start="${a.start}" data-duration="${a.duration}" data-playback-rate="${i===3?1.071:1}" data-track-index="9" data-volume="1"></audio>`).join('')}<div id="progress"></div></div><script>const tl=gsap.timeline({paused:true});tl.fromTo('#progress',{scaleX:0},{scaleX:1,duration:120,ease:'none'},0);window.__timelines.main=tl;</script></body></html>`);
const stamp=(n:number)=>{const ms=Math.round(n*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`};
await Bun.write('../video-en.srt',caps.map((cap,i)=>`${i+1}\n${stamp(cap.start)} --> ${stamp(cap.end)}\n${cap.text}\n`).join('\n'));
console.log('Authored four sections, 120 seconds, captions and four supplied voice tracks.');
