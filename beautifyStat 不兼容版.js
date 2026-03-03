window.StateBeautifyMod = {}

// === 数值存储 =================================

StateBeautifyMod.LastState = new Map()

StateBeautifyMod.LastSkills = {
    Skulduggery: null,
    Dancing: null,
    Swimming: null,
    Athletics: null,
    Tending: null,
    Housekeeping: null,
    Photography: null,
}

StateBeautifyMod.LastCorruption = null

StateBeautifyMod.LastSchoolPerformance = {
    Science: null,
    Maths: null,
    English: null,
    History: null,
}

StateBeautifyMod.LastRelationships = {}
StateBeautifyMod.LastRelationshipsProgress = {}

StateBeautifyMod.LastReputationWidth = {}


// === 注入 =====================================
$(document).on(":passagerender", function (ev) {StateBeautifyMod.onPassageRender(ev)});

StateBeautifyMod.onPassageRender = function (ev) {
    StateBeautifyMod.ev = ev;
    queueMicrotask(() => {
        StateBeautifyMod.LoadStats();
        StateBeautifyMod.CheckCoreCharacteristics();
        StateBeautifyMod.CheckSkills();
        StateBeautifyMod.CheckCorruption();
        StateBeautifyMod.CheckSexSkills();
        StateBeautifyMod.CheckWeaponSkills();
        StateBeautifyMod.CheckSchoolPerformances();
        StateBeautifyMod.CheckNPCs();
        StateBeautifyMod.CheckReputations();
        // StateBeautifyMod.LoadAvatar();
    })
};

StateBeautifyMod.GetDisplay = function() {
    let display = document.getElementById("characteristics-display-bs");
    if (!display) {
        display = Object.assign(document.createElement("div"), {
            id: "characteristics-display-bs",
            className: "characteristics-display-bs characteristics-display"
        });
        $(StateBeautifyMod.ev.content).append(display);
    };
    return display
}

// === 状态动态 =================================
StateBeautifyMod.LoadStats = function() {
    const stowed = document.getElementById("ui-bar").classList.contains("stowed")
    const stats = document.querySelectorAll('#statmeters > div');
    const mobileStats = document.querySelectorAll('#mobileStats .stat');

    stats.forEach(stat => {
        const stat_id = stat.id
        const stat_title = stat.title

        try {
            let meter = stat.querySelector(".meter")
            if (!meter) {
                console.log(`[状态美化错误] ${stat_id} 找不到meter: ${stat.getHTML()}`);
                return
            }
            let bar = meter.querySelector("div")
            const newclassname = bar? bar.className: '';
            const newWidth = bar? bar.style.width: '0%';
            let lastclassname = '';
            let lastWidth = '0%';
            if (StateBeautifyMod.LastState.has(stat_id)) {
                lastclassname = StateBeautifyMod.LastState.get(stat_id)[0];
                lastWidth = StateBeautifyMod.LastState.get(stat_id)[1];
            }

            // 没有bar了：可能是为值零，不显示了
            if (!bar) {
                const div = document.createElement("div")
                div.style.width = '0%'
                meter.append(div)
                bar = div
            }

            // 寻找移动stat
            const mobile_stat = mobileStats.find(i => {
                const mobile_stat = mobileStats[i]
                const span = mobile_stat.querySelector("mouse > span")
                if (span) {
                    return span.innerText === stat_title
                } else {
                    return false
                }
            })
            let mobile_stat_bar = null

            // 创建移动stat条（如果有）
            if (mobile_stat) {
                const div_meter = document.createElement("div")
                div_meter.className = "meter"
                const div = document.createElement("div")
                div.className = newclassname
                div.style.width = bar.style.width
                div_meter.append(div)
                mobile_stat.append(div_meter)
                mobile_stat_bar = div

                if (stowed) {
                    bar = mobile_stat_bar
                }
            }
            
            //  动态更改
            if (lastWidth !== newWidth) {
                bar.style.transition = 'none';
                bar.className = lastclassname
                bar.style.width = lastWidth;

                bar.offsetHeight;
                
                bar.style.transition = '';
                bar.className = newclassname
                bar.style.width = newWidth;
            }

            StateBeautifyMod.LastState.set(stat_id, [newclassname, newWidth]);
        } catch (err)  {
            console.log(`[状态美化错误] ${stat_id} ${err}:  ${stat.getHTML()}`);
        }
    })
};

// === 特征动态 =================================
StateBeautifyMod.LoadCharacteristics = function(id, config, percentLast) {
    const display = StateBeautifyMod.GetDisplay();
    let list = display.querySelector(`#characteristic-box-bs-list-${id}`);
    if (!list) {
        list = Object.assign(document.createElement("div"), {
            id: `characteristic-box-bs-list-${id}`,
            className: "characteristic-box-bs characteristic-box-list"
        });
        display.append(list);
    };

    T.config = config;
    new Wikifier(list, `<<characteristic-box _config>>`);
    const characteristic_boxes = list.querySelectorAll(".characteristic-box");
    const characteristic_box = characteristic_boxes[characteristic_boxes.length - 1];
    const bar = characteristic_box.querySelector(".meter > div");

    if (percentLast) {
        const widthnew = bar.style.width;
        bar.style.transition = 'none';
        bar.style.width = Math.floor(percentLast) + "%";
        
        bar.offsetHeight;
        
        bar.style.transition = '';
        ((bar, widthnew) => setTimeout(() => {bar.style.width = widthnew}, 400))(bar, widthnew);
    };

    return [characteristic_box, bar]
}
StateBeautifyMod.LoadCharacteristicFinish = function(id, delay) {
    let list = document.querySelector(`#characteristic-box-bs-list-${id}`);
    if (list) {
        setTimeout(() => {
            list.classList.add("BS-hide")
            setTimeout(() => list.remove(), 800)
        }, delay+800)
    }
}

