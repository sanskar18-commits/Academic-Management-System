#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>
#include "MinHeap.hpp"
#include "PriorityQueue.hpp"
#include "Queue.hpp"
#include "HashTable.hpp"

// Simple JSON-safe string escaping & parsing helper
struct AssignmentRecord {
    std::string id;
    std::string title;
    std::string subjectCode;
    std::string subjectName;
    long long dueTimestamp;
    int maxMarks;
};

struct SubmissionRecord {
    std::string submissionId;
    std::string assignmentTitle;
    std::string studentName;
    std::string studentRoll;
    std::string section;
    long long submittedTimestamp;
};

void runVerificationTests() {
    std::cout << "==================================================" << std::endl;
    std::cout << "   C++ NATIVE DSA ENGINE VERIFICATION SUITE       " << std::endl;
    std::cout << "==================================================" << std::endl;

    // 1. MinHeap Test
    std::cout << "\n[1/4] Testing C++ MinHeap..." << std::endl;
    MinHeap<int> minHeap;
    int testVals[] = {45, 12, 89, 3, 27};
    for (int v : testVals) {
        minHeap.insert(v);
    }
    std::vector<int> minExtracted;
    while (!minHeap.isEmpty()) {
        minExtracted.push_back(minHeap.extractMin());
    }
    if (minExtracted.size() != 5 || minExtracted[0] != 3 || minExtracted[4] != 89) {
        std::cerr << "C++ MinHeap test FAILED!" << std::endl;
        exit(1);
    }
    std::cout << "✓ C++ MinHeap PASSED (Extracted: 3, 12, 27, 45, 89)" << std::endl;

    // 2. PriorityQueue Test
    std::cout << "\n[2/4] Testing C++ PriorityQueue (Deadline Scheduling)..." << std::endl;
    PriorityQueue<std::string> pq;
    pq.enqueue("Assignment 3 - Cloud Architecture", 7000);
    pq.enqueue("Assignment 1 - Data Structures BST", 1000);
    pq.enqueue("Assignment 2 - DBMS Normalization", 3000);

    auto sorted = pq.toSortedVector();
    if (sorted[0] != "Assignment 1 - Data Structures BST") {
        std::cerr << "C++ PriorityQueue test FAILED!" << std::endl;
        exit(1);
    }
    std::cout << "✓ C++ PriorityQueue PASSED (Top item: " << sorted[0] << ")" << std::endl;

    // 3. FIFO Queue Test
    std::cout << "\n[3/4] Testing C++ FIFO Queue (Grading Backlog)..." << std::endl;
    Queue<std::string> q;
    q.enqueue("Sub 1: Aarav Sharma");
    q.enqueue("Sub 2: Priya Patel");
    q.enqueue("Sub 3: Rohan Mehta");

    std::string first = q.dequeue();
    if (first != "Sub 1: Aarav Sharma" || q.size() != 2) {
        std::cerr << "C++ FIFO Queue test FAILED!" << std::endl;
        exit(1);
    }
    std::cout << "✓ C++ FIFO Queue PASSED (First evaluated: " << first << ")" << std::endl;

    // 4. HashTable Test
    std::cout << "\n[4/4] Testing C++ HashTable (Entity Indexing)..." << std::endl;
    HashTable<std::string> ht(8);
    ht.set("BCA-301", "Introduction to Data Structures");
    ht.set("BCA-302", "Introduction to Database Management System");
    ht.set("BCA-303", "Digital Logic Design");

    std::string val;
    if (!ht.get("BCA-301", val) || val != "Introduction to Data Structures") {
        std::cerr << "C++ HashTable test FAILED!" << std::endl;
        exit(1);
    }
    std::cout << "✓ C++ HashTable PASSED (Lookup BCA-301: " << val << ")" << std::endl;

    std::cout << "\n==================================================" << std::endl;
    std::cout << "  ALL C++ NATIVE DSA TESTS PASSED (4/4)!          " << std::endl;
    std::cout << "==================================================" << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc > 1 && std::string(argv[1]) == "--test") {
        runVerificationTests();
        return 0;
    }

    std::cout << "C++ DSA Engine for Academic Track v1.0" << std::endl;
    std::cout << "Usage: dsa_engine.exe --test" << std::endl;
    return 0;
}
