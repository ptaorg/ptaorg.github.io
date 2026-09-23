#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, math, shutil, subprocess, sys, urllib.request, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT=Path(__file__).resolve().parent
W,H,FPS=1080,1920,30
NAVY="#1e3a5f"; DARK="#0a192f"; GOLD="#d4af37"; CREAM="#f8f5ee"
RED="#b91c1c"; GREEN="#15803d"; BLUE="#1d4ed8"; TEXT="#111827"; MUTED="#4b5563"; WHITE="#ffffff"
FONTS=[
 "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
 "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
 "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
]

def run(cmd,cwd=None):
    print("+"," ".join(map(str,cmd))); subprocess.run(cmd,cwd=cwd,check=True)

def cap(cmd):
    return subprocess.run(cmd,check=True,capture_output=True,text=True).stdout.strip()

def duration(p):
    return float(cap(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",str(p)]))

def rgb(h):
    h=h.lstrip("#"); return tuple(int(h[i:i+2],16) for i in (0,2,4))

def font(size):
    for p in FONTS:
        if Path(p).exists(): return ImageFont.truetype(p,size)
    p=cap(["fc-match","-f","%{file}","Noto Sans CJK JP"])
    return ImageFont.truetype(p,size)

def dl(url,out):
    out.parent.mkdir(parents=True,exist_ok=True)
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 PTA-Shorts/2.0"})
    with urllib.request.urlopen(req,timeout=60) as r,open(out,"wb") as f: shutil.copyfileobj(r,f)

def mask(size,r=30):
    m=Image.new("L",size); ImageDraw.Draw(m).rounded_rectangle((0,0,size[0]-1,size[1]-1),r,fill=255); return m

def photo(base,img,box,brightness=1,sat=1,r=30):
    x0,y0,x1,y1=box
    p=ImageOps.fit(img.convert("RGB"),(x1-x0,y1-y0),Image.Resampling.LANCZOS)
    p=ImageEnhance.Brightness(p).enhance(brightness); p=ImageEnhance.Color(p).enhance(sat)
    base.paste(p,(x0,y0),mask(p.size,r))

def tag(d):
    d.rounded_rectangle((72,82,498,142),22,fill=rgb(NAVY))
    d.text((96,96),"PTA適正化推進委員会",font=font(28),fill=WHITE)
    d.rectangle((72,148,232,154),fill=rgb(GOLD))

def noise(img,s=1.5):
    a=np.asarray(img.convert("RGB"),dtype=np.int16)
    n=np.random.default_rng(20260923).normal(0,s,a.shape[:2]+(1,))
    return Image.fromarray(np.clip(a+n,0,255).astype(np.uint8)).convert("RGBA")

def page_capture(out):
    chrome=shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium")
    if not chrome: return None
    try:
        run([chrome,"--headless","--disable-gpu","--no-sandbox","--hide-scrollbars","--window-size=1240,1600",
             f"--screenshot={out}","https://ptaorg.com/membership.html"])
        return Image.open(out).convert("RGB") if out.exists() else None
    except Exception as e:
        print("page capture fallback:",e,file=sys.stderr); return None

def base_light():
    return Image.new("RGBA",(W,H),rgb(CREAM)+(255,))

def hook(seg,P,page):
    b=ImageOps.fit(P["parent_docs"],(W,H),Image.Resampling.LANCZOS,centering=(.48,.42)).convert("RGBA")
    grad=Image.new("RGBA",(W,H),(0,0,0,0)); a=np.linspace(70,218,H).astype(np.uint8)
    arr=np.zeros((H,W,4),np.uint8); arr[:,:,:3]=(10,25,47); arr[:,:,3]=a[:,None]
    b.alpha_composite(Image.fromarray(arr,"RGBA")); d=ImageDraw.Draw(b); tag(d)
    d.rounded_rectangle((72,235,620,310),22,fill=(212,175,55,238)); d.text((98,250),"入学前に不安な方へ",font=font(30),fill=DARK)
    d.text((72,382),"入学 ＝",font=font(112),fill=WHITE,stroke_width=2,stroke_fill=(0,0,0,80))
    d.text((72,520),"PTA会員？",font=font(112),fill=WHITE,stroke_width=2,stroke_fill=(0,0,0,80))
    d.rounded_rectangle((72,705,850,810),28,fill=(185,28,28,225)); d.text((106,727),"まず、心配しなくて大丈夫",font=font(40),fill=WHITE)
    d.text((74,1360),"まずは安心してください。",font=font(30),fill=(255,255,255,225))
    d.text((74,1418),"",font=font(31),fill=WHITE)
    return noise(b,2.0)

def split(seg,P,page):
    b=base_light(); d=ImageDraw.Draw(b); tag(d)
    d.text((72,230),"学校とPTAは別です",font=font(62),fill=DARK); d.rectangle((72,326,1008,330),fill=rgb(GOLD))
    photo(b,P["classroom"],(72,390,1008,790),.74,.7,36); d=ImageDraw.Draw(b)
    d.rounded_rectangle((95,436,505,741),26,fill=(255,255,255,236)); d.rounded_rectangle((575,436,985,741),26,fill=(255,255,255,236))
    d.text((155,486),"学校への",font=font(42),fill=MUTED); d.text((155,548),"入 学",font=font(78),fill=NAVY)
    d.text((633,486),"学校とは別の",font=font(34),fill=MUTED); d.text((633,548),"PTA加入",font=font(69),fill=NAVY)
    d.text((505,555),"≠",font=font(82),fill=RED)
    d.rounded_rectangle((72,875,1008,1205),34,fill=WHITE,outline=rgb(GOLD),width=4)
    d.text((110,925),"入学という事実と、",font=font(44),fill=TEXT)
    d.text((110,1005),"PTAへの加入は",font=font(55),fill=NAVY)
    d.text((110,1092),"別の関係です。",font=font(59),fill=DARK)
    d.text((74,1325),"ptaorg.com / membership.html",font=font(28),fill=MUTED)
    return noise(b)

def source_pta(seg,P,page):
    b=Image.new("RGBA",(W,H),(243,246,249,255)); d=ImageDraw.Draw(b); tag(d)
    d.text((72,225),"根拠を実画面で確認",font=font(56),fill=DARK)
    d.rounded_rectangle((72,340,1008,1275),30,fill=WHITE,outline=(220,224,230),width=2)
    if page:
        p=ImageOps.fit(page,(850,790),Image.Resampling.LANCZOS,centering=(.5,.14)); b.paste(p,(115,390),mask(p.size,18))
        d=ImageDraw.Draw(b); d.rounded_rectangle((110,1032,966,1196),16,fill=(30,58,95,238))
        d.text((144,1058),"学校への入学・在籍と",font=font(38),fill=WHITE)
        d.text((144,1113),"PTAへの加入は同じではありません",font=font(40),fill=(244,231,166))
    else:
        d.text((118,430),"PTAの会員資格は、",font=font(42),fill=MUTED)
        d.text((118,500),"学校への在籍とは",font=font(58),fill=NAVY)
        d.text((118,585),"別に考える",font=font(74),fill=DARK)
        d.rectangle((118,690,865,696),fill=rgb(GOLD))
        d.text((118,760),"加入意思を確認し、その記録を起点に",font=font(34),fill=TEXT)
        d.text((118,820),"会費・個人情報・役割分担を整理します。",font=font(34),fill=TEXT)
    d.text((76,1330),"出典  PTA適正化推進委員会",font=font(28),fill=MUTED)
    d.text((76,1380),"ptaorg.com/membership.html",font=font(32),fill=NAVY)
    return noise(b,1.1)

def source_mext(seg,P,page):
    b=Image.new("RGBA",(W,H),(239,243,248,255)); d=ImageDraw.Draw(b); tag(d)
    d.text((72,225),"一次資料も確認",font=font(56),fill=DARK)
    d.rounded_rectangle((72,350,1008,1250),34,fill=WHITE,outline=(212,175,55),width=4)
    d.text((112,410),"文部科学省",font=font(38),fill=MUTED); d.rectangle((112,470,920,474),fill=rgb(GOLD))
    d.text((112,535),"保護者と教師が",font=font(53),fill=TEXT)
    d.text((112,625),"自ら組織する",font=font(69),fill=NAVY)
    d.text((112,735),"任意の",font=font(91),fill=DARK)
    d.rounded_rectangle((105,845,900,965),26,fill=rgb(NAVY)); d.text((145,870),"社会教育団体",font=font(64),fill=WHITE)
    d.text((112,1048),"末松信介文部科学大臣記者会見録",font=font(30),fill=MUTED)
    d.text((112,1100),"令和4年6月17日",font=font(30),fill=MUTED)
    d.text((76,1338),"「任意」と「自動加入」は同義ではありません。",font=font(33),fill=TEXT)
    return noise(b)

def bad(seg,P,page):
    b=ImageOps.fit(P["school_hall"],(W,H),Image.Resampling.LANCZOS).convert("RGBA")
    ov=Image.new("RGBA",(W,H),(10,25,47,162)); b.alpha_composite(ov); d=ImageDraw.Draw(b); tag(d)
    d.text((72,230),"この流れは、いったん確認",font=font(52),fill=WHITE)
    labels=[("在籍",WHITE),("自動加入？","#ffd1d1"),("会費","#ffd1d1"),("役員選出","#ffd1d1")]
    y=390
    for i,(s,c) in enumerate(labels):
        d.rounded_rectangle((95,y,780,y+116),26,fill=(12,28,50,225),outline=(255,255,255,70),width=2)
        d.text((135,y+27),s,font=font(48),fill=c)
        if i<len(labels)-1: d.text((400,y+123),"↓",font=font(48),fill=GOLD)
        y+=175
    d.ellipse((775,530,980,735),fill=(185,28,28,235)); d.text((828,565),"×",font=font(100),fill=WHITE)
    d.rounded_rectangle((72,1195,1008,1405),28,fill=(255,255,255,240))
    d.text((108,1235),"加入の根拠を、",font=font(43),fill=TEXT)
    d.text((108,1305),"学校在籍とは別に確認",font=font(52),fill=NAVY)
    return noise(b,1.8)

def good(seg,P,page):
    b=base_light(); d=ImageDraw.Draw(b); tag(d); d.text((72,225),"核心は「加入意思の記録」",font=font(53),fill=DARK)
    photo(b,P["parent_docs"],(620,360,1008,1040),.96,.78,32); d=ImageDraw.Draw(b)
    steps=[("1","本人が加入を申し込む",Navy if False else NAVY),("2","PTAが受け付ける",BLUE),("3","後から確認できる記録",GREEN)]
    y=405
    for num,txt,col in steps:
        d.ellipse((85,y,165,y+80),fill=rgb(col)); d.text((111,y+12),num,font=font(36),fill=WHITE)
        d.rounded_rectangle((190,y-5,585,y+95),22,fill=WHITE,outline=rgb(col),width=3)
        d.text((220,y+23),txt,font=font(31),fill=TEXT); y+=185
    d.rounded_rectangle((72,1130,1008,1380),30,fill=(30,58,95,255))
    d.text((112,1173),"紙の様式そのものより、",font=font(39),fill=WHITE)
    d.text((112,1240),"加入意思を確認できること",font=font(51),fill=(244,231,166))
    d.text((112,1310),"が重要です。",font=font(42),fill=WHITE)
    return noise(b)

def reassure(seg,P,page):
    b=ImageOps.fit(P["school_hall"],(W,H),Image.Resampling.LANCZOS).convert("RGBA")
    b=ImageEnhance.Brightness(b).enhance(.76); ov=Image.new("RGBA",(W,H),(10,25,47,105)); b.alpha_composite(ov)
    d=ImageDraw.Draw(b); tag(d)
    d.rounded_rectangle((72,300,1008,1060),38,fill=(255,255,255,240))
    d.text((116,355),"入学前で不安なら",font=font(48),fill=MUTED)
    d.text((116,465),"まず一言だけ",font=font(62),fill=DARK)
    d.rectangle((116,555,895,561),fill=rgb(GOLD))
    d.text((116,640),"「入会方法は",font=font(61),fill=NAVY)
    d.text((116,730),"どうなっていますか？」",font=font(61),fill=NAVY)
    d.rounded_rectangle((112,890,890,1005),28,fill=rgb(GREEN)); d.text((150,916),"それを確認すれば十分です",font=font(42),fill=WHITE)
    d.text((74,1225),"必要以上に心配しなくて大丈夫です。",font=font(42),fill=WHITE)
    return noise(b,1.3)

def cta(seg,P,page):
    b=Image.new("RGBA",(W,H),rgb(DARK)+(255,)); d=ImageDraw.Draw(b); tag(d)
    d.text((72,260),"会費や役員のことも",font=font(49),fill=WHITE)
    d.text((72,340),"サイトでわかりやすく解説",font=font(62),fill=(244,231,166))
    if page:
        p=ImageOps.fit(page,(850,650),Image.Resampling.LANCZOS,centering=(.5,.18)); b.paste(p,(115,500),mask(p.size,24))
    else:
        d.rounded_rectangle((112,500,968,1120),30,fill=WHITE)
        d.text((160,600),"PTAの会員資格と",font=font(49),fill=NAVY)
        d.text((160,680),"入会手続",font=font(70),fill=DARK)
        d.text((160,810),"任意加入を、",font=font(42),fill=TEXT)
        d.text((160,875),"運用まで含めて整理",font=font(48),fill=NAVY)
    d.rounded_rectangle((72,1260,1008,1425),36,fill=rgb(GOLD)); d.text((126,1300),"ptaorg.com",font=font(76),fill=DARK)
    d.text((74,1490),"PTA適正化推進委員会",font=font(34),fill=WHITE)
    return noise(b,1.1)

SCENES={"hook":hook,"split":split,"source_ptaorg":source_pta,"source_mext":source_mext,"bad_flow":bad,"good_flow":good,"reassure":reassure,"cta":cta}

def make_audio(topic,work):
    silence=work/"silence.wav"
    run(["ffmpeg","-y","-f","lavfi","-i","anullsrc=r=48000:cl=mono","-t","0.16","-c:a","pcm_s16le",str(silence)])
    parts=[]; timeline=[]; cur=0.
    for i,s in enumerate(topic["segments"]):
        mp3=work/f"tts-{i:02}.mp3"; wav=work/f"tts-{i:02}.wav"
        run(["edge-tts","--voice",topic["voice"],f"--rate={topic['rate']}",f"--pitch={topic['pitch']}","--text",s["narration"],"--write-media",str(mp3)])
        run(["ffmpeg","-y","-i",str(mp3),"-ar","48000","-ac","1","-c:a","pcm_s16le",str(wav)])
        dur=duration(wav); extra=.16 if i<len(topic["segments"])-1 else 0
        timeline.append({"start":cur,"speech":dur,"duration":dur+extra}); parts.append(wav)
        if extra: parts.append(silence)
        cur+=dur+extra
    lst=work/"audio.txt"; lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts))
    raw=work/"raw.wav"; run(["ffmpeg","-y","-f","concat","-safe","0","-i",str(lst),"-c:a","pcm_s16le",str(raw)])
    out=work/"narration.m4a"; run(["ffmpeg","-y","-i",str(raw),"-af","loudnorm=I=-16:TP=-1.5:LRA=7","-c:a","aac","-b:a","192k",str(out)])
    return out,timeline

