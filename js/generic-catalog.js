/* Generic design defaults, not measured commercial products. One catalog source. */
(function(root){
const groups=[
  {cat:'卧室', items:[
    ['bed','双人床 1.8m',1800,2000,'#c9d6df',1100],['bed','双人床 1.5m',1500,2000,'#d8c7dc',1100],['bed','单人床',1200,2000,'#e8d5b5',1100],
    ['crib','婴儿床',1250,700,'#efe3d0',950],['nightstand','床头柜',450,400,'#e8dccb',500],['wardrobe','衣柜',2000,600,'#efe6d8',2200],
    ['wardrobe','小衣柜',1200,550,'#efe6d8',2200],['dresser','梳妆台',1000,450,'#efe6d8',750],['desk','书桌',1200,600,'#e2cfb4',750],
    ['chair','椅子',450,480,'#cfc6b8',850],['bookshelf','书架',800,300,'#e2cfb4',1800],['baycushion','飘窗垫',520,1800,'#e7dccd',80]]},
  {cat:'客厅', items:[
    ['sofa','三人沙发',2400,900,'#b7c4b0',850],['sofa','双人沙发',1700,880,'#c3cbd6',850],['cornersofa','转角沙发',2800,1700,'#b7c4b0',850],
    ['armchair','单人沙发',850,850,'#d6b99a',900],['beanbag','懒人沙发',800,800,'#e0b98f',800],['coffeetable','茶几',1300,650,'#e8dccb',400],
    ['sidetable','边几',500,500,'#d9c3a3',550],['tvstand','电视柜',2400,400,'#e2cfb4',450],['rug','地毯',2400,1700,'#d9cbb8',15],
    ['shoecab','鞋柜',1000,350,'#efe6d8',1000],['shoecab','玄关柜',1400,380,'#e6dccc',1000],['floorlamp','落地灯',450,450,'#3d3a34',1700],
    ['plant','绿植',500,500,'#a9c39b',1000],['plant','大绿植',700,700,'#9dbb8c',1000]]},
  {cat:'餐厨', items:[
    ['table','餐桌',1400,800,'#e2cfb4',750],['table','六人餐桌',1800,900,'#d8c2a2',750],['roundtable','圆桌',1000,1000,'#e2cfb4',750],
    ['chair','餐椅',450,480,'#cfc6b8',850],['island','岛台',1800,900,'#e9e5de',900],['barstool','吧椅',420,420,'#6b5d4c',1000],
    ['counter','橱柜台面',1600,600,'#e9e5de',900],['stove','燃气灶',750,450,'#dcdcdc',100],['ksink','水槽',800,450,'#e1e6ea',200],
    ['fridge','冰箱',700,700,'#dfe4e8',1800],['cabinet','餐边柜',1600,400,'#efe6d8',1200]]},
  {cat:'卫浴', items:[
    ['toilet','马桶',400,700,'#ffffff',750],['vanity','浴室柜',800,500,'#eef1f3',850],['vanity','双盆浴室柜',1200,500,'#eef1f3',850],
    ['shower','淋浴房',900,900,'#e4edf2',2100],['bathtub','浴缸',1600,750,'#eef3f6',600],['washer','洗衣机',600,600,'#e6ebee',850],
    ['waterheater','电热水器',800,450,'#f4f4f2',450],['cabinet','储物柜',1000,400,'#efe6d8',1200]]},
  {cat:'家电', items:[
    ['tv','65 寸电视',1450,80,'#1d1d1f',850],['tv','55 寸电视',1230,80,'#1d1d1f',850],['fridge','对开门冰箱',910,700,'#c9ced3',1800],
    ['aircon','柜机空调',500,380,'#f6f7f8',1800],['acwall','挂机空调',900,250,'#f6f7f8',300],['dishwasher','洗碗机',600,600,'#c9ced3',850],
    ['ovencol','蒸烤箱高柜',600,600,'#efe6d8',2200],['dryer','烘干机',600,600,'#e6ebee',850],['purifier','空气净化器',400,300,'#f4f4f2',700]]},
  {cat:'书房 · 休闲', items:[
    ['desk','长书桌',1600,700,'#d8c2a2',750],['officechair','办公椅',620,620,'#4a4f55',1100],['bookshelf','大书架',1600,350,'#e2cfb4',1800],
    ['piano','立式钢琴',1500,600,'#1f1d1b',1200],['treadmill','跑步机',800,1800,'#3a3a3c',1400],['armchair','阅读椅',750,800,'#c9a98a',900]]},
];
const heights={"bed": 1100, "crib": 950, "nightstand": 500, "wardrobe": 2200, "dresser": 750, "desk": 750, "chair": 850, "bookshelf": 1800, "baycushion": 80, "sofa": 850, "cornersofa": 850, "armchair": 900, "beanbag": 800, "coffeetable": 400, "sidetable": 550, "tvstand": 450, "rug": 15, "shoecab": 1000, "floorlamp": 1700, "plant": 1000, "table": 750, "roundtable": 750, "island": 900, "barstool": 1000, "counter": 900, "stove": 100, "ksink": 200, "fridge": 1800, "cabinet": 1200, "toilet": 750, "vanity": 850, "shower": 2100, "bathtub": 600, "washer": 850, "waterheater": 450, "tv": 850, "aircon": 1800, "acwall": 300, "dishwasher": 850, "ovencol": 2200, "dryer": 850, "purifier": 700, "officechair": 1100, "piano": 1200, "treadmill": 1400};
for(const group of groups)for(const item of group.items){if(item.length!==6||![item[2],item[3],item[5]].every(v=>Number.isSafeInteger(v)&&v>0&&v<=10000))throw Error("Invalid generic dimensions");Object.freeze(item);}
const api={groups,heights:Object.freeze(heights)};if(typeof module==="object")module.exports=api;else root.FloorPlanGenericCatalog=api;
})(globalThis);
