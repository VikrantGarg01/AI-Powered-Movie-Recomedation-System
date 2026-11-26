# CinePulse — Full-Stack Technology Stack & Academic Syllabus Architecture

Comprehensive technical documentation detailing the frameworks, libraries, database engines, data science toolchains, mathematical formulations, and syllabus cross-reference mappings powering the **CinePulse AI-Driven Movie Recommendation Platform**.

---

## 1. System Architecture Overview

CinePulse is engineered as a decoupled, multi-tier full-stack application integrating an authentic Machine Learning engine with a high-throughput REST API backend and a cinematic frontend.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLIENT TIER (React 18 + Vite)                         │
│  • Cinema Design System (Tailwind CSS 3)  • Context State Persistence       │
│  • Client-Side Vector KNN Fallback Engine • Modular View & Modal Components │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST / JSON (Bearer JWT)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY & BACKEND TIER (Express.js)                  │
│  • Node.js v24 (ES Modules)               • JWT Authentication & Bcrypt     │
│  • Winston Structured Logging & Morgan    • Rate Limiting & Helmet Security │
│  • Multer Multipart Media File Upload     • Centralized Error Middleware    │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼                                     ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│     DATABASE TIER (MongoDB v9)       │  │    MACHINE LEARNING ENGINE (KNN)  │
│ • Mongoose 8.x ODM                   │  │ • Multi-attribute TF-IDF Soup     │
│ • Compound & Full-Text Text Indexes  │  │ • L2-Normalized Cosine Metric     │
│ • User, Movie, Rating, Watchlist     │  │ • Bayesian Rating Prior Smoothing │
│ • Aggregation Pipelines & Pre-hooks  │  │ • Scikit-Learn Python Pipeline    │
└──────────────────────────────────────┘  └───────────────────────────────────┘
```

---

## 2. Technology Stack Breakdown

### 2.1. Frontend Tier
| Technology | Version | Purpose in Project |
| :--- | :--- | :--- |
| **React.js** | `^18.3.1` | Core declarative UI library utilizing Functional Components, Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useContext`), and Virtual DOM rendering. |
| **Vite** | `^6.0.1` | Next-generation frontend build tool providing Hot Module Replacement (HMR) and optimized Rollup production bundling. Configured with reverse proxy for `/api` and `/uploads`. |
| **Tailwind CSS** | `^3.4.15` | Utility-first styling framework configured with a custom dark cinematic theme (`cinema-*` color palette, custom gradients, frosted glassmorphism). |
| **React Router DOM** | `^6.28.0` | Client-side declarative routing (`/`, `/discover`, `/movie/:id`, `/recommendations`, `/watchlist`, `/profile`, `/login`). |
| **Lucide React** | `^0.460.0` | Comprehensive SVG icon set for modern interactive media controls and badges. |
| **Context API** | Native | Global state management architecture across `AuthContext`, `MovieContext`, and `ToastContext`. |
| **Web Storage API** | Native | Browser `localStorage` caching ensuring immediate user session persistence and offline fallback. |

---

### 2.2. Backend Tier (Node.js & Express REST API)
| Technology | Version | Purpose in Project |
| :--- | :--- | :--- |
| **Node.js** | `v24.21.0` | Asynchronous, non-blocking event-driven JavaScript runtime executing the backend server (ES Module mode: `"type": "module"`). |
| **Express.js** | `^4.21.2` | Minimalist web application framework for routing, status code delivery, body parsing, and RESTful API endpoint design. |
| **JSON Web Token (JWT)** | `^9.0.2` | Stateless cryptographic authentication tokens signed with HMAC-SHA256 (`jwt.sign`, `jwt.verify`) for protected endpoints. |
| **Bcrypt.js** | `^2.4.3` | Cryptographic adaptive password hashing algorithm utilizing salted one-way key derivation (`bcrypt.genSalt(10)`, `bcrypt.hash`). |
| **Multer** | `^1.4.5-lts.1` | Multipart/form-data middleware handling direct profile avatar image uploads with file type MIME filtering and disk storage. |
| **Winston** | `^3.17.0` | Multi-transport structured logger recording formatted runtime errors and server events to both console and disk logs. |
| **Morgan** | `^1.10.0` | HTTP request logging middleware tracing incoming methods, route URLs, latency, and HTTP status codes. |
| **Helmet** | `^8.0.0` | HTTP security headers middleware protecting against Cross-Site Scripting (XSS), Clickjacking, and MIME-sniffing. |
| **Express Rate Limit** | `^7.4.1` | IP-based request throttle preventing Denial-of-Service (DoS) and brute-force authentication attacks. |
| **CORS** | `^2.8.5` | Cross-Origin Resource Sharing configuration enabling secured cross-port requests between Vite (`5173`) and Express (`5001`). |

---

