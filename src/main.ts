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
const player = new TransformNode("player",scene);
const body = MeshBuilder.CreateCapsule("traveler",{height:1.8,radius:.38},scene);body.parent=player;body.position.y=.9;
const bodyMat = new StandardMaterial("traveler-cloak",scene);bodyMat.diffuseColor=new Color3(.28,.31,.55);body.material=bodyMat;
const head = MeshBuilder.CreateSphere("traveler-head",{diameter:.48,segments:16},scene);head.parent=player;head.position.y=1.95;
const headMat = new StandardMaterial("traveler-face",scene);headMat.diffuseColor=new Color3(.84,.68,.52);head.material=headMat;
const cape = MeshBuilder.CreateBox("traveler-cape",{width:.62,height:.9,depth:.12},scene);cape.parent=player;cape.position.set(0,1.08,.28);cape.rotation.x=-.12;cape.material=goldMat;
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
const npc=MeshBuilder.CreateCapsule("keeper",{height:1.7,radius:.35},scene);npc.position.set(2,.85,-3);const npcMat=new StandardMaterial("keeper-robe",scene);npcMat.diffuseColor=new Color3(.64,.48,.25);npc.material=npcMat;
const npcHead=MeshBuilder.CreateSphere("keeper-head",{diameter:.42},scene);npcHead.position.set(2,1.8,-3);npcHead.material=headMat;
const keys=new Set<string>();let joystick={x:0,y:0};let crystalsFound=0;let experience=0;let soundOn=true;let paused=false;let lastToast=0;let lastPos={x:0,z:0};let installPrompt:BeforeInstallPromptEvent|null=null;
interface BeforeInstallPromptEvent extends Event {prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>}
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const toast=(message:string)=>{const el=$("toast");el.textContent=message;el.classList.add("show");lastToast=performance.now();};
function refreshUI(){ $("crystal-count").textContent=String(crystalsFound);$("level-count").textContent=String(levelForExperience(experience));$("quest-progress-bar").style.width=questProgress(crystalsFound,3)+"%";$("quest-progress-text").textContent=crystalsFound>=3?"Quest complete!":" "+crystalsFound+" / 3 moon crystals";if(crystalsFound>=3){$("quest-title").textContent="The Isles Remember";$("quest-description").textContent="You have restored a little light to the island. Explore freely!";}}
async function persist(){const data:SaveData={version:1,crystals:crystalsFound,experience,collectedIds:crystals.filter(c=>c.mesh.isVisible===false).map(c=>c.id),player:{x:player.position.x,z:player.position.z}};try{await saveGame(data);$("save-status").textContent="Progress saved on this device.";toast("Adventure saved.");}catch(e){toast(e instanceof Error?e.message:"Could not save progress.");}}
async function restore(){try{const data=await loadGame();if(!data)return;crystalsFound=data.crystals;experience=data.experience;const collected=new Set(data.collectedIds);crystals.forEach(c=>{if(collected.has(c.id)){c.mesh.isVisible=false;c.mesh.setEnabled(false);}});player.position.set(data.player.x,0,data.player.z);refreshUI();}catch{toast("A new adventure begins — local saves are unavailable.");}}
window.addEventListener("keydown",e=>{keys.add(e.key.toLowerCase());if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase()))e.preventDefault();if(e.key.toLowerCase()==="e")interact();if(e.key==="Escape")toggleMenu();});
window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
function interact(){const distance=Vector3.Distance(player.position,npc.position);if(distance<3.2){toast(crystalsFound>=3?"The Keeper: The island's light is yours to protect.":"The Keeper: Seek the glowing moon crystals. They remember the old magic.");return;}const near=crystals.find(c=>c.mesh.isVisible&&Vector3.Distance(player.position,c.mesh.position)<2.1);if(near){near.mesh.isVisible=false;near.mesh.setEnabled(false);crystalsFound++;experience+=40;refreshUI();toast("Moon crystal found! +40 XP");if(crystalsFound===3)toast("Quest complete! The island shines brighter.");void persist();return;}toast("Explore the island and look for glowing crystals.");}
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
  if(move.lengthSquared()>.001){player.rotation.y=Math.atan2(move.x,move.z);body.scaling.y=1+Math.sin(performance.now()*.012)*.018;}
  camera.target=Vector3.Lerp(camera.target,new Vector3(player.position.x,1.1,player.position.z),Math.min(1,dt*5));
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
