window.StateBeautifyMod = {}

// === 数值存储 =================================
StateBeautifyMod.First = true;
StateBeautifyMod.Finish = [];
StateBeautifyMod.DisplayFold = {};
StateBeautifyMod.DisplayFoldMax = 5;
StateBeautifyMod.DisplayFoldClose = false;
StateBeautifyMod.LastMoney = null;
StateBeautifyMod.LastState = new Map();
StateBeautifyMod.LastRelations = {};
StateBeautifyMod.LastCharacteristics = {};


// === 注入 =====================================
$(document).on(":passagerender", function (ev) {StateBeautifyMod.onPassageRender(ev)});
StateBeautifyMod.onPassageRender = function (ev) {
    StateBeautifyMod.ev = ev;
    StateBeautifyMod.DisplayFold = {};
    StateBeautifyMod.DisplayFoldClose = false;
    queueMicrotask(() => {
        StateBeautifyMod.LoadMoney();
        StateBeautifyMod.LoadStats();
        setTimeout(() => {
            StateBeautifyMod.LoadSocial();
            StateBeautifyMod.LoadCharacteristics();
            StateBeautifyMod.First = false;
            StateBeautifyMod.LoadFoldedDisplay();
        }, 20);
        // StateBeautifyMod.CheckCoreCharacteristics();
        // StateBeautifyMod.CheckSkills();
        // StateBeautifyMod.CheckCorruption();
        // StateBeautifyMod.CheckSexSkills();
        // StateBeautifyMod.CheckWeaponSkills();
        // StateBeautifyMod.CheckSchoolPerformances();
        // StateBeautifyMod.CheckNPCs();
        // StateBeautifyMod.CheckReputations();
        // StateBeautifyMod.LoadAvatar();
    })
};

// === 金钱动态 =================================
StateBeautifyMod.animateMoneyChange = function(lastMoney, newMoney, relMoneyAbs, isPositive) {
    const relElement = document.getElementById('relmoney');
    const nowElement = document.getElementById('nowmoney');
    
    if (!relElement || !nowElement) return;
    
    const startTime = performance.now();
    const duration = 1000; // 1秒
    
    // 转换为数字
    const startNow = parseFloat(lastMoney);
    const endNow = parseFloat(newMoney);
    const startRel = parseFloat(relMoneyAbs);
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数让动画更自然
        const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        
        // 计算当前值
        const currentRel = startRel * (1 - easeProgress);
        const currentNow = startNow + (endNow - startNow) * easeProgress;
        
        // 更新显示
        if (progress < 1) {
            // relmoney 逐渐减少到0
            if (startRel > 0) {
                relElement.textContent = `£ ${isPositive ? '+' : '-'}${currentRel.toFixed(2)}`;
            }
            
            // nowmoney 逐渐变化
            nowElement.textContent = `£ ${currentNow.toFixed(2)}`;
            
            requestAnimationFrame(animate);
        } else {
            // 动画结束，设置为最终值
            relElement.textContent = `£ ${isPositive ? '+' : '-'}0.00`;
            nowElement.textContent = `£ ${newMoney}`;
        }
    };
    
    requestAnimationFrame(animate);
};
StateBeautifyMod.LoadMoney = function() {
    const newMoney = (V.money / 100).toFixed(2);
    const lastMoney = StateBeautifyMod.LastMoney ? (StateBeautifyMod.LastMoney / 100).toFixed(2) : null;
    
    if (lastMoney && newMoney !== lastMoney) {
        const relMoney = (parseFloat(newMoney) - parseFloat(lastMoney)).toFixed(2);
        const relMoneyAbs = Math.abs(relMoney).toFixed(2);
        const isPositive = relMoney >= 0;
        
        const list = StateBeautifyMod.GetList("money", "money-box-list");
        list.innerHTML = `
        <div>
            <span>转账</span>
            <span id="relmoney">£ ${isPositive ? '+' : '-'}${relMoneyAbs}</span>
        </div>
        <div id="barmoney"></div>
        <div>
            <span></span>
            <span id="nowmoney">£ ${lastMoney}</span>
        </div>
        `;
        
        // 启动动画
        setTimeout(() => {
            this.animateMoneyChange(lastMoney, newMoney, relMoneyAbs, isPositive);
        }, 1000);

        StateBeautifyMod.FinishList("money", 2000);
    }
    StateBeautifyMod.LastMoney = V.money;
};

