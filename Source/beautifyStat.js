window.StateBeautifyMod = {}

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

$(document).on(":passagerender", function (ev) {StateBeautifyMod.onPassageRender(ev)});

StateBeautifyMod.onPassageRender = function (ev) {
    StateBeautifyMod.ev = ev;
    queueMicrotask(() => {
        StateBeautifyMod.LoadStats();
        StateBeautifyMod.CheckSkills();
        StateBeautifyMod.CheckCorruption();
        StateBeautifyMod.CheckSexSkills();
        StateBeautifyMod.CheckSchoolPerformances();
        // StateBeautifyMod.LoadAvatar();
    })
};


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
    let display = document.getElementById("characteristics-display-bs");
    if (!display) {
        display = Object.assign(document.createElement("div"), {
            id: "characteristics-display-bs",
            className: "characteristics-display-bs characteristics-display"
        });
        $(StateBeautifyMod.ev.content).append(display);
    };

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
    let list = document.getElementById(`characteristic-box-bs-list-${id}`);
    setTimeout(() => {
        list.classList.add("BS-hide")
        setTimeout(() => list.remove(), 800)
    }, delay+800)
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
StateBeautifyMod.GetCurrentLevel = function(currentValue, states) {
    let currentLevel = 0
    for (let index = 0; index < states.length; index++) {
        if (currentValue >= states[index].requiredValue) {
            currentLevel = index
        }
    }
    return currentLevel
}
StateBeautifyMod.CheckSkill = function(name, cn_name, currentValue, id) {
    if (currentValue) {
        const config = { 
            name : name, 
            cn_name: cn_name,
            displayType : "grade",	
            currentValue : currentValue,		
            modifier: 100, 
            modTypes: { good: [], bad: [] },		
            states : StateBeautifyMod.detailedSkillGrades
        }
        const valueNew = config.currentValue
        const valueLast = StateBeautifyMod.LastSkills[name]
        if (!valueLast) {
            StateBeautifyMod.LastSkills[name] = valueNew
        } else if (valueNew !== valueLast) {
            StateBeautifyMod.LastSkills[name] = valueNew
            const currentLevel = StateBeautifyMod.GetCurrentLevel(valueLast, StateBeautifyMod.detailedSkillGrades)
            const requiredValue = StateBeautifyMod.detailedSkillGrades[currentLevel].requiredValue
            const percent = valueLast - requiredValue
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
