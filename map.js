var srcColor = "#ff3366"; // 起点颜色
var dstColor = "#3366ff"; // 终点颜色
var obstacleColor = "gray";
var dirs = [
    // 以左上角为坐标原地
    // [x坐标,y坐标,代价,反方向索引,分量方向索引]
    [1, 0, 10, 1], // 右
    [-1, 0, 10, 0], // 左
    [0, 1, 10, 3], // 下
    [0, -1, 10, 2], // 上
    [1, 1, 14, 5, 0, 2], // 右下
    [-1, -1, 14, 4, 1, 3], // 左上
    [-1, 1, 14, 7, 1, 2], // 左下
    [1, -1, 14, 6, 0, 3], // 右上
];

var dirMap = new Map();
for (let i = 0; i < dirs.length; i++) {
    let dir = dirs[i];
    let dirId = dir[0] * 100 + dir[1];
    dirMap.set(dirId, i);
}

function getDirIdx(dx, dy) {
    return dirMap.get(dx * 100 + dy);
}

// 地图格子
class Grid {
    constructor(map, x, y) {
        this.x = x;
        this.y = y;
        this.color = "white";
        this.isObstacle = false;
        this.isStart = false;
        this.isEnd = false;
        this.isPath = false;
        this.isVisited = false;
        this.map = map;
        this.px = x * map.gridPixel;
        this.py = y * map.gridPixel;
        this.bits = 0;
    }

    fill(color) {
        let fillSize = this.map.gridPixel - 2;
        let mainCtx = this.map.mainCtx;
        if (typeof color != "undefined") {
            this.color = color;
        } else {
            color = this.color;
        }
        mainCtx.fillStyle = color;
        mainCtx.clearRect(this.px + 1, this.py + 1, fillSize, fillSize);
        mainCtx.fillRect(this.px + 1, this.py + 1, fillSize, fillSize);
    }
    updateBlock(val) {
        this.isObstacle = val;
        for (let idx = 0; idx < dirs.length; idx++) {
            const dir = dirs[idx];
            let x = this.x + dir[0];
            let y = this.y + dir[1];
            let nbGrid = this.map.getGrid(x, y);
            if (nbGrid) {
                if (val) {
                    // 障碍
                    nbGrid.bits |= 1 << dir[3];
                } else {
                    nbGrid.bits &= ~(1 << dir[3]);
                }
            }
        }

        if (!this.isEnd && !this.isStart) {
            this.fill(val ? obstacleColor : "white");
        }
    }

    drawArc(color) {
        let ctx = this.map.mainCtx;
        let half = Math.floor(this.map.gridPixel / 2);
        ctx.save();
        //ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(this.px + half, this.py + half, 10, 0, Math.PI * 2, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    getVecNeighbor(dx, dy) {
        let x = this.x + dx;
        let y = this.y + dy;
        return this.map.getGrid(x, y);
    }
    getNeighbor(dirIdx) {
        let dir = dirs[dirIdx];
        return this.getVecNeighbor(dir[0], dir[1]);
    }

    canGo(dirIdx) {
        let bits = this.bits;
        if (dirIdx > 3) {
            // 对角线方向
            let dir = dirs[dirIdx];
            let c1 = bits & (1 << dir[4]);
            let c2 = bits & (1 << dir[5]);
            return !(bits & (1 << dirIdx)) && (!c1 || !c2);
        } else {
            return !(bits & (1 << dirIdx));
        }
    }

    canVecGo(dx, dy) {
        let dirIdx = getDirIdx(dx, dy);
        return this.canGo(dirIdx);
    }

    // 获取强制邻居
    getForceNeighbors(type, dv) {
        let neighbors = [];
        if (type == "x") {
            if (!this.canVecGo(0, 1) && this.canVecGo(dv, 1)) {
                // !下 && 右下|左下
                neighbors.push(this.getVecNeighbor(dv, 1));
            }
            if (!this.canVecGo(0, -1) && this.canVecGo(dv, -1)) {
                // !上 && 右上|左上
                neighbors.push(this.getVecNeighbor(dv, -1));
            }
        } else if (type == "y") {
            if (!this.canVecGo(1, 0) && this.canVecGo(1, dv)) {
                // !右 && 右下|右下
                neighbors.push(this.getVecNeighbor(1, dv));
            }
            if (!this.canVecGo(-1, 0) && this.canVecGo(-1, dv)) {
                // !左 && 左上|左上
                neighbors.push(this.getVecNeighbor(-1, dv));
            }
        }
        neighbors.forEach((grid) => grid.fill("yellow"));
        return neighbors;
    }