// === 状态动态 =================================
StateBeautifyMod.LoadStats = function() {
    const stowed = document.getElementById("ui-bar").classList.contains("stowed")
    const stats = document.querySelectorAll('#statmeters > div');
    const mobileStats = document.querySelectorAll('#mobileStats .stat');

    stats.forEach(stat => {
        const stat_id = stat.id
        let stat_title = stat.title

        stat_title = stat_title.replace("醉意", "醉酒")  // 单独适配醉意
        stat_title = stat_title.replace("药物", "麻醉")  // 单独适配药物

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

// === 隐藏属性动态 =============================
StateBeautifyMod.GetDisplay = function() {
    let display = document.getElementById("display-bs");
    if (!display) {
        display = Object.assign(document.createElement("div"), {
            id: "display-bs",
            className: "display-bs characteristics-display"
        });
        $(StateBeautifyMod.ev.content).append(display);
    };
    return display
};
StateBeautifyMod.GetList = function(id, class_) {
    const display = StateBeautifyMod.GetDisplay();
    let list = null;
    if (id) {
        list = display.querySelector(`#box-bs-list-${id}`);
        if (!list) {
            list = document.createElement("div");
            list.id = `box-bs-list-${id}`;
        };
    } else {
        list = document.createElement("div");
    }
    list.className = "BS-hide box-bs "+class_;
    (list => setTimeout(() => {list.classList.remove("BS-hide")}, 100))(list);
    display.append(list);
    return list
};
StateBeautifyMod.FinishList = function(id, delay) {
    let list = document.querySelector(`#box-bs-list-${id}`);
    StateBeautifyMod.Finish.push(id);
    if (list) {
        setTimeout(() => {
            if (StateBeautifyMod.Finish.includes(id)) {
                list.classList.add("BS-hide");
                setTimeout(() => list.remove(), 800);
                StateBeautifyMod.Finish.splice(StateBeautifyMod.Finish.indexOf(id), 1);
            }
        }, delay+800);
    };
};
StateBeautifyMod.CancelFinishList = function(id) {
    if (StateBeautifyMod.Finish.includes(id)) {
        StateBeautifyMod.Finish.splice(StateBeautifyMod.Finish.indexOf(id), 1);
    }
};
StateBeautifyMod.applyTransition = function(oldElement, newElement) {
    // 递归比较两个元素的子节点
    const compareAndAnimate = (oldNode, newNode) => {
        if (!oldNode || !newNode || oldNode.nodeType !== 1 || newNode.nodeType !== 1) return;
        
        // 获取旧元素的所有内联样式
        if (oldNode.style && newNode.style) {
            const oldStyle = oldNode.style;
            const newStyle = newNode.style;
            
            // 如果有内联样式，先设置为旧值，然后过渡到新值
            if (oldStyle.length > 0 || newStyle.length > 0) {
                // 保存新元素的原始内联样式
                const originalStyles = {};
                for (let i = 0; i < newStyle.length; i++) {
                    const prop = newStyle[i];
                    originalStyles[prop] = newStyle.getPropertyValue(prop);
                }
                newNode.style.transition = "none";
                // 将新元素的内联样式设置为旧元素的值
                for (let i = 0; i < oldStyle.length; i++) {
                    const prop = oldStyle[i];
                    const value = oldStyle.getPropertyValue(prop);
                    newNode.style.setProperty(prop, value);
                }
                newNode.style.transition = "";
                // 恢复为新样式，触发过渡
                ((newNode, originalStyles) => setTimeout(() => {
                    for (const [prop, value] of Object.entries(originalStyles)) {
                        console.log(prop, value);
                        
                        newNode.style.setProperty(prop, value);
                    }
                }, 400))(newNode, originalStyles);
            }
        }
        
        // 递归比较子节点
        const oldChildren = oldNode.children;
        const newChildren = newNode.children;
        const maxLength = Math.max(oldChildren.length, newChildren.length);
        
        for (let i = 0; i < maxLength; i++) {
            compareAndAnimate(oldChildren[i], newChildren[i]);
        }
    };
    
    compareAndAnimate(oldElement, newElement);

    const oldimgs = oldElement.querySelectorAll("img")
    const newimgs = newElement.querySelectorAll("img")
    const maxLength = Math.max(oldimgs.length, newimgs.length);
    for (let index = 0; index < maxLength; index++) {
        const oldimg = oldimgs[index];
        const newimg = newimgs[index];
        if (oldimg && newimg && oldimg.src !== newimg.src) {
            newimg.style.transition = 'none';
            newimg.style.opacity = 0;
            newimg.style.scale = 1.5;
            newimg.offsetHeight;
            newimg.style.transition = '';
            (img => setTimeout(() => {img.style.opacity = 1; img.style.scale = 1;}, 200 * index))(newimg);
        }
    }
};

// === 社交动态 =================================
StateBeautifyMod.LoadSocial = function() {
    StateBeautifyMod.social_div = document.createElement("div");
    new Wikifier(StateBeautifyMod.social_div, "<<social>>");
    const display = {};
    let display_num = 0;
    const relation_boxes = StateBeautifyMod.social_div.querySelectorAll(".relation-box");
    for (let index = 0; index < relation_boxes.length; index++) {
        const relation_box = relation_boxes[index];
        let relation_title = relation_box.querySelector(".relation-top-line > .relation-name")?.innerText;
        const relation_class_id = relation_box.parentElement?.id;  // 这个键若为null，则在之后单独分组，但在display中为同一组

        if (relation_class_id === "global-recognition") relation_title = relation_box.querySelector(".relation-description").childNodes[0].textContent.trim().replace('：', '');  // 单独适配知名度

        if (relation_title) {  // 有Title，才有键，才可以动态查询修改
            const LastRelation = StateBeautifyMod.LastRelations[relation_title];
            if (LastRelation) {
                if (LastRelation.innerText !== relation_box.innerText) {  // 有改动，动态展示，否则不变
                    if (!display.hasOwnProperty(relation_class_id)) display[relation_class_id] = [];
                    display[relation_class_id].push([LastRelation, relation_box]);  // 格式：原来的, 现在的
                    display_num += 1;
                }
            } else if (!StateBeautifyMod.First) {
                if (!display.hasOwnProperty(relation_class_id)) display[relation_class_id] = [];
                display[relation_class_id].push([relation_box, relation_box]);  // 格式：都是现在的，这个是新NPC的出现
                display_num += 1;
            };
            StateBeautifyMod.LastRelations[relation_title] = relation_box;  // 不论前一个是否存在，都要保存
        }
    }

    if (display_num > StateBeautifyMod.DisplayFoldMax) {
        StateBeautifyMod.DisplayFold["relation-box-list"] = display;
    } else {
        for (const relation_class_id in display) {
            const relations = display[relation_class_id]
            for (let index = 0; index < relations.length; index++) {
                const [LastRelation, NewRelation] = relations[index];
                const list_div = StateBeautifyMod.GetList(relation_class_id, "relation-box-list");
                list_div.append(NewRelation);
                StateBeautifyMod.applyTransition(LastRelation, NewRelation);
            }
            StateBeautifyMod.FinishList(relation_class_id, 800)
        }
    }
};

// === 属性动态 =================================
StateBeautifyMod.LoadCharacteristics = function() {
    StateBeautifyMod.characteristic_div = document.createElement("div");
    new Wikifier(StateBeautifyMod.characteristic_div, "<<characteristics>>");
    const display = {};
    let display_num = 0;
    const characteristic_boxes = StateBeautifyMod.characteristic_div.querySelectorAll(".characteristic-box");
    for (let index = 0; index < characteristic_boxes.length; index++) {
        const characteristic_box = characteristic_boxes[index];
        const characteristic_title = characteristic_box.querySelector(".characteristic-top-line > .characteristic-title")?.innerText;
        if (characteristic_title) {  // 有Title，才有键，才可以动态查询修改
            const LastCharacteristic = StateBeautifyMod.LastCharacteristics[characteristic_title];
            let characteristic_class_id = characteristic_box.parentElement?.id;  // 这个键若为null，则在之后单独分组，但在display中为同一组
            let content_changed = LastCharacteristic?.innerText !== characteristic_box?.innerText;

            if (characteristic_box.parentElement?.id === "base-characteristics") content_changed = content_changed || LastCharacteristic.querySelector(".meter > div")?.style.cssText !== characteristic_box.querySelector(".meter > div")?.style.cssText;  // 单独适配核心属性
            if (characteristic_box.parentElement?.className === "sex-diagram-box") characteristic_class_id = "sex-diagram";  // 单独适配性技能

            if (LastCharacteristic && content_changed) {  // 有改动，动态展示，否则不变
                if (!display.hasOwnProperty(characteristic_class_id)) {
                    display[characteristic_class_id] = [];
                }
                display[characteristic_class_id].push([LastCharacteristic, characteristic_box]);  // 格式：原来的, 现在的
                display_num += 1;
            }
            StateBeautifyMod.LastCharacteristics[characteristic_title] = characteristic_box  // 不论前一个是否存在，都要保存
        }
    };

    if (display_num > StateBeautifyMod.DisplayFoldMax) {
        StateBeautifyMod.DisplayFold["characteristic-box-list"] = display
    } else {
        for (const characteristic_class_id in display) {
            const characteristics = display[characteristic_class_id]
            for (let index = 0; index < characteristics.length; index++) {
                const [LastCharacteristic, NewCharacteristic] = characteristics[index];
                const list_div = StateBeautifyMod.GetList(characteristic_class_id, "characteristic-box-list");
                list_div.append(NewCharacteristic);
                StateBeautifyMod.applyTransition(LastCharacteristic, NewCharacteristic);
            }
            StateBeautifyMod.FinishList(characteristic_class_id, 800)
        }
    };
};


// === 折叠动态 =================================
StateBeautifyMod.LoadFoldedDisplay = function() {
    if (Object.keys(StateBeautifyMod.DisplayFold).length > 0) {
        const list = StateBeautifyMod.GetList("foldedDisplay", "foldedDisplay-box-list");
        list.innerHTML = `
        <div onclick="StateBeautifyMod.UnfoldDisplay()">
            <span id="foldedDisplay">查看所有数值的改变</span>
        </div>
        `;

        StateBeautifyMod.FinishList("foldedDisplay", 3000);
    }
};
StateBeautifyMod.UnfoldDisplay = function() {
    if (!StateBeautifyMod.DisplayFoldClose) {
        this.CancelFinishList("foldedDisplay");
        const foldedDisplay = document.querySelector("#foldedDisplay");
        if (foldedDisplay) foldedDisplay.innerText = "关闭所有数值的改变";
        StateBeautifyMod.DisplayFoldClose = true;

        for (let key in StateBeautifyMod.DisplayFold) {
            let display = StateBeautifyMod.DisplayFold[key]
            for (const class_id in display) {
                const divs = display[class_id];
                for (let index = 0; index < divs.length; index++) {
                    const [Last, New] = divs[index];
                    const list_div = StateBeautifyMod.GetList(class_id, key);
                    list_div.append(New);
                    StateBeautifyMod.applyTransition(Last, New);
                }
            }
        }
    } else {
        StateBeautifyMod.FinishList("foldedDisplay", -800);
        for (let key in StateBeautifyMod.DisplayFold) {
            let display = StateBeautifyMod.DisplayFold[key]
            for (const class_id in display) {
                StateBeautifyMod.FinishList(class_id, -800);
            }
        }
    }
};


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
