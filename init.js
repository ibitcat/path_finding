
var width = 10;             // 地图宽
var height = 10;         // 地图高
var boxSize = 40;           // 格子大小
var nodes = [];             // 地图所有节点(0=初始可行走;>0待检查(最小堆的索引号);-1=障碍;-2=已关闭)
var srcX = -1;              // 起点x
var srcY = -1;              // 起点y
var dstX = -1;              // 终点x
var dstY = -1;              // 终点y
var disType = 0;            // 启发函数类型
var dirType = 4;            // 搜索方向
var state = 0;              // 0=节点切换模式; 1=设置开始节点模式; 2=设置结束节点模式
var isPause = false;        // 是否暂停
var timerId = null;         // 定时器id
var interval = 100;         // 定时器间隔时间(毫秒)
var cameFrom = {};          // 父节点
var algorithm = 0;          // 寻路算法
var hnWeight = 1;           // 启发权重
var dynamicWeight = false;  // 是否动态调整权重

function newBox(x, y, val) {
    let boxCls = "node_" + boxSize;
    let maskCls = "mask_" + boxSize;
    let color = "gray";
    let box = '<div class="node ' + boxCls + ' ' + color + '" x="' + x + '" y="' + y + '" val="' + val + '" id="box-' + x + "-" + y + '">' +
        '<div class="fn"></div>' +
        '<div class="in"></div>' +
        '<div class="gn"></div>' +
        '<div class="hn"></div>' +
        '<div class="' + maskCls + '" ' + 'id = "mask-' + x + "-" + y + '" ></div > ' +
        '</div>';
    return box;
}

// 设置节点颜色
function setBoxColor(x, y, type) {
    switch (type) {
        case 0:
            // 初始
            $("#box-" + x + "-" + y).css("background", "#ccc");
            break;
        case 1:
            // 障碍物(灰色)
            $("#box-" + x + "-" + y).css("background", "gray");
            break;
        case 2:
            // 起点(红色)
            $("#box-" + x + "-" + y).css("background", "red");
            break;
        case 3:
            // 终点(蓝色)
            $("#box-" + x + "-" + y).css("background", "blue");
            break;
        case 4:
            // 搜索中(渐变)
            let parent = cameFrom[x * 1000 + y];
            let b = (parent.x * 1000 + parent.y) % 256;
            let g = (parent.y * 1000 + parent.x) % 256;
            $("#box-" + x + "-" + y).css("background", "rgb(" + 255 + "," + g + "," + b + ")");
            break;
        case 5:
            // 已搜索的
            $("#box-" + x + "-" + y).css("background", "cyan");
            break;
        case 6:
            // 待搜索的
            $("#box-" + x + "-" + y).css("background", "yellow");
            break;
        case 7:
            // 路径点
            $("#box-" + x + "-" + y).css("background", "green");
            break;
    }
}

function createMap() {
    for (const i in nodes) {
        var col = $("<div class='col'></div>");
        for (const j in nodes[i]) {
            var box = newBox(j, i, nodes[i][j]);
            //var line = $("<div class='line'></div>");
            //line.attr("id", "line-" + i + "-" + j);
            col.append(box);
            //col.append('<div class="mask_40" ' + 'id="mask-' + j + "-" + i + '"></div>');
        }
        $("#map").append(col);
    }

    for (const i in nodes) {
        for (const j in nodes[i]) {
            if (nodes[i][j] == -1) {
                setBoxColor(j, i, 1);
            }
        }
    }
}

function initMap() {
    width = parseInt($("#mapWidth").val());
    height = parseInt($("#mapHeight").val());

    nodes = [];
    for (var i = 0; i < height; i++) {
        nodes[i] = [];
        for (var j = 0; j < width; j++) {
            nodes[i][j] = 0;
        }
    }
    createMap();
}