// === 技能动态 =================================
StateBeautifyMod.detailedSkillGrades = [
    { requiredValue: 0,		level: "None",	color: 'red'},
    { requiredValue: 1,		level: "F",		color: 'pink'},
    { requiredValue: 100,	level: "F+",	color: 'pink'},
    { requiredValue: 200,	level: "D",		color: 'purple'},
    { requiredValue: 300,	level: "D+",	color: 'purple'},
    { requiredValue: 400,	level: "C",		color: 'blue'},
    { requiredValue: 500,	level: "C+",	color: 'blue'},
    { requiredValue: 600,	level: "B",		color: 'lblue'},
    { requiredValue: 700,	level: "B+",	color: 'lblue'},
    { requiredValue: 800,	level: "A",		color: 'teal'},
    { requiredValue: 900,	level: "A+",	color: 'teal'},
    { requiredValue: 1000,	level: "S",		color: 'green'}
];
StateBeautifyMod.basicSkillGrades = [
    { requiredValue: 0,		level: "None",	color: 'red'},
    { requiredValue: 1,		level: "F",		color: 'pink'},
    { requiredValue: 200,	level: "D",		color: 'purple'},
    { requiredValue: 400,	level: "C",		color: 'blue'},
    { requiredValue: 600,	level: "B",		color: 'lblue'},
    { requiredValue: 800,	level: "A",		color: 'teal'},
    { requiredValue: 1000,	level: "S",		color: 'green'}
];
StateBeautifyMod.GetCurrentLevel = function(currentValue, states) {
    let currentLevel = 0
    for (let index = 0; index < states.length; index++) {
        if (currentValue >= states[index].requiredValue) {
            currentLevel = index
        }
    }
    return currentLevel
}
StateBeautifyMod.CheckSkill = function(name, cn_name, currentValue, id, grade=StateBeautifyMod.detailedSkillGrades) {
    if (currentValue) {
        const config = { 
            name : name, 
            cn_name: cn_name,
            displayType : "grade",	
            currentValue : currentValue,		
            modifier: 100, 
            modTypes: { good: [], bad: [] },		
            states : grade
        }
        const valueNew = config.currentValue
        const valueLast = StateBeautifyMod.LastSkills[name]
        if (!valueLast) {
            StateBeautifyMod.LastSkills[name] = valueNew
        } else if (valueNew !== valueLast) {
            StateBeautifyMod.LastSkills[name] = valueNew
            const currentLevel = StateBeautifyMod.GetCurrentLevel(valueLast, grade)
            const requiredValue = grade[currentLevel].requiredValue
            let requiredValueNext = grade[currentLevel+1]?.requiredValue
            if (!requiredValueNext) {
                requiredValueNext = requiredValue + 1
            }
            const percent = (valueLast - requiredValue) / (requiredValueNext - requiredValue) * 100
            StateBeautifyMod.LoadCharacteristics(id, config, percent)
            StateBeautifyMod.LoadCharacteristicFinish(id, 500)
        }
    }
}
StateBeautifyMod.CheckSkills = function () {
    StateBeautifyMod.CheckSkill("Skulduggery", "诡术", V.skulduggery, "Skills")
    StateBeautifyMod.CheckSkill("Dancing", "舞蹈", V.danceskill, "Skills")
    StateBeautifyMod.CheckSkill("Swimming", "游泳", V.swimmingskill, "Skills")
    StateBeautifyMod.CheckSkill("Athletics", "运动", V.athletics, "Skills")
    StateBeautifyMod.CheckSkill("Tending", "护理", V.tending, "Skills")
    StateBeautifyMod.CheckSkill("Housekeeping", "家务", V.housekeeping, "Skills")
    StateBeautifyMod.CheckSkill("Photography", "摄影", V.Phone.photography, "Skills")
}
StateBeautifyMod.CheckCorruption = function () {
    const config = { 
        name : "Corruption",
        cn_name: "堕落",	
        displayType : "none",	
        currentValue : V.earSlime.corruption,	
        modifier: 100, 
        modTypes: { good: [], bad: [] },		
        meterColor: V.earSlime.startedThreats ? "purple" : "blue", 
        secondValue: V.earSlime.growth / 2, 
        secondMeterColor: "red"
    }
    const valueNew = config.currentValue
    const valueLast = StateBeautifyMod.LastCorruption
    if (!valueLast) {
        StateBeautifyMod.LastCorruption = config.currentValue
    } else if (valueNew !== valueLast) {
        StateBeautifyMod.LastCorruption = config.currentValue
        StateBeautifyMod.LoadCharacteristics("Corruption", config, valueLast)
        StateBeautifyMod.LoadCharacteristicFinish("Corruption", 500)
    }
}
// === 性技能动态 ===============================
StateBeautifyMod.CheckSexSkills = function () {
    StateBeautifyMod.CheckSkill("Seduction", "魅惑", V.seductionskill, "SexSkills")
    StateBeautifyMod.CheckSkill("Oral", "口部", V.oralskill, "SexSkills")
    StateBeautifyMod.CheckSkill("Chest", "胸部", V.chestskill, "SexSkills")
    StateBeautifyMod.CheckSkill("Hands", "手部", V.handskill, "SexSkills")
    StateBeautifyMod.CheckSkill("Buttocks", "臀部", V.bottomskill, "SexSkills")
    StateBeautifyMod.CheckSkill("Anal", "后庭", V.analskill, "SexSkills")
    StateBeautifyMod.CheckSkill("Thighs", "大腿", V.thighskill, "SexSkills")
    StateBeautifyMod.CheckSkill("Feet", "足部", V.feetskill, "SexSkills")
    if (V.player.penisExist) {
        StateBeautifyMod.CheckSkill("Penile", "阴茎", V.penileskill, "SexSkills")
    } else {
        StateBeautifyMod.CheckSkill("Strap-on use", "穿戴式假阴茎", V.penileskill, "SexSkills")
    }
    if (V.player.vaginaExist) {
        StateBeautifyMod.CheckSkill("Vaginal", "小穴", V.vaginalskill, "SexSkills")
    }
}
// === 武器技能动态 =============================
StateBeautifyMod.CheckWeaponSkills = function () {
    StateBeautifyMod.CheckSkill("Sprays", "防狼喷雾", V.prof.spray, "WeaponSkills", StateBeautifyMod.basicSkillGrades)
    StateBeautifyMod.CheckSkill("Nets", "捕网", V.prof.net, "WeaponSkills", StateBeautifyMod.basicSkillGrades)
    StateBeautifyMod.CheckSkill("Batons", "短棍", V.prof.baton, "WeaponSkills", StateBeautifyMod.basicSkillGrades)
    StateBeautifyMod.CheckSkill("Whips", "鞭子", V.prof.whip, "WeaponSkills", StateBeautifyMod.basicSkillGrades)
}
// === 核心属性动态 =============================
StateBeautifyMod.CheckCoreCharacteristic = function(name, cn_name, icon, currentValue, maxValue, states) {
    const config = { 
        name : name,
        cn_name: cn_name,
        icon : icon,
        displayType : "level",
        currentValue : currentValue,
        maxValue: maxValue,
        modifier: 100,
        modTypes: { good: [], bad: [] },
        states : states
    }
    const valueNew = config.currentValue;
    const valueLast = StateBeautifyMod.LastSkills[name];
    if (!valueLast) {
        StateBeautifyMod.LastSkills[name] = valueNew
    } else if (valueNew !== valueLast) {
        StateBeautifyMod.LastSkills[name] = valueNew
        const currentLevel = StateBeautifyMod.GetCurrentLevel(valueLast, states)
        const requiredValue = states[currentLevel].requiredValue
        let requiredValueNext = states[currentLevel+1]?.requiredValue
        if (!requiredValueNext) {
            requiredValueNext = requiredValue + 1
        }
        const percent = (valueLast - requiredValue) / (requiredValueNext - requiredValue) * 100
        const [characteristic_box, bar] = StateBeautifyMod.LoadCharacteristics("CoreCharacteristics", config, percent)
        characteristic_box.classList.add("characteristic-box-bs-stretch")
        StateBeautifyMod.LoadCharacteristicFinish("CoreCharacteristics", 500)
    }
};
StateBeautifyMod.CheckCoreCharacteristics = function () {
    let _purityIcon = "ui/tf_angel"
    if (V.demon >= 6) {
        _purityIcon = 'ui/tf_demon'
    } else if (V.fallenangel >= 2) {
        _purityIcon = 'ui/tf_fallenangel'
    };
    StateBeautifyMod.CheckCoreCharacteristic("Purity", "纯洁", _purityIcon, V.purity, 1000, [
        { requiredValue: 0,		level: 0, color: 'red',		description: '你的存在本身就是亵渎。'},
        { requiredValue: 1,		level: 1, color: 'red',		description: '你的灵魂已经彻底堕落。'},
        { requiredValue: 500,	level: 2, color: 'pink',	description: '你的灵魂已经污秽不堪。'},
        { requiredValue: 600,	level: 3, color: 'purple',	description: '你的灵魂已被污染到一定程度。'},
        { requiredValue: 700,	level: 4, color: 'blue',	description: '你的灵魂遭到了污损。'},
        { requiredValue: 800,	level: 5, color: 'lblue',	description: '你遭到了轻微的污损。'},
        { requiredValue: 900,	level: 6, color: 'teal',	description: "你并不是纯洁无瑕的。"},
        { requiredValue: 1000,	level: 7, color: 'green',	description: '你如天使般圣洁无瑕。'}
    ]);
    StateBeautifyMod.CheckCoreCharacteristic("Awareness", "意识", "ui/sym_awareness", V.awareness, 1000, [
        { requiredValue: -200,	level: 0, color: 'green',	description: '你像白纸般单纯。'},
        { requiredValue: 1,		level: 1, color: 'teal',	description: '你基本上是单纯的。'},
        { requiredValue: 100,	level: 2, color: 'lblue',	description: '你对性一知半解。'},
        { requiredValue: 200,	level: 3, color: 'blue',	description: '你对性有基础的了解。'},
        { requiredValue: 300,	level: 4, color: 'purple',	description: '你对性有了更深层次的理解。'},
        { requiredValue: 400,	level: 5, color: 'pink',	description: '你比其他人见得更多，也知道得更多。'},
        { requiredValue: 500,	level: 6, color: 'red',		description: '你凝视着堕落的深渊。'},
        { requiredValue: 1000,	level: 7, color: 'red',		description: '你对性的理解已经超然于世。'}
    ]);
    StateBeautifyMod.CheckCoreCharacteristic("Physique", "体能", "ui/sym_physique", V.physique, V.physiquesize, [
        { requiredValue:	0,							level: 0, color: 'red',		description: `你${V.player.bodyshape === "soft" ? "营养不良" : "弱不禁风"}。`},
        { requiredValue:	V.physiquesize / 7,			level: 1, color: 'pink',	description: `你的身体${V.player.bodyshape === "soft" ? "娇软" : "羸弱无力"}。`},
        { requiredValue:	(V.physiquesize / 7) * 2,	level: 2, color: 'purple',	description: `你的身体${V.player.bodyshape === "soft" ? "娇软柔韧" : "灵活苗条"}。`},
        { requiredValue:	(V.physiquesize / 7) * 3,	level: 3, color: 'blue',	description: `你的身体${V.player.bodyshape === "soft" ? "结实" : "苗条"}。`},
        { requiredValue:	(V.physiquesize / 7) * 4,	level: 4, color: 'lblue',	description: `你的身体${V.player.bodyshape === "soft" ? "强健" : "苗条"}且健美。`},
        { requiredValue:	(V.physiquesize / 7) * 5,	level: 5, color: 'teal',	description: `你的身体${V.player.bodyshape === "soft" ? "结实" : "健康"}且强健。`},
        { requiredValue:	(V.physiquesize / 7) * 6,	level: 6, color: 'green',	description: `你的身体${V.player.bodyshape === "soft" ? "结实" : "健康"}且有力。`}
    ]);
    StateBeautifyMod.CheckCoreCharacteristic("Willpower", "意志", "ui/sym_trauma", V.willpower, V.willpowermax, [
        { requiredValue:	0,						level: 0, color: 'red',		description: '你胆小如鼠。'},
        { requiredValue:	V.willpowermax / 7,		level: 1, color: 'pink',	description: '你懦弱不堪。'},
        { requiredValue:	(V.willpowermax / 7) * 2,	level: 2, color: 'purple',	description: '你优柔寡断。'},
        { requiredValue:	(V.willpowermax / 7) * 3,	level: 3, color: 'blue',	description: '你沉着谨慎。'},
        { requiredValue:	(V.willpowermax / 7) * 4,	level: 4, color: 'lblue',	description: '你意志顽强。'},
        { requiredValue:	(V.willpowermax / 7) * 5,	level: 5, color: 'teal',	description: '你颇为坚韧。'},
        { requiredValue:	(V.willpowermax / 7) * 6,	level: 6, color: 'green',	description: '你志坚如钢。'}
    ]);
    StateBeautifyMod.CheckCoreCharacteristic("Beauty", "容貌", "ui/sym_beauty", V.beauty, V.beautymax, [
        { requiredValue:	0,						level: 0, color: 'red',		description: '你毫不起眼。'},
        { requiredValue:	V.beautymax / 7,			level: 1, color: 'pink',	description: '你非常可爱。'},
        { requiredValue:	(V.beautymax / 7) * 2,	level: 2, color: 'purple',	description: '你非常漂亮。'},
        { requiredValue:	(V.beautymax / 7) * 3,	level: 3, color: 'blue',	description: '你充满魅力。'},
        { requiredValue:	(V.beautymax / 7) * 4,	level: 4, color: 'lblue',	description: '你美貌异常。'},
        { requiredValue:	(V.beautymax / 7) * 5,	level: 5, color: 'teal',	description: '你令人着迷。'},
        { requiredValue:	(V.beautymax / 7) * 6,	level: 6, color: 'green',	description: '你的容貌惊为天人。'}
    ]);
    StateBeautifyMod.CheckCoreCharacteristic("Promiscuity", "淫乱度", "ui/sym_lust", V.promiscuity, 100, [
        { requiredValue: 0,		level: 0, color: 'green',	description: '你天真无邪。'},
        { requiredValue: 1,		level: 1, color: 'teal',	description: '你十分拘谨。'},
        { requiredValue: 15,	level: 2, color: 'lblue',	description: '你对性相关的事十分好奇。'},
        { requiredValue: 35,	level: 3, color: 'blue',	description: '对性接触的幻想令你感到兴奋。'},
        { requiredValue: 55,	level: 4, color: 'purple',	description: '你极其渴望着性接触。'},
        { requiredValue: 75,	level: 5, color: 'pink',	description: '你放荡不羁。'},
        { requiredValue: 95,	level: 6, color: 'red',		description: '你对性的渴望无法满足。'}
    ]);
    StateBeautifyMod.CheckCoreCharacteristic("Exhibitionism", "露出癖", "ui/sym_exhibitionism", V.exhibitionism, 100, [
        { requiredValue: 0,		level: 0, color: 'green',	description: '你十分腼腆。'},
        { requiredValue: 1,		level: 1, color: 'teal',	description: '你有些害羞。'},
        { requiredValue: 15,	level: 2, color: 'lblue',	description: '你乐于展露风光。'},
        { requiredValue: 35,	level: 3, color: 'blue',	description: '你享受旁人下流的注视。'},
        { requiredValue: 55,	level: 4, color: 'purple',	description: '暴露的感觉让你兴奋不已。'},
        { requiredValue: 75,	level: 5, color: 'pink',	description: '你不知羞耻。'},
        { requiredValue: 95,	level: 6, color: 'red',		description: '暴露的幻想令你欲火焚身。'}
    ]);
    StateBeautifyMod.CheckCoreCharacteristic("Deviancy", "异种癖", "ui/sym_deviancy", V.deviancy, 100, [
        { requiredValue: 0,		level: 0, color: 'green',	description: '你的癖好完全正常。'},
        { requiredValue: 1,		level: 1, color: 'teal',	description: '你很保守。'},
        { requiredValue: 15,	level: 2, color: 'lblue',	description: '你的口味有些独特。'},
        { requiredValue: 35,	level: 3, color: 'blue',	description: '你的癖好骇人听闻。'},
        { requiredValue: 55,	level: 4, color: 'purple',	description: '你的欲望惊世骇俗。'},
        { requiredValue: 75,	level: 5, color: 'pink',	description: "你渴望着常人无法想象的行为。"},
        { requiredValue: 95,	level: 6, color: 'red',		description: '你的淫欲简直难以启齿。'}
    ]);
}

