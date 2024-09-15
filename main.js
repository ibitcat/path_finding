var map = null; // 地图对象

function start() {
    map = new GridMap(40);
    map.init();
    map.setSrc(0, 0);
    map.setDst(5, 5);
}

$("#randBlock").on("click", function () {
    let blockNum = parseInt($("#blockNum").val());
    map.randomBlocks(blockNum);
});

// 选择寻路算法
$("#algorithm").on("change", function () {
    map.algorithm = parseInt($(this).val());
});

// 选择运行速度
$("#interval").on("change", function () {
    map.interval = parseInt($(this).val());
});

// 是否动态权重
$("#dynWeight").click(function () {
    map.dynWeight = $(this).prop("checked");
});

// 是否斜向移动
$("#canDiagonal").on("click", function () {
    if ($(this).prop("checked")) {
        map.dirType = 8;
    } else {
        map.dirType = 4;
    }
});

$("#begin").on("click", function () {
    disablePanel(true);
    map.findPath();
});

$("#pause").on("click", function () {
    map.isPause = !map.isPause;
    $(this).text(isPause ? "继续" : "暂停");
});

$("#clear").on("click", function () {
    disablePanel(false);
    map.clear();
});

function disablePanel(v) {
    $("#randBlock").attr("disabled", v);
    $("#blockNum").attr("disabled", v);
    $("#interval").attr("disabled", v);
    $("#algorithm").attr("disabled", v);
    $("#hnType").attr("disabled", v);
    $("#dynWeight").attr("disabled", v);
    $("#canDiagonal").attr("disabled", v);
    $("#begin").attr("disabled", v);
}
