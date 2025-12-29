import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../src/models/User.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const dummyTranscripts = [
  {
    videoId: "dQw4w9WgXcQ",
    videoTitle: "Learn JavaScript Basics",
    transcript: `Hello everyone, welcome to this JavaScript fundamentals course. Today we're going to cover the basic concepts that every JavaScript developer should know.

First, let's talk about variables. In JavaScript, we have three ways to declare variables: var, let, and const. The var keyword is the oldest way to declare variables and has function scope. The let keyword was introduced in ES6 and has block scope. The const keyword is also ES6 and is used for variables that shouldn't be reassigned.

Next, let's discuss data types. JavaScript has several primitive data types: String, Number, Boolean, Null, Undefined, and Symbol. We also have complex data types like Objects and Arrays.

Functions are a crucial part of JavaScript. A function is a block of code designed to perform a particular task. You can define a function using the function keyword, or using arrow functions which is a newer syntax.

Control flow statements like if, else, and switch help you make decisions in your code. Loops like for, while, and do-while let you repeat code blocks.

Finally, let's talk about objects and arrays. Objects are collections of key-value pairs, and arrays are ordered collections of values. Both are fundamental to JavaScript programming.`,
    language: "en",
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isFavorite: true,
  },
  {
    videoId: "jNQXAC9IVRw",
    videoTitle: "React Hooks Explained",
    transcript: `Welcome to this comprehensive guide on React Hooks. React Hooks are functions that let you hook into React features from function components.

The useState Hook is the most basic hook. It lets you add state to functional components. Before hooks, you had to use class components to have state. With useState, you can now have state in functional components.

The useEffect Hook lets you perform side effects in function components. Side effects are things like fetching data, setting up subscriptions, or manually changing the DOM. useEffect replaces componentDidMount, componentDidUpdate, and componentWillUnmount combined.

The useContext Hook lets you consume context without a Consumer component. Context provides a way to pass data through the component tree without having to pass props down manually at every level.

The useReducer Hook is similar to useState, but it's used for more complex state logic. It takes a reducer function and an initial state, and returns the current state and a dispatch function.

The useCallback Hook returns a memoized callback function. It's useful for optimizing performance when passing callbacks to child components.

The useMemo Hook returns a memoized value. It only recomputes the value when one of the dependencies has changed. This is useful for expensive computations.

Custom Hooks are JavaScript functions whose names start with "use" and may call other Hooks. They let you extract component logic into reusable functions.`,
    language: "en",
    savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    isFavorite: false,
  },
  {
    videoId: "watch?v=test123",
    videoTitle: "Node.js Express Tutorial",
    transcript: `Hello, in this video we're going to learn about Express.js, which is a popular web framework for Node.js.

Express is a minimal and flexible Node.js web application framework. It provides a robust set of features for building web and mobile applications.

First, let's install Express using npm. You can create a new Node.js project and install Express using the npm package manager.

The basic structure of an Express application involves creating an instance of the Express application, defining routes, and starting a server to listen for requests.

Routes in Express are defined using methods like app.get, app.post, app.put, and app.delete. Each route is associated with a handler function that sends a response to the client.

Middleware is a crucial concept in Express. Middleware functions are functions that have access to the request object, the response object, and the next function in the application's request-response cycle.

You can use middleware for various purposes like parsing request bodies, logging requests, authentication, and error handling.

Express also supports templating engines like EJS, Pug, and Handlebars for rendering dynamic HTML pages.

Finally, let's talk about connecting to databases. Express can work with various databases like MongoDB, MySQL, and PostgreSQL through their respective Node.js drivers or ORM libraries.`,
    language: "en",
    savedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isFavorite: false,
  },
];

