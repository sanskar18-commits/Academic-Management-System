#ifndef MIN_HEAP_HPP
#define MIN_HEAP_HPP

#include <vector>
#include <stdexcept>
#include <functional>

/**
 * Custom C++ Generic Min-Heap Implementation
 * Implemented manually without <queue> or STL heap helpers.
 */
template <typename T, typename Compare = std::less<T>>
class MinHeap {
private:
    std::vector<T> heap;
    Compare comp;

    int parent(int i) const { return (i - 1) / 2; }
    int leftChild(int i) const { return 2 * i + 1; }
    int rightChild(int i) const { return 2 * i + 2; }

    void swap(int i, int j) {
        T temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    void bubbleUp(int index) {
        int current = index;
        while (current > 0) {
            int p = parent(current);
            // If current element is less than parent
            if (comp(heap[current], heap[p])) {
                swap(current, p);
                current = p;
            } else {
                break;
            }
        }
    }

    void siftDown(int index) {
        int current = index;
        int n = static_cast<int>(heap.size());

        while (leftChild(current) < n) {
            int smallest = leftChild(current);
            int right = rightChild(current);

            if (right < n && comp(heap[right], heap[smallest])) {
                smallest = right;
            }

            if (comp(heap[smallest], heap[current])) {
                swap(current, smallest);
                current = smallest;
            } else {
                break;
            }
        }
    }

public:
    MinHeap(Compare comparator = Compare()) : comp(comparator) {}

    void insert(const T& value) {
        heap.push_back(value);
        bubbleUp(static_cast<int>(heap.size()) - 1);
    }

    T peek() const {
        if (heap.empty()) {
            throw std::runtime_error("Heap is empty");
        }
        return heap[0];
    }

    T extractMin() {
        if (heap.empty()) {
            throw std::runtime_error("Heap is empty");
        }
        if (heap.size() == 1) {
            T root = heap.back();
            heap.pop_back();
            return root;
        }

        T root = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        siftDown(0);
        return root;
    }

    size_t size() const { return heap.size(); }
    bool isEmpty() const { return heap.empty(); }

    std::vector<T> getElements() const { return heap; }
};

#endif // MIN_HEAP_HPP