    getNeighbors(dx, dy) {
        let nbs = [];

        if (dx == 0 && dy == 0) {
            for (let dirIdx = 0; dirIdx < dirs.length; dirIdx++) {
                if (this.canGo(dirIdx)) {
                    nbs.push(this.getNeighbor(dirIdx));
                }
            }
        } else {
            if (dx != 0 && this.canVecGo(dx, 0)) {
                // 水平方向
                nbs.push(this.getVecNeighbor(dx, 0));
            }
            if (dy != 0 && this.canVecGo(0, dy)) {
                // 垂直方向
                nbs.push(this.getVecNeighbor(0, dy));
            }
            if (dx != 0 && dy != 0 && this.canVecGo(dx, dy)) {
                // 对角线方向
                nbs.push(this.getVecNeighbor(dx, dy));
            }

            // 强制邻居
            if (dx != 0) {
                let fnbs = this.getForceNeighbors("x", dx);
                nbs.push(...fnbs);
            }
            if (dy != 0) {
                let fnbs = this.getForceNeighbors("y", dy);
                nbs.push(...fnbs);
            }
        }
        return nbs;
    }
}

class GridNode {
    constructor(grid, p, gn, hn) {
        this.grid = grid; // 对应格子
        this.p = p; // 父节点
        this.gn = gn; // 移动代价
        this.hn = hn; // 预估代价
        this.fn = this.gn + this.hn; // 总代价
        this.closed = false; // 是否已探索
        this.idx = -1; // 在最小堆中的索引
    }

    setParent(p, cost) {
        if (this.gn > p.gn + cost) {
            this.p = p;
            this.gn = p.gn + cost;
            this.fn = this.gn + this.hn;
            return true;
        }
        return false;
    }

    setClosed() {
        this.closed = true;
    }

    fillCost() {
        let grid = this.grid;
        let gridPixel = grid.map.gridPixel;
        let halfBox = Math.floor(gridPixel / 2);
        let subCtx = grid.map.subCtx;
        subCtx.fillStyle = "black";
        subCtx.textBaseline = "top";
        subCtx.textAlign = "left";
        subCtx.font = Math.ceil(halfBox / 2) + "px Arial";
        subCtx.clearRect(grid.px + 1, grid.py + 1, gridPixel - 2, gridPixel - 2);
        subCtx.fillText(this.fn, grid.px + 1, grid.py + 1);
        subCtx.fillText(this.gn, grid.px + 1, grid.py + halfBox);
        subCtx.fillText(this.hn, grid.px + halfBox, grid.py + 1);
    }

    fillDir() {
        let grid = this.grid;
        let subCtx = grid.map.subCtx;
        subCtx.save();

        let gridPixel = grid.map.gridPixel;
        let dx = Math.sign(grid.x - this.p.grid.x);
        let dy = Math.sign(grid.y - this.p.grid.y);
        let halfBox = Math.floor(gridPixel / 2);
        let quarterBox = Math.floor(gridPixel / 4);
        let offsetX = grid.px;
        let offsetY = grid.py;
        // 画方向
        if (dy == 0) {
            // 水平
            let formX = offsetX + quarterBox;
            let formY = offsetY + halfBox;
            let toX = offsetX + halfBox + quarterBox;
            let toY = offsetY + halfBox;
            let which = dx > 0 ? 2 : 1;
            drawArrow(subCtx, formX, formY, toX, toY, 3, which);
        } else if (dx == 0) {
            //垂直
            let formX = offsetX + halfBox;
            let formY = offsetY + quarterBox;
            let toX = offsetX + halfBox;
            let toY = offsetY + halfBox + quarterBox;
            let which = dy > 0 ? 2 : 1;
            drawArrow(subCtx, formX, formY, toX, toY, 3, which);
        } else if (dx == dy) {
            // 斜向
            let formX = offsetX + quarterBox;
            let formY = offsetY + quarterBox;
            let toX = offsetX + halfBox + quarterBox;
            let toY = offsetY + halfBox + quarterBox;
            let which = dy > 0 ? 2 : 1;
            drawArrow(subCtx, formX, formY, toX, toY, 3, which);
        } else {
            let formX = offsetX + halfBox + quarterBox;
            let formY = offsetY + quarterBox;
            let toX = offsetX + quarterBox;
            let toY = offsetY + halfBox + quarterBox;
            let which = dy > 0 ? 2 : 1;
            drawArrow(subCtx, formX, formY, toX, toY, 3, which);
        }
        subCtx.restore();
    }