const dummySummaries = [
  {
    videoId: "video123",
    videoTitle: "Python Data Structures",
    summary: `# Python Data Structures Summary

## Key Topics
- Lists and Tuples
- Dictionaries and Sets
- Stacks and Queues
- Linked Lists

## Core Concepts
**Lists**: Ordered, mutable collections of items. Support indexing and slicing.

**Tuples**: Immutable sequences of items. Used when you need fixed collections.

**Dictionaries**: Key-value pairs for fast lookups and data organization.

**Sets**: Unordered collections of unique items. Useful for membership testing and eliminating duplicates.

**Stacks**: Last-In-First-Out (LIFO) data structure. Push and pop operations.

**Queues**: First-In-First-Out (FIFO) data structure. Enqueue and dequeue operations.

**Linked Lists**: Dynamic data structures where elements are connected via pointers.

## Common Operations
- Insertion and deletion of elements
- Searching and sorting
- Traversal and iteration
- Memory efficiency considerations`,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    isFavorite: true,
  },
  {
    videoId: "video456",
    videoTitle: "CSS Flexbox Guide",
    summary: `# Flexbox Layout Guide

## Key Topics
- Flex Container and Items
- Justify Content and Align Items
- Flex Direction
- Flex Wrap
- Flex Grow, Shrink, and Basis

## Core Concepts
**Flex Container**: Parent element with display: flex property.

**Flex Items**: Children of the flex container that are automatically laid out.

**Main Axis and Cross Axis**: The direction along which flex items are laid out.

**Justify Content**: Controls alignment of flex items along the main axis.
- flex-start, flex-end, center, space-between, space-around, space-evenly

**Align Items**: Controls alignment of flex items along the cross axis.
- stretch, flex-start, flex-end, center, baseline

**Flex Direction**: Controls the direction of the main axis.
- row, column, row-reverse, column-reverse

**Flex Wrap**: Controls whether flex items wrap to multiple lines.

## Practical Tips
- Use flex for responsive layouts
- Combine with media queries for mobile designs
- Flexbox is better than floats for layouts`,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    isFavorite: false,
  },
  {
    videoId: "video789",
    videoTitle: "Async/Await in JavaScript",
    summary: `# Async/Await Comprehensive Guide

## Key Topics
- Promises and Their States
- Async Functions
- Await Expression
- Error Handling with Try-Catch
- Promise Chains vs Async/Await

## Core Concepts
**Promises**: Objects representing the eventual completion of an asynchronous operation.
States: Pending, Fulfilled, Rejected

**Async Functions**: Functions declared with the async keyword always return a Promise.

**Await**: Expression that pauses execution until a Promise settles.

**Error Handling**: Use try-catch blocks to handle rejections in async functions.

## Advantages of Async/Await
- More readable than promise chains
- Easier to debug
- Better error handling
- Sequential and parallel execution patterns

## Common Patterns
- Fetching data from APIs
- Database operations
- File I/O operations
- Timing and delays`,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isFavorite: false,
  },
];

const dummyDownloads = [
  {
    videoId: "download1",
    videoTitle: "HTML5 Complete Guide - Transcript",
    fileType: "transcript",
    fileName: "html5_transcript.txt",
    fileSize: 45230,
    content: `HTML5 is the latest version of the HyperText Markup Language. It provides new semantic elements for better document structure and improved accessibility.

Key elements include: header, nav, main, article, section, aside, footer. These semantic elements help search engines and assistive technologies understand the content better.

HTML5 also introduced new form elements and input types: email, number, date, time, range, color, and more.

The canvas element allows for drawing graphics using JavaScript. The video and audio elements provide native support for multimedia content without plugins.

Data attributes allow you to store custom data in HTML elements using the data-* syntax.`,
    downloadedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    videoId: "download2",
    videoTitle: "MongoDB Basics - Summary",
    fileType: "summary",
    fileName: "mongodb_summary.txt",
    fileSize: 32156,
    content: `# MongoDB Basics Summary

MongoDB is a popular NoSQL database that stores data in JSON-like documents.

Collections: MongoDB organizes documents into collections, similar to tables in SQL databases.

Documents: Each document is a set of key-value pairs stored in BSON format (Binary JSON).

CRUD Operations: Create, Read, Update, Delete operations are fundamental to MongoDB.

Indexing: MongoDB supports indexing to improve query performance.

Aggregation: MongoDB provides an aggregation framework for data processing and analysis.

Replication: Data can be replicated across multiple servers for redundancy and high availability.

Sharding: Large datasets can be distributed across multiple machines for scalability.`,
    downloadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    videoId: "download3",
    videoTitle: "Git and GitHub Workflow - Transcript",
    fileType: "transcript",
    fileName: "git_github_transcript.txt",
    fileSize: 56342,
    content: `Git is a distributed version control system that helps track changes in your code.

Repository: A collection of files and folders with a complete history of changes.

Commit: A snapshot of your code at a specific point in time.

Branch: A separate line of development that allows you to work on features independently.

Merge: Combining changes from one branch into another.

Pull Request: A way to propose changes and get feedback before merging.

GitHub is a platform for hosting Git repositories and collaborating with other developers.

Remote: A version of your repository hosted on a server like GitHub.

Clone: Creating a local copy of a remote repository.

Push: Sending your local commits to the remote repository.

Pull: Fetching and merging changes from the remote repository.`,
    downloadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Find or create a test user
    let user = await User.findOne({ email: "test@example.com" });

    if (!user) {
      user = new User({
        googleId: "test-user-123",
        name: "Test User",
        email: "test@example.com",
        picture: "https://via.placeholder.com/150",
        accountType: "Learner",
        stats: {
          totalWatchTime: 3600,
          totalQuizzesSolved: 5,
          topicsCleared: ["JavaScript", "React", "HTML"],
        },
      });
    }

    // Add dummy transcripts
    user.transcripts = [...(user.transcripts || []), ...dummyTranscripts];

    // Add dummy summaries
    user.summaries = [...(user.summaries || []), ...dummySummaries];

    // Add dummy downloads
    user.downloads = [...(user.downloads || []), ...dummyDownloads];

    // Save the user
    await user.save();

    console.log(`✅ Successfully seeded database with dummy files for ${user.email}`);
    console.log(`   📄 Transcripts: ${user.transcripts.length}`);
    console.log(`   📝 Summaries: ${user.summaries.length}`);
    console.log(`   📥 Downloads: ${user.downloads.length}`);

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding database:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
