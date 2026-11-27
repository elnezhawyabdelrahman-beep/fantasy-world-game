import "./style.css";
import {
  ArcRotateCamera, Color3, Color4, Engine, HemisphericLight, Mesh, MeshBuilder,
  PBRMaterial, Scene, StandardMaterial, TransformNode, Vector3
} from "@babylonjs/core";
import { levelForExperience, questProgress } from "./game/progression";
import { loadGame, saveGame, type SaveData } from "./game/save";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;
const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, adaptToDeviceRatio: true });
const scene = new Scene(engine);
scene.clearColor = new Color4(0.48, 0.72, 0.77, 1);
scene.collisionsEnabled = true;
const camera = new ArcRotateCamera("follow-camera", -Math.PI / 2, 1.12, 11, new Vector3(0, 1, 0), scene);
camera.lowerRadiusLimit = 6; camera.upperRadiusLimit = 15; camera.lowerBetaLimit = 0.65; camera.upperBetaLimit = 1.38;
camera.attachControl(canvas, true); camera.panningSensibility = 0; camera.wheelPrecision = 65;
const sun = new HemisphericLight("soft-sun", new Vector3(0.2, 1, 0.1), scene); sun.intensity = 0.88;
const groundMat = new StandardMaterial("island-grass", scene); groundMat.diffuseColor = new Color3(0.22, 0.43, 0.32); groundMat.specularColor = new Color3(.04,.06,.04);
const ground = MeshBuilder.CreateGround("island", {width:100,height:100,subdivisions:2}, scene); ground.material = groundMat; ground.checkCollisions = true;
const waterMat = new StandardMaterial("water", scene); waterMat.diffuseColor = new Color3(.12,.34,.43); waterMat.alpha = .86;
const water = MeshBuilder.CreateGround("sea", {width:220,height:220}, scene); water.position.y = -1.15; water.material = waterMat;
const rockMat = new StandardMaterial("stone", scene); rockMat.diffuseColor = new Color3(.35,.39,.39);
const trunkMat = new StandardMaterial("bark", scene); trunkMat.diffuseColor = new Color3(.27,.17,.11);
const leafMats = [new Color3(.16,.39,.31),new Color3(.21,.45,.34),new Color3(.24,.37,.31)].map((c,i)=>{const m=new StandardMaterial("leaf"+i,scene);m.diffuseColor=c;return m;});
const crystalMat = new StandardMaterial("moon-crystal", scene); crystalMat.diffuseColor = new Color3(.36,.86,1); crystalMat.emissiveColor = new Color3(.12,.48,.7);
const goldMat = new StandardMaterial("gold",scene);goldMat.diffuseColor=new Color3(.83,.65,.3);