def at(t):
    cs=int(round(t*100)); h,r=divmod(cs,360000); m,r=divmod(r,6000); s,cs=divmod(r,100); return f"{h}:{m:02}:{s:02}.{cs:02}"

def ass(topic,timeline,out):
    head=f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Cap,Noto Sans CJK JP,58,&H00FFFFFF,&H000000FF,&H00243B53,&HBB0A192F,-1,0,0,0,100,100,0,0,3,2,0,2,92,210,335,1
[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
    rows=[head]
    for t,s in zip(timeline,topic["segments"]):
        ch=s.get("caption_chunks") or [s["narration"]]; weights=[max(1,len(x)) for x in ch]; total=sum(weights); cur=t["start"]
        for x,w in zip(ch,weights):
            end=cur+t["speech"]*w/total
            if len(x)>17:
                mid=len(x)//2; x=x[:mid]+r"\N"+x[mid:]
            x=x.replace("\\","\\\\").replace("{","\\{").replace("}","\\}")
            rows.append(f"Dialogue: 0,{at(cur)},{at(end)},Cap,,0,0,0,,{x}\n"); cur=end
    out.write_text("".join(rows),encoding="utf-8")

def bed(sec,out):
    sr=48000; n=int(sec*sr); t=np.arange(n)/sr
    sig=(np.sin(2*np.pi*110*t)+.55*np.sin(2*np.pi*164.81*t)+.35*np.sin(2*np.pi*220*t))*(.78+.22*np.sin(2*np.pi*.055*t))*.014
    stereo=np.column_stack([sig,sig]); 
    with wave.open(str(out),"wb") as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(sr); f.writeframes((np.clip(stereo,-.9,.9)*32767).astype(np.int16).tobytes())

def scene_video(p,dur,out,i):
    # Keep photographic scenes visually stable. Motion comes from hard scene changes
    # and caption timing rather than continuous pan/zoom that can feel seasick on mobile.
    vf=f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},format=yuv420p"
    run(["ffmpeg","-y","-loop","1","-i",str(p),"-t",f"{dur:.3f}","-vf",vf,
         "-c:v","libx264","-preset","medium","-crf","18","-r",str(FPS),str(out)])

