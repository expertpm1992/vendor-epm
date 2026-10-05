/* The public vendor recruiting page, "ExpertPM Official Vendors Platform"
   (expertpm.com/vendors on the CRM). Copied verbatim from
   expertpm-crm/worker.js VENDORS_PAGE_BODY; the only change is that its
   photos load from expertpm.com/blog-img/ (the CRM serves them there).
   The CRM page is the source of truth until launch: if its copy changes,
   copy it again (see README). String.raw: no backticks, no dollar-brace, no
   backslashes. <!--VN_PRICES--> is filled in by src/apply.js. */
export const VENDORS_PAGE_BODY = String.raw`<!--
THESIS: /vendors is ExpertPM's dispatch desk seen from the contractor's side: real job tickets, a real pay calendar, a real map of the valley. Refuses the handshake-photo hero and the grid of identical icon cards.
OWN-WORLD: ExpertPM navy fields and gold signal; white work-order tickets with perforated stubs and a stamped status; Ridge-and-Valley contour lines; the Susquehanna's two branches as the map spine; Inter at 800-900.
STORY: A contractor sees steady, organized work, sees exactly how the money moves (invoice by the 5th, paid on the 10th), knows the bar ($1M GL on file), and applies in three short steps.
FIRST VIEWPORT: navy full-bleed with drifting ridge lines. Left: kicker, headline, lede, gold Apply + ghost Spring-mowing CTAs. Right: a phone receiving example job tickets that get accepted and stamped. Mobile: copy then phone.
FORM: dispatch board (outline approved by John in chat; no seed run).
-->
<style>
.vn{--navy:hsl(230 85% 15%);--navy-2:hsl(231 80% 10%);--navy-3:hsl(229 62% 22%);--gold:hsl(45 95% 55%);--gold-2:hsl(45 85% 45%);--gold-t:hsl(38 90% 34%);--ink:#161b33;--muted:#4f5870;--line:#e3e6ee;--bg:#f3f4f7;--on-navy:hsl(226 60% 88%);--on-navy-2:hsl(226 40% 72%);font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--bg);overflow-x:clip}
.vn *,.vn *::before,.vn *::after{box-sizing:border-box}
.vn :where(h1,h2,h3,h4,p,ul,ol,figure,dl,dd){margin:0;padding:0}
.vn :where(ul,ol){list-style:none}
.vn :where(img){display:block;max-width:100%;height:auto}
.vn :where(a){color:inherit}
.vn-wrap{max-width:1200px;margin:0 auto;padding:0 24px}
.vn h2{font-size:clamp(2rem,4.4vw,3.35rem);font-weight:900;letter-spacing:-.032em;line-height:1.04;text-wrap:balance}
.vn-lead{font-size:clamp(1.02rem,1.5vw,1.16rem);line-height:1.65;font-weight:500;color:var(--muted);max-width:62ch}
.vn-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 26px;border-radius:999px;font:800 16px/1 'Inter',sans-serif;text-decoration:none;border:2px solid transparent;cursor:pointer;transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s,background .2s,color .2s}
.vn-btn svg{width:18px;height:18px;flex:none;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.vn-btn:hover svg{transform:translateX(3px)}
.vn-btn:focus-visible,.vn a:focus-visible,.vn button:focus-visible,.vn summary:focus-visible{outline:3px solid var(--gold);outline-offset:3px}
.vn-btn-gold{background:var(--gold);color:var(--navy);box-shadow:0 10px 26px -10px hsl(45 95% 55% / .7)}
.vn-btn-gold:hover{transform:translateY(-2px);box-shadow:0 16px 30px -12px hsl(45 95% 55% / .8)}
.vn-btn-ghost{color:#fff;border-color:hsl(226 60% 88% / .35)}
.vn-btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
.vn-btn-navy{background:var(--navy);color:#fff;box-shadow:0 12px 26px -14px hsl(230 85% 15% / .8)}
.vn-btn-navy:hover{transform:translateY(-2px)}

/* ---------- hero ---------- */
.vn-hero{position:relative;background:radial-gradient(120% 90% at 85% 20%,hsl(229 70% 24%) 0%,var(--navy) 46%,var(--navy-2) 100%);color:#fff;padding:clamp(128px,15vh,170px) 0 clamp(64px,9vw,110px);overflow:hidden;isolation:isolate}
.vn-ridges{position:absolute;inset:-6% -4%;width:108%;height:112%;z-index:-1;pointer-events:none}
.vn-ridges path{fill:none;stroke:hsl(222 70% 62% / .16);stroke-width:1.3}
.vn-ridges path:nth-child(3n){stroke:hsl(222 70% 62% / .26)}
.vn-ridges path.vn-rg{stroke:hsl(45 95% 55% / .32);stroke-width:1.6;stroke-dasharray:3 14}
.vn-ridges g{animation:vnDrift 38s ease-in-out infinite alternate}
@keyframes vnDrift{from{transform:translate3d(0,0,0)}to{transform:translate3d(-40px,18px,0)}}
.vn-hero-in{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr);gap:clamp(28px,5vw,72px);align-items:center}
.vn-kicker{display:inline-flex;align-items:center;gap:9px;font:800 12.5px/1 'Inter',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);padding:9px 14px;border:1px solid hsl(45 95% 55% / .35);border-radius:999px;background:hsl(45 95% 55% / .08)}
.vn-kicker i{width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 0 hsl(45 95% 55% / .6);animation:vnBeat 2.4s ease-out infinite}
@keyframes vnBeat{0%{box-shadow:0 0 0 0 hsl(45 95% 55% / .55)}70%,100%{box-shadow:0 0 0 10px hsl(45 95% 55% / 0)}}
.vn-hero h1{font-size:clamp(3rem,7vw,5.9rem);font-weight:900;letter-spacing:-.04em;line-height:.98;margin:22px 0 22px;text-wrap:balance}
.vn-hero h1 span{color:var(--gold);display:inline-block}
.vn-hero .vn-lead{color:var(--on-navy);max-width:54ch}
.vn-ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.vn-micro{margin-top:16px;font-size:13.5px;font-weight:600;color:var(--on-navy-2)}
.vn-rise{animation:vnRise .9s cubic-bezier(.16,1,.3,1) both}
.vn-rise:nth-child(2){animation-delay:.08s}.vn-rise:nth-child(3){animation-delay:.16s}.vn-rise:nth-child(4){animation-delay:.24s}.vn-rise:nth-child(5){animation-delay:.32s}
@keyframes vnRise{from{opacity:0;transform:translateY(18px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}

/* phone + job tickets */
.vn-stage{position:relative;display:flex;justify-content:center;animation:vnRise 1.1s .2s cubic-bezier(.16,1,.3,1) both}
.vn-phone{position:relative;width:min(318px,78vw);aspect-ratio:318/640;border-radius:48px;background:linear-gradient(160deg,#2a3150,#0b1030 55%,#1b2244);padding:11px;box-shadow:0 50px 90px -30px hsl(231 90% 4% / .9),0 18px 40px -20px hsl(231 90% 4% / .8),inset 0 0 0 1.5px hsl(226 40% 70% / .25)}
.vn-screen{position:relative;height:100%;border-radius:38px;overflow:hidden;background:linear-gradient(180deg,#eef1f7,#e6eaf3)}
.vn-sbar{display:flex;justify-content:space-between;align-items:center;padding:14px 26px 0;font:700 12.5px/1 'Inter',sans-serif;color:#111}
.vn-notch{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:96px;height:26px;border-radius:14px;background:#0b1030;z-index:3}
.vn-sbar b{display:inline-flex;gap:3px;align-items:flex-end}
.vn-sbar b i{display:block;width:3px;background:#111;border-radius:1px}
.vn-apph{display:flex;align-items:center;gap:9px;padding:24px 18px 10px;font:800 13px/1.2 'Inter',sans-serif;color:var(--navy)}
.vn-apph em{font-style:normal;display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--navy);color:var(--gold);font:900 11px/1 'Inter',sans-serif;letter-spacing:.02em}
.vn-apph small{display:block;font:600 11px/1.2 'Inter',sans-serif;color:#6b7390}
.vn-tks{position:relative;margin:4px 12px 0;height:322px}
.vn-wk{margin:14px 12px 0;padding:12px 14px;border-radius:16px;background:hsl(230 40% 97%);border:1px solid #dde1ec}
.vn-wk p{font:800 10.5px/1 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#6b7390;margin-bottom:8px}
.vn-wk div{display:flex;align-items:center;gap:8px;padding:6px 0;font:700 12px/1.2 'Inter',sans-serif;color:var(--ink);border-top:1px solid #e3e6ef}
.vn-wk div:first-of-type{border-top:0}
.vn-wk span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vn-wk b{font-weight:800;color:hsl(145 55% 30%);font-size:11px}
.vn-wk i{width:16px;height:16px;border-radius:50%;background:hsl(145 55% 38%);flex:none;position:relative}
.vn-wk i::after{content:"";position:absolute;left:5px;top:3px;width:4px;height:7px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.vn-wk i.due{background:var(--gold)}
.vn-wk i.due::after{display:none}
.vn-wk b.due{color:var(--gold-t)}
.vn-tk{position:absolute;inset:0 0 auto 0;background:#fff;border-radius:18px;box-shadow:0 14px 30px -18px hsl(230 60% 20% / .45),0 2px 6px -2px hsl(230 60% 20% / .12);opacity:0;transform:translateY(46px) scale(.97);animation:vnTk 13.5s cubic-bezier(.16,1,.3,1) infinite}
.vn-tk:nth-child(2){animation-delay:4.5s}.vn-tk:nth-child(3){animation-delay:9s}
@keyframes vnTk{0%{opacity:0;transform:translateY(46px) scale(.97)}5%,30%{opacity:1;transform:none}34%,100%{opacity:0;transform:translateY(-34px) scale(.95)}}
.vn-tk-top{padding:14px 15px 12px}
.vn-tag{display:flex;justify-content:space-between;align-items:center;gap:8px;font:800 10.5px/1 'Inter',sans-serif;letter-spacing:.08em;text-transform:uppercase}
.vn-tag span{white-space:nowrap}
.vn-tag span:first-child{color:var(--gold-t);background:hsl(45 95% 55% / .16);padding:5px 8px;border-radius:6px}
.vn-tag span:last-child{color:#6b7390;display:inline-flex;align-items:center;gap:4px}
.vn-tk h4{margin:10px 0 0;font:900 17px/1.2 'Inter',sans-serif;letter-spacing:-.02em;color:var(--navy)}
.vn-tk dl{margin-top:10px;display:grid;gap:6px}
.vn-tk dl div{display:flex;justify-content:space-between;gap:10px;font:600 12px/1.3 'Inter',sans-serif;color:#5d6682}
.vn-tk dd{font-weight:800;color:var(--ink)}
.vn-shots{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:11px}
.vn-shots i{display:block;aspect-ratio:1;border-radius:6px;background-size:360% auto;background-color:#dfe3ec}
.vn-shots-l{margin-top:6px;font:700 10.5px/1 'Inter',sans-serif;color:#6b7390}
.vn-perf{position:relative;height:0;border-top:2px dashed #d9dde8;margin:0 14px}
.vn-perf::before,.vn-perf::after{content:"";position:absolute;top:-10px;width:18px;height:18px;border-radius:50%;background:#e9ecf4}
.vn-perf::before{left:-24px}.vn-perf::after{right:-24px}
.vn-tk-bot{position:relative;padding:12px 15px 15px}
.vn-tk-bot p{font:600 11px/1.3 'Inter',sans-serif;color:#6b7390;margin-bottom:9px}
.vn-accept{display:flex;align-items:center;justify-content:center;height:42px;border-radius:999px;background:var(--gold);color:var(--navy);font:800 13.5px/1 'Inter',sans-serif;animation:vnPress 13.5s linear infinite}
.vn-tk:nth-child(2) .vn-accept{animation-delay:4.5s}.vn-tk:nth-child(3) .vn-accept{animation-delay:9s}
@keyframes vnPress{0%,15%{transform:none;background:var(--gold);color:var(--navy)}16.5%{transform:scale(.94);background:var(--gold-2);color:var(--navy)}18.5%,100%{transform:none;background:hsl(145 55% 38%);color:#fff}}
.vn-accept b{font-weight:800}
.vn-accept b+b{display:none}
.vn-stamp{position:absolute;right:14px;top:-58px;transform:rotate(-12deg) scale(1.7);opacity:0;border:3px solid hsl(145 55% 36%);color:hsl(145 55% 32%);border-radius:10px;padding:6px 10px;font:900 15px/1 'Inter',sans-serif;letter-spacing:.12em;background:hsl(145 60% 96% / .9);animation:vnStamp 13.5s cubic-bezier(.2,1.4,.4,1) infinite}
.vn-tk:nth-child(2) .vn-stamp{animation-delay:4.5s}.vn-tk:nth-child(3) .vn-stamp{animation-delay:9s}
@keyframes vnStamp{0%,17.5%{opacity:0;transform:rotate(-12deg) scale(1.7)}20.5%,100%{opacity:1;transform:rotate(-12deg) scale(1)}}
.vn-ping{position:absolute;right:calc(50% + 124px);top:3%;z-index:2;display:flex;align-items:center;gap:10px;padding:10px 14px 10px 10px;border-radius:16px;background:hsl(231 60% 14% / .82);border:1px solid hsl(226 60% 88% / .16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 18px 36px -18px hsl(231 90% 4% / .9);color:#fff;font:700 12.5px/1.25 'Inter',sans-serif;white-space:nowrap;opacity:0;animation:vnPing 13.5s cubic-bezier(.16,1,.3,1) infinite}
.vn-ping small{display:block;font-weight:600;color:var(--on-navy-2);font-size:11px}
.vn-ping svg{width:30px;height:30px;flex:none}
.vn-ping:nth-of-type(2){animation-delay:4.5s;top:auto;bottom:20%;right:auto;left:calc(50% + 128px)}
.vn-ping:nth-of-type(3){animation-delay:9s;top:auto;bottom:8%;right:auto;left:calc(50% + 128px)}
@keyframes vnPing{0%{opacity:0;transform:translateY(10px) scale(.96)}4%,27%{opacity:1;transform:none}31%,100%{opacity:0;transform:translateY(-8px)}}
.vn-demo{position:absolute;bottom:-30px;left:0;right:0;text-align:center;font:600 11.5px/1 'Inter',sans-serif;color:var(--on-navy-2);letter-spacing:.02em}

/* ---------- spring mowing ---------- */
.vn-mow{background:var(--gold);color:var(--navy);position:relative}
.vn-mow-in{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);min-height:560px}
.vn-mow-ph{position:relative;overflow:hidden}
.vn-mow-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.vn-mow-ph::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 60%,hsl(45 95% 55% / .35))}
.vn-mow-cp{padding:clamp(48px,7vw,96px) clamp(24px,6vw,84px);display:flex;flex-direction:column;justify-content:center}
.vn-mow-tag{display:inline-flex;align-self:flex-start;align-items:center;gap:8px;font:900 12.5px/1 'Inter',sans-serif;letter-spacing:.12em;text-transform:uppercase;background:var(--navy);color:var(--gold);padding:9px 13px;border-radius:8px}
.vn-mow h2{margin-top:20px}
.vn-towns{display:grid;grid-template-columns:repeat(2,max-content);gap:10px 36px;margin:26px 0 26px;font:900 clamp(1.3rem,2.5vw,1.95rem)/1.1 'Inter',sans-serif;letter-spacing:-.025em}
.vn-towns li{display:flex;align-items:center;gap:12px}
.vn-towns li::before{content:"";width:11px;height:11px;border-radius:3px;background:var(--navy);flex:none}
.vn-mow-cp > p:not(.vn-mow-tag){font-size:1.06rem;line-height:1.65;font-weight:600;color:hsl(230 60% 18%);max-width:52ch}
.vn-mow .vn-btn{margin-top:28px;align-self:flex-start}

/* ---------- how it works ---------- */
.vn-how{padding:clamp(80px,10vw,130px) 0}
.vn-how-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.9fr);gap:40px;align-items:end;margin-bottom:clamp(40px,6vw,64px)}
.vn-how-head h2{color:var(--navy)}
.vn-prices[hidden],.vn-pr[hidden]{display:none!important}
.vn-prhint{font-size:.9rem;line-height:1.55;font-weight:500;color:var(--muted);margin:2px 0 10px}
.vn-pr{border:1.5px solid rgba(6,17,71,.12);border-radius:14px;padding:14px 16px;margin-bottom:10px;background:#fff}
.vn-prh{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.vn-prh b{font:900 1rem/1.2 'Inter',sans-serif;color:var(--navy)}
.vn-prh span{font:600 .8rem/1.3 'Inter',sans-serif;color:var(--muted)}
.vn-prg{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
.vn-prg label{display:grid;grid-template-rows:1fr auto;align-items:end;gap:5px;font:600 .82rem/1.3 'Inter',sans-serif;color:var(--navy)}
.vn-prg em{display:flex;align-items:center;border:1.5px solid rgba(6,17,71,.18);border-radius:10px;background:#fff;overflow:hidden;font-style:normal}
.vn-prg em:focus-within{border-color:var(--gold)}
.vn-prg i{font-style:normal;font-weight:800;color:var(--muted);padding:0 3px 0 11px}
.vn-prg input{border:0!important;outline:0;box-shadow:none!important;padding:10px 10px 10px 2px!important;width:100%;min-width:0;font:700 1rem 'Inter',sans-serif;background:transparent!important;margin:0!important}
.vn-f.vn-prices.bad .vn-err{display:block}
.vn-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;counter-reset:vn;position:relative}
.vn-steps::before{content:"";position:absolute;left:24px;right:24px;top:23px;height:2px;background:repeating-linear-gradient(90deg,var(--navy) 0 8px,transparent 8px 16px);opacity:.28}
.vn-steps li{position:relative;padding-right:22px}
.vn-steps li::before{counter-increment:vn;content:counter(vn);display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#fff;border:2px solid var(--navy);color:var(--navy);font:900 17px/1 'Inter',sans-serif;position:relative;z-index:1;margin-bottom:18px}
.vn-steps li:nth-child(4)::before{background:var(--navy);color:#fff}
.vn-steps li:nth-child(5)::before{background:var(--gold);border-color:var(--gold);color:var(--navy)}
.vn-steps h3{font:900 1.12rem/1.2 'Inter',sans-serif;letter-spacing:-.015em;color:var(--navy);margin-bottom:8px}
.vn-steps p{font-size:.95rem;line-height:1.6;font-weight:500;color:var(--muted)}
.vn-pay{margin-top:clamp(56px,8vw,90px);display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:clamp(32px,6vw,80px);align-items:center;background:var(--navy);color:#fff;border-radius:28px;padding:clamp(28px,5vw,60px);position:relative;overflow:hidden}
.vn-pay::after{content:"";position:absolute;right:-120px;bottom:-160px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,hsl(45 95% 55% / .16),transparent 65%);pointer-events:none}
.vn-pay h3{font:900 clamp(1.9rem,4vw,3rem)/1.04 'Inter',sans-serif;letter-spacing:-.035em}
.vn-pay h3 span{color:var(--gold)}
.vn-pay p{margin-top:16px;color:var(--on-navy);line-height:1.65;font-weight:500;max-width:46ch}
.vn-cal{background:#fff;color:var(--ink);border-radius:20px;padding:18px 18px 16px;box-shadow:0 30px 60px -30px hsl(231 90% 4% / .9);position:relative;z-index:1}
.vn-cal-h{display:flex;justify-content:space-between;align-items:baseline;padding:2px 4px 12px;font:900 15px/1 'Inter',sans-serif;color:var(--navy)}
.vn-cal-h small{font:700 11.5px/1 'Inter',sans-serif;color:#6b7390}
.vn-cal-g{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.vn-cal-g b{font:800 10.5px/1 'Inter',sans-serif;color:#8a91a8;text-align:center;padding-bottom:6px;letter-spacing:.06em}
.vn-cal-g span{position:relative;aspect-ratio:1.08;border-radius:10px;background:#f2f4f8;display:flex;align-items:flex-start;justify-content:flex-end;padding:6px 7px;font:700 12px/1 'Inter',sans-serif;color:#5d6682}
.vn-cal-g span.o{background:transparent}
.vn-cal-g span.w{background:hsl(230 85% 15% / .06)}
.vn-cal-g span.d5{background:#fff;box-shadow:inset 0 0 0 2.5px var(--navy);color:var(--navy);font-weight:900}
.vn-cal-g span.d10{background:var(--gold);color:var(--navy);font-weight:900;box-shadow:0 10px 20px -10px hsl(45 95% 45% / .9)}
.vn-cal-g span em{position:absolute;left:6px;bottom:6px;font:900 8.5px/1.05 'Inter',sans-serif;font-style:normal;letter-spacing:.04em;text-transform:uppercase;text-align:left}
.vn-cal-k{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:14px;font:700 12px/1.2 'Inter',sans-serif;color:#5d6682}
.vn-cal-k i{display:inline-block;width:12px;height:12px;border-radius:4px;vertical-align:-2px;margin-right:6px}

/* ---------- scale / map ---------- */
.vn-scale{background:var(--navy);color:#fff;padding:clamp(80px,10vw,130px) 0;position:relative;overflow:hidden}
.vn-scale-in{display:grid;grid-template-columns:minmax(0,.78fr) minmax(0,1.22fr);gap:clamp(28px,5vw,64px);align-items:center}
.vn-scale h2{font-size:clamp(2rem,3.6vw,3rem)}
.vn-scale .vn-lead{color:var(--on-navy);margin-top:20px}
.vn-map-towns{display:none;margin-top:18px;font-weight:600;line-height:1.7;color:var(--on-navy)}
.vn-map-towns b{color:var(--gold);font-weight:900}
.vn-facts{margin-top:30px;border-top:1px solid hsl(226 60% 88% / .16)}
.vn-facts div{display:flex;align-items:baseline;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid hsl(226 60% 88% / .16)}
.vn-facts dt{font-weight:600;color:var(--on-navy);font-size:.98rem}
.vn-facts dd{font:900 1.3rem/1.1 'Inter',sans-serif;color:#fff;letter-spacing:-.02em;text-align:right}
.vn-map{width:100%;height:auto;overflow:visible}
.vn-map .rv{fill:none;stroke:hsl(205 80% 62% / .55);stroke-width:5;stroke-linecap:round}
.vn-map .rvl{font:italic 600 13px 'Inter',sans-serif;fill:hsl(205 80% 72% / .8);letter-spacing:.04em}
.vn-map .rt{fill:none;stroke:var(--gold);stroke-width:1.8;stroke-dasharray:5 7;opacity:.7}
.vn-map .pn circle.c{fill:#fff}
.vn-map .pn.f circle.c{fill:var(--gold)}
.vn-map .pn circle.h{fill:none;stroke:var(--gold);stroke-width:2;transform-box:fill-box;transform-origin:center;animation:vnHalo 3.2s ease-out infinite}
.vn-map .pn text{font:700 13.5px 'Inter',sans-serif;fill:var(--on-navy)}
.vn-map .pn.f text{font-weight:900;font-size:16px;fill:#fff}
.vn-map .hq rect{fill:var(--gold)}
.vn-map .hq text{font:900 11px 'Inter',sans-serif;fill:var(--navy);letter-spacing:.08em}
@keyframes vnHalo{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(3.2)}}
.vn-map .pn{opacity:0;transform:translateY(8px);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)}
.vn-map .rt{stroke-dashoffset:600;transition:stroke-dashoffset 2.2s cubic-bezier(.16,1,.3,1)}
.vn-map.vn-in .pn{opacity:1;transform:none}
.vn-map.vn-in .rt{stroke-dashoffset:0}
.vn-map.vn-in .rt{animation:vnFlow 9s linear 2.2s infinite}
@keyframes vnFlow{to{stroke-dashoffset:-240}}

/* ---------- trades ---------- */
.vn-trades{padding:clamp(80px,10vw,130px) 0}
.vn-trades-in{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(32px,6vw,80px);align-items:start}
.vn-trades h2{color:var(--navy)}
.vn-trades .vn-lead{margin-top:18px}
.vn-tl{margin-top:36px;border-top:2px solid var(--navy)}
.vn-tl li{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:4px 18px;align-items:start;padding:20px 0;border-bottom:1px solid var(--line)}
.vn-tl svg{width:44px;height:44px;padding:9px;border-radius:12px;background:var(--navy);color:var(--gold);grid-row:span 2}
.vn-tl h3{font:900 1.3rem/1.15 'Inter',sans-serif;letter-spacing:-.02em;color:var(--navy);align-self:center}
.vn-tl p{grid-column:2 / 4;font-size:.97rem;line-height:1.55;color:var(--muted);font-weight:500}
.vn-tl small{font:800 11.5px/1 'Inter',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--gold-t);background:hsl(45 95% 55% / .18);padding:7px 10px;border-radius:7px;white-space:nowrap;align-self:center}
.vn-also{margin-top:28px}
.vn-also h3{font:900 1rem/1 'Inter',sans-serif;color:var(--navy);margin-bottom:12px}
.vn-also ul{display:flex;flex-wrap:wrap;gap:8px}
.vn-also li{font:700 14px/1 'Inter',sans-serif;color:var(--navy);background:#fff;border:1.5px solid var(--line);padding:10px 14px;border-radius:999px}
.vn-col{display:grid;gap:14px;position:sticky;top:110px}
.vn-col figure{position:relative;border-radius:22px;overflow:hidden;box-shadow:0 30px 50px -34px hsl(230 60% 20% / .7)}
.vn-col figure img{width:100%;height:100%;object-fit:cover;aspect-ratio:4/3}
.vn-col figure:first-child img{aspect-ratio:5/4}
.vn-col figcaption{position:absolute;left:12px;bottom:12px;font:800 13px/1 'Inter',sans-serif;color:var(--navy);background:#fff;padding:9px 12px;border-radius:999px;box-shadow:0 8px 18px -10px hsl(230 60% 20% / .6)}

/* ---------- commitments ---------- */
.vn-std{background:#fff;padding:clamp(80px,10vw,130px) 0}
.vn-std-top{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(32px,6vw,80px);align-items:center}
.vn-std h2{color:var(--navy)}
.vn-std h2 span{color:var(--gold-t)}
.vn-std .vn-lead{margin-top:20px}
.vn-std-ph{position:relative;border-radius:26px;overflow:hidden;box-shadow:0 36px 60px -36px hsl(230 60% 20% / .7)}
.vn-std-ph img{width:100%;aspect-ratio:4/3;object-fit:cover}
.vn-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(20px,4vw,48px);margin-top:clamp(48px,7vw,80px)}
.vn-three div{border-top:3px solid var(--navy);padding-top:18px}
.vn-three div:last-child{border-top-color:var(--gold)}
.vn-three h3{font:900 1.35rem/1.15 'Inter',sans-serif;letter-spacing:-.02em;color:var(--navy)}
.vn-three p{margin-top:10px;line-height:1.62;font-weight:500;color:var(--muted)}
.vn-bar{margin-top:clamp(48px,7vw,80px);background:var(--bg);border-radius:26px;padding:clamp(26px,4.5vw,52px);display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:clamp(24px,5vw,60px)}
.vn-bar h3{font:900 clamp(1.6rem,3vw,2.2rem)/1.08 'Inter',sans-serif;letter-spacing:-.03em;color:var(--navy)}
.vn-bar h3+p{margin-top:12px;color:var(--muted);line-height:1.6;font-weight:500}
.vn-bar ul{display:grid;gap:14px}
.vn-bar li{display:grid;grid-template-columns:28px minmax(0,1fr);gap:12px;align-items:start;font-size:1.02rem;line-height:1.5;font-weight:600;color:var(--ink)}
.vn-bar li svg{width:28px;height:28px;padding:5px;border-radius:50%;background:var(--navy);color:var(--gold)}
.vn-bar li b{font-weight:900;color:var(--navy)}

/* ---------- faq ---------- */
.vn-faq{padding:clamp(80px,10vw,120px) 0 clamp(40px,6vw,60px)}
.vn-faq-in{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:clamp(28px,5vw,64px)}
.vn-faq h2{color:var(--navy)}
.vn-faq details{border-bottom:1px solid #d9dde8}
.vn-faq details:first-child{border-top:1px solid #d9dde8}
.vn-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:18px;padding:22px 0;font:800 1.12rem/1.3 'Inter',sans-serif;color:var(--navy)}
.vn-faq summary::-webkit-details-marker{display:none}
.vn-faq summary i{flex:none;width:30px;height:30px;border-radius:50%;background:#fff;border:1.5px solid var(--line);position:relative;transition:transform .3s cubic-bezier(.16,1,.3,1),background .2s}
.vn-faq summary i::before,.vn-faq summary i::after{content:"";position:absolute;left:50%;top:50%;width:11px;height:2px;background:var(--navy);transform:translate(-50%,-50%)}
.vn-faq summary i::after{transform:translate(-50%,-50%) rotate(90deg);transition:transform .3s}
.vn-faq details[open] summary i{background:var(--gold);border-color:var(--gold)}
.vn-faq details[open] summary i::after{transform:translate(-50%,-50%) rotate(0deg)}
.vn-faq details p{padding:0 48px 22px 0;line-height:1.65;color:var(--muted);font-weight:500}

/* ---------- apply ---------- */
.vn-apply{padding:clamp(60px,8vw,100px) 0 clamp(90px,11vw,140px);scroll-margin-top:80px}
.vn-apply-in{display:grid;grid-template-columns:minmax(0,.78fr) minmax(0,1.22fr);gap:clamp(28px,5vw,64px);align-items:start}
.vn-apply h2{color:var(--navy)}
.vn-next{margin-top:28px;display:grid;gap:18px;counter-reset:nx}
.vn-next li{display:grid;grid-template-columns:36px minmax(0,1fr);gap:14px;align-items:start;font-weight:600;line-height:1.5;color:var(--ink)}
.vn-next li::before{counter-increment:nx;content:counter(nx);display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--navy);color:var(--gold);font:900 14px/1 'Inter',sans-serif}
.vn-need{margin-top:28px;padding:18px 20px;border-radius:18px;background:hsl(45 95% 55% / .16);border:1.5px solid hsl(45 95% 55% / .6);font-weight:600;line-height:1.55;color:hsl(230 60% 18%)}
.vn-need b{font-weight:900;color:var(--navy)}
.vn-form{background:#fff;border-radius:28px;box-shadow:0 40px 80px -46px hsl(230 60% 20% / .55),0 1px 0 var(--line);overflow:hidden}
.vn-prog{display:grid;grid-template-columns:repeat(3,1fr);background:var(--navy)}
.vn-prog button{appearance:none;border:0;background:transparent;color:var(--on-navy-2);font:800 13px/1.2 'Inter',sans-serif;padding:18px 12px 16px;text-align:left;display:flex;gap:10px;align-items:center;cursor:pointer;border-bottom:4px solid transparent}
.vn-prog button span{display:grid;place-items:center;flex:none;width:26px;height:26px;border-radius:50%;border:2px solid currentColor;font:900 12px/1 'Inter',sans-serif}
.vn-prog button[aria-current="step"]{color:#fff;border-bottom-color:var(--gold)}
.vn-prog button[aria-current="step"] span{background:var(--gold);border-color:var(--gold);color:var(--navy)}
.vn-prog button.done{color:var(--on-navy)}
.vn-prog button.done span{background:hsl(145 55% 40%);border-color:hsl(145 55% 40%);color:#fff}
.vn-prog button:disabled{cursor:default}
.vn-fs{border:0;margin:0;padding:clamp(22px,4vw,38px);display:none}
.vn-fs.on{display:block;animation:vnFade .45s cubic-bezier(.16,1,.3,1)}
@keyframes vnFade{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
.vn-fs legend{float:left;width:100%;font:900 1.45rem/1.2 'Inter',sans-serif;letter-spacing:-.02em;color:var(--navy);padding:0;margin:0 0 6px}
.vn-fs legend+*{clear:both}
.vn-fs .vn-sub{color:var(--muted);font-weight:500;margin-bottom:22px;line-height:1.5}
.vn-g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.vn-f{display:grid;gap:7px;margin-bottom:18px}
.vn-f label,.vn-f .vn-lb{font:800 13.5px/1.2 'Inter',sans-serif;color:var(--navy)}
.vn-f label em,.vn-f .vn-lb em{font-style:normal;font-weight:600;color:#6b7390}
.vn-f input[type=text],.vn-f input[type=tel],.vn-f input[type=email],.vn-f input[type=number],.vn-f input[type=url],.vn-f input[type=date],.vn-f select,.vn-f textarea{width:100%;font:600 16px/1.35 'Inter',sans-serif;color:var(--ink);background:#fff;border:1.5px solid #cfd4e0;border-radius:14px;padding:13px 14px;transition:border-color .2s,box-shadow .2s}
.vn-f textarea{min-height:120px;resize:vertical}
.vn-f input::placeholder,.vn-f textarea::placeholder{color:#737b93}
.vn-f input:focus,.vn-f select:focus,.vn-f textarea:focus{outline:none;border-color:var(--navy);box-shadow:0 0 0 4px hsl(230 85% 15% / .12)}
.vn-f.bad input,.vn-f.bad select,.vn-f.bad textarea,.vn-f.bad .vn-drop{border-color:hsl(0 70% 48%)}
.vn-err{display:none;font:700 13px/1.3 'Inter',sans-serif;color:hsl(0 70% 40%)}
.vn-f.bad .vn-err{display:block}
.vn-chips{display:flex;flex-wrap:wrap;gap:8px}
.vn-chips label{position:relative;cursor:pointer}
.vn-chips input{position:absolute;opacity:0;width:1px;height:1px}
.vn-chips span{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 15px;border-radius:999px;border:1.5px solid #cfd4e0;background:#fff;font:700 14px/1 'Inter',sans-serif;color:var(--ink);transition:background .15s,border-color .15s,color .15s}
.vn-chips span::before{content:"";width:14px;height:14px;border-radius:4px;border:1.5px solid #aab1c4;flex:none;transition:all .15s}
.vn-chips input:checked+span{background:var(--navy);border-color:var(--navy);color:#fff}
.vn-chips input:checked+span::before{background:var(--gold);border-color:var(--gold);box-shadow:inset 0 0 0 3px var(--navy)}
.vn-chips input:focus-visible+span{outline:3px solid var(--gold);outline-offset:2px}
.vn-chips .hot span{border-color:hsl(45 85% 45% / .8)}
.vn-chips .hot span::after{content:"Spring";font:900 9.5px/1 'Inter',sans-serif;letter-spacing:.06em;text-transform:uppercase;background:var(--gold);color:var(--navy);padding:4px 6px;border-radius:5px}
.vn-chips input:checked+span::after{background:var(--gold)}
.vn-check{display:grid;grid-template-columns:24px minmax(0,1fr);gap:12px;align-items:start;padding:16px;border-radius:16px;border:1.5px solid #cfd4e0;cursor:pointer;font-weight:600;line-height:1.5;color:var(--ink)}
.vn-check input{width:22px;height:22px;margin:1px 0 0;accent-color:var(--navy)}
.vn-check b{font-weight:900;color:var(--navy)}
.vn-drop{position:relative;display:grid;place-items:center;text-align:center;gap:8px;padding:26px 18px;border:2px dashed #b9c0d2;border-radius:18px;background:#f7f8fb;cursor:pointer;transition:border-color .2s,background .2s}
.vn-drop:hover,.vn-drop.over{border-color:var(--navy);background:hsl(230 85% 15% / .04)}
.vn-drop input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}
.vn-drop svg{width:34px;height:34px;color:var(--navy)}
.vn-drop-sm{padding:16px 14px;gap:6px}
.vn-drop-sm svg{width:26px;height:26px}
.vn-drop b{font:900 15px/1.3 'Inter',sans-serif;color:var(--navy)}
.vn-drop small{font:600 13px/1.4 'Inter',sans-serif;color:#6b7390}
.vn-drop.has{border-style:solid;border-color:hsl(145 55% 38%);background:hsl(145 60% 96%)}
.vn-drop.has b{color:hsl(145 55% 26%)}
.vn-nav{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:10px;padding-top:22px;border-top:1px solid var(--line)}
.vn-nav .vn-back{background:transparent;border:0;font:800 15px/1 'Inter',sans-serif;color:var(--muted);cursor:pointer;padding:14px 4px}
.vn-nav .vn-back:hover{color:var(--navy)}
.vn-nav .vn-btn{margin-left:auto}
.vn-nav .vn-btn[disabled]{opacity:.6;cursor:progress;transform:none}
.vn-formerr{display:none;margin-top:14px;padding:13px 15px;border-radius:12px;background:hsl(0 80% 96%);color:hsl(0 70% 34%);font:700 14px/1.45 'Inter',sans-serif}
.vn-formerr.on{display:block}
.vn-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}
.vn-done{display:none;padding:clamp(34px,6vw,64px) clamp(22px,4vw,44px);text-align:center}
.vn-done.on{display:block;animation:vnFade .5s cubic-bezier(.16,1,.3,1)}
.vn-done svg{width:76px;height:76px;margin:0 auto 18px;color:hsl(145 55% 36%)}
.vn-done h3{font:900 clamp(1.6rem,3.5vw,2.2rem)/1.1 'Inter',sans-serif;letter-spacing:-.03em;color:var(--navy)}
.vn-done p{margin:14px auto 0;max-width:44ch;color:var(--muted);font-weight:500;line-height:1.6}
.vn-done .ck path{stroke-dasharray:60;stroke-dashoffset:60;animation:vnDraw .7s .2s cubic-bezier(.16,1,.3,1) forwards}
@keyframes vnDraw{to{stroke-dashoffset:0}}

/* ---------- responsive ---------- */
@media (max-width:1020px){
  .vn-steps{grid-template-columns:1fr;gap:0}
  .vn-steps::before{left:23px;right:auto;top:24px;bottom:24px;width:2px;height:auto;background:repeating-linear-gradient(180deg,var(--navy) 0 8px,transparent 8px 16px)}
  .vn-steps li{display:grid;grid-template-columns:48px minmax(0,1fr);column-gap:18px;padding:0 0 26px}
  .vn-steps li::before{grid-row:span 2;margin:0}
  .vn-steps h3{align-self:center;margin:0}
  .vn-steps p{grid-column:2}
  .vn-how-head,.vn-pay,.vn-scale-in,.vn-trades-in,.vn-std-top,.vn-bar,.vn-faq-in,.vn-apply-in{grid-template-columns:1fr}
  .vn-col{position:static;grid-template-columns:1fr 1fr}
  .vn-col figure img,.vn-col figure:first-child img{aspect-ratio:1}
  .vn-three{grid-template-columns:1fr}
}
@media (max-width:880px){
  .vn-hero-in{grid-template-columns:1fr}
  .vn-stage{margin-top:26px;padding-bottom:30px}
  .vn-mow-in{grid-template-columns:1fr;min-height:0}
  .vn-mow-ph{aspect-ratio:16/10}
  .vn-mow-ph::after{background:linear-gradient(180deg,transparent 55%,hsl(45 95% 55% / .5))}
  .vn-ping{display:none}
}
@media (max-width:560px){
  .vn-wrap{padding:0 18px}
  .vn-hero{padding-top:112px}
  .vn-hero h1{font-size:clamp(2.7rem,13.4vw,3.6rem)}
  .vn-ctas .vn-btn{width:100%}
  .vn-g2{grid-template-columns:1fr;gap:0}
  .vn-prog button{padding:14px 8px 12px;font-size:0;gap:0;justify-content:center}
  .vn-prog button span{font-size:12px}
  .vn-prog button[aria-current="step"]{font-size:12.5px;gap:8px}
  .vn-tl li{grid-template-columns:44px minmax(0,1fr);gap:4px 14px}
  .vn-tl svg{width:40px;height:40px;padding:8px}
  .vn-tl small{grid-column:2;justify-self:start;margin-top:4px}
  .vn-tl p{grid-column:2}
  .vn-tl li{grid-template-rows:auto auto auto}
  .vn-tl svg{grid-row:span 3}
  .vn-facts dd{font-size:1.1rem}
  .vn-faq details p{padding-right:0}
  .vn-cal{padding:14px 12px}
  .vn-cal-g{gap:4px}
  .vn-cal-g span{padding:5px;font-size:11px}
  .vn-cal-g span em{display:none}
  .vn-tag{font-size:9.5px;letter-spacing:.04em}
  .vn-tk-top{padding:13px 13px 11px}
  .vn-map .pn:not(.f) text,.vn-map .hq,.vn-map .rvl{display:none}
  .vn-map .pn.f text{font-size:36px}
  .vn-map .pn.dv text{transform:translateY(84px)}
  .vn-map .pn circle.c{r:9}
  .vn-map .pn.f circle.c,.vn-map .pn.f circle.h{r:14}
  .vn-map-towns{display:block}
  .vn-nav .vn-btn{min-width:0;flex:1}
}
@media (prefers-reduced-motion:reduce){
  .vn *,.vn *::before,.vn *::after{animation:none!important;transition:none!important}
  .vn-tk:first-child{opacity:1;transform:none}
  .vn-tk:first-child .vn-stamp{opacity:1;transform:rotate(-12deg)}
  .vn-map .pn{opacity:1;transform:none}.vn-map .rt{stroke-dashoffset:0}
  .vn-rise,.vn-stage{opacity:1}
}
</style>

<div class="vn">
<!-- ============ HERO ============ -->
<section class="vn-hero" aria-labelledby="vn-h1">
  <svg class="vn-ridges" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g>
    <path d="M-80 1006 Q30 1001 85 976 Q140 950 195 931 Q250 911 305 887 Q360 864 415 829 Q470 794 525 784 Q580 775 635 772 Q690 770 745 752 Q800 734 855 724 Q910 715 965 694 Q1020 674 1075 635 Q1130 596 1185 577 Q1240 559 1295 548 Q1350 538 1405 520 Q1460 503 1515 501 Q1570 500 1625 488"/>
    <path d="M-80 937 Q30 902 85 874 Q140 845 195 827 Q250 809 305 777 Q360 746 415 724 Q470 701 525 703 Q580 705 635 693 Q690 681 745 663 Q800 645 855 632 Q910 619 965 585 Q1020 551 1075 520 Q1130 489 1185 483 Q1240 476 1295 462 Q1350 448 1405 437 Q1460 425 1515 422 Q1570 419 1625 390"/>
    <path class="vn-rg" d="M-80 852 Q30 790 85 766 Q140 743 195 721 Q250 700 305 670 Q360 640 415 635 Q470 629 525 629 Q580 628 635 606 Q690 585 745 569 Q800 552 855 530 Q910 507 965 470 Q1020 432 1075 418 Q1130 403 1185 399 Q1240 394 1295 378 Q1350 361 1405 355 Q1460 348 1515 333 Q1570 317 1625 278"/>
    <path d="M-80 745 Q30 678 85 660 Q140 642 195 616 Q250 591 305 573 Q360 554 415 558 Q470 562 525 549 Q580 535 635 510 Q690 485 745 469 Q800 452 855 419 Q910 387 965 359 Q1020 332 1075 331 Q1130 329 1185 318 Q1240 308 1295 292 Q1350 277 1405 268 Q1460 260 1515 228 Q1570 196 1625 162"/>
    <path d="M-80 625 Q30 574 85 558 Q140 541 195 517 Q250 492 305 489 Q360 486 415 484 Q470 483 525 456 Q580 430 635 408 Q690 386 745 363 Q800 341 855 307 Q910 273 965 264 Q1020 254 1075 253 Q1130 253 1185 234 Q1240 216 1295 203 Q1350 191 1405 171 Q1460 152 1515 113 Q1570 73 1625 54"/>
    <path d="M-80 510 Q30 479 85 460 Q140 441 195 426 Q250 411 305 415 Q360 418 415 400 Q470 383 525 352 Q580 321 635 302 Q690 284 745 255 Q800 226 855 204 Q910 181 965 184 Q1020 186 1075 175 Q1130 165 1185 144 Q1240 123 1295 109 Q1350 95 1405 62 Q1460 30 1515 -2 Q1570 -34 1625 -39"/>
    <path d="M-80 410 Q30 388 85 369 Q140 350 195 346 Q250 342 305 337 Q360 332 415 300 Q470 268 525 243 Q580 217 635 197 Q690 178 745 150 Q800 121 855 115 Q910 109 965 110 Q1020 110 1075 88 Q1130 66 1185 47 Q1240 28 1295 6 Q1350 -16 1405 -52 Q1460 -89 1515 -104 Q1570 -119 1625 -121"/>
    <path d="M-80 323 Q30 297 85 283 Q140 269 195 269 Q250 268 305 246 Q360 224 415 189 Q470 154 525 136 Q580 118 635 95 Q690 72 745 54 Q800 36 855 39 Q910 43 965 30 Q1020 17 1075 -10 Q1130 -38 1185 -55 Q1240 -73 1295 -104"/>
    <path d="M-80 241 Q30 208 85 201 Q140 194 195 185 Q250 175 305 139 Q360 103 415 76 Q470 49 525 35 Q580 20 635 -2 Q690 -25 745 -29"/>
  </g></svg>
  <div class="vn-wrap vn-hero-in">
    <div>
      <p class="vn-kicker vn-rise"><i></i>ExpertPM Vendor Network</p>
      <h1 id="vn-h1" class="vn-rise">Steady work. <span>Paid on the 10th.</span></h1>
      <p class="vn-lead vn-rise">650+ rental doors across 14 Central PA communities, and we need reliable, insured pros to keep them running. Every job comes with a clear scope, photos, and a set window. Accept with one tap, invoice by the 5th, get paid on the 10th.</p>
      <div class="vn-ctas vn-rise">
        <a class="vn-btn vn-btn-gold" href="#apply">Apply to join <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
        <a class="vn-btn vn-btn-ghost" href="#mowing">Spring mowing: now booking</a>
      </div>
      <p class="vn-micro vn-rise">Takes about 3 minutes. Have your certificate of insurance ready.</p>
    </div>

    <div class="vn-stage" aria-hidden="true">
      <div class="vn-ping"><svg viewBox="0 0 30 30"><rect width="30" height="30" rx="9" fill="hsl(45 95% 55%)"/><path d="M8 11h14v9H8zM8 11l7 5 7-5" fill="none" stroke="hsl(230 85% 15%)" stroke-width="2" stroke-linejoin="round"/></svg><div>New job in Bloomsburg<small>Turnover cleaning</small></div></div>
      <div class="vn-ping"><svg viewBox="0 0 30 30"><rect width="30" height="30" rx="9" fill="hsl(45 95% 55%)"/><path d="M8 11h14v9H8zM8 11l7 5 7-5" fill="none" stroke="hsl(230 85% 15%)" stroke-width="2" stroke-linejoin="round"/></svg><div>Route in Williamsport<small>Spring mowing</small></div></div>
      <div class="vn-ping"><svg viewBox="0 0 30 30"><rect width="30" height="30" rx="9" fill="hsl(45 95% 55%)"/><path d="M8 11h14v9H8zM8 11l7 5 7-5" fill="none" stroke="hsl(230 85% 15%)" stroke-width="2" stroke-linejoin="round"/></svg><div>New job in Berwick<small>Snow removal</small></div></div>
      <div class="vn-phone">
        <div class="vn-notch"></div>
        <div class="vn-screen">
          <div class="vn-sbar"><span>9:41</span><b><i style="height:5px"></i><i style="height:7px"></i><i style="height:9px"></i><i style="height:11px"></i></b></div>
          <div class="vn-apph"><em>EPM</em><div>ExpertPM Work<small>Jobs sent to you</small></div></div>
          <div class="vn-tks">
            <article class="vn-tk">
              <div class="vn-tk-top">
                <div class="vn-tag"><span>Turnover cleaning</span><span>Bloomsburg</span></div>
                <h4>4 BR / 2 BA apartment</h4>
                <dl><div><dt>Start no sooner than</dt><dd>Sat, May 15</dd></div><div><dt>Needed done by</dt><dd>Mon, May 17</dd></div></dl>
                <div class="vn-shots"><i style="background-image:url(/blog-img/e29aa2ae0eea5b5f42da);background-position:10% 40%"></i><i style="background-image:url(/blog-img/e29aa2ae0eea5b5f42da);background-position:42% 60%"></i><i style="background-image:url(/blog-img/e29aa2ae0eea5b5f42da);background-position:70% 35%"></i><i style="background-image:url(/blog-img/e29aa2ae0eea5b5f42da);background-position:95% 70%"></i></div>
                <div class="vn-shots-l">23 photos from our walkthrough</div>
              </div>
              <div class="vn-perf"></div>
              <div class="vn-tk-bot"><span class="vn-stamp">ACCEPTED</span><p>No quote needed. Bill us when it's done.</p><div class="vn-accept"><b>Accept this job</b></div></div>
            </article>
            <article class="vn-tk">
              <div class="vn-tk-top">
                <div class="vn-tag"><span>Spring mowing</span><span>Williamsport</span></div>
                <h4>6 properties, weekly route</h4>
                <dl><div><dt>Season</dt><dd>April to October</dd></div><div><dt>Pricing</dt><dd>Per cut, per property</dd></div></dl>
                <div class="vn-shots"><i style="background-image:url(/blog-img/a89278ba2d125f2efb8e);background-position:20% 70%"></i><i style="background-image:url(/blog-img/a89278ba2d125f2efb8e);background-position:50% 40%"></i><i style="background-image:url(/blog-img/a89278ba2d125f2efb8e);background-position:80% 60%"></i><i style="background-image:url(/blog-img/a89278ba2d125f2efb8e);background-position:5% 20%"></i></div>
                <div class="vn-shots-l">Lot photos for every address</div>
              </div>
              <div class="vn-perf"></div>
              <div class="vn-tk-bot"><span class="vn-stamp">SENT</span><p>Price the ones you want. Skip the rest.</p><div class="vn-accept"><b>Send my prices</b></div></div>
            </article>
            <article class="vn-tk">
              <div class="vn-tk-top">
                <div class="vn-tag"><span>Snow removal</span><span>Berwick</span></div>
                <h4>Lot, walks and entrances</h4>
                <dl><div><dt>Season</dt><dd>November to March</dd></div><div><dt>Pricing</dt><dd>Per push</dd></div></dl>
                <div class="vn-shots"><i style="background-image:url(/blog-img/809ebba79558985c4245);background-position:15% 50%"></i><i style="background-image:url(/blog-img/809ebba79558985c4245);background-position:48% 55%"></i><i style="background-image:url(/blog-img/809ebba79558985c4245);background-position:75% 50%"></i><i style="background-image:url(/blog-img/809ebba79558985c4245);background-position:100% 60%"></i></div>
                <div class="vn-shots-l">Site map and photos attached</div>
              </div>
              <div class="vn-perf"></div>
              <div class="vn-tk-bot"><span class="vn-stamp">ACCEPTED</span><p>Same lot, every storm.</p><div class="vn-accept"><b>Accept this job</b></div></div>
            </article>
          </div>
          <div class="vn-wk"><p>This week</p>
            <div><i></i><span>Cleanout &middot; Danville</span><b>Done</b></div>
            <div><i></i><span>Power washing &middot; Berwick</span><b>Done</b></div>
            <div><i class="due"></i><span>Invoice in the portal</span><b class="due">By the 5th</b></div>
          </div>
        </div>
      </div>
      <p class="vn-demo">Example job texts</p>
    </div>
  </div>
</section>

<!-- ============ SPRING MOWING ============ -->
<section class="vn-mow" id="mowing" aria-labelledby="vn-mow-h">
  <div class="vn-mow-in">
    <div class="vn-mow-ph"><img src="https://expertpm.com/blog-img/a89278ba2d125f2efb8e" alt="Fresh mowing stripes across a sunny lawn" loading="lazy" width="1600" height="1068"></div>
    <div class="vn-mow-cp">
      <p class="vn-mow-tag">Now booking</p>
      <h2 id="vn-mow-h">Spring mowing crews for four towns.</h2>
      <ul class="vn-towns"><li>Williamsport</li><li>Danville</li><li>Bloomsburg</li><li>Berwick</li></ul>
      <p>We're lining up mowing crews for the spring season now. Tell us which towns you cover, and once you're approved we'll send you those properties to price one at a time in your vendor portal. Bid on the ones that fit your route and skip the rest.</p>
      <a class="vn-btn vn-btn-navy" href="#apply" data-vn-mow>Bid on spring mowing <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
    </div>
  </div>
</section>

<!-- ============ HOW A JOB WORKS ============ -->
<section class="vn-how" aria-labelledby="vn-how-h">
  <div class="vn-wrap">
    <div class="vn-how-head">
      <h2 id="vn-how-h">From the first text to payday, nothing is a guess.</h2>
      <p class="vn-lead">We built our own work-order system so vendors never have to chase a scope, a key, a date or a check. Here's how every job runs.</p>
    </div>
    <ol class="vn-steps">
      <li><h3>A job text lands</h3><p>The address, the scope, photos from our walkthrough, and the window: the soonest you can start and when we need it done.</p></li>
      <li><h3>Accept with one tap</h3><p>No-quote jobs: pick your finish date. Quote jobs: send your price, and we confirm before anything starts. Pass on anything that isn't a fit.</p></li>
      <li><h3>Do the work in the window</h3><p>Running behind? Update your finish date from the same link, with a quick reason, so nobody is guessing.</p></li>
      <li><h3>Invoice by the 5th</h3><p>Submit your invoice in the vendor portal: upload the PDF or snap a photo of it.</p></li>
      <li><h3>Paid on the 10th</h3><p>Completed work invoiced by the 5th is paid on the 10th. Every month.</p></li>
    </ol>
    <div class="vn-pay">
      <div>
        <h3>Invoice by the 5th.<br><span>Paid on the 10th.</span></h3>
        <p>One date to hit, one date to count on. No net-60, no &ldquo;it's in the mail.&rdquo; Get your invoice into the portal by the 5th and it's paid on the 10th, every month of the year.</p>
      </div>
      <div class="vn-cal" role="img" aria-label="A month calendar: invoices are due on the 5th and payment goes out on the 10th">
        <div class="vn-cal-h">Every month <small>Vendor pay calendar</small></div>
        <div class="vn-cal-g">
          <b>SUN</b><b>MON</b><b>TUE</b><b>WED</b><b>THU</b><b>FRI</b><b>SAT</b>
          <span class="o"></span><span class="o"></span><span class="w">1</span><span class="w">2</span><span class="w">3</span><span class="w">4</span><span class="d5">5<em>Invoice<br>due</em></span>
          <span>6</span><span>7</span><span>8</span><span>9</span><span class="d10">10<em>Payday</em></span><span>11</span><span>12</span>
          <span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span>
          <span>20</span><span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span>
        </div>
        <div class="vn-cal-k"><span><i style="background:hsl(230 85% 15% / .12)"></i>Send invoices</span><span><i style="box-shadow:inset 0 0 0 2.5px hsl(230 85% 15%)"></i>5th: invoice deadline</span><span><i style="background:hsl(45 95% 55%)"></i>10th: payday</span></div>
      </div>
    </div>
  </div>
</section>

<!-- ============ SCALE / MAP ============ -->
<section class="vn-scale" aria-labelledby="vn-scale-h">
  <div class="vn-wrap vn-scale-in">
    <div>
      <h2 id="vn-scale-h">650+ doors. 14 communities. One office on West Main Street.</h2>
      <p class="vn-lead">ExpertPM manages apartment communities, student housing near Bloomsburg University and Penn College, duplexes and single-family homes for owners across the Susquehanna Valley, from Jersey Shore to Berwick. That's a lot of doors that need turning, cleaning, mowing and plowing.</p>
      <dl class="vn-facts">
        <div><dt>Assets under management</dt><dd>$50M+</dd></div>
        <div><dt>Average occupancy</dt><dd>98%</dd></div>
        <div><dt>Google rating</dt><dd>4.9 / 5</dd></div>
        <div><dt>Home base</dt><dd>Bloomsburg, PA</dd></div>
      </dl>
    </div>
    <div>
    <svg class="vn-map" id="vnMap" viewBox="-10 20 950 480" role="img" aria-label="Map of the 14 Central Pennsylvania communities ExpertPM serves along the West and North Branches of the Susquehanna River, with Williamsport, Danville, Bloomsburg and Berwick highlighted">
      <path class="rv" id="vnWB" d="M0.0 114.0 C12.1 116.7 43.6 131.0 72.5 130.0 C101.4 129.0 140.4 113.3 173.6 108.0 C206.8 102.7 245.3 101.8 271.7 98.0 C298.1 94.2 313.2 83.3 332.1 85.0 C351.0 86.7 368.5 99.7 384.9 108.0 C401.2 116.3 428.3 124.7 430.2 135.0 C432.1 145.3 405.3 157.5 396.2 170.0 C387.1 182.5 379.4 197.3 375.8 210.0 C372.2 222.7 372.4 228.0 374.3 246.0 C376.2 264.0 389.7 298.0 387.2 318.0 C384.7 338.0 359.6 351.5 359.2 366.0 C358.8 380.5 373.9 393.2 384.9 405.0 C395.8 416.8 418.0 426.5 424.9 437.0 C431.8 447.5 430.5 455.8 426.4 468.0 C422.2 480.2 404.4 503.0 400.0 510.0"/>
      <path class="rv" id="vnNB" d="M424.9 437.0 C437.1 430.8 474.8 410.7 498.1 400.0 C521.4 389.3 543.1 376.3 564.5 373.0 C585.9 369.7 607.5 379.7 626.4 380.0 C645.3 380.3 667.6 381.7 677.7 375.0 C687.8 368.3 676.5 347.5 686.8 340.0 C697.1 332.5 720.7 336.7 739.6 330.0 C758.5 323.3 781.5 307.8 800.0 300.0 C818.5 292.2 830.4 296.3 850.5 283.0 C870.6 269.7 909.0 230.5 920.7 220.0"/>
      <text class="rvl" dy="-9"><textPath href="#vnWB" startOffset="1.5%">West Branch Susquehanna</textPath></text>
      <text class="rvl" dy="20"><textPath href="#vnNB" startOffset="67%">North Branch Susquehanna</textPath></text>
      <path class="rt" d="M683 326 C560 210 400 120 271 89"/>
      <path class="rt" d="M683 326 C640 350 600 362 564 367"/>
      <path class="rt" d="M683 326 C740 290 800 270 850 275"/>
      <g class="pn" style="transition-delay:.1s"><circle class="c" cx="72.5" cy="128" r="6"/><text x="72.5" y="158" text-anchor="middle">Jersey Shore</text></g>
      <g class="pn f" style="transition-delay:.2s"><circle class="h" cx="271" cy="89" r="9"/><circle class="c" cx="271" cy="89" r="9"/><text x="252" y="62" text-anchor="middle">Williamsport</text></g>
      <g class="pn" style="transition-delay:.25s"><circle class="c" cx="292" cy="58" r="5.5"/><text x="300" y="36" text-anchor="start">Loyalsock</text></g>
      <g class="pn" style="transition-delay:.3s"><circle class="c" cx="331" cy="76" r="5.5"/><text x="345" y="64" text-anchor="start">Montoursville</text></g>
      <g class="pn" style="transition-delay:.35s"><circle class="c" cx="480" cy="90" r="5.5"/><text x="480" y="70" text-anchor="middle">Hughesville</text></g>
      <g class="pn" style="transition-delay:.4s"><circle class="c" cx="446" cy="125" r="5.5"/><text x="460" y="140" text-anchor="start">Muncy</text></g>
      <g class="pn" style="transition-delay:.45s"><circle class="c" cx="394" cy="318" r="5.5"/><text x="380" y="323" text-anchor="end">Milton</text></g>
      <g class="pn" style="transition-delay:.5s"><circle class="c" cx="628" cy="210" r="5.5"/><text x="628" y="190" text-anchor="middle">Millville</text></g>
      <g class="pn f" style="transition-delay:.55s"><circle class="h" cx="850" cy="275" r="9"/><circle class="c" cx="850" cy="275" r="9"/><text x="850" y="248" text-anchor="middle">Berwick</text></g>
      <g class="pn f" style="transition-delay:.6s"><circle class="h" cx="683" cy="326" r="9"/><circle class="c" cx="683" cy="326" r="9"/><text x="683" y="299" text-anchor="middle">Bloomsburg</text></g>
      <g class="pn" style="transition-delay:.65s"><circle class="c" cx="676" cy="392" r="5.5"/><text x="690" y="410" text-anchor="start">Catawissa</text></g>
      <g class="pn f dv" style="transition-delay:.7s"><circle class="h" cx="566" cy="360" r="9"/><circle class="c" cx="566" cy="360" r="9"/><text x="560" y="335" text-anchor="middle">Danville</text></g>
      <g class="pn" style="transition-delay:.75s"><circle class="c" cx="548" cy="392" r="5.5"/><text x="534" y="412" text-anchor="end">Riverside</text></g>
      <g class="pn" style="transition-delay:.8s"><circle class="c" cx="609" cy="462" r="5.5"/><text x="609" y="490" text-anchor="middle">Elysburg</text></g>
      <g class="hq pn" style="transition-delay:.9s"><rect x="738" y="285" width="38" height="20" rx="6"/><text x="757" y="299" text-anchor="middle">HQ</text></g>
    </svg>
    <p class="vn-map-towns"><b>Williamsport, Danville, Bloomsburg, Berwick</b>, plus Catawissa, Elysburg, Hughesville, Jersey Shore, Loyalsock, Millville, Milton, Montoursville, Muncy and Riverside.</p>
    </div>
  </div>
</section>

<!-- ============ TRADES ============ -->
<section class="vn-trades" aria-labelledby="vn-tr-h">
  <div class="vn-wrap vn-trades-in">
    <div>
      <h2 id="vn-tr-h">The work we send out.</h2>
      <p class="vn-lead">Most of it repeats: the same yards every week, the same lots every storm, and a steady run of move-outs that need to be turned for the next tenant.</p>
      <ul class="vn-tl">
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 16V7.5h11V16M13.5 10.5h4l3.5 3.5v2"/><path d="M2.5 16h18.5"/><circle cx="6.5" cy="17.5" r="1.9"/><circle cx="17" cy="17.5" r="1.9"/><path d="M5.5 10.5h5M5.5 13h3"/></svg><h3>Cleanouts</h3><small>Year-round</small><p>Move-out cleanouts and haul-away: furniture, basements, garages and sheds, left broom-clean.</p></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2.5h5v3.5H9zM14 3.5h3.5M17.5 3.5 19 2"/><path d="M8 6h7l1.5 3v11.5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V9z"/><path d="M9.5 13h4M9.5 16h4"/></svg><h3>Turnover cleaning</h3><small>Peaks between leases</small><p>Top-to-bottom cleans between tenants: kitchens, appliances, baths, floors and windows, ready for photos and the next move-in.</p></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13h12.5l2 4H6z"/><path d="M16.5 13l4.5-9"/><circle cx="7.5" cy="18.5" r="1.9"/><circle cx="16.5" cy="18.5" r="1.9"/><path d="M2 21.5h20" opacity=".6"/></svg><h3>Lawn mowing</h3><small>April to October</small><p>Weekly and bi-weekly cuts with trimming and blowing for apartment lots and single-family yards. Booking spring routes now.</p></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19l6.5-6.5"/><path d="M9.5 12.5 12 10l2.5 2.5L12 15z"/><path d="M14 8.5l2.5-2.5M17 11l4-1M16.5 14l3.5 2M15.5 16.5l1 3.5"/></svg><h3>Power washing</h3><small>Spring and summer</small><p>Siding, decks, porches, walkways and building entrances.</p></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="14" rx="4.5" ry="6"/><path d="M12 8V5.5M9.5 5.5 8 3.5M14.5 5.5 16 3.5M7.5 12H4M7.5 16l-3.5 2M16.5 12H20M16.5 16l3.5 2M12 8.5v11.5"/></svg><h3>Pest control</h3><small>Year-round</small><p>Treatments, follow-ups and prevention plans across occupied buildings.</p></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2 3.8 16.8"/><path d="M9.3 3.8 12 6l2.7-2.2M9.3 20.2 12 18l2.7 2.2M3.6 10.4l3.4-.5-1.2-3.3M20.4 13.6l-3.4.5 1.2 3.3M5.8 17.4l1.2-3.3-3.4-.5M18.2 6.6 17 9.9l3.4.5"/></svg><h3>Snow removal</h3><small>November to March</small><p>Plowing, shoveling and salting for lots, walks and entrances, every storm.</p></li>
      </ul>
      <div class="vn-also">
        <h3>Also sending out</h3>
        <ul><li>Painting</li><li>Flooring &amp; carpet</li><li>Plumbing</li><li>Electrical</li><li>HVAC</li><li>Handyman repairs</li><li>Appliance repair</li><li>Roofing &amp; gutters</li><li>Landscaping</li><li>Tree work</li><li>Locksmith</li></ul>
      </div>
    </div>
    <div class="vn-col">
      <figure><img src="https://expertpm.com/blog-img/93183022dc1082088670" alt="A worker power washing stone steps" loading="lazy" width="1000" height="927"><figcaption>Power washing</figcaption></figure>
      <figure><img src="https://expertpm.com/blog-img/809ebba79558985c4245" alt="A pickup truck plowing a snowy lot" loading="lazy" width="1400" height="933"><figcaption>Every storm</figcaption></figure>
    </div>
  </div>
</section>

<!-- ============ COMMITMENTS ============ -->
<section class="vn-std" aria-labelledby="vn-std-h">
  <div class="vn-wrap">
    <div class="vn-std-top">
      <div>
        <h2 id="vn-std-h">Owners trust us with their buildings. <span>Tenants trust us with their homes.</span></h2>
        <p class="vn-lead">Every vendor we send through a door carries both of those promises. That's why we're choosy about who we work with, and why the vendors who meet the bar get treated like partners: steady work, straight answers, and money on time.</p>
      </div>
      <div class="vn-std-ph"><img src="https://expertpm.com/blog-img/e29aa2ae0eea5b5f42da" alt="A two-person cleaning crew turning over a bright apartment" loading="lazy" width="1400" height="933"></div>
    </div>
    <div class="vn-three">
      <div><h3>To owners</h3><p>Fair prices, documented work and invoices that match the job, so every line on their statement makes sense.</p></div>
      <div><h3>To tenants</h3><p>Fast, respectful service. Knock, announce, clean up, and fix it right the first time.</p></div>
      <div><h3>To you</h3><p>Clear scopes with photos, a real start-and-finish window, one-tap accept, and payment on the 10th.</p></div>
    </div>
    <div class="vn-bar">
      <div><h3>The bar for every ExpertPM vendor</h3><p>Simple, and the same for everyone.</p></div>
      <ul>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span><b>$1,000,000 general liability,</b> with your certificate of insurance on file.</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span><b>Work inside the window you accept.</b> If something changes, update your date from the job link.</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span><b>Treat every unit like someone lives there,</b> because someone usually does.</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span><b>Invoice through the vendor portal by the 5th</b> for work you've completed.</span></li>
      </ul>
    </div>
  </div>
</section>

<!-- ============ FAQ ============ -->
<section class="vn-faq" aria-labelledby="vn-faq-h">
  <div class="vn-wrap vn-faq-in">
    <h2 id="vn-faq-h">Questions vendors ask us.</h2>
    <div>
      <details><summary>When do I get paid?<i></i></summary><p>On the 10th of every month, for completed work you've invoiced by the 5th. Invoices go in through your vendor portal.</p></details>
      <details><summary>What insurance do I need?<i></i></summary><p>At least $1,000,000 in general liability coverage. Upload your certificate of insurance with your application, as a PDF or a clear photo. The application also asks about workers' comp and your PA home improvement contractor registration.</p></details>
      <details><summary>How do jobs get to me?<i></i></summary><p>By text. Each job comes with a private link showing the address, the scope, photos from our walkthrough, and the window: the soonest you can start and when we need it done. You accept, send a price, or pass, right from that link.</p></details>
      <details><summary>Do I have to take every job?<i></i></summary><p>No. Pass on anything that doesn't fit your schedule or your route. We'd rather hear no than get a yes that doesn't happen.</p></details>
      <details><summary>Which areas do you cover?<i></i></summary><p>Bloomsburg, Berwick, Danville, Williamsport, Catawissa, Elysburg, Hughesville, Jersey Shore, Loyalsock, Millville, Milton, Montoursville, Muncy and Riverside. Tell us which ones you work in; you'll only get jobs there.</p></details>
      <details><summary>What happens after I apply?<i></i></summary><p>You'll get a text confirming we received your application. Our team reviews every application and insurance certificate, and if it's a good fit, we'll reach out to set up your vendor portal login.</p></details>
      <details><summary>Does it cost anything to join?<i></i></summary><p>No. There's no fee to apply or to be on our vendor list.</p></details>
    </div>
  </div>
</section>

<!-- ============ APPLY ============ -->
<section class="vn-apply" id="apply" aria-labelledby="vn-ap-h">
  <div class="vn-wrap vn-apply-in">
    <div>
      <h2 id="vn-ap-h">Apply to the ExpertPM vendor network.</h2>
      <p class="vn-lead" style="margin-top:18px">Three short steps, about three minutes.</p>
      <ol class="vn-next">
        <li>You get a confirmation text the moment you submit.</li>
        <li>Our team reviews your application and your insurance.</li>
        <li>If it's a good fit, we reach out and set up your vendor portal login.</li>
      </ol>
      <p class="vn-need"><b>Have this ready:</b> your certificate of insurance showing at least <b>$1,000,000 general liability</b>. A PDF or a clear phone photo works.</p>
    </div>

    <form class="vn-form" id="vnForm" novalidate>
      <div class="vn-prog" role="list">
        <button type="button" role="listitem" data-go="0" aria-current="step"><span>1</span>Your business</button>
        <button type="button" role="listitem" data-go="1" disabled><span>2</span>Your work</button>
        <button type="button" role="listitem" data-go="2" disabled><span>3</span>Insurance</button>
      </div>

      <fieldset class="vn-fs on" data-step="0">
        <legend>Your business</legend>
        <p class="vn-sub">Who we'd be working with, and the cell we'll text jobs to.</p>
        <div class="vn-g2">
          <div class="vn-f"><label for="vnBiz">Business name</label><input type="text" id="vnBiz" name="business_name" maxlength="120" autocomplete="organization" required><span class="vn-err">Enter your business name.</span></div>
          <div class="vn-f"><label for="vnName">Your name</label><input type="text" id="vnName" name="contact_name" maxlength="80" autocomplete="name" required><span class="vn-err">Enter your name.</span></div>
        </div>
        <div class="vn-g2">
          <div class="vn-f"><label for="vnPhone">Cell phone</label><input type="tel" id="vnPhone" name="phone" inputmode="tel" autocomplete="tel" placeholder="(570) 555-0123" required><span class="vn-err">Enter a 10-digit cell number. Jobs come by text.</span></div>
          <div class="vn-f"><label for="vnEmail">Email</label><input type="email" id="vnEmail" name="email" maxlength="120" autocomplete="email" required><span class="vn-err">Enter a valid email address.</span></div>
        </div>
        <div class="vn-f"><label for="vnWeb">Website or Facebook page <em>(optional)</em></label><input type="text" id="vnWeb" name="website" maxlength="200" autocomplete="url"></div>
        <div class="vn-hp" aria-hidden="true"><label>Company site<input type="text" name="company_site" tabindex="-1" autocomplete="off"></label></div>
        <div class="vn-nav"><button type="button" class="vn-btn vn-btn-navy" data-next>Next: your work</button></div>
      </fieldset>

      <fieldset class="vn-fs" data-step="1">
        <legend>Your work</legend>
        <p class="vn-sub">What you do and where you do it.</p>
        <div class="vn-f" id="vnTradesF"><span class="vn-lb">Services you offer</span>
          <div class="vn-chips" id="vnTrades">
            <label><input type="checkbox" name="trades" value="Cleanouts"><span>Cleanouts</span></label>
            <label><input type="checkbox" name="trades" value="Turnover cleaning"><span>Turnover cleaning</span></label>
            <label class="hot"><input type="checkbox" name="trades" value="Lawn mowing"><span>Lawn mowing</span></label>
            <label><input type="checkbox" name="trades" value="Power washing"><span>Power washing</span></label>
            <label><input type="checkbox" name="trades" value="Pest control"><span>Pest control</span></label>
            <label><input type="checkbox" name="trades" value="Snow removal"><span>Snow removal</span></label>
            <label><input type="checkbox" name="trades" value="Painting"><span>Painting</span></label>
            <label><input type="checkbox" name="trades" value="Flooring & carpet"><span>Flooring &amp; carpet</span></label>
            <label><input type="checkbox" name="trades" value="Plumbing"><span>Plumbing</span></label>
            <label><input type="checkbox" name="trades" value="Electrical"><span>Electrical</span></label>
            <label><input type="checkbox" name="trades" value="HVAC"><span>HVAC</span></label>
            <label><input type="checkbox" name="trades" value="Handyman repairs"><span>Handyman repairs</span></label>
            <label><input type="checkbox" name="trades" value="Appliance repair"><span>Appliance repair</span></label>
            <label><input type="checkbox" name="trades" value="Roofing & gutters"><span>Roofing &amp; gutters</span></label>
            <label><input type="checkbox" name="trades" value="Landscaping"><span>Landscaping</span></label>
            <label><input type="checkbox" name="trades" value="Tree work"><span>Tree work</span></label>
            <label><input type="checkbox" name="trades" value="Locksmith"><span>Locksmith</span></label>
          </div>
          <input type="text" name="trade_other" id="vnTradeOther" maxlength="120" placeholder="Something else? Type it here" style="margin-top:6px">
          <span class="vn-err">Pick at least one service, or type yours in.</span>
        </div>
        <!--VN_PRICES-->
        <div class="vn-f" id="vnTownsF"><span class="vn-lb">Towns you cover</span>
          <div class="vn-chips" id="vnTowns">
            <label><input type="checkbox" name="towns" value="Bloomsburg"><span>Bloomsburg</span></label>
            <label><input type="checkbox" name="towns" value="Berwick"><span>Berwick</span></label>
            <label><input type="checkbox" name="towns" value="Danville"><span>Danville</span></label>
            <label><input type="checkbox" name="towns" value="Williamsport"><span>Williamsport</span></label>
            <label><input type="checkbox" name="towns" value="Catawissa"><span>Catawissa</span></label>
            <label><input type="checkbox" name="towns" value="Elysburg"><span>Elysburg</span></label>
            <label><input type="checkbox" name="towns" value="Hughesville"><span>Hughesville</span></label>
            <label><input type="checkbox" name="towns" value="Jersey Shore"><span>Jersey Shore</span></label>
            <label><input type="checkbox" name="towns" value="Loyalsock"><span>Loyalsock</span></label>
            <label><input type="checkbox" name="towns" value="Millville"><span>Millville</span></label>
            <label><input type="checkbox" name="towns" value="Milton"><span>Milton</span></label>
            <label><input type="checkbox" name="towns" value="Montoursville"><span>Montoursville</span></label>
            <label><input type="checkbox" name="towns" value="Muncy"><span>Muncy</span></label>
            <label><input type="checkbox" name="towns" value="Riverside"><span>Riverside</span></label>
          </div>
          <span class="vn-err">Pick at least one town you can work in.</span>
        </div>
        <div class="vn-f"><label for="vnScope">Describe your services</label><textarea id="vnScope" name="scope" maxlength="2000" placeholder="What you do, the size of jobs you take on, equipment, anything that sets you apart" required></textarea><span class="vn-err">Tell us a little about what you do (a sentence or two).</span></div>
        <div class="vn-g2">
          <div class="vn-f"><label for="vnYears">Years in business</label><input type="number" id="vnYears" name="years" min="0" max="99" inputmode="numeric" required><span class="vn-err">Enter how many years (0 if you're just starting).</span></div>
          <div class="vn-f"><label for="vnCrew">Crew size</label><select id="vnCrew" name="crew"><option value="Just me">Just me</option><option value="2-3">2 to 3 people</option><option value="4-10">4 to 10 people</option><option value="10+">More than 10</option></select></div>
        </div>
        <div class="vn-f"><label for="vnEmerg">Emergency or after-hours calls?</label><select id="vnEmerg" name="emergency"><option value="No">No</option><option value="Sometimes">Sometimes</option><option value="Yes, 24/7">Yes, 24/7</option></select></div>
        <div class="vn-f"><label for="vnPrice">Anything else about your pricing? <em>(optional)</em></label><textarea id="vnPrice" name="pricing" maxlength="2000" placeholder="Minimums, travel fees, volume discounts, or services not listed above"></textarea></div>
        <div class="vn-f" id="vnRcF"><span class="vn-lb">Rate card <em>(optional)</em></span>
          <label class="vn-drop vn-drop-sm" id="vnRcDrop"><input type="file" name="ratecard" id="vnRc" accept="application/pdf,image/*,.xlsx,.xls,.csv,.docx,.doc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg><b id="vnRcT">Have a rate card? Upload it</b><small id="vnRcS">PDF, photo, Excel or Word, up to 10 MB.</small></label>
          <span class="vn-err">That file is over 10 MB. Try a smaller PDF or a photo.</span>
        </div>
        <div class="vn-nav"><button type="button" class="vn-back" data-back>Back</button><button type="button" class="vn-btn vn-btn-navy" data-next>Next: insurance</button></div>
      </fieldset>

      <fieldset class="vn-fs" data-step="2">
        <legend>Insurance &amp; credentials</legend>
        <p class="vn-sub">Every ExpertPM vendor carries at least $1,000,000 in general liability.</p>
        <div class="vn-f" id="vnGlF"><label class="vn-check"><input type="checkbox" name="gl" value="1" id="vnGl"><span>I carry at least <b>$1,000,000 in general liability</b> coverage.</span></label><span class="vn-err">$1,000,000 general liability is required to work with ExpertPM.</span></div>
        <div class="vn-f" id="vnCoiF"><span class="vn-lb">Certificate of insurance</span>
          <label class="vn-drop" id="vnDrop"><input type="file" name="coi" id="vnCoi" accept="application/pdf,image/*"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 17v-6M9.5 13.5 12 11l2.5 2.5"/></svg><b id="vnDropT">Upload your certificate</b><small id="vnDropS">PDF or photo, up to 10 MB. On a phone, you can snap a picture.</small></label>
          <span class="vn-err" id="vnCoiErr">Upload your certificate of insurance.</span>
        </div>
        <div class="vn-g2">
          <div class="vn-f"><label for="vnExp">Policy expiration <em>(optional)</em></label><input type="date" id="vnExp" name="coi_expires"></div>
          <div class="vn-f"><label for="vnWc">Workers' comp</label><select id="vnWc" name="wc"><option value="Yes">Yes, I carry it</option><option value="No">No</option><option value="Exempt">Exempt (no employees)</option></select></div>
        </div>
        <div class="vn-g2">
          <div class="vn-f"><label for="vnHic">PA contractor registration # <em>(optional)</em></label><input type="text" id="vnHic" name="hic" maxlength="40" placeholder="PA HIC number"></div>
          <div class="vn-f"><label for="vnHeard">How did you hear about us? <em>(optional)</em></label><select id="vnHeard" name="heard"><option value="">Pick one</option><option>Referral from another vendor</option><option>ExpertPM reached out</option><option>Google search</option><option>Facebook</option><option>Saw our signs or crews</option><option>Other</option></select></div>
        </div>
        <div class="vn-f" id="vnConsentF"><label class="vn-check"><input type="checkbox" name="consent" value="1" id="vnConsent"><span>ExpertPM may text me about this application and future work at the cell number above. Message and data rates may apply.</span></label><span class="vn-err">We send confirmations and jobs by text, so we need your OK.</span></div>
        <div class="vn-formerr" id="vnFormErr" role="alert"></div>
        <div class="vn-nav"><button type="button" class="vn-back" data-back>Back</button><button type="submit" class="vn-btn vn-btn-gold" id="vnSubmit">Submit application</button></div>
      </fieldset>

      <div class="vn-done" id="vnDone" role="status" aria-live="polite">
        <svg class="ck" viewBox="0 0 76 76" fill="none"><circle cx="38" cy="38" r="35" stroke="currentColor" stroke-width="4" opacity=".25"/><path d="M23 39.5l10 10L54 28" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <h3 id="vnDoneH">Application received.</h3>
        <p id="vnDoneP">Check your phone for a confirmation text. Our team reviews every application, and if it's a good fit we'll reach out to get you set up.</p>
      </div>
    </form>
  </div>
</section>
</div>

<script>
(function(){
  var T0 = Date.now();
  var form = document.getElementById('vnForm'); if(!form) return;
  var steps = [].slice.call(form.querySelectorAll('.vn-fs'));
  var tabs = [].slice.call(form.querySelectorAll('.vn-prog button'));
  var cur = 0, maxDone = -1;
  function digits(v){ return String(v||'').replace(/[^0-9]/g,''); }
  function phoneOk(v){ var d = digits(v); if(d.length===11 && d.charAt(0)==='1') d = d.slice(1); return d.length===10 ? d : ''; }
  function fmtPhone(d){ return '(' + d.slice(0,3) + ') ' + d.slice(3,6) + '-' + d.slice(6); }
  function mark(el, bad){ var f = el.closest ? el.closest('.vn-f') : el; if(f) f.classList.toggle('bad', !!bad); return !bad; }
  function checkStep(i){
    var ok = true, first = null;
    function t(el, bad){ var r = mark(el, bad); if(!r){ ok = false; if(!first) first = el; } }
    if(i===0){
      var biz = form.business_name, nm = form.contact_name, ph = form.phone, em = form.email;
      t(biz, !biz.value.trim()); t(nm, !nm.value.trim());
      t(ph, !phoneOk(ph.value)); t(em, !/^[^ @]+@[^ @]+[.][^ @]+$/.test(em.value.trim()));
    } else if(i===1){
      var tr = form.querySelectorAll('input[name=trades]:checked').length || form.trade_other.value.trim();
      t(document.getElementById('vnTradesF'), !tr);
      t(document.getElementById('vnTownsF'), !form.querySelectorAll('input[name=towns]:checked').length);
      t(form.scope, form.scope.value.trim().length < 10);
      var y = form.years.value.trim(); t(form.years, y==='' || isNaN(+y) || +y < 0 || +y > 99);
      var rcf = form.ratecard && form.ratecard.files && form.ratecard.files[0]; t(document.getElementById('vnRcF'), !!(rcf && rcf.size > 10*1024*1024));
      var pf = document.getElementById('vnPricesF');
      if(pf && !pf.hidden){
        var pmsg = '';
        [].forEach.call(pf.querySelectorAll('.vn-pr'), function(c){
          if(c.hidden || pmsg) return;
          var n = 0, badl = '';
          [].forEach.call(c.querySelectorAll('input'), function(x){
            var v = x.value.replace(/[$, ]/g, '');
            if(!v) return;
            if(isNaN(+v) || +v <= 0 || +v > 100000){ if(!badl) badl = x.closest('label').querySelector('span').textContent; } else n++;
          });
          var tr = c.getAttribute('data-trade');
          if(badl) pmsg = 'Enter prices as plain numbers, like 45 or 45.50 (' + tr + ': ' + badl + ').';
          else if(c.getAttribute('data-core') === '1' && !n) pmsg = 'Add at least one price for ' + tr + '. Leave sizes you don’t do blank.';
        });
        document.getElementById('vnPriceErr').textContent = pmsg || 'Add at least one price for each required service.';
        t(pf, !!pmsg);
      }
    } else {
      t(document.getElementById('vnGlF'), !form.gl.checked);
      var f = form.coi.files && form.coi.files[0];
      var big = f && f.size > 10*1024*1024;
      document.getElementById('vnCoiErr').textContent = big ? 'That file is over 10 MB. Try a smaller PDF or a photo.' : 'Upload your certificate of insurance.';
      t(document.getElementById('vnCoiF'), !f || big);
      t(document.getElementById('vnConsentF'), !form.consent.checked);
    }
    if(first){ var fx = first.querySelector ? (first.querySelector('input,textarea,select') || first) : first; try{ fx.focus({preventScroll:true}); }catch(e){} (first.closest('.vn-f')||first).scrollIntoView({behavior:'smooth', block:'center'}); }
    return ok;
  }
  function show(i){
    steps.forEach(function(s, k){ s.classList.toggle('on', k===i); });
    tabs.forEach(function(b, k){
      b.toggleAttribute('aria-current', k===i); if(k===i) b.setAttribute('aria-current','step');
      b.classList.toggle('done', k <= maxDone && k !== i);
      b.disabled = k > maxDone + 1;
    });
    cur = i;
    var top = form.getBoundingClientRect().top;
    if(top < 60 || top > window.innerHeight * .6) window.scrollTo({ top: window.scrollY + top - 90, behavior: 'smooth' });
  }
  form.addEventListener('click', function(e){
    var n = e.target.closest('[data-next]'), b = e.target.closest('[data-back]'), g = e.target.closest('[data-go]');
    if(n){ if(checkStep(cur)){ maxDone = Math.max(maxDone, cur); show(cur+1); } }
    else if(b){ show(cur-1); }
    else if(g && !g.disabled){ var to = +g.getAttribute('data-go'); if(to <= cur || checkStep(cur)){ if(to > cur) maxDone = Math.max(maxDone, cur); show(to); } }
  });
  form.addEventListener('input', function(e){ var f = e.target.closest('.vn-f'); if(f && f.classList.contains('bad')) f.classList.remove('bad'); });
  form.addEventListener('change', function(e){ var f = e.target.closest('.vn-f'); if(f && f.classList.contains('bad')) f.classList.remove('bad'); });
  // price grid: one card per checked trade (cards come from the server's VAPP_PRICE_SPEC)
  function vnPriceSync(){
    var pf = document.getElementById('vnPricesF'); if(!pf) return;
    var on = {}; [].forEach.call(form.querySelectorAll('input[name=trades]:checked'), function(c){ on[c.value] = 1; });
    var any = false;
    [].forEach.call(pf.querySelectorAll('.vn-pr'), function(c){ var sh = !!on[c.getAttribute('data-trade')]; c.hidden = !sh; if(sh) any = true; });
    pf.hidden = !any;
    if(!any) pf.classList.remove('bad');
  }
  form.addEventListener('change', function(e){ if(e.target && e.target.name === 'trades') vnPriceSync(); });
  vnPriceSync();
  form.phone.addEventListener('blur', function(){ var d = phoneOk(this.value); if(d) this.value = fmtPhone(d); });
  var drop = document.getElementById('vnDrop'), coi = form.coi;
  function showFile(){
    var f = coi.files && coi.files[0];
    drop.classList.toggle('has', !!f);
    document.getElementById('vnDropT').textContent = f ? f.name : 'Upload your certificate';
    document.getElementById('vnDropS').textContent = f ? (Math.max(1, Math.round(f.size/1024)) + ' KB. Tap to choose a different file.') : 'PDF or photo, up to 10 MB. On a phone, you can snap a picture.';
  }
  coi.addEventListener('change', showFile);
  // optional rate card drop zone (never required)
  var rcDrop = document.getElementById('vnRcDrop'), rcIn = form.ratecard;
  if(rcIn){
    rcIn.addEventListener('change', function(){
      var f = rcIn.files && rcIn.files[0];
      rcDrop.classList.toggle('has', !!f);
      document.getElementById('vnRcT').textContent = f ? f.name : 'Have a rate card? Upload it';
      document.getElementById('vnRcS').textContent = f ? (Math.max(1, Math.round(f.size/1024)) + ' KB. Tap to choose a different file.') : 'PDF, photo, Excel or Word, up to 10 MB.';
    });
    ['dragenter','dragover'].forEach(function(ev){ rcDrop.addEventListener(ev, function(){ rcDrop.classList.add('over'); }); });
    ['dragleave','drop'].forEach(function(ev){ rcDrop.addEventListener(ev, function(){ rcDrop.classList.remove('over'); }); });
  }
  ['dragenter','dragover'].forEach(function(ev){ drop.addEventListener(ev, function(){ drop.classList.add('over'); }); });
  ['dragleave','drop'].forEach(function(ev){ drop.addEventListener(ev, function(){ drop.classList.remove('over'); }); });
  // "Bid on spring mowing": pre-check mowing and the four featured towns
  [].forEach.call(document.querySelectorAll('[data-vn-mow]'), function(a){
    a.addEventListener('click', function(){
      var m = form.querySelector('input[name=trades][value="Lawn mowing"]'); if(m) m.checked = true;
      ['Williamsport','Danville','Bloomsburg','Berwick'].forEach(function(t){ var c = form.querySelector('input[name=towns][value="' + t + '"]'); if(c) c.checked = true; });
      vnPriceSync();
    });
  });
  form.addEventListener('submit', function(e){
    e.preventDefault();
    for(var i=0;i<3;i++){ if(!checkStep(i)){ if(i !== cur){ maxDone = Math.max(maxDone, i-1); show(i); checkStep(i); } return; } }
    var btn = document.getElementById('vnSubmit'), err = document.getElementById('vnFormErr');
    err.classList.remove('on'); btn.disabled = true; btn.textContent = 'Sending...';
    var fd = new FormData(form); fd.set('phone', phoneOk(form.phone.value)); fd.set('elapsed', String(Date.now() - T0));
    fetch('/vendors/apply', { method: 'POST', body: fd }).then(function(r){ return r.json().catch(function(){ return { error: 'Something went wrong on our end. Please try again.' }; }); }).then(function(d){
      if(d && d.ok){
        steps.forEach(function(s){ s.classList.remove('on'); }); form.querySelector('.vn-prog').style.display = 'none';
        var first = String(form.contact_name.value).trim().split(' ')[0];
        document.getElementById('vnDoneH').textContent = 'Application received' + (first ? ', ' + first : '') + '.';
        document.getElementById('vnDone').classList.add('on');
        try{ if(window.gtag) gtag('event', 'generate_lead', { event_category: 'vendor_application' }); }catch(x){}
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        err.textContent = (d && d.error) || 'Something went wrong. Please try again.'; err.classList.add('on');
        btn.disabled = false; btn.textContent = 'Submit application';
      }
    }).catch(function(){ err.textContent = 'We could not reach our server. Check your connection and try again.'; err.classList.add('on'); btn.disabled = false; btn.textContent = 'Submit application'; });
  });
  // map: draw routes and drop pins once it scrolls into view
  var map = document.getElementById('vnMap');
  if(map){
    if('IntersectionObserver' in window){ var io = new IntersectionObserver(function(es){ es.forEach(function(x){ if(x.isIntersecting){ map.classList.add('vn-in'); io.disconnect(); } }); }, { threshold: .25 }); io.observe(map); }
    else map.classList.add('vn-in');
  }
})();
</script>
`;
