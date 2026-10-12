#ifndef QUEUE_HPP
#define QUEUE_HPP

#include <stdexcept>
#include <vector>

template <typename T>
struct Node {
    T value;
    Node* next;
    Node(const T& val) : value(val), next(nullptr) {}
};

/**
 * Custom C++ Generic FIFO Queue Implementation
 * Node-based linked list for true O(1) enqueue and O(1) dequeue.
 */
template <typename T>
class Queue {
private:
    Node<T>* head;
    Node<T>* tail;
    size_t count;

public:
    Queue() : head(nullptr), tail(nullptr), count(0) {}

    ~Queue() {
        clear();
    }

    void enqueue(const T& val) {
        Node<T>* newNode = new Node<T>(val);
        if (!tail) {
            head = newNode;
            tail = newNode;
        } else {
            tail->next = newNode;
            tail = newNode;
        }
        count++;
    }

    T dequeue() {
        if (!head) {
            throw std::runtime_error("Queue is empty");
        }
        Node<T>* temp = head;
        T val = temp->value;
        head = head->next;
        if (!head) {
            tail = nullptr;
        }
        delete temp;
        count--;
        return val;
    }

    T peek() const {
        if (!head) {
            throw std::runtime_error("Queue is empty");
        }
        return head->value;
    }

    size_t size() const { return count; }
    bool isEmpty() const { return count == 0; }

    std::vector<T> toVector() const {
        std::vector<T> result;
        Node<T>* curr = head;
        while (curr) {
            result.push_back(curr->value);
            curr = curr->next;
        }
        return result;
    }

    void clear() {
        while (head) {
            Node<T>* temp = head;
            head = head->next;
            delete temp;
        }
        tail = nullptr;
        count = 0;
    }
};

#endif // QUEUE_HPP
