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

const villageWall=makeMaterial("village-warm-stone",new Color3(.62,.48,.34));
const villageRoof=makeMaterial("village-terracotta",new Color3(.38,.19,.14));
const villageWood=makeMaterial("village-dark-wood",new Color3(.22,.13,.08));
const villageWindow=makeMaterial("village-window-glass",new Color3(.22,.48,.55));
const villagePath=makeMaterial("village-path",new Color3(.48,.43,.34));
function buildHouse(name:string,x:number,z:number,scale=1){
 const root=new TransformNode(name,scene);root.position.set(x,0,z);root.scaling.setAll(scale);
 const walls=MeshBuilder.CreateBox(name+"-walls",{width:4.2,height:3.1,depth:3.8},scene);walls.parent=root;walls.position.y=1.55;walls.material=villageWall;
 const roof=MeshBuilder.CreateCylinder(name+"-roof",{diameter:5.4,height:2.05,tessellation:4},scene);roof.parent=root;roof.position.y=3.85;roof.rotation.y=Math.PI/4;roof.material=villageRoof;
 const door=MeshBuilder.CreateBox(name+"-door",{width:.92,height:1.9,depth:.12},scene);door.parent=root;door.position.set(0,.95,-1.96);door.material=villageWood;
 for(const side of [-1,1]){const win=MeshBuilder.CreateBox(name+"-window",{width:.72,height:.82,depth:.1},scene);win.parent=root;win.position.set(side*1.35,1.95,-1.96);win.material=villageWindow;const cross=MeshBuilder.CreateBox(name+"-window-cross",{width:.08,height:.9,depth:.13},scene);cross.parent=root;cross.position.set(side*1.35,1.95,-2.03);cross.material=villageWood;}
 const chimney=MeshBuilder.CreateBox(name+"-chimney",{width:.48,height:1.25,depth:.48},scene);chimney.parent=root;chimney.position.set(1.25,4.1,.65);chimney.material=villageWall;
 const step=MeshBuilder.CreateBox(name+"-step",{width:1.5,height:.18,depth:.55},scene);step.parent=root;step.position.set(0,.09,-2.2);step.material=villagePath;
}
buildHouse("weavers-cottage",-9,-2,.95);
buildHouse("herbalists-home",9,-4,.9);
buildHouse("village-inn",-9,-11,1.08);
buildHouse("village-workshop",9,-12,.92);
const villageWell=MeshBuilder.CreateCylinder("village-well",{height:.85,diameter:2.2,tessellation:16},scene);villageWell.position.set(0,.42,-9);villageWell.material=villagePath;
const wellWater=MeshBuilder.CreateCylinder("well-water",{height:.08,diameter:1.65,tessellation:16},scene);wellWater.position.set(0,.86,-9);wellWater.material=waterMat;
for(const x of [-1.05,1.05]){const post=MeshBuilder.CreateCylinder("well-post",{height:2.3,diameter:.14},scene);post.position.set(x,1.25,-9);post.material=villageWood;}
const wellBeam=MeshBuilder.CreateBox("well-beam",{width:2.35,height:.16,depth:.18},scene);wellBeam.position.set(0,2.38,-9);wellBeam.material=villageWood;
for(let i=0;i<15;i++){const z=-2.5-i*.82;const stone=MeshBuilder.CreateCylinder("village-path-stone",{height:.08,diameter:1.05,tessellation:8},scene);stone.position.set(Math.sin(i*.7)*.48,.045,z);stone.material=villagePath;}
function makeLantern(x:number,z:number){const pole=MeshBuilder.CreateCylinder("lantern-post",{height:2.5,diameter:.12},scene);pole.position.set(x,1.25,z);pole.material=villageWood;const lamp=MeshBuilder.CreateBox("lantern-glass",{width:.48,height:.55,depth:.48},scene);lamp.position.set(x,2.62,z);lamp.material=crystalMat;const cap=MeshBuilder.CreateCylinder("lantern-cap",{height:.18,diameter:.68,tessellation:6},scene);cap.position.set(x,3,z);cap.material=goldMat;}
[[-3,-5],[3,-5],[-5,-13],[5,-13]].forEach(([x,z])=>makeLantern(x,z));
type WorldArea={id:string;name:string;center:Vector3;radius:number;discovered:boolean};
const worldAreas:WorldArea[]=[
 {id:"whispering-grove",name:"Whispering Grove",center:new Vector3(-25,0,18),radius:9,discovered:false},
 {id:"ember-ridge",name:"Ember Ridge",center:new Vector3(27,0,17),radius:9,discovered:false},
 {id:"frost-hollow",name:"Frost Hollow",center:new Vector3(-27,0,-22),radius:9,discovered:false}
];
const groveMat=makeMaterial("grove-moss",new Color3(.18,.34,.24));
const emberMat=makeMaterial("ember-stone",new Color3(.36,.19,.16));
const frostMat=makeMaterial("frost-crystal",new Color3(.48,.76,.86));
function buildAreaLandmarks(){
 const grove=worldAreas[0].center;
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7,x=grove.x+Math.cos(a)*5.5,z=grove.z+Math.sin(a)*5.5;const stump=MeshBuilder.CreateCylinder("grove-ancient-stump",{height:1.1,diameter:1.15,tessellation:8},scene);stump.position.set(x,.55,z);stump.material=groveMat;const canopy=MeshBuilder.CreateSphere("grove-canopy",{diameter:2.4,segments:8},scene);canopy.position.set(x,2,z);canopy.material=leafMats[i%leafMats.length];}
 const ember=worldAreas[1].center;
 for(let i=0;i<8;i++){const a=i*Math.PI*2/8,spire=MeshBuilder.CreatePolyhedron("ember-ridge-spire",{type:1,size:1.35+(i%3)*.25},scene);spire.position.set(ember.x+Math.cos(a)*6,1.1,ember.z+Math.sin(a)*6);spire.scaling.y=1.8;spire.material=emberMat;}
 const frost=worldAreas[2].center;
 for(let i=0;i<9;i++){const a=i*Math.PI*2/9,h=2.4+(i%3)*.65,shard=MeshBuilder.CreateCylinder("frost-hollow-spire",{height:h,diameterTop:.08,diameterBottom:.8,tessellation:6},scene);shard.position.set(frost.x+Math.cos(a)*5,h/2,frost.z+Math.sin(a)*5);shard.rotation.z=Math.sin(a)*.12;shard.material=frostMat;}
}
buildAreaLandmarks();
type AncientRelic={id:string;name:string;description:string;mesh:Mesh;areaId:string};
const ancientRelics:AncientRelic[]=[
 {id:"relic-grove",name:"Seed of the First Tree",description:"An ancient seed from the heart of the Whispering Grove.",mesh:MeshBuilder.CreatePolyhedron("grove-relic",{type:1,size:.62},scene),areaId:"whispering-grove"},
 {id:"relic-ember",name:"Emberheart",description:"A warm crystal recovered from Ember Ridge.",mesh:MeshBuilder.CreatePolyhedron("ember-relic",{type:1,size:.62},scene),areaId:"ember-ridge"},
 {id:"relic-frost",name:"Frost Memory",description:"A clear shard holding the memory of Frost Hollow.",mesh:MeshBuilder.CreatePolyhedron("frost-relic",{type:1,size:.62},scene),areaId:"frost-hollow"}
];
ancientRelics.forEach((relic,i)=>{const area=worldAreas.find(a=>a.id===relic.areaId)!;relic.mesh.position.set(area.center.x,.95,area.center.z);relic.mesh.material=i===1?goldMat:i===2?frostMat:crystalMat;});
let collectedRelicIds:string[]=[];
let discoveredAreaIds:string[]=[];