// === 成绩动态 =================================
StateBeautifyMod.schoolGradeStates = [
    { requiredValue: -1,	level: 'F',		color: 'red'},
    { requiredValue: 0,		level: 'D',		color: 'purple'},
    { requiredValue: 1,		level: 'C',		color: 'blue'},
    { requiredValue: 2,		level: 'B',		color: 'lblue'},
    { requiredValue: 3,		level: 'A',		color: 'teal'},
    { requiredValue: 4,		level: 'A*',	color: 'green'}
];
StateBeautifyMod.CheckSchoolPerformances = function () {
    StateBeautifyMod.CheckSchoolPerformance('Science', '科学', 'misc/icon/science', V.sciencetrait, V.science_exam,  V.science_star)
    StateBeautifyMod.CheckSchoolPerformance('Maths', '数学', 'misc/icon/math', V.mathstrait, V.maths_exam,  V.maths_star)
    StateBeautifyMod.CheckSchoolPerformance('English', '语文', 'misc/icon/english', V.englishtrait, V.english_exam,  V.english_star)
    StateBeautifyMod.CheckSchoolPerformance('History', '历史', 'misc/icon/history', V.historytrait, V.history_exam,  V.history_star)
}
StateBeautifyMod.CheckSchoolPerformance = function(name, cn_name, icon, currentValue, percent, starLevel) {
    const config = { 
        name : name, 
        cn_name : cn_name, 
        icon : icon, 
        displayType : "grade",	
        currentValue : currentValue,	
        modifier: 100, 
        modTypes: { good: [], bad: [] },	
        percent: percent,		
        showStars: true, 
        starLevel: starLevel,	
        states : StateBeautifyMod.schoolGradeStates
    };
    const percentNew = config.percent
    const percentLast = StateBeautifyMod.LastSchoolPerformance[name]
    if (!percentLast) {
        StateBeautifyMod.LastSchoolPerformance[name] = percentNew
    } else if (percentNew !== percentLast) {
        StateBeautifyMod.LastSchoolPerformance[name] = percentNew

        const [characteristic_box, bar] = StateBeautifyMod.LoadCharacteristics("SchoolPerformance", config, percentLast)

        const stars = characteristic_box.querySelectorAll(".progress-stars > img")
        for (let index = 0; index < stars.length; index++) {
            const star = stars[index];
            star.style.transition = 'none';
            star.style.opacity = 0;
            star.style.scale = 1.5;
            star.offsetHeight;
            star.style.transition = '';
            (star => setTimeout(() => {star.style.opacity = 1; star.style.scale = 1;}, 200 * index))(star);
        }

        StateBeautifyMod.LoadCharacteristicFinish("SchoolPerformance", stars.length*200 + 500)
    }
}

