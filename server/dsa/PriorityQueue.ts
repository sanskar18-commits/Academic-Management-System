import { MinHeap } from "./MinHeap";

export interface PriorityQueueNode<T> {
  item: T;
  priority: number; // lower number = higher priority (or configurable)
}

/**
 * Custom Generic Priority Queue Implementation
 * Implemented using our custom MinHeap.
 * Default: Smaller priority value = extracted first (e.g. earliest timestamp or deadline).
 */
export class PriorityQueue<T> {
  private minHeap: MinHeap<PriorityQueueNode<T>>;

  constructor(comparator?: (a: PriorityQueueNode<T>, b: PriorityQueueNode<T>) => number) {
    this.minHeap = new MinHeap<PriorityQueueNode<T>>(
      comparator || ((a, b) => a.priority - b.priority)
    );
  }

  public enqueue(item: T, priority: number): void {
    this.minHeap.insert({ item, priority });
  }

  public dequeue(): T | null {
    const node = this.minHeap.extractMin();
    return node ? node.item : null;
  }

  public peek(): T | null {
    const node = this.minHeap.peek();
    return node ? node.item : null;
  }

  public peekWithPriority(): PriorityQueueNode<T> | null {
    return this.minHeap.peek();
  }

  public size(): number {
    return this.minHeap.size();
  }

  public isEmpty(): boolean {
    return this.minHeap.isEmpty();
  }

  /**
   * Drain queue and return items in priority order without mutating original
   */
  public toSortedArray(): T[] {
    const elements = this.minHeap.getElements();
    // Copy into a new heap to extract sequentially
    const tempHeap = new MinHeap<PriorityQueueNode<T>>((a, b) => a.priority - b.priority);
    for (const el of elements) {
      tempHeap.insert(el);
    }
    const result: T[] = [];
    while (!tempHeap.isEmpty()) {
      const node = tempHeap.extractMin();
      if (node) result.push(node.item);
    }
    return result;
  }
}
