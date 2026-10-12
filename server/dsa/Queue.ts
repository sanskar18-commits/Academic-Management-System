interface QueueNode<T> {
  value: T;
  next: QueueNode<T> | null;
}

/**
 * Custom Generic FIFO Queue Implementation
 * Node-based linked list for true O(1) enqueue and O(1) dequeue.
 * No array reallocation or shift penalty.
 */
export class Queue<T> {
  private head: QueueNode<T> | null = null;
  private tail: QueueNode<T> | null = null;
  private _size: number = 0;

  public enqueue(value: T): void {
    const newNode: QueueNode<T> = { value, next: null };
    if (!this.tail) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this._size++;
  }

  public dequeue(): T | null {
    if (!this.head) {
      return null;
    }
    const removedValue = this.head.value;
    this.head = this.head.next;
    if (!this.head) {
      this.tail = null;
    }
    this._size--;
    return removedValue;
  }

  public peek(): T | null {
    return this.head ? this.head.value : null;
  }

  public size(): number {
    return this._size;
  }

  public isEmpty(): boolean {
    return this._size === 0;
  }

  public toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  public clear(): void {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }
}
