// 摘取自：http://dbp-consulting.com/tutorials/canvas/CanvasArrow.html
function drawHead(ctx, x0, y0, x1, y1, x2, y2, style, color) {
    "use strict";
    if (typeof x0 == "string") x0 = parseInt(x0);
    if (typeof y0 == "string") y0 = parseInt(y0);
    if (typeof x1 == "string") x1 = parseInt(x1);
    if (typeof y1 == "string") y1 = parseInt(y1);
    if (typeof x2 == "string") x2 = parseInt(x2);
    if (typeof y2 == "string") y2 = parseInt(y2);

    // all cases do this.
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    switch (style) {
        case 0:
            // curved filled, add the bottom as an arcTo curve and fill
            var backdist = Math.sqrt((x2 - x0) * (x2 - x0) + (y2 - y0) * (y2 - y0));
            ctx.arcTo(x1, y1, x0, y0, 0.55 * backdist);
            ctx.fill();
            break;
        case 1:
            // straight filled, add the bottom as a line and fill.
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x0, y0);
            ctx.fill();
            break;
        case 2:
            // unfilled head, just stroke.
            ctx.stroke();
            break;
        case 3:
            //filled head, add the bottom as a quadraticCurveTo curve and fill
            var cpx = (x0 + x1 + x2) / 3;
            var cpy = (y0 + y1 + y2) / 3;
            ctx.quadraticCurveTo(cpx, cpy, x0, y0);
            ctx.fill();
            break;
        case 4:
            //filled head, add the bottom as a bezierCurveTo curve and fill
            var cp1x, cp1y, cp2x, cp2y, backdist;
            var shiftamt = 5;
            if (x2 == x0) {
                // Avoid a divide by zero if x2==x0
                backdist = y2 - y0;
                cp1x = (x1 + x0) / 2;
                cp2x = (x1 + x0) / 2;
                cp1y = y1 + backdist / shiftamt;
                cp2y = y1 - backdist / shiftamt;
            } else {
                backdist = Math.sqrt((x2 - x0) * (x2 - x0) + (y2 - y0) * (y2 - y0));
                var xback = (x0 + x2) / 2;
                var yback = (y0 + y2) / 2;
                var xmid = (xback + x1) / 2;
                var ymid = (yback + y1) / 2;

                var m = (y2 - y0) / (x2 - x0);
                var dx = backdist / (2 * Math.sqrt(m * m + 1)) / shiftamt;
                var dy = m * dx;
                cp1x = xmid - dx;
                cp1y = ymid - dy;
                cp2x = xmid + dx;
                cp2y = ymid + dy;
            }

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x0, y0);
            ctx.fill();
            break;
    }
    ctx.restore();
}

function drawArrow(ctx, x1, y1, x2, y2, style, which, angle, d, color, dash) {
    "use strict";
    // Ceason pointed to a problem when x1 or y1 were a string, and concatenation
    // would happen instead of addition
    if (typeof x1 == "string") x1 = parseInt(x1);
    if (typeof y1 == "string") y1 = parseInt(y1);
    if (typeof x2 == "string") x2 = parseInt(x2);
    if (typeof y2 == "string") y2 = parseInt(y2);
    if (x1 == x2 && y1 == y2) {
        return;
    }
    style = typeof style != "undefined" ? style : 3;
    which = typeof which != "undefined" ? which : 1; // end point gets arrow
    angle = typeof angle != "undefined" ? angle : Math.PI / 8;
    d = typeof d != "undefined" ? d : 10;
    color = typeof color != "undefined" ? color : "black";
    // default to using drawHead to draw the head, but if the style
    // argument is a function, use it instead
    var toDrawHead = typeof style != "function" ? drawHead : style;

    // For ends with arrow we actually want to stop before we get to the arrow
    // so that wide lines won't put a flat end on the arrow.
    //
    var dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    var ratio = (dist - d / 3) / dist;
    var tox, toy, fromx, fromy;
    if (which & 1) {
        tox = Math.round(x1 + (x2 - x1) * ratio);
        toy = Math.round(y1 + (y2 - y1) * ratio);
    } else {
        tox = x2;
        toy = y2;
    }
    if (which & 2) {
        fromx = x1 + (x2 - x1) * (1 - ratio);
        fromy = y1 + (y2 - y1) * (1 - ratio);
    } else {
        fromx = x1;
        fromy = y1;
    }

    // Draw the shaft of the arrow
    ctx.save();
    ctx.strokeStyle = color;
    if (dash) {
        ctx.setLineDash([10, 5]);
    }
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
    ctx.restore();

    // calculate the angle of the line
    var lineangle = Math.atan2(y2 - y1, x2 - x1);
    // h is the line length of a side of the arrow head
    var h = Math.abs(d / Math.cos(angle));

    if (which & 1) {
        // handle far end arrow head
        var angle1 = lineangle + Math.PI + angle;
        var topx = x2 + Math.cos(angle1) * h;
        var topy = y2 + Math.sin(angle1) * h;
        var angle2 = lineangle + Math.PI - angle;
        var botx = x2 + Math.cos(angle2) * h;
        var boty = y2 + Math.sin(angle2) * h;
        toDrawHead(ctx, topx, topy, x2, y2, botx, boty, style, color);
    }
    if (which & 2) {
        // handle near end arrow head
        var angle1 = lineangle + angle;
        var topx = x1 + Math.cos(angle1) * h;
        var topy = y1 + Math.sin(angle1) * h;
        var angle2 = lineangle - angle;
        var botx = x1 + Math.cos(angle2) * h;
        var boty = y1 + Math.sin(angle2) * h;
        toDrawHead(ctx, topx, topy, x1, y1, botx, boty, style, color);
    }
}

function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 生成渐变颜色
// @param percentage 渐变比例，0.0 到 1.0 之间
function genGradientColor(color1, color2, percentage) {
    // 将颜色转换为 RGB 格式
    function hexToRgb(hex) {
        const bigint = parseInt(hex.replace("#", ""), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return { r, g, b };
    }

    // 将 RGB 值转换为十六进制格式
    function rgbToHex(rgb) {
        const { r, g, b } = rgb;
        return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
    }

    const color1Rgb = hexToRgb(color1);
    const color2Rgb = hexToRgb(color2);

    // 计算中间颜色的 RGB 值
    const r = Math.round(color1Rgb.r + (color2Rgb.r - color1Rgb.r) * percentage);
    const g = Math.round(color1Rgb.g + (color2Rgb.g - color1Rgb.g) * percentage);
    const b = Math.round(color1Rgb.b + (color2Rgb.b - color1Rgb.b) * percentage);

    // 将 RGB 值转换为十六进制格式
    const gradientColor = rgbToHex({ r, g, b });
    return gradientColor;
}

function calcDiagonal(x1, y1, x2, y2, cost) {
    let dx = Math.abs(x1 - x2);
    let dy = Math.abs(y1 - y2);
    let mind = Math.min(dx, dy);
    let d = 1.4 * mind + Math.abs(dx - dy);
    return Math.floor(d * cost);
}
