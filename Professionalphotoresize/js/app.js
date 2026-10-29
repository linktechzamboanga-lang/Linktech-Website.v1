(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const state = { photos: [], activeId: null, layout: [], pageCanvases: [] };
  const presets = {
    "2x2": [2,2], "1x1":[1,1], "3x3":[3,3], passport:[35/25.4,45/25.4]
  };
  const paperSizes = {
    a4:[8.2677,11.6929], letter:[8.5,11], legal:[8.5,14],
    a3:[11.6929,16.5354], photo4x6:[4,6], photo5x7:[5,7], photo8x10:[8,10]
  };
  const uid = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const clamp = (v,min,max) => Math.max(min,Math.min(max,Number(v)||0));
  const active = () => state.photos.find(p => p.id === state.activeId) || null;
  const imageFromURL = src => new Promise((resolve,reject) => {
    const img = new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=src;
  });
  const readFile = file => new Promise((resolve,reject) => {
    const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(file);
  });
  function dimensionsInches() {
    const preset=$("presetSize").value;
    if(preset==="custom") return [clamp($("customW").value,.1,12),clamp($("customH").value,.1,16)];
    return presets[preset] || [2,2];
  }
  function targetPixels() {
    const [w,h]=dimensionsInches(), dpi=clamp($("dpi").value,72,600);
    return [Math.max(1,Math.round(w*dpi)),Math.max(1,Math.round(h*dpi))];
  }
  function syncSizeUI() {
    $("customSizeFields").classList.toggle("hidden",$("presetSize").value!=="custom");
    const [w,h]=dimensionsInches();
    $("printDimensions").textContent=`${round(w,2)} × ${round(h,2)} in`;
    const [pw,ph]=targetPixels();
    $("pixelDimensions").textContent=`${pw} × ${ph} px`;
  }
  function round(n,d=1){return Number(n).toFixed(d).replace(/\.0+$|(\.\d*[1-9])0+$/,"$1");}
  function syncPhotoSelect() {
    const select=$("photoSelect"); select.innerHTML="";
    if(!state.photos.length){select.add(new Option("Upload a photo first",""));return;}
    state.photos.forEach(p=>select.add(new Option(p.name,p.id)));
    select.value=state.activeId||state.photos[0].id;
  }
  async function loadPhoto(id) {
    const p=state.photos.find(x=>x.id===id); if(!p)return;
    state.activeId=p.id; syncPhotoSelect(); renderQueue();
    $("cropperImage").src=p.original;
    $("cropperImage").onload=()=>syncCropFrame();
    $("emptyState").classList.add("hidden"); $("editorCanvas").classList.remove("hidden");
    $("cropX").value=p.edit.cropX; $("cropY").value=p.edit.cropY; $("cropW").value=p.edit.cropW; $("cropH").value=p.edit.cropH;
    $("brightness").value=p.edit.brightness; $("contrast").value=p.edit.contrast;
    $("saturation").value=p.edit.saturation; $("opacity").value=p.edit.opacity;
    $("removeBg").checked=p.edit.removeBg; $("bgColor").value=p.edit.bgColor; $("bgTolerance").value=p.edit.bgTolerance;
    $("rotateBtn").dataset.rotation=p.edit.rotation;
    updateOutputs(); syncCropFrame(); await renderEditor();
  }
  function currentEdit() {
    return {
      cropX:clamp($("cropX").value,0,99),cropY:clamp($("cropY").value,0,99),
      cropW:clamp($("cropW").value,1,100),cropH:clamp($("cropH").value,1,100),
      brightness:clamp($("brightness").value,0,200),contrast:clamp($("contrast").value,0,200),
      saturation:clamp($("saturation").value,0,200),opacity:clamp($("opacity").value,0,100),
      removeBg:$("removeBg").checked,bgColor:$("bgColor").value,bgTolerance:clamp($("bgTolerance").value,0,150),
      rotation:Number($("rotateBtn").dataset.rotation||0)
    };
  }
  function updateOutputs() {
    ["brightness","contrast","saturation","opacity"].forEach(id=>$(id+"Out").textContent=$("".concat(id)).value+"%");
    $("toleranceOut").textContent=$("bgTolerance").value;
    syncSizeUI();
  }
  function hexRGB(hex) {
    const v=hex.replace("#","");return [parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)];
  }
  async function makeProcessedCanvas(photo, edit, targetW, targetH) {
    const img=await imageFromURL(photo.original);
    let sx=img.naturalWidth*edit.cropX/100, sy=img.naturalHeight*edit.cropY/100;
    let sw=img.naturalWidth*edit.cropW/100, sh=img.naturalHeight*edit.cropH/100;
    sw=Math.min(sw,img.naturalWidth-sx); sh=Math.min(sh,img.naturalHeight-sy);
    if(sw<1||sh<1){sx=0;sy=0;sw=img.naturalWidth;sh=img.naturalHeight;}
    const rotated=edit.rotation%180!==0;
    const c=document.createElement("canvas"); c.width=rotated?targetH:targetW;c.height=rotated?targetW:targetH;
    const ctx=c.getContext("2d",{willReadFrequently:true});
    ctx.save();ctx.translate(c.width/2,c.height/2);ctx.rotate(edit.rotation*Math.PI/180);
    ctx.filter=`brightness(${edit.brightness}%) contrast(${edit.contrast}%) saturate(${edit.saturation}%)`;
    ctx.globalAlpha=edit.opacity/100;
    ctx.drawImage(img,sx,sy,sw,sh,-targetW/2,-targetH/2,targetW,targetH);ctx.restore();ctx.filter="none";ctx.globalAlpha=1;
    if(edit.removeBg) {
      const data=ctx.getImageData(0,0,c.width,c.height), d=data.data, target=hexRGB(edit.bgColor), tol=edit.bgTolerance*edit.bgTolerance*3;
      for(let i=0;i<d.length;i+=4){
        const dr=d[i]-target[0],dg=d[i+1]-target[1],db=d[i+2]-target[2];
        if(dr*dr+dg*dg+db*db<=tol)d[i+3]=0;
      }
      ctx.putImageData(data,0,0);
    }
    return c;
  }
  async function renderEditor() {
    const p=active(); if(!p)return;
    try{
      const [w,h]=targetPixels(), c=await makeProcessedCanvas(p,currentEdit(),w,h);
      const view=$("editorCanvas");view.width=c.width;view.height=c.height;
      view.getContext("2d").clearRect(0,0,view.width,view.height);view.getContext("2d").drawImage(c,0,0);
      $("outputDimensions").textContent=`${c.width} × ${c.height} px`;
    }catch(e){console.error(e);alert("Could not process this image. Please try another photo.");}
  }
  function saveEditToActive() {
    const p=active(); if(!p)return;
    p.edit=currentEdit(); renderQueue();
  }
  async function applyEdits() {
    const p=active(); if(!p){alert("Upload a photo first.");return;}
    saveEditToActive();
    const [w,h]=targetPixels();
    const c=await makeProcessedCanvas(p,p.edit,w,h);
    p.processed=c.toDataURL("image/png");p.width=c.width;p.height=c.height;
    p.size=dimensionsInches();
    renderQueue();await buildLayout();
    $("layoutSummary").textContent=`Edits applied to ${p.name}. Output: ${c.width} × ${c.height} px at ${$("dpi").value} DPI target.`;
  }
  function renderQueue() {
    const root=$("photoQueue");root.innerHTML="";
    if(!state.photos.length){root.innerHTML='<p class="muted">No photos uploaded yet.</p>';return;}
    state.photos.forEach(p=>{
      const card=document.createElement("article");card.className="queue-card"+(p.id===state.activeId?" active":"");
      const img=document.createElement("img");img.className="queue-thumb";img.alt=p.name;img.src=p.processed||p.original;
      const name=document.createElement("div");name.className="queue-name";name.textContent=p.name;
      const detail=document.createElement("div");detail.className="queue-detail";detail.textContent=p.width?`${p.width} × ${p.height} px · edited`:"Original image";
      const actions=document.createElement("div");actions.className="queue-actions";
      const edit=document.createElement("button");edit.className="btn btn-light";edit.textContent="Edit";edit.onclick=()=>loadPhoto(p.id);
      const del=document.createElement("button");del.className="btn btn-danger-soft";del.textContent="Remove";del.onclick=()=>removePhoto(p.id);
      actions.append(edit,del);card.append(img,name,detail,actions);root.append(card);
    });
  }
  function removePhoto(id) {
    state.photos=state.photos.filter(p=>p.id!==id);
    if(state.activeId===id)state.activeId=state.photos[0]?.id||null;
    syncPhotoSelect();renderQueue();
    if(state.activeId)loadPhoto(state.activeId);else{$("editorCanvas").classList.add("hidden");$("emptyState").classList.remove("hidden");$("outputDimensions").textContent="—";$("pixelDimensions").textContent="—";}
  }
  async function addFiles(files) {
    for(const file of files){
      if(!file.type.startsWith("image/"))continue;
      try{const src=await readFile(file);state.photos.push({id:uid(),name:file.name,original:src,processed:null,width:0,height:0,size:[2,2],edit:{cropX:0,cropY:0,cropW:100,cropH:100,brightness:100,contrast:100,saturation:100,opacity:100,removeBg:false,bgColor:"#ffffff",bgTolerance:35,rotation:0}});}catch(e){console.error(e);}
    }
    if(state.photos.length){state.activeId=state.photos[state.photos.length-1].id;await loadPhoto(state.activeId);}
    syncPhotoSelect();renderQueue();
  }
  function getPaperInches() {
    if($("paperSize").value==="custom")return [clamp($("paperW").value,2,24),clamp($("paperH").value,2,36)];
    return paperSizes[$("paperSize").value]||paperSizes.a4;
  }
  function getPhotoForPrint(p) { return p.processed || p.original; }
  async function buildLayout() {
    const p=active(); if(!p){$("layoutSummary").textContent="Upload a photo first.";return;}
    if(!p.processed) {
      const [w,h]=targetPixels();const c=await makeProcessedCanvas(p,currentEdit(),w,h);
      p.processed=c.toDataURL("image/png");p.width=c.width;p.height=c.height;p.size=dimensionsInches();
    }
    const [pw,ph]=getPaperInches(), [sw,sh]=dimensionsInches();
    const margin=clamp($("margin").value,0,30)/25.4,gap=clamp($("gap").value,0,30)/25.4;
    const copies=Math.floor(clamp($("copies").value,1,200)), cols=Math.floor(clamp($("columns").value,1,12));
    const fit=$("fitMode").value==="fit";
    const maxCols=Math.max(1,Math.floor((pw-2*margin+gap)/(sw+gap)));
    const actualCols=Math.min(cols,maxCols);
    const rowsFit=Math.max(1,Math.floor((ph-2*margin+gap)/(sh+gap)));
    const perPage=Math.max(1,actualCols*rowsFit);
    const totalPages=fit?1:Math.ceil(copies/perPage);
    const pageCanvases=[];
    for(let page=0;page<totalPages;page++){
      const scale=fit?Math.min(1,(pw-2*margin)/(actualCols*sw+(actualCols-1)*gap),(ph-2*margin)/(Math.ceil(copies/actualCols)*sh+(Math.ceil(copies/actualCols)-1)*gap)):1;
      const cw=Math.round(pw*150),ch=Math.round(ph*150);
      const c=document.createElement("canvas");c.width=cw;c.height=ch;
      const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,cw,ch);
      const cellW=sw*150*scale,cellH=sh*150*scale,gm=gap*150*scale,mg=margin*150;
      const count=fit?copies:Math.min(perPage,copies-page*perPage);
      const rows=Math.ceil(count/actualCols);
      const usedW=actualCols*cellW+Math.max(0,actualCols-1)*gm;
      const startX=Math.max(mg,(cw-usedW)/2);
      const usedH=rows*cellH+Math.max(0,rows-1)*gm;
      const startY=fit?Math.max(mg,(ch-usedH)/2):mg;
      const src=await imageFromURL(getPhotoForPrint(p));
      for(let i=0;i<count;i++){
        const col=i%actualCols,row=Math.floor(i/actualCols);
        const x=startX+col*(cellW+gm),y=startY+row*(cellH+gm);
        ctx.drawImage(src,x,y,cellW,cellH);
      }
      pageCanvases.push({canvas:c,widthIn:pw,heightIn:ph,count,page:page+1});
    }
    state.pageCanvases=pageCanvases;
    const preview=$("printPreview");preview.innerHTML="";
    pageCanvases.forEach(item=>{
      const box=document.createElement("div");box.className="print-page-thumb";
      const ratio=item.widthIn/item.heightIn;box.style.width=`min(100%,${Math.round(270*ratio)}px)`;box.style.aspectRatio=`${item.widthIn}/${item.heightIn}`;
      const thumb=document.createElement("canvas");thumb.width=item.canvas.width;thumb.height=item.canvas.height;thumb.getContext("2d").drawImage(item.canvas,0,0);box.append(thumb);preview.append(box);
    });
    $("layoutSummary").textContent=`${copies} copies · ${actualCols} columns · ${totalPages} page(s) · paper ${round(pw,2)} × ${round(ph,2)} in · photo ${round(sw,2)} × ${round(sh,2)} in. ${cols>maxCols?"Columns reduced to fit paper width.":""}`;
    renderQueue();
  }
  function preparePrint() {
    if(!state.pageCanvases.length){alert("Build the print preview first.");return;}
    const root=$("printRoot");root.innerHTML="";
    state.pageCanvases.forEach(item=>{
      const page=document.createElement("div");page.className="print-sheet";
      page.style.width=`${item.widthIn}in`;page.style.height=`${item.heightIn}in`;
      const c=document.createElement("canvas");c.width=item.canvas.width;c.height=item.canvas.height;c.getContext("2d").drawImage(item.canvas,0,0);page.append(c);root.append(page);
    });
    const style=document.createElement("style");style.id="printPageStyle";
    style.textContent="@media print { @page { size: auto; margin: 0; } .print-sheet { page-break-after: always; break-after: page; } .print-sheet:last-child { page-break-after: auto; break-after: auto; } }";
    document.head.append(style);
    window.print();
    setTimeout(()=>style.remove(),1500);
  }
  function exportSingle() {
    const p=active();if(!p){alert("Upload a photo first.");return;}
    const format=prompt("Export format: enter PNG or JPG","PNG");if(!format)return;
    const type=format.toLowerCase().startsWith("j")?"image/jpeg":"image/png";
    const src=p.processed||$("editorCanvas").toDataURL("image/png");
    imageFromURL(src).then(img=>{
      const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;
      const ctx=c.getContext("2d");if(type==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);}ctx.drawImage(img,0,0);
      const a=document.createElement("a");a.href=c.toDataURL(type,.95);a.download=(p.name.replace(/\.[^.]+$/,"")||"photo")+(type==="image/png"?".png":".jpg");a.click();
    });
  }
  function exportProject() {
    const payload={app:"LinkTech Professional Photo Resize",version:1,photos:state.photos,activeId:state.activeId,settings:{
      presetSize:$("presetSize").value,dpi:$("dpi").value,customW:$("customW").value,customH:$("customH").value,
      paperSize:$("paperSize").value,paperW:$("paperW").value,paperH:$("paperH").value,copies:$("copies").value,
      columns:$("columns").value,gap:$("gap").value,margin:$("margin").value,fitMode:$("fitMode").value
    }};
    const blob=new Blob([JSON.stringify(payload)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="professional-photo-resize-project.json";a.click();URL.revokeObjectURL(url);
  }
  async function importProject(file) {
    try{
      const data=JSON.parse(await file.text());
      if(!Array.isArray(data.photos))throw new Error("Invalid project file");
      state.photos=data.photos.filter(p=>p&&p.original&&p.id).map(p=>({...p,edit:{...{cropX:0,cropY:0,cropW:100,cropH:100,brightness:100,contrast:100,saturation:100,opacity:100,removeBg:false,bgColor:"#ffffff",bgTolerance:35,rotation:0},...(p.edit||{})}}));
      state.activeId=state.photos.some(p=>p.id===data.activeId)?data.activeId:(state.photos[0]?.id||null);
      const s=data.settings||{};Object.entries(s).forEach(([k,v])=>{const element=$(k);if(element)element.value=v;});
      syncSizeUI();syncPhotoSelect();renderQueue();if(state.activeId)await loadPhoto(state.activeId);await buildLayout();
    }catch(e){alert("Unable to import this project. Please select a project JSON exported by this app.");}
  }
  function resetCrop(){["cropX","cropY"].forEach(id=>$(id).value=0);["cropW","cropH"].forEach(id=>$(id).value=100);syncCropFrame();renderEditor();}
  function resetAdjust(){["brightness","contrast","saturation"].forEach(id=>$(id).value=100);$("opacity").value=100;renderEditor();updateOutputs();}
  function el(x){return x;}

  // Interactive crop frame. Crop values remain percentages of the original image.
  let cropGesture = null;
  function syncCropFrame() {
    const p=active(), img=$("cropperImage"), frame=$("cropFrame");
    if(!p || !img.naturalWidth) {
      $("cropperWrap").classList.add("hidden");
      return;
    }
    $("cropperWrap").classList.remove("hidden");
    const e=currentEdit();
    frame.style.left=e.cropX+"%"; frame.style.top=e.cropY+"%";
    frame.style.width=Math.min(e.cropW,100-e.cropX)+"%";
    frame.style.height=Math.min(e.cropH,100-e.cropY)+"%";
  }
  function updateCropFromGesture(ev) {
    if(!cropGesture)return;
    const stage=$("cropperStage"), r=stage.getBoundingClientRect();
    if(!r.width||!r.height)return;
    const dx=(ev.clientX-cropGesture.startX)/r.width*100;
    const dy=(ev.clientY-cropGesture.startY)/r.height*100;
    let {x,y,w,h}=cropGesture.start;
    const min= Math.max(2,Math.min(8,Math.min(w,h)*0.08));
    const mode=cropGesture.mode;
    if(mode==="move"){
      x=clamp(cropGesture.start.x+dx,0,100-w);
      y=clamp(cropGesture.start.y+dy,0,100-h);
    } else {
      if(mode.includes("w")){const nx=clamp(cropGesture.start.x+dx,0,cropGesture.start.x+cropGesture.start.w-min);w=cropGesture.start.x+cropGesture.start.w-nx;x=nx;}
      if(mode.includes("e"))w=clamp(cropGesture.start.w+dx,min,100-x);
      if(mode.includes("n")){const ny=clamp(cropGesture.start.y+dy,0,cropGesture.start.y+cropGesture.start.h-min);h=cropGesture.start.y+cropGesture.start.h-ny;y=ny;}
      if(mode.includes("s"))h=clamp(cropGesture.start.h+dy,min,100-y);
      x=clamp(x,0,99);y=clamp(y,0,99);w=clamp(w,min,100-x);h=clamp(h,min,100-y);
    }
    $("cropX").value=round(x,2);$("cropY").value=round(y,2);
    $("cropW").value=round(w,2);$("cropH").value=round(h,2);
    syncCropFrame();
    if(active())active().edit=currentEdit();
    renderEditor();
  }
  function beginCropGesture(ev) {
    const handle=ev.target.closest("[data-handle]");
    const frame=$("cropFrame");
    if(!frame || frame.classList.contains("hidden"))return;
    ev.preventDefault();
    const e=currentEdit();
    cropGesture={pointerId:ev.pointerId,startX:ev.clientX,startY:ev.clientY,
      start:{x:e.cropX,y:e.cropY,w:e.cropW,h:e.cropH},
      mode:handle?handle.dataset.handle:"move"};
    try{ev.target.setPointerCapture(ev.pointerId);}catch(_){}
  }
  $("cropperStage").addEventListener("pointerdown",beginCropGesture);
  $("cropperStage").addEventListener("pointermove",ev=>{if(cropGesture)updateCropFromGesture(ev);});
  const endCropGesture=()=>{cropGesture=null;};
  $("cropperStage").addEventListener("pointerup",endCropGesture);
  $("cropperStage").addEventListener("pointercancel",endCropGesture);
  $("cropperStage").addEventListener("lostpointercapture",endCropGesture);
  const originalLoadPhoto = loadPhoto;

  $("photoInput").addEventListener("change",e=>addFiles([...e.target.files]));
  $("photoSelect").addEventListener("change",e=>loadPhoto(e.target.value));
  ["cropX","cropY","cropW","cropH","brightness","contrast","saturation","opacity","bgColor","bgTolerance","removeBg"].forEach(id=>{
    $(id).addEventListener("input",()=>{updateOutputs();syncCropFrame();renderEditor();});
    $(id).addEventListener("change",()=>{if(active())active().edit=currentEdit();});
  });
  ["presetSize","customW","customH","dpi"].forEach(id=>$(id).addEventListener("change",()=>{syncSizeUI();renderEditor();}));
  $("rotateBtn").addEventListener("click",()=>{const n=(Number($("rotateBtn").dataset.rotation||0)+90)%360;$("rotateBtn").dataset.rotation=n;if(active())active().edit.rotation=n;renderEditor();});
  $("resetCropBtn").addEventListener("click",resetCrop);$("resetAdjustBtn").addEventListener("click",resetAdjust);
  $("sampleBgBtn").addEventListener("click",()=>{
    const p=active();if(!p){alert("Upload a photo first.");return;}
    imageFromURL(p.original).then(img=>{const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0);const d=ctx.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data;$("bgColor").value="#"+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,"0")).join("");renderEditor();});
  });
  $("applyBtn").addEventListener("click",applyEdits);$("downloadImageBtn").addEventListener("click",exportSingle);
  $("buildLayoutBtn").addEventListener("click",buildLayout);$("printBtn").addEventListener("click",preparePrint);
  $("exportProjectBtn").addEventListener("click",exportProject);
  $("importProjectInput").addEventListener("change",e=>{if(e.target.files[0])importProject(e.target.files[0]);e.target.value="";});
  $("clearAllBtn").addEventListener("click",()=>{if(confirm("Remove all photos from this project?")){state.photos=[];state.activeId=null;state.pageCanvases=[];syncPhotoSelect();renderQueue();$("printPreview").innerHTML='<div class="empty-state compact"><div class="empty-picture">▤</div><strong>Print sheet preview</strong><span>Your paper layout will appear here.</span></div>';$("editorCanvas").classList.add("hidden");$("emptyState").classList.remove("hidden");$("layoutSummary").textContent="Upload a photo, choose its size and build a print layout.";}});
  async function buildAllPhotosLayout() {
    if(!state.photos.length){alert("Upload photos first.");return;}
    const [pw,ph]=getPaperInches(), [sw,sh]=dimensionsInches();
    const margin=clamp($("margin").value,0,30)/25.4,gap=clamp($("gap").value,0,30)/25.4;
    const requestedCols=Math.floor(clamp($("columns").value,1,12));
    const maxCols=Math.max(1,Math.floor((pw-2*margin+gap)/(sw+gap)));
    const cols=Math.min(requestedCols,maxCols), rowsFit=Math.max(1,Math.floor((ph-2*margin+gap)/(sh+gap)));
    const perPage=Math.max(1,cols*rowsFit), pages=Math.ceil(state.photos.length/perPage), dpi=150;
    const prepared=[];
    for(const p of state.photos){
      const edit=p.id===state.activeId?currentEdit():(p.edit||currentEdit());
      const [tw,th]=targetPixels();const c=await makeProcessedCanvas(p,edit,tw,th);
      p.processed=c.toDataURL("image/png");p.width=c.width;p.height=c.height;p.size=[sw,sh];prepared.push({photo:p,src:p.processed});
    }
    state.pageCanvases=[];
    for(let page=0;page<pages;page++){
      const items=prepared.slice(page*perPage,(page+1)*perPage),c=document.createElement("canvas");
      c.width=Math.round(pw*dpi);c.height=Math.round(ph*dpi);const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);
      const cellW=sw*dpi,cellH=sh*dpi,gm=gap*dpi,mg=margin*dpi,usedW=cols*cellW+(cols-1)*gm;
      const startX=Math.max(mg,(c.width-usedW)/2);
      for(let i=0;i<items.length;i++){
        const col=i%cols,row=Math.floor(i/cols),img=await imageFromURL(items[i].src);
        ctx.drawImage(img,startX+col*(cellW+gm),mg+row*(cellH+gm),cellW,cellH);
      }
      state.pageCanvases.push({canvas:c,widthIn:pw,heightIn:ph,count:items.length,page:page+1});
    }
    const preview=$("printPreview");preview.innerHTML="";
    state.pageCanvases.forEach(item=>{const box=document.createElement("div");box.className="print-page-thumb";box.style.width=`min(100%,${Math.round(270*item.widthIn/item.heightIn)}px)`;box.style.aspectRatio=`${item.widthIn}/${item.heightIn}`;const thumb=document.createElement("canvas");thumb.width=item.canvas.width;thumb.height=item.canvas.height;thumb.getContext("2d").drawImage(item.canvas,0,0);box.append(thumb);preview.append(box);});
    $("layoutSummary").textContent=`${state.photos.length} different photo(s), one copy each · ${cols} columns · ${pages} page(s) · ${round(pw,2)} × ${round(ph,2)} in paper.`;
    renderQueue();
  }
  $("addAllBtn").addEventListener("click",buildAllPhotosLayout);
  $("paperSize").addEventListener("change",()=>{$("customPaperFields").classList.toggle("hidden",$("paperSize").value!=="custom");});
  $("customPaperFields").classList.toggle("hidden",true);
  syncSizeUI();updateOutputs();renderQueue();
})();