// 计算动态权重
function calcHnWeight(x, y) {
    let dx1 = Math.abs(x - dstX);
    let dy1 = Math.abs(y - dstY);
    let dx2 = Math.abs(dstX - srcX);
    let dy2 = Math.abs(srcY - dstY);

    let mind1 = Math.min(dx1, dy1);
    let d1 = 14 * mind1 + Math.abs(dx1 - dy1) * 10;

    let mind2 = Math.min(dx2, dy2);
    let d2 = 14 * mind2 + Math.abs(dx2 - dy2) * 10;
    return 1 + d1 / d2;
}

// 计算启发代价
function heuristic(x1, y1, x2, y2) {
    let dx = Math.abs(x1 - x2);
    let dy = Math.abs(y1 - y2);
    let hnw = hnWeight;
    if (dynamicWeight) {
        hnw = calcHnWeight(x1, y1);
    }

    if (disType == 0) {
        // 曼哈顿距离
        return Math.floor(hnw * (dx * 10 + dy * 10));
    } else if (disType == 1) {
        // 欧几里得距离
        return Math.floor(hnw * Math.sqrt(dx * dx + dy * dy) * 10);
    } else if (disType == 2) {
        // 切比雪夫距离
        let d = Math.max(dx, Math.abs(y1 - y2)) * 10;
        return Math.floor(hnw * d);
    } else if (disType == 3) {
        // 对角线距离
        let mind = Math.min(dx, dy);
        let d = 14 * mind + Math.abs(dx - dy) * 10;
        return Math.floor(hnw * d);
    }
}
function createNode(x, y, parent, stepCost) {
    if (algorithm == 0) {
        // a星寻路
        let gn = 0;
        if (parent != null) {
            gn = parent.g + stepCost;
        }

        let hn = heuristic(x, y, dstX, dstY);
        let node = { f: hn + gn, g: gn, h: hn, x: x, y: y };
        return node;
    } else if (algorithm == 1) {
        // dijkstra(没有启发函数)
        let gn = 0;
        let hn = 0;
        if (parent != null) {
            gn = parent.g + stepCost;
        }
        let node = { f: hn + gn, g: gn, h: hn, x: x, y: y };
        return node;
    } else if (algorithm == 2) {
        // 最佳优先搜索算法
        let gn = 0;
        let deltaX = Math.abs(x - dstX);
        let deltaY = Math.abs(y - dstY);
        let hn = Math.floor(Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 10);
        let node = { f: hn + gn, g: gn, h: hn, x: x, y: y };
        return node;
    }
}

// 开始寻路
function findPath() {
    let minHeap = new MinHeap(function (elem) {
        let x = elem.x;
        let y = elem.y;
        if (elem.idx < 0) {
            nodes[y][x] = -2;
        } else {
            nodes[y][x] = elem.idx;
        }
    });
    cameFrom = {};

    let nodeNum = 0; // 访问的点个数
    let srcNode = createNode(srcX, srcY, null, 0);
    minHeap.push(srcNode);

    //timerId = window.setInterval(starStep, interval, minHeap)
    timerId = window.setInterval(function () {
        if (isPause) {
            return;
        }

        if (minHeap.isEmpty()) {
            clearInterval(timerId);
            showNodeNum(nodeNum, -1);
            alert("没有可搜索的节点!");
            return;
        }

        // 弹出代价最小的节点
        let node = minHeap.pop();
        setBoxColor(node.x, node.y, 5);
        nodeNum += 1;

        // 找到了终点
        if (node.x == dstX && node.y == dstY) {
            console.log("找到了终点! 搜索节点数：", nodeNum);
            clearInterval(timerId);

            // 回溯
            let pathLen = 0;
            while (true) {
                let posId = node.x * 1000 + node.y;
                let parent = cameFrom[posId];
                if (parent == null) {
                    break;
                }
                setBoxColor(parent.x, parent.y, 7);
                node = parent;
                pathLen += 1;
            }

            showSrcPos();
            showDstPos();
            showNodeNum(nodeNum, pathLen);
            return;
        }

        // 遍历该节点的邻居节点
        neighborNode(minHeap, node);
    }, interval)
}

