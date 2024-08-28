// 小顶堆

class MinHeap {
    constructor(cb) {
        this.queue = new Array();
        this.n = 0;             // 元素个数(注意：第0号位置不使用)
        this.on = cb;           // 元素变化的回调
    }

    // 获取元素
    getElem(idx) {
        return this.queue[idx];
    }

    setElem(idx, elem) {
        elem.idx = idx;
        this.queue[idx] = elem;
        if (this.on) {
            this.on(elem);
        }
    }

    delElem(idx) {
        let elem = this.queue[idx];
        elem.idx = -1;
        this.n--;
        this.queue[idx] = null;

        if (this.on) {
            this.on(elem);
        }
        return elem;
    }

    isEmpty() {
        return this.n === 0;
    }

    // 交换元素
    exchange(i, j) {
        let elemi = this.queue[i];
        let elemj = this.queue[j];
        this.setElem(i, elemj);
        this.setElem(j, elemi);
    }

    // 插入元素
    // elem = {fn,g,h}
    push(elem) {
        this.setElem(++this.n, elem);
        this.swim(this.n);
    }

    // 弹出元素
    pop() {
        if (this.n === 0) {
            return null;
        }
        let elem = this.delElem(1);
        if (this.n > 0) {
            this.setElem(1, this.queue[this.n + 1])
            this.queue[this.n + 1] = null;
        }
        this.sink(1);
        return elem;
    }

    // 删除元素
    remove(i) {
        if (i > this.n || i < 1) {
            return null;
        }

        if (i === this.n) {
            this.delElem(i);
            return elem;
        }
        if (i === 1) {
            return this.pop();
        } else {
            let elem = this.queue[this.n];
            this.exchange(i, this.n);
            this.delElem(this.n);

            if (this.compare(i >> 1, i)) {
                // 父节点比i的代价大，则上浮
                this.swim(i);
            } else {
                this.sink(i);
            }
            return elem;
        }
    }

    // 更新元素
    update(idx, elem) {
        this.setElem(idx, elem);

        if (idx == 1) {
            this.sink(idx);
        } else {
            if (this.compare(idx >> 1, idx)) {
                // 父节点比i的代价大，则上浮
                this.swim(idx);
            } else {
                this.sink(idx);
            }
        }
    }

    // 比较两个元素的大小(i>j)
    compare(i, j) {
        let elemi = this.queue[i];
        let elemj = this.queue[j];
        if (elemi.f === elemj.f) {
            return elemi.g < elemj.g;
        } else {
            return elemi.f > elemj.f;
        }
    }

    // 上浮(如果父节点大于子节点，则交换)
    swim(i) {
        while (i > 1 && this.compare(i >> 1, i)) {
            this.exchange(i, i >> 1);
            i >>= 1;
        }
    }

    // 下沉
    sink(i) {
        while (i << 1 <= this.n) {
            let j = i << 1;
            if (j < this.n && this.compare(j, j + 1)) {
                j++;
            }
            if (this.compare(j, i)) {
                break;
            }
            this.exchange(i, j);
            i = j;
        }
    }
}

// test minHeap
function random(range) {
    return Math.floor(Math.random() * range) + 1
}

function test() {
    console.log("test--------->");
    let minHeap = new MinHeap();

    // test push
    minHeap.push({ f: 70, g: 30 });
    minHeap.push({ f: 59, g: 78 });
    minHeap.push({ f: 41, g: 49 });
    minHeap.push({ f: 98, g: 39 });
    minHeap.push({ f: 4, g: 75 });
    minHeap.push({ f: 16, g: 51 });
    minHeap.push({ f: 14, g: 34 });
    minHeap.push({ f: 51, g: 47 });
    minHeap.push({ f: 41, g: 68 });
    minHeap.push({ f: 5, g: 51 });
    console.log(minHeap.compare(4, 4 + 1));

    // test random push
    // for (var i = 0; i < 10; i++) {
    //     let elem = { f: random(100), g: random(100) };
    //     console.log(elem);
    //     minHeap.push(elem);
    // }
    console.log(minHeap.queue);

    // test pop
    // console.log("\ntest pop--------->");
    // console.log(minHeap.pop());
    // console.log(minHeap);

    // test remove
    // console.log("\ntest remove--------->");
    // minHeap.remove(random(10));
    // console.log(minHeap);

    // test update
    console.log("\ntest update--------->");
    let index = 1; //random(10);
    let elem = { f: random(100), g: random(100) }
    console.log(index, elem);
    minHeap.update(index, { f: 50, g: 16 });
    console.log(minHeap);
}

//test();