### 2.3. Database Tier (MongoDB & Mongoose)
| Technology | Version | Purpose in Project |
| :--- | :--- | :--- |
| **MongoDB** | `v9.0.2` | Distributed document-oriented NoSQL database persisting user credentials, movie catalog metadata, user rating matrices, and watchlists. |
| **Mongoose ODM** | `^8.8.2` | Object Data Modeling library enforcing schema definitions, type casting, pre-save middleware hooks, virtuals, and compound indexing. |
| **Compound Indexes** | Database Index | Compound indexes (`{ userId: 1, movieId: 1 }` with `{ unique: true }`) guaranteeing referential integrity and $O(\log N)$ query speed. |
| **Text Indexing** | Full-Text Engine | Multi-field text index on `Movie` (`title`, `description`, `director`, `similarityKeywords`) supporting regex and keyword search. |

---

### 2.4. Machine Learning & Data Science Toolchain
| Library / Tool | Version | Purpose in Project |
| :--- | :--- | :--- |
| **Python** | `3.12.10` | Academic Data Science environment executing feature extraction, model fitting, and evaluation notebooks. |
| **Scikit-Learn** | `1.9.1` | Core ML library supplying `NearestNeighbors`, `TfidfVectorizer`, `PCA`, `KMeans`, `Ridge`, and metric validation functions. |
| **Pandas** | `3.1.1` | High-performance tabular data manipulation framework for structuring movie metadata, ratings, and feature soups. |
| **NumPy** | `2.5.4` | Fundamental array computing package powering linear algebra dot products, Euclidean distances, and vector norms. |
| **SciPy** | `1.18.1` | Scientific computing library supporting sparse matrix representations (`scipy.sparse.csr_matrix`). |
| **Matplotlib** | `3.11.2` | Data visualization library plotting 2D PCA cluster scatter graphs and evaluation distributions. |
| **Jupyter Notebook** | `nbformat v4` | Interactive educational notebook (`movie_recommendation_knn.ipynb`) with step-by-step code, markdown, and visual outputs. |

---

## 3. Mathematical Models & Formulations

### 3.1. Term Frequency – Inverse Document Frequency (TF-IDF)
For each movie $d$ in catalog $D$ and term $t$:
$$\text{TF}(t, d) = 1 + \log(\text{count}(t, d)) \quad \text{for count} > 0$$
$$\text{IDF}(t, D) = \log\left(\frac{N + 1}{\text{DF}(t) + 1}\right) + 1$$
$$\mathbf{V}_{d, t} = \text{TF}(t, d) \times \text{IDF}(t, D)$$
$$\mathbf{V}_{\text{normalized}} = \frac{\mathbf{V}}{\|\mathbf{V}\|_2} = \frac{\mathbf{V}}{\sqrt{\sum_{i=1}^{M} V_i^2}}$$

### 3.2. Cosine Similarity & Cosine Distance
Given two $L_2$-normalized movie vectors $\mathbf{u}$ and $\mathbf{v}$:
$$\text{Cosine Similarity}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \sum_{i=1}^{M} u_i v_i$$
$$\text{Cosine Distance}(\mathbf{u}, \mathbf{v}) = 1 - \text{Cosine Similarity}(\mathbf{u}, \mathbf{v})$$

### 3.3. K-Nearest Neighbors (KNN) Retrieval
Given a query item or user preference vector $\mathbf{q}$ and distance metric $D(\mathbf{q}, \mathbf{x}_i)$:
$$\mathcal{N}_K(\mathbf{q}) = \operatorname{arg\,min}_{S \subset D, |S|=K} \sum_{i \in S} D(\mathbf{q}, \mathbf{x}_i)$$

### 3.4. Dynamic User Preference Profile Synthesis
$$\mathbf{U}_{\text{profile}} = \sum_{m \in \text{Watched}} (\text{Rating}_m - 2.5) \cdot \mathbf{V}_m + \sum_{g \in \text{FavGenres}} W_{\text{genre}} \cdot \mathbf{G}_g$$

### 3.5. Bayesian Prior Rating Smoothing (IMDb Consensus)
To prevent small-sample rating bias from distorting recommendations:
$$WR = \left(\frac{v}{v + m}\right) R + \left(\frac{m}{v + m}\right) C$$
Where $R$ is average movie rating, $v$ is vote volume, $m$ is minimum vote threshold ($25$), and $C$ is global catalog mean ($8.2$).

### 3.6. Dimensionality Reduction (PCA)
Projection of 500-dimensional TF-IDF sparse matrix $\mathbf{X}$ into 2 orthogonal eigenvectors $\mathbf{w}_1, \mathbf{w}_2$ maximizing variance:
$$\mathbf{z} = \mathbf{X} \mathbf{W}_{2}$$

---

## 4. Course Handout (CHO) Syllabus Mapping