// 搜索方向(上,下,右,左,右上,左上,右下,左下)
var dirs = [[0, 1, 10], [0, -1, 10], [1, 0, 10], [-1, 0, 10], [1, 1, 14], [-1, 1, 14], [1, -1, 14], [-1, -1, 14]];
var arrows = ["↑", "↓", "←", "→", "↖", "↗", "↙", "↘"];
function neighborNode(minHeap, parent) {
    for (let i = 0; i < dirType; i++) {
        let dir = dirs[i];
        let x = parent.x + dir[0];
        let y = parent.y + dir[1];
        let stepCost = dir[2];

        if (x < 0 || x >= width || y < 0 || y >= height) {
            // 到达边界
            continue;
        }

        if (nodes[y][x] < 0) {
            // 已关闭/障碍
            continue;
        }

        let boxId = "#box-" + x + "-" + y;
        let maskId = "#mask-" + x + "-" + y;
        let index = nodes[y][x];
        if (index > 0) {
            // 在堆中
            let nnode = minHeap.getElem(index);
            if (nnode.g > parent.g + stepCost) {
                // 更新确定代价
                nnode.g = parent.g + stepCost;
                nnode.f = nnode.g + nnode.h;
                minHeap.update(index, nnode);
                cameFrom[nnode.x * 1000 + nnode.y] = parent;

                $(boxId + " .fn").text(nnode.f);
                $(boxId + " .gn").text(nnode.g);
                $(boxId + " .hn").text(nnode.h);
                $(maskId).text(arrows[i]);
            }
        } else {
            // 可行走
            let nnode = createNode(x, y, parent, stepCost);
            minHeap.push(nnode);
            cameFrom[nnode.x * 1000 + nnode.y] = parent;

            setBoxColor(nnode.x, nnode.y, 4);
            $(boxId + " .fn").text(nnode.f);
            $(boxId + " .gn").text(nnode.g);
            $(boxId + " .hn").text(nnode.h);
            $(maskId).text(arrows[i]);
        }
    }
}

function showSrcPos() {
    // 起点
    if (srcX >= 0 && srcY >= 0) {
        setBoxColor(srcX, srcY, 2);
    }
}

function showDstPos() {
    // 终点
    if (dstX >= 0 && dstY >= 0) {
        setBoxColor(dstX, dstY, 3);
    }
}

function showNodeNum(nodeNum, pathLen) {
    $("#nodeNum").val(nodeNum + "," + pathLen);
}

function reset() {
    $("#map").empty();
    disableDom(false);

    isPause = false;
    $("#pause").text(isPause ? "继续" : "暂停");
    $("#hnWeight").attr('disabled', dynamicWeight);

    if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
    }
}
function disableDom(v) {
    $("#mapWidth").attr('disabled', v);
    $("#mapHeight").attr('disabled', v);
    $("#boxSize").attr('disabled', v);
    $("#createMap").attr('disabled', v);
    $("#srcPos").attr('disabled', v);
    $("#dstPos").attr('disabled', v);
    $("#start").attr('disabled', v);
    $("#dirType").attr('disabled', v);
    $("#disType").attr('disabled', v);
    $("#interval").attr('disabled', v);
    $("#algorithm").attr('disabled', v);
    $("#randObstacle").attr('disabled', v);
    $("#obstacleNum").attr('disabled', v);
    $("#hnWeight").attr('disabled', v);
    $("#dynamicWeight").attr('disabled', v);
}

// dom 响应
// 重新生成地图
$("#createMap").click(function () {
    srcX = -1;
    srcY = -1;
    dstX = -1;
    dstY = -1;

    reset();
    initMap();
})

// 随机障碍
$("#randObstacle").click(function () {
    let obstacleNum = parseInt($("#obstacleNum").val());
    if (obstacleNum <= 0) {
        alert("请输入正确的障碍点数量");
        return;
    }

    let obstacleCnt = 0;
    for (const i in nodes) {
        for (const j in nodes[i]) {
            if (nodes[i][j] == -1) {
                obstacleCnt += 1;
            }
        }
    }

    let limit = height * width - 2;
    if ((obstacleNum + obstacleCnt) > limit) {
        alert("障碍点数量过大");
        return;
    }

    while (obstacleNum > 0) {
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * height);

        if ((x == srcX && y == srcY) || (x == dstX && y == dstY)) {
            continue;
        }

        if (nodes[y][x] == -1) {
            continue;
        }

        nodes[y][x] = -1;
        setBoxColor(x, y, 1);
        obstacleNum -= 1;
    }
})

