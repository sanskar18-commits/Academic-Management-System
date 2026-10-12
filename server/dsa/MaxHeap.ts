/**
 * Custom Generic Max-Heap Implementation
 * Implemented manually without third-party data structure libraries.
 */
export class MaxHeap<T> {
  private heap: T[] = [];
  private comparator: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.comparator = comparator || ((a: any, b: any) => (a > b ? -1 : a < b ? 1 : 0));
  }

  private parentIndex(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  private leftChildIndex(i: number): number {
    return 2 * i + 1;
  }

  private rightChildIndex(i: number): number {
    return 2 * i + 2;
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  public insert(value: T): void {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }

  public peek(): T | null {
    if (this.heap.length === 0) return null;
    return this.heap[0];
  }

  public extractMax(): T | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const root = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.siftDown(0);
    return root;
  }

  private bubbleUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = this.parentIndex(current);
      if (this.comparator(this.heap[current], this.heap[parent]) < 0) {
        this.swap(current, parent);
        current = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    let current = index;
    const length = this.heap.length;

    while (this.leftChildIndex(current) < length) {
      let largest = this.leftChildIndex(current);
      const right = this.rightChildIndex(current);

      if (right < length && this.comparator(this.heap[right], this.heap[largest]) < 0) {
        largest = right;
      }

      if (this.comparator(this.heap[largest], this.heap[current]) < 0) {
        this.swap(current, largest);
        current = largest;
      } else {
        break;
      }
    }
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public getElements(): T[] {
    return [...this.heap];
  }
}