type ForestEnemy={id:string;root:TransformNode;home:Vector3;health:number;maxHealth:number;defeated:boolean;cooldown:number;phase:number;parts:Mesh[]};
const enemyMat=makeMaterial("sentinel-teal",new Color3(.23,.48,.43));
const enemyTrim=makeMaterial("sentinel-amber",new Color3(.79,.48,.19));
const enemySkin=makeMaterial("sentinel-skin",new Color3(.35,.58,.49));
const enemyEye=makeMaterial("sentinel-eyes",new Color3(.95,.72,.28));
function createForestEnemy(id:string,x:number,z:number):ForestEnemy{
 const root=new TransformNode(id,scene);root.position.set(x,0,z);
 const parts:Mesh[]=[];
 const torso=MeshBuilder.CreateCapsule(id+"-body",{height:1.35,radius:.43,tessellation:12},scene);torso.parent=root;torso.position.y=1.12;torso.material=enemyMat;parts.push(torso);
 const chest=MeshBuilder.CreateBox(id+"-chest-plate",{width:.72,height:.36,depth:.16},scene);chest.parent=root;chest.position.set(0,1.3,-.39);chest.material=enemyTrim;parts.push(chest);
 const head=MeshBuilder.CreateSphere(id+"-head",{diameter:.72,segments:16},scene);head.parent=root;head.position.y=2.02;head.material=enemySkin;parts.push(head);
 for(const side of [-1,1]){const eye=MeshBuilder.CreateSphere(id+"-eye",{diameter:.105,segments:8},scene);eye.parent=root;eye.position.set(side*.16,2.07,-.32);eye.material=enemyEye;parts.push(eye);
  const horn=MeshBuilder.CreateCylinder(id+"-crest",{height:.42,diameterTop:.015,diameterBottom:.18,tessellation:7},scene);horn.parent=root;horn.position.set(side*.27,2.43,.02);horn.rotation.z=side*-.35;horn.material=enemyTrim;parts.push(horn);
  const arm=MeshBuilder.CreateCapsule(id+"-arm",{height:.88,radius:.16,tessellation:10},scene);arm.parent=root;arm.position.set(side*.52,1.25,0);arm.rotation.z=side*-.18;arm.material=enemySkin;parts.push(arm);
  const leg=MeshBuilder.CreateCapsule(id+"-leg",{height:.72,radius:.18,tessellation:10},scene);leg.parent=root;leg.position.set(side*.2,.42,0);leg.material=enemyTrim;parts.push(leg);
 }
 const mark=MeshBuilder.CreateTorus(id+"-rune",{diameter:1.1,thickness:.045,tessellation:16},scene);mark.parent=root;mark.position.y=.12;mark.rotation.x=Math.PI/2;mark.material=enemyTrim;parts.push(mark);
 return {id,root,home:new Vector3(x,0,z),health:90,maxHealth:90,defeated:false,cooldown:0,phase:Math.random()*6,parts};
}
const enemies:ForestEnemy[]=[createForestEnemy("moss-sentinel-1",13,4),createForestEnemy("moss-sentinel-2",-15,10),createForestEnemy("moss-sentinel-3",20,-16)];
let playerHealth=100;
let playerAttackCooldown=0;
let enemyDefeatedIds:string[]=[];
function refreshCombatUI(){
 $("player-health-bar").style.width=Math.max(0,playerHealth)+"%";
 $("player-health-text").textContent=Math.max(0,playerHealth)+" / 100";
 const nearest=enemies.filter(e=>!e.defeated).sort((a,b)=>Vector3.DistanceSquared(player.position,a.root.position)-Vector3.DistanceSquared(player.position,b.root.position))[0];
 if(nearest&&Vector3.Distance(player.position,nearest.root.position)<13){
  $("enemy-status").textContent="حارس الغابة · "+nearest.health+" / "+nearest.maxHealth;
 }else{$("enemy-status").textContent="لا يوجد خصم قريب";}
}
function attackEnemy(){
 if(paused||playerAttackCooldown>0)return;
 playerAttackCooldown=.55;
 const target=enemies.filter(e=>!e.defeated&&Vector3.Distance(player.position,e.root.position)<3.5).sort((a,b)=>Vector3.DistanceSquared(player.position,a.root.position)-Vector3.DistanceSquared(player.position,b.root.position))[0];
 if(!target){toast("اقترب من حارس الغابة أولاً.");return;}
 target.health=Math.max(0,target.health-30);
 target.root.rotation.y=player.rotation.y+Math.PI;
 if(target.health===0){
  target.defeated=true;target.root.setEnabled(false);enemyDefeatedIds.push(target.id);experience+=120;addItem("sentinel-shard","بلورة الحارس","قطعة سحرية حصلت عليها بعد التحدي.");
  toast("تم اجتياز التحدي! +120 XP ومكافأة جديدة.");refreshUI();void persist();
 }else{toast("ضربة ناجحة! طاقة الحارس "+target.health+"/"+target.maxHealth);}
 refreshCombatUI();
}