// 选择格子大小
$("#boxSize").click(function () {
    boxSize = parseInt($(this).val());
})

// 设置起点
$("#srcPos").click(function () {
    state = 1;
    disableDom(true);
})

// 设置终点
$("#dstPos").click(function () {
    state = 2;
    disableDom(true);
})

// 选择寻路算法
$("#algorithm").on("change", function () {
    algorithm = parseInt($(this).val());

    if (algorithm == 0) {
        $("#hn").css("display", "block");
        $("#wn").css("display", "block");
        $("#dwn").css("display", "block");
    } else {
        $("#hn").css("display", "none");
        $("#wn").css("display", "none");
        $("#dwn").css("display", "none");
    }
})

// 选择启发函数
$("#disType").on("change", function () {
    disType = parseInt($(this).val());
})

// 是否斜向移动
$("#dirType").click(function () {
    if ($(this).prop('checked')) {
        dirType = 8;
    } else {
        dirType = 4;
    }
})

// 是否动态权重
$("#dynamicWeight").click(function () {
    dynamicWeight = $(this).prop('checked');
    $("#hnWeight").attr('disabled', dynamicWeight);
})

// 选择展示速度
$("#interval").on("change", function () {
    interval = parseInt($(this).val());
})

// 设置障碍
$("#map").on("click", ".node", function () {
    if (timerId != null) {
        return false;
    }
    let x = parseInt($(this).attr("x"));
    let y = parseInt($(this).attr("y"));

    if (state == 0) {
        // 非起点
        if (srcX == x && srcY == y) {
            return false;
        }

        // 非终点
        if (dstX == x && dstY == y) {
            return false;
        }

        if (nodes[y][x] == 0) {
            nodes[y][x] = -1;
            setBoxColor(x, y, 1);
        } else {
            nodes[y][x] = 0;
            setBoxColor(x, y, 0);
        }
    } else if (state == 1) {
        // 非终点
        if (dstX == x && dstY == y) {
            return false;
        }
        // 非障碍
        if (nodes[y][x] == -1) {
            return false;
        }

        if (srcX >= 0 && srcY >= 0) {
            nodes[srcY][srcX] = 0;
            setBoxColor(srcX, srcY, 0);
        }

        srcX = x;
        srcY = y;
        showSrcPos();
    } else if (state == 2) {
        // 非起点
        if (srcX == x && srcY == y) {
            return false;
        }

        if (nodes[y][x] == -1) {
            return false;
        }

        if (dstX >= 0 && dstY >= 0) {
            nodes[dstY][dstX] = 0;
            setBoxColor(dstX, dstY, 0);
        }

        dstX = x;
        dstY = y;
        showDstPos();
    }

    state = 0;
    disableDom(false);
})

$("#start").click(function () {
    hnWeight = parseInt($("#hnWeight").val());
    disableDom(true);

    // 如果star在执行,则停止
    if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
    }

    if (srcX < 0 || srcY < 0 || dstX < 0 || dstY < 0) {
        alert("起点或终点未设置");
        disableDom(false);
        return;
    }

    // 开始寻路
    findPath();
})

$("#pause").click(function () {
    isPause = !isPause;
    $(this).text(isPause ? "继续" : "暂停");
})

$("#reset").click(function () {
    reset();

    // 保留起点、终点、障碍点
    for (const i in nodes) {
        for (const j in nodes[i]) {
            let val = nodes[i][j];
            if (val > 0 || val == -2) {
                nodes[i][j] = 0;
            }
        }
    }
    createMap();
    showSrcPos();
    showDstPos();
})