def concat(vs,out):
    lst=out.parent/"video.txt"; lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in vs))
    run(["ffmpeg","-y","-f","concat","-safe","0","-i",str(lst),"-c","copy",str(out)])

def qc(video):
    j=json.loads(cap(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(video)]))
    v=[x for x in j["streams"] if x.get("codec_type")=="video"]; a=[x for x in j["streams"] if x.get("codec_type")=="audio"]
    assert v and a and int(v[0]["width"])==W and int(v[0]["height"])==H
    d=float(j["format"]["duration"]); assert 10<=d<=60,d
    return {"duration_seconds":round(d,2),"width":W,"height":H,"fps":v[0].get("r_frame_rate"),"audio_codec":a[0].get("codec_name")}

def sheet(video,out,sec):
    ims=[]
    for i,t in enumerate(np.linspace(.8,max(1,sec-.8),8)):
        p=out.parent/f"qc-{i}.jpg"; run(["ffmpeg","-y","-ss",f"{t:.2f}","-i",str(video),"-frames:v","1","-q:v","2",str(p)])
        ims.append(Image.open(p).convert("RGB").resize((270,480)))
    s=Image.new("RGB",(1080,960),(240,242,245))
    for i,im in enumerate(ims): s.paste(im,((i%4)*270,(i//4)*480))
    s.save(out,quality=92)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--topic",default=str(ROOT/"topic.json")); ap.add_argument("--output",default=str(ROOT/"output")); a=ap.parse_args()
    for x in ("ffmpeg","ffprobe","edge-tts"):
        if not shutil.which(x): raise SystemExit(f"{x} required")
    topic=json.loads(Path(a.topic).read_text(encoding="utf-8")); work=ROOT/".work"/topic["id"]
    shutil.rmtree(work,ignore_errors=True); work.mkdir(parents=True); out=Path(a.output); out.mkdir(parents=True,exist_ok=True)
    P={}
    for k,m in topic["assets"].items():
        p=work/f"{k}.jpg"; dl(m["url"],p); P[k]=Image.open(p).convert("RGB")
    page=page_capture(work/"membership.png")
    narration,timeline=make_audio(topic,work); vids=[]
    for i,(s,t) in enumerate(zip(topic["segments"],timeline)):
        im=SCENES[s["kind"]](s,P,page); plate=work/f"scene-{i:02}.png"; im.convert("RGB").save(plate)
        v=work/f"scene-{i:02}.mp4"; scene_video(plate,t["duration"],v,i); vids.append(v)
    visual=work/"visual.mp4"; concat(vids,visual); sub=work/"captions.ass"; ass(topic,timeline,sub)
    sec=duration(narration); music=work/"bed.wav"; bed(sec,music); final=out/f"{topic['id']}-v2.mp4"
    run(["ffmpeg","-y","-i",str(visual),"-i",str(narration),"-i",str(music),
      "-filter_complex",f"[0:v]ass={sub.as_posix()}[v];[2:a]volume=.38[b];[1:a][b]amix=inputs=2:duration=first:dropout_transition=0[a]",
      "-map","[v]","-map","[a]","-c:v","libx264","-preset","slow","-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart","-shortest",str(final)])
    result=qc(final); sheet(final,out/f"{topic['id']}-contact-sheet.jpg",result["duration_seconds"])
    desc=("入学とPTA加入は同じものではありません。入学前に不安がある方へ、まず確認したいポイントを短く整理しました。\\n\\n"
          "詳しい解説：https://ptaorg.com/membership.html\\n"
          "一次資料：文部科学省 末松信介文部科学大臣記者会見録（令和4年6月17日）\\n"
          "https://www.mext.go.jp/b_menu/daijin/detail/mext_00278.html\\n\\n"
          "映像素材：Pexels（各素材のライセンスに基づき編集）\\n#PTA #入学準備 #保護者 #任意加入")
    meta={"id":topic["id"],"title":"入学したら自動でPTA会員？まず確認したいこと #PTA","description":desc,
          "source":topic["source"],"sources":topic["sources"],"assets":topic["assets"],"quality_check":result,
          "render_engine":"FFmpeg + Pillow + edge-tts","voice":topic["voice"],"output":final.name}
    (out/f"{topic['id']}-metadata.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(meta,ensure_ascii=False,indent=2))

if __name__=="__main__": main()
