#ifndef PRIORITY_QUEUE_HPP
#define PRIORITY_QUEUE_HPP

#include "MinHeap.hpp"

template <typename T>
struct PriorityItem {
    T data;
    long long priority; // Smaller priority value = extracted first (e.g. earliest timestamp)

    bool operator<(const PriorityItem<T>& other) const {
        return priority < other.priority;
    }
};

/**
 * Custom C++ Generic Priority Queue Implementation
 * Implemented using custom MinHeap.
 */
template <typename T>
class PriorityQueue {
private:
    MinHeap<PriorityItem<T>> heap;

public:
    void enqueue(const T& item, long long priority) {
        PriorityItem<T> pItem;
        pItem.data = item;
        pItem.priority = priority;
        heap.insert(pItem);
    }

    T dequeue() {
        return heap.extractMin().data;
    }

    T peek() const {
        return heap.peek().data;
    }

    size_t size() const { return heap.size(); }
    bool isEmpty() const { return heap.isEmpty(); }

    std::vector<T> toSortedVector() {
        MinHeap<PriorityItem<T>> temp = heap;
        std::vector<T> result;
        while (!temp.isEmpty()) {
            result.push_back(temp.extractMin().data);
        }
        return result;
    }
};

#endif // PRIORITY_QUEUE_HPP
