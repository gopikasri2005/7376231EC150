const typeWeights = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function computePriorityScore(notification) {
  const weight = typeWeights[notification.Type] || 1;
  const time = new Date(notification.Timestamp).getTime();
  return weight * 1e12 + (Number.isFinite(time) ? time : 0);
}

class MinHeap {
  constructor(compare) {
    this.compare = compare;
    this.data = [];
  }

  size() {
    return this.data.length;
  }

  push(item) {
    this.data.push(item);
    this._siftUp(this.data.length - 1);
  }

  pop() {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._siftDown(0);
    }
    return top;
  }

  toArray() {
    return [...this.data];
  }

  _siftUp(index) {
    let child = index;
    while (child > 0) {
      const parent = Math.floor((child - 1) / 2);
      if (this.compare(this.data[child], this.data[parent]) < 0) {
        [this.data[parent], this.data[child]] = [this.data[child], this.data[parent]];
        child = parent;
      } else {
        break;
      }
    }
  }

  _siftDown(index) {
    const length = this.data.length;
    let parent = index;

    while (true) {
      let left = parent * 2 + 1;
      let right = parent * 2 + 2;
      let smallest = parent;

      if (left < length && this.compare(this.data[left], this.data[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.data[right], this.data[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === parent) break;
      [this.data[parent], this.data[smallest]] = [this.data[smallest], this.data[parent]];
      parent = smallest;
    }
  }
}

export function selectTopNotifications(notifications, n = 10) {
  const heap = new MinHeap((a, b) => a.score - b.score);

  for (const notification of notifications) {
    const score = computePriorityScore(notification);
    heap.push({ notification, score });

    if (heap.size() > n) {
      heap.pop();
    }
  }

  return heap
    .toArray()
    .sort((a, b) => b.score - a.score)
    .map((item) => item.notification);
}

export function notificationLabel(notification) {
  return `${notification.Type} • ${notification.Message}`;
}