// === 角色动态 =================================
StateBeautifyMod.LoadRelationships = function(id, index, progressesLast) {
    const display = StateBeautifyMod.GetDisplay();

    let list = display.querySelector(`#npc-relations-bs-list-${id}`);
    if (!list) {
        list = Object.assign(document.createElement("div"), {
            id: `npc-relations-bs-list-${id}`,
            className: "relation-box-bs relation-box-list"
        });
        display.append(list);
    };

    T.k = index;
    new Wikifier(list, `<<relation-box _npcs[_k] _npcConfig[_npcs[_k].nam]>>`);
    const relation_boxes = list.querySelectorAll(".relation-box");
    const relation_box = relation_boxes[relation_boxes.length - 1];
    const relation_stat_blocks = relation_box.querySelectorAll(".relation-stat-list > .relation-stat-block")
    const progressesNew = {}
    for (let index = 0; index < relation_stat_blocks.length; index++) {
        const relation_stat_block = relation_stat_blocks[index];
        let key = relation_stat_block.querySelector("label")?.innerText
        if (!key) {
            key = relation_stat_block.querySelector(".relation-stat > .relation-stat-name")?.innerText
        }
        if (key) {
            const progressnew = relation_stat_block.style.getPropertyValue('--progress');
            progressesNew[key] = progressnew
            if (progressesLast) {
                const icon = relation_stat_block.querySelector(".relation-stat > .relation-stat-icon > .active-icon-img")
                icon.style.transition = 'none';
                relation_stat_block.style.setProperty('--progress', progressesLast[key])
                
                icon.offsetHeight;
                
                icon.style.transition = '';
                ((relation_stat_block, progressnew) => setTimeout(() => {relation_stat_block.style.setProperty('--progress', progressnew)}, 400))(relation_stat_block, progressnew);
            }
        }
    };

    return [relation_box, progressesNew]
}
StateBeautifyMod.LoadRelationshipsFinish = function(id, delay) {
    let list = document.querySelector(`#npc-relations-bs-list-${id}`);
    if (list) {
        setTimeout(() => {
            list.classList.add("BS-hide")
            setTimeout(() => list.remove(), 800)
        }, delay+800)
    }
}
StateBeautifyMod.GetNPCs = function() {  // 来自原版代码
    if (V.wolfpackharmony) C.npc["Black Wolf"].harmony = V.wolfpackharmony;
    if (V.wolfpackferocity) C.npc["Black Wolf"].ferocity = V.wolfpackferocity;
    /*data config for non-standard NPCs boxes, allows for different stat configs, custom display data, and dynamic requirements*/
    T.npcConfig = {
        "Robin" : {
            important : true,
            dom : { name : "Confidence", activeIcon : "img/ui/sym_confidence.png", color: "blue" }
        },
        "Whitney" : {
            important : true,
            love : { maxValue : 30 },
            dom : { maxValue: 20 }
        },
        "Eden" : {
            important : true,
            love : { maxValue: 200 },
            dom : { maxValue: 150 } /*false always hides this stat*/
        },
        "Kylar" : {
            important : true,
            rage : { name : "Jealousy", activeIcon : "img/ui/sym_jealousy.png", color: "green" }
        },
        "Avery" : {
            important : true,
            rage : { requirements : V.averyragerevealed, inactiveIcon : 'img/ui/sym_rage_empty.png', }
        },
        "Great Hawk" : {
            important : true,
        },
        "Black Wolf" : {
            important : true,
            love : { maxValue : 30 },
            harmony : { name : "Wolf Pack Harmony", maxValue: 20, activeIcon : "img/ui/wolfharmony.png" },
            ferocity : { name : "Wolf Pack Ferocity", maxValue: 20, activeIcon : "img/ui/wolfferocity.png" }
        },
        "Sydney" : {
            important : true,
            love : { maxValue: 150 },
            purity : { requirements : V.NPCName[28].purity > 0, maxValue : 100, minValue : 0 },
            corruption : { requirements : V.NPCName[28].corruption > 0, maxValue : 50, minValue : 0 }
        },
        "Alex" : {
            important : true,
            love : { maxValue : 100 },
            lust : { maxValue : 100 },
            dom : { maxValue : 100 }
        },
        "Gwylan" : {
            important: V.gwylanSeen?.includes("yearning"),
            love : { maxValue : (getSpecialSets(sets => sets.shop.includes("forest")).length * 2),
                    activeIcon: V.gwylanSeen?.includes("yearning") ? "img/ui/sym_love_green.png" : "img/ui/sym_love.png",
                    color: 'green' },
            dom : { name : "Yearning", activeIcon : "img/ui/sym_yearning.png", requirements : V.gwylanSeen?.includes("yearning"), maxValue : 150, color: 'forest-green' }
        },

        "Mason" : {
            love : { maxValue : 50 }
        },
        "Darryl" : {
            love : { maxValue : 50 }
        },
        "River" : {
            love : { maxValue : 50 }
        },
        "Sam" : {
            love : { maxValue : 50 }
        },
        "Charlie" : {
            love : { maxValue : 50 }
        },
        "Wren" : {
            love : { maxValue : 50 }
        },
        "Zephyr" : {
            love : { maxValue : 100 },
            dom : { maxValue : 50 }
        },
        "Ivory Wraith" : {
            lust : { name: "Obsession", activeIcon : (V.wraith && (V.wraith.state == "haunt" || V.wraith.state == "despair") ? "img/ui/obsessionblood.png" : "img/ui/obsession.png"), inactiveIcon : "img/ui/obsessionempty.png", maxValue : 20 }
        }
    };

    /* This list dictates the order that the important NPCs will show up in on the social menu screen */
    T.importantNpcOrder = ["Robin", "Whitney", "Eden", "Kylar", "Sydney", "Avery", "Great Hawk", "Black Wolf", "Alex"];
    if (V.gwylanSeen?.includes("yearning")) T.importantNpcOrder.pushUnique("Gwylan");
    T.specialNPCs = ["Ivory Wraith"];

    /* this list is sorted */
    T.importantNPCs = T.importantNpcOrder.map(name => V.NPCName[V.NPCNameList.indexOf(name)]);

    /* this list is unsorted */
    T.otherNPCs = V.NPCName.filter(npc => !T.importantNpcOrder.includes(npc.nam) && !T.specialNPCs.includes(npc.nam));

    /* sorting takes the lower value and puts it first, so if a < b, a goes first. */
    /* yes, this works on words, somehow. it's math shit, but it works. read a book if necessary. */
    T.otherNPCs.sort((a,b) => a.nam - b.nam);
};
StateBeautifyMod.CheckNPCs = function() {
    StateBeautifyMod.GetNPCs();
    T.npcs = [...T.importantNPCs, ...T.otherNPCs, ...T.specialNPCs];
    for (let i = 0; i < T.npcs.length; i++) {
        const npc = T.npcs[i];
        if (setup.loveAlias[npc.nam]) {
            const statDefaults = {
                "love" : {
                    name : setup.loveAlias[npc.nam](),
                    value : npc.love,
                    activeIcon : 'img/ui/sym_love.png',
                    inactiveIcon: 'img/ui/emptyheart.png',
                    color: 'red'
                },
                "lust" : {
                    name : "Lust",
                    value : npc.lust,
                    iconOrientation : 'vertical',
                    activeIcon : 'img/ui/sym_lust.png',
                    inactiveIcon : 'img/ui/emptyvial.png',
                    color: 'pink'
                },
                "dom" : {
                    name : "Dominance",
                    value : npc.dom,
                    activeIcon : "img/ui/sym_dominance.png",
                    color: 'purple'
                },
                "trauma" : {
                    name : "Trauma",
                    value : npc.trauma,
                    activeIcon : "img/ui/sym_trauma.png",
                    color: 'teal'
                },
                "rage" : {
                    name : "Rage",
                    value : npc.rage,
                    activeIcon : "img/ui/sym_rage.png",
                    color: 'gold'
                },
                "purity" : {
                    name: "Purity",
                    value: npc.purity,
                    activeIcon: (npc.virginity.vaginal == false || npc.virginity.penile == false ? "img/ui/tf_fallenangel.png" : "img/ui/tf_angel.png"),
                    color: 'white'
                },
                "corruption" : {
                    name: "Corruption",
                    value: npc.corruption,
                    iconOrientation : 'horizontal-inverted',
                    activeIcon: "img/ui/tf_demon.png",
                    color: 'purple'
                },
                "harmony" : {
                    name: "Harmony",
                    value: V.wolfpackharmony,
                    iconOrientation : 'vertical',
                    activeIcon: "img/ui/wolfharmony.png",
                    color: 'purple'
                },
                "ferocity" : {
                    name: "ferocity",
                    value: V.wolfpackferocity,
                    iconOrientation : 'vertical',
                    activeIcon: "img/ui/wolfferocity.png",
                    color: 'purple'
                }
            };
            const nam = npc.nam;
            const keys = Object.keys(statDefaults);
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                const newRelationship = npc[key];
                if (newRelationship) {
                    const lastRelationship = StateBeautifyMod.LastRelationships[nam+key];
                    if (lastRelationship) {
                        if (lastRelationship !== newRelationship) {
                            const progressesLast = StateBeautifyMod.LastRelationshipsProgress[nam]
                            const [relation_box, progressesNew] = StateBeautifyMod.LoadRelationships("importantNPCs", i, progressesLast);
                            StateBeautifyMod.LastRelationshipsProgress[nam] = progressesNew
                            break
                        }
                    }
                }
            }
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                const newRelationship = npc[key];
                if (newRelationship) {
                    StateBeautifyMod.LastRelationships[nam+key] = newRelationship;
                };
            }
        }
    };
    StateBeautifyMod.LoadRelationshipsFinish("importantNPCs", 500)
};