function makeMaterial(name:string,color:Color3){
  const m=new StandardMaterial(name,scene);m.diffuseColor=color;m.specularColor=new Color3(.12,.12,.12);return m;
}
type HumanoidRig={root:TransformNode;torso:Mesh;leftArm:Mesh;rightArm:Mesh;leftLeg:Mesh;rightLeg:Mesh};
function createHumanoid(name:string,position:Vector3,palette:{cloth:Color3;trim:Color3;hair:Color3;skin:Color3;boots:Color3}):HumanoidRig{
  const root=new TransformNode(name,scene);root.position.copyFrom(position);
  const cloth=makeMaterial(name+"-cloth",palette.cloth),trim=makeMaterial(name+"-trim",palette.trim),hair=makeMaterial(name+"-hair",palette.hair),skin=makeMaterial(name+"-skin",palette.skin),boots=makeMaterial(name+"-boots",palette.boots);
  const torso=MeshBuilder.CreateCapsule(name+"-tunic",{height:1.12,radius:.34,tessellation:16},scene);torso.parent=root;torso.position.y=1.08;torso.material=cloth;
  const collar=MeshBuilder.CreateTorus(name+"-collar",{diameter:.42,thickness:.055,tessellation:16},scene);collar.parent=root;collar.position.y=1.58;collar.material=trim;
  const belt=MeshBuilder.CreateTorus(name+"-belt",{diameter:.63,thickness:.055,tessellation:20},scene);belt.parent=root;belt.position.y=.91;belt.material=trim;
  const head=MeshBuilder.CreateSphere(name+"-face",{diameter:.56,segments:20},scene);head.parent=root;head.position.y=1.91;head.material=skin;
  const hairCap=MeshBuilder.CreateSphere(name+"-hair-cap",{diameter:.59,segments:16},scene);hairCap.parent=root;hairCap.position.set(0,2.08,-.015);hairCap.scaling.set(1,.58,1);hairCap.material=hair;
  const fringe=MeshBuilder.CreateSphere(name+"-fringe",{diameter:.35,segments:12},scene);fringe.parent=root;fringe.position.set(0,2.02,-.225);fringe.scaling.set(1,.55,.5);fringe.material=hair;
  const eyes=makeMaterial(name+"-eyes",new Color3(.08,.07,.06));
  for(const side of [-1,1]){const eye=MeshBuilder.CreateSphere(name+"-eye",{diameter:.065,segments:8},scene);eye.parent=root;eye.position.set(side*.105,1.94,-.258);eye.scaling.set(1,.72,.55);eye.material=eyes;}
  const nose=MeshBuilder.CreateSphere(name+"-nose",{diameter:.075,segments:8},scene);nose.parent=root;nose.position.set(0,1.84,-.29);nose.scaling.set(.8,1,.75);nose.material=skin;
  const leftArm=MeshBuilder.CreateCapsule(name+"-left-arm",{height:.88,radius:.135,tessellation:12},scene);leftArm.parent=root;leftArm.position.set(-.39,1.19,0);leftArm.rotation.z=-.12;leftArm.material=cloth;
  const rightArm=MeshBuilder.CreateCapsule(name+"-right-arm",{height:.88,radius:.135,tessellation:12},scene);rightArm.parent=root;rightArm.position.set(.39,1.19,0);rightArm.rotation.z=.12;rightArm.material=cloth;
  for(const arm of [leftArm,rightArm]){const hand=MeshBuilder.CreateSphere(name+"-hand",{diameter:.23,segments:10},scene);hand.parent=arm;hand.position.y=-.43;hand.material=skin;}
  const leftLeg=MeshBuilder.CreateCapsule(name+"-left-leg",{height:.78,radius:.16,tessellation:12},scene);leftLeg.parent=root;leftLeg.position.set(-.17,.43,0);leftLeg.material=trim;
  const rightLeg=MeshBuilder.CreateCapsule(name+"-right-leg",{height:.78,radius:.16,tessellation:12},scene);rightLeg.parent=root;rightLeg.position.set(.17,.43,0);rightLeg.material=trim;
  for(const side of [-1,1]){const boot=MeshBuilder.CreateCylinder(name+"-boot",{height:.23,diameterTop:.25,diameterBottom:.3,tessellation:12},scene);boot.parent=root;boot.position.set(side*.17,.13,-.055);boot.material=boots;}
  const cape=MeshBuilder.CreateCylinder(name+"-cape",{height:1.12,diameterTop:.22,diameterBottom:.82,tessellation:8},scene);cape.parent=root;cape.position.set(0,1.02,.27);cape.material=trim;
  return {root,torso,leftArm,rightArm,leftLeg,rightLeg};
}
const playerRig=createHumanoid("traveler",Vector3.Zero(),{cloth:new Color3(.19,.28,.52),trim:new Color3(.77,.55,.22),hair:new Color3(.16,.1,.08),skin:new Color3(.76,.54,.39),boots:new Color3(.16,.12,.1)});
const player=playerRig.root;
const body=playerRig.torso;
const collidables: Mesh[] = [];
function makeTree(x:number,z:number,scale:number){
  const trunk=MeshBuilder.CreateCylinder("tree-trunk",{height:2.1*scale,diameter:.35*scale},scene);trunk.position.set(x,1.05*scale,z);trunk.material=trunkMat;collidables.push(trunk);
  for(let i=0;i<3;i++){const crown=MeshBuilder.CreateSphere("tree-crown",{diameter:2.15*scale-i*.28*scale,segments:8},scene);crown.position.set(x,(2.1+i*.55)*scale,z);crown.material=leafMats[(Math.abs(Math.floor(x+z))+i)%leafMats.length];}
}
function makeRock(x:number,z:number,s:number){const rock=MeshBuilder.CreatePolyhedron("mossy-rock",{type:1,size:s},scene);rock.position.set(x,s*.48,z);rock.scaling.y=.7;rock.material=rockMat;collidables.push(rock);}
for(let i=0;i<48;i++){const a=i*2.399;const r=13+(i%7)*2.15;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<5&&Math.abs(z)<5)continue;makeTree(x,z,.75+(i%4)*.16);}
for(let i=0;i<24;i++){const a=i*2.4,r=7+(i%5)*2.3;makeRock(Math.cos(a)*r,Math.sin(a)*r,.55+(i%3)*.22);}
const crystals: {id:string;mesh:Mesh;home:Vector3}[]=[];
for(let i=0;i<7;i++){const a=i*2.4+.4,r=5.5+(i%3)*3.1;const x=Math.cos(a)*r,z=Math.sin(a)*r;const c=MeshBuilder.CreatePolyhedron("moon-crystal",{type:1,size:.58},scene);c.position.set(x,.95,z);c.rotation.z=.3;c.material=crystalMat;const glow=MeshBuilder.CreateSphere("crystal-aura",{diameter:1.15,segments:8},scene);glow.position.copyFrom(c.position);const gm=new StandardMaterial("aura"+i,scene);gm.emissiveColor=new Color3(.08,.36,.5);gm.alpha=.18;glow.material=gm;crystals.push({id:"crystal-"+i,mesh:c,home:c.position.clone()});}
const archMat=new StandardMaterial("arch-stone",scene);archMat.diffuseColor=new Color3(.54,.52,.42);
for(const [x,z] of [[0,-4],[0,-4.9]] as number[][]){const pillar=MeshBuilder.CreateBox("ruin-pillar",{width:.65,height:3.1,depth:.65},scene);pillar.position.set(x,1.55,z);pillar.material=archMat;}
const lintel=MeshBuilder.CreateBox("ruin-lintel",{width:3.5,height:.55,depth:.7},scene);lintel.position.set(0,3.15,-4.45);lintel.material=archMat;
const keeperRig=createHumanoid("island-keeper",new Vector3(2,0,-3),{cloth:new Color3(.49,.25,.16),trim:new Color3(.86,.68,.34),hair:new Color3(.72,.7,.62),skin:new Color3(.65,.43,.31),boots:new Color3(.2,.13,.09)});
const npc=keeperRig.root;
const villagers=[
 createHumanoid("village-weaver",new Vector3(-4,0,-2),{cloth:new Color3(.18,.42,.39),trim:new Color3(.84,.68,.38),hair:new Color3(.19,.12,.1),skin:new Color3(.84,.66,.5),boots:new Color3(.22,.15,.11)}),
 createHumanoid("village-herbalist",new Vector3(4,0,-6),{cloth:new Color3(.39,.29,.53),trim:new Color3(.76,.7,.43),hair:new Color3(.22,.16,.12),skin:new Color3(.69,.48,.34),boots:new Color3(.18,.13,.1)}),
 createHumanoid("village-guard",new Vector3(-5,0,-7),{cloth:new Color3(.28,.36,.31),trim:new Color3(.72,.63,.39),hair:new Color3(.12,.1,.09),skin:new Color3(.79,.59,.44),boots:new Color3(.16,.12,.1)})
];
const keys=new Set<string>();let joystick={x:0,y:0};let crystalsFound=0;let experience=0;let soundOn=true;let paused=false;let lastToast=0;let lastPos={x:0,z:0};let installPrompt:BeforeInstallPromptEvent|null=null;
interface BeforeInstallPromptEvent extends Event {prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>}
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const toast=(message:string)=>{const el=$("toast");el.textContent=message;el.classList.add("show");lastToast=performance.now();};
function refreshUI(){ $("crystal-count").textContent=String(crystalsFound);$("level-count").textContent=String(levelForExperience(experience));$("quest-progress-bar").style.width=questProgress(crystalsFound,3)+"%";$("quest-progress-text").textContent=crystalsFound>=3?"Quest complete!":" "+crystalsFound+" / 3 moon crystals";if(crystalsFound>=3){$("quest-title").textContent="The Isles Remember";$("quest-description").textContent="You have restored a little light to the island. Explore freely!";}}
async function persist(){const data:SaveData={version:1,crystals:crystalsFound,experience,collectedIds:crystals.filter(c=>c.mesh.isVisible===false).map(c=>c.id),player:{x:player.position.x,z:player.position.z}};try{await saveGame(data);$("save-status").textContent="Progress saved on this device.";toast("Adventure saved.");}catch(e){toast(e instanceof Error?e.message:"Could not save progress.");}}
async function restore(){try{const data=await loadGame();if(!data)return;crystalsFound=data.crystals;experience=data.experience;const collected=new Set(data.collectedIds);crystals.forEach(c=>{if(collected.has(c.id)){c.mesh.isVisible=false;c.mesh.setEnabled(false);}});player.position.set(data.player.x,0,data.player.z);refreshUI();}catch{toast("A new adventure begins — local saves are unavailable.");}}
window.addEventListener("keydown",e=>{keys.add(e.key.toLowerCase());if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase()))e.preventDefault();if(e.key.toLowerCase()==="e")interact();if(e.key==="Escape")toggleMenu();});
window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
function interact(){const distance=Vector3.Distance(player.position,npc.position);if(distance<3.2){toast(crystalsFound>=3?"The Keeper: The island's light is yours to protect.":"The Keeper: Seek the glowing moon crystals. They remember the old magic.");return;}const nearbyVillager=villagers.find(v=>Vector3.Distance(player.position,v.root.position)<2.7);if(nearbyVillager){const lines=["Weaver: The old paths are safest in daylight.","Herbalist: Moon crystals carry the island's gentle light.","Guard: Keep exploring, traveler. The island has many secrets."];toast(lines[villagers.indexOf(nearbyVillager)]);return;}const near=crystals.find(c=>c.mesh.isVisible&&Vector3.Distance(player.position,c.mesh.position)<2.1);if(near){near.mesh.isVisible=false;near.mesh.setEnabled(false);crystalsFound++;experience+=40;refreshUI();toast("Moon crystal found! +40 XP");if(crystalsFound===3)toast("Quest complete! The island shines brighter.");void persist();return;}toast("Explore the island and look for glowing crystals.");}
function toggleMenu(){paused=!paused;$("menu-panel").classList.toggle("hidden",!paused);}
$("menu-button").addEventListener("click",toggleMenu);$("resume-button").addEventListener("click",toggleMenu);$("save-button").addEventListener("click",()=>void persist());$("sound-button").addEventListener("click",()=>{soundOn=!soundOn;$("sound-button").textContent="Sound: "+(soundOn?"On":"Off");toast("Sound setting updated.");});
$("interact-button").addEventListener("click",interact);$("jump-button").addEventListener("click",()=>{if(player.position.y<.05){player.position.y=.7;setTimeout(()=>player.position.y=0,360);}});
const joy=$("joystick");let joyPointer:number|null=null;joy.addEventListener("pointerdown",e=>{joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e);});joy.addEventListener("pointermove",e=>{if(e.pointerId===joyPointer)moveJoy(e);});const resetJoy=()=>{joyPointer=null;joystick={x:0,y:0};$("joystick-knob").style.transform="translate(0,0)";};joy.addEventListener("pointerup",resetJoy);joy.addEventListener("pointercancel",resetJoy);
function moveJoy(e:PointerEvent){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const len=Math.hypot(dx,dy),max=34;if(len>max){dx=dx/len*max;dy=dy/len*max;}joystick={x:dx/max,y:dy/max};$("joystick-knob").style.transform=`translate(${dx}px,${dy}px)`;}
let verticalVelocity=0;
scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(engine.getDeltaTime()/1000,.05);if(paused)return;
  const forward=(keys.has("w")||keys.has("arrowup")?-1:0)+(keys.has("s")||keys.has("arrowdown")?1:0)+joystick.y;
  const side=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0)+joystick.x;
  const direction=new Vector3(side,0,forward);if(direction.lengthSquared()>1)direction.normalize();
  const angle=camera.alpha;const move=new Vector3(direction.x*Math.cos(angle)-direction.z*Math.sin(angle),0,direction.x*Math.sin(angle)+direction.z*Math.cos(angle));
  const speed=5.2;player.position.addInPlace(move.scale(speed*dt));player.position.x=Math.max(-43,Math.min(43,player.position.x));player.position.z=Math.max(-43,Math.min(43,player.position.z));
  if(move.lengthSquared()>.001){player.rotation.y=Math.atan2(move.x,move.z);const stride=Math.sin(performance.now()*.012)*.48;playerRig.leftLeg.rotation.x=stride;playerRig.rightLeg.rotation.x=-stride;playerRig.leftArm.rotation.x=-stride*.55;playerRig.rightArm.rotation.x=stride*.55;body.scaling.y=1+Math.abs(stride)*.018;}else{playerRig.leftLeg.rotation.x*=.82;playerRig.rightLeg.rotation.x*=.82;playerRig.leftArm.rotation.x*=.82;playerRig.rightArm.rotation.x*=.82;}
  camera.target=Vector3.Lerp(camera.target,new Vector3(player.position.x,1.1,player.position.z),Math.min(1,dt*5));
  villagers.forEach((v,i)=>{v.root.rotation.y=Math.sin(performance.now()*.00045+i)*.16;});keeperRig.root.rotation.y=Math.sin(performance.now()*.00035)*.12;
  crystals.forEach((c,i)=>{if(c.mesh.isVisible){c.mesh.rotation.y+=dt*.8;c.mesh.position.y=.95+Math.sin(performance.now()*.002+i)*.16;}});
  if(performance.now()-lastToast>2600)$("toast").classList.remove("show");
  if(Vector3.DistanceSquared(player.position,new Vector3(lastPos.x,0,lastPos.z))>36){lastPos={x:player.position.x,z:player.position.z};}
});
await restore();engine.runRenderLoop(()=>scene.render());window.addEventListener("resize",()=>engine.resize());
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e as BeforeInstallPromptEvent;$("install-button").classList.remove("hidden");});
$("install-button").addEventListener("click",async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;$("install-button").classList.add("hidden");});
if("serviceWorker" in navigator)window.addEventListener("load",()=>{void navigator.serviceWorker.register("./sw.js").catch(()=>{});});
window.addEventListener("pagehide",()=>{const data:SaveData={version:1,crystals:crystalsFound,experience,collectedIds:crystals.filter(c=>!c.mesh.isVisible).map(c=>c.id),player:{x:player.position.x,z:player.position.z}};void saveGame(data).catch(()=>{});});
setTimeout(()=>{const loading=$("loading-screen");loading.style.opacity="0";setTimeout(()=>loading.remove(),750);toast("Welcome to the Shattered Isles. Find the moon crystals!");},900);