    // 根据父跳点到该跳点的方向获取周围可探索的邻居
    getNeighbors() {
        let grid = this.grid;
        if (!this.p) {
            return grid.getNeighbors(0, 0);
        } else {
            let pgrid = this.p.grid;
            let dx = Math.sign(grid.x - pgrid.x);
            let dy = Math.sign(grid.y - pgrid.y);
            return grid.getNeighbors(dx, dy);
        }
    }
}

// 地图
class GridMap {
    constructor(gridPixel) {
        this.gridPixel = gridPixel; // 格子像素大小
        this.numX = 0; // 地图x轴格数
        this.numY = 0; // 地图y轴格数
        this.width = 0; // 地图宽度
        this.height = 0; // 地图高度
        this.mainCanvas = null; // 主画布(画格子)
        this.mainCtx = null; // 主画布2d画笔
        this.subCanvas = null; // 子画布(画寻路信息，如代价值、路径方向等)
        this.subCtx = null; // 子画布2d画笔
        this.grids = []; // 格子数组
        this.srcGrid = null; // 起点
        this.dstGrid = null; // 终点
        this.finding = false; // 正在寻路
        this.algorithm = 0; // 寻路算法
        this.hnType = 0; // 启发函数类型
        this.dirType = 4; // 搜索方向
        this.dynWeight = false; // 是否动态调整启发权重
        this.minHeap = null; // 小根堆
        this.nodes = {}; // 寻路节点列表
        this.isPause = false; // 是否暂停寻路
        this.timerId = null; // 定时器id
        this.interval = 100; // 定时器间隔时间(毫秒)
    }

    init() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        let gridPixel = this.gridPixel;
        this.numX = Math.floor(width / gridPixel) - 1;
        this.numY = Math.floor(height / gridPixel) - 1;
        this.width = this.numX * gridPixel;
        this.height = this.numY * gridPixel;

        // 画布
        this.mainCanvas = document.getElementById("mainCanvas");
        this.subCanvas = document.getElementById("subCanvas");
        this.mainCtx = this.mainCanvas.getContext("2d");
        this.subCtx = this.subCanvas.getContext("2d");