// === 名誉动态 =================================
StateBeautifyMod.LoadReputations = function(id, config, widthLast) {
    const display = StateBeautifyMod.GetDisplay();
    let list = display.querySelector(`#characteristic-box-bs-list-${id}`);
    if (!list) {
        list = Object.assign(document.createElement("div"), {
            id: `characteristic-box-bs-list-${id}`,
            className: "characteristic-box-bs relation-box-list"
        });
        display.append(list);
    };

    T.config = config;
    new Wikifier(list, `<<relation-box-simple _config>>`);
    const relation_boxes = list.querySelectorAll(".relation-box");
    const relation_box = relation_boxes[relation_boxes.length - 1];

    const bar = relation_box.querySelector(".relation-description > .meter > div");
    const widthNew = bar?.style.width;

    if (widthLast && widthNew) {
        bar.style.transition = 'none';
        bar.style.width = widthLast;
        
        bar.offsetHeight;
        
        bar.style.transition = '';
        ((bar, widthNew) => setTimeout(() => {bar.style.width = widthNew}, 400))(bar, widthNew);
    };

    return [relation_box, widthNew]
}
StateBeautifyMod.CheckReputation = function(name, config) {
    const valueNew = config.currentValue;
    const valueLast = StateBeautifyMod.LastSkills[name];
    if (!valueLast) {
        StateBeautifyMod.LastSkills[name] = valueNew
    } else if (valueNew !== valueLast) {
        StateBeautifyMod.LastSkills[name] = valueNew
        const [relation_box, widthNew] = StateBeautifyMod.LoadReputations("Reputation", config, StateBeautifyMod.LastReputationWidth[name])
        StateBeautifyMod.LastReputationWidth[name] = widthNew
        relation_box.classList.add("characteristic-box-bs-stretch")
        StateBeautifyMod.LoadCharacteristicFinish("Reputation", 500)
    }
};
StateBeautifyMod.CheckReputations = function () {
    T.policeCrimeConfig = { currentValue : crimeSumHistory(), preText: '警方', states : [
        { requiredValue: 0,		color: 'green',		description: '认为你无关紧要，'},
        { requiredValue: 1000,	color: 'teal',		description: '的报告里出现了你的名字，'},
        { requiredValue: 2000,	color: 'lblue',		description: '认为你有犯罪嫌疑，'},
        { requiredValue: 3000,	color: 'blue',		description: '认为你是一个不安分子，'},
        { requiredValue: 5000,	color: 'purple',	description: '认定你就是一个罪犯，'},
        { requiredValue: 10000,	color: 'pink',		description: '为你建立了专用犯罪资料集，'},
        { requiredValue: 30000,	color: 'red',		description: '有整个档案柜装满了你的犯罪记录，'}
    ]}
    T.policeEvidenceConfig = { currentValue : crimeSumHistory(), secondaryValue : crimeSumCurrent(), states : [
        { requiredValue: 0, secondaryStates : [
            { requiredValue: 0,	color: 'green',	description: '也没有任何证据表明你与犯罪有关。'},
            { requiredValue: 1,	color: 'teal',	description: '尽管有零星的证据将你与犯罪关联。'},
        ]},
        { requiredValue: 1000, secondaryStates : [
            { requiredValue: 0,		color: 'green',	description: '但缺乏足够证据来实施逮捕。'},
            { requiredValue: 1000,	color: 'pink',	description: '同时有充分证据来实施逮捕。'},
            { requiredValue: 5000,	color: 'red',	description: '并掌握远超实施逮捕所需的证据量。'},
        ]}
    ]}
    StateBeautifyMod.CheckReputation("Police", { name : "警察局", currentValue : crimeSumHistory(), icon : "img/misc/icon/police.png", description: "<<relation-text _policeCrimeConfig>> <<relation-text _policeEvidenceConfig>>"})

    T.orphanageMoodConfig = { currentValue: V.orphan_hope, secondaryValue: V.orphan_reb, preText: '孤儿院的整体氛围是', states : [
        { requiredValue: -100, secondaryStates : [
            { requiredValue: -100,	color: 'pink',	description: '绝望的。'},
            { requiredValue: -40,	color: 'pink',	description: '萎靡的。'},
            { requiredValue: -10,	color: 'pink',	description: '低落的。'},
            { requiredValue: 10,	color: 'pink',	description: '愤怒的。'},
            { requiredValue: 40,	color: 'def',	description: '渴望复仇的。'},
        ]},
        { requiredValue: -40, secondaryStates : [
            { requiredValue: -100,	color: 'purple',	description: '颓废的。'},
            { requiredValue: -40,	color: 'purple',	description: '阴郁的。'},
            { requiredValue: -10,	color: 'purple',	description: '屈从的。'},
            { requiredValue: 10,	color: 'purple',	description: '忤逆的。'},
            { requiredValue: 40,	color: 'def',		description: '我行我素的。'},
        ]},
        { requiredValue: -10, secondaryStates : [
            { requiredValue: -100,	color: 'blue',	description: '俯首的。'},
            { requiredValue: -40,	color: 'blue',	description: '顺从的。'},
            { requiredValue: -10,	color: 'blue',	description: '平静的。'},
            { requiredValue: 10,	color: 'blue',	description: '躁动的。'},
            { requiredValue: 40,	color: 'def',	description: '惹是生非的。'},
        ]},
        { requiredValue: 10, secondaryStates : [
            { requiredValue: -100,	color: 'teal',	description: '隐忍的。'},
            { requiredValue: -40,	color: 'teal',	description: '服从的。'},
            { requiredValue: -10,	color: 'teal',	description: '乐观的。'},
            { requiredValue: 10,	color: 'teal',	description: '桀骜不驯的。'},
            { requiredValue: 40,	color: 'def',	description: '揭竿而起的。'},
        ]},
        { requiredValue: 40, secondaryStates : [
            { requiredValue: -100,	color: 'green',	description: '温顺的。'},
            { requiredValue: -40,	color: 'green',	description: '友好的。'},
            { requiredValue: -10,	color: 'green',	description: '满怀希望的。'},
            { requiredValue: 10,	color: 'green',	description: '理想主义的。'},
            { requiredValue: 40,	color: 'def',	description: '革命性的。'},
        ]},
    ]}
    StateBeautifyMod.CheckReputation("Orphanage", { name : "孤儿院", currentValue : V.orphan_hope+V.orphan_reb, icon : "img/misc/icon/orphanage.png", description: "<<relation-text _orphanageMoodConfig>>"})


    T.teacherRepConfig = { currentValue: V.delinquency, preText: '老师们把你视作', postText: '', states : [
        { requiredValue: 0,		color: 'green',		description: '模范学生。'},
        { requiredValue: 10,	color: 'teal',		description: '普通学生。'},
        { requiredValue: 200,	color: 'lblue',		description: '品行不端的学生。'},
        { requiredValue: 400,	color: 'blue',		description: '屡教不改的学生。'},
        { requiredValue: 600,	color: 'purple',	description: '学风差劲的学生。'},
        { requiredValue: 800,	color: 'pink',		description: '无法无天的学生。'},
        { requiredValue: 1000,	color: 'red',		description: '学校里的害群之马。'}
    ]}
    T.studentRepConfig = { currentValue: V.cool, preText: '你的同学认为你', states : [
        { requiredValue: 0,		color: 'red',		preText: '你的同学', description: '对你避之不及。'},
        { requiredValue: 40,	color: 'pink',		description: '非常怪异。'},
        { requiredValue: 80,	color: 'purple',	description: '呆头呆脑。'},
        { requiredValue: 120,	color: 'blue',		description: '还行。'},
        { requiredValue: 160,	color: 'lblue',		description: '很酷。'},
        { requiredValue: 240,	color: 'teal',		description: '与众不同。'},
        { requiredValue: 400,	color: 'green',		preText: '你的同学', description: '渴望与你待在一起。'}
    ]}
    StateBeautifyMod.CheckReputation("Teachers", { name : "教师", currentValue : V.delinquency, icon : "img/misc/icon/school.png", description: "<<relation-text _teacherRepConfig>> <<statbar 0 $delinquency 1000>>"})
    StateBeautifyMod.CheckReputation("Students", { name : "学校", currentValue : V.cool, icon : "img/misc/icon/schoolnew.png", description: "<<relation-text _studentRepConfig>> <<statbarinverted $cool $coolmax>>"})
}

