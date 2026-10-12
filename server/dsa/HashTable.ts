interface HashEntry<K, V> {
  key: K;
  value: V;
}

/**
 * Custom Generic Hash Table Implementation
 * Features:
 * - Polynomial rolling hash function with large prime multiplier
 * - Separate chaining collision resolution
 * - Dynamic capacity doubling when load factor exceeds 0.75
 */
export class HashTable<K, V> {
  private buckets: HashEntry<K, V>[][];
  private capacity: number;
  private count: number = 0;
  private readonly loadFactorThreshold = 0.75;

  constructor(initialCapacity: number = 16) {
    this.capacity = Math.max(initialCapacity, 4);
    this.buckets = Array.from({ length: this.capacity }, () => []);
  }

  /**
   * Polynomial rolling hash calculation
   */
  private hashKey(key: K): number {
    const str = typeof key === "string" ? key : JSON.stringify(key);
    let hash = 0;
    const prime = 31;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * prime + str.charCodeAt(i)) >>> 0;
    }
    return hash % this.capacity;
  }

  private resize(newCapacity: number): void {
    const oldBuckets = this.buckets;
    this.capacity = newCapacity;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.count = 0;

    for (const bucket of oldBuckets) {
      for (const entry of bucket) {
        this.set(entry.key, entry.value);
      }
    }
  }

  public set(key: K, value: V): void {
    if (this.count / this.capacity >= this.loadFactorThreshold) {
      this.resize(this.capacity * 2);
    }

    const index = this.hashKey(key);
    const bucket = this.buckets[index];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket[i].value = value;
        return;
      }
    }

    bucket.push({ key, value });
    this.count++;
  }

  public get(key: K): V | undefined {
    const index = this.hashKey(key);
    const bucket = this.buckets[index];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        return bucket[i].value;
      }
    }
    return undefined;
  }

  public has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  public delete(key: K): boolean {
    const index = this.hashKey(key);
    const bucket = this.buckets[index];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket.splice(i, 1);
        this.count--;
        return true;
      }
    }
    return false;
  }

  public size(): number {
    return this.count;
  }

  public keys(): K[] {
    const result: K[] = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        result.push(entry.key);
      }
    }
    return result;
  }

  public values(): V[] {
    const result: V[] = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        result.push(entry.value);
      }
    }
    return result;
  }

  public entries(): [K, V][] {
    const result: [K, V][] = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        result.push([entry.key, entry.value]);
      }
    }
    return result;
  }

  public clear(): void {
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.count = 0;
  }
}
