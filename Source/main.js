window.StateBeautifyMod = {}

StateBeautifyMod.LastState = new Map()

$(document).on(":passagerender", function (ev) {StateBeautifyMod.onPassageRender(ev)});

StateBeautifyMod.onPassageRender = function (ev) {
    queueMicrotask(() => {
        const meters = document.querySelectorAll('#statmeters .meter');
        const stats = document.querySelectorAll('#mobileStats .stat:not(.time)');

        let stats_bars = []
        stats.forEach(stat => {
            const div_meter = document.createElement("div")
            div_meter.className = "meter"
            const div = document.createElement("div")
            div_meter.append(div)
            stat.append(div_meter)
            stats_bars.push(div)
        })

        let index = 0
        const stowed = document.getElementById("ui-bar").classList.contains("stowed")
        meters.forEach(meter => {
            let bar = meter.querySelector("div");
            const barId = meter.parentElement.id;
            const newWidth = bar? bar.style.width: '0%';
            const lastWidth = StateBeautifyMod.LastState.get(barId) || '0%';
            const stat_bar = stats_bars[index]
            
            stat_bar.className = bar? bar.className: "";
            stat_bar.style.width = newWidth;

            if (stowed) {
                bar = stat_bar
            }

            if (lastWidth !== newWidth) {
                bar.style.transition = 'none';
                bar.style.width = lastWidth;
                bar.offsetHeight;
                
                bar.style.transition = '';
                bar.style.width = newWidth;
            }

            index += 1;
            StateBeautifyMod.LastState.set(barId, newWidth);
        })
    });
}