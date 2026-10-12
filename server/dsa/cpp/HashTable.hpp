#ifndef HASH_TABLE_HPP
#define HASH_TABLE_HPP

#include <string>
#include <vector>
#include <stdexcept>

template <typename K, typename V>
struct HashEntry {
    K key;
    V value;
};

/**
 * Custom C++ Generic Hash Table Implementation
 * Features:
 * - Polynomial rolling hash function
 * - Separate chaining collision resolution
 * - Dynamic capacity doubling
 */
template <typename V>
class HashTable {
private:
    std::vector<std::vector<HashEntry<std::string, V>>> buckets;
    size_t capacity;
    size_t count;
    const double loadFactorThreshold = 0.75;

    size_t hashKey(const std::string& key) const {
        size_t hash = 0;
        const size_t prime = 31;
        for (char c : key) {
            hash = hash * prime + static_cast<unsigned char>(c);
        }
        return hash % capacity;
    }

    void resize(size_t newCapacity) {
        auto oldBuckets = buckets;
        capacity = newCapacity;
        buckets.clear();
        buckets.resize(capacity);
        count = 0;

        for (const auto& bucket : oldBuckets) {
            for (const auto& entry : bucket) {
                set(entry.key, entry.value);
            }
        }
    }

public:
    HashTable(size_t initialCap = 16) : capacity(initialCap < 4 ? 4 : initialCap), count(0) {
        buckets.resize(capacity);
    }

    void set(const std::string& key, const V& val) {
        if (static_cast<double>(count) / capacity >= loadFactorThreshold) {
            resize(capacity * 2);
        }

        size_t idx = hashKey(key);
        for (auto& entry : buckets[idx]) {
            if (entry.key == key) {
                entry.value = val;
                return;
            }
        }

        buckets[idx].push_back({key, val});
        count++;
    }

    bool get(const std::string& key, V& outVal) const {
        size_t idx = hashKey(key);
        for (const auto& entry : buckets[idx]) {
            if (entry.key == key) {
                outVal = entry.value;
                return true;
            }
        }
        return false;
    }

    bool has(const std::string& key) const {
        V temp;
        return get(key, temp);
    }

    bool remove(const std::string& key) {
        size_t idx = hashKey(key);
        auto& bucket = buckets[idx];
        for (size_t i = 0; i < bucket.size(); ++i) {
            if (bucket[i].key == key) {
                bucket.erase(bucket.begin() + i);
                count--;
                return true;
            }
        }
        return false;
    }

    size_t size() const { return count; }
    bool isEmpty() const { return count == 0; }
};

#endif // HASH_TABLE_HPP