const keys=new Set<string>();let joystick={x:0,y:0};let crystalsFound=0;let experience=0;let inventory:{id:string;name:string;description:string;quantity:number}[]=[];let villageTasks:string[]=[];let soundOn=true;let paused=false;let lastToast=0;let lastPos={x:0,z:0};let installPrompt:BeforeInstallPromptEvent|null=null;
interface BeforeInstallPromptEvent extends Event {prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>}
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const toast=(message:string)=>{const el=$("toast");el.textContent=message;el.classList.add("show");lastToast=performance.now();};
function refreshInventory(){const list=$("inventory-items");list.innerHTML="";$("inventory-empty").classList.toggle("hidden",inventory.length>0);inventory.forEach(item=>{const row=document.createElement("div");row.className="inventory-item";const glyph=document.createElement("span");glyph.className="inventory-glyph";glyph.textContent=item.id==="cloth"?"▤":item.id==="herbs"?"❀":"⚑";const info=document.createElement("div");const name=document.createElement("b");name.textContent=item.name;const desc=document.createElement("small");desc.textContent=item.description;info.append(name,desc);const count=document.createElement("strong");count.textContent="×"+item.quantity;row.append(glyph,info,count);list.append(row);});}
function addItem(id:string,name:string,description:string){const existing=inventory.find(item=>item.id===id);if(existing)existing.quantity++;else inventory.push({id,name,description,quantity:1});refreshInventory();}
function refreshUI(){ refreshInventory();$("crystal-count").textContent=String(crystalsFound);$("level-count").textContent=String(levelForExperience(experience));const helped=villageTasks;const relicCount=collectedRelicIds.length;if(crystalsFound<3){$("quest-progress-bar").style.width=questProgress(crystalsFound,3)+"%";$("quest-progress-text").textContent=" "+crystalsFound+" / 3 moon crystals";$("quest-title").textContent="A Light in the Forest";$("quest-description").textContent="Find 3 moon crystals scattered across the island.";}else if(helped.length<3){$("quest-progress-bar").style.width=questProgress(helped.length,3)+"%";$("quest-progress-text").textContent=helped.length+" / 3 villagers helped";$("quest-title").textContent="The Village Needs You";$("quest-description").textContent="Speak with the weaver, herbalist and guard to earn the village’s trust.";}else{$("quest-progress-bar").style.width=questProgress(relicCount,3)+"%";$("quest-progress-text").textContent=relicCount+" / 3 ancient relics";$("quest-title").textContent=relicCount>=3?"The Isles Remember":"The Three Ancient Relics";$("quest-description").textContent=relicCount>=3?"You have recovered the lost relics of all three regions.":"Explore Whispering Grove, Ember Ridge and Frost Hollow to recover their ancient relics.";}}
async function persist(){const data:SaveData={version:1,crystals:crystalsFound,experience,collectedIds:crystals.filter(c=>c.mesh.isVisible===false).map(c=>c.id),inventory,villageTasks,player:{x:player.position.x,z:player.position.z},enemyDefeatedIds,playerHealth,collectedRelicIds,discoveredAreaIds};try{await saveGame(data);$("save-status").textContent="Progress saved on this device.";toast("Adventure saved.");}catch(e){toast(e instanceof Error?e.message:"Could not save progress.");}}
async function restore(){try{const data=await loadGame();if(!data)return;crystalsFound=data.crystals;experience=data.experience;inventory=data.inventory??[];villageTasks=data.villageTasks??[];const collected=new Set(data.collectedIds);crystals.forEach(c=>{if(collected.has(c.id)){c.mesh.isVisible=false;c.mesh.setEnabled(false);}});collectedRelicIds=data.collectedRelicIds??[];ancientRelics.forEach(relic=>{if(collectedRelicIds.includes(relic.id))relic.mesh.setEnabled(false);});discoveredAreaIds=data.discoveredAreaIds??[];worldAreas.forEach(area=>{area.discovered=discoveredAreaIds.includes(area.id);});player.position.set(Math.max(-43,Math.min(43,data.player.x)),0,Math.max(-43,Math.min(43,data.player.z)));enemyDefeatedIds=data.enemyDefeatedIds??[];playerHealth=Math.max(1,Math.min(100,data.playerHealth??100));enemies.forEach(enemy=>{if(enemyDefeatedIds.includes(enemy.id)){enemy.defeated=true;enemy.root.setEnabled(false);}});refreshUI();refreshCombatUI();}catch{toast("A new adventure begins — local saves are unavailable.");}}
window.addEventListener("keydown",e=>{keys.add(e.key.toLowerCase());if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase()))e.preventDefault();if(e.key.toLowerCase()==="e")interact();if(e.key.toLowerCase()==="f")attackEnemy();if(e.key==="Escape")toggleMenu();});
window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
function interact(){const distance=Vector3.Distance(player.position,npc.position);if(distance<3.2){toast(crystalsFound>=3?"The Keeper: The island's light is yours to protect.":"The Keeper: Seek the glowing moon crystals. They remember the old magic.");return;}const nearbyVillager=villagers.find(v=>Vector3.Distance(player.position,v.root.position)<2.7);if(nearbyVillager){const index=villagers.indexOf(nearbyVillager);const lines=["Weaver: I have prepared a bundle of cloth for your journey.","Herbalist: These useful herbs may help you on the road.","Guard: The village is safe again. You have earned our trust."];const completed=villageTasks;if(!completed.includes(String(index))){completed.push(String(index));const rewards=[{id:"cloth",name:"Traveler’s Cloth",description:"A sturdy piece of woven cloth."},{id:"herbs",name:"Healing Herbs",description:"A bundle of useful island herbs."},{id:"village-token",name:"Village Token",description:"A token showing the villagers trust you."}];const reward=rewards[index];addItem(reward.id,reward.name,reward.description);experience+=60;toast(lines[index]+" +60 XP · Item received");refreshUI();void persist();}else{toast(["Weaver: May your clothes serve you well.","Herbalist: Travel safely, and remember to rest.","Guard: The village gates are open to you."][index]);}return;}const near=crystals.find(c=>c.mesh.isVisible&&Vector3.Distance(player.position,c.mesh.position)<2.1);if(near){near.mesh.isVisible=false;near.mesh.setEnabled(false);crystalsFound++;experience+=40;refreshUI();toast("Moon crystal found! +40 XP");if(crystalsFound===3)toast("Quest complete! The island shines brighter.");void persist();return;}const relic=ancientRelics.find(item=>item.mesh.isEnabled()&&Vector3.Distance(player.position,item.mesh.position)<2.6);if(relic){relic.mesh.setEnabled(false);collectedRelicIds.push(relic.id);experience+=180;addItem(relic.id,relic.name,relic.description);refreshUI();toast(relic.name+" recovered! +180 XP");void persist();return;}toast("Explore the island and look for glowing crystals or ancient relics.");}
function toggleMenu(){paused=!paused;$("menu-panel").classList.toggle("hidden",!paused);}
$("inventory-button").addEventListener("click",()=>{$("inventory-panel").classList.remove("hidden");});$("inventory-close").addEventListener("click",()=>$("inventory-panel").classList.add("hidden"));$("menu-button").addEventListener("click",toggleMenu);$("resume-button").addEventListener("click",toggleMenu);$("save-button").addEventListener("click",()=>void persist());$("sound-button").addEventListener("click",()=>{soundOn=!soundOn;$("sound-button").textContent="Sound: "+(soundOn?"On":"Off");toast("Sound setting updated.");});
$("interact-button").addEventListener("click",interact);$("attack-button").addEventListener("click",attackEnemy);$("jump-button").addEventListener("click",()=>{if(player.position.y<.05){player.position.y=.7;setTimeout(()=>player.position.y=0,360);}});
const joy=$("joystick");let joyPointer:number|null=null;joy.addEventListener("pointerdown",e=>{joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e);});joy.addEventListener("pointermove",e=>{if(e.pointerId===joyPointer)moveJoy(e);});const resetJoy=()=>{joyPointer=null;joystick={x:0,y:0};$("joystick-knob").style.transform="translate(0,0)";};joy.addEventListener("pointerup",resetJoy);joy.addEventListener("pointercancel",resetJoy);
function moveJoy(e:PointerEvent){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const len=Math.hypot(dx,dy),max=34;if(len>max){dx=dx/len*max;dy=dy/len*max;}joystick={x:dx/max,y:dy/max};$("joystick-knob").style.transform=`translate(${dx}px,${dy}px)`;}
let verticalVelocity=0;
scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(engine.getDeltaTime()/1000,.05);if(paused)return;playerAttackCooldown=Math.max(0,playerAttackCooldown-dt);
  const forward=(keys.has("w")||keys.has("arrowup")?-1:0)+(keys.has("s")||keys.has("arrowdown")?1:0)+joystick.y;
  const side=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0)+joystick.x;
  const direction=new Vector3(side,0,forward);if(direction.lengthSquared()>1)direction.normalize();
  const angle=camera.alpha;const move=new Vector3(direction.x*Math.cos(angle)-direction.z*Math.sin(angle),0,direction.x*Math.sin(angle)+direction.z*Math.cos(angle));
  const speed=5.2;player.position.addInPlace(move.scale(speed*dt));player.position.x=Math.max(-43,Math.min(43,player.position.x));player.position.z=Math.max(-43,Math.min(43,player.position.z));
  if(move.lengthSquared()>.001){player.rotation.y=Math.atan2(move.x,move.z);const stride=Math.sin(performance.now()*.012)*.48;playerRig.leftLeg.rotation.x=stride;playerRig.rightLeg.rotation.x=-stride;playerRig.leftArm.rotation.x=-stride*.55;playerRig.rightArm.rotation.x=stride*.55;body.scaling.y=1+Math.abs(stride)*.018;}else{playerRig.leftLeg.rotation.x*=.82;playerRig.rightLeg.rotation.x*=.82;playerRig.leftArm.rotation.x*=.82;playerRig.rightArm.rotation.x*=.82;}
  camera.target=Vector3.Lerp(camera.target,new Vector3(player.position.x,1.1,player.position.z),Math.min(1,dt*5));
  villagers.forEach((v,i)=>{v.root.rotation.y=Math.sin(performance.now()*.00045+i)*.16;});
  worldAreas.forEach(area=>{if(!area.discovered&&Vector3.Distance(player.position,area.center)<area.radius){area.discovered=true;discoveredAreaIds.push(area.id);toast("New region discovered: "+area.name);void persist();}});
  ancientRelics.forEach((relic,i)=>{if(relic.mesh.isEnabled()){relic.mesh.rotation.y+=dt*.7;relic.mesh.position.y=.95+Math.sin(performance.now()*.0018+i)*.13;}});

  enemies.forEach(enemy=>{
   if(enemy.defeated)return;
   enemy.cooldown=Math.max(0,enemy.cooldown-dt);
   const delta=player.position.subtract(enemy.root.position);delta.y=0;const distance=delta.length();
   if(distance<11&&distance>1.65){delta.normalize();enemy.root.position.addInPlace(delta.scale(1.65*dt));enemy.root.rotation.y=Math.atan2(delta.x,delta.z);}
   else if(distance<=1.65&&enemy.cooldown<=0){enemy.cooldown=1.35;playerHealth=Math.max(0,playerHealth-9);toast("حارس الغابة اقترب! انتبه لطاقة اللاعب.");if(playerHealth===0){playerHealth=100;player.position.set(0,0,1);toast("استعدت طاقتك وعدت إلى ساحة القرية.");}refreshCombatUI();void persist();}
   enemy.root.position.y=Math.sin(performance.now()*.002+enemy.phase)*.045;
   enemy.root.rotation.z=Math.sin(performance.now()*.0015+enemy.phase)*.035;
  });
  refreshCombatUI();