// === 知名度动态 ===============================
StateBeautifyMod.CheckFames = function() {
    T.fameStates = [
        { requiredValue: 0,		color: 'green',		description: ' 默默无闻'},
        { requiredValue: 30,	color: 'teal',		description: ' 鲜为人知'},
        { requiredValue: 100,	color: 'lblue',		description: ' 崭露头角'},
        { requiredValue: 200,	color: 'blue',		description: ' 小有名气'},
        { requiredValue: 400,	color: 'purple',	description: ' 引人瞩目'},
        { requiredValue: 600,	color: 'pink',		description: ' 家喻户晓'},
        { requiredValue: 1000,	color: 'red',		description: ' 声名狼藉的_config.flavorText'}
    ]
    T.inverseFameStates = [
        { requiredValue: 0,		color: 'red',		description: ' 默默无闻'},
        { requiredValue: 30,	color: 'pink',		description: ' 鲜为人知'},
        { requiredValue: 100,	color: 'purple',	description: ' 崭露头角'},
        { requiredValue: 200,	color: 'blue',		description: ' 小有名气'},
        { requiredValue: 400,	color: 'lblue',		description: ' 引人瞩目'},
        { requiredValue: 600,	color: 'teal',		description: ' 家喻户晓'},
        { requiredValue: 1000,	color: 'green',		description: ' 声名远扬的_config.flavorText'}
    ]
    T.sexFameConfig = {currentValue: $fame.sex, preText: '淫乱：', lavorText: '婊子', states: _fameStates}
    T.prostitutionFameConfig = {currentValue: $fame.prostitution, preText: '卖淫：', lavorText: '娼妓', states: _fameStates}
    T.rapeFameConfig = {currentValue: $fame.rape, preText: '强暴：', lavorText: '肉便器', states: _fameStates}
    StateBeautifyMod.CheckReputation("sexFame", { description : '<<relation-text _sexFameConfig>>' })
}

// === 头像（废弃） =============================
StateBeautifyMod.LoadAvatar = function() {
    const div_avatar = document.createElement("div")
    div_avatar.id = "avatar-container"
    console.log(div_avatar);
    
    div_avatar.className = "avatar"
    document.querySelector('#story').append(div_avatar)

    const canvas = document.createElement("canvas")
    canvas.id = "avatar"
    div_avatar.append("canvas")
};