        this.addTipEvent();
        this.initCanvas();
        this.drawGrid();
    }

    initCanvas() {
        let mainCanvas = this.mainCanvas;
        let mainCtx = this.mainCtx;
        let subCanvas = this.subCanvas;
        let subCtx = this.subCtx;

        mainCanvas.width = this.width;
        mainCanvas.height = this.height;
        subCanvas.width = this.width;
        subCanvas.height = this.height;

        mainCtx.fillStyle = "#000";
        mainCtx.strokeStyle = "#ccc";
        mainCtx.linewidth = 1;

        subCtx.fillStyle = "#000";
        subCtx.strokeStyle = "#ccc";
        subCtx.linewidth = 1;

        mainCtx.clearRect(0, 0, this.width, this.height);
        subCtx.clearRect(0, 0, this.width, this.height);

        this.addMainCanvasEvent();
    }
    drawGrid() {
        this.grids = [];
        this.mainCtx.clearRect(0, 0, this.width, this.height);

        let gridPixel = this.gridPixel;
        let path = new Path2D();
        for (let i = 0; i <= this.numX; i++) {
            path.moveTo(i * gridPixel, 0);
            path.lineTo(i * gridPixel, this.height);
        }
        for (let i = 0; i <= this.numY; i++) {
            path.moveTo(0, i * gridPixel);
            path.lineTo(this.width, i * gridPixel);
        }
        this.mainCtx.stroke(path);

        for (let i = 0; i < this.numX; i++) {
            for (let j = 0; j < this.numY; j++) {
                let grid = new Grid(this, i, j);
                let idx = this.getPosIdx(i, j);
                this.grids[idx] = grid;
                grid.fill();
            }
        }

        // 设置边界格子的bit
        for (let x = 0; x < this.numX; x++) {
            let y = 0;
            let grid = this.getGrid(x, y);
            grid.bits |= 1 << 3;
            grid.bits |= 1 << 5;
            grid.bits |= 1 << 7;

            y = this.numY - 1;
            grid = this.getGrid(x, y);
            grid.bits |= 1 << 2;
            grid.bits |= 1 << 4;
            grid.bits |= 1 << 6;
        }

        for (let y = 0; y < this.numY; y++) {
            let x = 0;
            let grid = this.getGrid(x, y);
            grid.bits |= 1 << 1;
            grid.bits |= 1 << 5;
            grid.bits |= 1 << 6;

            x = this.numX - 1;
            grid = this.getGrid(x, y);
            grid.bits |= 1 << 0;
            grid.bits |= 1 << 4;
            grid.bits |= 1 << 7;
        }
    }

    getPosIdx(x, y) {
        return x + y * this.numX;
    }
    getGrid(x, y) {
        if (!this.isValid(x, y)) {
            return null;
        }

        let idx = this.getPosIdx(x, y);
        return this.grids[idx];
    }

    getGridByPixel(px, py) {
        let gridPixel = this.gridPixel;
        let x = Math.floor(px / gridPixel);
        let y = Math.floor(py / gridPixel);
        let grid = this.getGrid(x, y);
        return grid;
    }

    getPixel(x, y, w, h) {
        x = Math.max(0, x);
        y = Math.max(0, y);
        x = Math.min(x, this.numX);
        y = Math.min(y, this.numY);
        if (w == undefined) {
            w = 0;
        }
        if (h == undefined) {
            h = 0;
        }
        let gridPixel = this.gridPixel;
        let px = x * gridPixel + w;
        let py = y * gridPixel + h;
        return [Math.max(0, px), Math.max(0, py)];
    }

    getDrawPos(x1, y1, x2, y2) {
        if (!this.isValid(x2, y2)) {
            let dx = x2 - x1;
            let dy = y2 - y1;
            let sdx = Math.sign(dx);
            let sdy = Math.sign(dy);
            let maxDx = sdx > 0 ? this.numX - 1 - x1 : x1;
            let maxDy = sdy > 0 ? this.numY - 1 - y1 : y1;

            if (dx != 0 && dy != 0) {
                let div = dx / dy;
                let divAbs = Math.abs(div);
                let outX = sdx > 0 ? x2 - this.numX - 1 : 0 - x2;
                let outY = sdy > 0 ? y2 - this.numY - 1 : 0 - y2;
                if (outX > outY) {
                    // x 方向超出较多
                    x2 = x1 + sdx * maxDx;
                    y2 = y1 + sdy * (maxDx / divAbs);
                } else {
                    y2 = y1 + sdy * maxDy;
                    x2 = x1 + sdx * (maxDy * divAbs);
                }
            } else if (dy == 0) {
                x2 = x1 + sdx * maxDx;
            } else if (dx == 0) {
                y2 = y1 + sdy * maxDy;
            }
        }
        let gridPixel = this.gridPixel;
        let px1 = x1 * gridPixel + gridPixel / 2;
        let py1 = y1 * gridPixel + gridPixel / 2;
        let px2 = x2 * gridPixel + gridPixel / 2;
        let py2 = y2 * gridPixel + gridPixel / 2;
        return [px1, py1, px2, py2];
    }

    setSrc(x, y) {
        let srcGrid = this.srcGrid;
        if (srcGrid) {
            if (srcGrid.x == x && srcGrid.y == y) {
                return;
            }
            srcGrid.isStart = false;
            srcGrid.fill("white");
        }

        let grid = this.getGrid(x, y);
        this.srcGrid = grid;
        grid.isStart = true;
        grid.fill(srcColor);
        grid.drawArc("blue");
        $("#srcPos").text("(" + grid.x + ", " + grid.y + ")");
    }

    setDst(x, y) {
        let dstGrid = this.dstGrid;
        if (dstGrid) {
            if (dstGrid.x == x && dstGrid.y == y) {
                return;
            }
            dstGrid.isEnd = false;
            dstGrid.fill("white");
        }

        let grid = this.getGrid(x, y);
        this.dstGrid = grid;
        grid.isEnd = true;
        grid.fill(dstColor);
        grid.drawArc("red");
        $("#dstPos").text("(" + grid.x + ", " + grid.y + ")");
    }

    isValid(x, y) {
        if (x < 0 || x >= this.numX || y < 0 || y >= this.numY) {
            // 到达边界
            return false;
        }
        return true;
    }
    canPass(x, y) {
        let grid = this.getGrid(x, y);
        if (!grid || grid.isObstacle) {
            return false;
        }
        return grid;
    }

    addMainCanvasEvent() {
        let hasMoved = false; //是否移动过
        let monseDrag = 0; // 拖动鼠标(1=拖动起点;2=拖动终点;3=绘制障碍点)
        let mainCanvas = this.mainCanvas;

        mainCanvas.addEventListener("mousedown", (event) => {
            if (this.finding) {
                return;
            }
            let x = Math.floor(event.offsetX / this.gridPixel);
            let y = Math.floor(event.offsetY / this.gridPixel);
            let grid = this.getGrid(x, y);
            if (!grid) {
                return;
            }
            if (grid.isStart) {
                // 拖动起点
                monseDrag = 1;
            } else if (grid.isEnd) {
                // 拖动终点
                monseDrag = 2;
            } else {
                // 加障碍点
                monseDrag = 3;
            }
        });
        mainCanvas.addEventListener("mousemove", (event) => {
            if (this.finding) {
                return;
            }
            let x = Math.floor(event.offsetX / this.gridPixel);
            let y = Math.floor(event.offsetY / this.gridPixel);
            let grid = this.getGrid(x, y);
            if (!grid || grid.isStart || grid.isEnd || grid.isObstacle) {
                return;
            }
            if (monseDrag == 1) {
                this.setSrc(x, y);
            } else if (monseDrag == 2) {
                this.setDst(x, y);
            } else if (monseDrag == 3) {
                hasMoved = true;
                grid.updateBlock(true);
            }
        });
        mainCanvas.addEventListener("mouseup", (event) => {
            if (this.finding) {
                return;
            }
            let x = Math.floor(event.offsetX / this.gridPixel);
            let y = Math.floor(event.offsetY / this.gridPixel);
            let grid = this.getGrid(x, y);
            if (monseDrag == 3) {
                monseDrag = 0;
                if (hasMoved) {
                    hasMoved = false;
                    return;
                }

                // click 事件
                if (grid) {
                    grid.updateBlock(!grid.isObstacle);
                }
            } else {
                monseDrag = 0;
                //hasMoved = false;
                if (grid) {
                    grid.updateBlock(false);
                }
            }
        });
        mainCanvas.addEventListener("mouseleave", function () {
            // 如果鼠标离开画布，也停止绘图
            monseDrag = 0;
            hasMoved = false;
        });
    }

    addTipEvent() {
        var isDragging = false;
        var posX, posY;

        var dragItem = document.getElementById("tip");
        dragItem.addEventListener("mousedown", function (e) {
            isDragging = true;
            let rect = dragItem.getBoundingClientRect();
            posX = e.clientX - rect.left;
            posY = e.clientY - rect.top;
        });
        document.addEventListener("mouseup", function () {
            isDragging = false;
        });
        document.addEventListener("mousemove", function (e) {
            if (isDragging) {
                dragItem.style.left = e.clientX - posX + "px";
                dragItem.style.top = e.clientY - posY + "px";
            }
        });
    }

    randomBlocks(num) {
        if (num <= 0) {
            alert("请输入正确的障碍点数量");
            return;
        }

        let blockCnt = 0;
        for (let i = 0; i < this.grids.length; i++) {
            const grid = this.grids[i];
            if (grid.isObstacle) {
                blockCnt += 1;
            }
        }

        let limit = this.numX * this.numY - 2; // 排除起点和终点
        if (num + blockCnt > limit) {
            alert("障碍点数量过大");
            return;
        }

        while (num > 0) {
            let x = Math.floor(Math.random() * this.numX);
            let y = Math.floor(Math.random() * this.numY);
            let grid = this.getGrid(x, y);
            if (grid.isStart || grid.isEnd || grid.isObstacle) {
                continue;
            }

            num -= 1;
            grid.updateBlock(true);
        }
    }

    calcHnWeight(x, y) {
        let srcX = this.srcGrid.x;
        let srcY = this.srcGrid.y;
        let dstX = this.dstGrid.x;
        let dstY = this.dstGrid.y;
        let dx1 = Math.abs(x - dstX);
        let dy1 = Math.abs(y - dstY);
        let dx2 = Math.abs(dstX - srcX);
        let dy2 = Math.abs(srcY - dstY);

        let mind1 = Math.min(dx1, dy1);
        let d1 = 14 * mind1 + Math.abs(dx1 - dy1) * 10;

        let mind2 = Math.min(dx2, dy2);
        let d2 = 14 * mind2 + Math.abs(dx2 - dy2) * 10;
        return d1 / d2;
    }

    // 计算启发代价
    heuristic(x1, y1) {
        let x2 = this.dstGrid.x;
        let y2 = this.dstGrid.y;
        let dx = Math.abs(x1 - x2);
        let dy = Math.abs(y1 - y2);
        let hnw = 1;
        if (this.dynWeight) {
            hnw = hnw + this.calcHnWeight(x1, y1);
        }

        let hnType = this.hnType;
        if (hnType == 0) {
            // 曼哈顿距离
            return Math.floor(hnw * (dx * 10 + dy * 10));
        } else if (hnType == 1) {
            // 欧几里得距离
            return Math.floor(hnw * Math.sqrt(dx * dx + dy * dy) * 10);
        } else if (hnType == 2) {
            // 切比雪夫距离
            let d = Math.max(dx, Math.abs(y1 - y2)) * 10;
            return Math.floor(hnw * d);
        } else if (hnType == 3) {
            // 对角线距离
            let mind = Math.min(dx, dy);
            let d = 14 * mind + Math.abs(dx - dy) * 10;
            return Math.floor(hnw * d);
        }
    }
    newGridNode(x, y, parent, stepCost) {
        let algo = this.algorithm;
        let grid = this.getGrid(x, y);
        if (algo == 0 || algo == 3) {
            // a星寻路 或 jps 寻路
            let gn = 0;
            if (parent != null) {
                gn = parent.gn + stepCost;
            }

            let hn = this.heuristic(x, y);
            let node = new GridNode(grid, parent, gn, hn);
            return node;
        } else if (algo == 1) {
            // dijkstra(没有启发函数)
            let gn = 0;
            let hn = 0;
            if (parent != null) {
                gn = parent.gn + stepCost;
            }
            let node = new GridNode(grid, parent, gn, hn);
            return node;
        } else if (algo == 2) {
            // 最佳优先搜索算法
            let gn = 0;
            let deltaX = Math.abs(x - this.dstGrid.x);
            let deltaY = Math.abs(y - this.dstGrid.y);
            let hn = Math.floor(Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 10);
            let node = new GridNode(grid, parent, gn, hn);
            return node;
        }
    }

    setFinding(val) {
        this.finding = val;
    }

    clear() {
        let timerId = this.timerId;
        if (timerId) {
            this.timerId = null;
            clearInterval(timerId);
        }
        this.setFinding(false);

        for (let index = 0; index < this.grids.length; index++) {
            const grid = this.grids[index];
            if (grid.isStart || grid.isEnd || grid.isObstacle) {
                continue;
            }

            grid.fill("white");
        }
        this.subCtx.clearRect(0, 0, this.width, this.height);
    }

    updateGridNode(x, y, parent, stepCost) {
        let nodes = this.nodes;
        let posIdx = this.getPosIdx(x, y);
        let node = nodes[posIdx];
        if (node && node.closed) {
            // 已关闭
            return;
        }

        let minHeap = this.minHeap;
        if (!node) {
            let percentage = this.calcHnWeight(x, y);
            let color = genGradientColor(dstColor, srcColor, percentage);
            node = this.newGridNode(x, y, parent, stepCost);
            minHeap.push(node);
            nodes[posIdx] = node;

            let grid = node.grid;
            if (!grid.isEnd) {
                node.fillCost();
                node.fillDir();
                grid.fill(color);
            }
        } else if (node.setParent(parent, stepCost)) {
            // 更新实际代价
            minHeap.update(node.idx, node);
            node.fillCost();
            node.fillDir();
        }
    }

    // A星寻路
    astar(parent) {
        for (let i = 0; i < this.dirType; i++) {
            let dir = dirs[i];
            let pgrid = parent.grid;
            let x = pgrid.x + dir[0];
            let y = pgrid.y + dir[1];
            let stepCost = dir[2];

            if (!this.canPass(x, y)) {
                // 边界或者障碍
                continue;
            }

            if (i >= 4) {
                let grid1 = this.getGrid(x, pgrid.y);
                let grid2 = this.getGrid(pgrid.x, y);
                if (!grid1 || grid1.isObstacle || !grid2 || grid2.isObstacle) {
                    // 对角线障碍
                    continue;
                }
            }
            this.updateGridNode(x, y, parent, stepCost);
        }
    }

    jumpX(startX, startY, dx) {
        let jpGrid = null;
        for (; startX >= 0 && startX < this.numX; ) {
            let grid = this.canPass(startX, startY);
            if (!grid) {
                break;
            }

            if (grid.isEnd) {
                jpGrid = grid;
                break;
            }
            let fnbs = grid.getForceNeighbors("x", dx);
            if (fnbs.length > 0) {
                jpGrid = grid;
                break;
            }
            startX += dx;
        }
        return { jpGrid: jpGrid, x: startX };
    }

    jumpY(startX, startY, dy) {
        let jpGrid = null;
        for (; startY >= 0 && startY < this.numY; ) {
            let grid = this.canPass(startX, startY);
            if (!grid) {
                break;
            }

            if (grid.isEnd) {
                jpGrid = grid;
                break;
            }
            let fnbs = grid.getForceNeighbors("y", dy);
            if (fnbs.length > 0) {
                jpGrid = grid;
                break;
            }
            startY += dy;
        }
        return { jpGrid: jpGrid, y: startY };
    }

    jumpXY(jp, dx, dy) {
        if (!jp || !jp.canVecGo(dx, dy)) {
            return null;
        }
        let grid = this.getGrid(jp.x + dx, jp.y + dy);
        if (!grid) {
            return null;
        }
        if (grid.isEnd) {
            return grid;
        }

        let xfnbs = grid.getForceNeighbors("x", dx);
        let yfnbs = grid.getForceNeighbors("y", dy);
        if (xfnbs.length > 0 || yfnbs.length > 0) {
            return grid;
        }

        // 返回false表示要继续搜索水平、垂直两个方向
        return false;
    }
    jump(cur, pre) {
        let startX = cur.x;
        let startY = cur.y;
        let dx = Math.sign(startX - pre.x);
        let dy = Math.sign(startY - pre.y);
        let offset = Math.floor(this.gridPixel / 2);

        if (dx != 0 && dy != 0) {
            let sGrid = pre;
            while (true) {
                //console.log("startXY", startX, startY, dx, dy);
                let resXY = this.jumpXY(sGrid, dx, dy);
                let drawPos = this.getDrawPos(sGrid.x, sGrid.y, sGrid.x + dx, sGrid.y + dy);
                drawArrow(this.subCtx, drawPos[0], drawPos[1], drawPos[2], drawPos[3], 3, undefined, undefined, undefined, "brown", true);
                if (resXY !== false) {
                    return resXY;
                }

                sGrid = this.getGrid(startX, startY);
                // 水平分量搜索
                let res = this.jumpX(startX, startY, dx);
                drawPos = this.getDrawPos(startX, startY, res.x, startY);
                //console.log("startXY, dx", startX, res.x);
                drawArrow(this.subCtx, drawPos[0], drawPos[1], drawPos[2], drawPos[3], 3, undefined, undefined, undefined, "brown", true);
                if (res.jpGrid) {
                    return sGrid;
                }

                // 垂直分量搜索
                res = this.jumpY(startX, startY, dy);
                //console.log("startXY, dy", startX, nStartY, res.y);
                drawPos = this.getDrawPos(startX, startY, startX, res.y);
                drawArrow(this.subCtx, drawPos[0], drawPos[1], drawPos[2], drawPos[3], 3, undefined, undefined, undefined, "brown", true);
                if (res.jpGrid) {
                    return sGrid;
                }

                // 继续斜走一格
                startX += dx;
                startY += dy;
            }
        } else if (dx != 0) {
            // 水平
            let res = this.jumpX(startX, startY, dx);
            //console.log("startX", startX, startY, res.x);
            let drawPos = this.getDrawPos(pre.x, pre.y, res.x, startY);
            drawArrow(this.subCtx, drawPos[0], drawPos[1], drawPos[2], drawPos[3], 3, undefined, undefined, undefined, "brown", true);
            return res.jpGrid;
        } else if (dy != 0) {
            let res = this.jumpY(startX, startY, dy);
            //console.log("startY", startX, startY, res.y);
            let drawPos = this.getDrawPos(pre.x, pre.y, startX, res.y);
            drawArrow(this.subCtx, drawPos[0], drawPos[1], drawPos[2], drawPos[3], 3, undefined, undefined, undefined, "brown", true);
            return res.jpGrid;
        }
    }
    // jps 寻路
    jps(jp) {
        //let nbs = this.pruneNbs(jp);
        let nbs = jp.getNeighbors();
        console.log("next nbs", jp.grid.x, jp.grid.y, nbs);
        for (let index = 0; index < nbs.length; index++) {
            let nb = nbs[index];
            let njpGrid = this.jump(nb, jp.grid);
            if (njpGrid) {
                let cost = calcDiagonal(njpGrid.x, njpGrid.y, jp.grid.x, jp.grid.y, 10);
                console.log("new jp", njpGrid.x, njpGrid.y, jp.grid.x, jp.grid.y, cost);
                this.updateGridNode(njpGrid.x, njpGrid.y, jp, cost);

                if (njpGrid.isEnd) {
                    console.log("找到终点跳点");
                    break;
                }
            }
        }
    }

    findPath() {
        this.setFinding(true);
        this.nodes = {};
        let minHeap = new MinHeap();
        this.minHeap = minHeap;

        let nodeNum = 0; // 访问的点个数
        let srcX = this.srcGrid.x;
        let srcY = this.srcGrid.y;
        let srcNode = this.newGridNode(srcX, srcY, null, 0);
        minHeap.push(srcNode);
        this.nodes[this.getPosIdx(srcX, srcY)] = srcNode;

        this.timerId = window.setInterval(() => {
            if (this.isPause) {
                return;
            }

            if (minHeap.isEmpty()) {
                clearInterval(this.timerId);
                alert("没有可搜索的节点!");
                return;
            }

            // 弹出代价最小的节点
            let node = minHeap.pop();
            console.log("pop", node.grid.x, node.grid.y);
            node.setClosed();

            let grid = node.grid;
            if (!grid.isStart && !grid.isEnd) {
                grid.fill("cyan");
            }
            nodeNum += 1;

            // 找到了终点
            if (grid.isEnd) {
                console.log("找到了终点! 搜索节点数：", nodeNum);
                clearInterval(this.timerId);

                // 回溯
                let pathLen = 0;
                let pathNode = node.p;
                while (pathNode) {
                    if (!pathNode.grid.isStart) {
                        pathNode.grid.fill("green");
                    }
                    pathNode = pathNode.p;
                    pathLen += 1;
                }
                return;
            }

            // 遍历该节点的邻居节点
            if (this.algorithm == 3) {
                this.jps(node);
            } else {
                this.astar(node);
            }
        }, this.interval);
    }
}