### Table 1: AI & Machine Learning Syllabus (Lectures 1–30)
| Lecture # | Syllabus Topic Description | CinePulse Implementation & Source File |
| :--- | :--- | :--- |
| **Lect 1–3** | Introduction to AI, Evolution, Milestones, AI vs Human Intelligence | Cinematic AI recommendation agent overview in `README.md`, `src/pages/HomePage.jsx`. |
| **Lect 4–6** | AI Approaches, Intelligent Agents, PEAS Representation, Generative AI vs AI Agents | Recommendation Agent modeled with PEAS (Performance: Precision@K; Environment: Movie catalog; Actuators: Ranked carousel; Sensors: User clicks & ratings). |
| **Lect 7–9** | ML Development Workflow, Types of ML, Python, NumPy, Pandas, Scikit-Learn | Complete Python pipeline in `ml_pipeline/train_recommender.py` and notebook `ml_pipeline/movie_recommendation_knn.ipynb`. |
| **Lect 10–12** | Data Preprocessing & Feature Engineering: Cleaning, Missing Values, TF-IDF, Scaling | Multi-field text soup tokenization and `TfidfVectorizer(max_features=500)` in `ml_pipeline/train_recommender.py` and `server/utils/knnRecommender.js`. |
| **Lect 13–15** | Supervised Learning — Regression: Linear & Ridge Regression, MAE, MSE, RMSE, R² Score | Supervised rating prediction model in `ml_pipeline/train_recommender.py` achieving RMSE $0.6789$ and MAE $0.5781$. |
| **Lect 16–18** | Supervised Learning — Classification & **K-Nearest Neighbour (KNN)** | Content-Based KNN engine using `NearestNeighbors(n_neighbors=K, metric='cosine')` in `server/utils/knnRecommender.js` and `src/utils/recommendationEngine.js`. |
| **Lect 19–21** | Model Evaluation & Validation: Train-Test Split, Precision@K, Recall@K, Confusion Matrix | Top-K recommendation ranking evaluation achieving **99.1% Average Precision@K** in `ml_pipeline/train_recommender.py`. |
| **Lect 22–24** | Unsupervised Learning — Clustering: K-Means, Silhouette Score | K-Means clustering into 5 latent thematic clusters with Silhouette Score validation in `ml_pipeline/train_recommender.py`. |
| **Lect 25–27** | Association Rules & Recommendation Systems, Dimensionality Reduction (PCA) | Content-Based Recommendation Architecture, PCA 2D embedding projection (`PCA(n_components=2)`) in `ml_pipeline/train_recommender.py`. |
| **Lect 28–30** | Reinforcement Learning & Emerging Trends: Agent, Environment, Feedback Reward Loop | Interactive real-time preference feedback loop: user 5-star ratings instantly recalculate preference vectors and re-rank feed. |

---

### Table 2: Back End Engineering-II Syllabus (24CSE0315 — Chitkara University)
| S. No. | Syllabus Topic Description | CinePulse Implementation & Source File |
| :--- | :--- | :--- |
| **S. No. 1** | Web Fundamentals: HTML, CSS, JavaScript, DOM, ES6, Async/Await, Fetch API, NPM, Modules | Asynchronous REST communication via `src/services/api.js`, ES Modules in `package.json` (`"type": "module"`). |
| **S. No. 2** | Node.js Core Modules: Setup, Event Loop, ES Modules, Path, FS, HTTP, Error Handling, NPM Packages | Node.js 24 execution, `fs` and `path` module utilization in `server/server.js`, `server/config/logger.js`. |
| **S. No. 3** | Frontend & Node.js Project Debugging: Advanced JS, Tailwind CSS, Reusable UI, ESLint, Structured Logging | Tailwind cinematic design system in `tailwind.config.js`, Winston console/file logging in `server/config/logger.js`. |
| **S. No. 4** | Express.js & REST APIs: Middleware, Routing, Query Params, Status Codes, Error Middleware, JWT, Bcrypt, Multer, Postman | Express REST routes in `server/routes/`, JWT auth in `server/middleware/authMiddleware.js`, Bcrypt in `User.js`, Multer upload in `uploadRoutes.js`, Postman collection in `server/postman/cinepulse_api.json`. |
| **S. No. 5** | MongoDB & Mongoose: Atlas/Local Setup, CRUD, Schemas, Models, Indexes, Compound Indexes, Hooks, Referencing | Mongoose schemas in `server/models/` (`User.js`, `Movie.js`, `Rating.js`, `Watchlist.js`), compound unique indexes, text search index, auto-seeder in `server/utils/seeder.js`. |
| **S. No. 6** | React Fundamentals: Components, Props, State, Hooks, useContext, React Router, Tailwind | Functional components, React Router DOM 6 in `src/App.jsx`, Context API in `src/context/`, Tailwind responsive styling. |
| **S. No. 7** | Full Stack Integration: Connecting React with Express APIs, CORS, Proxy, JWT Storage, Loading/Error States, Search/Filter | Reverse proxy in `vite.config.js`, Bearer token management in `src/services/api.js`, live search & filter in `src/pages/DiscoverPage.jsx`. |
| **S. No. 8** | Advanced Backend & DevOps: Structured Logging (Winston/Morgan), Caching Strategies, Dockerfile, Docker Compose | Structured logging in `server/config/logger.js`, in-memory vector cache in `knnRecommender.js`, Dockerfile in `server/Dockerfile`, multi-container deployment in `docker-compose.yml`. |
