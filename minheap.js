// 小顶堆

class MinHeap {
    constructor(cb) {
        this.queue = new Array();
        this.n = 0;             // 元素个数(注意：第0号位置不使用)
    }

    // 获取元素
    getElem(idx) {
        return this.queue[idx];
    }

    setElem(idx, elem) {
        elem.idx = idx;
        this.queue[idx] = elem;
    }

    delElem(idx) {
        let elem = this.queue[idx];
        elem.idx = -1;
        this.n--;
        this.queue[idx] = null;
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
        if (elemi.fn === elemj.fn) {
            return elemi.gn < elemj.gn;
        } else {
            return elemi.fn > elemj.fn;
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