keeperRig.root.rotation.y=Math.sin(performance.now()*.00035)*.12;
  crystals.forEach((c,i)=>{if(c.mesh.isVisible){c.mesh.rotation.y+=dt*.8;c.mesh.position.y=.95+Math.sin(performance.now()*.002+i)*.16;}});
  if(performance.now()-lastToast>2600)$("toast").classList.remove("show");
  if(Vector3.DistanceSquared(player.position,new Vector3(lastPos.x,0,lastPos.z))>36){lastPos={x:player.position.x,z:player.position.z};}
});
await restore();engine.runRenderLoop(()=>scene.render());window.addEventListener("resize",()=>engine.resize());
const installButtons=[$("install-button"),$("install-top-button")];
const isStandalone=()=>window.matchMedia("(display-mode: standalone)").matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
function updateInstallButtons(){const visible=!!installPrompt&&!isStandalone();installButtons.forEach(button=>button.classList.toggle("hidden",!visible));}
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();installPrompt=event as BeforeInstallPromptEvent;updateInstallButtons();});
async function requestInstall(){if(!installPrompt||isStandalone())return;const promptEvent=installPrompt;installPrompt=null;updateInstallButtons();try{await promptEvent.prompt();const choice=await promptEvent.userChoice;if(choice.outcome==="accepted"){installButtons.forEach(button=>button.classList.add("hidden"));}else{updateInstallButtons();}}catch{updateInstallButtons();}}
installButtons.forEach(button=>button.addEventListener("click",()=>{void requestInstall();}));
window.addEventListener("appinstalled",()=>{installPrompt=null;installButtons.forEach(button=>button.classList.add("hidden"));});
const standaloneQuery=window.matchMedia("(display-mode: standalone)");standaloneQuery.addEventListener?.("change",updateInstallButtons);updateInstallButtons();
if("serviceWorker" in navigator)window.addEventListener("load",()=>{void navigator.serviceWorker.register("./sw.js").catch(()=>{});});
window.addEventListener("pagehide",()=>{const data:SaveData={version:1,crystals:crystalsFound,experience,collectedIds:crystals.filter(c=>!c.mesh.isVisible).map(c=>c.id),inventory,villageTasks,player:{x:player.position.x,z:player.position.z},enemyDefeatedIds,playerHealth,collectedRelicIds,discoveredAreaIds};void saveGame(data).catch(()=>{});});
setTimeout(()=>{const loading=$("loading-screen");loading.style.opacity="0";setTimeout(()=>loading.remove(),750);toast("Welcome to the Shattered Isles. Find the moon crystals!");},900);
